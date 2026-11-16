import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { Formulario } from "./Formulario";

/**
 * A API manda ids numéricos e o DOM só entende texto. Cada seletor deve guardar
 * e enviar o valor NO TIPO da opção (número), e mostrar o valor inicial numérico.
 */
interface Valores {
  setor: number;
  turno: number;
  cargo: number | "";
  cargos: number[];
  selecionados: number[];
}

const opcoes = [
  { value: 1, label: "Confeitaria" },
  { value: 2, label: "Padaria" },
  { value: 3, label: "Entrega" },
];

function Exemplo({ onSubmit }: { onSubmit: (v: Valores) => void }) {
  const form = useForm<Valores>({
    defaultValues: { setor: 2, turno: 3, cargo: "", cargos: [1], selecionados: [2, 3] },
  });
  return (
    <Formulario form={form} label="Cadastro" onSubmit={onSubmit}>
      <Formulario.Select name="setor" label="Setor" options={opcoes} />
      <Formulario.RadioBox name="turno" label="Turno" options={opcoes} />
      <Formulario.Combobox name="cargo" label="Cargo" options={opcoes} placeholder="Escolha" />
      <Formulario.ComboboxMulti name="cargos" label="Cargos" options={opcoes} />
      <Formulario.SelectMulti name="selecionados" label="Selecionados" options={opcoes} />
      <button type="submit">Salvar</button>
    </Formulario>
  );
}

/** Abre o combobox e escolhe a opção na lista dele (o select nativo também tem `option`s). */
async function escolher(combobox: RegExp, opcao: string) {
  const gatilho = screen.getByRole("combobox", { name: combobox });
  await userEvent.click(gatilho);
  const lista = document.getElementById(gatilho.getAttribute("aria-controls") ?? "") as HTMLElement;
  await userEvent.click(within(lista).getByRole("option", { name: opcao }));
}

describe("Formulario com valores numéricos", () => {
  it("mostra os valores iniciais numéricos nos controles", () => {
    render(<Exemplo onSubmit={vi.fn()} />);

    expect(screen.getByLabelText("Setor")).toHaveValue("2");
    expect(screen.getByLabelText("Padaria", { selector: "input[type=radio]" })).not.toBeChecked();
    expect(screen.getByLabelText("Entrega", { selector: "input[type=radio]" })).toBeChecked();
    const marcados = Array.from(
      (screen.getByLabelText("Selecionados") as HTMLSelectElement).selectedOptions,
      (o) => o.value,
    );
    expect(marcados).toEqual(["2", "3"]);
    expect(screen.getByRole("button", { name: "Remover Confeitaria" })).toBeInTheDocument();
  });

  it("envia números (não textos) depois de o usuário escolher", async () => {
    const onSubmit = vi.fn();
    render(<Exemplo onSubmit={onSubmit} />);

    await userEvent.selectOptions(screen.getByLabelText("Setor"), "3");
    await userEvent.click(screen.getByLabelText("Padaria", { selector: "input[type=radio]" }));
    await userEvent.selectOptions(screen.getByLabelText("Selecionados"), ["1"]);

    await escolher(/^Cargo$/, "Padaria");
    await escolher(/^Cargos$/, "Entrega");

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onSubmit).toHaveBeenCalledOnce();
    const enviado = onSubmit.mock.calls[0][0] as Valores;
    expect(enviado.setor).toBe(3);
    expect(enviado.turno).toBe(2);
    expect(enviado.cargo).toBe(2);
    expect(enviado.cargos).toEqual([1, 3]);
    // `selectOptions` acrescenta à seleção inicial [2, 3]; o que importa é o tipo: números.
    expect(enviado.selecionados).toEqual([1, 2, 3]);
  });
});
