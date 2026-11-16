import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { API, renderAuth } from "@/domains/auth/test/renderAuth";
import { server } from "@/test/server";
import { ConfirmProvider } from "@/ui/confirm/ConfirmProvider";
import { cargoAdmin, cargoBoleiro, paginar, TODAS, usuariosPayload } from "../test/fixtures";
import { limparSessao, logarComo } from "../test/sessao";
import type { UserPayload } from "../types/user";
import { UsersPage } from "./UsersPage";

const ROTA = "/administracao/usuarios";

function renderPagina() {
  return renderAuth(
    <ConfirmProvider>
      <Routes>
        <Route path={ROTA} element={<UsersPage />} />
      </Routes>
    </ConfirmProvider>,
    ROTA,
  );
}

/**
 * API de usuários em memória, paginada como a real. `extras` acrescenta
 * usuários ("Pessoa 1 Teste", ...) além dos 3 de `usuariosPayload`.
 */
function apiDeUsuarios(extras = 0) {
  let lista: UserPayload[] = [
    ...usuariosPayload,
    ...Array.from({ length: extras }, (_, i) => ({
      id: 100 + i,
      name: `Pessoa ${i + 1}`,
      last_name: "Teste",
      email: `pessoa${i + 1}@cakeflow.com.br`,
      roles: [],
      created_at: "2026-05-01T12:00:00.000Z",
    })),
  ];
  const chamadas: {
    consultas: URL[];
    criar?: unknown;
    editar?: unknown;
    editadoId?: string;
    excluidos: string[];
    /** Termo `search` de cada chamada a `/roles/options` (`null` = sem busca). */
    buscasDeCargo: Array<string | null>;
  } = { consultas: [], excluidos: [], buscasDeCargo: [] };

  server.use(
    http.get(`${API}/users`, ({ request }) => {
      const url = new URL(request.url);
      chamadas.consultas.push(url);
      return HttpResponse.json(paginar(lista, url));
    }),
    // Rota de options de cargo, com busca server-side (`search`).
    http.get(`${API}/roles/options`, ({ request }) => {
      const url = new URL(request.url);
      chamadas.buscasDeCargo.push(url.searchParams.get("search"));
      const q = (url.searchParams.get("search") ?? "").toLowerCase();
      const opcoes = [cargoAdmin, cargoBoleiro]
        .filter((cargo) => cargo.name.toLowerCase().includes(q))
        .map(({ id, name }) => ({ value: id, label: name, hint: null }));
      return HttpResponse.json({ data: opcoes });
    }),
    http.post(`${API}/users`, async ({ request }) => {
      const corpo = (await request.json()) as {
        user: { name: string; last_name: string; email: string };
      };
      chamadas.criar = corpo;
      const novo: UserPayload = {
        id: 9,
        name: corpo.user.name,
        last_name: corpo.user.last_name,
        email: corpo.user.email,
        roles: [{ id: 2, name: "boleiro" }],
        created_at: "2026-04-01T12:00:00.000Z",
      };
      lista = [...lista, novo];
      return HttpResponse.json(novo, { status: 201 });
    }),
    http.patch(`${API}/users/:id`, async ({ request, params }) => {
      const corpo = (await request.json()) as {
        user: { name: string; last_name: string; email: string };
      };
      chamadas.editar = corpo;
      chamadas.editadoId = String(params.id);
      lista = lista.map((u) =>
        String(u.id) === params.id
          ? { ...u, name: corpo.user.name, last_name: corpo.user.last_name }
          : u,
      );
      return HttpResponse.json(lista.find((u) => String(u.id) === params.id));
    }),
    http.delete(`${API}/users/:id`, ({ params }) => {
      chamadas.excluidos.push(String(params.id));
      lista = lista.filter((u) => String(u.id) !== params.id);
      return new HttpResponse(null, { status: 204 });
    }),
  );

  return chamadas;
}

async function abrirAcoes(nome: string) {
  await userEvent.click(await screen.findByRole("button", { name: `Ações de ${nome}` }));
}

afterEach(limparSessao);

describe("UsersPage", () => {
  it("lista os usuários consultando a API com page e limit", async () => {
    logarComo(TODAS);
    const chamadas = apiDeUsuarios();
    renderPagina();

    expect(await screen.findByText("Júlia Prado")).toBeInTheDocument();
    expect(screen.getByText("Marcos Lima")).toBeInTheDocument();
    // A data aparece na coluna e no resumo responsivo da linha.
    expect(screen.getAllByText("10/01/2026").length).toBeGreaterThan(0);

    expect(chamadas.consultas[0].searchParams.get("page")).toBe("1");
    expect(chamadas.consultas[0].searchParams.get("limit")).toBe("10");
    expect(screen.getByRole("navigation", { name: "Paginação" })).toHaveTextContent(
      "Mostrando 1 a 3 de 3 colaboradores",
    );
    // Seletor de limite oculto por enquanto.
    expect(screen.queryByRole("combobox", { name: "Itens por página" })).not.toBeInTheDocument();
  });

  it("avança de página buscando a próxima na API", async () => {
    logarComo(TODAS);
    const chamadas = apiDeUsuarios(9); // 12 no total: 10 na primeira página, 2 na segunda
    renderPagina();

    const paginacao = await screen.findByRole("navigation", { name: "Paginação" });
    expect(paginacao).toHaveTextContent("Mostrando 1 a 10 de 12 colaboradores");
    expect(screen.getByRole("button", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Página 2" })).toBeInTheDocument();
    expect(screen.queryByText("Pessoa 9 Teste")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Próxima" }));

    expect(await screen.findByText("Pessoa 9 Teste")).toBeInTheDocument();
    expect(paginacao).toHaveTextContent("Mostrando 11 a 12 de 12 colaboradores");
    expect(chamadas.consultas.at(-1)?.searchParams.get("page")).toBe("2");
    expect(screen.queryByText("Super Admin")).not.toBeInTheDocument();
  });

  it("volta uma página ao excluir o único item da última página", async () => {
    logarComo(TODAS);
    const chamadas = apiDeUsuarios(8); // 11 no total: a segunda página tem 1 item
    renderPagina();

    await userEvent.click(await screen.findByRole("button", { name: "Próxima" }));
    await abrirAcoes("Pessoa 8 Teste");
    await userEvent.click(await screen.findByRole("menuitem", { name: "Excluir" }));
    const confirmacao = await screen.findByRole("alertdialog");
    await userEvent.click(within(confirmacao).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(chamadas.excluidos).toEqual(["107"]));
    expect(await screen.findByText("Super Admin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("button", { name: "Página 2" })).not.toBeInTheDocument();
    expect(chamadas.consultas.at(-1)?.searchParams.get("page")).toBe("1");
  });

  it("valida o formulário de convite antes de enviar", async () => {
    logarComo(TODAS);
    apiDeUsuarios();
    renderPagina();

    await userEvent.click(await screen.findByRole("button", { name: "Convidar usuário" }));
    const dialogo = await screen.findByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Convidar" }));

    expect(await within(dialogo).findByText("Informe o nome.")).toBeInTheDocument();
    expect(within(dialogo).getByText("Informe o sobrenome.")).toBeInTheDocument();
    expect(within(dialogo).getByText("Informe o e-mail.")).toBeInTheDocument();
    expect(within(dialogo).getByText("Selecione ao menos um cargo.")).toBeInTheDocument();
  });

  it("convida um usuário enviando os campos em inglês e os role_ids", async () => {
    logarComo(TODAS);
    const chamadas = apiDeUsuarios();
    renderPagina();

    await userEvent.click(await screen.findByRole("button", { name: "Convidar usuário" }));
    const dialogo = await screen.findByRole("dialog");
    await userEvent.type(within(dialogo).getByLabelText(/^Nome/), "Ana");
    await userEvent.type(within(dialogo).getByLabelText(/^Sobrenome/), "Souza");
    await userEvent.type(within(dialogo).getByLabelText(/^E-mail/), "ana@cakeflow.com.br");
    await userEvent.click(within(dialogo).getByRole("combobox", { name: /Cargos/ }));
    await userEvent.click(within(dialogo).getByRole("option", { name: /boleiro/ }));
    await userEvent.click(within(dialogo).getByRole("button", { name: "Convidar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(chamadas.criar).toEqual({
      user: { name: "Ana", last_name: "Souza", email: "ana@cakeflow.com.br", role_ids: [2] },
    });
    // A lista é recarregada e mostra o novo usuário.
    expect(await screen.findByText("Ana Souza")).toBeInTheDocument();
  });

  it("busca os cargos no servidor com debounce ao digitar no combobox", async () => {
    logarComo(TODAS);
    const chamadas = apiDeUsuarios();
    renderPagina();

    await userEvent.click(await screen.findByRole("button", { name: "Convidar usuário" }));
    const dialogo = await screen.findByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("combobox", { name: /Cargos/ }));
    expect(await within(dialogo).findByRole("option", { name: /superadmin/ })).toBeInTheDocument();
    expect(chamadas.buscasDeCargo).toEqual([null]);

    await userEvent.type(within(dialogo).getByRole("textbox", { name: "Buscar…" }), "boleiro");

    // Só o termo final vai ao servidor (as teclas intermediárias são descartadas pelo debounce).
    await waitFor(() => expect(chamadas.buscasDeCargo).toEqual([null, "boleiro"]));
    expect(await within(dialogo).findByRole("option", { name: /boleiro/ })).toBeInTheDocument();
    expect(within(dialogo).queryByRole("option", { name: /superadmin/ })).not.toBeInTheDocument();

    // O cargo escolhido continua como chip depois de a busca o tirar da lista.
    await userEvent.click(within(dialogo).getByRole("option", { name: /boleiro/ }));
    expect(within(dialogo).getByRole("button", { name: "Remover boleiro" })).toBeInTheDocument();
  });

  it("edita um usuário já preenchido e envia PATCH", async () => {
    logarComo(TODAS);
    const chamadas = apiDeUsuarios();
    renderPagina();

    await abrirAcoes("Júlia Prado");
    await userEvent.click(await screen.findByRole("menuitem", { name: "Editar" }));

    const dialogo = await screen.findByRole("dialog");
    expect(within(dialogo).getByLabelText(/^Nome/)).toHaveValue("Júlia");
    expect(within(dialogo).getByLabelText(/^E-mail/)).toHaveValue("julia@cakeflow.com.br");

    await userEvent.clear(within(dialogo).getByLabelText(/^Sobrenome/));
    await userEvent.type(within(dialogo).getByLabelText(/^Sobrenome/), "Prado Lima");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(chamadas.editadoId).toBe("3");
    expect(chamadas.editar).toEqual({
      user: {
        name: "Júlia",
        last_name: "Prado Lima",
        email: "julia@cakeflow.com.br",
        role_ids: [2],
      },
    });
    expect(await screen.findByText("Júlia Prado Lima")).toBeInTheDocument();
  });

  it("exclui um usuário depois da confirmação", async () => {
    logarComo(TODAS);
    const chamadas = apiDeUsuarios();
    renderPagina();

    await abrirAcoes("Marcos Lima");
    await userEvent.click(await screen.findByRole("menuitem", { name: "Excluir" }));

    const confirmacao = await screen.findByRole("alertdialog");
    expect(confirmacao).toHaveTextContent("Excluir Marcos Lima?");
    await userEvent.click(within(confirmacao).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(chamadas.excluidos).toEqual(["4"]));
    await waitFor(() => expect(screen.queryByText("Marcos Lima")).not.toBeInTheDocument());
  });

  it("não exclui quando o usuário cancela a confirmação", async () => {
    logarComo(TODAS);
    const chamadas = apiDeUsuarios();
    renderPagina();

    await abrirAcoes("Marcos Lima");
    await userEvent.click(await screen.findByRole("menuitem", { name: "Excluir" }));
    const confirmacao = await screen.findByRole("alertdialog");
    await userEvent.click(within(confirmacao).getByRole("button", { name: "Cancelar" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(chamadas.excluidos).toEqual([]);
    expect(screen.getByText("Marcos Lima")).toBeInTheDocument();
  });

  it("não oferece excluir o próprio usuário", async () => {
    logarComo(TODAS);
    apiDeUsuarios();
    renderPagina();

    await abrirAcoes("Super Admin");
    expect(await screen.findByRole("menuitem", { name: "Editar" })).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Excluir" })).not.toBeInTheDocument();
  });

  it("esconde convidar e ações para quem só pode listar", async () => {
    logarComo(["users.index"]);
    apiDeUsuarios();
    renderPagina();

    expect(await screen.findByText("Júlia Prado")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Convidar usuário" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ações de/ })).not.toBeInTheDocument();
  });

  it("mostra erro quando a lista não carrega", async () => {
    logarComo(TODAS);
    server.use(
      http.get(`${API}/users`, () => HttpResponse.json({ error: "Falha geral" }, { status: 500 })),
    );
    renderPagina();

    expect(await screen.findByText("Não foi possível carregar os usuários.")).toBeInTheDocument();
  });
});
