/**
 * Wrapper fino sobre a REST API do Supabase (PostgREST) — sem SDK, de
 * propósito (ver comentário em route.ts). Centraliza URL, chave e timeout
 * pra não repetir isso em cada chamada.
 *
 * A configuração é lida NO MOMENTO DO USO, não na importação: assim uma
 * variável de ambiente que muda (ou um teste que a define) vale na chamada
 * seguinte, sem depender de a ordem de importação dos módulos.
 */

export function supabaseConfigurado(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

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
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !chave) {
    throw new Error("Supabase não configurado (SUPABASE_URL/SERVICE_ROLE_KEY ausentes).");
  }

  const { preferir, headers, ...resto } = init;

  return fetch(`${url}${path}`, {
    ...resto,
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      apikey: chave,
      Authorization: `Bearer ${chave}`,
      "Content-Type": "application/json",
      ...(preferir ? { Prefer: preferir } : {}),
      ...headers,
    },
  });
}

/**
 * Resumo de uma resposta de erro SEGURO pra log: status + `code` + `message`
 * do PostgREST, e nada mais.
 *
 * Por que não o corpo inteiro: o Postgres inclui `details` nos erros de
 * constraint, e ali vem "Failing row contains (...)" ou "Key (...)=(...)" com
 * os valores da linha — nome, telefone, e-mail do lead. Um log de erro que
 * copia o corpo bruto espalha dado pessoal (de adolescentes, aqui) pra um
 * lugar que ninguém pensou em proteger.
 */
export async function resumoDoErro(resposta: Response): Promise<string> {
  let code = "";
  let message = "";
  try {
    const corpo = (await resposta.json()) as { code?: unknown; message?: unknown };
    if (typeof corpo.code === "string") code = corpo.code.slice(0, 40);
    if (typeof corpo.message === "string") message = corpo.message.slice(0, 160);
  } catch {
    // corpo que não é JSON: só o status.
  }
  return [`HTTP ${resposta.status}`, code, message].filter(Boolean).join(" · ");
}
