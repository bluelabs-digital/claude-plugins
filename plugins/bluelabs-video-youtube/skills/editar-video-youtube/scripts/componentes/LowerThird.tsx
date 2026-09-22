import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Fontes } from "./Fontes";
import { marca } from "./marca";

export const LowerThird: React.FC<{ nome: string; cargo: string }> = ({ nome, cargo }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const entrada = spring({ frame, fps, config: { damping: 200, mass: 0.6 } });
  const saida = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const v = Math.min(entrada, saida);
  const desloc = interpolate(v, [0, 1], [-40, 0]);

  return (
    <AbsoluteFill style={{ fontFamily: marca.fonte }}>
      <Fontes />
      <div style={{
        position: "absolute", left: 96, bottom: 120,
        display: "flex", alignItems: "stretch", opacity: v,
      }}>
        <div style={{
          width: 6, background: marca.accent, alignSelf: "stretch", borderRadius: 3,
          transform: `scaleY(${v})`, transformOrigin: "50% 100%",
        }} />
        <div style={{
          background: marca.card, backdropFilter: "blur(12px)",
          padding: "20px 34px", marginLeft: 14, borderRadius: 4,
          transform: `translateX(${desloc}px)`,
        }}>
          <div style={{
            color: marca.branco, fontSize: 40, fontWeight: 800,
            letterSpacing: "-0.02em", lineHeight: 1.1,
          }}>{nome}</div>
          <div style={{
            color: marca.secundaria, fontSize: 21, fontWeight: 600,
            marginTop: 6, letterSpacing: "0.01em",
          }}>{cargo}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
