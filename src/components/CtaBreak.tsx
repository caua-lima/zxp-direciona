import { Reveal } from "./Reveal";

/** Respiro no meio da página com um CTA — pega quem já se convenceu antes do fim. */
export function CtaBreak() {
  return (
    <section className="px-6 py-6">
      <div className="mx-auto max-w-5xl">
        <Reveal>
          <div className="card-destaque flex flex-col items-center gap-5 rounded-2xl p-8 text-center sm:flex-row sm:justify-between sm:p-10 sm:text-left">
            <div>
              <p className="font-display text-xl font-bold sm:text-2xl">
                Quer conversar sobre o seu caso?
              </p>
              <p className="mt-2 text-marfim/70">
                A conversa inicial é gratuita e sem compromisso.
              </p>
            </div>
            <a
              href="#formulario"
              data-cta="meio"
              className="shrink-0 rounded-xl bg-dourado px-7 py-3.5 text-center text-base font-bold text-onyx transition hover:brightness-110"
            >
              Quero minha conversa gratuita
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
