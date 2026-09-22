import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Fontes } from "./Fontes";
import { marca } from "./marca";

// Quadro de conta linha a linha, do tipo "somando fica assim".
// O conteúdo vem do plano.json, em "conta". Todo valor tem que ter sido dito
// na fala.
//
//   destaque  linha com fundo de acento, o resultado
//   risco     risca o valor, para mostrar o que estava errado
//   divisor   uma linha horizontal separando blocos

// Campos opcionais em vez de união discriminada: o import de plano.json alarga
// `divisor: true` para `boolean` e a união deixa de narrowar.
export type LinhaConta = {
  divisor?: boolean;
  rot?: string;
  val?: string;
  em?: number;
  destaque?: boolean;
  risco?: boolean;
};

const Linha: React.FC<{
  rot: string; val: string; em: number; destaque?: boolean; risco?: boolean;
}> = ({ rot, val, em, destaque, risco }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const e = spring({ frame: frame - em, fps, config: { damping: 200, mass: 0.5 } });
  const corte = interpolate(frame, [em + 26, em + 40], [0, 100],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline",
      padding: destaque ? "16px 22px" : "9px 22px", marginTop: destaque ? 12 : 0,
      background: destaque ? marca.accent : "transparent", borderRadius: 6,
      opacity: e, transform: `translateX(${(1 - e) * 26}px)`,
    }}>
      <span style={{
        color: destaque ? marca.textoNoAccent : marca.cinza400,
        fontSize: destaque ? 27 : 25, fontWeight: destaque ? 700 : 600,
      }}>{rot}</span>
      <span style={{
        position: "relative", color: destaque ? marca.textoNoAccent : marca.branco,
        fontSize: destaque ? 42 : 34, fontWeight: 800,
        letterSpacing: "-0.02em", marginLeft: 36,
      }}>
        {val}
        {risco && (
          <span style={{
            position: "absolute", left: 0, top: "52%", height: 3,
            width: `${corte}%`, background: "#ef4444", borderRadius: 2,
          }} />
        )}
      </span>
    </div>
  );
};

export const Conta: React.FC<{
  titulo?: string;
  linhas: LinhaConta[];
  fecho?: string;
}> = ({ titulo, linhas, fecho }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const e = spring({ frame, fps, config: { damping: 200, mass: 0.8 } });
  const saida = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ultima = linhas.reduce(
    (acc, l) => (typeof l.em === "number" ? Math.max(acc, l.em) : acc), 0);

  return (
    <AbsoluteFill style={{ fontFamily: marca.fonte, opacity: saida }}>
      <Fontes />
      <div style={{
        position: "absolute", right: 90, top: 96, width: 720,
        background: marca.card, backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.10)", borderRadius: 12,
        padding: "30px 26px 34px", opacity: e,
        transform: `translateY(${(1 - e) * 22}px)`,
      }}>
        {titulo && (
          <div style={{
            color: marca.secundaria, fontSize: 19, fontWeight: 700,
            letterSpacing: "0.16em", textTransform: "uppercase",
            paddingLeft: 22, marginBottom: 18,
          }}>{titulo}</div>
        )}
        {linhas.map((l, i) =>
          l.divisor ? (
            <div key={i} style={{
              height: 1, background: "rgba(255,255,255,0.12)", margin: "22px 22px 14px",
            }} />
          ) : (
            <Linha
              key={i}
              rot={l.rot ?? ""}
              val={l.val ?? ""}
              em={l.em ?? 0}
              destaque={l.destaque}
              risco={l.risco}
            />
          )
        )}
        {fecho && (
          <div style={{
            marginTop: 20, paddingLeft: 22,
            opacity: interpolate(frame, [ultima + 40, ultima + 62], [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}>
            <span style={{ color: marca.secundaria, fontSize: 25, fontWeight: 700 }}>
              {fecho}
            </span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
