import type { ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "../lib/cn";

export interface TooltipProps {
  /** Texto curto exibido no tooltip (também vira `aria-describedby` do trigger via Radix). */
  content: ReactNode;
  /** Elemento que dispara o tooltip (recebe as props do trigger via `asChild`). */
  children: ReactNode;
  /** Lado em que o tooltip aparece. */
  side?: TooltipPrimitive.TooltipContentProps["side"];
  className?: string;
}

/**
 * Tooltip (Radix): microcopy de apoio em hover/foco.
 * Trigger `disabled` não emite eventos de pointer — o tooltip só aparece em
 * controles habilitados; informação essencial nunca deve viver só aqui.
 */
export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className={cn(
              "z-50 max-w-64 rounded-lg bg-inverse-surface px-2.5 py-1.5 text-body-sm leading-snug text-inverse-on-surface shadow-modal",
              className,
            )}
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
