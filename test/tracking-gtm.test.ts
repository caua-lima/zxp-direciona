// GTM configurado JUNTO com GA4 e Meta diretos: o GTM tem que ser o único dono.
process.env.NEXT_PUBLIC_GTM_ID = "GTM-TESTE12";
process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID = "G-TESTE1234";
process.env.NEXT_PUBLIC_META_PIXEL_ID = "1234567890";

import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { instalarNavegador, lerDataLayer } from "./helpers/navegador-falso";

const navegador = instalarNavegador();
const providers = await import("@/lib/tracking/providers");
const events = await import("@/lib/tracking/events");
const { janela } = navegador;
after(() => navegador.remover());

const consentimento = (analytics: boolean, marketing: boolean) => ({
  versao: 1,
  analytics,
  marketing,
  em: new Date().toISOString(),
});
const dl = () => lerDataLayer(janela);
const eventos = () =>
  dl().filter((x) => !Array.isArray(x) && (x as { event?: string }).event && (x as { event?: string }).event !== "gtm.js") as Array<Record<string, unknown>>;

describe("GTM como dono único das tags", () => {
  test("sem consentimento: nada carrega e evento é descartado", () => {
    events.track({ nome: "cta_click", posicao: "hero" });
    assert.equal(janela.dataLayer, undefined);
    assert.deepEqual(navegador.scripts, []);
  });

  test("aceitar carrega SÓ o GTM — os IDs diretos de GA4 e Meta são ignorados", () => {
    providers.aplicarConsentimento(consentimento(true, true));
    assert.deepEqual(navegador.scripts, [
      "https://www.googletagmanager.com/gtm.js?id=GTM-TESTE12",
    ]);
    assert.equal(janela.fbq, undefined);
    assert.equal(navegador.scripts.some((s) => s.includes("gtag/js")), false);
  });

  test("consent 'default' negando tudo entra no dataLayer ANTES do contêiner", () => {
    const camadas = dl();
    const iDefault = camadas.findIndex((x) => Array.isArray(x) && x[0] === "consent" && x[1] === "default");
    const iGtmStart = camadas.findIndex((x) => !Array.isArray(x) && (x as { event?: string }).event === "gtm.js");
    assert.ok(iDefault >= 0 && iGtmStart >= 0);
    assert.ok(iDefault < iGtmStart, "o default precisa preceder o gtm.js");
  });

  test("eventos vão pro dataLayer como { event, ...params }", () => {
    events.track({ nome: "cta_click", posicao: "mobile_fixo" });
    events.track({ nome: "whatsapp_click", origem: "falha" });
    const [cta, whats] = eventos().slice(-2);
    assert.deepEqual(cta, { event: "cta_click", cta_position: "mobile_fixo" });
    assert.deepEqual(whats, { event: "whatsapp_click", click_origin: "falha" });
  });

  test("generate_lead leva event_id (pra deduplicar com servidor no futuro) e conta uma vez", () => {
    events.track({ nome: "generate_lead", recibo: "rec-gtm" });
    events.track({ nome: "generate_lead", recibo: "rec-gtm" });
    const leads = eventos().filter((e) => e.event === "generate_lead");
    assert.equal(leads.length, 1);
    assert.deepEqual(leads[0], { event: "generate_lead", event_id: "rec-gtm" });
  });

  test("revogar tudo: consent 'denied' e nenhum evento novo", () => {
    providers.aplicarConsentimento(consentimento(false, false));
    const ultimo = dl().at(-1) as unknown[];
    assert.deepEqual([ultimo[0], ultimo[1]], ["consent", "update"]);
    const antes = dl().length;
    events.track({ nome: "cta_click", posicao: "hero" });
    assert.equal(dl().length, antes);
  });
});
