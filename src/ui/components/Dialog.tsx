import type { ComponentProps } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../lib/cn";

/** Raiz do diálogo (controla aberto/fechado). */
export const Dialog = DialogPrimitive.Root;

/** Gatilho que abre o diálogo. */
export const DialogTrigger = DialogPrimitive.Trigger;

/** Botão que fecha o diálogo (usar dentro de `DialogContent`). */
export const DialogClose = DialogPrimitive.Close;

export type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  /**
   * `'auto'` (padrão): painel com padding e scroll próprio — serve à maioria.
   * `'coluna'`: painel flex-coluna sem padding nem scroll próprio — para modais
   * com footer fixo: o chamador monta corpo rolável + footer fora da área de scroll.
   */
  layout?: "auto" | "coluna";
};

/**
 * Conteúdo do diálogo: overlay escurecido + painel. Foco e fechamento por Esc
 * são gerenciados pelo Radix.
 *
 * Responsivo por padrão: abaixo de `sm` (celular) o painel vira tela cheia; a
 * partir de `sm` é o cartão centralizado (`max-w-3xl`, `max-h-[85vh]`).
 */
export function DialogContent({
  className,
  children,
  layout = "auto",
  ...props
}: DialogContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-scrim" />
      <DialogPrimitive.Content
        // Explícito (não depender da versão do Radix): conteúdo é modal.
        aria-modal="true"
        className={cn(
          "fixed inset-0 z-50 w-full",
          "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2",
          layout === "coluna"
            ? "flex flex-col overflow-hidden sm:max-h-[85vh]"
            : "overflow-y-auto p-4 sm:max-h-[85vh] sm:p-6",
          "bg-surface-container-lowest sm:rounded-xl sm:border sm:border-outline-variant sm:shadow-modal",
          "focus:outline-none",
          className,
        )}
        {...props}
      >
        {children}
        {/* Alvo de toque >= 36px: área clicável cheia, glifo centralizado. */}
        <DialogPrimitive.Close
          aria-label="Fechar"
          className={cn(
            "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg text-on-surface-variant",
            "hover:bg-surface-container hover:text-on-surface",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          )}
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ×
          </span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export type DialogTitleProps = ComponentProps<typeof DialogPrimitive.Title>;

/** Título do diálogo. */
export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return (
    <DialogPrimitive.Title
      className={cn("text-headline-sm text-on-surface", className)}
      {...props}
    />
  );
}

export type DialogDescriptionProps = ComponentProps<typeof DialogPrimitive.Description>;

/** Descrição/subtítulo do diálogo. */
export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return (
    <DialogPrimitive.Description
      className={cn("mt-1 text-body-md text-tertiary", className)}
      {...props}
    />
  );
}
