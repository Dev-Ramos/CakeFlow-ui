import { z } from "zod";

/**
 * Valida o usuário lido do localStorage: o dado salvo pode estar em formato
 * antigo ou ter sido alterado, então nunca é usado sem passar por aqui.
 */
export const usuarioSchema = z.object({
  id: z.number(),
  name: z.string(),
  lastName: z.string(),
  email: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});
