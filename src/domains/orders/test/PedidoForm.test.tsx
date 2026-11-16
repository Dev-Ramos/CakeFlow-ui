import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { API, renderAuth } from "@/domains/auth/test/renderAuth";
import { limparSessao, logarComo } from "@/domains/user-management/test/sessao";
import { server } from "@/test/server";
import { ConfirmProvider } from "@/ui/confirm/ConfirmProvider";
import { PedidoFormPage } from "../pages/PedidoFormPage";
import { OPCOES, pedido } from "./fixtures";

const PERMISSOES = ["orders.index", "orders.create", "orders.update", "orders.read"];

function renderRotas(rota: string) {
  return renderAuth(
    <ConfirmProvider>
      <Routes>
        <Route path="/pedidos" element={<p>lista de pedidos</p>} />
        <Route path="/pedidos/novo" element={<PedidoFormPage />} />
        <Route path="/pedidos/:id" element={<p>detalhe do pedido</p>} />
        <Route path="/pedidos/:id/editar" element={<PedidoFormPage />} />
      </Routes>
    </ConfirmProvider>,
    rota,
  );
}

type Corpo = { order: Record<string, unknown> & { items: Array<Record<string, unknown>> } };

function apiDePedidos(opcoes: { statusDoPedido?: string; falhaDeVersao?: boolean } = {}) {
  const chamadas: { criado?: Corpo; editado?: Corpo; previews: unknown[]; uploads: number } = {
    previews: [],
    uploads: 0,
  };
  const opcoesDe = (itens: Array<{ value: number; label: string; hint: null }>) => () =>
    HttpResponse.json({ data: itens });

  server.use(
    http.get(`${API}/cake_types/options`, opcoesDe(OPCOES.tipos)),
    http.get(`${API}/pan_specs/options`, opcoesDe(OPCOES.formas)),
    http.get(`${API}/batter_types/options`, opcoesDe(OPCOES.massas)),
    http.get(`${API}/fillings/options`, opcoesDe(OPCOES.recheios)),
    http.get(`${API}/orders/12`, () =>
      HttpResponse.json({ ...pedido, status: opcoes.statusDoPedido ?? "booked" }),
    ),
    http.post(`${API}/orders`, async ({ request }) => {
      chamadas.criado = (await request.json()) as Corpo;
      return HttpResponse.json(pedido, { status: 201 });
    }),
    http.patch(`${API}/orders/12`, async ({ request }) => {
      if (opcoes.falhaDeVersao) {
        return HttpResponse.json({ code: "stale_order", errors: ["Pedido desatualizado"] }, { status: 409 });
      }
      chamadas.editado = (await request.json()) as Corpo;
      return HttpResponse.json(pedido);
    }),
    http.post(`${API}/orders/price_preview`, async ({ request }) => {
      chamadas.previews.push(await request.json());
      return HttpResponse.json({
        base_cents: 9000,
        fillings_cents: 1500,
        complexity_cents: 0,
        reinforcement_cents: 0,
        delivery_cents: 1500,
        subtotal_cents: 10500,
        total_cents: 12000,
      });
    }),
  );
  return chamadas;
}

async function escolher(rotulo: RegExp, opcao: string) {
  await userEvent.click(screen.getByRole("combobox", { name: rotulo }));
  await userEvent.click(await screen.findByRole("option", { name: opcao }));
}

beforeAll(() => {
  // jsdom não implementa a URL de prévia dos arquivos.
  URL.createObjectURL = vi.fn(() => "blob:previa");
  URL.revokeObjectURL = vi.fn();
});
afterEach(limparSessao);

describe("PedidoFormPage — novo pedido", () => {
  it("cria o pedido com cliente, entrega e bolo, enviando telefone só com dígitos e o fuso do ateliê", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDePedidos();
    renderRotas("/pedidos/novo");

    await userEvent.type(await screen.findByLabelText(/^Nome/), "Ana Souza");
    await userEvent.type(screen.getByLabelText(/^Telefone/), "(11) 98888-1111");
    fireEvent.change(screen.getByLabelText(/^Data de produção/), { target: { value: "2099-11-14" } });
    fireEvent.change(screen.getByLabelText(/^Entrega/), { target: { value: "2099-11-14T09:00" } });
    await userEvent.type(screen.getByLabelText(/^Rua/), "Rua das Flores");
    await userEvent.type(screen.getByLabelText(/^Número/), "120");
    await userEvent.type(screen.getByLabelText(/^Bairro/), "Centro");
    await userEvent.type(screen.getByLabelText(/^Cidade/), "São Paulo");
    await userEvent.type(screen.getByLabelText(/^Ponto de referência/), "Perto da padaria");

    await userEvent.type(screen.getByLabelText(/^Título/), "Bolo do Pedro");
    await escolher(/^Forma do andar 1/, "Redondo 20 cm");
    await escolher(/^Massa do andar 1/, "Pão de ló");
    await userEvent.click(screen.getByRole("combobox", { name: /^Recheios do andar 1/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Ninho com morango" }));
    await userEvent.keyboard("{Escape}");

    await userEvent.click(screen.getByRole("button", { name: "Criar pedido" }));

    expect(await screen.findByText("detalhe do pedido")).toBeInTheDocument();
    const { order } = chamadas.criado!;
    expect(order).toMatchObject({
      customer_name: "Ana Souza",
      customer_phone: "11988881111",
      fulfillment_type: "delivery",
      production_date: "2099-11-14",
      delivery_at: "2099-11-14T09:00:00-03:00",
      address: {
        street: "Rua das Flores",
        number: "120",
        complement: "",
        neighborhood: "Centro",
        city: "São Paulo",
        reference: "Perto da padaria",
      },
    });
    expect(order.lock_version).toBeUndefined();
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({
      cake_type_id: null,
      title: "Bolo do Pedro",
      has_decoration: false,
      has_reinforcement: false,
      tiers: [{ pan_spec_id: 1, batter_type_id: 2, layers_count: 1, filling_ids: [4] }],
    });
    // Sem arquivo escolhido, nada passa por /uploads e nenhuma chave de imagem vai no corpo.
    expect(order.items[0]).not.toHaveProperty("reference_image_signed_id", expect.any(String));
  });

  it("exige cliente, telefone com DDD, entrega, endereço e um recheio por andar", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDePedidos();
    renderRotas("/pedidos/novo");

    await userEvent.type(await screen.findByLabelText(/^Telefone/), "123");
    await userEvent.click(screen.getByRole("button", { name: "Criar pedido" }));

    expect(await screen.findByText("Informe o nome do cliente.")).toBeInTheDocument();
    expect(screen.getByText("Informe o telefone com DDD (10 ou 11 dígitos).")).toBeInTheDocument();
    expect(screen.getByText("Informe a data e a hora da entrega.")).toBeInTheDocument();
    expect(screen.getByText("Informe a rua.")).toBeInTheDocument();
    expect(screen.getByText("Informe o ponto de referência.")).toBeInTheDocument();
    expect(screen.getByText("Informe o título do bolo.")).toBeInTheDocument();
    expect(screen.getByText("Escolha a forma.")).toBeInTheDocument();
    expect(screen.getByText("Escolha ao menos um recheio.")).toBeInTheDocument();
    expect(chamadas.criado).toBeUndefined();
  });

  it("retirada não pede endereço e envia o endereço vazio", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDePedidos();
    renderRotas("/pedidos/novo");

    await userEvent.selectOptions(await screen.findByLabelText("Tipo"), "pickup");
    expect(screen.queryByLabelText(/^Rua/)).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/^Nome/), "Ana");
    await userEvent.type(screen.getByLabelText(/^Telefone/), "11988881111");
    fireEvent.change(screen.getByLabelText(/^Data de produção/), { target: { value: "2099-11-14" } });
    fireEvent.change(screen.getByLabelText(/^Retirada/), { target: { value: "2099-11-14T15:30" } });
    await userEvent.type(screen.getByLabelText(/^Título/), "Bolo");
    await escolher(/^Forma do andar 1/, "Redondo 20 cm");
    await escolher(/^Massa do andar 1/, "Pão de ló");
    await userEvent.click(screen.getByRole("combobox", { name: /^Recheios do andar 1/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Brigadeiro" }));
    await userEvent.keyboard("{Escape}");
    await userEvent.click(screen.getByRole("button", { name: "Criar pedido" }));

    await waitFor(() => expect(chamadas.criado).toBeDefined());
    expect(chamadas.criado!.order).toMatchObject({
      fulfillment_type: "pickup",
      delivery_at: "2099-11-14T15:30:00-03:00",
      address: { street: "", number: "", complement: "", neighborhood: "", city: "", reference: "" },
    });
  });

  it("envia a imagem de referência por /uploads e põe só o signed_id no pedido", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDePedidos();
    const corposDeUpload: string[] = [];
    server.use(
      http.post(`${API}/uploads`, async ({ request }) => {
        corposDeUpload.push(await request.text());
        return HttpResponse.json(
          { signed_id: "assinado-123", url: "https://x/y.png", filename: "bolo.png", byte_size: 4 },
          { status: 201 },
        );
      }),
    );
    renderRotas("/pedidos/novo");

    await userEvent.type(await screen.findByLabelText(/^Nome/), "Ana");
    await userEvent.type(screen.getByLabelText(/^Telefone/), "11988881111");
    fireEvent.change(screen.getByLabelText(/^Data de produção/), { target: { value: "2099-11-14" } });
    fireEvent.change(screen.getByLabelText(/^Entrega/), { target: { value: "2099-11-14T09:00" } });
    for (const [rotulo, valor] of [
      [/^Rua/, "Rua A"],
      [/^Número/, "1"],
      [/^Bairro/, "Centro"],
      [/^Cidade/, "SP"],
      [/^Ponto de referência/, "Perto"],
      [/^Título/, "Bolo"],
    ] as const) {
      await userEvent.type(screen.getByLabelText(rotulo), valor);
    }
    await escolher(/^Forma do andar 1/, "Redondo 20 cm");
    await escolher(/^Massa do andar 1/, "Pão de ló");
    await userEvent.click(screen.getByRole("combobox", { name: /^Recheios do andar 1/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Brigadeiro" }));
    await userEvent.keyboard("{Escape}");
    await userEvent.upload(
      screen.getByLabelText("Imagem de referência"),
      new File(["png!"], "bolo.png", { type: "image/png" }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Criar pedido" }));

    await waitFor(() => expect(chamadas.criado).toBeDefined());
    expect(corposDeUpload).toHaveLength(1);
    expect(corposDeUpload[0]).toContain('name="file"; filename="bolo.png"');
    expect(chamadas.criado!.order.items[0]).toMatchObject({ reference_image_signed_id: "assinado-123" });
  });

  it("mostra os valores ao vivo quando o usuário pode ver preços", async () => {
    logarComo([...PERMISSOES, "orders.view_prices"]);
    const chamadas = apiDePedidos();
    renderRotas("/pedidos/novo");

    expect(
      await screen.findByText(/Escolha a forma e ao menos um recheio de cada andar/),
    ).toBeInTheDocument();
    await escolher(/^Forma do andar 1/, "Redondo 20 cm");
    await userEvent.click(screen.getByRole("combobox", { name: /^Recheios do andar 1/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Ninho com morango" }));
    await userEvent.keyboard("{Escape}");

    expect(await screen.findByText(/120,00/)).toBeInTheDocument();
    expect(chamadas.previews.at(-1)).toEqual({
      order: {
        fulfillment_type: "delivery",
        items: [{ has_reinforcement: false, tiers: [{ pan_spec_id: 1, layers_count: 1, filling_ids: [4] }] }],
      },
    });
  });

  it("sem orders.view_prices não pede nem mostra valores", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDePedidos();
    renderRotas("/pedidos/novo");

    await screen.findByLabelText(/^Nome/);
    expect(screen.queryByText("Valores")).not.toBeInTheDocument();
    expect(chamadas.previews).toEqual([]);
  });
});

describe("PedidoFormPage — editar", () => {
  it("carrega o pedido, envia lock_version e o id do bolo, e volta ao detalhe", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDePedidos();
    renderRotas("/pedidos/12/editar");

    const titulo = await screen.findByLabelText(/^Título/);
    expect(titulo).toHaveValue("Bolo Frozen do Pedro");
    expect(screen.getByLabelText(/^Nome/)).toHaveValue("Ana Souza");
    expect(screen.getByLabelText(/^Entrega/)).toHaveValue("2026-11-14T09:00");
    expect(screen.getByRole("combobox", { name: /^Forma do andar 1/ })).toHaveTextContent("Redondo 20 cm");

    await userEvent.clear(titulo);
    await userEvent.type(titulo, "Bolo Frozen da Maria");
    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("detalhe do pedido")).toBeInTheDocument();
    const { order } = chamadas.editado!;
    expect(order.lock_version).toBe(3);
    expect(order.items[0]).toMatchObject({
      id: 31,
      title: "Bolo Frozen da Maria",
      cake_type_id: 5,
      tiers: [{ pan_spec_id: 1, batter_type_id: 2, layers_count: 2, filling_ids: [4] }],
    });
  });

  it("trava formas, massas e camadas depois que o forno começou, e impede adicionar ou remover bolo", async () => {
    logarComo(PERMISSOES);
    apiDePedidos();
    server.use(
      http.get(`${API}/orders/12`, () =>
        HttpResponse.json({
          ...pedido,
          items: [
            {
              ...pedido.items[0],
              tiers: [
                { ...pedido.items[0].tiers[0], layers: [{ id: 200, layer_index: 1, status: "baking" }] },
              ],
            },
          ],
        }),
      ),
    );
    renderRotas("/pedidos/12/editar");

    await screen.findByLabelText(/^Título/);
    expect(screen.getByRole("combobox", { name: /^Forma do andar 1/ })).toBeDisabled();
    expect(screen.getByRole("combobox", { name: /^Massa do andar 1/ })).toBeDisabled();
    expect(screen.getByLabelText("Camadas do andar 1")).toBeDisabled();
    expect(screen.getByLabelText(/^Data de produção/)).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adicionar bolo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adicionar andar" })).toBeDisabled();
    // Ainda aguardando recheio: os recheios continuam editáveis (B.7).
    expect(screen.getByRole("combobox", { name: /^Recheios do andar 1/ })).toBeEnabled();
  });

  it("pedido cancelado não abre o formulário", async () => {
    logarComo(PERMISSOES);
    apiDePedidos({ statusDoPedido: "canceled" });
    renderRotas("/pedidos/12/editar");

    expect(await screen.findByText("Este pedido não pode mais ser editado.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar alterações" })).not.toBeInTheDocument();
  });

  it("em conflito de versão (stale_order) avisa e recarrega o pedido", async () => {
    logarComo(PERMISSOES);
    apiDePedidos({ falhaDeVersao: true });
    renderRotas("/pedidos/12/editar");

    await userEvent.click(await screen.findByRole("button", { name: "Salvar alterações" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeEnabled());
    expect(screen.queryByText("detalhe do pedido")).not.toBeInTheDocument();
  });
});
