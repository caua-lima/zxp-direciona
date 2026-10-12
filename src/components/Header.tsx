"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Logo";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b px-5 transition-colors duration-200 sm:px-6 ${
        scrolled ? "border-onyx-line bg-onyx/90 backdrop-blur-md" : "border-transparent"
      }`}
    >
      {/* Mesma grade (70rem) das seções, com o recuo lateral no elemento de
          fora, como nelas: assim o logo cai exatamente no eixo do texto. */}
      <div className="mx-auto flex max-w-[70rem] items-center justify-between gap-3 py-2">
        {/* min-h-11 (44px) garante alvo de toque confortável no celular */}
        <a
          href="#top"
          aria-label="ZXP Direciona — início"
          className="flex min-h-11 items-center rounded-lg"
        >
          <Logo />
        </a>

        {/* Discreto de propósito: a ação dourada cheia é a do hero e a do
            formulário; três botões igualmente chamativos competem entre si. */}
        <a
          href="#formulario"
          data-cta="header"
          className="flex min-h-11 shrink-0 items-center rounded-lg border border-marfim/30 px-3.5 text-sm font-semibold whitespace-nowrap text-marfim transition-colors hover:border-dourado hover:text-dourado sm:px-4"
        >
          {/* Em tela muito estreita a frase inteira não cabe ao lado do logo. */}
          <span className="min-[400px]:hidden">Conversar</span>
          <span className="hidden min-[400px]:inline">Conversar com Cauã</span>
        </a>
      </div>
    </header>
  );
}
