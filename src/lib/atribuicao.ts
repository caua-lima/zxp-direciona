/**
 * Origem do visitante (de qual campanha ele veio). Compartilhado entre o
 * cliente, que lê a URL, e o servidor, que NÃO confia no que o cliente manda
 * e limpa de novo antes de gravar.
 *
 * Decisões de privacidade, todas de propósito:
 *  - Allowlist: só as 5 chaves utm_*. Nunca se guarda a query string inteira
 *    (ela pode conter qualquer coisa, inclusive dado pessoal).
 *  - Cada valor: texto, sem caractere de controle, no máximo 100 caracteres.
 *  - Referrer: só o HOST (ex: "l.instagram.com"), nunca o caminho nem a
 *    query — a URL de origem pode carregar o que a página anterior quisesse.
 *  - Nada é guardado no aparelho. Os valores são lidos da URL desta visita
 *    (a query sobrevive a um reload) e viajam junto com o cadastro. Memória
 *    entre visitas (primeira origem) exigiria armazenar algo no navegador,
 *    e isso passaria a depender do consentimento — não está implementado.
 *  - gclid/fbclid (identificadores de clique) não são capturados.
 */

export const CHAVES_UTM = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

export type Atribuicao = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referrer_host: string | null;
};

export const atribuicaoVazia: Atribuicao = {
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  utm_content: null,
  utm_term: null,
  referrer_host: null,
};

const TAMANHO_MAXIMO = 100;

/** Texto curto e limpo, ou null. Sem caractere de controle (nem quebra de linha). */
export function limparTexto(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  // Filtra por código do caractere (em vez de regex com escapes): sem
  // sequências de escape no fonte, nada pra ser mal interpretado por editor,
  // ferramenta ou diff. Descarta 0-31 (controle e quebras de linha) e 127.
  const limpo = Array.from(valor)
    .filter((c) => {
      const codigo = c.charCodeAt(0);
      return codigo > 31 && codigo !== 127;
    })
    .join("")
    .trim();
  if (!limpo) return null;
  return limpo.slice(0, TAMANHO_MAXIMO);
}

function limparHost(valor: unknown): string | null {
  const texto = limparTexto(valor);
  if (!texto) return null;
  // Aparência de hostname mesmo: letras, números, ponto e hífen.
  return /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i.test(texto) ? texto.toLowerCase() : null;
}

/** Aceita qualquer coisa (veio da rede) e devolve só o que é seguro guardar. */
export function sanitizarAtribuicao(entrada: unknown): Atribuicao {
  const e = (entrada && typeof entrada === "object" ? entrada : {}) as Record<
    string,
    unknown
  >;

  return {
    utm_source: limparTexto(e.utm_source),
    utm_medium: limparTexto(e.utm_medium),
    utm_campaign: limparTexto(e.utm_campaign),
    utm_content: limparTexto(e.utm_content),
    utm_term: limparTexto(e.utm_term),
    referrer_host: limparHost(e.referrer_host),
  };
}

/** Lê a origem desta visita. Só roda no navegador. */
export function capturarAtribuicao(): Atribuicao {
  if (typeof window === "undefined") return atribuicaoVazia;

  const params = new URLSearchParams(window.location.search);
  const bruto: Record<string, unknown> = {};
  for (const chave of CHAVES_UTM) bruto[chave] = params.get(chave);

  let referrerHost: string | null = null;
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      // Vir do próprio site não é "origem" nenhuma.
      if (host !== window.location.hostname) referrerHost = host;
    }
  } catch {
    // referrer malformado: ignora.
  }
  bruto.referrer_host = referrerHost;

  return sanitizarAtribuicao(bruto);
}

/** Só as chaves com valor. Cadastro sem origem nenhuma (acesso direto) não
 * manda coluna vazia pro banco. */
export function atribuicaoParaColunas(a: Atribuicao): Partial<Atribuicao> {
  return Object.fromEntries(
    Object.entries(a).filter(([, valor]) => valor !== null),
  ) as Partial<Atribuicao>;
}
