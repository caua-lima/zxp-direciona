import { Section } from "./Section";

const naoE = [
  "Não é terapia.",
  "Não é um teste vocacional isolado.",
  "Não é um curso gravado.",
  "Não escolhe a profissão por você.",
];

const e = [
  "É um processo individual de direção.",
  "É análise, reflexão e execução guiadas.",
  "É acompanhamento contínuo, não um evento único.",
  "É construído com base na sua realidade, não numa fórmula pronta.",
];

export function WhatItIs() {
  return (
    <Section eyebrow="Alinhando expectativas" title="O que não é / o que é">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-marfim/10 bg-marfim/[0.03] p-6">
          <p className="mb-4 text-sm font-semibold tracking-wide text-marfim/50 uppercase">
            Não é
          </p>
          <ul className="flex flex-col gap-3">
            {naoE.map((item) => (
              <li key={item} className="text-marfim/80">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-dourado/30 bg-dourado/[0.06] p-6">
          <p className="mb-4 text-sm font-semibold tracking-wide text-dourado uppercase">
            É
          </p>
          <ul className="flex flex-col gap-3">
            {e.map((item) => (
              <li key={item} className="text-marfim">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
