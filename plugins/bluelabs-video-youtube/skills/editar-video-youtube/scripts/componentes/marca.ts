// ATENÇÃO: este arquivo é um MARCADOR, não um arquivo de marca.
//
// O pipeline não tem marca própria de propósito. Antes de editar o primeiro
// vídeo, rode a skill `criar-manual-de-marca`. Ela faz as perguntas, grava
// marca/manual.md e gera o marca.ts de verdade, que substitui este aqui.
//
// Se você está lendo isto dentro de um projeto de vídeo, o manual não foi
// criado ainda. Não preencha os valores abaixo na mão: o manual é a fonte de
// verdade, e o marca.ts é gerado a partir dele. Preencher aqui cria duas
// versões da identidade que divergem no terceiro vídeo.

export type Marca = {
  nome: string;
  accent: string;
  suporte: string;
  secundaria: string;
  preto: string;
  branco: string;
  cinza400: string;
  textoNoAccent: string;
  fonte: string;
  fonteDestaque: string;
  fonteLegenda: string;
  pesoLegenda: number;
  gradiente: string;
  sombraAccent: string;
  card: string;
  faixaCapitulo: string;
  logo: string | null;
  fontFace: string;
};

throw new Error(
  "marca.ts não foi gerado.\n" +
  "Rode a skill criar-manual-de-marca antes de renderizar.\n" +
  "Sem manual, cor e fonte saem chutadas, e num vídeo publicado isso custa " +
  "mais caro que os cinco minutos da conversa."
);

export const marca: Marca = null as unknown as Marca;
