import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { site } from "@/config/site";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// A URL vem de src/config/site.ts — fonte única, não duplique aqui.
const siteUrl = site.urlPublica;

const descricao =
  "Mais clareza para o seu próximo passo profissional. Converse com Cauã Lima, da ZXP Direciona, sobre faculdade, carreira ou mudança de caminho. A conversa inicial é gratuita.";

// A Vercel injeta VERCEL_ENV automaticamente ("production" | "preview" |
// "development"). Só a produção de verdade é indexável — uma preview de PR
// ou o domínio provisório de um branch não deveriam aparecer no Google.
const emProducao = process.env.VERCEL_ENV === "production";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: site.tituloCompleto,
  description: descricao,
  keywords: [
    "mentoria profissional",
    "orientação de carreira",
    "direção profissional",
    "escolha de carreira",
    "jovens carreira",
    "ZXP Solutions",
    "ZXP Direciona",
  ],
  alternates: { canonical: "/" },
  robots: { index: emProducao, follow: true },
  openGraph: {
    title: site.tituloCompleto,
    description: descricao,
    url: siteUrl,
    siteName: site.nome,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.tituloCompleto,
    description:
      "Mais clareza para o seu próximo passo profissional. Conversa inicial gratuita com Cauã Lima.",
  },
};

export const viewport: Viewport = {
  themeColor: "#10100E",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-onyx text-marfim">
        {children}
      </body>
    </html>
  );
}
