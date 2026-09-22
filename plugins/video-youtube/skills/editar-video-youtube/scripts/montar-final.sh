#!/usr/bin/env bash
# Montagem final. O melt compõe o vídeo a partir do .mlt e o ffmpeg trata o
# áudio separadamente.
#
# O áudio fica FORA do melt de propósito: sem corte temporal ele segue em
# sincronia, e o loudnorm no ffmpeg é mais previsível.
#
# Uso:
#   bash montar-final.sh --projeto . --id meuvideo
#
# Sem --measured-* o script roda a 1ª passagem do loudnorm, imprime os valores
# e para. Rode de novo passando os valores. São DAQUELA gravação e não se
# reaproveitam entre vídeos.
set -euo pipefail

PROJETO="."; ID=""; V=""
MI=""; MTP=""; MLRA=""; MTHRESH=""; OFFSET="0.0"
MELT="${MELT:-/Applications/Shotcut.app/Contents/MacOS/melt}"

while [ $# -gt 0 ]; do
  case "$1" in
    --projeto)           PROJETO="$2"; shift 2 ;;
    --id)                ID="$2"; shift 2 ;;
    --base)              V="$2"; shift 2 ;;
    --measured-i)        MI="$2"; shift 2 ;;
    --measured-tp)       MTP="$2"; shift 2 ;;
    --measured-lra)      MLRA="$2"; shift 2 ;;
    --measured-thresh)   MTHRESH="$2"; shift 2 ;;
    --offset)            OFFSET="$2"; shift 2 ;;
    -h|--help) sed -n '2,15p' "$0"; exit 0 ;;
    *) echo "opção desconhecida: $1" >&2; exit 2 ;;
  esac
done

cd "$PROJETO" || exit 2
[ -n "$ID" ] || { echo "faltou --id" >&2; exit 2; }
[ -n "$V" ] || V="midia/cortado.mp4"
[ -f "$V" ] || { echo "não achei a base $V (é o vídeo JÁ CORTADO)" >&2; exit 2; }
[ -f "saida/$ID.mlt" ] || { echo "não achei saida/$ID.mlt, rode gerar-mlt.mjs" >&2; exit 2; }
[ -x "$MELT" ] || { echo "não achei o melt em $MELT (aponte com MELT=)" >&2; exit 2; }

# O Shotcut aberto salva o estado em memória por cima do .mlt ao fechar, e o
# render sai válido, sem erro, e sem as mudanças.
if pgrep -x Shotcut >/dev/null 2>&1; then
  echo "ABORTADO: feche o Shotcut." >&2
  echo "Com o projeto aberto, ao fechar ele grava o estado antigo por cima do" >&2
  echo ".mlt gerado por script. O render sai sem as mudanças e sem erro." >&2
  exit 1
fi

if [ -z "$MI" ]; then
  echo "1ª passagem do loudnorm (medindo esta gravação)"
  ffmpeg -hide_banner -nostats -i "$V" -map 0:a:0 \
    -af "highpass=f=70,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" \
    -f null - 2>&1 | sed -n '/^{/,/^}/p'
  echo
  echo "rode de novo com os valores acima:"
  echo "  bash montar-final.sh --projeto $PROJETO --id $ID \\"
  echo "    --measured-i <input_i> --measured-tp <input_tp> \\"
  echo "    --measured-lra <input_lra> --measured-thresh <input_thresh> \\"
  echo "    --offset <target_offset>"
  exit 0
fi

echo "1/3 · compondo o vídeo pelo .mlt"
"$MELT" "saida/$ID.mlt" -consumer avformat:"saida/tmp-video.mp4" \
  vcodec=libx264 crf=16 preset=medium pix_fmt=yuv420p an=1 \
  progress=0 2>/dev/null >/dev/null

echo "2/3 · áudio: passa-alta 70Hz e loudnorm para -14 LUFS"
ffmpeg -v error -y -i "$V" -map 0:a:0 \
  -af "highpass=f=70,loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$MI:measured_TP=$MTP:measured_LRA=$MLRA:measured_thresh=$MTHRESH:offset=$OFFSET:linear=true" \
  -c:a aac -b:a 192k "saida/tmp-audio.m4a"

echo "3/3 · juntando (sem reencodar o vídeo)"
# 16:9 não leva legenda queimada. Vídeo longo usa legenda ativável no YouTube,
# e o SRT ainda ajuda no ranqueamento. Queimar é regra de vertical.
ffmpeg -v error -y -i "saida/tmp-video.mp4" -i "saida/tmp-audio.m4a" \
  -map 0:v -map 1:a -c copy -movflags +faststart \
  "saida/$ID-final.mp4"
rm -f "saida/tmp-video.mp4" "saida/tmp-audio.m4a"

echo "--- conferência rápida ---"
ffprobe -v error -show_entries format=duration,size \
  -show_entries stream=codec_name,width,height \
  -of default=noprint_wrappers=1 "saida/$ID-final.mp4" | sed 's/^/  /'
ffmpeg -hide_banner -nostats -i "saida/$ID-final.mp4" -af ebur128=framelog=quiet \
  -f null - 2>&1 | grep -E "^\s+I:" | tail -1 | sed 's/^/  loudness final:/'

echo
echo "agora rode a etapa 9, que é onde os erros aparecem:"
echo "  bash scripts/conferir.sh --projeto . --id $ID"
