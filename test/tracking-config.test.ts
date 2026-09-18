// Ambiente hostil/errado: IDs malformados numa variável de ambiente NUNCA
// podem virar URL de script.
process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID = 'G-AB"></script><script>alert(1)</script>';
process.env.NEXT_PUBLIC_META_PIXEL_ID = "1234567890";
process.env.NEXT_PUBLIC_GTM_ID = "gtm-minusculo";

import { test } from "node:test";
import assert from "node:assert/strict";

const cfg = await import("@/config/tracking");

test("ID malformado (inclusive tentativa de injeção) é ignorado e reportado", () => {
  assert.equal(cfg.tracking.ga4, null);
  assert.equal(cfg.tracking.gtm, null, "GTM em minúsculas não bate o formato");
  const problemas = cfg.diagnosticoTracking.problemas.join(" | ");
  assert.match(problemas, /NEXT_PUBLIC_GA4_MEASUREMENT_ID/);
  assert.match(problemas, /NEXT_PUBLIC_GTM_ID/);
  // O valor hostil não pode ser repetido em lugar nenhum da configuração:
  assert.ok(!JSON.stringify(cfg).includes("alert(1)"));
});

test("o ID válido continua funcionando ao lado dos inválidos", () => {
  assert.equal(cfg.tracking.metaPixel, "1234567890");
  assert.equal(cfg.trackingAtivo, true);
});

test("só a categoria que existe aparece no banner", () => {
  assert.deepEqual(cfg.categoriasRelevantes, { analytics: false, marketing: true });
});
