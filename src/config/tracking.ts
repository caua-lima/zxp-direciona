/**
 * Medição e anúncios — TUDO DESLIGADO por padrão. Sem nenhum ID configurado,
 * o site não carrega script de terceiro nenhum, não mostra banner de
 * consentimento e não guarda nada no aparelho do visitante.
 *
 * IDs são públicos (aparecem no HTML de qualquer site que usa GA/Meta), então
 * NEXT_PUBLIC_ é o certo aqui — diferente de chaves de banco. Consequência:
 * o Next embute o valor no bundle NA HORA DO BUILD. Mudar um ID exige novo
 * build/deploy, não basta reiniciar.
 *
 * Como o ID acaba dentro de um script carregado no navegador, o formato é
 * conferido antes de qualquer uso: um valor malformado (ou malicioso) numa
 * variável de ambiente nunca chega a virar URL de script.
 *
 * Dono das tags — um só:
 *   - Se NEXT_PUBLIC_GTM_ID existe, o GTM é o dono. Os IDs diretos de GA4 e
 *     Meta são ignorados (carregar os dois contaria cada evento em dobro).
 *   - Senão, GA4 e/ou Meta Pixel carregam direto.
 * Google Ads: sem tag própria. A conversão de cadastro entra por importação
 * do evento generate_lead do GA4 (ou configurada dentro do GTM) — um único
 * caminho, pra não contar o mesmo cadastro duas vezes.
 */

const FORMATOS = {
  ga4: /^G-[A-Z0-9]{4,20}$/,
  metaPixel: /^\d{5,20}$/,
  gtm: /^GTM-[A-Z0-9]{4,12}$/,
} as const;

const problemas: string[] = [];

function validar(
  bruto: string | undefined,
  formato: RegExp,
  variavel: string,
): string | null {
  const valor = bruto?.trim();
  if (!valor) return null;
  if (!formato.test(valor)) {
    problemas.push(`${variavel} tem formato inválido e foi ignorada.`);
    return null;
  }
  return valor;
}

// process.env.NEXT_PUBLIC_* precisa aparecer por extenso (não via variável
// dinâmica) pra o Next conseguir substituir o valor no bundle.
const gtmId = validar(process.env.NEXT_PUBLIC_GTM_ID, FORMATOS.gtm, "NEXT_PUBLIC_GTM_ID");
const ga4Id = validar(
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID,
  FORMATOS.ga4,
  "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
);
const metaId = validar(
  process.env.NEXT_PUBLIC_META_PIXEL_ID,
  FORMATOS.metaPixel,
  "NEXT_PUBLIC_META_PIXEL_ID",
);

export const tracking = {
  gtm: gtmId,
  // Com GTM configurado, os diretos ficam null de propósito (ver acima).
  ga4: gtmId ? null : ga4Id,
  metaPixel: gtmId ? null : metaId,
};

export const trackingAtivo = Boolean(
  tracking.gtm || tracking.ga4 || tracking.metaPixel,
);

/** Quais escolhas fazem sentido mostrar no banner — só as que existem. */
export const categoriasRelevantes = {
  analytics: Boolean(tracking.gtm || tracking.ga4),
  marketing: Boolean(tracking.gtm || tracking.metaPixel),
};

/**
 * Suba este número quando mudar o texto do banner ou passar a usar um
 * fornecedor novo: quem já escolheu antes é perguntado de novo, porque a
 * escolha antiga era sobre outra coisa.
 */
export const versaoConsentimento = 1;

/** Só pro `npm run check:launch` — não é usado pelo site. */
export const diagnosticoTracking = {
  problemas,
  configurado: { gtm: gtmId, ga4: ga4Id, metaPixel: metaId },
  conflitoGtmComDiretos: Boolean(gtmId && (ga4Id || metaId)),
};
