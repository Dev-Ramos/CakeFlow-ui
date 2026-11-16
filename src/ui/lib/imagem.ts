/** Regras de imagem enviada à API (RN-65): JPG, PNG ou WebP, até 5 MB. A API valida de novo. */
export const FORMATOS_DE_IMAGEM = ["image/jpeg", "image/png", "image/webp"];
export const TAMANHO_MAXIMO_IMAGEM_MB = 5;

/** Devolve a mensagem de erro, ou `null` se o arquivo é aceitável. */
export function validarImagem(arquivo: File): string | null {
  if (!FORMATOS_DE_IMAGEM.includes(arquivo.type)) return "Use uma imagem JPG, PNG ou WebP.";
  if (arquivo.size > TAMANHO_MAXIMO_IMAGEM_MB * 1024 * 1024) {
    return `A imagem deve ter no máximo ${TAMANHO_MAXIMO_IMAGEM_MB} MB.`;
  }
  return null;
}
