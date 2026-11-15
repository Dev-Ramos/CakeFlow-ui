/**
 * Normaliza texto para comparação tolerante: remove acentos (NFD + descarte de
 * diacríticos) e baixa a caixa. Base das buscas do design system (ex.: Combobox):
 * digitar "acucar" encontra "Açúcar".
 */
export function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
