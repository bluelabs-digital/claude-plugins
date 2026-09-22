---
name: criar-manual-de-marca
description: Monta o manual de marca para vídeo que o pipeline de edição consome, com cores, tipografia, logo, régua editorial e travas de compliance. Gera marca/manual.md e o marca.ts com os tokens que os componentes do Remotion leem, além do bloco @font-face quando a fonte instala cada peso como família própria. Use antes de editar o primeiro vídeo de uma marca, quando a skill de edição avisar que não achou manual, ao adicionar uma marca ou sub-marca nova, ou quando pedirem para cadastrar a identidade visual de um canal.
---

# Criar o manual de marca para vídeo

O pipeline de edição não tem marca própria de propósito. Sem manual ele para,
porque cor e fonte chutadas num vídeo publicado custam mais caro que cinco
minutos de conversa.

Esta skill faz as perguntas, grava o manual e gera o arquivo de tokens.

## O que sai daqui

```
marca/
├── manual.md        a fonte de verdade, lida por humano e pelo Claude
├── marca.ts         os tokens, lidos pelos componentes do Remotion
└── assets/
    └── logo.png     o logo em PNG com alpha, ou SVG se houver
```

O `manual.md` é o documento. O `marca.ts` é a tradução dele para código, e é
gerado a partir do manual, nunca editado à mão em paralelo. Mudou a marca,
edite o manual e gere o `marca.ts` de novo.

## Antes de perguntar, procure

Muita coisa já existe e a pessoa esquece que existe. Antes de abrir o
questionário, procure no projeto e pergunte apenas o que faltar.

- `manual-da-marca.md`, `design-tokens.md`, `brand.md`, `tom-de-voz.md`
- `tailwind.config`, `:root` num CSS, `tokens.json`, `theme.ts`
- Um PDF de manual de marca em `assets/`, `docs/` ou `design/`
- O site da marca, de onde dá para tirar cor e fonte reais

Achou, confirme com a pessoa em vez de perguntar do zero. Diga o que encontrou
e peça só a correção.

## As perguntas

Faça em blocos. Não despeje as dezesseis de uma vez.

### Bloco 1, identidade

1. Nome da marca como aparece no vídeo
2. Cor de acento, o hex que carrega a identidade
3. Cor de apoio, se houver
4. Cor de fundo escuro, o preto da marca, que quase nunca é `#000000`
5. Cor de texto claro, o branco da marca
6. Cor de texto sobre o acento. Teste o contraste, acento claro pede texto
   escuto e o contrário também

### Bloco 2, tipografia

7. Fonte dos títulos, e se está instalada na máquina
8. Fonte de destaque, se for diferente
9. Pesos usados
10. **A fonte instala cada peso como família própria?** Pergunta chata e
    essencial. Fonte comprada costuma fazer isso, e aí `font-weight: 900`
    resolve para a face errada sem erro nenhum. Confira.

```bash
fc-list | grep -i "<nome da fonte>"
```

Se cada peso aparece com um nome de família diferente, o manual precisa listar
o arquivo de cada peso, e o `marca.ts` sai com um bloco `@font-face` por
arquivo. É isso que `Fontes.tsx` injeta.

Se a fonte oficial não estiver instalada, defina e **registre no manual** qual
é o substituto aprovado. Substituto improvisado na hora da edição vira
inconsistência entre vídeos.

### Bloco 3, logo

11. Arquivo do logo, versão para fundo escuro
12. Tem vetor, SVG ou PDF? PNG serve para canto e marca d'água, mas um reveal
    em tela cheia sai borrado. Se só existe PNG, registre a limitação no manual
    para ninguém planejar uma abertura que não dá para fazer

### Bloco 4, régua editorial

13. Caractere ou construção proibida em texto na tela, por exemplo travessão
    ou símbolo de e comercial
14. Trava de compliance. Setor regulado costuma ter. Promessa de retorno,
    conselho, superlativo, comparação com concorrente
15. Número na tela precisa de fonte e data visíveis?
16. Existe assunto ou imagem que nunca pode aparecer? Rosto de familiar, cliente
    não autorizado, tela com dado real

O bloco 4 é o que mais economiza retrabalho. Ele vira a lista que a etapa 9 do
pipeline confere frame a frame.

## Depois de montar

Copie `modelos/manual.modelo.md` e preencha. Copie `modelos/marca.modelo.ts`,
substitua os tokens e grave em `motion/src/marca.ts`.

Confirme três coisas antes de fechar.

**O contraste passa.** Texto sobre o acento precisa de pelo menos 4,5 para 1.
Acento claro com texto branco é o erro mais comum e só aparece no vídeo pronto.

**A fonte resolve o peso certo.** Renderize uma peça de teste e olhe. Se o
texto saiu mais fino do que o esperado, falta o `@font-face` por arquivo.

**O logo tem alpha.** PNG com fundo branco chapado sobre vídeo escuro é visível
de longe e sempre passa despercebido no editor.

## Mais de uma marca

Se a mesma pessoa edita para várias marcas, faça um manual por marca em pastas
irmãs e aponte `MANUAL_MARCA` para a certa a cada projeto.

```bash
export MANUAL_MARCA=~/marcas/acme/manual.md
```

Não misture. Acento de uma marca no vídeo de outra é erro de marca, não de
gosto, e é o tipo de coisa que só o cliente percebe, depois de publicado.

Sub-marca ou vertical que muda só a cor de acento cabe no mesmo manual, como
uma tabela de variantes, com uma variante marcada como padrão. Mudou mais que
cor, é outro manual.
