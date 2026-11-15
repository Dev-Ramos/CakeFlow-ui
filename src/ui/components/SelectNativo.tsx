import type { ComponentProps } from "react";
import { controlBase, controlHeight } from "../design-system/variants";
import { cn } from "../lib/cn";

export type SelectNativoProps = ComponentProps<"select">;

/**
 * Select nativo do design system. Presentacional.
 *
 * Nativo (e não Radix, como o `Select`) de propósito: as opções costumam vir da
 * API e os testes selecionam por `selectOptions`/`getByRole('option')`, que não
 * funcionam com o portal do Radix. O Radix também rejeita `<option value="">`,
 * usado nos filtros com opção "Todos".
 */
export function SelectNativo({ className, ...props }: SelectNativoProps) {
  return <select className={cn("block w-full", controlHeight, controlBase, className)} {...props} />;
}
