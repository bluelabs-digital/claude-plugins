import React from "react";
import { Composition } from "remotion";
import { Abertura } from "./Abertura";
import { LowerThird } from "./LowerThird";
import { Cartela } from "./Cartela";
import { Destaque } from "./Destaque";
import { Conta } from "./Conta";
import { TelaFinal } from "./TelaFinal";
import { Thumb } from "./Thumb";
import plano from "../plano.json";

// Registra uma composição por peça do plano.json. O renderizar-tudo.sh monta
// a lista de IDs a partir do MESMO plano, e é por isso que nunca se parseia a
// saída de `remotion compositions`: as barras de progresso viram falsos nomes.

const F = plano.fps ?? 30;
const L = plano.largura ?? 1920;
const A = plano.altura ?? 1080;
const f = (s: number) => Math.round(s * F);

export const RemotionRoot: React.FC = () => (
  <>
    {plano.abertura && (
      <Composition
        id="Abertura" component={Abertura}
        durationInFrames={f(plano.abertura.dur)} fps={F} width={L} height={A}
        defaultProps={{ titulo: plano.abertura.titulo, sub: plano.abertura.sub }}
      />
    )}

    {plano.lowerThird && (
      <Composition
        id="LowerThird" component={LowerThird}
        durationInFrames={f(plano.lowerThird.dur)} fps={F} width={L} height={A}
        defaultProps={{
          nome: plano.lowerThird.nome,
          cargo: plano.lowerThird.cargo,
        }}
      />
    )}

    {(plano.capitulos ?? []).map((c: any) => (
      <Composition
        key={c.n} id={`Cap${c.n}`} component={Cartela}
        durationInFrames={f(c.dur ?? 3.6)} fps={F} width={L} height={A}
        defaultProps={{ kicker: c.kicker ?? `Capítulo ${c.n}`, titulo: c.titulo }}
      />
    ))}

    {(plano.destaques ?? []).map((d: any, i: number) => (
      <Composition
        key={i} id={`Dest${i}`} component={Destaque}
        durationInFrames={f(d.dur)} fps={F} width={L} height={A}
        defaultProps={{ valor: d.valor, legenda: d.legenda }}
      />
    ))}

    {plano.conta && (
      <Composition
        id="Conta" component={Conta}
        durationInFrames={f(plano.conta.dur)} fps={F} width={L} height={A}
        defaultProps={{
          titulo: plano.conta.titulo,
          linhas: plano.conta.linhas,
          fecho: plano.conta.fecho,
        }}
      />
    )}

    {plano.telaFinal && (
      <Composition
        id="TelaFinal" component={TelaFinal}
        durationInFrames={f(plano.telaFinal.dur)} fps={F} width={L} height={A}
        defaultProps={{
          titulo: plano.telaFinal.titulo,
          sub: plano.telaFinal.sub,
          itens: plano.telaFinal.itens,
        }}
      />
    )}

    {plano.thumb && (
      <Composition
        id="Thumb" component={Thumb}
        durationInFrames={1} fps={F} width={1280} height={720}
        defaultProps={{
          kicker: plano.thumb.kicker,
          titulo: plano.thumb.titulo,
          resposta: plano.thumb.resposta,
          rodape: plano.thumb.rodape,
          frame: plano.thumb.frame,
        }}
      />
    )}
  </>
);
