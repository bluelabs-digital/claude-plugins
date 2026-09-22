import React from "react";
import {
  AbsoluteFill, Img, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { Fontes } from "./Fontes";
import { marca } from "./marca";

export const Abertura: React.FC<{ titulo: string; sub: string }> = ({ titulo, sub }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const e = spring({ frame, fps, config: { damping: 200, mass: 0.9 } });
  const saida = interpolate(frame, [durationInFrames - 18, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const veu = interpolate(frame, [0, 20, durationInFrames - 18, durationInFrames],
    [0.92, 0.72, 0.72, 0], { extrapolateRight: "clamp" });
  const linha = interpolate(frame, [10, 40], [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const linhas = titulo.split("\n");
  return (
    <AbsoluteFill style={{ fontFamily: marca.fonte }}>
      <Fontes />
      <AbsoluteFill style={{ background: marca.preto, opacity: veu }} />
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 150, opacity: saida }}>
        {linhas.map((l, i) => (
          <div key={i} style={{
            color: marca.branco, fontSize: 104, fontWeight: 800,
            letterSpacing: "-0.035em", lineHeight: 1.04,
            opacity: interpolate(e, [i * 0.18, i * 0.18 + 0.5], [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            transform: `translateY(${(1 - e) * (30 + i * 12)}px)`,
          }}>{l}</div>
        ))}
        <div style={{
          height: 6, width: linha * 320, background: marca.accent,
          margin: "30px 0 24px", borderRadius: 3,
        }} />
        <div style={{
          color: marca.secundaria, fontSize: 30, fontWeight: 600, letterSpacing: "0.02em",
          opacity: interpolate(e, [0.5, 1], [0, 1], { extrapolateLeft: "clamp" }),
        }}>{sub}</div>
      </AbsoluteFill>
      {marca.logo && (
        <Img src={staticFile(marca.logo)} style={{
          position: "absolute", right: 96, top: 80, width: 160, opacity: e * saida * 0.9,
        }} />
      )}
    </AbsoluteFill>
  );
};
