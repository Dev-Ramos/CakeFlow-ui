/**
 * Helpers puros de calendário/grade de mês para o `DatePicker`.
 * Sem dependência de `app/` ou `domains/`.
 */

export const MESES_PT: readonly string[] = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

/** Iniciais dos dias da semana, começando no domingo (padrão do calendário pt-BR). */
export const DIAS_SEMANA_PT: readonly string[] = ["D", "S", "T", "Q", "Q", "S", "S"];

/** Primeiro dia do mês de `data`, à meia-noite. */
export function inicioDoMes(data: Date | string): Date {
  if (typeof data === "string") data = new Date(data);
  return new Date(data.getFullYear(), data.getMonth(), 1);
}

/** Mês de `data` deslocado por `deslocamento` meses (negativo = mês anterior). */
export function deslocarMes(data: Date, deslocamento: number): Date {
  return new Date(data.getFullYear(), data.getMonth() + deslocamento, 1);
}

/** `true` quando `a` e `b` caem no mesmo dia civil (ignora hora). */
export function mesmoDia(
  a: Date | null | undefined,
  b: Date | null | undefined,
): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** `true` quando `a` e `b` caem no mesmo mês civil (ignora dia/hora). */
export function mesmoMes(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Meia-noite do dia civil de `data` — chave de comparação por dia. */
function chaveDoDia(data: Date): number {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime();
}

/** `true` quando `data` cai estritamente entre `inicio` e `fim` (exclusive nas pontas). */
export function dataEntre(
  data: Date,
  inicio: Date | null,
  fim: Date | null,
): boolean {
  if (!inicio || !fim) return false;
  const t = chaveDoDia(data);
  return t > chaveDoDia(inicio) && t < chaveDoDia(fim);
}

/**
 * Grade de 42 dias (6 semanas) do mês de `mesRef`, começando no domingo da
 * semana em que cai o dia 1. Dias de fora do mês completam a grade.
 */
export function gradeDoMes(mesRef: Date): Date[] {
  const primeiro = inicioDoMes(mesRef);
  const inicioGrade = new Date(primeiro);
  inicioGrade.setDate(primeiro.getDate() - primeiro.getDay());

  return Array.from({ length: 42 }, (_, indice) => {
    const dia = new Date(inicioGrade);
    dia.setDate(inicioGrade.getDate() + indice);
    return dia;
  });
}

/** Combina o dia civil de `data` com hora/min/seg de `horario` (milissegundos em 0). */
export function combinarDataEHorario(data: Date, horario: Date): Date {
  return new Date(
    data.getFullYear(),
    data.getMonth(),
    data.getDate(),
    horario.getHours(),
    horario.getMinutes(),
    horario.getSeconds(),
    0,
  );
}

/** dd/mm/aaaa — determinístico, sem depender de locale do browser. */
export function formatarDataCurta(data: Date): string {
  const dd = String(data.getDate()).padStart(2, "0");
  const mm = String(data.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${data.getFullYear()}`;
}

/** hh:mm:ss — determinístico, sem depender de locale do browser. */
export function formatarHoraCurta(data: Date): string {
  const hh = String(data.getHours()).padStart(2, "0");
  const mi = String(data.getMinutes()).padStart(2, "0");
  const ss = String(data.getSeconds()).padStart(2, "0");
  return `${hh}:${mi}:${ss}`;
}

/** Valor de um `<input type="time" step="1">` (`hh:mm:ss` ou `hh:mm`) → hora/min/seg. */
export function lerHorarioDoInput(valor: string): {
  horas: number;
  minutos: number;
  segundos: number;
} {
  const [horas = 0, minutos = 0, segundos = 0] = valor.split(":").map(Number);
  return { horas, minutos, segundos };
}
