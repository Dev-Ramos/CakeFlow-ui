import { z } from "zod";

export const fillingSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  description: z.string(),
  active: z.boolean(),
});

export type FillingFormData = z.infer<typeof fillingSchema>;
