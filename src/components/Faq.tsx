"use client";

import { useState } from "react";
import { Section } from "./Section";
import { Reveal } from "./Reveal";
import { termos } from "@/config/oferta";

// Duração e prazo só são afirmados se existirem em src/config/oferta.ts —
// ninguém confirmou nenhum dos dois, então por padrão a resposta manda pra
// conversa inicial em vez de inventar um número.
const acompanhamento =
  "O acompanhamento inclui duas conversas individuais por mês, com suporte por WhatsApp entre elas.";

const perguntas = [
  {
    pergunta: "Para quem é a ZXP Direciona?",
    resposta:
      "Pra jovens de 16 a 25 anos que precisam de direção — na escolha da faculdade, numa virada de carreira ou na decisão do que fazer agora. Vale tanto pra quem não escolheu nada quanto pra quem escolheu e se arrependeu.",
  },
  {
    pergunta: "A conversa inicial tem algum custo?",
    resposta:
      "Não. A conversa inicial é gratuita e sem compromisso. A mentoria em si é um serviço pago, com investimento único apresentado nessa conversa, depois de entendermos o seu caso. Não trabalhamos com parcelamento em múltiplas vezes.",
  },
  {
    pergunta: "O que acontece na conversa inicial?",
    resposta:
      "É uma conversa individual pra entender o seu momento, apontar o que está travando e avaliar se a ZXP Direciona faz sentido pra você. Se não fizer, a gente diz isso na hora.",
  },
  {
    pergunta: "Quanto tempo dura a mentoria?",
    resposta: termos.duracaoDaMentoria
      ? `A mentoria dura ${termos.duracaoDaMentoria}. ${acompanhamento}`
      : `${acompanhamento} Os detalhes de duração e investimento você conhece na conversa inicial, antes de decidir qualquer coisa.`,
  },
  {
    pergunta: "Para quem não é?",
    resposta:
      "Não é pra quem busca terapia ou acompanhamento clínico, nem pra quem quer receber uma resposta pronta sobre qual profissão seguir. A ZXP Direciona é método, acompanhamento e execução — a decisão continua sendo sua.",
  },
  {
    pergunta: "A ZXP Direciona garante emprego ou uma renda específica?",
    resposta:
      "Não. A ZXP Direciona entrega método, direção e acompanhamento na execução. Não promete emprego, renda, aprovação nem a profissão perfeita — quem faz acontecer é você, com apoio.",
  },
  {
    pergunta: "Preciso já saber o que quero pra participar?",
    resposta:
      "Não. A maior parte das pessoas chega justamente sem saber. Não ter clareza é o ponto de partida do processo, não um pré-requisito pra entrar.",
  },
];

export function Faq() {
  const [aberta, setAberta] = useState<number | null>(0);

  return (
    <Section eyebrow="Perguntas frequentes" title="Antes de você perguntar">
      <div className="flex flex-col gap-3">
        {perguntas.map((item, i) => {
          const isOpen = aberta === i;

          return (
            <Reveal key={item.pergunta} delay={i * 40}>
              <div
                className={`rounded-xl border bg-onyx-raised transition-colors ${
                  isOpen ? "border-dourado/30" : "border-onyx-line"
                }`}
              >
                <h3>
                  <button
                    type="button"
                    onClick={() => setAberta(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-painel-${i}`}
                    id={`faq-botao-${i}`}
                    className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 text-left font-semibold text-marfim"
                  >
                    {item.pergunta}
                    <span
                      aria-hidden="true"
                      className={`shrink-0 text-xl leading-none text-dourado transition-transform duration-300 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                </h3>

                {/* grid 0fr→1fr anima a altura mantendo o texto no DOM (bom pra
                    SEO). aria-hidden quando fechado é o que garante que um
                    leitor de tela não anuncie a resposta antes de ela abrir —
                    overflow:hidden sozinho nem sempre basta pra isso. */}
                <div
                  id={`faq-painel-${i}`}
                  role="region"
                  aria-labelledby={`faq-botao-${i}`}
                  aria-hidden={!isOpen}
                  className="grid transition-all duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 leading-relaxed text-marfim/65">
                      {item.resposta}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
