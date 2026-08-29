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

// Troque pela URL real quando publicar (afeta OG tags e canonical).
const siteUrl = "https://rumo.zxpsolutions.com.br";

const descricao =
  "RUMO é a mentoria de direção profissional da ZXP Solutions, para jovens de 16 a 25 anos travados entre faculdade, carreira e futuro. Agende sua call de diagnóstico gratuita.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RUMO — Mentoria de Direção Profissional | ZXP Solutions",
  description: descricao,
  keywords: [
    "mentoria profissional",
    "orientação de carreira",
    "direção profissional",
    "escolha de carreira",
    "jovens carreira",
    "ZXP Solutions",
    "RUMO",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "RUMO — Mentoria de Direção Profissional",
    description: descricao,
    url: siteUrl,
    siteName: "RUMO",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RUMO — Mentoria de Direção Profissional",
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
