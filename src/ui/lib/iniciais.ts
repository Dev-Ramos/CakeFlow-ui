/** Iniciais dos dois primeiros nomes (`maria clara souza` → `MC`). */
export function iniciais(nomeCompleto: string) {
  return nomeCompleto
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");
}
