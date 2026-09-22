# Manual de marca para vídeo — <NOME DA MARCA>

Fonte de verdade da identidade desta marca em vídeo. O `marca.ts` é gerado a
partir daqui. Mudou alguma coisa, mude neste arquivo e gere o `marca.ts` de novo.

Última revisão: <AAAA-MM-DD>

---

## Cores

| Token | Hex | Uso |
|---|---|---|
| `accent` | `#______` | Principal. Destaques, réguas, barra de capítulo |
| `suporte` | `#______` | Secundária, pontual |
| `secundaria` | `#______` | Kicker, legenda de apoio, texto de segunda linha |
| `preto` | `#______` | Fundo escuro e texto sobre claro |
| `branco` | `#______` | Texto sobre escuro |
| `cinza400` | `#______` | Rótulo, texto de terceira linha |
| `textoNoAccent` | `#______` | Texto **em cima** do acento |

`textoNoAccent` não é sempre branco. Acento claro pede texto escuro. Contraste
mínimo de 4,5 para 1, e isso se confere, não se estima.

Gradiente institucional, usado na tela final.

```
linear-gradient(135deg, <preto> 0%, <intermediário> 50%, <accent> 100%)
```

---

## Tipografia

| | Fonte | Pesos |
|---|---|---|
| Títulos | <nome> | <pesos> |
| Destaque | <nome ou a mesma> | <pesos> |
| Legenda queimada | <nome exato da face> | <peso> |

Instalada na máquina: **sim / não**

Se não estiver, o substituto aprovado é <nome>. Registrado aqui para não virar
decisão de última hora.

### Cada peso é uma família própria?

**sim / não**

Se sim, liste o arquivo de cada peso. Sem `@font-face` por arquivo o
`font-weight` resolve a face errada, sem erro nenhum, e o texto sai fino.

| Peso | Arquivo |
|---|---|
| 400 | `<arquivo>.otf` |
| 700 | `<arquivo>.otf` |
| 900 | `<arquivo>.otf` |

Confira com `fc-list | grep -i "<fonte>"`.

---

## Logo

| Versão | Arquivo | Dimensão |
|---|---|---|
| Fundo escuro | `assets/<arquivo>.png` | <w>×<h> |
| Fundo claro | `assets/<arquivo>.png` | <w>×<h> |

Tem vetor: **sim / não**

Se só existe PNG, diga aqui. PNG serve para canto e marca d'água. Reveal em
tela cheia sai borrado, então esse tipo de abertura não se planeja.

Nunca recriar nem redesenhar o logotipo.

---

## Régua editorial

O que **não** pode aparecer em texto na tela, título, kicker, lower third,
thumbnail ou legenda.

- <caractere ou construção proibida>
- <outra>

### Compliance

- <trava, por exemplo promessa de retorno em setor regulado>
- <onde o disclaimer vai, descrição ou queimado>
- <o que exige aprovação antes de publicar>

### Números na tela

Precisam de fonte e data visíveis: **sim / não**

Número que a fala não disse **nunca** vai para a tela, em nenhuma marca. Isso é
regra do pipeline, não desta marca.

### Nunca pode aparecer

- <rosto, tela com dado real, cliente não autorizado>

---

## Tom

<Duas ou três linhas. Como a marca soa. O que ela nunca faria.>

---

## Variantes

Só se a marca tem sub-marcas que mudam **apenas a cor de acento**. Mudou mais
que cor, é outro manual.

| Variante | `accent` | `suporte` | `textoNoAccent` |
|---|---|---|---|
| <padrão> | `#______` | `#______` | `#______` |
| <outra> | `#______` | `#______` | `#______` |

Padrão: `<nome da variante>`
