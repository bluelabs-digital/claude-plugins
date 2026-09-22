#!/usr/bin/env node
// Monta o projeto Shotcut (.mlt) que o melt compõe e a interface abre.
//
// Uso:
//   node gerar-mlt.mjs --projeto . --id meuvideo
//
// Lê motion/plano.json e as peças já renderizadas em saida/motion/.
// A base é midia/cortado.mp4, o vídeo JÁ CORTADO. Nunca monte overlay em
// cima do bruto: os tempos do plano estão no relógio do cortado.
//
// ARMADILHAS JÁ PAGAS, NÃO DESFAZER
//
//  1. Tudo em NÚMERO DE FRAME. Timecode em texto com avformat-novalidate sem
//     `length` colapsa a timeline: oito minutos viram treze segundos e o
//     render sai vazio, sem erro.
//
//  2. disable=0 em TODAS as frei0r.cairoblend. O Shotcut grava disable=1 na
//     faixa de baixo. Abre certo na interface, mas no melt o vídeo passa e
//     NENHUMA sobreposição aparece.
//
//  3. A interface do Shotcut exige produtor `black`, playlist `background` na
//     faixa 0, faixas nomeadas V1/V2… e transições `mix` + `cairoblend` por
//     faixa. Sem isso renderiza no melt mas abre vazio no aplicativo.
//
//  4. NUNCA remende este arquivo por substituição de texto. Escape de template
//     aninhado já quebrou o XML e o próprio script. Se precisar mudar,
//     reescreva inteiro.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const opt = (nome, padrao) => {
  const i = args.indexOf(`--${nome}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : padrao;
};

const P = path.resolve(opt("projeto", "."));
const ID = opt("id", path.basename(P));
const PLANO = path.join(P, "motion/plano.json");

if (!fs.existsSync(PLANO)) {
  console.error(`não achei ${PLANO}`);
  console.error("escreva o plano antes, modelo em scripts/plano.exemplo.json");
  process.exit(2);
}
const plano = JSON.parse(fs.readFileSync(PLANO, "utf8"));

const FPS = plano.fps ?? 30;
const LARG = plano.largura ?? 1920;
const ALT = plano.altura ?? 1080;
const MO = path.join(P, "saida/motion");
const BASE = path.resolve(P, plano.base ?? "midia/cortado.mp4");

if (!fs.existsSync(BASE)) {
  console.error(`não achei a base ${BASE}`);
  console.error("a base é o vídeo JÁ CORTADO, não o bruto. veja a etapa 3.");
  process.exit(2);
}

const f = (s) => Math.round(s * FPS);
const esc = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const frames = (arquivo) => f(parseFloat(execFileSync("ffprobe",
  ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivo])
  .toString().trim()));

const base = { id: "base", res: BASE, frames: frames(BASE) };
const fim = base.frames - 1;

// Quais peças entram e em qual faixa. Vem do plano, em "faixas".
// Sem isso, monta o padrão: destaques na V2, o resto na V3.
//
// Lembre da etapa 5: sobreposição só em trecho de CÂMERA LIMPA. Se o slide já
// mostra o número, o painel com o mesmo número polui. Capítulo que duplica
// título de slide vai para a descrição do YouTube, onde é clicável.
let pecas = plano.faixas;
if (!pecas) {
  pecas = { V2: [], V3: [] };
  (plano.destaques ?? []).forEach((d, i) => pecas.V2.push({ id: `Dest${i}`, em: d.em }));
  for (const chave of ["abertura", "lowerThird", "conta", "telaFinal"]) {
    const c = plano[chave];
    if (c && typeof c.em === "number") {
      pecas.V3.push({ id: chave[0].toUpperCase() + chave.slice(1), em: c.em });
    }
  }
  for (const c of plano.capitulos ?? []) pecas.V3.push({ id: `Cap${c.n}`, em: c.em });
}

const ausentes = [];
for (const lista of Object.values(pecas)) {
  for (const p of lista) {
    p.res = path.join(MO, `${p.id}.mov`);
    if (!fs.existsSync(p.res)) { ausentes.push(p.id); continue; }
    p.frames = frames(p.res);
  }
}
if (ausentes.length) {
  console.error(`peça(s) não renderizada(s): ${ausentes.join(", ")}`);
  console.error("rode renderizar-tudo.sh antes");
  process.exit(2);
}
for (const nome of Object.keys(pecas)) {
  pecas[nome] = pecas[nome].filter((p) => p.frames > 0);
}

// Duas peças na mesma faixa não podem se sobrepor: a segunda some sem aviso.
for (const [faixa, lista] of Object.entries(pecas)) {
  const ord = [...lista].sort((a, b) => a.em - b.em);
  for (let i = 1; i < ord.length; i++) {
    if (f(ord[i].em) < f(ord[i - 1].em) + ord[i - 1].frames) {
      console.error(`${faixa}: ${ord[i - 1].id} colide com ${ord[i].id}`);
      console.error("separe no tempo, ou ponha um dos dois em outra faixa");
      process.exit(2);
    }
  }
}

// Recorte opcional, para sumir com interface de app na gravação (etapa 5).
// plano.recorte = { w, h, x, y }
const R = plano.recorte;
const RECORTE = R ? `    <filter id="f_crop">
      <property name="mlt_service">avfilter.crop</property>
      <property name="av.w">${R.w}</property>
      <property name="av.h">${R.h}</property>
      <property name="av.x">${R.x}</property>
      <property name="av.y">${R.y}</property>
    </filter>
` : "";

const prod = (id, res, n, recortar) =>
  `  <producer id="p_${id}" in="0" out="${n - 1}">
    <property name="length">${n}</property>
    <property name="eof">pause</property>
    <property name="resource">${esc(res)}</property>
    <property name="mlt_service">avformat</property>
${recortar ? RECORTE : ""}  </producer>`;

const faixas = [
  { nome: "V1", corpo: `    <entry producer="p_base" in="0" out="${fim}"/>` },
  ...Object.entries(pecas).map(([nome, lista]) => {
    const ord = [...lista].sort((a, b) => a.em - b.em);
    let cursor = 0, corpo = "";
    for (const p of ord) {
      const inicio = f(p.em);
      if (inicio > cursor) { corpo += `    <blank length="${inicio - cursor}"/>\n`; cursor = inicio; }
      corpo += `    <entry producer="p_${p.id}" in="0" out="${p.frames - 1}"/>\n`;
      cursor += p.frames;
    }
    return { nome, corpo: corpo.trimEnd() };
  }),
];

const trans = (i) => `    <transition id="mix${i}">
      <property name="a_track">0</property>
      <property name="b_track">${i + 1}</property>
      <property name="mlt_service">mix</property>
      <property name="always_active">1</property>
      <property name="sum">1</property>
    </transition>
    <transition id="blend${i}">
      <property name="a_track">0</property>
      <property name="b_track">${i + 1}</property>
      <property name="version">0.1</property>
      <property name="mlt_service">frei0r.cairoblend</property>
      <property name="threads">0</property>
      <property name="disable">0</property>
    </transition>`;

const titulo = esc(plano.titulo ?? ID);
const todos = [
  prod("base", base.res, base.frames, Boolean(R)),
  ...Object.values(pecas).flat().map((p) => prod(p.id, p.res, p.frames, false)),
];

const xml = `<?xml version="1.0" standalone="no"?>
<mlt LC_NUMERIC="C" version="7.30.0" title="${titulo}" producer="main_bin">
  <profile description="HD ${ALT}p ${FPS} fps" width="${LARG}" height="${ALT}" progressive="1"
    sample_aspect_num="1" sample_aspect_den="1" display_aspect_num="16" display_aspect_den="9"
    frame_rate_num="${FPS}" frame_rate_den="1" colorspace="709"/>
  <playlist id="main_bin"><property name="xml_retain">1</property></playlist>
  <producer id="black" in="0" out="${fim}">
    <property name="length">${base.frames}</property>
    <property name="eof">pause</property>
    <property name="resource">0</property>
    <property name="aspect_ratio">1</property>
    <property name="mlt_service">color</property>
    <property name="mlt_image_format">rgba</property>
    <property name="set.test_audio">0</property>
  </producer>
  <playlist id="background"><entry producer="black" in="0" out="${fim}"/></playlist>
${todos.join("\n")}
${faixas.map((fx, i) => `  <playlist id="playlist${i}">
    <property name="shotcut:video">1</property>
    <property name="shotcut:name">${fx.nome}</property>
${fx.corpo}
  </playlist>`).join("\n")}
  <tractor id="tractor0" title="${titulo}" in="0" out="${fim}">
    <property name="shotcut">1</property>
    <property name="shotcut:projectAudioChannels">2</property>
    <property name="shotcut:projectFolder">0</property>
    <track producer="background"/>
${faixas.map((_, i) => `    <track producer="playlist${i}"/>`).join("\n")}
${faixas.map((_, i) => trans(i)).join("\n")}
  </tractor>
</mlt>
`;

// XML válido porém desbalanceado renderiza em silêncio e sai errado.
const abre = (xml.match(/<property /g) || []).length;
const fecha = (xml.match(/<\/property>/g) || []).length;
if (abre !== fecha) {
  console.error(`XML desbalanceado: ${abre} aberturas x ${fecha} fechamentos`);
  process.exit(1);
}

const saida = path.join(P, `saida/${ID}.mlt`);
fs.mkdirSync(path.dirname(saida), { recursive: true });
fs.writeFileSync(saida, xml);

console.log(`base ${(base.frames / FPS).toFixed(1)}s${R ? "  · recorte ativo" : ""}`);
for (const [nome, lista] of Object.entries(pecas)) {
  if (lista.length) console.log(`  ${nome}: ${lista.map((x) => x.id).join(", ")}`);
}
console.log(`gravado em saida/${ID}.mlt`);
console.log("\nagora extraia UM FRAME e olhe. XML válido porém errado");
console.log("renderiza em silêncio, sem erro nenhum.");
