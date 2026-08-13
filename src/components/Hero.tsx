import { ZWatermark } from "./ZWatermark";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
      <ZWatermark className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 text-dourado/5 sm:h-96 sm:w-96" />

      <div className="relative mx-auto flex max-w-3xl flex-col items-start gap-6">
        <span className="rounded-full border border-dourado/30 px-4 py-1 text-xs font-semibold tracking-wide text-dourado uppercase">
          RUMO · Mentoria de Direção Profissional
        </span>

        <h1 className="font-display text-4xl leading-[1.1] font-bold sm:text-5xl md:text-6xl">
          Você não precisa ter tudo{" "}
          <span className="text-dourado">resolvido.</span>
          <br />
          Precisa saber qual é o{" "}
          <span className="text-dourado">próximo passo.</span>
        </h1>

        <p className="max-w-xl text-lg text-marfim/80">
          A RUMO é a mentoria de direção profissional da ZXP Solutions. Um
          processo individual pra você sair do travamento entre faculdade,
          carreira e futuro — e caminhar com clareza.
        </p>

        <a
          href="#formulario"
          className="mt-2 rounded-lg bg-dourado px-8 py-4 text-base font-bold text-onyx transition hover:brightness-110"
        >
          Quero minha call de diagnóstico
        </a>
      </div>
    </section>
  );
}
