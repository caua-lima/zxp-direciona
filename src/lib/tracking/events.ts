import { tracking } from "@/config/tracking";
import { consentimentoVigente, provedoresCarregados } from "./providers";

/**
 * Camada de eventos. Uma função só (`track`) que o resto do site chama —
 * quem decide se o evento sai, e pra onde, é este arquivo.
 *
 * Regras que ele garante:
 *  - Sem consentimento vigente pra categoria, o evento NÃO sai e NÃO fica em
 *    fila: se o visitante aceitar depois, não reenviamos o que ele já tinha
 *    recusado.
 *  - Nenhum dado pessoal sai daqui. Os tipos abaixo simplesmente não têm
 *    campo pra nome, e-mail, telefone, idade, "o que pesa" ou texto livre —
 *    o compilador barra antes de existir a chance.
 *  - generate_lead só existe com um recibo (ver /api/leads) e sai uma vez por
 *    recibo, mesmo que o código chame duas vezes.
 *  - Falha de qualquer fornecedor é engolida: nunca chega no formulário.
 *
 * Nomes: "form_start" e "form_submit" são eventos AUTOMÁTICOS do GA4
 * (Medição otimizada > Interações com formulários). Mandar um "form_start"
 * manual duplicaria a contagem, por isso os nossos se chamam lead_form_*.
 */

export type PosicaoCta = "header" | "hero" | "meio" | "mobile_fixo";
export type OrigemWhatsapp = "sucesso" | "falha";

export const POSICOES_CTA: readonly PosicaoCta[] = [
  "header",
  "hero",
  "meio",
  "mobile_fixo",
];
export const ORIGENS_WHATSAPP: readonly OrigemWhatsapp[] = ["sucesso", "falha"];

export type EventoTracking =
  | { nome: "cta_click"; posicao: PosicaoCta }
  | { nome: "lead_form_start" }
  | { nome: "lead_form_error"; campos: string[] }
  | { nome: "generate_lead"; recibo: string }
  | { nome: "whatsapp_click"; origem: OrigemWhatsapp };

const recibosEnviados = new Set<string>();

function parametros(e: EventoTracking): Record<string, string> {
  switch (e.nome) {
    case "cta_click":
      return { cta_position: e.posicao };
    case "lead_form_error":
      // Só os NOMES dos campos que falharam — nunca o que a pessoa digitou.
      return { error_fields: e.campos.join(",") };
    case "whatsapp_click":
      return { click_origin: e.origem };
    default:
      return {};
  }
}

export function track(evento: EventoTracking): void {
  try {
    if (typeof window === "undefined") return;

    const consentimento = consentimentoVigente();
    if (!consentimento) return;

    if (evento.nome === "generate_lead") {
      if (recibosEnviados.has(evento.recibo)) return;
      // Marca antes de despachar: duas chamadas quase simultâneas não passam
      // as duas pelo check acima.
      recibosEnviados.add(evento.recibo);
    }

    const carregado = provedoresCarregados();
    const params = parametros(evento);

    if (tracking.gtm) {
      if (carregado.gtm && (consentimento.analytics || consentimento.marketing)) {
        window.dataLayer?.push({
          event: evento.nome,
          ...params,
          ...(evento.nome === "generate_lead" ? { event_id: evento.recibo } : {}),
        });
      }
      return;
    }

    if (tracking.ga4 && carregado.ga4 && consentimento.analytics) {
      window.gtag?.("event", evento.nome, params);
    }

    if (
      evento.nome === "generate_lead" &&
      tracking.metaPixel &&
      carregado.meta &&
      consentimento.marketing
    ) {
      window.fbq?.("track", "Lead", {}, { eventID: evento.recibo });
    }
  } catch {
    // Medição nunca derruba o site.
  }
}
