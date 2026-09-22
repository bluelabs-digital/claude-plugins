# Armadilhas, indexadas pelo sintoma

Todas estas já aconteceram em produção. A maioria não dá erro, ela entrega o
arquivo errado em silêncio, que é o que torna a etapa 9 obrigatória.

Procure pelo sintoma.

---

## A sobreposição não aparece no vídeo

**A peça saiu sem canal alpha.** `--prores-profile=4444` sozinho devolve
`yuv422p12le`, que não tem alpha, e a peça cobre o vídeo em vez de compor.

```bash
ffprobe -v error -show_entries stream=pix_fmt -of csv=p=0 peca.mov
# tem que começar com yuva
```

Solução: `--pixel-format=yuva444p10le` no render. O `renderizar-tudo.sh` já
confere cada peça e aborta se alguma sair sem alpha.

**Ou a `cairoblend` está desabilitada.** O Shotcut grava
`<property name="disable">1</property>` na transição `frei0r.cairoblend` da
faixa de baixo. Abre certo na interface, mas no `melt` o vídeo passa e nenhuma
sobreposição aparece.

Solução: `disable=0` em todas. O `gerar-mlt.mjs` já gera assim.

---

## O vídeo saiu com segundos em vez de minutos

Timecode em texto com `avformat-novalidate` sem `length` colapsa a timeline.
Oito minutos viraram treze segundos, e o render saiu vazio sem erro.

Solução: tudo em número de frame, nunca timecode em texto.

---

## Renderizei de novo e as mudanças não entraram

O Shotcut estava aberto. Ao fechar, ele salva o estado em memória por cima do
`.mlt` gerado por script. O arquivo continua válido, só é a versão antiga, e o
render sai sem erro nenhum.

Solução: feche o Shotcut antes de gerar e de renderizar. O `montar-final.sh`
aborta se detectar o aplicativo rodando.

---

## O projeto abre vazio no Shotcut, mas o melt renderiza

Falta o que a interface exige e o motor não. Produtor `black`, playlist
`background` na faixa 0, faixas nomeadas V1, V2 e por diante, e transições
`mix` mais `cairoblend` por faixa.

Solução: use o `gerar-mlt.mjs`, que já monta tudo isso.

---

## O `remotion compositions` devolveu nomes que não existem

As barras de progresso saem no stdout e viram falsos nomes quando você parseia
a saída.

Solução: nunca parseie. A lista de peças vem do seu `plano.json`.

---

## O texto saiu mais fino do que o desenhado

A fonte instala cada peso como família própria, com nome interno diferente do
que o CSS pede, então `font-weight: 900` resolve para a face errada. É comum em
fonte comprada e não dá erro nenhum.

```bash
fc-list | grep -i "<nome da fonte>"
```

Solução: `@font-face` por arquivo de peso, injetado pelo `Fontes.tsx`. A skill
`criar-manual-de-marca` gera esse bloco.

---

## O whisper não acha o modelo

Pode haver dois whisper instalados, `whisper-cli` do whisper.cpp e `whisper` do
openai-whisper em Python, e duas pastas de cache com nome quase igual.

```
~/.cache/whisper-cpp/    com hífen
~/.cache/whisper.cpp/    com ponto
```

Solução: confira qual existe, ou aponte com `WHISPER_MODELO`.

---

## O corte ficou no meio da palavra

O `silencedetect` mordeu um fonema, normalmente sibilante, com o limiar alto
demais.

Solução: rode em `-25dB`, `-30dB` e `-35dB` e cruze. Vale o intervalo que é
mudo de verdade no waveform. Recue o ponto até o buraco real.

---

## As sobreposições estão todas fora de lugar

O `plano.json` está no relógio do bruto, e a base é o cortado. Depois do corte
o relógio muda.

Solução: o mapa de âncoras que o `cortar.py` imprime traduz cada marcação de
bruto para cortado. Toda marcação anotada assistindo ao bruto passa por ele
antes de virar plano.

---

## Um trecho que eu cortei está no vídeo final

Esta é a que a etapa 9b existe para pegar. Três causas, nesta ordem de
probabilidade.

| Sintoma | Causa |
|---|---|
| Todos os trechos voltaram | O `.mlt` aponta para o bruto, não para `midia/cortado.mp4` |
| Um trecho voltou | O par início:fim daquele corte editorial está errado no EDL |
| Voltaram depois de uma reedição | O Shotcut salvou por cima do `.mlt` |

Solução: `conferir.sh` transcreve o arquivo final e procura as frases de
`transcricao/frases-proibidas.txt`. Qualquer ocorrência reprova a entrega.

---

## O áudio está baixo no YouTube

Gravação caseira costuma sair entre -18 e -20 LUFS, e o alvo é -14. Numa
gravação real essa foi a mudança mais audível do vídeo inteiro.

Solução: `loudnorm` em duas passagens, medindo primeiro e aplicando com os
`measured_*`. Os valores são daquela gravação e não se reaproveitam entre
vídeos.

---

## `xml.etree` falha no Python

Em algumas instalações do Homebrew o `pyexpat` quebra, com
`Symbol not found: _XML_SetAllocTrackerActivationThreshold`, e qualquer script
que use `xml.etree` falha.

Solução: valide o XML com Node, ou reinstale `expat` e o Python.

---

## As duas faixas de áudio são idênticas

O OBS gravou o mesmo mix em "Microfone" e "Som do sistema". Não há áudio de
sistema separado e metade do peso de áudio é desperdício.

Solução: separe as fontes por faixa na gravação, ou grave só uma.

---

## Montei 17 peças de motion e usei 5

O erro mais caro do pipeline, e não é técnico. As peças foram planejadas lendo
só a transcrição. Na hora de compor, os slides já eram o motion graphics, com
os mesmos números, e a câmera em PiP ocupava o canto onde a faixa de capítulo
passaria.

Solução: etapa 5. Extraia um frame em cada ponto planejado e monte um contact
sheet **antes** de desenhar qualquer coisa.
