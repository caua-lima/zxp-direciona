import { ZMark } from "./ZWatermark";

export function Footer() {
  return (
    <footer className="border-t border-onyx-line px-6 py-10 pb-24 sm:pb-10">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center">
        <ZMark className="h-7 w-7 text-marfim/25" />
        <p className="text-sm text-marfim/40">
          ZXP Direciona — mentoria de direção profissional da{" "}
          <span className="text-marfim/60">ZXP Solutions</span>
        </p>
        <p className="text-xs text-marfim/25">
          © {new Date().getFullYear()} ZXP Solutions
        </p>
      </div>
    </footer>
  );
}
