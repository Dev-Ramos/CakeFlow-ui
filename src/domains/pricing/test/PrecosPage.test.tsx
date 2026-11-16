import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { API, renderAuth } from "@/domains/auth/test/renderAuth";
import { paginar } from "@/domains/user-management/test/fixtures";
import { limparSessao, logarComo } from "@/domains/user-management/test/sessao";
import { server } from "@/test/server";
import { PrecosPage } from "../pages/PrecosPage";

const PERMISSOES = ["pricing.index", "pricing.update"];

const FORMAS = [
  {
    id: 1,
    name: "Redondo 20 cm",
    dimensions_label: "20 cm de diâmetro",
    active: true,
    price_cents: 4500,
    updated_by: { id: 1, name: "Maria Souza" },
    updated_at: "2026-11-16T10:30:00-03:00",
  },
  {
    id: 2,
    name: "Redondo 25 cm",
    dimensions_label: "25 cm de diâmetro",
    active: false,
    price_cents: null,
    updated_by: null,
    updated_at: null,
  },
];
const RECHEIOS = [
  { id: 4, name: "Ninho", active: false, extra_price_cents: null, updated_by: null, updated_at: null },
];

function apiDePrecos(opcoes: { falharForma?: number } = {}) {
  const chamadas: {
    formas: Array<[string, unknown]>;
    recheios: Array<[string, unknown]>;
    globais: unknown[];
  } = {
    formas: [],
    recheios: [],
    globais: [],
  };

  server.use(
    http.get(`${API}/pricing/pan_specs`, ({ request }) =>
      HttpResponse.json(paginar(FORMAS, new URL(request.url))),
    ),
    http.get(`${API}/pricing/fillings`, ({ request }) =>
      HttpResponse.json(paginar(RECHEIOS, new URL(request.url))),
    ),
    http.get(`${API}/pricing/settings`, () =>
      HttpResponse.json({ tier_complexity_cents: 3000, reinforcement_cents: null, delivery_fee_cents: 1500 }),
    ),
    http.put(`${API}/pricing/pan_specs/:id`, async ({ params, request }) => {
      if (Number(params.id) === opcoes.falharForma) {
        return HttpResponse.json({ code: "invalid", errors: ["Valor inválido"] }, { status: 422 });
      }
      chamadas.formas.push([String(params.id), await request.json()]);
      return HttpResponse.json({ id: Number(params.id) });
    }),
    http.put(`${API}/pricing/fillings/:id`, async ({ params, request }) => {
      chamadas.recheios.push([String(params.id), await request.json()]);
      return HttpResponse.json({ id: Number(params.id) });
    }),
    http.patch(`${API}/pricing/settings`, async ({ request }) => {
      chamadas.globais.push(await request.json());
      return HttpResponse.json({
        tier_complexity_cents: 3500,
        reinforcement_cents: null,
        delivery_fee_cents: 1500,
      });
    }),
    http.get(`${API}/pan_specs/options`, () => HttpResponse.json({ data: [] })),
    http.get(`${API}/fillings/options`, () => HttpResponse.json({ data: [] })),
  );
  return chamadas;
}

afterEach(limparSessao);

describe("PrecosPage", () => {
  it("mostra os valores atuais em reais, com 'Sem preço' onde falta", async () => {
    logarComo(PERMISSOES);
    apiDePrecos();
    renderAuth(<PrecosPage />);

    expect(await screen.findByLabelText("Valor da camada de forma Redondo 20 cm")).toHaveValue("45,00");
    expect(screen.getByLabelText("Valor da camada de forma Redondo 25 cm")).toHaveValue("");
    expect(screen.getByLabelText("Valor da camada de forma Redondo 25 cm")).toHaveAttribute(
      "placeholder",
      "Sem preço",
    );
    expect(await screen.findByLabelText(/^Taxa de entrega/)).toHaveValue("15,00");
    expect(screen.getByLabelText(/^Blindagem/)).toHaveValue("");
  });

  it("envia só as linhas alteradas, uma requisição por linha, e a PATCH dos valores globais", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDePrecos();
    renderAuth(<PrecosPage />);

    const salvar = await screen.findByRole("button", { name: "Salvar valores" });
    expect(salvar).toBeDisabled();

    const forma = await screen.findByLabelText("Valor da camada de forma Redondo 25 cm");
    await userEvent.type(forma, "60,5");
    await userEvent.type(await screen.findByLabelText("Acréscimo de recheio Ninho"), "0");
    const complexidade = await screen.findByLabelText(/^Complexidade/);
    await userEvent.clear(complexidade);
    await userEvent.type(complexidade, "35");
    await userEvent.click(salvar);

    await waitFor(() => expect(chamadas.globais).toHaveLength(1));
    expect(chamadas.formas).toEqual([["2", { price: { price_cents: 6050 } }]]);
    // Acréscimo 0 é válido: conta como "definido".
    expect(chamadas.recheios).toEqual([["4", { price: { extra_price_cents: 0 } }]]);
    expect(chamadas.globais[0]).toEqual({
      tier_complexity_cents: 3500,
      reinforcement_cents: null,
      delivery_fee_cents: 1500,
    });
  });

  it("mantém na tela a linha que falhou, com o erro, e salva as demais", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDePrecos({ falharForma: 2 });
    renderAuth(<PrecosPage />);

    await userEvent.type(await screen.findByLabelText("Valor da camada de forma Redondo 25 cm"), "10");
    await userEvent.type(await screen.findByLabelText("Acréscimo de recheio Ninho"), "5");
    await userEvent.click(screen.getByRole("button", { name: "Salvar valores" }));

    await waitFor(() => expect(chamadas.recheios).toHaveLength(1));
    expect(await screen.findByText(/Valor inválido/)).toBeInTheDocument();
    expect(screen.getByLabelText("Valor da camada de forma Redondo 25 cm")).toHaveValue("10");
    expect(chamadas.formas).toEqual([]);
  });

  it("recusa valor negativo ou texto sem chamar a API", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDePrecos();
    renderAuth(<PrecosPage />);

    await userEvent.type(await screen.findByLabelText("Valor da camada de forma Redondo 25 cm"), "abc");
    await userEvent.click(screen.getByRole("button", { name: "Salvar valores" }));

    expect(await screen.findByText("Informe um valor em reais (0 ou mais).")).toBeInTheDocument();
    expect(chamadas.formas).toEqual([]);
  });

  it("sem pricing.update os campos ficam somente leitura e não há botão de salvar", async () => {
    logarComo(["pricing.index"]);
    apiDePrecos();
    renderAuth(<PrecosPage />);

    expect(await screen.findByLabelText("Valor da camada de forma Redondo 20 cm")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Salvar valores" })).not.toBeInTheDocument();
  });
});
