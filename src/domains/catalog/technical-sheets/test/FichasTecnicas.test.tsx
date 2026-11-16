import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { API, renderAuth } from "@/domains/auth/test/renderAuth";
import { paginar } from "@/domains/user-management/test/fixtures";
import { limparSessao, logarComo } from "@/domains/user-management/test/sessao";
import { server } from "@/test/server";
import { ConfirmProvider } from "@/ui/confirm/ConfirmProvider";
import type { TechnicalSheetPayload } from "../types/technicalSheet";
import { FichaTecnicaFormPage } from "../pages/FichaTecnicaFormPage";
import { FichasTecnicasPage } from "../pages/FichasTecnicasPage";

const PERMISSOES = [
  "technical_sheets.index",
  "technical_sheets.create",
  "technical_sheets.update",
  "technical_sheets.delete",
  "technical_sheets.read",
];

const ficha: TechnicalSheetPayload = {
  id: 3,
  pan_spec: { id: 1, name: "Redondo 20 cm" },
  batter_type: { id: 2, name: "Pão de ló" },
  batter_quantity_g: 600,
  bake_temp_c: 180,
  bake_time_min: 35,
  notes: "Untar a forma",
  ingredients_count: 2,
  ingredients: [
    { id: 10, name: "Farinha de trigo", quantity: 250, unit: "g" },
    { id: 11, name: "Ovos", quantity: 4, unit: "un" },
  ],
};

const FORMAS = [
  { value: 1, label: "Redondo 20 cm", hint: null },
  { value: 4, label: "Quadrada 25 cm", hint: null },
];
const MASSAS = [
  { value: 2, label: "Pão de ló", hint: null },
  { value: 5, label: "Chocolate", hint: null },
];

function renderRotas(rota: string) {
  return renderAuth(
    <ConfirmProvider>
      <Routes>
        <Route path="/catalogo/fichas-tecnicas" element={<><FichasTecnicasPage /><p>fim da lista</p></>} />
        <Route path="/catalogo/fichas-tecnicas/nova" element={<FichaTecnicaFormPage />} />
        <Route path="/catalogo/fichas-tecnicas/:id" element={<FichaTecnicaFormPage />} />
      </Routes>
    </ConfirmProvider>,
    rota,
  );
}

function apiDeFichas() {
  const chamadas: {
    consultas: URL[];
    criado?: unknown;
    editado?: unknown;
    excluidos: string[];
    buscasDeForma: Array<string | null>;
  } = { consultas: [], excluidos: [], buscasDeForma: [] };

  const opcoes = (itens: typeof FORMAS) => ({ request }: { request: Request }) => {
    const q = (new URL(request.url).searchParams.get("search") ?? "").toLowerCase();
    return HttpResponse.json({ data: itens.filter((o) => o.label.toLowerCase().includes(q)) });
  };

  server.use(
    http.get(`${API}/technical_sheets`, ({ request }) => {
      const url = new URL(request.url);
      chamadas.consultas.push(url);
      return HttpResponse.json(paginar([ficha], url));
    }),
    http.get(`${API}/technical_sheets/:id`, () => HttpResponse.json(ficha)),
    http.post(`${API}/technical_sheets`, async ({ request }) => {
      chamadas.criado = await request.json();
      return HttpResponse.json({ ...ficha, id: 9 }, { status: 201 });
    }),
    http.patch(`${API}/technical_sheets/:id`, async ({ request }) => {
      chamadas.editado = await request.json();
      return HttpResponse.json(ficha);
    }),
    http.delete(`${API}/technical_sheets/:id`, ({ params }) => {
      chamadas.excluidos.push(String(params.id));
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(`${API}/pan_specs/options`, ({ request }) => {
      chamadas.buscasDeForma.push(new URL(request.url).searchParams.get("search"));
      return opcoes(FORMAS)({ request });
    }),
    http.get(`${API}/batter_types/options`, opcoes(MASSAS)),
  );
  return chamadas;
}

afterEach(limparSessao);

describe("FichasTecnicasPage", () => {
  it("lista as fichas com forma, massa, forno e ingredientes", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDeFichas();
    renderRotas("/catalogo/fichas-tecnicas");

    expect(await screen.findByText("Redondo 20 cm")).toBeInTheDocument();
    expect(screen.getAllByText("Pão de ló").length).toBeGreaterThan(0);
    expect(screen.getAllByText("180 °C · 35 min").length).toBeGreaterThan(0);
    expect(chamadas.consultas[0].searchParams.get("page")).toBe("1");
    expect(chamadas.consultas[0].searchParams.get("limit")).toBe("10");
  });

  it("filtra por forma enviando pan_spec_id (as opções vêm da busca no servidor)", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDeFichas();
    renderRotas("/catalogo/fichas-tecnicas");

    await userEvent.click(await screen.findByRole("combobox", { name: "Filtrar por forma" }));
    await userEvent.click(await screen.findByRole("option", { name: "Quadrada 25 cm" }));

    await waitFor(() =>
      expect(chamadas.consultas.at(-1)?.searchParams.get("pan_spec_id")).toBe("4"),
    );
    expect(chamadas.consultas.at(-1)?.searchParams.get("page")).toBe("1");
  });

  it("exclui a ficha depois da confirmação", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDeFichas();
    renderRotas("/catalogo/fichas-tecnicas");

    await userEvent.click(
      await screen.findByRole("button", { name: "Ações da ficha Redondo 20 cm com Pão de ló" }),
    );
    await userEvent.click(await screen.findByRole("menuitem", { name: "Excluir" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Excluir" }),
    );

    await waitFor(() => expect(chamadas.excluidos).toEqual(["3"]));
  });

  it("esconde Nova ficha e as ações sem as permissões", async () => {
    logarComo(["technical_sheets.index"]);
    apiDeFichas();
    renderRotas("/catalogo/fichas-tecnicas");

    expect(await screen.findByText("Redondo 20 cm")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Nova ficha/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ações da ficha/ })).not.toBeInTheDocument();
  });
});

describe("FichaTecnicaFormPage", () => {
  it("cria a ficha enviando ids, números e a lista de ingredientes", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDeFichas();
    renderRotas("/catalogo/fichas-tecnicas/nova");

    await userEvent.click(await screen.findByRole("combobox", { name: /Forma/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Redondo 20 cm" }));
    await userEvent.click(screen.getByRole("combobox", { name: /Massa/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Chocolate" }));

    await userEvent.type(screen.getByLabelText(/^Massa \(g\)/), "750");
    await userEvent.type(screen.getByLabelText(/^Temperatura/), "170");
    await userEvent.type(screen.getByLabelText(/^Tempo de forno/), "40");
    await userEvent.type(screen.getByLabelText("Observações"), "Forno pré-aquecido");

    await userEvent.click(screen.getByRole("button", { name: "Adicionar ingrediente" }));
    await userEvent.type(screen.getByLabelText("Ingrediente 1"), "Cacau");
    await userEvent.type(screen.getByLabelText("Quantidade 1"), "80");
    // A unidade começa em "g" (sugestão); o usuário pode trocar.
    expect(screen.getByLabelText("Unidade 1")).toHaveValue("g");

    await userEvent.click(screen.getByRole("button", { name: "Criar ficha" }));

    expect(await screen.findByText("fim da lista")).toBeInTheDocument();
    expect(chamadas.criado).toEqual({
      technical_sheet: {
        pan_spec_id: 1,
        batter_type_id: 5,
        batter_quantity_g: 750,
        bake_temp_c: 170,
        bake_time_min: 40,
        notes: "Forno pré-aquecido",
        ingredients: [{ name: "Cacau", quantity: 80, unit: "g" }],
      },
    });
  });

  it("exige forma, massa e quantidade, e valida os ingredientes", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDeFichas();
    renderRotas("/catalogo/fichas-tecnicas/nova");

    await userEvent.click(await screen.findByRole("button", { name: "Adicionar ingrediente" }));
    await userEvent.click(screen.getByRole("button", { name: "Criar ficha" }));

    expect(await screen.findByText("Selecione a forma.")).toBeInTheDocument();
    expect(screen.getByText("Selecione a massa.")).toBeInTheDocument();
    expect(screen.getByText("Informe a quantidade de massa (maior que zero).")).toBeInTheDocument();
    expect(screen.getByText("Informe o ingrediente.")).toBeInTheDocument();
    expect(screen.getByText("Quantidade maior que zero.")).toBeInTheDocument();
    expect(chamadas.criado).toBeUndefined();
  });

  it("carrega a ficha, trava forma e massa e envia a lista completa de ingredientes no PATCH", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDeFichas();
    renderRotas("/catalogo/fichas-tecnicas/3");

    expect(
      await screen.findByRole("heading", { name: "Editar ficha: Redondo 20 cm com Pão de ló" }),
    ).toBeInTheDocument();
    // A combinação não muda depois de criada.
    expect(screen.getByRole("combobox", { name: /Forma/ })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: /Massa/ })).toBeDisabled();
    expect(screen.getByLabelText("Ingrediente 1")).toHaveValue("Farinha de trigo");
    expect(screen.getByLabelText("Ingrediente 2")).toHaveValue("Ovos");

    // Remove o primeiro: o PATCH leva a lista inteira (agora só "Ovos").
    await userEvent.click(screen.getByRole("button", { name: "Remover ingrediente 1" }));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("fim da lista")).toBeInTheDocument();
    expect(chamadas.editado).toEqual({
      technical_sheet: {
        pan_spec_id: 1,
        batter_type_id: 2,
        batter_quantity_g: 600,
        bake_temp_c: 180,
        bake_time_min: 35,
        notes: "Untar a forma",
        ingredients: [{ name: "Ovos", quantity: 4, unit: "un" }],
      },
    });
  });

  it("pede confirmação para descartar alterações ao cancelar", async () => {
    logarComo(PERMISSOES);
    apiDeFichas();
    renderRotas("/catalogo/fichas-tecnicas/nova");

    await userEvent.type(await screen.findByLabelText("Observações"), "rascunho");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    const confirmacao = await screen.findByRole("alertdialog");
    await userEvent.click(within(confirmacao).getByRole("button", { name: "Descartar" }));
    expect(await screen.findByText("fim da lista")).toBeInTheDocument();
  });
});
