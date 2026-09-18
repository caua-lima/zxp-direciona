import { Section } from "./Section";
import { Reveal } from "./Reveal";
import { gruposPublicados, termos } from "@/config/oferta";

export function Included() {
  const grupos = gruposPublicados();

  return (
    <Section
      eyebrow="A mentoria"
      title="O que a mentoria inclui"
      subtitle="É um serviço pago, com investimento único. O valor não fica aqui na página: você conhece na conversa inicial, depois de a gente entender o seu caso."
      largura="ampla"
      faixa
    >
      <div
        className={`grid gap-6 ${
          grupos.length >= 3 ? "lg:grid-cols-3" : "md:grid-cols-2"
        }`}
      >
        {grupos.map((grupo, i) => (
          <Reveal key={grupo.titulo} delay={i * 90}>
            <div className="h-full rounded-2xl border border-onyx-line bg-onyx p-7">
              <h3 className="font-display mb-5 text-lg font-bold text-dourado">
                {grupo.titulo}
              </h3>
              <ul className="flex flex-col gap-4">
                {grupo.itens.map((item) => (
                  <li key={item.titulo} className="flex items-start gap-3 leading-snug">
                    <span aria-hidden="true" className="mt-0.5 text-dourado">
                      ✓
                    </span>
                    <span className="text-marfim/90">{item.titulo}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Só aparece quando existir um fato confirmado — nenhuma duração é
          afirmada por padrão. */}
      {termos.duracaoDaMentoria && (
        <Reveal delay={150}>
          <p className="mt-8 text-marfim/70">
            Duração: <strong className="text-marfim">{termos.duracaoDaMentoria}</strong>.
          </p>
        </Reveal>
      )}
    </Section>
  );
}
