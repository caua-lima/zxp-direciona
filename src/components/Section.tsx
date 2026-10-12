import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/**
 * Toda seção usa a MESMA grade externa (70rem) do header e do hero, então as
 * margens esquerdas coincidem de cima a baixo. Quem precisa de coluna de
 * leitura mais estreita limita o próprio conteúdo, sem mudar o eixo.
 */
export function Section({
  id,
  title,
  subtitle,
  faixa = false,
  lateral = false,
  children,
}: {
  id?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  /** Fundo levemente elevado com filete em cima — ritmo entre seções. */
  faixa?: boolean;
  /**
   * Em tela larga, título à esquerda e conteúdo à direita — aproveita a
   * largura sem esticar a linha de leitura e encurta a página. No celular
   * continua empilhado.
   */
  lateral?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`px-5 py-14 sm:px-6 sm:py-20 ${
        faixa ? "border-t border-onyx-line bg-onyx-raised/50" : ""
      }`}
    >
      <div
        className={`mx-auto max-w-[70rem] ${
          lateral ? "lg:grid lg:grid-cols-[5fr_7fr] lg:gap-14" : ""
        }`}
      >
        {(title || subtitle) && (
          <Reveal className={`mb-9 max-w-2xl sm:mb-12 ${lateral ? "lg:mb-0" : ""}`}>
            {title ? (
              <h2 className="font-display text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-4 text-lg leading-relaxed text-marfim/75">{subtitle}</p>
            ) : null}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}
