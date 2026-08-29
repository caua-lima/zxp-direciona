"use client";

import { useEffect, useState } from "react";

/**
 * Barra fixa de CTA no mobile — some quando o formulário entra na tela,
 * pra não cobrir o próprio formulário que ela manda preencher.
 */
export function StickyMobileCta() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = document.getElementById("formulario");
    const heroPassou = () => window.scrollY > 500;

    if (!alvo || typeof IntersectionObserver === "undefined") return;

    let formularioVisivel = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        formularioVisivel = entry.isIntersecting;
        setVisivel(heroPassou() && !formularioVisivel);
      },
      { threshold: 0 },
    );

    observer.observe(alvo);

    const onScroll = () => setVisivel(heroPassou() && !formularioVisivel);
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-onyx-line bg-onyx/90 p-3 backdrop-blur-md transition-transform duration-300 sm:hidden ${
        visivel ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visivel}
    >
      <a
        href="#formulario"
        tabIndex={visivel ? undefined : -1}
        className="block rounded-xl bg-dourado px-6 py-3.5 text-center text-base font-bold text-onyx"
      >
        Quero minha call de diagnóstico
      </a>
    </div>
  );
}
