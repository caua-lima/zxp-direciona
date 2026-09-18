/**
 * Supabase e Resend falsos, instalados no lugar do `fetch` global.
 *
 * Não é um mock que devolve o que o teste mandou: é um banco em memória que
 * reproduz as semânticas que a rota REALMENTE usa —
 *   - INSERT com on_conflict + ignore-duplicates: chave repetida devolve [];
 *   - PATCH condicional (notificado_em IS NULL AND lease livre/vencida) que
 *     devolve a linha só pra UMA tentativa — atômico como um UPDATE do
 *     Postgres, já que a função é síncrona entre ler e escrever;
 *   - erros que, como no Postgres de verdade, trazem os DADOS da linha em
 *     `details` — pra o teste poder provar que eles não vazam pro log.
 */

export type Linha = Record<string, unknown> & {
  id: string;
  idempotency_key: string | null;
  notificado_em: string | null;
  notificacao_reivindicada_em: string | null;
};

export type Opcoes = {
  /** INSERT devolve HTTP 400 com PII no `details` (como um erro de constraint). */
  gravacaoRecusada?: boolean;
  /** INSERT falha na rede sem gravar. */
  gravacaoFalhaDeRede?: boolean;
  /** O PRIMEIRO INSERT grava de verdade mas a resposta se perde (a rota vê erro de rede). */
  gravarMasPerderResposta?: boolean;
  /** O GET de conferência (retry) falha. */
  conferenciaIndisponivel?: boolean;
  /** Hits já registrados no bucket de rate limit. */
  hitsIniciais?: number;
  /** A tabela de rate limit não responde (rede). */
  rateLimitCaido?: boolean;
  /** Status HTTP do Resend. */
  resendStatus?: number;
  /** Segura a resposta do Resend até o teste liberar. */
  resendGate?: Promise<void>;
};

export type Servicos = ReturnType<typeof instalarServicos>;

export function instalarServicos(opcoes: Opcoes = {}) {
  const original = globalThis.fetch;
  const banco = new Map<string, Linha>();
  const emails: Array<{ headers: Record<string, string>; corpo: Record<string, unknown> }> = [];
  const insercoes: Array<Record<string, unknown>> = [];
  const chamadas: Array<{ metodo: string; caminho: string }> = [];
  let contadorHits = opcoes.hitsIniciais ?? 0;
  let seq = 0;
  let primeiroInsert = true;

  const logs: string[] = [];
  const consoleOriginal = { error: console.error, warn: console.warn, log: console.log };
  const capturar = (...args: unknown[]) => {
    logs.push(args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" "));
  };
  console.error = capturar;
  console.warn = capturar;
  console.log = capturar;

  const json = (dados: unknown, status = 200, headers: Record<string, string> = {}) =>
    new Response(JSON.stringify(dados), {
      status,
      headers: { "content-type": "application/json", ...headers },
    });
  const erroDeRede = () =>
    Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNRESET" } });

  const porChave = (chave: string) =>
    [...banco.values()].find((l) => l.idempotency_key === chave);
  const porFiltro = (u: URL): Linha | undefined => {
    const id = u.searchParams.get("id");
    const chave = u.searchParams.get("idempotency_key");
    if (id?.startsWith("eq.")) return banco.get(id.slice(3));
    if (chave?.startsWith("eq.")) return porChave(decodeURIComponent(chave.slice(3)));
    return undefined;
  };

  globalThis.fetch = (async (entrada: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof entrada === "string" ? entrada : entrada.toString());
    const metodo = (init.method ?? "GET").toUpperCase();
    const corpo = typeof init.body === "string" ? JSON.parse(init.body) : undefined;

    // ── Resend ──────────────────────────────────────────────────────────
    if (url.host === "api.resend.com") {
      chamadas.push({ metodo, caminho: "resend" });
      if (opcoes.resendGate) await opcoes.resendGate;
      const status = opcoes.resendStatus ?? 200;
      if (status >= 400) {
        // O corpo real do Resend cita campos; o teste garante que não vai pro log.
        return json({ name: "validation_error", message: "Invalid `to` field: dono@exemplo.com" }, status);
      }
      emails.push({
        headers: Object.fromEntries(new Headers(init.headers).entries()),
        corpo,
      });
      return json({ id: `email-${emails.length}` });
    }

    const caminho = url.pathname;
    chamadas.push({ metodo, caminho: caminho + (url.search ? "?…" : "") });

    // ── Rate limit ──────────────────────────────────────────────────────
    if (caminho === "/rest/v1/rate_limit_hits") {
      if (opcoes.rateLimitCaido) throw erroDeRede();
      if (metodo === "HEAD") {
        return new Response(null, { status: 200, headers: { "content-range": `*/${contadorHits}` } });
      }
      if (metodo === "POST") {
        contadorHits++;
        return new Response(null, { status: 201 });
      }
      return new Response(null, { status: 204 }); // DELETE (limpeza)
    }

    // ── Leads ───────────────────────────────────────────────────────────
    if (caminho === "/rest/v1/leads") {
      if (metodo === "POST") {
        if (opcoes.gravacaoFalhaDeRede) throw erroDeRede();
        if (opcoes.gravacaoRecusada) {
          return json(
            {
              code: "23502",
              message: 'null value in column "x" of relation "leads" violates not-null constraint',
              details: `Failing row contains (${corpo.nome}, ${corpo.whatsapp}, ${corpo.email}).`,
            },
            400,
          );
        }

        const chave = (corpo.idempotency_key as string | null) ?? null;
        if (chave !== null && porChave(chave)) return json([]); // ignore-duplicates

        insercoes.push(corpo);
        const linha: Linha = {
          ...corpo,
          id: `lead-${++seq}`,
          idempotency_key: chave,
          notificado_em: null,
          notificacao_reivindicada_em: null,
        };
        banco.set(linha.id, linha);

        if (opcoes.gravarMasPerderResposta && primeiroInsert) {
          primeiroInsert = false;
          throw erroDeRede(); // gravou, mas a rota nunca soube
        }
        primeiroInsert = false;
        return json([{ id: linha.id }], 201);
      }

      if (metodo === "GET") {
        if (opcoes.conferenciaIndisponivel) return json({ message: "erro" }, 500);
        const linha = porFiltro(url);
        return json(linha ? [linha] : []);
      }

      if (metodo === "PATCH") {
        const linha = porFiltro(url);
        const reivindicacao = url.searchParams.get("notificado_em") === "is.null";

        if (reivindicacao) {
          // UPDATE condicional atômico: só devolve a linha se ainda não foi
          // notificada E a lease está livre ou vencida.
          const limite = /\.lt\.(.+)\)$/.exec(url.searchParams.get("or") ?? "")?.[1];
          const leaseLivre =
            linha?.notificacao_reivindicada_em == null ||
            (limite !== undefined && (linha.notificacao_reivindicada_em as string) < limite);
          if (linha && linha.notificado_em === null && leaseLivre) {
            linha.notificacao_reivindicada_em = corpo.notificacao_reivindicada_em;
            return json([linha]);
          }
          return json([]);
        }

        if (linha) Object.assign(linha, corpo);
        return new Response(null, { status: 204 });
      }
    }

    return json({ message: `rota falsa não implementada: ${metodo} ${caminho}` }, 404);
  }) as typeof fetch;

  return {
    banco,
    emails,
    insercoes,
    chamadas,
    logs,
    get hitsRateLimit() {
      return contadorHits;
    },
    restaurar() {
      globalThis.fetch = original;
      console.error = consoleOriginal.error;
      console.warn = consoleOriginal.warn;
      console.log = consoleOriginal.log;
    },
  };
}
