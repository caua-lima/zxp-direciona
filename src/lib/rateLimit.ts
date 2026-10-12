import { supabaseFetch, supabaseConfigurado } from "./supabase";

/**
 * Limite de envios por pessoa (IP pseudonimizado), persistido no Supabase —
 * sem Map em memória (não sobrevive a várias instâncias serverless) e sem
 * serviço novo (Redis/KV), desproporcional pro volume desta página.
 *
 * COMO DECIDE
 * Uma chamada só, à função `registrar_tentativa` do banco (migração 0005),
 * que conta e registra dentro da mesma transação, com trava por bucket. Não
 * existe mais o intervalo entre "contar" e "registrar" em que várias
 * requisições simultâneas liam o mesmo total e todas passavam. A resposta é
 * AGUARDADA: nada fica numa promessa solta que a função serverless pode
 * encerrar antes de concluir.
 *
 * QUANDO O LIMITADOR FALHA — decisão explícita: FALHA ABERTO.
 * Banco fora do ar, tempo esgotado ou resposta que não dá pra interpretar →
 * a pessoa passa, e o motivo fica no log por categoria. Derrubar o cadastro
 * de um visitante legítimo porque o contador quebrou é pior do que deixar
 * passar algumas tentativas a mais durante uma falha. Por isso este limite
 * não deve ser a única defesa: combine com a proteção de borda da hospedagem
 * (firewall/bot protection da Vercel) — ver docs/CONFIGURACAO-E-LANCAMENTO.md.
 *
 * Enquanto a migração 0005 não estiver aplicada, cai no caminho antigo
 * (contar e depois registrar): não é atômico, mas agora confere o status
 * HTTP e aguarda o registro.
 */

const JANELA_SEGUNDOS = 10 * 60;
const LIMITE_POR_JANELA = 5;

export type Limite = {
  permitido: boolean;
  retryAfterSegundos: number;
  /** Por onde a decisão saiu — útil em log e teste, nunca vai pro visitante. */
  via: "atomico" | "legado" | "aberto" | "sem-banco";
};

const ABERTO: Limite = { permitido: true, retryAfterSegundos: 0, via: "aberto" };

/**
 * IP pseudonimizado + data. Pseudonimizado NÃO é anônimo: com o pepper e o
 * IP dá pra refazer o hash. Sem `RATE_LIMIT_PEPPER` o hash sai mais fraco
 * (o `check:launch` avisa) — defina um valor longo e aleatório em produção.
 */
async function bucketDoIp(ip: string): Promise<string> {
  const dataUTC = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  // Lido no uso (não na importação), como o resto da configuração.
  const pepper = process.env.RATE_LIMIT_PEPPER ?? "";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${pepper}:${ip}:${dataUTC}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/**
 * IP de quem chamou, a partir de um cabeçalho posto pelo PROXY da
 * hospedagem — nunca de um valor que o visitante controla por inteiro.
 *
 * Na Vercel, `x-vercel-forwarded-for` e `x-real-ip` são escritos pela borda.
 * `x-forwarded-for` fica por último e só vale o primeiro item, que na Vercel
 * também é sobrescrito pela borda; atrás de outro proxy, confira antes de
 * confiar. Sem cabeçalho nenhum (dev local), tudo cai num bucket único
 * "sem-ip": não quebra, só não separa por pessoa nesse ambiente.
 */
export function ipDaRequisicao(request: Request): string {
  for (const cabecalho of ["x-vercel-forwarded-for", "x-real-ip", "x-forwarded-for"]) {
    const valor = request.headers.get(cabecalho)?.split(",")[0]?.trim();
    if (valor) return valor.slice(0, 64);
  }
  return "sem-ip";
}

function falhou(categoria: string): Limite {
  // Só a categoria: nem IP, nem bucket, nem corpo de erro do banco.
  console.warn(`[rate-limit] indisponível (${categoria}) — deixando passar.`);
  return ABERTO;
}

async function caminhoAtomico(bucket: string): Promise<Limite | "sem-funcao"> {
  const resposta = await supabaseFetch(
    "/rest/v1/rpc/registrar_tentativa",
    {
      method: "POST",
      body: JSON.stringify({
        p_bucket: bucket,
        p_janela_segundos: JANELA_SEGUNDOS,
        p_limite: LIMITE_POR_JANELA,
      }),
    },
    4000,
  );

  // 404 = a função não existe (migração 0005 ainda não aplicada).
  if (resposta.status === 404) return "sem-funcao";
  if (!resposta.ok) return falhou(`rpc HTTP ${resposta.status}`);

  const corpo = (await resposta.json().catch(() => null)) as unknown;
  const linha = (Array.isArray(corpo) ? corpo[0] : corpo) as
    | { permitido?: unknown; aguardar_segundos?: unknown }
    | null;

  if (!linha || typeof linha.permitido !== "boolean") return falhou("rpc resposta inesperada");

  if (linha.permitido) return { permitido: true, retryAfterSegundos: 0, via: "atomico" };

  const aguardar = Number(linha.aguardar_segundos);
  return {
    permitido: false,
    retryAfterSegundos:
      Number.isFinite(aguardar) && aguardar > 0
        ? Math.min(Math.ceil(aguardar), JANELA_SEGUNDOS)
        : JANELA_SEGUNDOS,
    via: "atomico",
  };
}

/** Caminho antigo: conta, depois registra. Só enquanto a 0005 não rodar. */
async function caminhoLegado(bucket: string): Promise<Limite> {
  const desde = new Date(Date.now() - JANELA_SEGUNDOS * 1000).toISOString();

  const contagem = await supabaseFetch(
    `/rest/v1/rate_limit_hits?bucket=eq.${encodeURIComponent(bucket)}&ocorrido_em=gte.${encodeURIComponent(desde)}&select=bucket`,
    { method: "HEAD", preferir: "count=exact" },
    4000,
  );

  // Antes, um HEAD com erro (sem Content-Range) virava "zero tentativas".
  if (!contagem.ok) return falhou(`contagem HTTP ${contagem.status}`);

  const total = Number(contagem.headers.get("content-range")?.split("/")[1]);
  if (!Number.isFinite(total)) return falhou("contagem sem total");

  if (total >= LIMITE_POR_JANELA) {
    return { permitido: false, retryAfterSegundos: JANELA_SEGUNDOS, via: "legado" };
  }

  // Aguardado de propósito: uma promessa solta pode não terminar antes de a
  // função serverless encerrar, e a tentativa nunca seria contada.
  const registro = await supabaseFetch(
    "/rest/v1/rate_limit_hits",
    { method: "POST", preferir: "return=minimal", body: JSON.stringify({ bucket }) },
    4000,
  );
  if (!registro.ok) return falhou(`registro HTTP ${registro.status}`);

  return { permitido: true, retryAfterSegundos: 0, via: "legado" };
}

export async function verificarLimite(ip: string): Promise<Limite> {
  if (!supabaseConfigurado()) {
    // Sem banco não tem como contar. A rota já responde 503 pro cadastro em
    // si por falta de configuração, então isso não abre brecha real.
    return { permitido: true, retryAfterSegundos: 0, via: "sem-banco" };
  }

  try {
    const bucket = await bucketDoIp(ip);
    const atomico = await caminhoAtomico(bucket);
    if (atomico !== "sem-funcao") return atomico;
    return await caminhoLegado(bucket);
  } catch (erro) {
    // Nome do erro apenas (TimeoutError, TypeError...). A mensagem pode
    // carregar URL com o bucket.
    return falhou(erro instanceof Error ? erro.name : "erro desconhecido");
  }
}
