import { Section } from "./Section";

const situacoes = [
  "Não sabe qual caminho seguir depois da escola ou da faculdade.",
  "Tem medo de escolher errado e perder tempo.",
  "Sente a pressão da família ou da idade pra decidir logo.",
  "Vê todo mundo avançando enquanto sente que está parado.",
  "Já tentou testes vocacionais e continua sem clareza.",
];

export function ProblemIdentification() {
  return (
    <Section eyebrow="Isso é com você?" title="Talvez você reconheça isso">
      <ul className="flex flex-col gap-4">
        {situacoes.map((situacao) => (
          <li
            key={situacao}
            className="flex items-start gap-3 border-b border-marfim/10 pb-4 text-lg text-marfim/90"
          >
            <span className="mt-1 text-dourado">—</span>
            <span>{situacao}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
