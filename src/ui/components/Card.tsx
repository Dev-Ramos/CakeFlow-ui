import type { ComponentProps } from "react";
import { cn } from "../lib/cn";

export interface CardProps extends ComponentProps<"div"> {
  /** Padding interno padrão (20px). Desligue para conteúdo de borda a borda (ex.: tabela). */
  padded?: boolean;
  /** Eleva no hover (camada 2) — para cards clicáveis/arrastáveis. */
  interactive?: boolean;
}

/**
 * Superfície elevada do design system (camada 1): branco sobre o canvas, borda
 * hairline e sombra quente. Presentacional.
 */
export function Card({ padded = true, interactive = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-outline-variant bg-surface-container-lowest shadow-warm",
        padded && "p-5",
        interactive && "transition-shadow hover:border-primary/40 hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
}
