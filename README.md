# Plugins abertos da Blue Labs

Ferramentas que usamos na operação todo dia, empacotadas como plugins do
[Claude Code](https://claude.com/claude-code) e publicadas para quem quiser
usar.

Não são demonstrações. É o que roda aqui, com as armadilhas que já pagamos
documentadas dentro.

## Instalar

Dentro do Claude Code, adicione este marketplace uma vez.

```
/plugin marketplace add bluelabs-digital/claude-plugins
```

Depois instale o que precisar.

```
/plugin install bluelabs-video-youtube@bluelabs-open
```

Para ver tudo que existe aqui: `/plugin marketplace browse bluelabs-open`.

## O que tem hoje

| Plugin | O que faz |
|---|---|
| [bluelabs-video-youtube](plugins/bluelabs-video-youtube/) | Edita uma gravação em 16:9 e entrega o vídeo pronto para o YouTube, rodando tudo na sua máquina. Corta silêncios e takes errados, normaliza o áudio, compõe motion graphics e confere o resultado. Sai MP4, thumbnail, legenda, capítulos e um projeto Shotcut editável |

## Por que publicar isso

Três motivos, na ordem.

**Porque dá para conferir.** Dizemos que construímos sistemas com IA. Código
público é a única forma de alguém verificar isso sozinho, sem reunião e sem
case maquiado.

**Porque documentação de armadilha é a parte cara.** O pipeline de vídeo tem
uma dúzia de comportamentos que não dão erro, só entregam o arquivo errado em
silêncio. Peça de motion sem canal alpha. Timeline que colapsa oito minutos em
treze segundos. Sobreposição desabilitada que renderiza sem aparecer. Cada uma
dessas custou horas. Estão escritas, com o sintoma na frente.

**Porque ferramenta boa melhora com uso de fora.** Issue e PR são bem-vindos.

## Princípio dos plugins daqui

**Não têm marca dentro.** O plugin de vídeo não sabe o que é a Blue Labs. Ele
pede um manual de marca e usa o seu. Identidade de quem publicou entrando no
trabalho de quem instalou é erro, não cortesia.

**Documentam o que falha em silêncio.** Erro com mensagem qualquer um resolve.
O que custa tempo é o que entrega um arquivo válido e errado. É disso que os
arquivos de armadilhas tratam.

**Conferem o próprio resultado.** Toda entrega tem uma etapa que verifica o que
saiu, não só o que entrou. No plugin de vídeo isso vai ao ponto de transcrever
o arquivo final e procurar trechos que deveriam ter sido cortados.

**Rodam localmente quando dá.** O pipeline de vídeo não manda mídia para
serviço nenhum, porque boa parte do material tem cliente dentro.

## Contribuir

Issue para bug e ideia, PR para código. Veja
[CONTRIBUTING.md](CONTRIBUTING.md).

Se você resolveu uma armadilha que não está documentada, o PR mais valioso é o
que a adiciona ao arquivo de armadilhas, com o sintoma na frente.

## Licença

MIT. Use, modifique e redistribua. Veja [LICENSE](LICENSE).

---

Feito pela [Blue Labs](https://bluelabs.digital), assessoria de crescimento e
tecnologia AI-Native.
