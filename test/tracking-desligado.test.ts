// O estado de HOJE: nenhum ID configurado. Tudo tem que ficar desligado.
delete process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
delete process.env.NEXT_PUBLIC_META_PIXEL_ID;
delete process.env.NEXT_PUBLIC_GTM_ID;

import { test, after } from "node:test";
import assert from "node:assert/strict";
import { instalarNavegador } from "./helpers/navegador-falso";

const navegador = instalarNavegador();
const cfg = await import("@/config/tracking");
const providers = await import("@/lib/tracking/providers");
const events = await import("@/lib/tracking/events");
after(() => navegador.remover());

test("sem ID nenhum a medição está desligada e nenhuma categoria aparece", () => {
  assert.equal(cfg.trackingAtivo, false);
  assert.deepEqual(cfg.categoriasRelevantes, { analytics: false, marketing: false });
  assert.deepEqual(cfg.diagnosticoTracking.problemas, []);
});

test("mesmo se alguém 'consentir', sem ID nada é carregado nem enviado", () => {
  providers.aplicarConsentimento({ versao: 1, analytics: true, marketing: true, em: "x" });
  events.track({ nome: "cta_click", posicao: "hero" });
  events.track({ nome: "generate_lead", recibo: "r" });
  assert.equal(navegador.janela.dataLayer, undefined);
  assert.equal(navegador.janela.fbq, undefined);
  assert.deepEqual(navegador.scripts, []);
});
