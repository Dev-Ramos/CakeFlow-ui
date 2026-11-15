import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import { Formulario } from "../formulario/Formulario";
import { FormDialog } from "./FormDialog";

function Exemplo() {
  const [open, setOpen] = useState(true);
  const form = useForm({ defaultValues: { nome: "" } });
  return (
    <>
      <p>{open ? "aberto" : "fechado"}</p>
      <FormDialog
        open={open}
        onOpenChange={setOpen}
        titulo="Novo item"
        confirmacaoDescarte={{ titulo: "Descartar?" }}
        isDirty={form.formState.isDirty}
      >
        <Formulario form={form} label="Item" onSubmit={() => {}}>
          <Formulario.Input name="nome" label="Nome" />
          <FormDialog.Actions submitLabel="Salvar" />
        </Formulario>
      </FormDialog>
    </>
  );
}

describe("FormDialog", () => {
  it("fecha direto quando o formulário está limpo", async () => {
    renderWithProviders(<Exemplo />);
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.getByText("fechado")).toBeInTheDocument());
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("pede confirmação ao fechar sujo e mantém aberto se o usuário cancelar", async () => {
    renderWithProviders(<Exemplo />);
    await userEvent.type(screen.getByLabelText("Nome"), "x");
    await userEvent.keyboard("{Escape}");

    const confirmacao = await screen.findByRole("alertdialog");
    expect(confirmacao).toHaveTextContent("Descartar?");

    await userEvent.click(within(confirmacao).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(screen.getByText("aberto")).toBeInTheDocument();
  });

  it("descarta e fecha ao confirmar", async () => {
    renderWithProviders(<Exemplo />);
    await userEvent.type(screen.getByLabelText("Nome"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    await userEvent.click(await screen.findByRole("button", { name: "Descartar" }));
    await waitFor(() => expect(screen.getByText("fechado")).toBeInTheDocument());
  });
});
