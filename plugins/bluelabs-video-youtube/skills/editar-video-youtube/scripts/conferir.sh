#!/usr/bin/env bash
# Etapa 9 do pipeline. Confere o arquivo final antes de entregar.
#
# Cinco verificações:
#   1. duração bate com o EDL
#   2. loudness em -14 LUFS
#   3. nenhum silêncio acima de 0,4 s sobrou
#   4. nenhum trecho cortado voltou   ← a que mais pega erro
#   5. frames e emendas extraídos para você olhar
#
# A 4 precisa de transcricao/frases-proibidas.txt, uma frase por linha, com um
# pedaço literal da fala de cada corte editorial. Sem esse arquivo o script
# avisa e pula, mas a entrega não está conferida.
set -uo pipefail

PROJETO="."
ID=""
TOL_DUR=1.0          # segundos de tolerância na duração
ALVO_LUFS=-14.0
TOL_LUFS=1.0
MIN_SIL=0.4
MODELO="${WHISPER_MODELO:-$HOME/.cache/whisper-cpp/ggml-large-v3-turbo.bin}"

while [ $# -gt 0 ]; do
  case "$1" in
    --projeto) PROJETO="$2"; shift 2 ;;
    --id)      ID="$2"; shift 2 ;;
    --modelo)  MODELO="$2"; shift 2 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "opção desconhecida: $1" >&2; exit 2 ;;
  esac
done

cd "$PROJETO" || exit 2
[ -n "$ID" ] || { echo "faltou --id" >&2; exit 2; }

FINAL="saida/$ID-final.mp4"
EDL="saida/cortes.json"
PROIBIDAS="transcricao/frases-proibidas.txt"

[ -f "$FINAL" ] || { echo "não achei $FINAL" >&2; exit 2; }
mkdir -p saida/provas

falhas=0
avisos=0
reprova() { echo "  ✗ $1"; falhas=$((falhas + 1)); }
passa()   { echo "  ✓ $1"; }
avisa()   { echo "  ! $1"; avisos=$((avisos + 1)); }

echo "════ 1. duração"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$FINAL")
if [ -f "$EDL" ]; then
  esperado=$(python3 -c "import json;print(json.load(open('$EDL'))['duracao_cortado'])")
  delta=$(python3 -c "print(abs($dur - $esperado))")
  if python3 -c "import sys; sys.exit(0 if $delta <= $TOL_DUR else 1)"; then
    passa "$(printf '%.2f' "$dur")s, bate com o EDL ($(printf '%.2f' "$esperado")s)"
  else
    reprova "$(printf '%.2f' "$dur")s, mas o EDL diz $(printf '%.2f' "$esperado")s (${delta}s de diferença)"
    echo "     o .mlt provavelmente aponta para o bruto, não para midia/cortado.mp4"
  fi
else
  avisa "$(printf '%.2f' "$dur")s, sem $EDL para comparar"
fi

echo "════ 2. loudness"
lufs=$(ffmpeg -hide_banner -nostats -i "$FINAL" -af ebur128=framelog=quiet -f null - 2>&1 \
       | grep -E "^\s+I:" | tail -1 | grep -oE '\-?[0-9.]+' | head -1)
if [ -n "$lufs" ]; then
  if python3 -c "import sys; sys.exit(0 if abs($lufs - ($ALVO_LUFS)) <= $TOL_LUFS else 1)"; then
    passa "$lufs LUFS"
  else
    reprova "$lufs LUFS, o alvo do YouTube é $ALVO_LUFS"
    echo "     refaça o loudnorm de duas passagens com os measured_* desta gravação"
  fi
else
  avisa "não consegui medir o loudness"
fi

echo "════ 3. silêncios restantes"
ffmpeg -hide_banner -nostats -i "$FINAL" -af "silencedetect=noise=-30dB:d=$MIN_SIL" \
  -f null - 2> saida/provas/silencio-final.txt
longos=$(grep -oE 'silence_duration: [0-9.]+' saida/provas/silencio-final.txt \
         | awk -v m="$MIN_SIL" '{ if ($2 > m) print $2 }')
if [ -z "$longos" ]; then
  passa "nenhum silêncio acima de ${MIN_SIL}s"
else
  n=$(echo "$longos" | wc -l | tr -d ' ')
  reprova "$n silêncio(s) acima de ${MIN_SIL}s, o maior com $(echo "$longos" | sort -rn | head -1)s"
  echo "     o corte não pegou, ou o limiar do silencedetect errou. refaça, não entregue"
fi

echo "════ 4. trechos cortados que voltaram"
if [ ! -f "$PROIBIDAS" ]; then
  avisa "sem $PROIBIDAS, não dá para conferir"
  echo "     escreva uma frase literal de cada corte editorial do $EDL, uma por linha"
  echo "     tire do SRT do BRUTO, nos intervalos listados em \"editoriais\""
elif ! command -v whisper-cli >/dev/null 2>&1; then
  avisa "whisper-cli não encontrado, pulando"
elif [ ! -f "$MODELO" ]; then
  avisa "modelo não encontrado em $MODELO"
  echo "     aponte com --modelo ou com a variável WHISPER_MODELO"
else
  if [ ! -f saida/conferencia.txt ]; then
    echo "  · transcrevendo o arquivo final (não o bruto)"
    ffmpeg -v error -y -i "$FINAL" -map 0:a:0 -ac 1 -ar 16000 -c:a pcm_s16le \
      saida/conferencia.wav
    whisper-cli -m "$MODELO" -f saida/conferencia.wav -l pt -t 8 -otxt \
      --output-file saida/conferencia >/dev/null 2>&1
    rm -f saida/conferencia.wav
  fi
  if [ ! -f saida/conferencia.txt ]; then
    avisa "a transcrição do final não saiu"
  else
    achou=0
    while IFS= read -r frase; do
      [ -z "$frase" ] && continue
      case "$frase" in \#*) continue ;; esac
      if grep -qiF -- "$frase" saida/conferencia.txt; then
        reprova "voltou para o vídeo: \"$frase\""
        achou=$((achou + 1))
      fi
    done < "$PROIBIDAS"
    if [ "$achou" -eq 0 ]; then
      passa "nenhuma das frases cortadas aparece no final"
    else
      echo "     causas prováveis, nesta ordem:"
      echo "       todas voltaram   → o .mlt aponta para o bruto"
      echo "       uma voltou       → o par início:fim daquele corte está errado no EDL"
      echo "       depois de editar → o Shotcut salvou por cima do .mlt"
    fi
  fi
fi

echo "════ 5. provas para olhar"
if [ -f "$EDL" ] && [ -f motion/plano.json ]; then
  python3 - "$FINAL" <<'PY'
import json, subprocess, sys, pathlib
plano = json.load(open("motion/plano.json"))
final = sys.argv[1]
pts = []
for chave in ("abertura", "lowerThird", "conta", "telaFinal"):
    if chave in plano and isinstance(plano[chave], dict) and "em" in plano[chave]:
        pts.append((chave, plano[chave]["em"]))
for c in plano.get("capitulos", []):
    pts.append(("cap" + str(c.get("n", "")), c["em"]))
for i, d in enumerate(plano.get("destaques", [])):
    pts.append(("dest%d" % i, d["em"]))
pathlib.Path("saida/provas").mkdir(parents=True, exist_ok=True)
for nome, t in pts:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(t + 1),
                    "-i", final, "-frames:v", "1",
                    "saida/provas/%s.png" % nome], check=False)
print("  · %d frame(s) em saida/provas/" % len(pts))
PY
else
  avisa "sem motion/plano.json, não extraí frames de sobreposição"
fi

if [ -f "$EDL" ]; then
  python3 - "$FINAL" "$EDL" <<'PY'
import json, subprocess, sys
final, edl = sys.argv[1], sys.argv[2]
d = json.load(open(edl))
keeps = d["keeps"]
edit = {tuple(e) for e in d.get("editoriais", [])}
acc, n = 0.0, 0
for i, k in enumerate(keeps[:-1]):
    acc += k["out"] - k["in"]
    prox = keeps[i + 1]["in"]
    if any(a < prox and b > k["out"] for a, b in edit):
        ini = max(acc - 2, 0)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(ini), "-t", "4",
                        "-i", final, "-c", "copy",
                        "saida/provas/emenda-%.0f.mp4" % acc], check=False)
        n += 1
print("  · %d emenda(s) editorial(is) em saida/provas/, assista uma por uma" % n)
PY
fi

echo
echo "════════════════════════════════════════"
if [ "$falhas" -gt 0 ]; then
  echo "REPROVADO: $falhas problema(s). não entregue."
  exit 1
fi
if [ "$avisos" -gt 0 ]; then
  echo "PASSOU COM $avisos AVISO(S). resolva antes de chamar de pronto."
  exit 0
fi
echo "PASSOU. agora olhe os frames e as emendas em saida/provas/ antes de entregar."
