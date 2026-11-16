import { z } from "zod";

export const SENHA_TAMANHO_MINIMO = 8;

export const loginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail.").pipe(z.email("Informe um e-mail válido.")),
  password: z.string().min(1, "Informe a senha."),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Regra mínima de senha no front (a validação definitiva é do servidor).
 * Ajustar quando a política real do backend for definida.
 */
export const definirSenhaSchema = z
  .object({
    password: z
      .string()
      .min(1, "Informe a nova senha.")
      .min(SENHA_TAMANHO_MINIMO, `Use pelo menos ${SENHA_TAMANHO_MINIMO} caracteres.`),
    confirmPassword: z.string().min(1, "Confirme a senha."),
  })
  .refine((dados) => dados.password === dados.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem.",
  });

export type DefinirSenhaFormData = z.infer<typeof definirSenhaSchema>;
