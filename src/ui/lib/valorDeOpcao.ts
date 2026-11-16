/**
 * Valor de uma opção de seletor. A API manda ids numéricos, e o DOM (`<option>`,
 * Radix, `<input type="radio">`) só trabalha com texto. Os componentes de
 * seleção aceitam `string | number` e devolvem o valor **no tipo original da
 * opção**: quem usa passa números e recebe números, sem converter na mão (e sem
 * risco de enviar `"3"` onde a API espera `3`).
 */
export type ValorDeOpcao = string | number;

/** Texto que vai para o DOM. `null`/`undefined` viram `""` (nada selecionado). */
export function paraTexto(valor: ValorDeOpcao | null | undefined): string {
  return valor === null || valor === undefined ? "" : String(valor);
}

/**
 * Compara por texto, então `3` e `"3"` são o mesmo valor (um valor que veio da
 * API e outro que passou por um campo de formulário continuam casando).
 */
export function mesmoValor(
  a: ValorDeOpcao | null | undefined,
  b: ValorDeOpcao | null | undefined,
): boolean {
  return paraTexto(a) === paraTexto(b);
}

/**
 * Volta do texto do DOM para o valor original da opção correspondente. Se
 * nenhuma opção casar, devolve o próprio texto.
 */
export function deTexto<V extends ValorDeOpcao>(
  opcoes: ReadonlyArray<{ value: V }>,
  texto: string,
): V | string {
  return opcoes.find((opcao) => paraTexto(opcao.value) === texto)?.value ?? texto;
}
