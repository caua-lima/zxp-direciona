/**
 * Configuração pública central do site — marca, URL, contato comercial e
 * dados de privacidade. Nada aqui é segredo (segredos ficam em variáveis de
 * ambiente sem NEXT_PUBLIC_, nunca neste arquivo): isto é conteúdo de
 * negócio que hoje estava espalhado entre layout.tsx, LeadForm.tsx e a rota
 * da API. Editar aqui é a fonte única — nada mais deveria hardcodar essas
 * strings de novo.
 *
 * Campos que ainda não têm dado real ficam `null` com `preenchido: false`,
 * nunca com um valor inventado ou um placeholder tipo "[Nome aqui]" exposto
 * pro público — `npm run check:launch` aponta o que falta.
 */

export const site = {
  nome: "ZXP Direciona",
  tituloCompleto: "ZXP Direciona — Mentoria de Direção Profissional",
  empresaMae: "ZXP Solutions",

  /**
   * URL que está de fato servindo o site. Enquanto não existir domínio
   * próprio, isto é o domínio da Vercel — real e funcional, só não é a
   * marca final. Trocar aqui já propaga pro canonical/OG (layout.tsx).
   */
  urlPublica: "https://rumo-lp.vercel.app",
};

export type ContatoComercial = {
  /** Dígitos nacionais (formato de src/lib/lead.ts), sem formatação. */
  whatsapp: string | null;
};

/**
 * WhatsApp comercial, mostrado nas telas de sucesso e de falha do formulário
 * como link wa.me. Só dígitos, DDD + número, sem o 55 (o código do país é
 * acrescentado na hora de montar o link). Este número fica público na página.
 */
export const contatoComercial: ContatoComercial = {
  whatsapp: "19989159925",
};

export type DadosPrivacidade = {
  /** Como a empresa se identifica formalmente — razão social, CNPJ, ou como
   * a ZXP Solutions optar por se apresentar numa política de privacidade. */
  controlador: string | null;
  /** Canal pra pedidos de privacidade (e-mail, formulário, o que for real). */
  canalContato: string | null;
};

/**
 * ⚠️ PENDENTE — precisa de decisão sua, não é algo que eu deva inventar
 * (CNPJ, endereço e "conformidade total" não fabricados). Sem isto
 * preenchido, a página de privacidade (ainda não construída) não pode ser
 * publicada de forma verdadeira.
 */
export const dadosPrivacidade: DadosPrivacidade = {
  controlador: null,
  canalContato: null,
};
