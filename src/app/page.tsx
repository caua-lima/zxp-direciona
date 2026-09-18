import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProcessoContato } from "@/components/ProcessoContato";
import { Authority } from "@/components/Authority";
import { ProblemIdentification } from "@/components/ProblemIdentification";
import { WhatItIs } from "@/components/WhatItIs";
import { MethodApe } from "@/components/MethodApe";
import { Included } from "@/components/Included";
import { CtaBreak } from "@/components/CtaBreak";
import { Faq } from "@/components/Faq";
import { LeadForm } from "@/components/LeadForm";
import { Footer } from "@/components/Footer";
import { StickyMobileCta } from "@/components/StickyMobileCta";
import { TrackingProvider } from "@/components/TrackingProvider";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <a
        href="#formulario"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-lg focus:bg-dourado focus:px-4 focus:py-2 focus:font-semibold focus:text-onyx"
      >
        Pular para o formulário
      </a>

      <Header />

      {/* Ordem pensada pra tráfego frio: o que é e o que acontece ao clicar,
          quem conduz (a oferta depende de confiança pessoal — Authority só
          aparece quando o mentor está preenchido), o problema, o escopo, o
          método, o que inclui, e só então o formulário. */}
      <main className="flex flex-1 flex-col">
        <Hero />
        <ProcessoContato />
        <Authority />
        <ProblemIdentification />
        <WhatItIs />
        <MethodApe />
        <Included />
        <CtaBreak />
        <Faq />
        <LeadForm />
      </main>

      <Footer />
      <StickyMobileCta />
      <TrackingProvider />
    </div>
  );
}
