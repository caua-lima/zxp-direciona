import { ImageResponse } from "next/og";

/**
 * Ícone da aba do navegador — gerado por código, não um arquivo de imagem.
 * Mesma geometria do "Z" de src/components/ZWatermark.tsx (ZMark), só que
 * redesenhada aqui porque o next/og (Satori) não entende `currentColor` nem
 * classes Tailwind — precisa de cor e proporção escritas por extenso.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#10100E",
          borderRadius: 7,
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path
            d="M10 10.5H22L11 21.5H22"
            stroke="#F4B942"
            strokeWidth="2.6"
            strokeLinejoin="miter"
          />
        </svg>
      </div>
    ),
    size,
  );
}
