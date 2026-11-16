import { describe, expect, it } from "vitest";
import { ANDAR_NOVO, BOLO_NOVO, valoresIniciais } from "../lib/pedidoForm";
import { maxRecheios, orderSchema, type OrderFormData } from "../schemas/orderSchema";

/** Pedido válido de retirada com um bolo; os testes estragam só o que querem provar. */
function pedidoValido(): OrderFormData {
  return {
    ...valoresIniciais(),
    customerName: "Ana",
    customerPhone: "11988881111",
    fulfillmentType: "pickup",
    productionDate: "2099-11-14",
    deliveryAt: "2099-11-14T09:00",
    items: [
      {
        ...BOLO_NOVO,
        title: "Bolo",
        tiers: [{ ...ANDAR_NOVO, panSpecId: 1, batterTypeId: 2, fillingIds: [4] }],
      },
    ],
  };
}

const mensagens = (pedido: OrderFormData) => {
  const resultado = orderSchema.safeParse(pedido);
  return resultado.success ? [] : resultado.error.issues.map((i) => i.message);
};

describe("orderSchema", () => {
  it("aceita um pedido completo", () => {
    expect(mensagens(pedidoValido())).toEqual([]);
  });

  it("limita recheios pelas camadas (D6): 1 camada = 2; 2 ou 3 camadas = 3", () => {
    expect(maxRecheios(1)).toBe(2);
    expect(maxRecheios(2)).toBe(3);
    expect(maxRecheios(3)).toBe(3);

    const comRecheios = (camadas: number, ids: number[]) => {
      const pedido = pedidoValido();
      pedido.items[0].tiers[0] = { ...pedido.items[0].tiers[0], layersCount: camadas, fillingIds: ids };
      return mensagens(pedido);
    };
    expect(comRecheios(1, [1, 2])).toEqual([]);
    expect(comRecheios(1, [1, 2, 3])).toEqual(["Com 1 camada, no máximo 2 recheios."]);
    expect(comRecheios(2, [1, 2, 3])).toEqual([]);
    expect(comRecheios(3, [1, 2, 3, 4])).toEqual(["Com 3 camadas, no máximo 3 recheios."]);
    expect(comRecheios(1, [])).toEqual(["Escolha ao menos um recheio."]);
  });

  it("aceita no máximo 3 andares por bolo", () => {
    const pedido = pedidoValido();
    pedido.items[0].tiers = Array.from({ length: 4 }, () => ({
      ...ANDAR_NOVO,
      panSpecId: 1,
      batterTypeId: 2,
      fillingIds: [4],
    }));
    expect(orderSchema.safeParse(pedido).success).toBe(false);
  });

  it("entrega exige o endereço, menos o complemento; retirada não", () => {
    const entrega = { ...pedidoValido(), fulfillmentType: "delivery" as const };
    expect(mensagens(entrega)).toEqual([
      "Informe a rua.",
      "Informe o número.",
      "Informe o bairro.",
      "Informe a cidade.",
      "Informe o ponto de referência.",
    ]);
  });

  it("aceita telefone com máscara (10 ou 11 dígitos) e recusa os demais", () => {
    expect(mensagens({ ...pedidoValido(), customerPhone: "(11) 98888-1111" })).toEqual([]);
    expect(mensagens({ ...pedidoValido(), customerPhone: "(11) 8888-1111" })).toEqual([]);
    expect(mensagens({ ...pedidoValido(), customerPhone: "1188881111222" })).toHaveLength(1);
  });

  it("a entrega não pode ser antes da produção", () => {
    expect(mensagens({ ...pedidoValido(), deliveryAt: "2099-11-13T23:00" })).toEqual([
      "A entrega não pode ser antes da data de produção.",
    ]);
  });

  it("decoração exige ao menos um tipo", () => {
    const pedido = pedidoValido();
    pedido.items[0] = { ...pedido.items[0], hasDecoration: true };
    expect(mensagens(pedido)).toEqual(["Escolha ao menos um tipo de decoração."]);
  });
});
