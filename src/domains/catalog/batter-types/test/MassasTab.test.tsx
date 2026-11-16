import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { API, renderAuth } from "@/domains/auth/test/renderAuth";
import { paginar } from "@/domains/user-management/test/fixtures";
import { limparSessao, logarComo } from "@/domains/user-management/test/sessao";
import { server } from "@/test/server";
import { ConfirmProvider } from "@/ui/confirm/ConfirmProvider";
import { MassasTab } from "../components/MassasTab";
import type { BatterTypePayload } from "../types/batterType";

const TODAS = [
  "batter_types.index",
  "batter_types.create",
  "batter_types.update",
  "batter_types.delete",
];

const MASSAS: BatterTypePayload[] = [
  { id: 1, name: "Pão de ló", description: null, active: true },
  { id: 2, name: "Chocolate", description: null, active: false },
];

/** API de massas em memória, paginada como a real. `bloquear` simula o 409 `in_use`. */
function apiDeMassas({ bloquear = false } = {}) {
  const chamadas: { consultas: URL[]; criados: unknown[]; editados: Array<{ id: string; corpo: unknown }>; excluidos: string[] } =
    { consultas: [], criados: [], editados: [], excluidos: [] };

  server.use(
    http.get(`${API}/batter_types`, ({ request }) => {
      const url = new URL(request.url);
      chamadas.consultas.push(url);
      const busca = (url.searchParams.get("search") ?? "").toLowerCase();
      const ativo = url.searchParams.get("active");
      const filtradas = MASSAS.filter(
        (m) => m.name.toLowerCase().includes(busca) && (ativo === null || String(m.active) === ativo),
      );
      return HttpResponse.json(paginar(filtradas, url));
    }),
    http.post(`${API}/batter_types`, async ({ request }) => {
      chamadas.criados.push(await request.json());
      return HttpResponse.json({ id: 99 }, { status: 201 });
    }),
    http.patch(`${API}/batter_types/:id`, async ({ request, params }) => {
      chamadas.editados.push({ id: String(params.id), corpo: await request.json() });
      return HttpResponse.json({ id: Number(params.id) });
    }),
    http.delete(`${API}/batter_types/:id`, ({ params }) => {
      if (bloquear) {
        return HttpResponse.json(
          { code: "in_use", errors: ["Este item está em uso. Inative em vez de remover."] },
          { status: 409 },
        );
      }
      chamadas.excluidos.push(String(params.id));
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return chamadas;
}

function renderAba() {
  return renderAuth(
    <ConfirmProvider>
      <MassasTab />
    </ConfirmProvider>,
  );
}

afterEach(limparSessao);

describe("MassasTab", () => {
  it("consulta com page e limit, busca no servidor (search) e filtra a situação (active)", async () => {
    logarComo(TODAS);
    const chamadas = apiDeMassas();
    renderAba();

    expect(await screen.findByText("Pão de ló")).toBeInTheDocument();
    const primeira = chamadas.consultas[0];
    expect(primeira.searchParams.get("page")).toBe("1");
    expect(primeira.searchParams.get("limit")).toBe("10");
    expect(primeira.searchParams.has("search")).toBe(false);
    expect(primeira.searchParams.has("active")).toBe(false);

    await userEvent.type(screen.getByLabelText("Buscar"), "choc");
    await waitFor(() => expect(chamadas.consultas.at(-1)?.searchParams.get("search")).toBe("choc"));
    // O debounce evita uma consulta por tecla: foi só uma com o termo final.
    expect(chamadas.consultas.filter((url) => url.searchParams.has("search"))).toHaveLength(1);
    expect(await screen.findByText("Chocolate")).toBeInTheDocument();
    expect(screen.queryByText("Pão de ló")).not.toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText("Buscar"));
    await userEvent.selectOptions(screen.getByLabelText("Situação"), "inativos");
    await waitFor(() => expect(chamadas.consultas.at(-1)?.searchParams.get("active")).toBe("false"));
  });

  it("cadastra uma massa pelo modal (nasce ativa)", async () => {
    logarComo(TODAS);
    const chamadas = apiDeMassas();
    renderAba();

    await userEvent.click(await screen.findByRole("button", { name: "Nova massa" }));
    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByRole("switch", { name: "Ativo" })).toBeChecked();

    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), "Massa de cenoura");
    await userEvent.type(within(dialogo).getByLabelText("Descrição"), "Com cobertura");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(chamadas.criados).toEqual([
      { batter_type: { name: "Massa de cenoura", description: "Com cobertura", active: true } },
    ]);
  });

  it("exige o nome", async () => {
    logarComo(TODAS);
    const chamadas = apiDeMassas();
    renderAba();

    await userEvent.click(await screen.findByRole("button", { name: "Nova massa" }));
    const dialogo = await screen.findByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    expect(await within(dialogo).findByText("Informe o nome.")).toBeInTheDocument();
    expect(chamadas.criados).toEqual([]);
  });

  it("edita uma massa com PATCH", async () => {
    logarComo(TODAS);
    const chamadas = apiDeMassas();
    renderAba();

    await userEvent.click(await screen.findByRole("button", { name: "Ações da massa Pão de ló" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Editar" }));
    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByLabelText(/^Nome/)).toHaveValue("Pão de ló");

    await userEvent.clear(within(dialogo).getByLabelText(/^Nome/));
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), "Pão de ló especial");
    await userEvent.click(within(dialogo).getByRole("switch", { name: "Ativo" }));
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(chamadas.editados).toHaveLength(1));
    expect(chamadas.editados[0]).toEqual({
      id: "1",
      corpo: { batter_type: { name: "Pão de ló especial", description: "", active: false } },
    });
  });

  it("exclui depois da confirmação", async () => {
    logarComo(TODAS);
    const chamadas = apiDeMassas();
    renderAba();

    await userEvent.click(await screen.findByRole("button", { name: "Ações da massa Chocolate" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Excluir" }));
    const confirmacao = await screen.findByRole("alertdialog");
    expect(confirmacao).toHaveTextContent('Excluir a massa "Chocolate"?');
    await userEvent.click(within(confirmacao).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(chamadas.excluidos).toEqual(["2"]));
  });

  it("não exclui quando a massa está em uso (409) e a lista continua igual", async () => {
    logarComo(TODAS);
    const chamadas = apiDeMassas({ bloquear: true });
    renderAba();

    await userEvent.click(await screen.findByRole("button", { name: "Ações da massa Chocolate" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Excluir" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Excluir" }),
    );

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(chamadas.excluidos).toEqual([]);
    expect(screen.getByText("Chocolate")).toBeInTheDocument();
  });

  it("esconde Nova massa e as ações sem as permissões de escrita", async () => {
    logarComo(["batter_types.index"]);
    apiDeMassas();
    renderAba();

    expect(await screen.findByText("Pão de ló")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nova massa" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ações da massa/ })).not.toBeInTheDocument();
  });
});
