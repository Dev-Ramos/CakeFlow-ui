/** A API trabalha em centavos (inteiro); a tela mostra e digita reais. */

const FORMATO = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** `4500` → `R$ 45,00` (o espaço é o inseparável do `Intl`). */
export function formatarReais(centavos: number): string {
  return FORMATO.format(centavos / 100);
}

/** `4500` → `"45,00"`, para preencher um campo de texto. */
export function centavosParaTexto(centavos: number | null | undefined): string {
  if (centavos === null || centavos === undefined) return "";
  return (centavos / 100).toFixed(2).replace(".", ",");
}

/**
 * `"45,5"` → `4550`. Aceita vírgula ou ponto decimal. Vazio, negativo ou inválido vira `NaN`
 * (quem chama decide se o campo é obrigatório). Arredonda para evitar `0,29 * 100 = 28.999…`.
 */
export function textoParaCentavos(texto: string): number {
  const limpo = texto.trim().replace(",", ".");
  if (limpo === "") return Number.NaN;
  const reais = Number(limpo);
  return reais >= 0 ? Math.round(reais * 100) : Number.NaN;
}
