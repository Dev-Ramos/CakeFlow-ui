import { toast as sonner } from "sonner";

export interface ToastOptions {
  description?: string;
  /** Duração em ms; ausente = padrão do `ToastProvider`. */
  duration?: number;
}

/**
 * API de notificações do CakeFlow. Encapsula o Sonner: domínios importam apenas
 * `@/ui/toast/toast`, nunca a biblioteca.
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => sonner.success(message, options),
  error: (message: string, options?: ToastOptions) => sonner.error(message, options),
  warning: (message: string, options?: ToastOptions) => sonner.warning(message, options),
  info: (message: string, options?: ToastOptions) => sonner.info(message, options),
};
