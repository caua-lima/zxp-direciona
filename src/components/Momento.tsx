import { Section } from "./Section";
import { Reveal } from "./Reveal";

// Três situações concretas, sem julgamento: nada de "você está parado",
// comparação com quem "já avançou" ou a ideia de que alguém tem a resposta
// da vida de quem lê.
const situacoes = [
  "Escolher uma faculdade ou carreira sem saber por onde começar.",
  "Repensar um caminho que já não combina com o seu momento.",
  "Decidir entre estudar, trabalhar ou começar um projeto.",
];

export function Momento() {
  return (
    <Section
      faixa
      title="Qual decisão está ocupando sua cabeça?"
      subtitle="Você pode estar escolhendo um caminho ou repensando uma escolha. A conversa começa pelo que faz sentido na sua realidade."
    >
      <Reveal>
        <ul className="grid gap-x-10 md:grid-cols-3">
          {situacoes.map((situacao) => (
            <li
              key={situacao}
              className="border-t border-marfim/15 py-6 text-lg leading-relaxed text-marfim/90"
            >
              {situacao}
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
