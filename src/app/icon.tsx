import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Mesma composição do <LogoMark> em src/components/Logo.tsx (moeda com as
// duas barras do "€" recortadas ao centro) — repetida aqui porque o
// ImageResponse (Satori) não corre no browser nem entende var(), por isso a
// cor vem em hex fixo (--accent, tema claro: #16a34a).
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#16a34a",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 13,
              height: 13,
              borderRadius: "50%",
              background: "#16a34a",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
            }}
          >
            <div style={{ width: 7, height: 2, borderRadius: 1, background: "white" }} />
            <div style={{ width: 7, height: 2, borderRadius: 1, background: "white" }} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
