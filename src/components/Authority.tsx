import { Section } from "./Section";
import { mentor } from "@/config/mentor";

export function Authority() {
  return (
    <Section eyebrow="Quem conduz" title="Sua direção, guiada por alguém que já pavimentou o caminho">
      <div className="flex flex-col items-start gap-6 rounded-xl border border-marfim/10 bg-marfim/[0.03] p-6 sm:flex-row sm:items-center">
        {/* Placeholder de foto — troque por <Image src={mentor.photoUrl} .../> quando houver foto real em public/ */}
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border border-dourado/30 bg-onyx-soft text-2xl font-bold text-dourado">
          ?
        </div>
        <div>
          <p className="font-display text-xl font-bold">{mentor.name}</p>
          <p className="text-sm text-dourado">{mentor.role}</p>
          <p className="mt-3 text-marfim/80">{mentor.bio}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {mentor.highlights.map((h) => (
              <li
                key={h}
                className="rounded-full border border-marfim/15 px-3 py-1 text-xs text-marfim/70"
              >
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
