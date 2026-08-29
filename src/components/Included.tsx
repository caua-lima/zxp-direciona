import { Section } from "./Section";
import { Reveal } from "./Reveal";

const itens = [
  {
    titulo: "2 calls mensais individuais",
    texto: "Encontros 1:1 pra revisar direção e destravar o que travou.",
  },
  {
    titulo: "Suporte via WhatsApp",
    texto: "Canal direto entre as calls, pra dúvida que não pode esperar.",
  },
  {
    titulo: "Plano de ação personalizado",
    texto: "O próximo passo escrito, com prazo e critério de pronto.",
  },
  {
    titulo: "Acompanhamento contínuo",
    texto: "Cobrança amiga da execução — o plano não morre no papel.",
  },
  {
    titulo: "Apoio em decisões",
    texto: "Escolhas acadêmicas e profissionais discutidas antes de decidir.",
  },
  {
    titulo: "Call com Terapeuta Sistêmica Quântica",
    texto: "Uma sessão complementar, incluída no acompanhamento.",
  },
  {
    titulo: "Ideia de empreendimento",
    texto: "Construção de um negócio de baixo investimento, do zero.",
  },
];

export function Included() {
  return (
    <Section
      eyebrow="O que está incluído"
      title="O que você leva"
      subtitle="Tudo isso faz parte do acompanhamento — não são módulos vendidos à parte."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {itens.map((item, i) => (
          <Reveal key={item.titulo} delay={i * 50}>
            <div className="flex h-full items-start gap-3.5 rounded-xl border border-onyx-line bg-onyx-raised p-5 transition hover:border-dourado/25">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dourado/15 text-sm text-dourado"
              >
                ✓
              </span>
              <div>
                <p className="font-semibold text-marfim">{item.titulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-marfim/55">
                  {item.texto}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
