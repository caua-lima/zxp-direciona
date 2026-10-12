import type { NextConfig } from "next";

/**
 * Cabeçalhos de defesa, em todas as respostas.
 *
 * O que está aqui é o conjunto que NÃO consegue quebrar a página: nenhum
 * deles restringe de onde vêm scripts, estilos ou imagens, então hidratação,
 * fontes, next/image e os fornecedores de medição continuam funcionando.
 *
 * O que ficou de fora, de propósito: `script-src`/`style-src` na CSP. O Next
 * injeta scripts inline na hidratação; restringir isso exige nonce por
 * requisição (a página deixaria de ser estática) e teste com GA4/Meta/GTM
 * ligados. É uma mudança pra fazer medindo, não pra impor às cegas — está
 * registrada em docs/CONFIGURACAO-E-LANCAMENTO.md.
 */
const CABECALHOS_DE_DEFESA = [
  // A página não pode ser embutida em iframe de outro site (clickjacking).
  // `frame-ancestors` é o controle atual; X-Frame-Options cobre navegador antigo.
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  // O navegador não "adivinha" o tipo de um arquivo.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Pra outros sites vai só a origem, nunca o caminho nem a query (que pode
  // ter utm_*).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // A página não usa câmera, microfone, localização nem pagamento.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // Não anuncia a tecnologia do servidor.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: CABECALHOS_DE_DEFESA }];
  },
};

export default nextConfig;
