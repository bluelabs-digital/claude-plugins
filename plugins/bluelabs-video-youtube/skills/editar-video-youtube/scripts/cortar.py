#!/usr/bin/env python3
"""Monta o EDL do vídeo, juntando cortes de silêncio e cortes editoriais.

Dois tipos de corte entram no mesmo EDL.

  silêncio   pausa acima de --min-silencio, detectada pelo ffmpeg. Sai o miolo,
             sobra --pad em cada ponta, então a emenda tem 2x --pad.

  editorial  take errado, falso começo, retake, pedido de corte em voz alta,
             caçada na tela. Vem da sua leitura, em --editorial inicio:fim.

Saídas:
  saida/cortes.json            o EDL completo
  transcricao/keeps.json       só os pares mantidos
  transcricao/select.txt       a expressão select do ffmpeg

E imprime o mapa de âncoras, que traduz um tempo do bruto para o tempo do
cortado. Toda marcação anotada assistindo ao bruto precisa passar por ele antes
de virar plano.json, senão as sobreposições entram fora de lugar.

Exemplo:

  python3 cortar.py --projeto . --duracao 640.033 \\
    --silencio transcricao/silencio-30.txt \\
    --editorial 190.50:196.00 --editorial 487.55:558.32 \\
    --ancora fala_inicia=1.47 --ancora tres_passos=196.00
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path


def parse_silences(path: Path, duracao: float) -> list[tuple[float, float]]:
    """Lê a saída do silencedetect do ffmpeg.

    O filtro imprime silence_start e silence_end em linhas separadas, e o
    último silêncio pode não ter end se o vídeo acabar em mudo.
    """
    starts: list[float] = []
    pares: list[tuple[float, float]] = []
    for linha in path.read_text(errors="replace").splitlines():
        if "silence_start:" in linha:
            m = re.search(r"silence_start:\s*(-?[0-9.]+)", linha)
            if m:
                starts.append(float(m.group(1)))
        elif "silence_end:" in linha:
            m = re.search(r"silence_end:\s*([0-9.]+)", linha)
            if m and starts:
                pares.append((starts.pop(0), float(m.group(1))))
    if starts:
        pares.append((starts[0], duracao))
    return pares


def merge(ranges: list[tuple[float, float]]) -> list[tuple[float, float]]:
    """Junta intervalos que encostam ou se sobrepõem."""
    if not ranges:
        return []
    ranges = sorted(ranges)
    out = [list(ranges[0])]
    for a, b in ranges[1:]:
        if a <= out[-1][1] + 0.001:
            out[-1][1] = max(out[-1][1], b)
        else:
            out.append([a, b])
    return [(a, b) for a, b in out]


def par(texto: str, rotulo: str) -> tuple[float, float]:
    if ":" not in texto:
        sys.exit(f"{rotulo} precisa ser inicio:fim, recebi {texto!r}")
    a, b = texto.split(":", 1)
    try:
        ini, fim = float(a), float(b)
    except ValueError:
        sys.exit(f"{rotulo} com número inválido: {texto!r}")
    if fim <= ini:
        sys.exit(f"{rotulo} com fim antes do início: {texto!r}")
    return ini, fim


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--projeto", default=".", help="pasta do projeto de vídeo")
    ap.add_argument("--duracao", type=float, required=True,
                    help="duração do bruto em segundos (ffprobe)")
    ap.add_argument("--silencio", default="transcricao/silencio-30.txt",
                    help="saída do silencedetect")
    ap.add_argument("--editorial", action="append", default=[], metavar="INI:FIM",
                    help="corte editorial, repetível")
    ap.add_argument("--ancora", action="append", default=[], metavar="NOME=T",
                    help="marco a traduzir de bruto para cortado, repetível")
    ap.add_argument("--pad", type=float, default=0.1,
                    help="sobra em cada ponta do corte de silêncio (padrão 0,1 s)")
    ap.add_argument("--min-silencio", type=float, default=0.4,
                    help="silêncio acima disso é cortado (padrão 0,4 s)")
    ap.add_argument("--min-keep", type=float, default=0.08,
                    help="trecho mantido menor que isso some (padrão 0,08 s)")
    args = ap.parse_args()

    P = Path(args.projeto).expanduser().resolve()
    sil_path = P / args.silencio if not Path(args.silencio).is_absolute() else Path(args.silencio)
    if not sil_path.exists():
        sys.exit(f"não achei {sil_path}\n"
                 "rode antes:\n"
                 "  ffmpeg -i transcricao/mic16k.wav "
                 "-af silencedetect=noise=-30dB:d=0.4 -f null - "
                 "2> transcricao/silencio-30.txt")

    editoriais = [par(e, "--editorial") for e in args.editorial]
    ancoras: dict[str, float] = {}
    for a in args.ancora:
        if "=" not in a:
            sys.exit(f"--ancora precisa ser nome=tempo, recebi {a!r}")
        nome, t = a.split("=", 1)
        ancoras[nome] = float(t)

    # 1. silêncios que viram corte
    cortes_sil: list[tuple[float, float]] = []
    for a, b in parse_silences(sil_path, args.duracao):
        if b - a <= args.min_silencio:
            continue
        ini, fim = a + args.pad, b - args.pad
        if fim - ini > 0.05:
            cortes_sil.append((ini, fim))

    # 2. os dois tipos no mesmo conjunto
    cortes = merge(cortes_sil + editoriais)

    # 3. o que sobra
    keeps: list[tuple[float, float]] = []
    cursor = 0.0
    for a, b in cortes:
        if a - cursor >= args.min_keep:
            keeps.append((round(cursor, 3), round(a, 3)))
        cursor = b
    if args.duracao - cursor >= args.min_keep:
        keeps.append((round(cursor, 3), round(args.duracao, 3)))

    if not keeps:
        sys.exit("nada sobrou. confira --duracao e os cortes editoriais")

    def to_cut(t: float) -> float:
        """Traduz um tempo do bruto para o tempo do cortado."""
        acc = 0.0
        for a, b in keeps:
            if t < a:
                return acc
            if t <= b:
                return acc + (t - a)
            acc += b - a
        return acc

    cut_dur = sum(b - a for a, b in keeps)

    edl = {
        "duracao_bruto": args.duracao,
        "duracao_cortado": round(cut_dur, 3),
        "pad_s": args.pad,
        "min_silencio_s": args.min_silencio,
        "editoriais": [[a, b] for a, b in editoriais],
        "keeps": [{"in": a, "out": b, "dur": round(b - a, 3)} for a, b in keeps],
        "cortes_silencio": [{"in": a, "out": b} for a, b in cortes_sil],
        "ancoras": {n: {"bruto": t, "cortado": round(to_cut(t), 3)}
                    for n, t in ancoras.items()},
    }

    (P / "saida").mkdir(parents=True, exist_ok=True)
    (P / "transcricao").mkdir(parents=True, exist_ok=True)
    (P / "saida/cortes.json").write_text(
        json.dumps(edl, indent=2, ensure_ascii=False), encoding="utf-8")
    (P / "transcricao/keeps.json").write_text(
        json.dumps([[a, b] for a, b in keeps], indent=2), encoding="utf-8")

    expr = "+".join(f"between(t,{a:.3f},{b:.3f})" for a, b in keeps)
    (P / "transcricao/select.txt").write_text(expr, encoding="utf-8")

    corte_total = args.duracao - cut_dur
    print(f"bruto {args.duracao:.1f}s → cortado {cut_dur:.1f}s  "
          f"(−{corte_total:.1f}s, {corte_total / args.duracao * 100:.0f}%)")
    print(f"takes mantidos: {len(keeps)}")
    print(f"cortes de silêncio: {len(cortes_sil)}   editoriais: {len(editoriais)}")

    if ancoras:
        print("\nâncoras (bruto → cortado):")
        for nome, t in ancoras.items():
            print(f"  {nome:24} {t:8.2f} → {to_cut(t):8.2f}")
        print("\nleve estes tempos para o plano.json. o bruto não serve mais.")

    if editoriais:
        print("\ncortes editoriais, para a etapa 9b:")
        for a, b in editoriais:
            print(f"  {a:8.2f} → {b:8.2f}   ({b - a:.1f}s)")
        print("\npegue no SRT do bruto uma frase literal de cada um destes")
        print("intervalos e escreva em transcricao/frases-proibidas.txt.")

    print("\ngravado:")
    print("  saida/cortes.json")
    print("  transcricao/keeps.json")
    print("  transcricao/select.txt")


if __name__ == "__main__":
    main()
