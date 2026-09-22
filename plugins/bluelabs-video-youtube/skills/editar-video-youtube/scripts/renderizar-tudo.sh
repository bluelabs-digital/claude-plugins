#!/usr/bin/env bash
# Renderiza as peças de motion em ProRes 4444 COM alpha.
#
# Duas armadilhas já pagas:
#
#  1. --pixel-format=yuva444p10le é OBRIGATÓRIO. Só --prores-profile=4444
#     devolve yuv422p12le, que não tem canal alpha, e a sobreposição sai
#     opaca por cima do vídeo. O script confere o pix_fmt de cada peça e
#     aborta se alguma sair sem alpha.
#
#  2. NÃO parsear a saída de `remotion compositions`. As barras de progresso
#     saem no stdout e viram falsos nomes de composição. A lista vem do
#     plano.json.
#
# Uso: bash renderizar-tudo.sh [--projeto .] [--forcar]
set -euo pipefail

PROJETO="."
FORCAR=0
while [ $# -gt 0 ]; do
  case "$1" in
    --projeto) PROJETO="$2"; shift 2 ;;
    --forcar)  FORCAR=1; shift ;;
    -h|--help) sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "opção desconhecida: $1" >&2; exit 2 ;;
  esac
done

cd "$PROJETO/motion" || { echo "não achei $PROJETO/motion" >&2; exit 2; }
[ -f plano.json ] || { echo "não achei motion/plano.json" >&2; exit 2; }

OUT="../saida/motion"
mkdir -p "$OUT"

IDS=$(node -e '
const p = require("./plano.json");
const ids = [];
if (p.abertura)   ids.push("Abertura");
if (p.lowerThird) ids.push("LowerThird");
for (const c of p.capitulos ?? []) ids.push("Cap" + c.n);
(p.destaques ?? []).forEach((_, i) => ids.push("Dest" + i));
if (p.conta)     ids.push("Conta");
if (p.telaFinal) ids.push("TelaFinal");
if (p.thumb)     ids.push("Thumb");
console.log(ids.join(" "));')

total=$(echo "$IDS" | wc -w | tr -d ' ')
echo "peças no plano: $total"

for c in $IDS; do
  if [ -f "$OUT/$c.mov" ] && [ "$FORCAR" -eq 0 ]; then
    echo "· $c já existe (use --forcar para refazer)"
    continue
  fi
  npx --yes remotion render src/index.ts "$c" "$OUT/$c.mov" \
    --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le \
    --image-format=png --log=error 2>&1 | tail -1
  pf=$(ffprobe -v error -show_entries stream=pix_fmt -of csv=p=0 "$OUT/$c.mov")
  case "$pf" in
    yuva*) echo "  ✓ $c  $(du -h "$OUT/$c.mov" | cut -f1)  $pf" ;;
    *)
      echo "  ✗ $c SAIU SEM ALPHA ($pf)"
      echo "    faltou --pixel-format=yuva444p10le. a sobreposição sairia opaca."
      exit 1
      ;;
  esac
done

echo "--- total ---"
du -sh "$OUT"
