import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProblemIdentification } from "@/components/ProblemIdentification";
import { WhatItIs } from "@/components/WhatItIs";
import { MethodApe } from "@/components/MethodApe";
import { CtaBreak } from "@/components/CtaBreak";
import { Included } from "@/components/Included";
import { Authority } from "@/components/Authority";
import { Faq } from "@/components/Faq";
import { LeadForm } from "@/components/LeadForm";
import { Footer } from "@/components/Footer";
import { StickyMobileCta } from "@/components/StickyMobileCta";

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

      <main className="flex flex-1 flex-col">
        <Hero />
        <ProblemIdentification />
        <WhatItIs />
        <MethodApe />
        <CtaBreak />
        <Included />
        <Authority />
        <Faq />
        <LeadForm />
      </main>

      <Footer />
      <StickyMobileCta />
    </div>
  );
}
