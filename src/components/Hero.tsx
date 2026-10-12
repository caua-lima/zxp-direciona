import Image from "next/image";
import { mentor } from "@/config/mentor";

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate overflow-hidden px-5 pt-28 pb-14 sm:px-6 sm:pt-36 sm:pb-20"
    >
      {/* Fundo só aqui, só no lado direito e só em tela larga — no celular as
          linhas passariam por trás do texto. Decorativo (alt vazio) e sem
          `priority`: a página fica inteira sem ele. O degradê por cima deixa
          a metade do texto limpa. */}
      <Image
        src="/hero-fundo.jpg"
        alt=""
        fill
        sizes="100vw"
        className="pointer-events-none -z-20 hidden object-cover object-right opacity-70 lg:block"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-onyx via-onyx/85 to-onyx/30 lg:block"
      />

      <div className="mx-auto grid max-w-[70rem] items-center gap-10 lg:grid-cols-[58fr_42fr] lg:gap-14">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-dourado uppercase">
            Mentoria de direção profissional
          </p>

          <h1 className="font-display mt-5 text-[2.125rem] leading-[1.12] font-bold tracking-tight min-[400px]:text-[2.5rem] sm:text-5xl lg:text-[3.5rem]">
            Mais clareza para o seu{" "}
            <span className="text-dourado">próximo passo</span> profissional.
          </h1>

          <p className="mt-6 max-w-[55ch] text-[1.0625rem] leading-relaxed text-marfim/85 sm:text-xl">
            Sou {mentor.name}, à frente da ZXP Direciona. Se você está entre
            faculdade, carreira ou uma mudança de caminho, vamos conversar sobre
            o seu momento e avaliar se a mentoria faz sentido para você.
          </p>

          <div className="mt-8">
            <a
              href="#formulario"
              data-cta="hero"
              className="flex min-h-13 items-center justify-center rounded-xl bg-dourado px-8 py-4 text-center text-base font-bold text-onyx transition hover:brightness-110 active:brightness-95 sm:inline-flex"
            >
              Quero conversar com Cauã
            </a>
            <p className="mt-4 max-w-[48ch] leading-relaxed text-marfim/80">
              Primeiro, conte seu momento. Depois, fale direto comigo no
              WhatsApp para combinarmos a conversa.
            </p>
            <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-marfim/70">
              Conversa inicial gratuita. A mentoria é paga e será apresentada
              na call.
            </p>
          </div>
        </div>

        {/* Uma foto só nesta página, e é aqui: quem vai conversar tem rosto
            antes do cadastro. No celular fica compacta, DEPOIS do texto e do
            botão; em tela larga ocupa a coluna da direita. */}
        {mentor.photoUrl && (
          <figure className="flex items-center gap-4 lg:block">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-marfim/15 lg:aspect-square lg:h-auto lg:w-full">
              <Image
                src={mentor.photoUrl}
                alt={mentor.photoAlt}
                fill
                priority
                sizes="(min-width: 1024px) 440px, 96px"
                className="object-cover"
              />
            </div>
            <figcaption className="text-sm font-semibold text-marfim/80 lg:mt-4">
              {mentor.assinatura}
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}
