import { Section } from "./Section";
import { Reveal } from "./Reveal";

// As quatro situações são as que o próprio briefing definiu. Antes havia seis
// (duas acrescentadas por mim) e uma frase "marcou duas ou mais" — um critério
// que não existe: ninguém marca nada, e não há diagnóstico por trás dele.
const situacoes = [
  "Você não sabe qual caminho seguir depois da escola ou da faculdade.",
  "Tem medo de escolher errado e perder tempo.",
  "Sente pressão pra decidir logo — da família, dos amigos, da idade.",
  "Vê todo mundo avançando enquanto você sente que está parado.",
];

export function ProblemIdentification() {
  return (
    <Section
      eyebrow="Isso é com você?"
      title="Talvez você se reconheça aqui"
      subtitle="Nenhuma dessas situações quer dizer que você está atrasado. Só que ainda ninguém te mostrou o próximo passo."
      largura="media"
    >
      <ul className="grid gap-x-12 md:grid-cols-2">
        {situacoes.map((situacao, i) => (
          <li key={situacao}>
            <Reveal delay={i * 70}>
              <div className="flex gap-5 border-t border-onyx-line py-7">
                <span
                  aria-hidden="true"
                  className="font-display text-2xl leading-none font-bold text-dourado/70"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-lg leading-relaxed text-marfim/90">{situacao}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
