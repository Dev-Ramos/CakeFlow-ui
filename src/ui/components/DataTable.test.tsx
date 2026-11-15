import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DataTable, type DataTableColumn } from "./DataTable";

interface Linha {
  id: number;
  nome: string | null;
  qtd: number;
}

const columns: Array<DataTableColumn<Linha>> = [
  { key: "nome", header: "Nome", render: (r) => r.nome, sortAccessor: (r) => r.nome },
  { key: "qtd", header: "Qtd", render: (r) => r.qtd, sortAccessor: (r) => r.qtd },
];

const rows: Linha[] = [
  { id: 1, nome: "Bolo", qtd: 3 },
  { id: 2, nome: null, qtd: 1 },
  { id: 3, nome: "Alfajor", qtd: 2 },
];

function nomesNaOrdem() {
  return screen
    .getAllByRole("row")
    .slice(1)
    .map((tr) => within(tr).getAllByRole("cell")[0].textContent);
}

describe("DataTable", () => {
  it("mostra o estado vazio padrão", () => {
    render(<DataTable columns={columns} rows={[]} getRowKey={(r) => r.id} />);
    expect(screen.getByText("Nenhum registro encontrado.")).toBeInTheDocument();
  });

  it("mostra skeleton ao carregar, sem as linhas de dados", () => {
    render(<DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} loading />);
    expect(screen.queryByText("Bolo")).not.toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(6); // cabeçalho + 5 skeletons
  });

  it("degrada para vazio quando rows não é array", () => {
    render(
      <DataTable
        columns={columns}
        rows={{ itens: rows } as unknown as Linha[]}
        getRowKey={(r) => r.id}
      />,
    );
    expect(screen.getByText("Nenhum registro encontrado.")).toBeInTheDocument();
  });

  it("ordena em ciclo asc → desc → nenhuma, com nulos por último e aria-sort", async () => {
    render(<DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} />);
    const cabecalhoNome = screen.getByRole("columnheader", { name: /Nome/ });
    const botao = within(cabecalhoNome).getByRole("button");

    expect(cabecalhoNome).toHaveAttribute("aria-sort", "none");

    await userEvent.click(botao);
    expect(cabecalhoNome).toHaveAttribute("aria-sort", "ascending");
    expect(nomesNaOrdem()).toEqual(["Alfajor", "Bolo", ""]);

    await userEvent.click(botao);
    expect(cabecalhoNome).toHaveAttribute("aria-sort", "descending");
    expect(nomesNaOrdem()).toEqual(["Bolo", "Alfajor", ""]);

    await userEvent.click(botao);
    expect(cabecalhoNome).toHaveAttribute("aria-sort", "none");
    expect(nomesNaOrdem()).toEqual(["Bolo", "", "Alfajor"]);
  });

  it("scrollX com caption torna o scroller focável e nomeado", () => {
    render(
      <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} scrollX caption="Itens" />,
    );
    expect(screen.getByRole("group", { name: "Itens" })).toHaveAttribute("tabindex", "0");
  });

  it("renderiza rowDetail abaixo da linha", () => {
    render(
      <DataTable
        columns={columns}
        rows={rows}
        getRowKey={(r) => r.id}
        rowDetail={(r) => (r.id === 1 ? <p>Detalhe do bolo</p> : null)}
      />,
    );
    expect(screen.getByText("Detalhe do bolo")).toBeInTheDocument();
  });
});
