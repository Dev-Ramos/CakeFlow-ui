import { z } from "zod";

export const batterTypeSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  description: z.string(),
  active: z.boolean(),
});

export type BatterTypeFormData = z.infer<typeof batterTypeSchema>;
