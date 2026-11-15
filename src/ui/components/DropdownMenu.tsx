import type { ComponentProps } from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "../lib/cn";

/**
 * Menu suspenso do design system, sobre o Radix DropdownMenu.
 *
 * `Root` e `Trigger` são reexportados sem alteração; `Content` e `Item`
 * carregam o estilo. Para o caso comum (ações de linha de tabela) prefira o
 * `Dropdown`, que compõe estes.
 */
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export type DropdownMenuContentProps = ComponentProps<typeof DropdownMenuPrimitive.Content>;

/** Painel do menu. Já vai em portal — não precisa envolver em `Portal`. */
export function DropdownMenuContent({
  className,
  align = "end",
  sideOffset = 4,
  ...props
}: DropdownMenuContentProps) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-44 rounded-lg border border-outline-variant bg-surface-container-lowest p-1 shadow-modal",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

export type DropdownMenuItemProps = ComponentProps<typeof DropdownMenuPrimitive.Item>;

/** Item acionável do menu. */
export function DropdownMenuItem({ className, ...props }: DropdownMenuItemProps) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-body-md text-on-surface",
        "outline-none data-highlighted:bg-surface-container",
        "data-disabled:cursor-not-allowed data-disabled:text-outline",
        className,
      )}
      {...props}
    />
  );
}

export type DropdownMenuSeparatorProps = ComponentProps<typeof DropdownMenuPrimitive.Separator>;

/** Linha divisória entre grupos de itens. */
export function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps) {
  return (
    <DropdownMenuPrimitive.Separator className={cn("my-1 h-px bg-outline-variant", className)} {...props} />
  );
}
