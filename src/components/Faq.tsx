"use client";

import { useState } from "react";
import { Section } from "./Section";
import { Reveal } from "./Reveal";

const perguntas = [
  {
    pergunta: "Para quem é a RUMO?",
    resposta:
      "Pra jovens de 16 a 25 anos que precisam de direção — na escolha da faculdade, numa virada de carreira ou na decisão do que fazer agora. Vale tanto pra quem não escolheu nada quanto pra quem escolheu e se arrependeu.",
  },
  {
    pergunta: "Para quem não é?",
    resposta:
      "Não é pra quem busca terapia ou acompanhamento clínico, nem pra quem quer receber uma resposta pronta sobre qual profissão seguir. A RUMO é método, acompanhamento e execução — a decisão continua sendo sua.",
  },
  {
    pergunta: "Existe mais de um plano?",
    resposta:
      "Não. Existe só o RUMO Norte — um plano único, com tudo incluído. Nada de versão básica que entrega menos nem de versão premium pra empurrar depois: direção não funciona pela metade.",
  },
  {
    pergunta: "Como funciona o pagamento?",
    resposta:
      "É um investimento único, apresentado na call de diagnóstico de acordo com o seu momento. Não trabalhamos com parcelamento em múltiplas vezes. Nada é cobrado pra participar da call.",
  },
  {
    pergunta: "Quanto tempo dura a mentoria?",
    resposta:
      "O acompanhamento é contínuo, com duas calls por mês e suporte no intervalo. A duração é combinada com você na call de diagnóstico, a partir do que o seu caso exige.",
  },
  {
    pergunta: "O que acontece na call de diagnóstico?",
    resposta:
      "É uma conversa individual pra entender seu momento, apontar o que está travando e avaliar se a RUMO faz sentido pra você. Se não fizer, eu falo isso na hora. Sem compromisso e sem custo.",
  },
  {
    pergunta: "A RUMO garante emprego ou uma renda específica?",
    resposta:
      "Não. A RUMO entrega método, direção e acompanhamento na execução. Não promete emprego, renda, aprovação nem a profissão perfeita — quem faz acontecer é você, com apoio.",
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

                {/* grid 0fr→1fr anima a altura mantendo o texto no DOM (bom pra SEO) */}
                <div
                  id={`faq-painel-${i}`}
                  role="region"
                  aria-labelledby={`faq-botao-${i}`}
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
