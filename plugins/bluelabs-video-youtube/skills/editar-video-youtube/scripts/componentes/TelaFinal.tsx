import React from "react";
import {
  AbsoluteFill, Img, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig,
} from "remotion";
import { Fontes } from "./Fontes";
import { marca } from "./marca";

// Conteúdo vem do plano.json, em "telaFinal". Se o manual da marca exige
// disclaimer, o lugar dele é a descrição do YouTube, não queimado aqui.
export const TelaFinal: React.FC<{
  titulo: string;
  sub?: string;
  itens?: string[];
}> = ({ titulo, sub, itens = [] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame, fps, config: { damping: 200, mass: 0.9 } });
  const veu = interpolate(frame, [0, 24], [0, 0.94], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ fontFamily: marca.fonte }}>
      <Fontes />
      <AbsoluteFill style={{ background: marca.gradiente, opacity: veu }} />
      <AbsoluteFill style={{
        justifyContent: "center", alignItems: "center",
        textAlign: "center", opacity: e,
      }}>
        {marca.logo && (
          <Img src={staticFile(marca.logo)} style={{ width: 230, marginBottom: 46 }} />
        )}
        <div style={{
          color: marca.branco, fontSize: 60, fontWeight: 800,
          letterSpacing: "-0.03em", maxWidth: 1250, lineHeight: 1.12,
        }}>{titulo}</div>
        {sub && (
          <div style={{
            color: marca.secundaria, fontSize: 30, fontWeight: 600, marginTop: 20,
          }}>{sub}</div>
        )}
        {itens.length > 0 && (
          <div style={{ display: "flex", gap: 18, marginTop: 56 }}>
            {itens.map((t, i) => {
              const o = interpolate(frame, [26 + i * 9, 46 + i * 9], [0, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <div key={t} style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 8, padding: "18px 26px", color: marca.branco,
                  fontSize: 24, fontWeight: 600, opacity: o,
                  transform: `translateY(${(1 - o) * 14}px)`,
                }}>{t}</div>
              );
            })}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
