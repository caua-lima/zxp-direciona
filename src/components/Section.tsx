import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  className = "",
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`px-6 py-16 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-3xl">
        {(eyebrow || title || subtitle) && (
          <Reveal className="mb-10 sm:mb-12">
            {eyebrow ? (
              <p className="mb-3 flex items-center gap-3 text-[11px] font-semibold tracking-[0.16em] text-dourado uppercase">
                <span
                  aria-hidden="true"
                  className="h-px w-6 bg-dourado/50"
                />
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="font-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-4 max-w-xl text-lg text-marfim/60">{subtitle}</p>
            ) : null}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
