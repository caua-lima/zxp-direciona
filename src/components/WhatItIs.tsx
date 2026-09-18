import { Section } from "./Section";
import { Reveal } from "./Reveal";

// As quatro do briefing. "Não promete emprego nem renda" saiu daqui: já mora
// no FAQ, e dizer a mesma coisa em três lugares só engorda a página.
const naoE = [
  "Terapia.",
  "Um teste vocacional isolado.",
  "Um curso gravado.",
  "Alguém que escolhe a profissão por você.",
];

const e = [
  "Um processo individual de direção.",
  "Análise, reflexão e execução, acompanhadas.",
  "Acompanhamento contínuo, não um evento único.",
  "Construído a partir da sua realidade.",
];

export function WhatItIs() {
  return (
    <Section
      eyebrow="Alinhando expectativas"
      title="O que a mentoria é, e o que não é"
      largura="media"
    >
      <Reveal>
        {/* Um bloco só, dividido em duas colunas — em vez de dois cartões
            idênticos lado a lado. */}
        <div className="grid overflow-hidden rounded-2xl border border-onyx-line md:grid-cols-2">
          <div className="bg-onyx-raised p-7 sm:p-9">
            <h3 className="mb-6 text-xs font-semibold tracking-[0.16em] text-marfim/60 uppercase">
              Não é
            </h3>
            <ul className="flex flex-col gap-4">
              {naoE.map((item) => (
                <li key={item} className="flex items-start gap-3 text-marfim/70">
                  <span aria-hidden="true" className="mt-0.5 text-marfim/40">
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-dourado/25 bg-dourado/[0.05] p-7 sm:p-9 md:border-t-0 md:border-l">
            <h3 className="mb-6 text-xs font-semibold tracking-[0.16em] text-dourado uppercase">
              É
            </h3>
            <ul className="flex flex-col gap-4">
              {e.map((item) => (
                <li key={item} className="flex items-start gap-3 text-marfim">
                  <span aria-hidden="true" className="mt-0.5 text-dourado">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
