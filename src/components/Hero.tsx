import { ZWatermark } from "./ZWatermark";

const garantias = ["Gratuita", "1:1, por videochamada", "Sem compromisso"];

export function Hero() {
  return (
    <section
      id="top"
      className="grain relative isolate overflow-hidden px-6 pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      {/* Camadas de fundo — brilho dourado + marca Z discreta */}
      <div className="glow-dourado absolute inset-0 -z-10" aria-hidden="true" />
      <ZWatermark
        className="pointer-events-none absolute -top-20 -right-24 -z-10 h-72 w-72 text-dourado/[0.06] sm:h-[28rem] sm:w-[28rem]"
      />

      <div className="mx-auto flex max-w-3xl flex-col items-start">
        <span className="inline-flex items-center gap-2 rounded-full border border-dourado/25 bg-dourado/[0.06] px-4 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-dourado uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-dourado" />
          Mentoria de direção profissional
        </span>

        <h1 className="font-display mt-7 text-[2.5rem] leading-[1.08] font-bold tracking-tight sm:text-6xl">
          Você não precisa ter tudo{" "}
          <span className="text-gradient-dourado">resolvido.</span>
          <br className="hidden sm:block" /> Precisa saber qual é o{" "}
          <span className="text-gradient-dourado">próximo passo.</span>
        </h1>

        <p className="mt-7 max-w-xl text-lg leading-relaxed text-marfim/70 sm:text-xl">
          A ZXP Direciona é um processo individual pra quem está travado entre faculdade,
          carreira e futuro. Sem fórmula pronta — direção construída com a sua
          realidade.
        </p>

        <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <a
            href="#formulario"
            className="rounded-xl bg-dourado px-8 py-4 text-center text-base font-bold text-onyx shadow-lg shadow-dourado/15 transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
          >
            Quero minha call de diagnóstico
          </a>
          <a
            href="#metodo"
            className="rounded-xl border border-marfim/15 px-8 py-4 text-center text-base font-semibold text-marfim/80 transition hover:border-marfim/35 hover:text-marfim"
          >
            Como funciona
          </a>
        </div>

        <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-marfim/50">
          {garantias.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span aria-hidden="true" className="text-dourado">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
