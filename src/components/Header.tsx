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
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-onyx-line bg-onyx/85 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2 min-[400px]:px-6">
        {/* min-h-11 (44px) garante alvo de toque confortável no celular */}
        <a
          href="#top"
          aria-label="ZXP Direciona — início"
          className="-mx-2 flex min-h-11 items-center rounded-lg px-2"
        >
          <Logo />
        </a>

        <a
          href="#formulario"
          data-cta="header"
          className="flex min-h-11 shrink-0 items-center rounded-lg border border-dourado/40 px-3.5 text-sm font-semibold whitespace-nowrap text-dourado transition hover:bg-dourado hover:text-onyx sm:px-4"
        >
          {/* Em tela muito estreita a frase inteira não cabe ao lado do logo. */}
          <span className="min-[400px]:hidden">Conversar</span>
          <span className="hidden min-[400px]:inline">Conversa gratuita</span>
        </a>
      </div>
    </header>
  );
}
