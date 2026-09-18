import { Section } from "./Section";
import { Reveal } from "./Reveal";
import { termos } from "@/config/oferta";

const passos = [
  {
    titulo: "Você envia seu contato",
    texto: "Um formulário curto, com o seu WhatsApp e a sua faixa de idade.",
  },
  {
    titulo: "A gente combina o horário",
    texto: "Entramos em contato pelo WhatsApp para marcar a conversa.",
  },
  {
    titulo: "Conversa individual",
    texto:
      "Você conta o seu momento e a gente avalia junto se a mentoria faz sentido. Sem compromisso e sem custo.",
  },
];

export function ProcessoContato() {
  return (
    <Section
      id="como-funciona"
      eyebrow="O primeiro passo"
      title="Como funciona a conversa inicial"
      largura="ampla"
      faixa
    >
      <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
        {/* Linha que liga os três passos no desktop */}
        <div
          aria-hidden="true"
          className="absolute top-6 right-[16%] left-[16%] hidden h-px bg-gradient-to-r from-dourado/10 via-dourado/40 to-dourado/10 md:block"
        />

        {passos.map((passo, i) => (
          <li key={passo.titulo} className="relative">
            <Reveal delay={i * 110}>
              <div className="flex gap-5 md:flex-col md:items-center md:gap-0 md:text-center">
                <span
                  aria-hidden="true"
                  className="font-display relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dourado/40 bg-onyx text-lg font-bold text-dourado"
                >
                  {i + 1}
                </span>
                <div className="md:mt-6">
                  <h3 className="font-display text-xl font-bold">{passo.titulo}</h3>
                  <p className="mt-2 leading-relaxed text-marfim/70 md:mx-auto md:max-w-xs">
                    {passo.texto}
                  </p>
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ol>

      <Reveal delay={150}>
        <p className="mx-auto mt-12 max-w-2xl border-t border-onyx-line pt-8 text-center leading-relaxed text-marfim/70">
          A conversa inicial é <strong className="text-marfim">gratuita</strong>.
          A mentoria é um serviço pago: o investimento é apresentado nessa
          conversa, depois de entendermos o seu caso
          {termos.prazoDeRetorno ? `. Retornamos ${termos.prazoDeRetorno}` : ""}.
        </p>
      </Reveal>
    </Section>
  );
}
