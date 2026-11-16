import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { API, renderAuth } from "@/domains/auth/test/renderAuth";
import { server } from "@/test/server";
import { ConfirmProvider } from "@/ui/confirm/ConfirmProvider";
import { cargoAdmin, cargoBoleiro, catalogoDePermissoes, paginar, TODAS } from "../test/fixtures";
import { limparSessao, logarComo } from "../test/sessao";
import { RoleFormPage } from "./RoleFormPage";
import { RolesPage } from "./RolesPage";

function renderRotas(rota: string) {
  return renderAuth(
    <ConfirmProvider>
      <Routes>
        <Route path="/administracao/cargos" element={<><RolesPage /><p>fim da lista</p></>} />
        <Route path="/administracao/cargos/novo" element={<RoleFormPage />} />
        <Route path="/administracao/cargos/:id" element={<RoleFormPage />} />
      </Routes>
    </ConfirmProvider>,
    rota,
  );
}

function apiDeCargos() {
  const chamadas: {
    consultas: URL[];
    criar?: unknown;
    editar?: unknown;
    editadoId?: string;
    excluidos: string[];
  } = { consultas: [], excluidos: [] };

  server.use(
    http.get(`${API}/roles`, ({ request }) => {
      const url = new URL(request.url);
      chamadas.consultas.push(url);
      return HttpResponse.json(paginar([cargoAdmin, cargoBoleiro], url));
    }),
    http.get(`${API}/permissions`, () => HttpResponse.json(catalogoDePermissoes)),
    http.get(`${API}/roles/:id`, ({ params }) =>
      HttpResponse.json([cargoAdmin, cargoBoleiro].find((r) => String(r.id) === params.id)),
    ),
    http.post(`${API}/roles`, async ({ request }) => {
      chamadas.criar = await request.json();
      return HttpResponse.json({ ...cargoBoleiro, id: 7 }, { status: 201 });
    }),
    http.patch(`${API}/roles/:id`, async ({ request, params }) => {
      chamadas.editar = await request.json();
      chamadas.editadoId = String(params.id);
      return HttpResponse.json(cargoBoleiro);
    }),
    http.delete(`${API}/roles/:id`, ({ params }) => {
      chamadas.excluidos.push(String(params.id));
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return chamadas;
}

/** Expande o dropdown de permissões de um recurso. */
async function abrirGrupo(recurso: string) {
  await userEvent.click(await screen.findByRole("button", { name: new RegExp(recurso) }));
}

afterEach(limparSessao);

describe("RolesPage", () => {
  it("lista os cargos com a quantidade de permissões", async () => {
    logarComo(TODAS);
    apiDeCargos();
    renderRotas("/administracao/cargos");

    expect(await screen.findByText("superadmin")).toBeInTheDocument();
    expect(screen.getByText("Acesso total")).toBeInTheDocument();
    expect(screen.getByText("6 permissões")).toBeInTheDocument();
    expect(screen.getByText("1 permissão")).toBeInTheDocument();
  });

  it("consulta a API com page e limit e mostra a paginação", async () => {
    logarComo(TODAS);
    const chamadas = apiDeCargos();
    renderRotas("/administracao/cargos");

    expect(await screen.findByRole("navigation", { name: "Paginação" })).toHaveTextContent(
      "Mostrando 1 a 2 de 2 cargos",
    );
    expect(chamadas.consultas[0].searchParams.get("page")).toBe("1");
    expect(chamadas.consultas[0].searchParams.get("limit")).toBe("10");
  });

  it("exclui um cargo depois da confirmação", async () => {
    logarComo(TODAS);
    const chamadas = apiDeCargos();
    renderRotas("/administracao/cargos");

    await userEvent.click(await screen.findByRole("button", { name: "Ações do cargo boleiro" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Excluir" }));
    const confirmacao = await screen.findByRole("alertdialog");
    await userEvent.click(within(confirmacao).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(chamadas.excluidos).toEqual(["2"]));
  });

  it("esconde o botão de novo cargo e as ações sem permissão", async () => {
    logarComo(["roles.index"]);
    apiDeCargos();
    renderRotas("/administracao/cargos");

    expect(await screen.findByText("superadmin")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Novo cargo/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ações do cargo/ })).not.toBeInTheDocument();
  });
});

describe("RoleFormPage", () => {
  it("cria um cargo enviando role e permission_ids", async () => {
    logarComo(TODAS);
    const chamadas = apiDeCargos();
    renderRotas("/administracao/cargos/novo");

    await userEvent.type(await screen.findByLabelText(/Nome do cargo/), "confeiteiro");
    await userEvent.type(screen.getByLabelText("Descrição"), "Monta e decora");
    await abrirGrupo("Usuários");
    await userEvent.click(await screen.findByLabelText("Usuários: Listar"));
    await userEvent.click(screen.getByLabelText("Cargos: todos"));
    await userEvent.click(screen.getByRole("button", { name: "Criar cargo" }));

    expect(await screen.findByText("fim da lista")).toBeInTheDocument();
    expect(chamadas.criar).toEqual({
      role: { name: "confeiteiro", description: "Monta e decora", permission_ids: [1, 5, 6] },
    });
  });

  it("exige o nome do cargo", async () => {
    logarComo(TODAS);
    const chamadas = apiDeCargos();
    renderRotas("/administracao/cargos/novo");

    await userEvent.click(await screen.findByRole("button", { name: "Criar cargo" }));

    expect(await screen.findByText("Informe o nome do cargo.")).toBeInTheDocument();
    expect(chamadas.criar).toBeUndefined();
  });

  it("carrega um cargo, mostra as permissões marcadas e envia PATCH", async () => {
    logarComo(TODAS);
    const chamadas = apiDeCargos();
    renderRotas("/administracao/cargos/2");

    expect(await screen.findByRole("heading", { name: "Editar cargo: boleiro" })).toBeInTheDocument();
    // Os grupos começam recolhidos; o contador mostra o que o cargo aberto já tem.
    const grupoUsuarios = await screen.findByRole("button", { name: /Usuários/ });
    expect(grupoUsuarios).toHaveAttribute("aria-expanded", "false");
    expect(grupoUsuarios).toHaveTextContent("1/4");
    expect(screen.getByRole("button", { name: /Cargos/ })).toHaveTextContent("0/2");
    expect(screen.queryByLabelText("Usuários: Listar")).not.toBeInTheDocument();

    // Só as permissões do cargo aberto vêm marcadas; o catálogo vem de GET /permissions.
    await abrirGrupo("Usuários");
    expect(grupoUsuarios).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByLabelText("Usuários: Listar")).toBeChecked();
    expect(screen.getByLabelText("Usuários: Criar")).not.toBeChecked();
    expect(screen.getByLabelText("Usuários: todos")).not.toBeChecked();
    await abrirGrupo("Cargos");
    expect(screen.getByLabelText("Cargos: Listar")).not.toBeChecked();

    await userEvent.click(screen.getByLabelText("Usuários: Criar"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("fim da lista")).toBeInTheDocument();
    expect(chamadas.editadoId).toBe("2");
    expect(chamadas.editar).toEqual({
      role: { name: "boleiro", description: "", permission_ids: [1, 2] },
    });
  });

  it("pede confirmação para descartar alterações ao cancelar", async () => {
    logarComo(TODAS);
    apiDeCargos();
    renderRotas("/administracao/cargos/novo");

    await userEvent.type(await screen.findByLabelText(/Nome do cargo/), "rascunho");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    const confirmacao = await screen.findByRole("alertdialog");
    expect(confirmacao).toHaveTextContent("Descartar as alterações?");
    await userEvent.click(within(confirmacao).getByRole("button", { name: "Descartar" }));

    expect(await screen.findByText("fim da lista")).toBeInTheDocument();
  });

  it("mostra erro quando o cargo não é encontrado", async () => {
    logarComo(TODAS);
    server.use(
      http.get(`${API}/roles`, ({ request }) =>
        HttpResponse.json(paginar([cargoAdmin], new URL(request.url))),
      ),
      http.get(`${API}/roles/:id`, () => HttpResponse.json({ error: "Not found" }, { status: 404 })),
    );
    renderRotas("/administracao/cargos/99");

    expect(await screen.findByText("Não foi possível carregar o cargo.")).toBeInTheDocument();
  });
});
