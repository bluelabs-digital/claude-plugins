# Contribuir

## Bug ou ideia

Abra uma issue. Para bug em plugin de vídeo, ajuda muito incluir.

- Sistema operacional e versão do FFmpeg (`ffmpeg -version | head -1`)
- A saída do `scripts/checar-ambiente.sh`
- O que você esperava e o que saiu

## Código

1. Faça um fork e crie uma branch
2. Mexa em um plugin por PR
3. Teste de verdade, com um arquivo real, não só lendo o código
4. Descreva no PR o que você testou e com o quê

## Documentar uma armadilha

É o tipo de contribuição mais útil aqui, e o mais fácil de aceitar.

Se você perdeu tempo com um comportamento que não dá erro e entrega o resultado
errado, adicione em `referencias/armadilhas.md` do plugin, no formato.

```markdown
## <o sintoma, escrito como a pessoa vai procurar>

<a causa, em uma ou duas frases>

<como confirmar, de preferência um comando>

Solução: <o que fazer>
```

O título é o sintoma, não a causa. Quem procura ainda não sabe a causa.

## Criar um plugin novo

1. Crie `plugins/<nome>/`
2. Escreva `.claude-plugin/plugin.json` com `name`, `description`, `version`,
   `author` e `license`
3. Ponha as skills em `skills/<nome>/SKILL.md`, com frontmatter de `name` e
   `description`. A `description` é o que faz o Claude decidir quando acionar a
   skill. Escreva os gatilhos reais de uso, não um resumo bonito
4. Escreva o `README.md` do plugin, explicando o que entrega, o que precisa
   estar instalado e como funciona
5. Registre em `.claude-plugin/marketplace.json`, na raiz
6. Abra a PR

O `name` precisa ser único no repositório, porque a instalação é por nome.

### O que não entra

- Marca, cor, fonte ou logo de ninguém dentro do código. O plugin pede, não impõe
- Credencial, token, chave de API, nem em exemplo
- Nome de cliente, ID de conta, dado de terceiro
- Caminho absoluto da máquina de alguém

## Estilo

- Pasta e arquivo em minúscula, com hífen, sem espaço nem acento
- Português no conteúdo, inglês onde a ferramenta exige
- Um plugin resolve um problema. Crescendo demais, quebre em dois
- Script que a skill executa precisa dizer o que fazer quando falhar ou quando
  faltar dependência
