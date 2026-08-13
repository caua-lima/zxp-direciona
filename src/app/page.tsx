import { Hero } from "@/components/Hero";
import { ProblemIdentification } from "@/components/ProblemIdentification";
import { WhatItIs } from "@/components/WhatItIs";
import { MethodApe } from "@/components/MethodApe";
import { Included } from "@/components/Included";
import { Authority } from "@/components/Authority";
import { Faq } from "@/components/Faq";
import { LeadForm } from "@/components/LeadForm";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="flex flex-1 flex-col">
        <Hero />
        <ProblemIdentification />
        <WhatItIs />
        <MethodApe />
        <Included />
        <Authority />
        <Faq />
        <LeadForm />
      </main>
      <Footer />
    </div>
  );
}
