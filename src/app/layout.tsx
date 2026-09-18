import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
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

// URL que está de fato servindo o site hoje (confirmado por HTTP 200 em
// 17/09/2026). O domínio próprio "direciona.zxpsolutions.com.br" usado antes
// aqui era só um placeholder — nunca chegou a ser registrado/configurado, e
// apontar o canonical pra um domínio que não resolve é pior que não ter
// canonical nenhum. Troque para o domínio definitivo assim que existir.
const siteUrl = "https://rumo-lp.vercel.app";

const descricao =
  "ZXP Direciona é a mentoria de direção profissional da ZXP Solutions, para jovens de 16 a 25 anos travados entre faculdade, carreira e futuro. Agende sua call de diagnóstico gratuita.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ZXP Direciona — Mentoria de Direção Profissional",
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
  robots: { index: true, follow: true },
  openGraph: {
    title: "ZXP Direciona — Mentoria de Direção Profissional",
    description: descricao,
    url: siteUrl,
    siteName: "ZXP Direciona",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZXP Direciona — Mentoria de Direção Profissional",
    description:
      "Você não precisa ter tudo resolvido. Precisa saber qual é o próximo passo.",
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
