import { versaoConsentimento } from "@/config/tracking";

/**
 * Escolha de consentimento do visitante. Guardar ESTA escolha no aparelho é
 * o único uso de localStorage do site — sem ela, o banner reapareceria a
 * cada visita e a recusa não seria lembrada.
 *
 * Granular de propósito: medição de visitas e publicidade são escolhas
 * separadas, e nenhuma delas é condição pra o visitante se cadastrar.
 *
 * Exposto como "store externo" (assinar + snapshot) pra o React ler com
 * useSyncExternalStore: o servidor não tem localStorage, e essa é a forma
 * correta de o primeiro render não divergir da hidratação.
 */
export type Consentimento = {
  versao: number;
  analytics: boolean;
  marketing: boolean;
  em: string;
};

const CHAVE = "zxp_consentimento";
const EVENTO_MUDOU = "zxp:consentimento-mudou";

/** Disparado pelo link "Preferências de medição" do rodapé. */
export const EVENTO_ABRIR_PREFERENCIAS = "zxp:abrir-preferencias";

// Espelho em memória: se o localStorage estiver bloqueado (aba anônima,
// política do navegador), a escolha ainda vale pra esta sessão em vez de o
// banner reabrir a cada clique.
//
// Ele NÃO pode encobrir uma escolha mais nova feita em outra aba: quando o
// navegador avisa (evento `storage`), o espelho é substituído pelo valor
// novo antes de qualquer leitura — ver assinarConsentimento.
let memoria: string | null = null;

/** Snapshot bruto (string) — estável entre leituras, como o React exige. "" =
 * ainda não escolheu. */
export function lerBrutoConsentimento(): string {
  if (memoria !== null) return memoria;
  try {
    return window.localStorage.getItem(CHAVE) ?? "";
  } catch {
    return "";
  }
}

export function assinarConsentimento(aoMudar: () => void): () => void {
  // Outra aba mudou (ou apagou) a escolha. O evento `storage` só dispara nas
  // OUTRAS abas, nunca na que gravou — então aqui o valor que chega é sempre
  // mais novo que o espelho desta aba, e passa a valer no lugar dele. Sem
  // isso a aba continuava lendo a escolha antiga e medindo depois de uma
  // recusa feita ao lado.
  const aoMudarEmOutraAba = (evento: Event) => {
    const { key, newValue } = evento as StorageEvent;
    // key === null: o armazenamento inteiro foi limpo.
    if (key !== null && key !== undefined && key !== CHAVE) return;
    memoria = key === CHAVE ? (newValue ?? "") : "";
    aoMudar();
  };

  window.addEventListener(EVENTO_MUDOU, aoMudar);
  window.addEventListener("storage", aoMudarEmOutraAba);
  return () => {
    window.removeEventListener(EVENTO_MUDOU, aoMudar);
    window.removeEventListener("storage", aoMudarEmOutraAba);
  };
}

/** Interpreta o snapshot. Versão antiga ou formato quebrado = "não escolheu". */
export function interpretarConsentimento(bruto: string): Consentimento | null {
  if (!bruto) return null;
  try {
    const c = JSON.parse(bruto) as Partial<Consentimento>;
    if (
      c.versao !== versaoConsentimento ||
      typeof c.analytics !== "boolean" ||
      typeof c.marketing !== "boolean"
    ) {
      // Texto/fornecedores mudaram desde a escolha: ela era sobre outra
      // coisa, pergunta de novo.
      return null;
    }
    return c as Consentimento;
  } catch {
    return null;
  }
}

export function salvarConsentimento(
  analytics: boolean,
  marketing: boolean,
): Consentimento {
  const consentimento: Consentimento = {
    versao: versaoConsentimento,
    analytics,
    marketing,
    em: new Date().toISOString(),
  };
  const bruto = JSON.stringify(consentimento);

  memoria = bruto;
  try {
    window.localStorage.setItem(CHAVE, bruto);
  } catch {
    // Sem persistência entre visitas: vale pra sessão, e tudo bem.
  }

  window.dispatchEvent(new Event(EVENTO_MUDOU));
  return consentimento;
}
