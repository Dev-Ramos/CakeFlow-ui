import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { API, renderAuth } from "@/domains/auth/test/renderAuth";
import { paginar } from "@/domains/user-management/test/fixtures";
import { limparSessao, logarComo } from "@/domains/user-management/test/sessao";
import { server } from "@/test/server";
import { ConfirmProvider } from "@/ui/confirm/ConfirmProvider";
import { FormasTab } from "../components/FormasTab";
import type { PanSpecPayload } from "../types/panSpec";

const TODAS = ["pan_specs.index", "pan_specs.create", "pan_specs.update", "pan_specs.delete"];

const REDONDA: PanSpecPayload = {
  id: 1,
  name: "Redondo 20 cm",
  shape: "round",
  diameter_cm: 20,
  length_cm: null,
  width_cm: null,
  side_cm: null,
  height_cm: 7,
  servings: 12,
  active: true,
  priced: true,
  dimensions_label: "20 cm de diâmetro",
};

/** API de formas em memória, paginada como a real. */
function apiDeFormas(formas: PanSpecPayload[] = [REDONDA]) {
  const chamadas: { criados: unknown[] } = { criados: [] };

  server.use(
    http.get(`${API}/pan_specs`, ({ request }) => HttpResponse.json(paginar(formas, new URL(request.url)))),
    http.post(`${API}/pan_specs`, async ({ request }) => {
      chamadas.criados.push(await request.json());
      return HttpResponse.json({ id: 99 }, { status: 201 });
    }),
  );
  return chamadas;
}

function renderAba() {
  return renderAuth(
    <ConfirmProvider>
      <FormasTab />
    </ConfirmProvider>,
  );
}

afterEach(limparSessao);

describe("FormasTab", () => {
  it("cadastra forma redonda enviando só o diâmetro (números, demais medidas nulas)", async () => {
    logarComo(TODAS);
    const chamadas = apiDeFormas();
    renderAba();

    await userEvent.click(await screen.findByRole("button", { name: "Nova forma" }));
    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByRole("switch", { name: "Ativa" })).toBeDisabled();

    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), "Redondo 25 cm");
    await userEvent.type(within(dialogo).getByLabelText(/^Diâmetro/), "25");
    await userEvent.type(within(dialogo).getByLabelText(/^Altura/), "7.5");
    await userEvent.type(within(dialogo).getByLabelText("Porções estimadas"), "20");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(chamadas.criados).toHaveLength(1));
    expect(chamadas.criados[0]).toEqual({
      pan_spec: {
        name: "Redondo 25 cm",
        shape: "round",
        diameter_cm: 25,
        length_cm: null,
        width_cm: null,
        side_cm: null,
        height_cm: 7.5,
        servings: 20,
        active: false,
      },
    });
  });

  it("troca os campos de medida conforme o formato e envia comprimento e largura", async () => {
    logarComo(TODAS);
    const chamadas = apiDeFormas();
    renderAba();

    await userEvent.click(await screen.findByRole("button", { name: "Nova forma" }));
    const dialogo = await screen.findByRole("dialog");

    await userEvent.selectOptions(within(dialogo).getByLabelText("Formato"), "rectangular");
    expect(within(dialogo).queryByLabelText(/^Diâmetro/)).not.toBeInTheDocument();
    expect(within(dialogo).getByLabelText(/^Comprimento/)).toBeInTheDocument();

    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), "Retangular 30x20");
    await userEvent.type(within(dialogo).getByLabelText(/^Comprimento/), "30");
    await userEvent.type(within(dialogo).getByLabelText(/^Largura/), "20");
    await userEvent.type(within(dialogo).getByLabelText(/^Altura/), "6");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(chamadas.criados).toHaveLength(1));
    expect(chamadas.criados[0]).toMatchObject({
      pan_spec: {
        shape: "rectangular",
        diameter_cm: null,
        length_cm: 30,
        width_cm: 20,
        side_cm: null,
        height_cm: 6,
        servings: null,
      },
    });
  });

  it("exige as medidas do formato escolhido e a altura", async () => {
    logarComo(TODAS);
    const chamadas = apiDeFormas();
    renderAba();

    await userEvent.click(await screen.findByRole("button", { name: "Nova forma" }));
    const dialogo = await screen.findByRole("dialog");
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), "Sem medidas");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(await within(dialogo).findByText("Informe o diâmetro.")).toBeInTheDocument();
    expect(within(dialogo).getByText("Informe a altura (maior que zero).")).toBeInTheDocument();
    expect(chamadas.criados).toEqual([]);
  });

  it("mostra medidas, altura e situação do preço na lista", async () => {
    logarComo(TODAS);
    apiDeFormas([
      {
        ...REDONDA,
        id: 2,
        name: "Quadrada 20",
        shape: "square",
        diameter_cm: null,
        side_cm: 20,
        dimensions_label: "20 x 20 cm",
        priced: false,
        active: false,
      },
    ]);
    renderAba();

    expect(await screen.findByText("Quadrada 20")).toBeInTheDocument();
    // Colunas de menor prioridade também aparecem no resumo responsivo da linha.
    expect(screen.getAllByText("20 x 20 cm").length).toBeGreaterThan(0);
    expect(screen.getAllByText("7 cm").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sem preço").length).toBeGreaterThan(0);
  });

  it("esconde Nova forma e as ações sem as permissões de escrita", async () => {
    logarComo(["pan_specs.index"]);
    apiDeFormas();
    renderAba();

    expect(await screen.findByText("Redondo 20 cm")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nova forma" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ações da forma/ })).not.toBeInTheDocument();
  });
});
