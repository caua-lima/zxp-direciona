import { Section } from "./Section";
import { Reveal } from "./Reveal";
import { mentor } from "@/config/mentor";

/**
 * Quem conduz. Só texto, de propósito: a foto já está no hero, e repetir um
 * retrato grande aqui não acrescenta nada. O conteúdo é o papel do Cauã e o
 * que acontece na conversa — a frase pessoal fica como nota, não como
 * biografia nem prova de competência.
 */
export function Authority() {
  return (
    <Section lateral title="Você vai conversar comigo.">
      <Reveal>
        <div className="max-w-2xl">
          <p className="font-display text-xl font-bold">{mentor.name}</p>
          <p className="mt-1 text-sm font-semibold text-marfim/70">{mentor.role}</p>
          <p className="mt-5 text-lg leading-relaxed text-marfim/85">
            {mentor.apresentacao}
          </p>
          <p className="mt-7 border-l border-marfim/25 pl-4 text-base leading-relaxed text-marfim/70 italic">
            “{mentor.frase}”
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
