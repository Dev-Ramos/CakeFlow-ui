import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Combobox } from "./Combobox";
import { ComboboxMulti } from "./ComboboxMulti";

const opcoes = [
  { value: "1", label: "Bolo de cenoura" },
  { value: "2", label: "Torta de limão" },
];

describe("Combobox com busca no servidor (onSearch)", () => {
  it("notifica o termo e não filtra as opções localmente", async () => {
    const onSearch = vi.fn();
    render(<Combobox options={opcoes} value={null} onChange={() => {}} onSearch={onSearch} />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.type(screen.getByRole("textbox"), "xyz");

    expect(onSearch).toHaveBeenLastCalledWith("xyz");
    // O servidor é quem filtra: a lista recebida é exibida inteira.
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("sem onSearch, filtra localmente", async () => {
    render(<Combobox options={opcoes} value={null} onChange={() => {}} />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.type(screen.getByRole("textbox"), "limão");

    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("mantém o rótulo da opção escolhida quando a busca a tira da lista", async () => {
    function Exemplo() {
      const [valor, setValor] = useState<string | null>(null);
      const [lista, setLista] = useState(opcoes);
      return (
        <Combobox
          options={lista}
          value={valor}
          onChange={setValor}
          onSearch={(q) => setLista(q ? [] : opcoes)}
        />
      );
    }
    render(<Exemplo />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(screen.getByRole("option", { name: /Torta/ }));
    // Fechou e a lista voltou ao normal; reabre, busca algo que não traz a opção escolhida.
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.type(screen.getByRole("textbox"), "zzz");
    await userEvent.keyboard("{Escape}");

    expect(screen.getByRole("combobox")).toHaveTextContent("Torta de limão");
  });

  it("usa selectedOption para o rótulo antes de a opção vir numa busca", () => {
    render(
      <Combobox
        options={[]}
        value="2"
        onChange={() => {}}
        onSearch={() => {}}
        selectedOption={opcoes[1]}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Torta de limão");
  });
});

describe("ComboboxMulti com busca no servidor (onSearch)", () => {
  it("mantém o chip das opções escolhidas fora da lista atual", () => {
    render(
      <ComboboxMulti
        options={[opcoes[0]]}
        value={["1", "2"]}
        onChange={() => {}}
        onSearch={() => {}}
        selectedOptions={[opcoes[1]]}
      />,
    );
    expect(screen.getByRole("button", { name: "Remover Bolo de cenoura" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remover Torta de limão" })).toBeInTheDocument();
  });

  it("não filtra localmente", async () => {
    render(<ComboboxMulti options={opcoes} value={[]} onChange={() => {}} onSearch={() => {}} />);

    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.type(screen.getByRole("textbox"), "xyz");

    expect(screen.getAllByRole("option")).toHaveLength(2);
  });
});
