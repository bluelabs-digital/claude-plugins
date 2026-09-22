#!/usr/bin/env bash
# Confere o que o pipeline precisa e diz o que falta, com o comando de instalar.
# Não instala nada sozinho.
set -uo pipefail

falta=0
ok()    { printf '  ✓ %-14s %s\n' "$1" "$2"; }
nao()   { printf '  ✗ %-14s %s\n' "$1" "$2"; falta=$((falta + 1)); }
aviso() { printf '  ! %-14s %s\n' "$1" "$2"; }

echo "════ ferramentas"

if command -v ffmpeg >/dev/null 2>&1; then
  v=$(ffmpeg -version 2>/dev/null | head -1 | awk '{print $3}')
  ok ffmpeg "$v  $(command -v ffmpeg)"
  cfg=$(ffmpeg -hide_banner -buildconf 2>/dev/null)
  for lib in libass frei0r libx264; do
    echo "$cfg" | grep -q -- "--enable-$lib" \
      && ok "  $lib" "presente" \
      || nao "  $lib" "faltando. no macOS, brew install ffmpeg-full resolve"
  done
else
  nao ffmpeg "brew install ffmpeg-full   (a fórmula completa, não a enxuta)"
fi

command -v ffprobe >/dev/null 2>&1 \
  && ok ffprobe "$(command -v ffprobe)" \
  || nao ffprobe "vem junto com o ffmpeg"

if command -v whisper-cli >/dev/null 2>&1; then
  ok whisper-cli "$(command -v whisper-cli)"
else
  nao whisper-cli "brew install whisper-cpp"
  if command -v whisper >/dev/null 2>&1; then
    aviso "" "existe um 'whisper' (openai-whisper, Python). não é o mesmo."
  fi
fi

echo "════ modelo do whisper"
MODELO="${WHISPER_MODELO:-}"
if [ -z "$MODELO" ]; then
  for c in "$HOME/.cache/whisper-cpp/ggml-large-v3-turbo.bin" \
           "$HOME/.cache/whisper.cpp/ggml-large-v3-turbo.bin" \
           "$HOME/.cache/whisper-cpp/ggml-large-v3.bin"; do
    [ -f "$c" ] && { MODELO="$c"; break; }
  done
fi
if [ -n "$MODELO" ] && [ -f "$MODELO" ]; then
  ok modelo "$(du -h "$MODELO" | cut -f1)  $MODELO"
else
  nao modelo "baixe o ggml-large-v3-turbo.bin"
  echo "                 há DUAS pastas de cache com nome parecido:"
  echo "                   ~/.cache/whisper-cpp/   (hífen)  ← whisper.cpp"
  echo "                   ~/.cache/whisper.cpp/   (ponto)"
  echo "                 apontar para a errada não acha o modelo, e o erro não é óbvio."
  echo "                 aponte com WHISPER_MODELO=<caminho> se estiver em outro lugar."
fi

echo "════ melt (motor do Shotcut)"
MELT="${MELT:-}"
if [ -z "$MELT" ]; then
  for c in /Applications/Shotcut.app/Contents/MacOS/melt \
           "$HOME/Applications/Shotcut.app/Contents/MacOS/melt" \
           "$(command -v melt 2>/dev/null)"; do
    [ -n "$c" ] && [ -x "$c" ] && { MELT="$c"; break; }
  done
fi
if [ -n "$MELT" ]; then
  ok melt "$MELT"
else
  nao melt "instale o Shotcut. o melt vem dentro do aplicativo."
  echo "                 macOS:  brew install --cask shotcut"
  echo "                 aponte com MELT=<caminho> se instalou fora do padrão."
fi
if pgrep -x Shotcut >/dev/null 2>&1; then
  aviso Shotcut "está aberto. FECHE antes de gerar ou renderizar o .mlt:"
  echo "                 ao fechar, ele salva o estado em memória por cima do"
  echo "                 arquivo gerado por script, e o render sai sem as mudanças."
fi

echo "════ node e remotion"
if command -v node >/dev/null 2>&1; then
  ok node "$(node --version)"
else
  nao node "necessário para o Remotion e para gerar o .mlt"
fi
command -v npx >/dev/null 2>&1 && ok npx "$(command -v npx)" || nao npx "vem com o node"
echo "                 no projeto: npm install remotion @remotion/cli react react-dom"
echo "                 NÃO use npx create-video, é interativo e trava a sessão."

echo "════ manual de marca"
MANUAL="${MANUAL_MARCA:-}"
if [ -z "$MANUAL" ]; then
  for c in marca/manual.md ../marca/manual.md ../../marca/manual.md; do
    [ -f "$c" ] && { MANUAL="$c"; break; }
  done
fi
if [ -n "$MANUAL" ] && [ -f "$MANUAL" ]; then
  ok manual "$MANUAL"
else
  nao manual "não achei marca/manual.md"
  echo "                 rode a skill criar-manual-de-marca antes de editar."
  echo "                 sem manual o pipeline para, de propósito: cor e fonte"
  echo "                 chutadas num vídeo publicado custam mais que a conversa."
fi

echo
if [ "$falta" -gt 0 ]; then
  echo "faltam $falta item(ns). resolva antes de começar."
  exit 1
fi
echo "ambiente pronto."
