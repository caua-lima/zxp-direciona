import Image from "next/image";

const garantias = ["Gratuita", "Individual", "Sem compromisso"];

export function Hero() {
  return (
    <section
      id="top"
      className="grain relative isolate overflow-hidden px-6 pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      {/* Camadas de fundo — imagem com o Z em linhas douradas à direita (o
          lado esquerdo dela é liso, é onde o texto fica) + brilho dourado.
          Decorativa: alt vazio. No celular fica mais apagada, porque ali as
          linhas passam por trás do texto. */}
      <Image
        src="/hero-fundo.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="pointer-events-none -z-20 object-cover object-right opacity-50 sm:opacity-100"
      />
      <div className="glow-dourado absolute inset-0 -z-10" aria-hidden="true" />

      <div className="mx-auto max-w-[70rem]">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-dourado/25 bg-dourado/[0.06] px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-dourado uppercase min-[400px]:px-4 min-[400px]:text-xs min-[400px]:tracking-[0.14em]">
            <span className="h-1.5 w-1.5 rounded-full bg-dourado" />
            Mentoria de direção profissional
          </span>

          <h1 className="font-display mt-7 text-[2.125rem] leading-[1.1] font-bold tracking-tight min-[400px]:text-[2.5rem] sm:text-6xl lg:text-[4.25rem]">
            Você não precisa ter tudo{" "}
            <span className="text-gradient-dourado">resolvido.</span>
            <br className="hidden sm:block" /> Precisa saber qual é o{" "}
            <span className="text-gradient-dourado">próximo passo.</span>
          </h1>

          {/* O concreto vem aqui, na primeira dobra: pra quem é (faculdade e
              carreira), o que é a conversa (individual, gratuita) e o que
              acontece depois do clique. */}
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-marfim/80 sm:text-xl">
            Entre faculdade, carreira e futuro, converse individualmente com a
            ZXP Direciona sobre as suas opções. Na conversa inicial, gratuita e
            sem compromisso, você entende se a mentoria faz sentido para o seu
            momento.
          </p>

          <div className="mt-9 flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
            <a
              href="#formulario"
              data-cta="hero"
              className="rounded-xl bg-dourado px-8 py-4 text-center text-base font-bold text-onyx shadow-lg shadow-dourado/15 transition hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0"
            >
              Quero minha conversa gratuita
            </a>
            {/* Ação secundária discreta: link, não um segundo botão disputando
                atenção com o principal. */}
            <a
              href="#como-funciona"
              className="flex min-h-11 items-center justify-center gap-2 text-base font-semibold text-marfim/75 underline decoration-marfim/25 underline-offset-[6px] transition hover:text-marfim hover:decoration-dourado"
            >
              Como funciona
              <span aria-hidden="true">↓</span>
            </a>
          </div>

          <p className="mt-5 text-sm text-marfim/60">
            Você envia seu contato e combinamos o horário pelo WhatsApp.
          </p>

          <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-marfim/60">
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
      </div>
    </section>
  );
}
