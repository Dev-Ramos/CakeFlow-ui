import { enviarImagem } from "../api/uploadsApi";
import {
  soDigitos,
  type OrderFormData,
  type OrderItemFormData,
  type TierFormData,
} from "../schemas/orderSchema";
import type { Order, OrderInput, OrderItemInput, PricePreviewInput } from "../types/order";
import { deDatetimeLocal, paraDatetimeLocal } from "./datas";

export const ANDAR_NOVO: TierFormData = {
  panSpecId: "",
  batterTypeId: "",
  layersCount: 1,
  fillingIds: [],
  notes: "",
};

export const BOLO_NOVO: OrderItemFormData = {
  cakeTypeId: "",
  title: "",
  colors: "",
  dedicationText: "",
  hasDecoration: false,
  decorationKinds: [],
  decorationDetails: "",
  hasReinforcement: false,
  allergiesNotes: "",
  notes: "",
  referenceImageUrl: null,
  referenceImageFile: null,
  removeReferenceImage: false,
  decorationImageUrls: [],
  decorationFiles: [],
  tiers: [ANDAR_NOVO],
};

/** Hoje no calendário local, `AAAA-MM-DD`. */
function hoje(): string {
  const d = new Date();
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

/** Valores do formulário: pedido novo (um bolo vazio) ou os de um pedido existente. */
export function valoresIniciais(pedido?: Order): OrderFormData {
  if (!pedido) {
    return {
      customerName: "",
      customerPhone: "",
      fulfillmentType: "delivery",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      reference: "",
      productionDate: hoje(),
      deliveryAt: "",
      notes: "",
      items: [BOLO_NOVO],
    };
  }
  return {
    customerName: pedido.customerName,
    customerPhone: pedido.customerPhone,
    fulfillmentType: pedido.fulfillmentType,
    ...pedido.address,
    productionDate: pedido.productionDate,
    deliveryAt: paraDatetimeLocal(pedido.deliveryAt),
    notes: pedido.notes,
    items: pedido.items.map((bolo) => ({
      itemId: bolo.id,
      cakeTypeId: bolo.cakeType?.id ?? "",
      title: bolo.title,
      colors: bolo.colors,
      dedicationText: bolo.dedicationText,
      hasDecoration: bolo.hasDecoration,
      decorationKinds: bolo.decorationKinds,
      decorationDetails: bolo.decorationDetails,
      hasReinforcement: bolo.hasReinforcement,
      allergiesNotes: bolo.allergiesNotes,
      notes: bolo.notes,
      referenceImageUrl: bolo.referenceImageUrl,
      referenceImageFile: null,
      removeReferenceImage: false,
      decorationImageUrls: bolo.decorationImageUrls,
      decorationFiles: [],
      tiers: bolo.tiers.map((andar) => ({
        panSpecId: andar.panSpec.id,
        batterTypeId: andar.batterType.id,
        layersCount: andar.layersCount,
        fillingIds: andar.fillings.map((r) => r.id),
        notes: andar.notes,
      })),
    })),
  };
}

/**
 * Formulário → corpo da API. As imagens novas são enviadas aqui (`POST /uploads`) e o pedido
 * leva só o `signed_id`; se um envio falhar, nada do pedido é gravado.
 */
export async function paraInput(dados: OrderFormData): Promise<OrderInput> {
  const items: OrderItemInput[] = [];
  for (const bolo of dados.items) {
    const referencia = bolo.referenceImageFile ? await enviarImagem(bolo.referenceImageFile) : null;
    const decoracao = await Promise.all(bolo.decorationFiles.map(enviarImagem));
    items.push({
      id: bolo.itemId,
      cakeTypeId: bolo.cakeTypeId === "" ? null : bolo.cakeTypeId,
      title: bolo.title.trim(),
      colors: bolo.colors,
      dedicationText: bolo.dedicationText,
      referenceImageSignedId: referencia?.signedId,
      removeReferenceImage: !referencia && bolo.removeReferenceImage,
      hasDecoration: bolo.hasDecoration,
      decorationKinds: bolo.decorationKinds,
      decorationDetails: bolo.decorationDetails,
      decorationImageSignedIds: decoracao.map((imagem) => imagem.signedId),
      hasReinforcement: bolo.hasReinforcement,
      allergiesNotes: bolo.allergiesNotes,
      notes: bolo.notes,
      tiers: bolo.tiers.map((andar) => ({
        panSpecId: Number(andar.panSpecId),
        batterTypeId: Number(andar.batterTypeId),
        layersCount: andar.layersCount,
        fillingIds: andar.fillingIds,
        notes: andar.notes,
      })),
    });
  }
  return {
    customerName: dados.customerName.trim(),
    customerPhone: soDigitos(dados.customerPhone),
    fulfillmentType: dados.fulfillmentType,
    address: {
      street: dados.street,
      number: dados.number,
      complement: dados.complement,
      neighborhood: dados.neighborhood,
      city: dados.city,
      reference: dados.reference,
    },
    productionDate: dados.productionDate,
    deliveryAt: deDatetimeLocal(dados.deliveryAt),
    notes: dados.notes,
    items,
  };
}

type ParcialDoBolo = {
  hasReinforcement?: boolean;
  tiers?: Array<{ panSpecId?: number | ""; layersCount?: number; fillingIds?: number[] } | undefined>;
};

/** Só o que o cálculo lê; `null` enquanto algum andar não tem forma e ao menos um recheio. */
export function paraPreview(
  tipo: "delivery" | "pickup" | undefined,
  bolos: Array<ParcialDoBolo | undefined> | undefined,
): PricePreviewInput | null {
  if (!tipo || !bolos || bolos.length === 0) return null;
  const itens: PricePreviewInput["items"] = [];
  for (const bolo of bolos) {
    const andares = bolo?.tiers ?? [];
    if (andares.length === 0) return null;
    const tiers: PricePreviewInput["items"][number]["tiers"] = [];
    for (const andar of andares) {
      if (!andar || andar.panSpecId === "" || andar.panSpecId === undefined) return null;
      if (!andar.fillingIds || andar.fillingIds.length === 0) return null;
      tiers.push({
        panSpecId: Number(andar.panSpecId),
        layersCount: andar.layersCount ?? 1,
        fillingIds: andar.fillingIds,
      });
    }
    itens.push({ hasReinforcement: bolo?.hasReinforcement ?? false, tiers });
  }
  return { fulfillmentType: tipo, items: itens };
}
