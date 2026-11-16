import { describe, expect, it } from "vitest";
import { deTexto, mesmoValor, paraTexto } from "./valorDeOpcao";

describe("valorDeOpcao", () => {
  it("paraTexto converte para texto e trata vazio", () => {
    expect(paraTexto(3)).toBe("3");
    expect(paraTexto("a")).toBe("a");
    expect(paraTexto(null)).toBe("");
    expect(paraTexto(undefined)).toBe("");
  });

  it("mesmoValor trata 3 e '3' como iguais", () => {
    expect(mesmoValor(3, "3")).toBe(true);
    expect(mesmoValor(3, 4)).toBe(false);
    expect(mesmoValor(null, "")).toBe(true);
  });

  it("deTexto devolve o valor no tipo original da opção", () => {
    const opcoes = [{ value: 1 }, { value: 2 }];
    expect(deTexto(opcoes, "2")).toBe(2);
    expect(deTexto(opcoes, "9")).toBe("9");
  });
});
