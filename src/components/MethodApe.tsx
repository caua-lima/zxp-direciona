import { Section } from "./Section";

const passos = [
  {
    letra: "A",
    titulo: "Analisar",
    texto: "Mapeamos onde você está, o que pesa e o que já tentou.",
  },
  {
    letra: "P",
    titulo: "Pensar",
    texto: "Organizamos as opções reais e o raciocínio por trás de cada uma.",
  },
  {
    letra: "E",
    titulo: "Executar",
    texto: "Transformamos direção em plano de ação e acompanhamento.",
  },
];

export function MethodApe() {
  return (
    <Section eyebrow="Como funciona" title="Método APE">
      <div className="grid gap-6 sm:grid-cols-3">
        {passos.map((passo) => (
          <div
            key={passo.letra}
            className="rounded-xl border border-marfim/10 bg-marfim/[0.03] p-6"
          >
            <span className="font-display block text-3xl font-bold text-dourado">
              {passo.letra}
            </span>
            <h3 className="font-display mt-3 text-lg font-bold">
              {passo.titulo}
            </h3>
            <p className="mt-2 text-sm text-marfim/70">{passo.texto}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
