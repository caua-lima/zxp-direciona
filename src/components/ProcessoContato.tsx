import { Section } from "./Section";
import { Reveal } from "./Reveal";

/**
 * Logística do contato, e só isso: cadastro, WhatsApp, call. NÃO é o método
 * da mentoria — nome, etapas e entregas ficam para a conversa e não entram
 * aqui nem resumidos.
 */
const passos = [
  {
    titulo: "Conte seu momento",
    texto: "Preencha seus dados e descreva a decisão que você está tentando tomar.",
  },
  {
    titulo: "Fale comigo no WhatsApp",
    texto:
      "Depois do envio, abra a conversa diretamente comigo para combinarmos a call.",
  },
  {
    titulo: "Conheça a proposta na call",
    texto:
      "Conversamos sobre o seu caso. Se houver alinhamento, apresento como a mentoria funciona e suas condições, antes de qualquer decisão.",
  },
];

export function ProcessoContato() {
  return (
    <Section id="como-comecamos" faixa title="Da sua dúvida à nossa primeira conversa.">
      <Reveal>
        <ol className="grid gap-x-10 gap-y-8 md:grid-cols-3">
          {passos.map((passo, i) => (
            <li key={passo.titulo} className="border-t border-marfim/15 pt-6">
              <span
                aria-hidden="true"
                className="font-display text-sm font-bold tracking-[0.1em] text-dourado"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display mt-2 text-xl font-bold">{passo.titulo}</h3>
              <p className="mt-2 leading-relaxed text-marfim/75">{passo.texto}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </Section>
  );
}
