import Image from "next/image";
import { Section } from "./Section";
import { Reveal } from "./Reveal";
import { mentor, mentorPreenchido } from "@/config/mentor";

export function Authority() {
  // Publicar "[Nome do mentor]" pra um visitante de verdade é pior do que
  // não mostrar a seção — ver o comentário em src/config/mentor.ts.
  if (!mentorPreenchido) return null;

  return (
    <Section eyebrow="Quem conduz" title="Quem vai estar do outro lado da call">
      <Reveal>
        <div className="card-destaque flex flex-col gap-6 rounded-2xl p-6 sm:flex-row sm:gap-8 sm:p-8">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-dourado/25 bg-onyx">
            {mentor.photoUrl ? (
              <Image
                src={mentor.photoUrl}
                alt={mentor.name}
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : (
              /* Placeholder — some sozinho quando `photoUrl` for preenchido
                 em src/config/mentor.ts */
              <span className="flex h-full w-full items-center justify-center text-center text-[10px] leading-tight tracking-wide text-marfim/30 uppercase">
                Foto
                <br />
                aqui
              </span>
            )}
          </div>

          <div>
            <p className="font-display text-2xl font-bold">{mentor.name}</p>
            <p className="mt-1 text-sm font-semibold text-dourado">
              {mentor.role}
            </p>
            <p className="mt-4 leading-relaxed text-marfim/70">{mentor.bio}</p>

            <ul className="mt-5 flex flex-wrap gap-2">
              {mentor.highlights.map((h) => (
                <li
                  key={h}
                  className="rounded-full border border-marfim/12 bg-marfim/[0.04] px-3 py-1.5 text-xs text-marfim/60"
                >
                  {h}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
