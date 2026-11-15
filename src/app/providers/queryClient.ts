import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "@/ui/toast/toast";
import { ApiError } from "@/services/http/errors";

const MAX_RETRIES = 2;

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: {
      /** Não exibe o toast global de erro (o chamador trata a falha). */
      silenciarToast?: boolean;
    };
  }
}

function shouldRetry(failureCount: number, error: unknown) {
  // Erros 4xx são determinísticos: repetir não ajuda.
  if (error instanceof ApiError && error.status !== null && error.status < 500) {
    return false;
  }
  return failureCount < MAX_RETRIES;
}

export function createQueryClient() {
  return new QueryClient({
    // Toast global de erro de mutação. Mutations que tratam a falha por conta
    // própria passam `meta: { silenciarToast: true }`.
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        if (mutation.meta?.silenciarToast) return;
        toast.error(error.message);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
