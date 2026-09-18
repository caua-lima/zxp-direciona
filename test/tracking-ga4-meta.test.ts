// A configuração de IDs é lida na IMPORTAÇÃO de src/config/tracking.ts, então
// o ambiente precisa estar pronto antes dos imports (por isso `await import`).
process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID = "G-TESTE1234";
process.env.NEXT_PUBLIC_META_PIXEL_ID = "1234567890";
delete process.env.NEXT_PUBLIC_GTM_ID;

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { instalarNavegador, lerDataLayer } from "./helpers/navegador-falso";

const navegador = instalarNavegador();
const consent = await import("@/lib/tracking/consent");
const providers = await import("@/lib/tracking/providers");
const events = await import("@/lib/tracking/events");

const { janela } = navegador;
const dl = () => lerDataLayer(janela);
const eventosDoDataLayer = () =>
  dl().filter((x) => Array.isArray(x) && x[0] === "event") as unknown[][];
// A fila do fbq guarda objetos `arguments` (é assim no loader oficial do Meta),
// não arrays — normaliza pra poder comparar.
const fbqFila = (): unknown[][] =>
  ((janela.fbq as { queue: ArrayLike<unknown>[] } | undefined)?.queue ?? []).map((x) =>
    Array.from(x),
  );

before(() => {
  // Nada de terceiro pode existir antes de qualquer escolha.
  assert.equal(janela.dataLayer, undefined);
});
after(() => navegador.remover());

const consentimento = (analytics: boolean, marketing: boolean) => ({
  versao: 1,
  analytics,
  marketing,
  em: new Date().toISOString(),
});

describe("consentimento: a escolha guardada", () => {
  test("sem escolha guardada = ainda não escolheu", () => {
    assert.equal(consent.lerBrutoConsentimento(), "");
    assert.equal(consent.interpretarConsentimento(""), null);
  });

  test("versão antiga do texto é descartada (pergunta de novo)", () => {
    assert.equal(
      consent.interpretarConsentimento(JSON.stringify({ ...consentimento(true, true), versao: 999 })),
      null,
    );
  });

  test("formato quebrado não vira consentimento", () => {
    for (const lixo of ["{", "null", "[]", '{"versao":1}', '{"versao":1,"analytics":"sim","marketing":true}']) {
      assert.equal(consent.interpretarConsentimento(lixo), null, lixo);
    }
  });
});

describe("antes de qualquer consentimento nada acontece", () => {
  test("track() sem consentimento não dispara, não cria dataLayer, não injeta script", () => {
    events.track({ nome: "cta_click", posicao: "hero" });
    events.track({ nome: "generate_lead", recibo: "r-antes" });
    assert.equal(janela.dataLayer, undefined);
    assert.deepEqual(navegador.scripts, []);
  });

  test("recusar tudo também não carrega nada", () => {
    providers.aplicarConsentimento(consentimento(false, false));
    assert.equal(janela.dataLayer, undefined);
    assert.deepEqual(navegador.scripts, []);
    assert.deepEqual(providers.provedoresCarregados(), { ga4: false, meta: false, gtm: false });
  });

  test("com tudo recusado, eventos continuam sendo descartados", () => {
    events.track({ nome: "cta_click", posicao: "hero" });
    assert.equal(janela.dataLayer, undefined);
  });

  test("um evento recusado NÃO fica em fila pra ser reenviado depois", () => {
    providers.aplicarConsentimento(consentimento(true, false));
    assert.equal(
      eventosDoDataLayer().filter((e) => e[1] === "generate_lead").length,
      0,
      "o generate_lead de antes do aceite não pode aparecer agora",
    );
  });
});

describe("aceitou SÓ a medição", () => {
  test("carrega o GA4 (com o ID validado) e NÃO carrega o Meta", () => {
    assert.deepEqual(navegador.scripts, [
      "https://www.googletagmanager.com/gtag/js?id=G-TESTE1234",
    ]);
    assert.deepEqual(providers.provedoresCarregados(), { ga4: true, meta: false, gtm: false });
    assert.equal(janela.fbq, undefined);
  });

  test("Consent Mode: 'default' negando tudo vem ANTES do config; 'update' concede só analytics", () => {
    const seq = dl().filter(Array.isArray) as unknown[][];
    const posicao = (nome: string, sub?: string) =>
      seq.findIndex((x) => x[0] === nome && (sub === undefined || x[1] === sub));

    const iDefault = posicao("consent", "default");
    const iConfig = posicao("config");
    const iUpdate = posicao("consent", "update");
    assert.ok(iDefault >= 0 && iConfig >= 0 && iUpdate >= 0);
    assert.ok(iDefault < iConfig, "default precisa vir antes do config");
    assert.ok(iConfig < iUpdate);

    assert.deepEqual(seq[iDefault][2], {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    assert.deepEqual(seq[iUpdate][2], {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
  });

  test("evento vai pro GA4 só com parâmetros de posição — nenhum dado pessoal", () => {
    events.track({ nome: "cta_click", posicao: "hero" });
    const e = eventosDoDataLayer().at(-1)!;
    assert.deepEqual([e[1], e[2]], ["cta_click", { cta_position: "hero" }]);
  });

  test("lead_form_error leva só os NOMES dos campos", () => {
    events.track({ nome: "lead_form_error", campos: ["idade", "peso"] });
    const e = eventosDoDataLayer().at(-1)!;
    assert.deepEqual(e[2], { error_fields: "idade,peso" });
  });

  test("generate_lead sai sem parâmetros (sem value inventado, sem PII)", () => {
    events.track({ nome: "generate_lead", recibo: "rec-1" });
    const e = eventosDoDataLayer().at(-1)!;
    assert.deepEqual([e[1], e[2]], ["generate_lead", {}]);
  });

  test("o mesmo recibo nunca conta duas vezes (clique duplo, remount, retry)", () => {
    const antes = eventosDoDataLayer().length;
    events.track({ nome: "generate_lead", recibo: "rec-1" });
    events.track({ nome: "generate_lead", recibo: "rec-1" });
    assert.equal(eventosDoDataLayer().length, antes);
  });

  test("recibo diferente é outra conversão", () => {
    const antes = eventosDoDataLayer().filter((e) => e[1] === "generate_lead").length;
    events.track({ nome: "generate_lead", recibo: "rec-2" });
    assert.equal(eventosDoDataLayer().filter((e) => e[1] === "generate_lead").length, antes + 1);
  });

  test("sem consentimento de marketing, o Meta não recebe nada", () => {
    assert.equal(janela.fbq, undefined);
  });
});

describe("aceitou também a publicidade", () => {
  test("carrega o Meta uma vez, na ordem da doc: revoke -> init -> grant -> PageView", () => {
    providers.aplicarConsentimento(consentimento(true, true));
    assert.equal(navegador.scripts.filter((s) => s.includes("fbevents")).length, 1);
    assert.deepEqual(fbqFila().map((x) => x[0] === "consent" ? `consent:${x[1]}` : `${x[0]}:${x[1]}`), [
      "consent:revoke",
      "init:1234567890",
      "consent:grant",
      "track:PageView",
    ]);
  });

  test("aplicar o mesmo consentimento de novo não injeta script duplicado", () => {
    providers.aplicarConsentimento(consentimento(true, true));
    providers.aplicarConsentimento(consentimento(true, true));
    assert.equal(navegador.scripts.filter((s) => s.includes("googletagmanager")).length, 1);
    assert.equal(navegador.scripts.filter((s) => s.includes("fbevents")).length, 1);
  });

  test("generate_lead vira 'Lead' no Meta com eventID = recibo", () => {
    events.track({ nome: "generate_lead", recibo: "rec-3" });
    const lead = fbqFila().find((x) => x[0] === "track" && x[1] === "Lead")!;
    assert.ok(lead, "faltou o evento Lead no Meta");
    assert.deepEqual(lead.slice(2), [{}, { eventID: "rec-3" }]);
  });

  test("outros eventos NÃO vão pro Meta (só a conversão)", () => {
    const antes = fbqFila().length;
    events.track({ nome: "cta_click", posicao: "meio" });
    events.track({ nome: "lead_form_start" });
    assert.equal(fbqFila().length, antes);
  });
});

describe("revogar o consentimento", () => {
  test("manda 'denied' pro Google, liga o ga-disable e revoga o Meta", () => {
    const antesDl = dl().length;
    providers.aplicarConsentimento(consentimento(false, false));

    const novos = dl().slice(antesDl) as unknown[][];
    const update = novos.find((x) => x[0] === "consent" && x[1] === "update")!;
    assert.deepEqual(update[2], {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
    });
    assert.equal(janela["ga-disable-G-TESTE1234"], true);
    assert.deepEqual(fbqFila().at(-1)?.slice(0, 2), ["consent", "revoke"]);
  });

  test("depois de revogar, nenhum evento sai — nem GA4 nem Meta", () => {
    const antesDl = dl().length;
    const antesFbq = fbqFila().length;
    events.track({ nome: "cta_click", posicao: "header" });
    events.track({ nome: "generate_lead", recibo: "rec-depois-de-revogar" });
    assert.equal(dl().length, antesDl);
    assert.equal(fbqFila().length, antesFbq);
  });

  test("aceitar de novo reativa sem recarregar script", () => {
    const scriptsAntes = navegador.scripts.length;
    providers.aplicarConsentimento(consentimento(true, false));
    assert.equal(janela["ga-disable-G-TESTE1234"], false);
    assert.equal(navegador.scripts.length, scriptsAntes);
  });
});

describe("falha de fornecedor nunca chega no site", () => {
  test("gtag quebrado: track() não lança", () => {
    const original = janela.gtag;
    janela.gtag = () => {
      throw new Error("bloqueador de anúncio quebrou o gtag");
    };
    assert.doesNotThrow(() => events.track({ nome: "cta_click", posicao: "hero" }));
    janela.gtag = original;
  });
});
