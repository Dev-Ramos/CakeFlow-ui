import { describe, expect, it } from "vitest";
import { centavosParaTexto, formatarReais, textoParaCentavos } from "./dinheiro";

describe("dinheiro", () => {
  it("formata centavos em reais", () => {
    expect(formatarReais(4500).replace(/\s/g, " ")).toBe("R$ 45,00");
    expect(formatarReais(0).replace(/\s/g, " ")).toBe("R$ 0,00");
  });

  it("preenche o campo com vírgula decimal e vazio quando não há valor", () => {
    expect(centavosParaTexto(4550)).toBe("45,50");
    expect(centavosParaTexto(0)).toBe("0,00");
    expect(centavosParaTexto(null)).toBe("");
  });

  it("converte o texto digitado em centavos inteiros (vírgula ou ponto)", () => {
    expect(textoParaCentavos("45")).toBe(4500);
    expect(textoParaCentavos("45,5")).toBe(4550);
    expect(textoParaCentavos("0.29")).toBe(29); // 0,29 * 100 seria 28.999… sem o arredondamento
    expect(textoParaCentavos("0")).toBe(0);
  });

  it("devolve NaN para vazio, negativo ou texto", () => {
    expect(textoParaCentavos("")).toBeNaN();
    expect(textoParaCentavos("-1")).toBeNaN();
    expect(textoParaCentavos("abc")).toBeNaN();
  });
});
