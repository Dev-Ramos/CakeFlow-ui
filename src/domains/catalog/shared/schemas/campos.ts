import { z } from "zod";

/** Aceita vírgula decimal ("7,5"). Texto vazio ou inválido vira `NaN`. */
export function paraNumero(texto: string): number {
  const limpo = texto.trim().replace(",", ".");
  return limpo === "" ? Number.NaN : Number(limpo);
}

export const ehPositivo = (texto: string) => paraNumero(texto) > 0;

/** Campo numérico obrigatório (> 0), mantido como texto no formulário. */
export const numeroPositivo = (mensagem: string) =>
  z.string().refine(ehPositivo, { message: mensagem });

/** Campo numérico opcional: vazio vale; se preenchido, deve ser > 0. */
export const numeroPositivoOpcional = (mensagem: string) =>
  z.string().refine((texto) => texto.trim() === "" || ehPositivo(texto), { message: mensagem });

/** Id escolhido num select: número, ou `""` quando nada foi escolhido. */
export const idDeSelect = z.union([z.number(), z.literal("")]);

/**
 * Id obrigatório: `""` (nada escolhido) vira a mensagem. O `: boolean` explícito evita que o
 * TypeScript infira um type predicate e estreite o tipo do campo para `number`, o que
 * deixaria de combinar com o valor do formulário (`number | ""`).
 */
export const idObrigatorio = (mensagem: string) =>
  idDeSelect.refine((valor): boolean => valor !== "", { message: mensagem });
