import type { ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, XCircle } from "lucide-react";
import { Toaster } from "sonner";

export interface ToastProviderProps {
  children: ReactNode;
  /** Duração padrão (ms) até o toast fechar sozinho. */
  duration?: number;
}

/**
 * Renderiza o `Toaster` (Sonner) com posição, duração e estilo centralizados.
 * Embrulhe a app com este provider para habilitar `toast.*`.
 * Estilo sem tema próprio do Sonner (`unstyled`): usa os tokens do design system.
 */
export function ToastProvider({ children, duration = 5000 }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        duration={duration}
        closeButton
        icons={{
          success: <CheckCircle2 size={16} aria-hidden="true" />,
          error: <XCircle size={16} aria-hidden="true" />,
          warning: <TriangleAlert size={16} aria-hidden="true" />,
          info: <Info size={16} aria-hidden="true" />,
        }}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "flex w-full items-start gap-3 rounded-xl border p-4 text-body-md shadow-modal bg-surface-container-lowest text-on-surface border-outline-variant",
            title: "font-semibold",
            description: "text-on-surface-variant",
            icon: "mt-0.5 shrink-0",
            closeButton:
              "rounded p-1 text-on-surface-variant hover:bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            success: "border-success-border bg-success-surface text-success-text",
            error: "border-danger-border bg-danger-surface text-danger-text",
            warning: "border-oven-border bg-oven-surface text-oven-text",
            info: "border-info-border bg-surface-container text-info-text",
          },
        }}
      />
    </>
  );
}
