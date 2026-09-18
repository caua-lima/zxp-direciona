/**
 * Wrapper fino sobre a REST API do Supabase (PostgREST) — sem SDK, de
 * propósito (ver comentário em route.ts). Centraliza URL, chave e timeout
 * pra não repetir isso em cada chamada.
 */

export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigurado = Boolean(
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY,
);

const TIMEOUT_PADRAO_MS = 8000;

/**
 * `path` é relativo, ex: "/rest/v1/leads". Erros de rede e timeout viram
 * exceção (o chamador decide o que fazer); respostas HTTP de erro (4xx/5xx)
 * voltam normalmente pra o chamador inspecionar o status.
 */
export async function supabaseFetch(
  path: string,
  init: RequestInit & { preferir?: string } = {},
  timeoutMs = TIMEOUT_PADRAO_MS,
): Promise<Response> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase não configurado (SUPABASE_URL/SERVICE_ROLE_KEY ausentes).");
  }

  const { preferir, headers, ...resto } = init;

  return fetch(`${SUPABASE_URL}${path}`, {
    ...resto,
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(preferir ? { Prefer: preferir } : {}),
      ...headers,
    },
  });
}
