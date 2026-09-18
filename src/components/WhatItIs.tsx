import { Section } from "./Section";
import { Reveal } from "./Reveal";

const naoE = [
  "Não é terapia.",
  "Não é um teste vocacional isolado.",
  "Não é um curso gravado.",
  "Não escolhe a profissão por você.",
  "Não promete emprego nem renda.",
];

const e = [
  "É um processo individual de direção.",
  "É análise, reflexão e execução guiadas.",
  "É acompanhamento contínuo, não um evento único.",
  "É construído a partir da sua realidade.",
  "É você decidindo — com clareza pra isso.",
];

export function WhatItIs() {
  return (
    <Section
      eyebrow="Alinhando expectativas"
      title="O que não é / o que é"
      subtitle="Prefiro deixar claro antes da conversa do que decepcionar depois."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Reveal>
          <div className="h-full rounded-2xl border border-onyx-line bg-onyx-raised p-6 sm:p-7">
            <p className="mb-5 text-xs font-semibold tracking-[0.16em] text-marfim/55 uppercase">
              O que não é
            </p>
            <ul className="flex flex-col gap-3.5">
              {naoE.map((item) => (
                <li key={item} className="flex items-start gap-3 text-marfim/60">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-marfim/[0.07] text-xs text-marfim/40"
                  >
                    ✕
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="card-destaque h-full rounded-2xl p-6 sm:p-7">
            <p className="mb-5 text-xs font-semibold tracking-[0.16em] text-dourado uppercase">
              O que é
            </p>
            <ul className="flex flex-col gap-3.5">
              {e.map((item) => (
                <li key={item} className="flex items-start gap-3 text-marfim">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dourado/15 text-xs text-dourado"
                  >
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
