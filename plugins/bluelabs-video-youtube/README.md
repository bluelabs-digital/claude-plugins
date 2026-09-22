# bluelabs-video-youtube

Edita uma gravação em 16:9 e entrega o vídeo pronto para o YouTube, rodando
tudo na sua máquina. Nenhum arquivo de mídia sai do computador.

Entrega o MP4 final **e** o projeto editável, porque a máquina não acerta o
acabamento sozinha e alguém vai querer ajustar.

## O que ele faz

| Entrega | Detalhe |
|---|---|
| `<id>-final.mp4` | 1920×1080, H.264 e AAC, faststart, normalizado em -14 LUFS |
| `<id>-thumbnail.png` | 1280×720 |
| `<id>-legenda.srt` | Para subir como legenda ativável |
| `capitulos-youtube.txt` | Para colar na descrição |
| `<id>.mlt` | Projeto do Shotcut, editável |
| `cortes.json` | O EDL, com o que foi cortado e por quê |
| `provas/` | Frames e trechos do arquivo final, para conferência |

No caminho ele transcreve a fala, corta os silêncios e os takes errados,
normaliza o áudio, compõe os motion graphics e confere o resultado.

## Duas skills

**`editar-video-youtube`** é o pipeline, em nove etapas.

**`criar-manual-de-marca`** monta a identidade que o pipeline consome. Roda uma
vez por marca. O pipeline **para** se não achar o manual, de propósito: cor e
fonte chutadas num vídeo publicado custam mais caro que cinco minutos de
conversa.

## Instalar

```
/plugin marketplace add bluelabs-digital/claude-plugins
/plugin install bluelabs-video-youtube@bluelabs-open
```

Depois, no primeiro uso, peça o manual da marca.

```
crie o manual de marca para vídeo
```

E então, em qualquer projeto de vídeo.

```
edite este vídeo para o YouTube
```

## Precisa ter instalado

| Ferramenta | Para que |
|---|---|
| FFmpeg com `libass`, `frei0r` e `libx264` | Tudo |
| whisper.cpp e o modelo `large-v3-turbo` | Transcrição |
| Shotcut, de onde vem o `melt` | Compõe a timeline sem abrir a interface |
| Node | Remotion e geração do projeto |

No macOS.

```bash
brew install ffmpeg-full whisper-cpp
brew install --cask shotcut
```

A skill roda `scripts/checar-ambiente.sh`, que procura cada uma e diz
exatamente o que falta e como instalar. Ele também detecta o caso dos **dois
whisper**, que é a confusão mais comum da instalação.

## Como funciona

```
  gravação bruta
        │
        ├─ 2. transcrever            whisper.cpp, local
        │
        ├─ 3. cortar                 silêncios > 0,4 s  +  takes errados
        │                            gera o EDL e o mapa de âncoras
        │                            ↓
        │                      midia/cortado.mp4
        │
        ├─ 5. olhar a tela           contact sheet antes de desenhar
        │
        ├─ 6. motion                 Remotion → ProRes 4444 com alpha
        │
        ├─ 7. gerar o .mlt           projeto Shotcut, em frames
        │
        ├─ 8. montar                 melt compõe · ffmpeg normaliza o áudio
        │
        └─ 9. conferir               ← a etapa que pega o que passou calado
                                     duração · loudness · silêncio
                                     trechos cortados que voltaram
                                     frames e emendas para olhar
```

### O corte tem dois tipos

**Silêncio.** Pausa acima de 0,4 s sai, sobrando 0,1 s em cada ponta, então a
emenda tem no máximo 0,2 s.

**Editorial.** Falso começo, retake, a pessoa pedindo corte em voz alta, caçada
na tela procurando uma aba. Isso sai do corte, não só da legenda.

Os dois entram no mesmo EDL, e é o EDL que permite refazer sem reassistir o
bruto inteiro.

### O relógio muda depois do corte

Toda marcação anotada assistindo ao bruto está no relógio errado depois que o
corte acontece. O `cortar.py` imprime um mapa de âncoras que traduz cada uma.

```
âncoras (bruto → cortado):
  fala_inicia                1.47 →     0.20
  tres_passos              196.00 →   153.16
```

Pular isso põe todas as sobreposições fora de lugar, e o vídeo renderiza sem
erro nenhum.

### A etapa 9 existe porque quase nada falha com erro

Timeline colapsada, peça sem alpha, sobreposição desabilitada, take errado que
voltou. Nenhum desses dá erro. Todos entregam um arquivo válido e errado.

A verificação que mais pega problema é a dos **trechos cortados que voltaram**.
O script transcreve o arquivo final e procura as frases que deveriam ter
sumido. Qualquer ocorrência reprova a entrega.

## Só vídeo horizontal

Este plugin trata 16:9, o formato de vídeo longo do YouTube, e **não queima
legenda**, porque vídeo longo usa legenda ativável e o SRT ainda ajuda no
ranqueamento.

Vertical, para Shorts, Reels e TikTok, tem outras regras, principalmente a
legenda queimada e o enquadramento. Fica em outro plugin.

## Estrutura

```
bluelabs-video-youtube/
├── README.md
└── skills/
    ├── criar-manual-de-marca/
    │   ├── SKILL.md
    │   └── modelos/
    │       ├── manual.modelo.md
    │       └── marca.modelo.ts
    └── editar-video-youtube/
        ├── SKILL.md
        ├── referencias/
        │   └── armadilhas.md        indexadas pelo sintoma
        └── scripts/
            ├── checar-ambiente.sh
            ├── cortar.py            o EDL e o mapa de âncoras
            ├── gerar-mlt.mjs        o projeto Shotcut
            ├── renderizar-tudo.sh   peças em ProRes com alpha
            ├── montar-final.sh      melt + loudnorm + mux
            ├── conferir.sh          a etapa 9
            ├── plano.exemplo.json
            └── componentes/         peças Remotion, dirigidas pelo plano
```

## Licença

MIT. Veja [LICENSE](../../LICENSE) na raiz do repositório.
