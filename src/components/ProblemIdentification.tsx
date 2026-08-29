import { Section } from "./Section";
import { Reveal } from "./Reveal";

const situacoes = [
  "Não sabe qual caminho seguir depois da escola ou da faculdade.",
  "Tem medo de escolher errado e perder tempo.",
  "Sente a pressão da família ou da idade pra decidir logo.",
  "Vê todo mundo avançando enquanto você sente que está parado.",
  "Já fez teste vocacional e continua sem clareza nenhuma.",
  "Sabe que precisa agir, mas não sabe por onde começar.",
];

export function ProblemIdentification() {
  return (
    <Section
      eyebrow="Isso é com você?"
      title="Talvez você reconheça alguma dessas"
      subtitle="Nenhuma delas significa que você está atrasado. Significa que ninguém te mostrou o próximo passo."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {situacoes.map((situacao, i) => (
          <Reveal key={situacao} delay={i * 60}>
            <div className="group h-full rounded-xl border border-onyx-line bg-onyx-raised p-5 transition hover:border-dourado/30">
              <p className="text-marfim/85 transition group-hover:text-marfim">
                {situacao}
              </p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <p className="mt-8 border-l-2 border-dourado pl-5 text-lg text-marfim/70">
          Se você marcou duas ou mais, a conversa faz sentido pra você.
        </p>
      </Reveal>
    </Section>
  );
}
