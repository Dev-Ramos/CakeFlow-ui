import { z } from "zod";
import {
  idObrigatorio,
  numeroPositivo,
  numeroPositivoOpcional,
} from "../../shared/schemas/campos";

export const UNIDADES_SUGERIDAS = ["g", "kg", "ml", "l", "un"];

/** Campos numéricos ficam como texto no formulário e viram número ao enviar. */
export const technicalSheetSchema = z.object({
  panSpecId: idObrigatorio("Selecione a forma."),
  batterTypeId: idObrigatorio("Selecione a massa."),
  batterQuantityG: numeroPositivo("Informe a quantidade de massa (maior que zero)."),
  bakeTempC: numeroPositivoOpcional("A temperatura deve ser maior que zero."),
  bakeTimeMin: numeroPositivoOpcional("O tempo deve ser maior que zero."),
  notes: z.string(),
  ingredients: z.array(
    z.object({
      name: z.string().trim().min(1, "Informe o ingrediente."),
      quantity: numeroPositivo("Quantidade maior que zero."),
      unit: z.string().trim().min(1, "Informe a unidade.").max(20, "Até 20 caracteres."),
    }),
  ),
});

export type TechnicalSheetFormData = z.infer<typeof technicalSheetSchema>;
