import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export type ColorInputProps = Omit<ComponentProps<"input">, "type">;

/**
 * Seletor de cor do design system. Presentacional.
 * Tamanho fixo (não `w-full` como o `Input`): o controle nativo de cor é uma
 * amostra, não um campo de texto.
 */
export function ColorInput({ className, ...props }: ColorInputProps) {
  return (
    <input
      type="color"
      className={cn(
        "h-10 w-16 shrink-0 rounded border border-outline-variant bg-surface-container-lowest",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
