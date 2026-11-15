import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { Formulario } from "./Formulario";

interface Valores {
  nome: string;
  ativo: boolean;
  setor: string;
  obs: string;
}

function Exemplo({
  onSubmit,
  onChangeNome,
}: {
  onSubmit: (v: Valores) => void;
  onChangeNome?: () => void;
}) {
  const form = useForm<Valores>({
    defaultValues: { nome: "", ativo: false, setor: "", obs: "" },
  });
  return (
    <Formulario form={form} label="Cadastro" onSubmit={onSubmit}>
      <Formulario.Input
        name="nome"
        label="Nome"
        required
        descricao="Como aparece no pedido"
        rules={{ required: "Informe o nome." }}
        onChange={onChangeNome}
      />
      <Formulario.Textarea name="obs" label="Observações" />
      <Formulario.Select
        name="setor"
        label="Setor"
        options={[
          { value: "", label: "Todos" },
          { value: "a", label: "Confeitaria" },
        ]}
      />
      <Formulario.Checkbox name="ativo" label="Ativo" descricao="Aparece nas listagens" />
      <button type="submit">Salvar</button>
    </Formulario>
  );
}

describe("Formulario", () => {
  it("mostra erro com role=alert e liga aria-invalid/aria-describedby", async () => {
    render(<Exemplo onSubmit={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("Informe o nome.");

    const campo = screen.getByLabelText(/Nome/);
    expect(campo).toHaveAttribute("aria-invalid", "true");
    const ids = campo.getAttribute("aria-describedby")?.split(" ") ?? [];
    expect(ids).toContain(alerta.id);
    expect(screen.getByText("Como aparece no pedido").id).toBe(ids[0]);
  });

  it("é noValidate e o <form> tem nome acessível", () => {
    render(<Exemplo onSubmit={vi.fn()} />);
    const form = screen.getByRole("form", { name: "Cadastro" });
    expect(form).toHaveAttribute("novalidate");
  });

  it("envia os valores com os tipos corretos e chama o onChange do chamador", async () => {
    const onSubmit = vi.fn();
    const onChangeNome = vi.fn();
    render(<Exemplo onSubmit={onSubmit} onChangeNome={onChangeNome} />);

    await userEvent.type(screen.getByLabelText(/Nome/), "Bolo");
    await userEvent.selectOptions(screen.getByLabelText("Setor"), "a");
    await userEvent.click(screen.getByLabelText("Ativo"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onChangeNome).toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      nome: "Bolo",
      setor: "a",
      ativo: true,
    });
  });
});
