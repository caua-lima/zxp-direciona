import { Section } from "./Section";

const perguntas = [
  {
    pergunta: "Para quem é a RUMO?",
    resposta:
      "Pra jovens de 16 a 25 anos que sentem que precisam de direção — na escolha da faculdade, na virada de carreira ou na decisão do que fazer agora.",
  },
  {
    pergunta: "Para quem não é?",
    resposta:
      "Não é pra quem busca terapia, diagnóstico clínico, ou uma resposta pronta de qual profissão seguir. A RUMO é acompanhamento e execução, não uma fórmula mágica.",
  },
  {
    pergunta: "Como funciona o pagamento?",
    resposta:
      "É um investimento único, definido na call de diagnóstico de acordo com o seu momento. Não trabalhamos com parcelamento em múltiplas vezes.",
  },
  {
    pergunta: "Quanto tempo dura a mentoria?",
    resposta:
      "O acompanhamento é contínuo, com calls mensais e suporte constante. A duração é definida junto com você na call de diagnóstico.",
  },
  {
    pergunta: "O que acontece na call de diagnóstico?",
    resposta:
      "É uma conversa individual pra entender seu momento, ver se a RUMO faz sentido pra você e explicar como o processo funcionaria no seu caso. Sem compromisso.",
  },
  {
    pergunta: "A RUMO garante emprego ou uma renda específica?",
    resposta:
      "Não. A RUMO garante acompanhamento, método e execução — não promete emprego, renda ou a profissão perfeita.",
  },
];

export function Faq() {
  return (
    <Section eyebrow="Perguntas frequentes" title="FAQ">
      <div className="flex flex-col divide-y divide-marfim/10">
        {perguntas.map((item) => (
          <details key={item.pergunta} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-marfim marker:content-none">
              {item.pergunta}
              <span className="shrink-0 text-dourado transition group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-marfim/70">{item.resposta}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
