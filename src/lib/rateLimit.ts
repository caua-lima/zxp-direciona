import { supabaseFetch, supabaseConfigurado } from "./supabase";

/**
 * Rate limit simples usando a tabela `rate_limit_hits` do Supabase — sem Map
 * em memória (não sobrevive a múltiplas instâncias serverless) e sem novo
 * serviço (Redis/KV) só pra isso, que seria infraestrutura desproporcional
 * pro volume dessa LP.
 *
 * Janela deslizante ingênua (conta hits recentes, não é a técnica mais
 * eficiente que existe) — adequada aqui porque o volume é baixo.
 */

const JANELA_MS = 10 * 60 * 1000; // 10 minutos
const LIMITE_POR_JANELA = 5;
const PEPPER = process.env.RATE_LIMIT_PEPPER ?? "";

/** IP pseudonimizado (nunca gravado em texto puro) + data — expira sozinho
 * pela janela de tempo, não precisa de rotina de limpeza dedicada. */
async function bucketDoIp(ip: string): Promise<string> {
  const dataUTC = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const material = `${PEPPER}:${ip}:${dataUTC}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(material),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/** Primeiro IP da cadeia x-forwarded-for (a Vercel injeta isso). Sem esse
 * header (ex: dev local sem proxy), cai num bucket único "sem-ip" — não
 * quebra, só não protege por IP nesse ambiente. */
export function ipDaRequisicao(request: Request): string {
  const encadeado = request.headers.get("x-forwarded-for");
  return encadeado?.split(",")[0]?.trim() || "sem-ip";
}

export async function verificarLimite(
  ip: string,
): Promise<{ permitido: boolean; retryAfterSegundos: number }> {
  if (!supabaseConfigurado) {
    // Sem banco não tem como checar — deixa passar. A rota principal já
    // barra o cadastro em si por falta de configuração (503), então isso
    // não abre brecha real.
    return { permitido: true, retryAfterSegundos: 0 };
  }

  const bucket = await bucketDoIp(ip);
  const desde = new Date(Date.now() - JANELA_MS).toISOString();

  try {
    const resposta = await supabaseFetch(
      `/rest/v1/rate_limit_hits?bucket=eq.${encodeURIComponent(bucket)}&ocorrido_em=gte.${encodeURIComponent(desde)}&select=bucket`,
      { method: "HEAD", preferir: "count=exact" },
      4000,
    );

    const intervalo = resposta.headers.get("content-range"); // ex: "*/3"
    const total = intervalo ? Number(intervalo.split("/")[1]) : 0;

    if (Number.isFinite(total) && total >= LIMITE_POR_JANELA) {
      return { permitido: false, retryAfterSegundos: Math.ceil(JANELA_MS / 1000) };
    }

    // Registra esta tentativa. Fogo-e-esquece: se isso falhar, prefiro
    // deixar a pessoa passar a derrubar um cadastro legítimo por causa do
    // próprio rate limit.
    supabaseFetch(
      "/rest/v1/rate_limit_hits",
      {
        method: "POST",
        preferir: "return=minimal",
        body: JSON.stringify({ bucket }),
      },
      4000,
    ).catch((erro) => console.warn("[rate-limit] falha ao registrar hit:", erro));

    // Limpeza oportunista (~1% das requisições) — sem cron, sem tabela
    // crescendo pra sempre.
    if (Math.random() < 0.01) {
      supabaseFetch(
        `/rest/v1/rate_limit_hits?ocorrido_em=lt.${encodeURIComponent(desde)}`,
        { method: "DELETE", preferir: "return=minimal" },
        4000,
      ).catch(() => {});
    }

    return { permitido: true, retryAfterSegundos: 0 };
  } catch (erro) {
    console.warn("[rate-limit] indisponível, deixando passar:", erro);
    return { permitido: true, retryAfterSegundos: 0 };
  }
}
