import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

function navegacao() {
  return screen.getByRole("navigation", { name: "Paginação" });
}

describe("Pagination", () => {
  it("resume o intervalo e o total, com o nome dos itens", () => {
    render(
      <Pagination
        page={2}
        limit={10}
        count={35}
        pages={4}
        rotulo="colaboradores"
        onPageChange={() => {}}
      />,
    );

    expect(navegacao()).toHaveTextContent("Mostrando 11 a 20 de 35 colaboradores");
  });

  it("usa 'registros' quando não há rótulo", () => {
    render(<Pagination page={1} limit={10} count={3} pages={1} onPageChange={() => {}} />);
    expect(navegacao()).toHaveTextContent("Mostrando 1 a 3 de 3 registros");
  });

  it("desabilita Anterior na primeira página e avança com Próxima", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} limit={10} count={35} pages={4} onPageChange={onPageChange} />);

    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("desabilita Próxima na última página e volta com Anterior", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={4} limit={10} count={35} pages={4} onPageChange={onPageChange} />);

    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Anterior" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("mostra as páginas numeradas, marca a atual e permite ir direto a uma", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} limit={10} count={35} pages={4} onPageChange={onPageChange} />);

    const atual = screen.getByRole("button", { name: "Página 2" });
    expect(atual).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Página 3" })).not.toHaveAttribute("aria-current");

    await userEvent.click(screen.getByRole("button", { name: "Página 4" }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("resume com reticências quando há muitas páginas", () => {
    render(<Pagination page={10} limit={10} count={200} pages={20} onPageChange={() => {}} />);

    const nomes = within(navegacao())
      .getAllByRole("button", { name: /^Página / })
      .map((botao) => botao.getAttribute("aria-label"));
    expect(nomes).toEqual(["Página 1", "Página 9", "Página 10", "Página 11", "Página 20"]);
    expect(navegacao()).toHaveTextContent("…");
  });

  it("usa o total de páginas da API (pages) em vez de recalcular", () => {
    render(<Pagination page={1} limit={10} count={35} pages={9} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Página 9" })).toBeInTheDocument();
  });

  it("calcula as páginas a partir de count e limit quando pages não vem", () => {
    render(<Pagination page={1} limit={10} count={35} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "Página 4" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Página 5" })).not.toBeInTheDocument();
  });

  it("sem registros mostra 0 a 0 de 0, uma página e os dois lados desabilitados", () => {
    render(<Pagination page={1} limit={10} count={0} pages={0} onPageChange={() => {}} />);

    expect(navegacao()).toHaveTextContent("Mostrando 0 a 0 de 0 registros");
    expect(screen.getByRole("button", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("limita a página ao intervalo válido", () => {
    render(<Pagination page={99} limit={10} count={25} pages={3} onPageChange={() => {}} />);

    expect(screen.getByRole("button", { name: "Página 3" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Próxima" })).toBeDisabled();
  });

  it("só mostra o seletor de limite quando onLimitChange é informado", () => {
    const { rerender } = render(
      <Pagination page={1} limit={20} count={35} pages={2} onPageChange={() => {}} />,
    );
    expect(screen.queryByRole("combobox", { name: "Itens por página" })).not.toBeInTheDocument();

    rerender(
      <Pagination
        page={1}
        limit={20}
        count={35}
        pages={2}
        onPageChange={() => {}}
        onLimitChange={() => {}}
      />,
    );
    expect(screen.getByRole("combobox", { name: "Itens por página" })).toHaveTextContent(
      "20 por página",
    );
  });
});
