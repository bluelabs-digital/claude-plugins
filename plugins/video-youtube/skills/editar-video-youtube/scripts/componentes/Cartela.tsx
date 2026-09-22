import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Fontes } from "./Fontes";
import { marca } from "./marca";

// Faixa de capítulo. Lembre da etapa 5: capítulo que duplica título de slide
// vai para a descrição do YouTube, onde é clicável, não para a tela.
export const Cartela: React.FC<{ kicker: string; titulo: string }> = ({ kicker, titulo }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const e = spring({ frame, fps, config: { damping: 200, mass: 0.7 } });
  const saida = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const v = Math.min(e, saida);
  const larg = interpolate(v, [0, 1], [0, 100]);
  const texto = interpolate(frame, [12, 30], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * saida;

  return (
    <AbsoluteFill style={{ fontFamily: marca.fonte, justifyContent: "flex-end" }}>
      <Fontes />
      <div style={{ position: "relative", height: 168, overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: 0, width: `${larg}%`,
          background: marca.faixaCapitulo, backdropFilter: "blur(14px)",
        }} />
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 7,
          background: marca.accent, transform: `scaleY(${v})`, transformOrigin: "50% 100%",
        }} />
        <div style={{
          position: "absolute", left: 104, top: 34, opacity: texto,
          transform: `translateY(${(1 - texto) * 14}px)`,
        }}>
          <div style={{
            color: marca.secundaria, fontSize: 19, fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase",
          }}>{kicker}</div>
          <div style={{
            color: marca.branco, fontSize: 52, fontWeight: 800,
            letterSpacing: "-0.028em", marginTop: 9, lineHeight: 1.08,
          }}>{titulo}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
