import { after } from "next/server";
import {
  normalizarLead,
  validarLead,
  cadastroIdentico,
  type Lead,
  type LinhaLead,
} from "@/lib/lead";
import { supabaseFetch, supabaseConfigurado, resumoDoErro } from "@/lib/supabase";
import { verificarLimite, ipDaRequisicao } from "@/lib/rateLimit";
import { sanitizarAtribuicao, atribuicaoParaColunas } from "@/lib/atribuicao";
import { notificarLead } from "@/lib/notificacao";

/**
 * Recebe o cadastro da LP: valida, grava no Supabase (de forma idempotente)
 * e avisa por e-mail em segundo plano.
 *
 * Sem SDK de propósito. Tanto o Supabase quanto o Resend são um POST HTTP
 * simples, e evitar as duas bibliotecas mantém o projeto em poucas
 * dependências e o cold start da função curto.
 */

export const runtime = "nodejs";
// Nunca cachear: cada POST é único e precisa chegar no banco.
export const dynamic = "force-dynamic";

// Generoso pro maior payload plausível (nome+whatsapp+email+contexto de 400
// chars + folga), mas fecha a porta pra alguém mandar um corpo de megabytes
// só pra gastar CPU/memória da função.
const TAMANHO_MAXIMO_BODY = 20_000; // bytes

/** Nome do erro + código de rede, sem a mensagem (que pode citar dados). */
function descreverErro(erro: unknown): string {
  if (!(erro instanceof Error)) return "erro desconhecido";
  const causa = (erro.cause as { code?: unknown } | undefined)?.code;
  return typeof causa === "string" ? `${erro.name} ${causa}` : erro.name;
}

const SELECT_COMPARAVEL =
  "nome,whatsapp,email,idade,peso,contexto,confirmacao_responsavel";

/**
 * A chave de idempotência já existe no banco. É um retry do mesmo cadastro?
 * "indisponivel" = não deu pra conferir; nesse caso não se afirma sucesso.
 */
async function conferirCadastroExistente(
  lead: Lead,
  chave: string,
): Promise<"identico" | "diferente" | "indisponivel"> {
  try {
    const resposta = await supabaseFetch(
      `/rest/v1/leads?idempotency_key=eq.${encodeURIComponent(chave)}&select=${SELECT_COMPARAVEL}&limit=1`,
      {},
      5000,
    );
    if (!resposta.ok) return "indisponivel";
    const linhas = (await resposta.json()) as LinhaLead[];
    if (linhas.length === 0) return "indisponivel";
    return cadastroIdentico(lead, linhas[0]) ? "identico" : "diferente";
  } catch {
    return "indisponivel";
  }
}

export async function POST(request: Request) {
  // Cabe no log e na resposta de erro: quem reportar um problema cita este
  // código e dá pra achar a linha certa no log, sem nenhum dado pessoal.
  const ref = crypto.randomUUID().slice(0, 8);

  // 1) Content-Type precisa ser JSON de verdade. Isso sozinho já barra o
  // vetor mais simples de POST cross-site: um <form> em outro site só
  // consegue mandar text/plain, x-www-form-urlencoded ou multipart sem
  // disparar preflight — nunca application/json.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return Response.json(
      { erro: "Content-Type precisa ser application/json." },
      { status: 415 },
    );
  }

  // 2) Origin, quando o navegador manda (nem toda requisição manda — curl e
  // chamada server-to-server não mandam, e isso é normal). Se veio e não
  // bate com o host da própria requisição, rejeita. Isto é uma defesa
  // COMPLEMENTAR, não autenticação: um bot fora do navegador forja qualquer
  // header que quiser.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return Response.json({ erro: "Origem não permitida." }, { status: 403 });
      }
    } catch {
      return Response.json({ erro: "Origem inválida." }, { status: 403 });
    }
  }

  // 3) Tamanho do corpo, lido como texto antes de tentar JSON.parse — um
  // Content-Length maior que o limite já rejeita sem nem ler o corpo; sem
  // esse header (alguns clientes omitem), o corte pelo tamanho real do texto
  // lido cobre o caso mesmo assim.
  const tamanhoDeclarado = Number(request.headers.get("content-length") ?? 0);
  if (tamanhoDeclarado > TAMANHO_MAXIMO_BODY) {
    return Response.json({ erro: "Corpo da requisição muito grande." }, { status: 413 });
  }

  const bruto = await request.text();
  if (bruto.length > TAMANHO_MAXIMO_BODY) {
    return Response.json({ erro: "Corpo da requisição muito grande." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(bruto);
  } catch {
    return Response.json({ erro: "Corpo inválido." }, { status: 400 });
  }

  // 4) Rate limit — depois dos checks baratos acima, antes de qualquer
  // trabalho de verdade (honeypot, validação, banco).
  const ip = ipDaRequisicao(request);
  const limite = await verificarLimite(ip);
  if (!limite.permitido) {
    return Response.json(
      { erro: "Muitas tentativas. Espera um pouco e tenta de novo." },
      { status: 429, headers: { "Retry-After": String(limite.retryAfterSegundos) } },
    );
  }

  // JSON.parse aceita `null`, número, array... — só objeto serve daqui pra frente.
  const corpo = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

  // Armadilha anti-bot: campo invisível pra gente, irresistível pra robô.
  // Se veio preenchido, respondemos 200 pra não ensinar o bot a burlar,
  // mas não gravamos nada nem contamos como lead.
  const honeypot = corpo.empresa;
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return Response.json({ ok: true });
  }

  const lead = normalizarLead(body);
  // O cliente manda a origem da campanha, mas o servidor não confia nela:
  // allowlist de chaves, tamanho limitado, sem query string inteira.
  const atribuicao = sanitizarAtribuicao(corpo.atribuicao);
  const erros = validarLead(lead);

  if (Object.keys(erros).length > 0) {
    return Response.json({ erros }, { status: 422 });
  }

  // Chave de idempotência: o cliente gera uma vez por sessão de formulário e
  // reusa em toda tentativa/retry dessa MESMA submissão. Opcional — cliente
  // antigo (bundle em cache) que não manda nada continua funcionando, só
  // sem a proteção de duplicata.
  const idempotencyKey =
    typeof corpo.idempotencyKey === "string" &&
    corpo.idempotencyKey.length > 0 &&
    corpo.idempotencyKey.length <= 100
      ? corpo.idempotencyKey
      : null;

  if (!supabaseConfigurado()) {
    console.error(`[leads ${ref}] Supabase não configurado.`);
    return Response.json(
      { erro: "Cadastro indisponível no momento.", ref },
      { status: 503 },
    );
  }

  // 1) Gravar primeiro. Se isso falhar de verdade, a pessoa PRECISA saber,
  // porque o cadastro se perdeu.
  let leadId: string | null = null;
  let jaExistia = false;

  try {
    // on_conflict é explícito de propósito — o comportamento de upsert do
    // PostgREST depende de saber exatamente qual constraint usar, e isso não
    // é algo pra deixar por conta de inferência automática.
    const resposta = await supabaseFetch("/rest/v1/leads?on_conflict=idempotency_key", {
      method: "POST",
      preferir: "return=representation,resolution=ignore-duplicates",
      body: JSON.stringify({
        nome: lead.nome,
        whatsapp: lead.whatsapp,
        email: lead.email,
        idade: lead.idade,
        peso: lead.peso,
        contexto: lead.contexto || null,
        consentimento_em: new Date().toISOString(),
        confirmacao_responsavel: lead.confirmacaoResponsavel,
        idempotency_key: idempotencyKey,
        ...atribuicaoParaColunas(atribuicao),
      }),
    });

    if (!resposta.ok) {
      // Só status/código/mensagem do PostgREST — o corpo bruto pode trazer os
      // valores da linha (ver resumoDoErro).
      console.error(`[leads ${ref}] Supabase recusou: ${await resumoDoErro(resposta)}`);
      return Response.json(
        { erro: "Não consegui salvar seu cadastro.", ref },
        { status: 502 },
      );
    }

    // `resolution=ignore-duplicates` faz o Postgres tratar um conflito de
    // idempotency_key como no-op em vez de erro — a resposta vem OK mas
    // vazia (nada foi inserido de novo). É assim que distinguimos "gravei
    // agora" de "essa chave já tinha sido gravada antes".
    const linhas = (await resposta.json().catch(() => [])) as Array<{ id: string }>;
    if (linhas.length > 0) {
      leadId = linhas[0].id;
    } else {
      jaExistia = true;
    }
  } catch (erro) {
    console.error(`[leads ${ref}] falha de rede/timeout ao gravar: ${descreverErro(erro)}`);
    // Resultado INCERTO (pode ter gravado e a resposta se perdeu) — não dá
    // pra dizer "não foi salvo" com certeza. O cliente reenvia com a MESMA
    // chave: se já tinha gravado, cai no ramo `jaExistia` abaixo, sem duplicar.
    return Response.json(
      { erro: "Não consegui confirmar seu cadastro — tenta de novo.", ref },
      { status: 502 },
    );
  }

  if (jaExistia) {
    // idempotencyKey é não-nulo aqui: só há conflito quando a chave existe.
    const situacao = await conferirCadastroExistente(lead, idempotencyKey!);

    if (situacao === "diferente") {
      // Mesma chave, dados diferentes (a pessoa corrigiu algo depois de um
      // erro). Nunca se sobrescreve um lead, e também não se finge sucesso:
      // o cliente troca a chave e envia de novo.
      return Response.json({ erro: "chave_reutilizada" }, { status: 409 });
    }
    if (situacao === "indisponivel") {
      return Response.json(
        { erro: "Não consegui confirmar seu cadastro — tenta de novo.", ref },
        { status: 502 },
      );
    }
  }

  // 2) Avisar depois, fora do tempo de resposta — usando `after()` (Next 16),
  // que roda depois de a resposta ser enviada mas antes de a função
  // serverless encerrar (via waitUntil, nativo da Vercel).
  //
  // Roda TAMBÉM no ramo `jaExistia`, de propósito: se a rota perdeu a
  // resposta do banco (lead gravado, 502 pra pessoa) o aviso nunca foi
  // tentado, e o retry é a chance de ele acontecer. Não duplica: a
  // reivindicação em notificarLead() só deixa UMA tentativa enviar, e nada
  // acontece se o lead já foi notificado.
  const filtro = leadId ? { id: leadId } : { chave: idempotencyKey! };
  after(() =>
    notificarLead(filtro).catch((erro) =>
      console.error(`[leads ${ref}] lead salvo, mas o aviso falhou: ${descreverErro(erro)}`),
    ),
  );

  // O recibo só existe neste caminho — gravação nova OU chave que já estava
  // gravada com os MESMOS dados. O descarte do honeypot acima responde ok SEM
  // recibo, e é isso que impede um robô de virar conversão no tracking do
  // cliente. É a própria chave de idempotência devolvida: opaca, sem dado
  // pessoal, e estável entre retries — então o evento de conversão tem sempre
  // o mesmo id, não importa quantas vezes a resposta chegue.
  return Response.json(
    idempotencyKey ? { ok: true, recibo: idempotencyKey } : { ok: true },
  );
}
