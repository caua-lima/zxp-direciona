import { tracking } from "@/config/tracking";
import type { Consentimento } from "./consent";

/**
 * Carregadores dos fornecedores. Só rodam DEPOIS de o visitante consentir
 * (ver TrackingProvider) — e cada um só carrega se a categoria dele foi
 * aceita. Sintaxe conferida na documentação oficial (Google Consent Mode,
 * instalação do gtag.js, Meta Pixel GDPR) em 18/09/2026.
 *
 * Nada aqui pode quebrar a página: bloqueador de anúncio, script que falha
 * ao carregar ou erro de fornecedor nunca chegam ao formulário nem ao CTA.
 */

type Fn = (...args: unknown[]) => void;

type Fbq = Fn & {
  callMethod?: Fn;
  queue: unknown[];
  push: Fn;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Fn;
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

const carregado = { ga4: false, meta: false, gtm: false };
let consentimentoAtual: Consentimento | null = null;

export function provedoresCarregados() {
  return { ...carregado };
}

export function consentimentoVigente() {
  return consentimentoAtual;
}

function injetarScript(src: string) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

/** gtag() do Google empurra o objeto `arguments`, não um array — é exigência
 * do gtag.js, por isso não dá pra usar parâmetros rest aqui. */
function garantirGtag(): Fn {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  return window.gtag;
}

const NEGADO_TUDO = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
} as const;

function sinaisGoogle(c: Consentimento) {
  return {
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: c.marketing ? "granted" : "denied",
    ad_user_data: c.marketing ? "granted" : "denied",
    ad_personalization: c.marketing ? "granted" : "denied",
  };
}

function marcarDesativadoGa4(id: string, desativado: boolean) {
  // Chave oficial do GA pra parar de coletar sem recarregar a página.
  (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = desativado;
}

function garantirGa4(id: string, c: Consentimento) {
  const gtag = garantirGtag();

  if (!carregado.ga4) {
    // Padrão do Consent Mode: negar tudo ANTES de qualquer config/medição.
    gtag("consent", "default", NEGADO_TUDO);
    gtag("js", new Date());
    gtag("config", id);
    injetarScript(
      `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`,
    );
    carregado.ga4 = true;
  }

  marcarDesativadoGa4(id, false);
  gtag("consent", "update", sinaisGoogle(c));
}

function revogarGa4(id: string) {
  if (!carregado.ga4) return;
  marcarDesativadoGa4(id, true);
  window.gtag?.("consent", "update", NEGADO_TUDO);
}

function garantirGtm(id: string, c: Consentimento) {
  const gtag = garantirGtag();

  if (!carregado.gtm) {
    // Consent default tem que estar no dataLayer antes do contêiner carregar.
    gtag("consent", "default", NEGADO_TUDO);
    window.dataLayer!.push({ "gtm.start": Date.now(), event: "gtm.js" });
    injetarScript(
      `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(id)}`,
    );
    carregado.gtm = true;
  }

  gtag("consent", "update", sinaisGoogle(c));
}

function revogarGtm() {
  if (!carregado.gtm) return;
  window.gtag?.("consent", "update", NEGADO_TUDO);
}

/** Loader oficial do Meta Pixel, reescrito sem o bloco inline minificado. */
function garantirMeta(id: string) {
  if (!carregado.meta) {
    if (!window.fbq) {
      // Dentro da função a referência é à variável JÁ tipada como Fbq (o nome
      // da função em si teria só o tipo () => void).
      const fbq = function () {
        // arguments (não rest) por fidelidade ao loader oficial do Meta.
        // eslint-disable-next-line prefer-rest-params
        const args = arguments as unknown as unknown[];
        if (fbq.callMethod) fbq.callMethod(...args);
        else fbq.queue.push(args);
      } as Fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];
      window.fbq = fbq;
      if (!window._fbq) window._fbq = fbq;
    }

    // Ordem da documentação: revogar ANTES do init, conceder depois.
    window.fbq("consent", "revoke");
    window.fbq("init", id);
    injetarScript("https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("consent", "grant");
    window.fbq("track", "PageView");
    carregado.meta = true;
    return;
  }

  window.fbq?.("consent", "grant");
}

function revogarMeta() {
  if (!carregado.meta) return;
  window.fbq?.("consent", "revoke");
}

/** Aplica a escolha do visitante: carrega o que foi aceito, desliga o que foi
 * recusado/revogado. Idempotente — pode ser chamada de novo a cada mudança. */
export function aplicarConsentimento(c: Consentimento) {
  consentimentoAtual = c;

  try {
    if (tracking.gtm) {
      if (c.analytics || c.marketing) garantirGtm(tracking.gtm, c);
      else revogarGtm();
      return;
    }

    if (tracking.ga4) {
      if (c.analytics) garantirGa4(tracking.ga4, c);
      else revogarGa4(tracking.ga4);
    }

    if (tracking.metaPixel) {
      if (c.marketing) garantirMeta(tracking.metaPixel);
      else revogarMeta();
    }
  } catch (erro) {
    // Fornecedor com problema não pode derrubar a página.
    console.warn("[tracking] falha ao aplicar consentimento:", erro);
  }
}
