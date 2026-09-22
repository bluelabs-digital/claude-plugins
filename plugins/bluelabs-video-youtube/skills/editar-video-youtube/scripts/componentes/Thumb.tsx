import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { Fontes } from "./Fontes";
import { marca } from "./marca";

// Thumbnail 1280x720. Conteúdo vem do plano.json, em "thumb".
// `frame` é um PNG em motion/public/, normalmente um frame bom do próprio
// vídeo, extraído com ffmpeg.
//
// A régua editorial do manual vale aqui igual ao resto. Caractere proibido em
// título também é proibido em thumbnail.
export const Thumb: React.FC<{
  kicker?: string;
  titulo: string;
  resposta?: string;
  rodape?: string;
  frame?: string;
}> = ({ kicker, titulo, resposta, rodape, frame = "frame.png" }) => (
  <AbsoluteFill style={{ fontFamily: marca.fonte, background: marca.preto }}>
    <Fontes />
    <Img src={staticFile(frame)} style={{
      position: "absolute", right: -120, top: 0, height: "100%", objectFit: "cover",
    }} />
    <AbsoluteFill style={{
      background: `linear-gradient(90deg, ${marca.preto} 30%, ${marca.preto}ee 52%, ${marca.preto}00 78%)`,
    }} />
    <div style={{ position: "absolute", left: 64, top: 96, width: 700 }}>
      {kicker && (
        <div style={{
          display: "inline-block", background: marca.accent, color: marca.textoNoAccent,
          fontSize: 22, fontWeight: 800, letterSpacing: "0.14em",
          textTransform: "uppercase", padding: "9px 16px", borderRadius: 5,
        }}>{kicker}</div>
      )}
      <div style={{
        color: marca.branco, fontSize: 82, fontWeight: 800,
        letterSpacing: "-0.035em", lineHeight: 1.02, marginTop: 24,
        whiteSpace: "pre-line",
      }}>{titulo}</div>
      {resposta && (
        <div style={{
          color: marca.accent, fontSize: 54, fontWeight: 800,
          letterSpacing: "-0.03em", marginTop: 14,
        }}>{resposta}</div>
      )}
      {rodape && (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 26 }}>
          <span style={{ height: 4, width: 56, background: marca.accent, borderRadius: 2 }} />
          <span style={{ color: marca.secundaria, fontSize: 26, fontWeight: 700 }}>
            {rodape}
          </span>
        </div>
      )}
    </div>
    {marca.logo && (
      <Img src={staticFile(marca.logo)} style={{
        position: "absolute", left: 64, bottom: 54, width: 150, opacity: 0.95,
      }} />
    )}
  </AbsoluteFill>
);
