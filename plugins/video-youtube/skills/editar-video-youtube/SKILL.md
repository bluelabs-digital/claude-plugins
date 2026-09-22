---
name: editar-video-youtube
description: Edita localmente uma gravação em 16:9 e entrega o vídeo pronto para o YouTube, com MP4 final, thumbnail, legenda SRT, capítulos para a descrição e um projeto Shotcut editável. Corta silêncios e takes errados, normaliza o áudio para -14 LUFS e compõe motion graphics no Remotion. Roda com FFmpeg, whisper.cpp e Remotion na própria máquina, sem enviar a mídia para nenhum serviço. Use quando o pedido for editar, finalizar, montar ou dar acabamento a um vídeo para o YouTube, limpar pausas e erros de uma gravação, gerar legenda e capítulos, ou transformar um take bruto em vídeo publicável.
---

# Editar vídeo para YouTube, localmente

Pipeline em nove etapas.

**marca → ambiente → transcrever → cortar → ler a transcrição → olhar a tela →
motion → montar → conferir**

Entrega MP4 pronto **e** projeto editável, para o dono poder mexer depois.

Esta skill trata **vídeo horizontal 16:9**, que é o formato de vídeo longo do
YouTube. Vertical (Shorts, Reels, TikTok) tem outras regras, principalmente a
legenda queimada, e vive em outra skill.

---

## 0. Marca — antes de qualquer coisa

Este pipeline não tem marca própria. Cor, fonte, logo e régua editorial vêm de
um **manual de marca** que fica no projeto de quem usa.

Procure nesta ordem.

1. O caminho em `MANUAL_MARCA`, se a variável de ambiente existir
2. `marca/manual.md` na pasta do projeto de vídeo
3. `marca/manual.md` na raiz do repositório onde o Claude está rodando

**Se não achar, pare.** Não invente cor, não use o padrão de nenhum exemplo, e
não siga adiante com um cinza qualquer. Chame a skill `criar-manual-de-marca`,
que faz as perguntas certas e grava o manual mais o `marca.ts` que os
componentes consomem. Leva poucos minutos e vale para todos os vídeos seguintes.

Achou o manual, leia inteiro antes de desenhar qualquer coisa. Dele saem.

| Do manual | Para onde vai |
|---|---|
| Cor de acento, apoio, fundo, texto | `scripts/componentes/marca.ts` |
| Fonte e pesos | `marca.ts` e o `@font-face` em `Fontes.tsx` |
| Logo | `motion/public/` e o campo `logo` do `marca.ts` |
| Régua editorial e travas de compliance | Etapa 5, o que pode ir para a tela |

Os componentes leem `marca.accent`, nunca hex solto no JSX. Se você está
escrevendo um hex dentro de um `.tsx`, parou de seguir o manual.

---

## 1. Ambiente — confira antes de começar

```bash
bash scripts/checar-ambiente.sh
```

O script procura cada ferramenta e diz o que falta. O que o pipeline precisa.

| Ferramenta | Para que |
|---|---|
| `ffmpeg` e `ffprobe` | Tudo. Precisa de `libass`, `frei0r` e suporte a alpha |
| `whisper-cli` (whisper.cpp) | Transcrição |
| modelo `ggml-large-v3-turbo.bin` | Transcrição |
| `melt` (vem com o Shotcut) | Compõe a timeline sem abrir a interface |
| `node` e `npx` | Remotion e geração do `.mlt` |

Duas armadilhas de instalação que já custaram tempo.

**Pode haver dois whisper na máquina.** `whisper-cli` é o whisper.cpp em C++,
`whisper` é o openai-whisper em Python. Os modelos ficam em pastas de nome
parecido, `~/.cache/whisper-cpp/` com hífen e `~/.cache/whisper.cpp/` com
ponto. Apontar para a errada não acha o modelo turbo e o erro não é óbvio.

**Não use `npx create-video` para criar o projeto Remotion.** Ele é interativo
e trava a sessão. Instale direto.

```bash
npm install remotion @remotion/cli react react-dom
```

### Estrutura do projeto

```
video-<id>/
├── marca/           manual.md e assets da marca (ou aponte MANUAL_MARCA)
├── midia/           bruto, remux e o cortado.mp4
├── transcricao/     WAV 16k, SRT, VTT, JSON, deteção de silêncio, EDL
├── motion/          projeto Remotion
│   ├── src/         marca.ts e componentes
│   ├── plano.json   o plano de edição
│   ├── gerar-mlt.mjs
│   ├── renderizar-tudo.sh
│   └── montar-final.sh
├── tela/            frames e contact sheet da etapa 6
└── saida/           .mlt, peças ProRes, MP4 final, thumb, SRT, provas
```

### Orientação, leia o frame depois do autorotate

Celular costuma gravar 3840×2160 com `rotation: -90` nos metadados, e o ffmpeg
aplica a matriz sozinho. **Depois disso**, se `height > width` o vídeo é
vertical e não é caso desta skill. Paisagem sai em 1920×1080.

---

## 2. Transcrever

```bash
ffmpeg -v error -y -i "$V" -map 0:a:0 -ac 1 -ar 16000 -c:a pcm_s16le \
  transcricao/mic16k.wav

whisper-cli -m ~/.cache/whisper-cpp/ggml-large-v3-turbo.bin \
  -f transcricao/mic16k.wav -l pt -t 8 -pp -osrt -ovtt -oj \
  --output-file transcricao/<id>
```

O `-oj` gera o JSON com tempo por segmento, que é o que a etapa 4 usa.

---

## 3. Cortar — obrigatório, e antes de planejar

São **dois tipos de corte** e os dois entram no mesmo EDL.

### 3a. Silêncio

Silêncio **acima de 0,4 s** sai. Em cada ponta do corte ficam **0,1 s**, então
a emenda tem no máximo **0,2 s**. Não é gosto, é ritmo.

Detecte no áudio extraído, nunca no SRT. O Whisper cola a pausa dentro da
palavra e o tempo dele não serve para corte.

```bash
ffmpeg -i transcricao/mic16k.wav -af silencedetect=noise=-30dB:d=0.4 \
  -f null - 2> transcricao/silencio-30.txt
```

Se o limiar engolir sibilante ou deixar respiro alto, rode também em `-35dB` e
`-25dB` e cruze os três. Vale o intervalo que é mudo de verdade no waveform.

| | tempo |
|---|---|
| Corta a partir de | `in + 0,1 s` |
| Corta até | `out − 0,1 s` |
| O que some | o miolo, `out − in − 0,2` |
| O que fica na emenda | `0,1 + 0,1 = 0,2 s` |

Silêncio de `0,4 s` ou menos permanece. Começo e fim seguem a mesma conta, sobra
`0,1 s` antes da primeira fala e `0,1 s` depois da última.

Não corte no meio da palavra. Se o `silencedetect` morder um fonema, recue o
ponto até o buraco real. Trecho mantido com menos de `0,08 s` some, porque não
é fala, é resíduo de detecção.

### 3b. Corte editorial — o take errado

Silêncio longo entre duas falas parecidas quase nunca é ritmo. É o take errado
ainda no vídeo. Isso **sai do corte**, não só da legenda.

O que entra na lista de cortes editoriais.

- Falso começo e frase que morre no meio, do tipo `de qualquer...`
- Retake. Fica a **segunda** fala, que é a correção
- A pessoa pedindo corte em voz alta, do tipo `corta essa parte`
- CTA falado duas vezes
- Caçada na tela, procurando aba, arquivo ou menu enquanto fala
- Interrupção externa, campainha, celular, alguém entrando

Anote cada um como par `início → fim` no tempo do **bruto**.

### 3c. Gerar o EDL e cortar

`scripts/cortar.py` junta os dois tipos, resolve sobreposição, gera os trechos
mantidos e grava tudo.

```bash
python3 scripts/cortar.py --projeto . --duracao 640.033 \
  --silencio transcricao/silencio-30.txt \
  --editorial 190.50:196.00 --editorial 487.55:558.32 \
  --ancora fala_inicia=1.47 --ancora tres_passos=196.00
```

Ele escreve três coisas.

| Arquivo | Para que |
|---|---|
| `saida/cortes.json` | O EDL. Bruto, cortado, pad, editoriais, keeps e cortes de silêncio |
| `transcricao/keeps.json` | Só os pares mantidos, para outros scripts lerem |
| `transcricao/select.txt` | A expressão `select` do ffmpeg que faz o corte |

E imprime o **mapa de âncoras**, que é o que evita o erro mais chato desta
etapa. Toda marcação que você anotou assistindo ao bruto, capítulo, destaque,
tela final, está no relógio do bruto. Depois do corte o relógio muda. O mapa
traduz cada âncora de bruto para cortado.

```
âncoras (bruto → cortado):
  fala_inicia               1.47 →    0.10
  tres_passos             196.00 →  181.03
```

Aplique o corte.

```bash
ffmpeg -y -i "$V" \
  -vf "select='$(cat transcricao/select.txt)',setpts=N/FRAME_RATE/TB" \
  -af "aselect='$(cat transcricao/select.txt)',asetpts=N/SR/TB" \
  -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k \
  midia/cortado.mp4
```

**Confira o corte agora, não depois.**

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 midia/cortado.mp4
ffmpeg -i midia/cortado.mp4 -af silencedetect=noise=-30dB:d=0.4 -f null - \
  2> transcricao/silencio-cortado.txt
grep -c silence_start transcricao/silencio-cortado.txt
```

A duração tem que bater com `duracao_cortado` do EDL. Nenhum silêncio restante
pode passar de 0,4 s.

**O `.mlt` e o `plano.json` nascem no vídeo já cortado.** Remapeie o SRT para
essa timeline antes de usar. Não monte overlay em cima do bruto.

---

## 4. Ler a transcrição inteira

Não pule e não leia por cima. Dela saem os capítulos reais, os números ditos e
o gancho de abertura.

**Nunca acrescente número, afirmação ou garantia que não esteja na fala.** Se o
manual da marca tiver trava de compliance, ela vale aqui e vale em dobro no que
vai queimado na tela. Só destaque o que a pessoa disse.

Se o manual proíbe algum caractere ou construção, a proibição vale em título,
kicker, lower third, thumbnail e SRT, não só no texto do post.

---

## 5. Olhar a tela antes de desenhar

**Esta é a etapa que mais economiza trabalho, e a mais pulada.**

Num vídeo real com apresentação, 17 peças de motion foram montadas lendo só a
transcrição. Na hora de compor, 12 foram descartadas. Os slides já eram o motion
graphics, com os mesmos números e as mesmas setas, e a câmera em PiP ficava no
canto inferior direito, exatamente onde a faixa de capítulo passaria.

Extraia um frame em cada ponto onde você pensa em pôr alguma coisa e monte um
contact sheet.

```bash
ffmpeg -v error -y -ss <t> -i midia/cortado.mp4 -frames:v 1 -vf scale=300:-1 \
  tela/<nome>.png

cd tela && ffmpeg -pattern_type glob -i "*.png" \
  -filter_complex "tile=5x4:margin=6:padding=4" -frames:v 1 ../contato.png
```

Três regras que saem disso.

**Sobreposição só em trecho de câmera limpa.** Se a tela já mostra o número,
pôr um painel com o mesmo número polui em vez de valorizar.

**Capítulo que duplica título de slide vai para a descrição**, onde é clicável e
realmente útil, não para a tela.

**Interface de app na gravação se resolve com recorte.** Barra de ferramentas ou
aba no topo some com um crop reenquadrado em 16:9, que dá um zoom pequeno e
limpa sem distorcer.

```bash
crop=1813:1020:53:60     # exemplo, 5,9% de zoom em 1920x1080
```

Só agora escreva o `plano.json`. Modelo em `scripts/plano.exemplo.json`, com os
tempos **já no relógio do cortado**.

---

## 6. Motion no Remotion

Leia os tokens da marca antes de desenhar. Os componentes em
`scripts/componentes/` já consomem `marca.ts`.

Se a fonte da marca instala cada peso como família própria, o que é comum em
fonte comprada, registre `@font-face` por arquivo em `Fontes.tsx`. Sem isso o
`font-weight` resolve a face errada e o texto sai com o peso errado, sem erro
nenhum. A `criar-manual-de-marca` gera esse bloco pronto.

```bash
npx remotion render src/index.ts <Comp> out.mov \
  --codec=prores --prores-profile=4444 --pixel-format=yuva444p10le \
  --image-format=png
```

**`--pixel-format=yuva444p10le` é obrigatório.** Só `--prores-profile=4444`
devolve `yuv422p12le`, que não tem canal alpha, e a sobreposição sai opaca por
cima do vídeo. Confira sempre depois de renderizar.

```bash
ffprobe -v error -show_entries stream=pix_fmt -of csv=p=0 out.mov
# tem que começar com yuva
```

**Não parseie a saída de `remotion compositions`.** As barras de progresso saem
no stdout e viram falsos nomes de composição. A lista de peças vem do seu
`plano.json`. O `scripts/renderizar-tudo.sh` já faz assim e aborta se alguma
peça sair sem alpha.

---

## 7. Gerar o .mlt e conferir que compõe

Use `scripts/gerar-mlt.mjs` como base. Quatro regras que não se desfazem.

**Tudo em número de frame.** Timecode em texto com `avformat-novalidate` sem
`length` colapsa a timeline. Oito minutos viram treze segundos e o render sai
vazio.

**`disable=0` em todas as `frei0r.cairoblend`.** O Shotcut grava `disable=1` na
transição da faixa de baixo. Abre certo na interface, mas no `melt` o vídeo
passa e **nenhuma sobreposição aparece**.

**A interface do Shotcut exige** produtor `black`, playlist `background` na
faixa 0, faixas nomeadas V1, V2 e por aí, e transições `mix` mais `cairoblend`
por faixa. Sem isso renderiza no `melt` mas abre vazio no aplicativo.

**Nunca remende este arquivo por substituição de texto.** Escape de template
aninhado já quebrou o XML e o próprio script. Se precisar mudar, reescreva
inteiro.

Depois de gerar, extraia um frame e olhe. XML válido porém errado renderiza em
silêncio, sem erro nenhum.

> Se o Python da máquina estiver com o `pyexpat` quebrado, sintoma
> `Symbol not found: _XML_SetAllocTrackerActivationThreshold`, qualquer script
> com `xml.etree` falha. Valide o XML com Node.

---

## 8. Montar

**Feche o Shotcut antes.** Com o projeto aberto, fechar o aplicativo salva o
estado em memória por cima do `.mlt` gerado por script. O render sai sem erro e
sem as mudanças, porque o arquivo é válido, só velho. O `montar-final.sh` aborta
se detectar o aplicativo rodando.

O áudio fica **fora do melt** de propósito. Sem corte temporal ele segue em
sincronia e o `loudnorm` no ffmpeg é mais previsível.

Alvo do YouTube, **-14 LUFS**, em duas passagens. Meça a gravação, depois
aplique com os valores medidos. **Meça a cada vídeo**, os números são daquela
gravação e não se reaproveitam.

```bash
# 1ª passagem, medir
ffmpeg -i midia/cortado.mp4 -map 0:a:0 \
  -af "highpass=f=70,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json" -f null -

# 2ª passagem, aplicar com measured_I / measured_TP / measured_LRA /
# measured_thresh / offset, e linear=true
```

Mux em 16:9 com `-c copy`, sem reencodar.

```bash
ffmpeg -y -i saida/tmp-video.mp4 -i saida/tmp-audio.m4a \
  -map 0:v -map 1:a -c copy -movflags +faststart saida/<id>-final.mp4
```

**Não queime legenda em vídeo horizontal.** Vídeo longo usa legenda ativável no
YouTube, o SRT basta e ainda ajuda no ranqueamento. Queimar é regra de vertical,
que é a outra skill.

---

## 9. Conferir antes de entregar

Não diga que está pronto sem rodar esta etapa inteira. Ela pega erro que passa
calado nas oito anteriores.

```bash
bash scripts/conferir.sh --projeto . --id <id>
```

São cinco verificações, e as três primeiras o script decide sozinho.

### 9a. Técnico

```bash
ffprobe -v error -show_entries format=duration -of csv=p=0 saida/<id>-final.mp4
ffmpeg -i saida/<id>-final.mp4 -af ebur128=framelog=quiet -f null - 2>&1 | grep "I:"
ffmpeg -i saida/<id>-final.mp4 -af silencedetect=noise=-30dB:d=0.4 -f null - 2>&1 \
  | grep silence_duration
```

Duração bate com `duracao_cortado` do EDL. Loudness dá **-14**. Nenhum
`silence_duration` passa de **0,4 s**, e emenda de corte fica em torno de 0,2 s.
Se sobrou mudo longo, o EDL não cortou ou o limiar errou. Refaça, não entregue.

### 9b. Os trechos errados não podem ter voltado

**Esta é a verificação que mais pega erro, e é a mais recente.**

Cortar não garante que cortou. O `select` pode ter sido montado com o EDL
errado, o `.mlt` pode apontar para o bruto em vez do cortado, e uma reedição no
Shotcut pode ter reintroduzido o trecho. Em todos esses casos o vídeo renderiza
limpo, sem erro, com o take ruim dentro.

Então **transcreva o arquivo final e procure o que não podia estar lá**.

```bash
# transcreve o FINAL, não o bruto
ffmpeg -v error -y -i saida/<id>-final.mp4 -map 0:a:0 -ac 1 -ar 16000 \
  -c:a pcm_s16le saida/conferencia.wav
whisper-cli -m ~/.cache/whisper-cpp/ggml-large-v3-turbo.bin \
  -f saida/conferencia.wav -l pt -t 8 -otxt --output-file saida/conferencia
```

Antes de rodar, escreva `transcricao/frases-proibidas.txt`, uma frase por
linha, com um pedaço literal da fala de **cada** trecho que você cortou. Tire do
SRT do bruto, nos intervalos que estão em `editoriais` no `cortes.json`.

```
corta essa parte
são três passos
de qualquer
```

O `conferir.sh` procura cada uma na transcrição do final. **Qualquer ocorrência
reprova a entrega.** Se achou, o corte não pegou, e a causa quase sempre é uma
destas três.

| Sintoma | Causa provável |
|---|---|
| Todos os trechos voltaram | O `.mlt` aponta para o bruto, não para `midia/cortado.mp4` |
| Um trecho voltou | O par `início → fim` daquele corte editorial está errado no EDL |
| Trechos voltaram depois de uma reedição | O Shotcut salvou por cima do `.mlt`, ver etapa 8 |

Confira também as âncoras. Pegue três marcos do mapa da etapa 3c e veja se a
fala acontece no tempo previsto do final. Se derivou, o `plano.json` está no
relógio errado e todas as sobreposições estão fora de lugar.

### 9c. Olhar de verdade

Extraia um frame **do arquivo final** em cada ponto de sobreposição e olhe um
por um.

```bash
ffmpeg -v error -y -ss <t> -i saida/<id>-final.mp4 -frames:v 1 saida/provas/<nome>.png
```

Confira em cada frame, na ordem.

1. A sobreposição aparece mesmo. Se sumiu, é `disable=1` ou falta de alpha
2. O acento é a cor do manual, não a de outro projeto
3. A fonte é a do manual, no peso certo
4. Nada que o manual proíbe aparece na tela
5. Nada cobre o rosto de quem fala nem a informação do slide

Extraia também um trecho curto de vídeo em cada emenda de corte editorial e
assista. Frame parado não mostra corte seco feio nem salto de áudio.

```bash
ffmpeg -v error -y -ss <t-2> -t 4 -i saida/<id>-final.mp4 -c copy saida/provas/emenda-<t>.mp4
```

---

## Entregáveis

| Arquivo | O que é |
|---|---|
| `<id>-final.mp4` | 1920×1080, H.264 e AAC, faststart, -14 LUFS, **sem** legenda queimada |
| `<id>-thumbnail.png` | 1280×720 |
| `<id>-legenda.srt` | Para subir no YouTube como legenda ativável |
| `capitulos-youtube.txt` | Para colar na descrição |
| `<id>.mlt` | Projeto editável no Shotcut |
| `cortes.json` | O EDL, com silêncios e cortes editoriais, no tempo do bruto |
| `provas/` | Os frames e as emendas da etapa 9 |

O EDL não é burocracia. É o que permite refazer o corte sem reassistir o bruto
inteiro, e é o que a etapa 9b usa para saber o que procurar.

---

## Princípio

Ferramenta não entrega acabamento. O salto vem de decisão editorial, do que
**não** entra na tela. Quando o material já é bom, o trabalho é limpar e
destacar, não empilhar gráfico.
