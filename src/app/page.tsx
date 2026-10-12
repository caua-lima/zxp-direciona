import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Momento } from "@/components/Momento";
import { Authority } from "@/components/Authority";
import { ProcessoContato } from "@/components/ProcessoContato";
import { LeadForm } from "@/components/LeadForm";
import { Faq } from "@/components/Faq";
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

      {/* A página responde quatro perguntas, nesta ordem: é pra mim? quem
          conversa comigo? como começa? — e então o formulário. O FAQ vem
          DEPOIS: quem já decidiu não precisa atravessar todas as respostas.

          O que não está aqui de propósito: o método (só na call) e qualquer
          lista de entregas, duração, frequência ou condição comercial. Não
          reponha com bloco equivalente — o teste do HTML gerado barra. */}
      <main className="flex flex-1 flex-col">
        <Hero />
        <Momento />
        <Authority />
        <ProcessoContato />
        <LeadForm />
        <Faq />
      </main>

      <Footer />
      <StickyMobileCta />
      <TrackingProvider />
    </div>
  );
}
