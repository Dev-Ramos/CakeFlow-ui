import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { API, renderAuth } from "@/domains/auth/test/renderAuth";
import { paginar } from "@/domains/user-management/test/fixtures";
import { limparSessao, logarComo } from "@/domains/user-management/test/sessao";
import { server } from "@/test/server";
import { ConfirmProvider } from "@/ui/confirm/ConfirmProvider";
import { ComponentesPage } from "./ComponentesPage";

const TODAS = ["pan_specs.index", "batter_types.index", "fillings.index"];

/** Cada aba lista o seu recurso; aqui basta uma linha por recurso para ver qual aba abriu. */
function apiDasAbas() {
  server.use(
    http.get(`${API}/pan_specs`, ({ request }) =>
      HttpResponse.json(
        paginar(
          [
            {
              id: 1,
              name: "Redondo 20 cm",
              shape: "round",
              diameter_cm: 20,
              length_cm: null,
              width_cm: null,
              side_cm: null,
              height_cm: 7,
              servings: null,
              active: true,
              priced: true,
              dimensions_label: "20 cm de diâmetro",
            },
          ],
          new URL(request.url),
        ),
      ),
    ),
    http.get(`${API}/batter_types`, ({ request }) =>
      HttpResponse.json(
        paginar([{ id: 1, name: "Pão de ló", description: null, active: true }], new URL(request.url)),
      ),
    ),
    http.get(`${API}/fillings`, ({ request }) =>
      HttpResponse.json(
        paginar(
          [{ id: 1, name: "Brigadeiro", description: null, active: true, priced: true }],
          new URL(request.url),
        ),
      ),
    ),
  );
}

function renderPagina(rota = "/catalogo/componentes") {
  return renderAuth(
    <ConfirmProvider>
      <Routes>
        <Route path="/catalogo/componentes" element={<ComponentesPage />} />
      </Routes>
    </ConfirmProvider>,
    rota,
  );
}

afterEach(limparSessao);

describe("ComponentesPage", () => {
  it("mostra só as abas de que o usuário tem o index, começando pela primeira", async () => {
    logarComo(["batter_types.index", "fillings.index"]);
    apiDasAbas();
    renderPagina();

    expect(await screen.findByRole("tab", { name: "Massas" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Recheios" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Formas" })).not.toBeInTheDocument();
    expect(await screen.findByText("Pão de ló")).toBeInTheDocument();
  });

  it("troca de aba e mostra a lista de cada recurso", async () => {
    logarComo(TODAS);
    apiDasAbas();
    renderPagina();

    expect(await screen.findByRole("tab", { name: "Formas" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByText("Redondo 20 cm")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Recheios" }));
    expect(await screen.findByText("Brigadeiro")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Recheios" })).toHaveAttribute("aria-selected", "true");

    await userEvent.click(screen.getByRole("tab", { name: "Massas" }));
    expect(await screen.findByText("Pão de ló")).toBeInTheDocument();
  });

  it("abre direto na aba pedida na URL (?aba=)", async () => {
    logarComo(TODAS);
    apiDasAbas();
    renderPagina("/catalogo/componentes?aba=recheios");

    expect(await screen.findByRole("tab", { name: "Recheios" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByText("Brigadeiro")).toBeInTheDocument();
  });

  it("ignora uma aba pedida que o usuário não pode ver", async () => {
    logarComo(["batter_types.index"]);
    apiDasAbas();
    renderPagina("/catalogo/componentes?aba=formas");

    expect(await screen.findByRole("tab", { name: "Massas" })).toHaveAttribute("aria-selected", "true");
  });
});
