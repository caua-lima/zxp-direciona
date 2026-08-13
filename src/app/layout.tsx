import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = "https://rumo.zxpsolutions.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "RUMO — Mentoria de Direção Profissional | ZXP Solutions",
  description:
    "RUMO é a mentoria de direção profissional da ZXP Solutions, pra jovens entre 16 e 25 anos que estão travados entre faculdade, carreira e futuro. Agende sua call de diagnóstico gratuita.",
  openGraph: {
    title: "RUMO — Mentoria de Direção Profissional",
    description:
      "Você não precisa ter tudo resolvido. Precisa saber qual é o próximo passo. Agende sua call de diagnóstico gratuita com a RUMO, um braço da ZXP Solutions.",
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-onyx text-marfim">
        {children}
      </body>
    </html>
  );
}
