import { ZMark } from "./ZWatermark";

/**
 * Lockup "ZXP DIRECIONA" — mesma lógica da PRONIX PERFORMANCE / PRONIX ACELERA:
 * marca-mãe pequena em cima, nome do produto em peso forte embaixo. Como o ZXP
 * já vai embutido no nome, não existe mais legenda "por ZXP Solutions".
 */
export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <ZMark className="h-8 w-8 shrink-0 text-dourado" />
      <span className="flex flex-col leading-none">
        <span className="text-[10px] font-bold tracking-[0.24em] text-dourado">
          ZXP
        </span>
        <span className="font-display mt-0.5 text-lg font-bold tracking-[0.1em] text-marfim">
          DIRECIONA
        </span>
      </span>
    </span>
  );
}
