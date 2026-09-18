import { Section } from "./Section";
import { Reveal } from "./Reveal";

/**
 * O método é seu (Analisar, Pensar, Executar) e o nome fica. O que é meu, e
 * você deve conferir, é o texto de "atividade" e "você sai com": o único
 * resultado que veio de você é o plano de ação (está na lista de entregas);
 * os outros dois são a leitura mais direta do que cada etapa significa.
 */
const etapas = [
  {
    letra: "A",
    titulo: "Analisar",
    atividade: "Entendemos onde você está, o que pesa e o que você já tentou.",
    saida: "Uma visão clara do seu momento.",
  },
  {
    letra: "P",
    titulo: "Pensar",
    atividade: "Organizamos as opções reais e o raciocínio por trás de cada uma.",
    saida: "Opções comparadas, com critério.",
  },
  {
    letra: "E",
    titulo: "Executar",
    atividade: "Transformamos a direção em passos e acompanhamos a execução.",
    saida: "Um plano de ação personalizado.",
  },
];

export function MethodApe() {
  return (
    <Section
      id="metodo"
      eyebrow="Como o acompanhamento funciona"
      title="Método APE"
      subtitle="Três etapas que se repetem ao longo da mentoria — é um ciclo, não um passo único."
      largura="ampla"
    >
      <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
        {/* Linha que atravessa as três letras no desktop */}
        <div
          aria-hidden="true"
          className="absolute top-8 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-dourado/10 via-dourado/40 to-dourado/10 md:block"
        />

        {etapas.map((etapa, i) => (
          <li key={etapa.letra} className="relative">
            <Reveal delay={i * 110}>
              <div className="flex gap-5 md:flex-col md:gap-0">
                <span
                  aria-hidden="true"
                  className="font-display relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dourado/30 bg-onyx text-2xl font-bold text-dourado"
                >
                  {etapa.letra}
                </span>
                <div className="md:mt-6">
                  <h3 className="font-display text-xl font-bold">{etapa.titulo}</h3>
                  <p className="mt-2 leading-relaxed text-marfim/70">{etapa.atividade}</p>
                  <p className="mt-4 border-l-2 border-dourado/40 pl-4 text-sm text-marfim/80">
                    <span className="block text-xs font-semibold tracking-[0.12em] text-dourado uppercase">
                      Você sai com
                    </span>
                    {etapa.saida}
                  </p>
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
