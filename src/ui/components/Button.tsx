import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { buttonVariants, type ButtonVariants } from "../design-system/variants";
import { cn } from "../lib/cn";

// ComponentProps<'button'> (e não ButtonHTMLAttributes): inclui `ref` — React 19
// a trata como prop normal e o spread abaixo já a repassa ao <button>.
export interface ButtonProps extends ComponentProps<"button">, ButtonVariants {
  /** Ícone decorativo exibido antes do conteúdo (`aria-hidden`). */
  icon?: ReactNode;
  /** Em carregamento: troca o ícone por um spinner e desabilita o botão. */
  loading?: boolean;
}

/**
 * Botão do design system. As variantes vêm de `design-system/variants.ts`.
 * `size="icon"` exige `aria-label`. Presentacional — sem regra de negócio.
 */
export function Button({
  variant,
  size,
  className,
  type,
  icon,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const leading = loading ? (
    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
  ) : icon ? (
    <span aria-hidden="true" className="inline-flex">
      {icon}
    </span>
  ) : null;

  return (
    <button
      type={type ?? "button"}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {leading}
      {children}
    </button>
  );
}
