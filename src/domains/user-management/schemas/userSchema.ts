import { z } from "zod";

/**
 * Formulário de usuário. `roleIds` são os ids numéricos da API: o ComboboxMulti
 * guarda e devolve o valor no tipo da opção, então não há conversão a fazer.
 */
export const userSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  lastName: z.string().trim().min(1, "Informe o sobrenome."),
  email: z.string().trim().min(1, "Informe o e-mail.").pipe(z.email("Informe um e-mail válido.")),
  roleIds: z.array(z.number()).min(1, "Selecione ao menos um cargo."),
});

export type UserFormData = z.infer<typeof userSchema>;
