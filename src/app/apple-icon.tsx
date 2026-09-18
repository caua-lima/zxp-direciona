import { ImageResponse } from "next/og";

/**
 * Ícone pra quando alguém adiciona o site à tela inicial do iOS. Mesma
 * geometria de icon.tsx, só maior — a Apple não lida bem com fundo
 * transparente aqui, por isso o onyx sólido preenchendo o quadrado inteiro.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10100E",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
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
