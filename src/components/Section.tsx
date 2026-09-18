import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * Larguras diferentes de propósito: uma coluna estreita pra leitura (FAQ,
 * formulário), e larguras maiores onde o conteúdo é uma composição (etapas,
 * comparação, entregáveis). Tudo preso a uma coluna de 768px só deixava a
 * página monótona e o conteúdo largo espremido.
 */
const LARGURAS = {
  estreita: "max-w-3xl",
  media: "max-w-5xl",
  ampla: "max-w-[70rem]",
} as const;

export function Section({
  id,
  eyebrow,
  title,
  subtitle,
  largura = "estreita",
  faixa = false,
  className = "",
  children,
}: {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  largura?: keyof typeof LARGURAS;
  /** Fundo levemente elevado, com filete em cima e embaixo — ritmo entre seções. */
  faixa?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`px-6 py-16 sm:py-24 ${
        faixa ? "border-y border-onyx-line bg-onyx-raised/40" : ""
      } ${className}`}
    >
      <div className={`mx-auto ${LARGURAS[largura]}`}>
        {(eyebrow || title || subtitle) && (
          <Reveal className="mb-10 max-w-2xl sm:mb-14">
            {eyebrow ? (
              <p className="mb-3 flex items-center gap-3 text-xs font-semibold tracking-[0.14em] text-dourado uppercase">
                <span aria-hidden="true" className="h-px w-6 bg-dourado/50" />
                {eyebrow}
              </p>
            ) : null}
            {title ? (
              <h2 className="font-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-4 text-lg leading-relaxed text-marfim/70">{subtitle}</p>
            ) : null}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
