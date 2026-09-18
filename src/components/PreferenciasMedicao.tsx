"use client";

import { EVENTO_ABRIR_PREFERENCIAS } from "@/lib/tracking/consent";

/**
 * Consentimento tem que ser revogável tão fácil quanto foi dado. Este botão
 * (rodapé) reabre o banner. Só é renderizado quando há medição configurada.
 */
export function PreferenciasMedicao() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_PREFERENCIAS))}
      className="min-h-11 text-xs text-marfim/55 underline underline-offset-4 transition hover:text-marfim"
    >
      Preferências de medição
    </button>
  );
}
