import { z } from "zod";

/** Mínimo do Devise na API; a validação definitiva é do servidor. */
export const SENHA_MINIMA = 6;

export const perfilSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  lastName: z.string().trim().min(1, "Informe o sobrenome."),
});

export type PerfilFormData = z.infer<typeof perfilSchema>;

export const trocarSenhaSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    password: z
      .string()
      .min(1, "Informe a nova senha.")
      .min(SENHA_MINIMA, `Use pelo menos ${SENHA_MINIMA} caracteres.`),
    passwordConfirmation: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((dados) => dados.password === dados.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "As senhas não conferem.",
  });

export type TrocarSenhaFormData = z.infer<typeof trocarSenhaSchema>;
