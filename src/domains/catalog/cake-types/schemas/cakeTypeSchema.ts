import { z } from "zod";
import { idDeSelect } from "../../shared/schemas/campos";

export const MAX_RECHEIOS_PADRAO = 10;

export const cakeTypeSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome."),
  description: z.string(),
  defaultPanSpecId: idDeSelect,
  defaultBatterTypeId: idDeSelect,
  defaultFillingIds: z
    .array(z.number())
    .max(MAX_RECHEIOS_PADRAO, `Escolha no máximo ${MAX_RECHEIOS_PADRAO} recheios.`),
  requiresDecoration: z.boolean(),
  requiresReinforcement: z.boolean(),
  active: z.boolean(),
});

export type CakeTypeFormData = z.infer<typeof cakeTypeSchema>;
