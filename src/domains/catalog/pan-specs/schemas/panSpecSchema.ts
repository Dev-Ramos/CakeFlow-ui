import { z } from "zod";
import { ehPositivo, numeroPositivo, paraNumero } from "../../shared/schemas/campos";

export const FORMATOS = [
  { value: "round", label: "Redonda" },
  { value: "rectangular", label: "Retangular" },
  { value: "square", label: "Quadrada" },
] as const;

/** Medidas e altura ficam como texto no formulário e viram número ao enviar. */
export const panSpecSchema = z
  .object({
    name: z.string().trim().min(1, "Informe o nome."),
    shape: z.enum(["round", "rectangular", "square"]),
    diameterCm: z.string(),
    lengthCm: z.string(),
    widthCm: z.string(),
    sideCm: z.string(),
    heightCm: numeroPositivo("Informe a altura (maior que zero)."),
    servings: z.string().refine(
      (texto) => {
        if (texto.trim() === "") return true;
        const numero = paraNumero(texto);
        return Number.isInteger(numero) && numero >= 1;
      },
      { message: "Informe um número inteiro a partir de 1." },
    ),
    active: z.boolean(),
  })
  .superRefine((dados, contexto) => {
    // Só as medidas do formato escolhido são obrigatórias.
    if (dados.shape === "round" && !ehPositivo(dados.diameterCm)) {
      contexto.addIssue({ code: "custom", path: ["diameterCm"], message: "Informe o diâmetro." });
    }
    if (dados.shape === "rectangular") {
      if (!ehPositivo(dados.lengthCm)) {
        contexto.addIssue({ code: "custom", path: ["lengthCm"], message: "Informe o comprimento." });
      }
      if (!ehPositivo(dados.widthCm)) {
        contexto.addIssue({ code: "custom", path: ["widthCm"], message: "Informe a largura." });
      }
    }
    if (dados.shape === "square" && !ehPositivo(dados.sideCm)) {
      contexto.addIssue({ code: "custom", path: ["sideCm"], message: "Informe o lado." });
    }
  });

export type PanSpecFormData = z.infer<typeof panSpecSchema>;
