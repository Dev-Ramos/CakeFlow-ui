/**
 * Fuso do negócio: `America/Sao_Paulo`, sem horário de verão desde 2019 (-03:00 o ano todo).
 * A API manda e recebe `delivery_at` com esse fuso; aqui o texto é tratado como está, sem
 * passar pelo fuso do navegador, para a tela mostrar sempre a hora do ateliê.
 */
const FUSO = "-03:00";

/** `2026-11-14T09:00:00-03:00` → `2026-11-14T09:00` (valor de `datetime-local`). */
export function paraDatetimeLocal(iso: string): string {
  return iso.slice(0, 16);
}

/** `2026-11-14T09:00` → `2026-11-14T09:00:00-03:00`. */
export function deDatetimeLocal(valor: string): string {
  return `${valor}:00${FUSO}`;
}

/** `2026-11-14` → `14/11/2026`. */
export function formatarData(data: string): string {
  const [ano, mes, dia] = data.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

/** `2026-11-14T09:00:00-03:00` → `14/11/2026 09:00`. */
export function formatarDataHora(iso: string): string {
  return `${formatarData(iso)} ${iso.slice(11, 16)}`;
}

/** `11988881111` → `(11) 98888-1111`; qualquer outra coisa volta como veio. */
export function formatarTelefone(digitos: string): string {
  const d = digitos.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digitos;
}
