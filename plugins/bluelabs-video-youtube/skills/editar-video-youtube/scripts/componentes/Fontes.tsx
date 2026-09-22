import React from "react";
import { marca } from "./marca";

// Injeta o @font-face da marca.
//
// Fonte comprada costuma instalar CADA PESO como família própria, com um nome
// interno diferente do que o CSS pede. Sem @font-face por arquivo, o
// font-weight resolve a face errada, sem erro nenhum, e o texto sai fino.
// Se marca.fontFace está vazio, a fonte é de sistema ou web e não precisa.
export const Fontes: React.FC = () => {
  if (!marca.fontFace) return null;
  return <style dangerouslySetInnerHTML={{ __html: marca.fontFace }} />;
};
