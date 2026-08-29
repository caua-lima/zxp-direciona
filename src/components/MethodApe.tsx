import { Section } from "./Section";
import { Reveal } from "./Reveal";

const passos = [
  {
    numero: "01",
    letra: "A",
    titulo: "Analisar",
    texto: "Mapeamos onde você está, o que pesa e o que já tentou.",
  },
  {
    numero: "02",
    letra: "P",
    titulo: "Pensar",
    texto: "Organizamos as opções reais e o raciocínio por trás de cada uma.",
  },
  {
    numero: "03",
    letra: "E",
    titulo: "Executar",
    texto: "Transformamos direção em plano de ação e acompanhamento.",
  },
];

export function MethodApe() {
  return (
    <Section
      id="metodo"
      eyebrow="Como funciona"
      title="Método APE"
      subtitle="Três etapas que se repetem ao longo do acompanhamento — não é um passo único, é um ciclo."
    >
      <div className="relative">
        {/* Linha que conecta as três etapas no desktop */}
        <div
          aria-hidden="true"
          className="absolute top-14 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-dourado/10 via-dourado/40 to-dourado/10 sm:block"
        />

        <ol className="relative grid gap-5 sm:grid-cols-3">
          {passos.map((passo, i) => (
            <li key={passo.letra}>
              <Reveal delay={i * 110}>
                <div className="group h-full rounded-2xl border border-onyx-line bg-onyx-raised p-6 text-center transition hover:border-dourado/30 sm:pt-8">
                  <span
                    aria-hidden="true"
                    className="font-display mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-dourado/25 bg-onyx text-2xl font-bold text-dourado transition group-hover:border-dourado/60"
                  >
                    {passo.letra}
                  </span>
                  <p className="mt-5 text-[11px] font-semibold tracking-[0.16em] text-marfim/35">
                    {passo.numero}
                  </p>
                  <h3 className="font-display mt-1.5 text-xl font-bold">
                    {passo.titulo}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-marfim/60">
                    {passo.texto}
                  </p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
