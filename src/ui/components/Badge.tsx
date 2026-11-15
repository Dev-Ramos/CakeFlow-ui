import type { ComponentProps, ReactNode } from "react";
import { badgeVariants, type BadgeVariants } from "../design-system/variants";
import { cn } from "../lib/cn";

export interface BadgeProps extends ComponentProps<"span">, BadgeVariants {
  /** Ícone decorativo antes do texto (`aria-hidden`). */
  icon?: ReactNode;
  /** Ponto indicador no lugar do ícone (variante compacta de tabelas/cards). */
  dot?: boolean;
  /** Anima o ponto (estágio em andamento). Só tem efeito com `dot`. */
  pulse?: boolean;
}

/**
 * Selo/pílula do design system. As tonalidades genéricas vêm de `variants.ts`;
 * estados específicos de um domínio (ex.: etapas de produção) passam suas cores
 * por `className` (`bg-status-assando text-status-assando-fg border-status-assando-bd`),
 * já que `ui/` não conhece domínio. Presentacional.
 */
export function Badge({
  tone,
  size,
  icon,
  dot = false,
  pulse = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone, size }), className)} {...props}>
      {dot ? (
        <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          )}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      ) : icon ? (
        <span aria-hidden="true" className="inline-flex shrink-0">
          {icon}
        </span>
      ) : null}
      {children}
    </span>
  );
}
