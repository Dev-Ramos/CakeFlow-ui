import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { API, renderAuth } from "@/domains/auth/test/renderAuth";
import { paginar } from "@/domains/user-management/test/fixtures";
import { limparSessao, logarComo } from "@/domains/user-management/test/sessao";
import { server } from "@/test/server";
import { ConfirmProvider } from "@/ui/confirm/ConfirmProvider";
import { RecheiosTab } from "../components/RecheiosTab";
import type { FillingPayload } from "../types/filling";

const TODAS = ["fillings.index", "fillings.create", "fillings.update", "fillings.delete"];

const RECHEIOS: FillingPayload[] = [
  { id: 1, name: "Brigadeiro", description: null, active: true, priced: true },
  { id: 2, name: "Ninho", description: null, active: false, priced: false },
];

/** API de recheios em memória, paginada como a real. */
function apiDeRecheios() {
  const chamadas: { criados: unknown[]; excluidos: string[] } = { criados: [], excluidos: [] };

  server.use(
    http.get(`${API}/fillings`, ({ request }) => HttpResponse.json(paginar(RECHEIOS, new URL(request.url)))),
    http.post(`${API}/fillings`, async ({ request }) => {
      chamadas.criados.push(await request.json());
      return HttpResponse.json({ id: 99 }, { status: 201 });
    }),
    http.delete(`${API}/fillings/:id`, ({ params }) => {
      chamadas.excluidos.push(String(params.id));
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return chamadas;
}

function renderAba() {
  return renderAuth(
    <ConfirmProvider>
      <RecheiosTab />
    </ConfirmProvider>,
  );
}

afterEach(limparSessao);

describe("RecheiosTab", () => {
  it("trava o alternador Ativo enquanto o recheio não tem preço e envia active=false", async () => {
    logarComo(TODAS);
    const chamadas = apiDeRecheios();
    renderAba();

    await userEvent.click(await screen.findByRole("button", { name: "Novo recheio" }));
    const dialogo = await screen.findByRole("dialog");
    const ativo = within(dialogo).getByRole("switch", { name: "Ativo" });
    expect(ativo).toBeDisabled();
    expect(ativo).not.toBeChecked();
    expect(
      within(dialogo).getByText("Defina o preço em Preços e acréscimos para poder ativar."),
    ).toBeInTheDocument();

    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), "Doce de leite");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(chamadas.criados).toHaveLength(1));
    expect(chamadas.criados[0]).toEqual({
      filling: { name: "Doce de leite", description: "", active: false },
    });
  });

  it("libera o alternador para recheio com preço definido", async () => {
    logarComo(TODAS);
    apiDeRecheios();
    renderAba();

    await userEvent.click(await screen.findByRole("button", { name: "Ações do recheio Brigadeiro" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Editar" }));
    const dialogo = await screen.findByRole("dialog");

    const ativo = within(dialogo).getByRole("switch", { name: "Ativo" });
    expect(ativo).toBeEnabled();
    expect(ativo).toBeChecked();
  });

  it("mostra a situação do preço sem exibir o valor", async () => {
    logarComo(TODAS);
    apiDeRecheios();
    renderAba();

    // Colunas de menor prioridade também aparecem no resumo responsivo da linha.
    expect((await screen.findAllByText("Definido")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sem preço").length).toBeGreaterThan(0);
  });

  it("exclui depois da confirmação", async () => {
    logarComo(TODAS);
    const chamadas = apiDeRecheios();
    renderAba();

    await userEvent.click(await screen.findByRole("button", { name: "Ações do recheio Ninho" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Excluir" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Excluir" }),
    );

    await waitFor(() => expect(chamadas.excluidos).toEqual(["2"]));
  });

  it("esconde Novo recheio e as ações sem as permissões de escrita", async () => {
    logarComo(["fillings.index"]);
    apiDeRecheios();
    renderAba();

    expect(await screen.findByText("Brigadeiro")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Novo recheio" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ações do recheio/ })).not.toBeInTheDocument();
  });
});
