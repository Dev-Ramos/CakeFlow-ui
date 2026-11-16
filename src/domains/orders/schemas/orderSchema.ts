import { z } from "zod";
import { idObrigatorio, idDeSelect } from "@/domains/catalog/shared/schemas/campos";

export const TIPOS_DE_DECORACAO = [
  { value: "plaque", label: "Placa" },
  { value: "topper_3d", label: "Topo 3D" },
  { value: "titura", label: "Titura" },
  { value: "other", label: "Outro" },
] as const;

export const MAX_ANDARES = 3;
export const MAX_CAMADAS = 3;

/** D6: 1 camada = até 2 recheios; 2 ou 3 camadas = até 3. */
export const maxRecheios = (camadas: number) => (camadas === 1 ? 2 : 3);

const soDigitos = (texto: string) => texto.replace(/\D/g, "");

const andarSchema = z
  .object({
    panSpecId: idObrigatorio("Escolha a forma."),
    batterTypeId: idObrigatorio("Escolha a massa."),
    layersCount: z.number().int().min(1).max(MAX_CAMADAS),
    fillingIds: z.array(z.number()),
    notes: z.string(),
  })
  .superRefine((andar, ctx) => {
    const max = maxRecheios(andar.layersCount);
    if (andar.fillingIds.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["fillingIds"],
        message: "Escolha ao menos um recheio.",
      });
    } else if (andar.fillingIds.length > max) {
      ctx.addIssue({
        code: "custom",
        path: ["fillingIds"],
        message: `Com ${andar.layersCount} ${andar.layersCount === 1 ? "camada" : "camadas"}, no máximo ${max} recheios.`,
      });
    }
  });

const itemSchema = z
  .object({
    /**
     * Id do bolo já salvo (edição); ausente = bolo novo. Não se chama `id` porque o
     * `useFieldArray` usa essa chave para a sua própria identificação e a sobrescreveria.
     */
    itemId: z.number().optional(),
    cakeTypeId: idDeSelect,
    title: z.string().trim().min(1, "Informe o título do bolo."),
    colors: z.string(),
    dedicationText: z.string(),
    hasDecoration: z.boolean(),
    decorationKinds: z.array(z.enum(["plaque", "topper_3d", "titura", "other"])),
    decorationDetails: z.string(),
    hasReinforcement: z.boolean(),
    allergiesNotes: z.string(),
    notes: z.string(),
    // Imagens: o que já está salvo (só para exibir) e os arquivos novos, enviados ao salvar.
    referenceImageUrl: z.string().nullable(),
    referenceImageFile: z.custom<File | null>(),
    removeReferenceImage: z.boolean(),
    decorationImageUrls: z.array(z.string()),
    decorationFiles: z.array(z.custom<File>()),
    tiers: z.array(andarSchema).min(1, "O bolo precisa de ao menos um andar.").max(MAX_ANDARES),
  })
  .superRefine((item, ctx) => {
    if (item.hasDecoration && item.decorationKinds.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["decorationKinds"],
        message: "Escolha ao menos um tipo de decoração.",
      });
    }
  });

const obrigatorio = (mensagem: string) => z.string().trim().min(1, mensagem);

export const orderSchema = z
  .object({
    customerName: obrigatorio("Informe o nome do cliente."),
    customerPhone: z.string().refine((t) => [10, 11].includes(soDigitos(t).length), {
      message: "Informe o telefone com DDD (10 ou 11 dígitos).",
    }),
    fulfillmentType: z.enum(["delivery", "pickup"]),
    street: z.string(),
    number: z.string(),
    complement: z.string(),
    neighborhood: z.string(),
    city: z.string(),
    reference: z.string(),
    productionDate: obrigatorio("Informe a data de produção."),
    deliveryAt: obrigatorio("Informe a data e a hora da entrega."),
    notes: z.string(),
    items: z.array(itemSchema).min(1, "O pedido precisa de ao menos um bolo."),
  })
  .superRefine((pedido, ctx) => {
    if (pedido.fulfillmentType === "delivery") {
      const obrigatorios = [
        ["street", "a rua"],
        ["number", "o número"],
        ["neighborhood", "o bairro"],
        ["city", "a cidade"],
        ["reference", "o ponto de referência"],
      ] as const;
      for (const [campo, nome] of obrigatorios) {
        if (pedido[campo].trim() === "") {
          ctx.addIssue({
            code: "custom",
            path: [campo],
            message: `Informe ${nome}.`,
          });
        }
      }
    }
    // `AAAA-MM-DD` compara como texto. A entrega não pode ser antes da produção (RN-02).
    if (
      pedido.deliveryAt &&
      pedido.productionDate &&
      pedido.deliveryAt.slice(0, 10) < pedido.productionDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["deliveryAt"],
        message: "A entrega não pode ser antes da data de produção.",
      });
    }
  });

export type OrderFormData = z.infer<typeof orderSchema>;
export type OrderItemFormData = OrderFormData["items"][number];
export type TierFormData = OrderItemFormData["tiers"][number];
export { soDigitos };
