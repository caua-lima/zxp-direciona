"use client";

import { useEffect, useState } from "react";

/**
 * Barra fixa de CTA no mobile. Aparece quando o Hero sai da tela, some de
 * novo quando o formulário entra — nunca cobre o que ela mesma manda
 * preencher.
 *
 * Usa IntersectionObserver nos dois extremos (Hero e formulário) em vez de
 * um valor fixo de scroll (ex: "scrollY > 500px"). Um número fixo desalinha
 * assim que o conteúdo do Hero muda de altura — texto maior, quebra de
 * linha diferente num aparelho mais estreito, uma seção nova — e ninguém
 * lembra de atualizar o número quando isso acontece.
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
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-onyx-line bg-onyx/90 p-3 backdrop-blur-md transition-transform duration-300 sm:hidden ${
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
        className="block rounded-xl bg-dourado px-6 py-3.5 text-center text-base font-bold text-onyx"
      >
        Quero minha conversa gratuita
      </a>
    </div>
  );
}
