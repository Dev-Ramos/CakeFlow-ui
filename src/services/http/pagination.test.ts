import { describe, expect, it, vi } from "vitest";
import { buscarTodas, mapPaginated, type Paginated } from "./pagination";

function pagina(numero: number, itens: number[], pages: number): Paginated<number> {
  return { data: itens, meta: { page: numero, limit: 2, count: 5, pages } };
}

describe("mapPaginated", () => {
  it("converte os itens e preserva o meta", () => {
    const resultado = mapPaginated(pagina(1, [1, 2], 3), (n) => `#${n}`);
    expect(resultado.data).toEqual(["#1", "#2"]);
    expect(resultado.meta).toEqual({ page: 1, limit: 2, count: 5, pages: 3 });
  });
});

describe("buscarTodas", () => {
  it("percorre todas as páginas com o limite informado", async () => {
    const buscar = vi
      .fn()
      .mockResolvedValueOnce(pagina(1, [1, 2], 3))
      .mockResolvedValueOnce(pagina(2, [3, 4], 3))
      .mockResolvedValueOnce(pagina(3, [5], 3));

    expect(await buscarTodas(buscar, 2)).toEqual([1, 2, 3, 4, 5]);
    expect(buscar).toHaveBeenNthCalledWith(1, { page: 1, limit: 2 });
    expect(buscar).toHaveBeenNthCalledWith(3, { page: 3, limit: 2 });
  });

  it("faz uma única chamada quando há só uma página", async () => {
    const buscar = vi.fn().mockResolvedValue(pagina(1, [1], 1));
    expect(await buscarTodas(buscar)).toEqual([1]);
    expect(buscar).toHaveBeenCalledTimes(1);
    expect(buscar).toHaveBeenCalledWith({ page: 1, limit: 100 });
  });
});
