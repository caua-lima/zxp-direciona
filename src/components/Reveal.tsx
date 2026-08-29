"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Revela o conteúdo com um fade sutil quando ele entra na viewport.
 *
 * Regra de ouro: o conteúdo NUNCA depende de JS pra ser visível.
 * O HTML sai do servidor sem nenhuma classe de animação — visível. Só depois
 * que o componente monta é que o estado escondido é aplicado, e apenas nos
 * elementos que estão fora da tela (por isso não existe piscada). Se o JS
 * falhar, não carregar, ou o browser não tiver IntersectionObserver, a página
 * continua legível — inclusive para crawlers.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // "armado" = estado escondido aplicado; só acontece no cliente e fora da tela
  const [armado, setArmado] = useState(false);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const prefereMenosMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefereMenosMovimento) return;

    // Já está na tela? Deixa como está — animar agora só causaria piscada.
    if (node.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    setArmado(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisivel(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${armado ? "reveal" : ""} ${className}`}
      data-visible={visivel}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
