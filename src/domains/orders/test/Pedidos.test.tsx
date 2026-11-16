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
import { PedidoDetalhePage } from "../pages/PedidoDetalhePage";
import { PedidosPage } from "../pages/PedidosPage";
import { SolicitacoesDeCancelamentoPage } from "../pages/SolicitacoesDeCancelamentoPage";
import { itemDaLista, pedido, solicitacao } from "./fixtures";

function renderRotas(rota: string) {
  return renderAuth(
    <ConfirmProvider>
      <Routes>
        <Route path="/pedidos" element={<PedidosPage />} />
        <Route path="/pedidos/:id" element={<PedidoDetalhePage />} />
        <Route
          path="/administracao/solicitacoes-de-cancelamento"
          element={<SolicitacoesDeCancelamentoPage />}
        />
      </Routes>
    </ConfirmProvider>,
    rota,
  );
}

afterEach(limparSessao);

describe("PedidosPage", () => {
  function apiDaLista(linhas = [itemDaLista]) {
    const consultas: URL[] = [];
    server.use(
      http.get(`${API}/orders`, ({ request }) => {
        const url = new URL(request.url);
        consultas.push(url);
        return HttpResponse.json(paginar(linhas, url));
      }),
    );
    return consultas;
  }

  it("lista os pedidos com telefone formatado, entrega, situação e total", async () => {
    logarComo(["orders.index", "orders.create", "orders.view_prices"]);
    apiDaLista([{ ...itemDaLista, late: true }]);
    renderRotas("/pedidos");

    expect(await screen.findByRole("link", { name: "PED-0012" })).toHaveAttribute("href", "/pedidos/12");
    expect(screen.getAllByText("Ana Souza").length).toBeGreaterThan(0);
    expect(screen.getAllByText("(11) 98888-1111").length).toBeGreaterThan(0);
    expect(screen.getAllByText("14/11/2026 09:00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Atrasado").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Confirmado").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/160,00/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Novo pedido/ })).toBeInTheDocument();
  });

  it("sem orders.view_prices não mostra a coluna de total; sem orders.create não há Novo pedido", async () => {
    logarComo(["orders.index"]);
    apiDaLista([{ ...itemDaLista, total_cents: undefined }]);
    renderRotas("/pedidos");

    expect(await screen.findByRole("link", { name: "PED-0012" })).toBeInTheDocument();
    expect(screen.queryByText("Total")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Novo pedido/ })).not.toBeInTheDocument();
  });

  it("envia os filtros ao servidor (busca, situação, tipo, atrasados) e volta à página 1", async () => {
    logarComo(["orders.index"]);
    const consultas = apiDaLista();
    renderRotas("/pedidos");
    await screen.findByRole("link", { name: "PED-0012" });

    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar" }), "ana");
    await userEvent.selectOptions(screen.getByLabelText("Situação"), "in_production");
    await userEvent.selectOptions(screen.getByLabelText("Tipo"), "pickup");
    await userEvent.click(screen.getByLabelText("Só atrasados"));

    await waitFor(() => {
      const url = consultas.at(-1)!;
      expect(url.searchParams.get("search")).toBe("ana");
      expect(url.searchParams.getAll("status")).toEqual(["in_production"]);
      expect(url.searchParams.get("fulfillment_type")).toBe("pickup");
      expect(url.searchParams.get("late")).toBe("true");
      expect(url.searchParams.get("page")).toBe("1");
    });
  });
});

describe("PedidoDetalhePage", () => {
  function apiDoPedido(sobrescrever: Partial<typeof pedido> = {}) {
    const chamadas: { cancelamentos: unknown[]; solicitacoes: unknown[] } = {
      cancelamentos: [],
      solicitacoes: [],
    };
    server.use(
      http.get(`${API}/orders/12`, () => HttpResponse.json({ ...pedido, ...sobrescrever })),
      http.get(`${API}/orders/12/events`, () =>
        HttpResponse.json({
          data: [
            {
              id: 1,
              kind: "created",
              user: { id: 3, name: "Renata Alves" },
              from_status: null,
              to_status: "booked",
              note: null,
              data: {},
              created_at: "2026-11-13T15:02:00-03:00",
            },
          ],
        }),
      ),
      http.post(`${API}/orders/12/cancel`, async ({ request }) => {
        chamadas.cancelamentos.push(await request.json());
        return HttpResponse.json(pedido);
      }),
      http.post(`${API}/orders/12/cancellation_requests`, async ({ request }) => {
        chamadas.solicitacoes.push(await request.json());
        return HttpResponse.json(solicitacao, { status: 201 });
      }),
    );
    return chamadas;
  }

  it("mostra cliente, endereço, bolo com andares, valores e linha do tempo", async () => {
    logarComo(["orders.read", "orders.update"]);
    apiDoPedido();
    renderRotas("/pedidos/12");

    expect(await screen.findByRole("heading", { name: "PED-0012" })).toBeInTheDocument();
    expect(screen.getByText("(11) 98888-1111")).toBeInTheDocument();
    expect(screen.getByText("Rua das Flores, 120 · Apto 4")).toBeInTheDocument();
    expect(screen.getByText("Perto da padaria")).toBeInTheDocument();
    expect(screen.getByText(/1\. Bolo Frozen do Pedro/)).toBeInTheDocument();
    expect(
      screen.getByText(/Andar 1: Redondo 20 cm \(20 cm de diâmetro\) com Pão de ló, 2 camadas/),
    ).toBeInTheDocument();
    expect(screen.getByText("Recheios: Ninho com morango")).toBeInTheDocument();
    expect(await screen.findByText(/Pedido criado — Confirmado/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Editar" })).toHaveAttribute("href", "/pedidos/12/editar");
    // Valores só aparecem com os dados de preço (que a API só manda com orders.view_prices).
    expect(screen.getByText("Valores")).toBeInTheDocument();
  });

  it("esconde os valores quando a API não os manda (sem orders.view_prices)", async () => {
    logarComo(["orders.read"]);
    apiDoPedido({
      pricing: undefined,
      subtotal_cents: undefined,
      delivery_fee_cents: undefined,
      total_cents: undefined,
    });
    renderRotas("/pedidos/12");

    expect(await screen.findByRole("heading", { name: "PED-0012" })).toBeInTheDocument();
    expect(screen.queryByText("Valores")).not.toBeInTheDocument();
  });

  it("atendente solicita o cancelamento com o motivo", async () => {
    logarComo(["orders.read", "orders.request_cancel"]);
    const chamadas = apiDoPedido();
    renderRotas("/pedidos/12");

    await userEvent.click(await screen.findByRole("button", { name: "Solicitar cancelamento" }));
    const dialogo = await screen.findByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Enviar solicitação" }));
    expect(await within(dialogo).findByText("Descreva o motivo do cancelamento.")).toBeInTheDocument();

    await userEvent.type(within(dialogo).getByLabelText(/^Motivo/), "A cliente desistiu");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Enviar solicitação" }));

    await waitFor(() =>
      expect(chamadas.solicitacoes).toEqual([
        { cancellation_request: { description: "A cliente desistiu" } },
      ]),
    );
  });

  it("admin cancela direto, com motivo obrigatório", async () => {
    logarComo(["orders.read", "orders.cancel"]);
    const chamadas = apiDoPedido();
    renderRotas("/pedidos/12");

    await userEvent.click(await screen.findByRole("button", { name: "Cancelar pedido" }));
    const dialogo = await screen.findByRole("dialog");
    await userEvent.type(within(dialogo).getByLabelText(/^Motivo/), "Erro de cadastro");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Cancelar pedido" }));

    await waitFor(() =>
      expect(chamadas.cancelamentos).toEqual([{ cancellation_request: { description: "Erro de cadastro" } }]),
    );
  });

  it("pedido cancelado não oferece editar nem cancelar", async () => {
    logarComo(["orders.read", "orders.update", "orders.cancel", "orders.request_cancel"]);
    apiDoPedido({ status: "canceled" });
    renderRotas("/pedidos/12");

    expect(await screen.findByRole("heading", { name: "PED-0012" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Editar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancelar pedido" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Solicitar cancelamento" })).not.toBeInTheDocument();
  });
});

describe("SolicitacoesDeCancelamentoPage", () => {
  it("lista as pendentes e aprova depois da confirmação", async () => {
    logarComo(["orders.approve_cancel"]);
    const consultas: URL[] = [];
    const aprovadas: string[] = [];
    server.use(
      http.get(`${API}/cancellation_requests`, ({ request }) => {
        const url = new URL(request.url);
        consultas.push(url);
        return HttpResponse.json(paginar([solicitacao], url));
      }),
      http.post(`${API}/cancellation_requests/:id/approve`, ({ params }) => {
        aprovadas.push(String(params.id));
        return HttpResponse.json({ ...solicitacao, status: "approved" });
      }),
    );
    renderRotas("/administracao/solicitacoes-de-cancelamento");

    expect(await screen.findByText("A cliente desistiu da festa")).toBeInTheDocument();
    expect(screen.getByText(/Será descartado/)).toBeInTheDocument();
    expect(consultas[0].searchParams.get("status")).toBe("pending");

    await userEvent.click(screen.getByRole("button", { name: "Aprovar cancelamento" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Aprovar" }),
    );

    await waitFor(() => expect(aprovadas).toEqual(["7"]));
  });

  it("nega sem cancelar e troca o filtro de situação", async () => {
    logarComo(["orders.approve_cancel"]);
    const consultas: URL[] = [];
    const negadas: string[] = [];
    server.use(
      http.get(`${API}/cancellation_requests`, ({ request }) => {
        const url = new URL(request.url);
        consultas.push(url);
        return HttpResponse.json(paginar([solicitacao], url));
      }),
      http.post(`${API}/cancellation_requests/:id/deny`, ({ params }) => {
        negadas.push(String(params.id));
        return HttpResponse.json({ ...solicitacao, status: "denied" });
      }),
    );
    renderRotas("/administracao/solicitacoes-de-cancelamento");

    await userEvent.click(await screen.findByRole("button", { name: "Negar" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Negar" }),
    );
    await waitFor(() => expect(negadas).toEqual(["7"]));

    await userEvent.selectOptions(screen.getByLabelText("Situação"), "approved");
    await waitFor(() => expect(consultas.at(-1)?.searchParams.get("status")).toBe("approved"));
  });
});
