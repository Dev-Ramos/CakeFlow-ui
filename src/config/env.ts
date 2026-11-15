import { z } from "zod";

/**
 * Único ponto de leitura de import.meta.env.
 * As variáveis vêm do .env na raiz do projeto (ver .env.example).
 */
const envSchema = z.object({
  VITE_API_URL: z.url("VITE_API_URL deve ser uma URL válida"),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(
    `Variáveis de ambiente inválidas:\n${z.prettifyError(parsed.error)}`,
  );
}

export const env = parsed.data;
