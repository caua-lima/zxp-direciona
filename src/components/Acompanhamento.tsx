import { Section } from "./Section";
import { Reveal } from "./Reveal";

/**
 * Diz QUE existe um método, não QUAL é.
 *
 * Decisão do dono: o método (nome, etapas, o que sai de cada uma) só é
 * apresentado dentro da conversa inicial. Nada disso volta pra esta página —
 * nem a sigla, nem o nome das etapas, nem uma lista de entregas, que ainda
 * não estão definidas. O teste do HTML gerado barra se voltar.
 */
export function Acompanhamento() {
  return (
    <Section
      eyebrow="Como o acompanhamento funciona"
      title="Um método próprio, aplicado ao seu caso"
      largura="media"
    >
      <Reveal>
        <div className="flex max-w-2xl flex-col gap-4 text-lg leading-relaxed text-marfim/75">
          <p>
            A mentoria segue um método próprio da ZXP Direciona. Ele não fica
            descrito aqui de propósito: faz mais sentido ver como funciona em
            cima do seu momento do que ler uma teoria solta numa página.
          </p>
          <p>
            Na conversa inicial você conhece o método, como é o acompanhamento e
            o que ele envolve. Aí decide, com tudo na mão, se quer seguir.
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
