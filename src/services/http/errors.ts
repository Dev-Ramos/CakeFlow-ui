import { isAxiosError } from "axios";

interface ApiErrorOptions {
  status: number | null;
  data?: unknown;
  code?: string;
  cause?: unknown;
}

/**
 * Erro normalizado da camada HTTP. Preserva status e corpo da resposta
 * para que os domínios decidam como apresentar a falha.
 */
export class ApiError extends Error {
  readonly status: number | null;
  readonly data: unknown;
  readonly code: string | undefined;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.status = options.status;
    this.data = options.data;
    this.code = options.code;
  }

  get isNetworkError() {
    return this.status === null;
  }
}

const MENSAGEM_REDE = "Não foi possível conectar ao servidor.";
const MENSAGEM_TIMEOUT = "A requisição excedeu o tempo limite.";
const MENSAGEM_PADRAO = "Ocorreu um erro inesperado.";

function extractMessage(data: unknown): string | undefined {
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    for (const key of ["message", "detail", "error"]) {
      const value = (data as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) return value;
    }
  }
  return undefined;
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    if (error.response) {
      const { status, data } = error.response;
      return new ApiError(extractMessage(data) ?? MENSAGEM_PADRAO, {
        status,
        data,
        code: error.code,
        cause: error,
      });
    }
    const message =
      error.code === "ECONNABORTED" ? MENSAGEM_TIMEOUT : MENSAGEM_REDE;
    return new ApiError(message, {
      status: null,
      code: error.code,
      cause: error,
    });
  }

  return new ApiError(
    error instanceof Error ? error.message : MENSAGEM_PADRAO,
    { status: null, cause: error },
  );
}
