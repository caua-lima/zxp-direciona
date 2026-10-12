"use client";

import { useEffect, useState } from "react";

/**
 * Barra fixa de CTA no mobile. Aparece quando o Hero sai da tela e some:
 *  - quando o formulário entra (nunca cobre o que ela mesma manda preencher);
 *  - enquanto o aviso de consentimento está aberto, que ocupa a mesma faixa
 *    de baixo — feito em CSS (`.barra-cta-fixa` em globals.css), então vale
 *    mesmo antes de este componente hidratar.
 *
 * O teclado virtual não disputa espaço com ela: os únicos campos de texto da
 * página ficam no formulário, onde a barra já está escondida.
 *
 * Usa IntersectionObserver nos dois extremos (Hero e formulário) em vez de
 * um valor fixo de scroll: um número fixo desalinha assim que o conteúdo do
 * Hero muda de altura.
 */
export function StickyMobileCta() {
  const [heroVisivel, setHeroVisivel] = useState(true);
  const [formularioVisivel, setFormularioVisivel] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("top");
    const formulario = document.getElementById("formulario");

    if (!hero || !formulario || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observerHero = new IntersectionObserver(
      ([entry]) => setHeroVisivel(entry.isIntersecting),
      { threshold: 0 },
    );
    const observerFormulario = new IntersectionObserver(
      ([entry]) => setFormularioVisivel(entry.isIntersecting),
      { threshold: 0 },
    );

    observerHero.observe(hero);
    observerFormulario.observe(formulario);

    return () => {
      observerHero.disconnect();
      observerFormulario.disconnect();
    };
  }, []);

  const visivel = !heroVisivel && !formularioVisivel;

  return (
    <div
      className={`barra-cta-fixa fixed inset-x-0 bottom-0 z-40 border-t border-onyx-line bg-onyx/95 p-3 backdrop-blur-md transition-transform duration-200 sm:hidden ${
        visivel ? "translate-y-0" : "translate-y-full"
      }`}
      // max() garante pelo menos 0.75rem de respiro mesmo em aparelhos sem
      // home indicator (env() cai pra 0 nesse caso, e max() cobre o resto).
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      aria-hidden={!visivel}
    >
      <a
        href="#formulario"
        data-cta="mobile_fixo"
        tabIndex={visivel ? undefined : -1}
        className="flex min-h-12 items-center justify-center rounded-xl bg-dourado px-6 text-center text-base font-bold text-onyx"
      >
        Conversar com Cauã
      </a>
    </div>
  );
}
