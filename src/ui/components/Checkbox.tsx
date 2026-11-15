import type { ComponentProps, ReactNode } from "react";
import { cn } from "../lib/cn";

export type CheckboxProps = Omit<ComponentProps<"input">, "type">;

/** Caixa de seleção do design system. Presentacional. */
export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn(
        "h-4 w-4 shrink-0 rounded border-outline-variant text-primary",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export interface CheckboxFieldProps extends CheckboxProps {
  /** Texto exibido à direita da caixa (o `<label>` envolve os dois). */
  label: ReactNode;
}

/**
 * Caixa de seleção rotulada: `<label>` envolvendo Checkbox + texto à direita.
 * Diferente do `Field` (rótulo acima do controle) porque a convenção de
 * checkbox é rótulo ao lado — clicar no texto alterna a caixa.
 */
export function CheckboxField({ label, className, ...props }: CheckboxFieldProps) {
  return (
    <label className={cn("flex items-center gap-2 text-body-md text-on-surface", className)}>
      <Checkbox {...props} />
      {label}
    </label>
  );
}
