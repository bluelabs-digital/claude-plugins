import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Fontes } from "./Fontes";
import { marca } from "./marca";

// Número em destaque. O número TEM que ter sido dito na fala. Se o manual da
// marca exigir fonte e data visíveis, ponha na legenda.
export const Destaque: React.FC<{ valor: string; legenda: string }> = ({ valor, legenda }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const e = spring({ frame, fps, config: { damping: 180, mass: 0.6 } });
  const saida = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const v = Math.min(e, saida);
  const barra = interpolate(frame, [8, 30], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: marca.fonte }}>
      <Fontes />
      <div style={{
        position: "absolute", right: 104, top: 150, textAlign: "right",
        opacity: v, transform: `translateY(${(1 - e) * 18}px)`,
      }}>
        <div style={{
          background: marca.accent, borderRadius: 8, padding: "22px 34px",
          boxShadow: marca.sombraAccent,
        }}>
          <div style={{
            color: marca.textoNoAccent, fontSize: 86, fontWeight: 800,
            letterSpacing: "-0.04em", lineHeight: 1,
          }}>{valor}</div>
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 12, marginTop: 14,
          background: marca.card, padding: "11px 18px", borderRadius: 5,
        }}>
          <span style={{
            height: 3, width: barra * 34, background: marca.secundaria, borderRadius: 2,
          }} />
          <span style={{ color: marca.branco, fontSize: 23, fontWeight: 600 }}>{legenda}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
