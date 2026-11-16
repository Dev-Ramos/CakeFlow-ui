import { z } from "zod";

export const roleSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do cargo."),
  description: z.string().trim(),
  permissionIds: z.array(z.number()),
});

export type RoleFormData = z.infer<typeof roleSchema>;
