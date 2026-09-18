"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { categoriasRelevantes, trackingAtivo } from "@/config/tracking";
import {
  EVENTO_ABRIR_PREFERENCIAS,
  assinarConsentimento,
  interpretarConsentimento,
  lerBrutoConsentimento,
  salvarConsentimento,
  type Consentimento,
} from "@/lib/tracking/consent";
import { aplicarConsentimento } from "@/lib/tracking/providers";
import {
  ORIGENS_WHATSAPP,
  POSICOES_CTA,
  track,
  type OrigemWhatsapp,
  type PosicaoCta,
} from "@/lib/tracking/events";

/**
 * Liga a medição — mas só se houver algum ID configurado. Sem ID (o estado
 * de hoje) este componente não renderiza nada, não escuta nada e não guarda
 * nada: o site funciona exatamente como se ele não existisse.
 *
 * Com ID: mostra o banner até o visitante escolher, carrega os fornecedores
 * só depois do "sim", e escuta cliques marcados com data-cta / data-whatsapp
 * (delegação: os componentes de servidor só precisam do atributo, sem JS).
 */
export function TrackingProvider() {
  // `null` no servidor e na hidratação, string depois: é assim que o primeiro
  // render do cliente bate com o do servidor sem precisar de effect+setState.
  const bruto = useSyncExternalStore(
    assinarConsentimento,
    lerBrutoConsentimento,
    () => null,
  );
  const consentimento = useMemo(
    () => (bruto === null ? null : interpretarConsentimento(bruto)),
    [bruto],
  );
  // true quando a PESSOA pediu pra reabrir (link do rodapé).
  const [reaberto, setReaberto] = useState(false);

  useEffect(() => {
    if (consentimento) aplicarConsentimento(consentimento);
  }, [consentimento]);

  useEffect(() => {
    if (!trackingAtivo) return;

    const aoClicar = (evento: MouseEvent) => {
      const alvo = evento.target;
      if (!(alvo instanceof Element)) return;

      const cta = alvo.closest("[data-cta]")?.getAttribute("data-cta");
      if (cta && (POSICOES_CTA as readonly string[]).includes(cta)) {
        track({ nome: "cta_click", posicao: cta as PosicaoCta });
      }

      const whatsapp = alvo.closest("[data-whatsapp]")?.getAttribute("data-whatsapp");
      if (whatsapp && (ORIGENS_WHATSAPP as readonly string[]).includes(whatsapp)) {
        track({ nome: "whatsapp_click", origem: whatsapp as OrigemWhatsapp });
      }
    };
    const aoPedirPreferencias = () => setReaberto(true);

    document.addEventListener("click", aoClicar);
    window.addEventListener(EVENTO_ABRIR_PREFERENCIAS, aoPedirPreferencias);
    return () => {
      document.removeEventListener("click", aoClicar);
      window.removeEventListener(EVENTO_ABRIR_PREFERENCIAS, aoPedirPreferencias);
    };
  }, []);

  // bruto === null = ainda hidratando: não mostra nada (evita piscar).
  const aberto =
    trackingAtivo && bruto !== null && (consentimento === null || reaberto);

  if (!aberto) return null;

  return (
    <BannerConsentimento
      // Reinicia o estado interno (caixas marcadas) a cada abertura nova.
      key={reaberto ? "reaberto" : "inicial"}
      inicial={consentimento}
      focarAoAbrir={reaberto}
      onEscolher={(analytics, marketing) => {
        salvarConsentimento(analytics, marketing);
        setReaberto(false);
      }}
    />
  );
}

function BannerConsentimento({
  inicial,
  focarAoAbrir,
  onEscolher,
}: {
  inicial: Consentimento | null;
  focarAoAbrir: boolean;
  onEscolher: (analytics: boolean, marketing: boolean) => void;
}) {
  const [personalizando, setPersonalizando] = useState(false);
  // Nenhuma caixa pré-marcada: consentimento tem que ser um ato, não um padrão.
  const [analytics, setAnalytics] = useState(inicial?.analytics ?? false);
  const [marketing, setMarketing] = useState(inicial?.marketing ?? false);
  const raiz = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Só rouba o foco quando a pessoa pediu pra abrir (link do rodapé). No
    // carregamento inicial, o banner não pode atropelar quem já está lendo.
    if (focarAoAbrir) raiz.current?.focus();
  }, [focarAoAbrir]);

  const botao =
    "min-h-11 flex-1 rounded-lg border border-marfim/30 px-4 text-sm font-semibold text-marfim transition hover:border-dourado hover:text-dourado";

  return (
    <div
      ref={raiz}
      role="dialog"
      aria-modal="false"
      aria-labelledby="consentimento-titulo"
      tabIndex={-1}
      className="fixed inset-x-3 bottom-3 z-[70] rounded-2xl border border-onyx-line bg-onyx-raised p-5 shadow-2xl sm:right-auto sm:bottom-6 sm:left-6 sm:max-w-md"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <p id="consentimento-titulo" className="font-display text-base font-bold">
        Medição e anúncios
      </p>
      <p className="mt-2 text-sm leading-relaxed text-marfim/75">
        Podemos usar ferramentas de terceiros pra entender de onde vêm os
        visitantes e se os anúncios funcionam. Nada disso é necessário pra você
        se cadastrar — recusar não muda nada no site.
      </p>

      {personalizando && (
        <div className="mt-4 flex flex-col gap-3">
          {categoriasRelevantes.analytics && (
            <label className="flex cursor-pointer items-start gap-3 text-sm text-marfim/85">
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-dourado"
              />
              <span>
                <strong className="text-marfim">Medição de visitas.</strong>{" "}
                Quantas pessoas chegam e o que elas fazem na página.
              </span>
            </label>
          )}
          {categoriasRelevantes.marketing && (
            <label className="flex cursor-pointer items-start gap-3 text-sm text-marfim/85">
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-dourado"
              />
              <span>
                <strong className="text-marfim">Publicidade.</strong> Medir o
                resultado dos anúncios que trouxeram você até aqui.
              </span>
            </label>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button type="button" className={botao} onClick={() => onEscolher(false, false)}>
          Recusar tudo
        </button>
        {personalizando ? (
          <button type="button" className={botao} onClick={() => onEscolher(analytics, marketing)}>
            Salvar escolha
          </button>
        ) : (
          <button
            type="button"
            className={botao}
            onClick={() =>
              onEscolher(categoriasRelevantes.analytics, categoriasRelevantes.marketing)
            }
          >
            Aceitar tudo
          </button>
        )}
      </div>

      {!personalizando && (
        <button
          type="button"
          onClick={() => setPersonalizando(true)}
          className="mt-3 min-h-11 text-sm font-semibold text-dourado underline underline-offset-4"
        >
          Escolher o que aceitar
        </button>
      )}
    </div>
  );
}
