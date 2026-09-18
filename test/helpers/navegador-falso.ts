/**
 * Um "navegador" mínimo — só o que a camada de consentimento/medição usa:
 * localStorage, eventos de janela, e document.createElement/head.appendChild
 * (pra registrar quais scripts de terceiros foram injetados). Serve pra testar
 * a lógica REAL de src/lib/tracking sem jsdom nem navegador.
 */

type Ouvinte = () => void;

export function instalarNavegador(opcoes: { storageBloqueado?: boolean } = {}) {
  const g = globalThis as Record<string, unknown>;
  const armazenamento = new Map<string, string>();
  const ouvintes = new Map<string, Set<Ouvinte>>();
  const scripts: string[] = [];

  g.window = {
    localStorage: {
      getItem(chave: string) {
        if (opcoes.storageBloqueado) throw new Error("SecurityError");
        return armazenamento.get(chave) ?? null;
      },
      setItem(chave: string, valor: string) {
        if (opcoes.storageBloqueado) throw new Error("SecurityError");
        armazenamento.set(chave, valor);
      },
    },
    addEventListener(tipo: string, fn: Ouvinte) {
      if (!ouvintes.has(tipo)) ouvintes.set(tipo, new Set());
      ouvintes.get(tipo)!.add(fn);
    },
    removeEventListener(tipo: string, fn: Ouvinte) {
      ouvintes.get(tipo)?.delete(fn);
    },
    dispatchEvent(evento: { type: string }) {
      ouvintes.get(evento.type)?.forEach((fn) => fn());
      return true;
    },
  };

  g.document = {
    createElement: () => ({ async: false, src: "" }),
    head: { appendChild: (el: { src: string }) => scripts.push(el.src) },
  };

  return {
    scripts,
    armazenamento,
    janela: g.window as Record<string, unknown>,
    remover() {
      delete g.window;
      delete g.document;
    },
  };
}

/** dataLayer mistura `arguments` do gtag (array-like) e objetos simples do GTM.
 * Normaliza tudo pra facilitar a comparação nos testes. */
export function lerDataLayer(janela: Record<string, unknown>): unknown[] {
  const dl = (janela.dataLayer ?? []) as unknown[];
  return dl.map((item) =>
    item && typeof item === "object" && typeof (item as { length?: unknown }).length === "number"
      ? Array.from(item as ArrayLike<unknown>)
      : item,
  );
}
