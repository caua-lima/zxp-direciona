/** Marca "Z" angulosa da ZXP Solutions — usada como elemento gráfico de fundo. */
export function ZWatermark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
    >
      <path
        d="M40 40H160L60 160H160"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

/** Versão sólida e compacta, para o logotipo. */
export function ZMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
      className={className}
      fill="none"
    >
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="7"
        fill="currentColor"
        opacity="0.12"
      />
      <path
        d="M10 10.5H22L11 21.5H22"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
