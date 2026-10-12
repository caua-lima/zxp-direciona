"use client";

import { useState } from "react";
import { Section } from "./Section";

/**
 * Objeções que sobram depois do formulário. O que NÃO entra aqui, por
 * decisão do dono: método, frequência, suporte, entregas, duração, forma de
 * pagamento, prazo de resposta e qualquer frase que pressuponha histórico
 * ("a maioria das pessoas...").
 */
const perguntas = [
  {
    pergunta: "Quem vai falar comigo?",
    resposta:
      "Você vai falar diretamente comigo, Cauã Lima. Sou eu quem conduz a conversa inicial da ZXP Direciona.",
  },
  {
    pergunta: "A conversa inicial é gratuita?",
    resposta:
      "Sim. A conversa inicial é gratuita e sem compromisso de contratação. A mentoria é paga; a proposta e as condições são apresentadas na call.",
  },
  {
    pergunta: "O que vamos conversar?",
    resposta:
      "Sobre o seu momento e a decisão que você está tentando tomar. Na call, explico a proposta da mentoria e avaliamos se ela faz sentido para você.",
  },
  {
    pergunta: "Preciso já saber qual caminho quero seguir?",
    resposta:
      "Não. Você pode contar as opções que considera ou explicar por que ainda não sabe por onde começar.",
  },
  {
    pergunta: "Para quem é?",
    resposta:
      "A ZXP Direciona é voltada principalmente a jovens que estão escolhendo ou repensando caminhos acadêmicos e profissionais. Conte seu momento para avaliarmos se a proposta faz sentido para o seu caso.",
  },
  {
    pergunta: "A mentoria garante emprego ou substitui terapia?",
    resposta:
      "Não há garantia de emprego, renda ou de uma escolha perfeita. A proposta é de mentoria profissional e não substitui atendimento psicológico ou clínico.",
  },
  {
    pergunta: "O envio já agenda a conversa?",
    resposta:
      "Não. Depois de enviar seu contexto, você pode me chamar pelo WhatsApp para combinarmos o horário.",
  },
];

export function Faq() {
  const [aberta, setAberta] = useState<number | null>(0);

  return (
    <Section id="duvidas" lateral title="Dúvidas antes de conversar">
      <div className="max-w-3xl border-b border-marfim/15">
        {perguntas.map((item, i) => {
          const isOpen = aberta === i;
          return (
            <div key={item.pergunta} className="border-t border-marfim/15">
              <h3>
                <button
                  type="button"
                  onClick={() => setAberta(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-painel-${i}`}
                  id={`faq-botao-${i}`}
                  className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 py-4 text-left text-lg font-semibold text-marfim"
                >
                  {item.pergunta}
                  <span
                    aria-hidden="true"
                    className={`shrink-0 text-xl leading-none text-dourado transition-transform duration-200 ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
              </h3>
              {/* grid 0fr→1fr anima a altura mantendo o texto no DOM.
                  aria-hidden + inert quando fechado: leitor de tela e busca
                  por teclado não entram numa resposta que não está visível. */}
              <div
                id={`faq-painel-${i}`}
                role="region"
                aria-labelledby={`faq-botao-${i}`}
                aria-hidden={!isOpen}
                inert={!isOpen}
                className="grid transition-[grid-template-rows] duration-200 ease-out"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="overflow-hidden">
                  <p className="max-w-[62ch] pb-5 leading-relaxed text-marfim/80">
                    {item.resposta}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
