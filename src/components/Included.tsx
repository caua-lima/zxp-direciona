import { Section } from "./Section";

const itens = [
  "2 calls mensais individuais",
  "Suporte contínuo via WhatsApp",
  "Plano de ação personalizado",
  "Acompanhamento contínuo da execução",
  "Apoio em decisões acadêmicas e profissionais",
  "Call complementar com Terapeuta Sistêmica Quântica",
  "Construção de uma ideia de empreendimento de baixo investimento",
];

export function Included() {
  return (
    <Section eyebrow="O que está incluído" title="O que você leva">
      <ul className="grid gap-3 sm:grid-cols-2">
        {itens.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 rounded-lg border border-marfim/10 bg-marfim/[0.03] p-4 text-marfim/90"
          >
            <span className="mt-0.5 text-dourado">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
