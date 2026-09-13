import { ImageResponse } from "next/og";

export const alt =
  "ZXP Direciona — Mentoria de Direção Profissional, da ZXP Solutions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#10100E",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 12,
              background: "rgba(244,185,66,0.12)",
              color: "#F4B942",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            Z
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                color: "#F4B942",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 6,
              }}
            >
              ZXP
            </div>
            <div
              style={{
                color: "#F6F3E8",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 3,
                marginTop: 2,
              }}
            >
              DIRECIONA
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#F6F3E8",
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -1,
            }}
          >
            Você não precisa ter tudo resolvido.
          </div>
          <div
            style={{
              color: "#F4B942",
              fontSize: 62,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: -1,
              marginTop: 8,
            }}
          >
            Precisa saber qual é o próximo passo.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "rgba(246,243,232,0.55)",
            fontSize: 24,
          }}
        >
          <div style={{ display: "flex" }}>Mentoria de direção profissional</div>
          <div style={{ display: "flex" }}>ZXP Solutions</div>
        </div>
      </div>
    ),
    size,
  );
}
