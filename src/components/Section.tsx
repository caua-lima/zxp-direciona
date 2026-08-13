import type { ReactNode } from "react";

export function Section({
  id,
  eyebrow,
  title,
  className = "",
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`px-6 py-16 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-3xl">
        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold tracking-wide text-dourado uppercase">
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2 className="font-display mb-10 text-3xl font-bold sm:text-4xl">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </section>
  );
}
