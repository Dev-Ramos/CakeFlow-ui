import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Tabs } from "./Tabs";

const itens = [
  { value: "a", label: "Formas" },
  { value: "b", label: "Massas" },
  { value: "c", label: "Recheios" },
];

function Exemplo() {
  const [valor, setValor] = useState("a");
  return (
    <Tabs items={itens} value={valor} onChange={setValor} ariaLabel="Componentes">
      <p>conteúdo {valor}</p>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("expõe tablist, abas e painel com os vínculos ARIA", () => {
    render(<Exemplo />);

    expect(screen.getByRole("tablist", { name: "Componentes" })).toBeInTheDocument();
    const selecionada = screen.getByRole("tab", { name: "Formas" });
    expect(selecionada).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Massas" })).toHaveAttribute("aria-selected", "false");
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", selecionada.id);
    expect(screen.getByText("conteúdo a")).toBeInTheDocument();
  });

  it("troca de aba ao clicar", async () => {
    render(<Exemplo />);

    await userEvent.click(screen.getByRole("tab", { name: "Massas" }));

    expect(screen.getByRole("tab", { name: "Massas" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("conteúdo b")).toBeInTheDocument();
  });

  it("navega com setas, Home e End, movendo também o foco", async () => {
    render(<Exemplo />);
    screen.getByRole("tab", { name: "Formas" }).focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Massas" })).toHaveFocus();
    expect(screen.getByRole("tab", { name: "Massas" })).toHaveAttribute("aria-selected", "true");

    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Recheios" })).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Formas" })).toHaveFocus();

    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Recheios" })).toHaveFocus();

    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Formas" })).toHaveFocus();
  });

  it("só a aba selecionada entra na ordem de tabulação", () => {
    render(<Exemplo />);
    expect(screen.getByRole("tab", { name: "Formas" })).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Massas" })).toHaveAttribute("tabindex", "-1");
  });
});
