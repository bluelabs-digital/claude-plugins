// Tokens de marca para o motion. GERADO a partir de marca/manual.md.
// Não edite este arquivo em paralelo ao manual: mude o manual e gere de novo.
//
// Os componentes leem `marca.accent`. Hex solto dentro de um .tsx significa
// que alguém parou de seguir o manual.

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

// Pasta onde as fontes da marca estão instaladas.
const FONTES = `${process.env.HOME ?? ""}/Library/Fonts`;

// Só preencha se o manual disser que cada peso é uma família própria.
// Sem isso o font-weight resolve a face errada, calado, e o texto sai fino.
const FONT_FACE = ``;
// Modelo:
// const FONT_FACE = `
// @font-face{font-family:'<Familia>';font-style:normal;font-weight:700;
//   src:url('file://${FONTES}/<Arquivo-Bold>.otf') format('opentype')}
// @font-face{font-family:'<Familia>';font-style:normal;font-weight:900;
//   src:url('file://${FONTES}/<Arquivo-Black>.otf') format('opentype')}
// `;

function hexRgb(hex: string): string {
  const n = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)).join(",");
}

const ACCENT = "#000000";   // ← do manual
const PRETO = "#0B0B0B";    // ← do manual
const MEIO = "#1A1A1A";     // ← tom intermediário do gradiente

export const marca: Marca = {
  nome: "<Nome da marca>",

  accent: ACCENT,
  suporte: "#000000",
  secundaria: "#9CA3AF",
  preto: PRETO,
  branco: "#FFFFFF",
  cinza400: "#9CA3AF",

  // Atenção: não é sempre branco. Acento claro pede texto escuro.
  textoNoAccent: "#FFFFFF",

  fonte: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
  fonteDestaque: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",

  // Nome EXATO da face, é o que o filtro subtitles= do ffmpeg procura.
  fonteLegenda: "Inter",
  pesoLegenda: 700,

  gradiente: `linear-gradient(135deg, ${PRETO} 0%, ${MEIO} 50%, ${ACCENT} 100%)`,
  sombraAccent: `0 20px 56px rgba(${hexRgb(ACCENT)},0.38)`,
  card: `rgba(${hexRgb(PRETO)},0.86)`,
  faixaCapitulo:
    `linear-gradient(90deg, rgba(${hexRgb(PRETO)},0.95) 0%, ` +
    `rgba(${hexRgb(PRETO)},0.92) 62%, rgba(${hexRgb(ACCENT)},0.88) 100%)`,

  // Arquivo dentro de motion/public/. null se a marca não usa logo no vídeo.
  logo: null,

  fontFace: FONT_FACE,
};
