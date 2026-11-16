import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { API, renderAuth } from "@/domains/auth/test/renderAuth";
import { paginar } from "@/domains/user-management/test/fixtures";
import { limparSessao, logarComo } from "@/domains/user-management/test/sessao";
import { server } from "@/test/server";
import { ConfirmProvider } from "@/ui/confirm/ConfirmProvider";
import { paraCorpo as corpoDoTipoDeBolo } from "../api/cakeTypesApi";
import type { CakeTypePayload } from "../types/cakeType";
import { TipoDeBoloFormPage } from "../pages/TipoDeBoloFormPage";
import { TiposDeBoloPage } from "../pages/TiposDeBoloPage";

const PERMISSOES = [
  "cake_types.index",
  "cake_types.create",
  "cake_types.update",
  "cake_types.delete",
  "cake_types.read",
];

const frozen: CakeTypePayload = {
  id: 5,
  name: "Bolo Frozen",
  description: "Tema gelo",
  image_url: "https://cdn.exemplo.com/frozen.webp",
  default_pan_spec: {
    id: 1,
    name: "Redondo 20 cm",
    dimensions_label: "20 cm de diâmetro",
    height_cm: 7,
    active: true,
  },
  default_batter_type: { id: 2, name: "Pão de ló", active: false },
  default_fillings: [
    { id: 4, name: "Ninho com morango", active: true },
    { id: 6, name: "Brigadeiro", active: true },
  ],
  requires_decoration: true,
  requires_reinforcement: false,
  active: true,
};

const FORMAS = [{ value: 1, label: "Redondo 20 cm", hint: null }, { value: 4, label: "Quadrada 25 cm", hint: null }];
const MASSAS = [{ value: 2, label: "Pão de ló", hint: null }, { value: 5, label: "Chocolate", hint: null }];
const RECHEIOS = [
  { value: 4, label: "Ninho com morango", hint: null },
  { value: 6, label: "Brigadeiro", hint: null },
  { value: 7, label: "Doce de leite", hint: null },
];

function renderRotas(rota: string) {
  return renderAuth(
    <ConfirmProvider>
      <Routes>
        <Route path="/catalogo/tipos-de-bolo" element={<><TiposDeBoloPage /><p>fim da lista</p></>} />
        <Route path="/catalogo/tipos-de-bolo/novo" element={<TipoDeBoloFormPage />} />
        <Route path="/catalogo/tipos-de-bolo/:id" element={<TipoDeBoloFormPage />} />
      </Routes>
    </ConfirmProvider>,
    rota,
  );
}

function apiDeTipos() {
  const chamadas: {
    consultas: URL[];
    enviado?: { tipo: string | null; corpo: string };
    excluidos: string[];
  } = { consultas: [], excluidos: [] };

  const opcoes = (itens: typeof FORMAS) => ({ request }: { request: Request }) => {
    const q = (new URL(request.url).searchParams.get("search") ?? "").toLowerCase();
    return HttpResponse.json({ data: itens.filter((o) => o.label.toLowerCase().includes(q)) });
  };

  server.use(
    http.get(`${API}/cake_types`, ({ request }) => {
      const url = new URL(request.url);
      chamadas.consultas.push(url);
      return HttpResponse.json(paginar([frozen], url));
    }),
    http.get(`${API}/cake_types/:id`, () => HttpResponse.json(frozen)),
    // Corpo bruto: o `formData()` do MSW não aceita o `File` do jsdom (outro realm).
    http.post(`${API}/cake_types`, async ({ request }) => {
      chamadas.enviado = { tipo: request.headers.get("content-type"), corpo: await request.text() };
      return HttpResponse.json({ ...frozen, id: 9 }, { status: 201 });
    }),
    http.patch(`${API}/cake_types/:id`, async ({ request }) => {
      chamadas.enviado = { tipo: request.headers.get("content-type"), corpo: await request.text() };
      return HttpResponse.json(frozen);
    }),
    http.delete(`${API}/cake_types/:id`, ({ params }) => {
      chamadas.excluidos.push(String(params.id));
      return new HttpResponse(null, { status: 204 });
    }),
    http.get(`${API}/pan_specs/options`, opcoes(FORMAS)),
    http.get(`${API}/batter_types/options`, opcoes(MASSAS)),
    http.get(`${API}/fillings/options`, opcoes(RECHEIOS)),
  );
  return chamadas;
}

const imagem = (nome = "bolo.png", tipo = "image/png", tamanho = 1024) =>
  new File([new Uint8Array(tamanho)], nome, { type: tipo });

beforeAll(() => {
  // jsdom não implementa a URL de prévia dos arquivos.
  URL.createObjectURL = vi.fn(() => "blob:previa");
  URL.revokeObjectURL = vi.fn();
});
afterEach(limparSessao);

describe("corpoDoTipoDeBolo (multipart)", () => {
  const base = {
    name: "Bolo",
    description: "",
    defaultPanSpecId: null,
    defaultBatterTypeId: null,
    defaultFillingIds: [] as number[],
    requiresDecoration: false,
    requiresReinforcement: true,
    active: true,
    image: null,
    removeImage: false,
  };

  it("usa as chaves cake_type[...] e [] para a lista de recheios", () => {
    const corpo = corpoDoTipoDeBolo({ ...base, defaultPanSpecId: 1, defaultFillingIds: [4, 6] });
    expect(corpo.get("cake_type[name]")).toBe("Bolo");
    expect(corpo.get("cake_type[default_pan_spec_id]")).toBe("1");
    expect(corpo.getAll("cake_type[default_filling_ids][]")).toEqual(["4", "6"]);
    expect(corpo.get("cake_type[requires_reinforcement]")).toBe("true");
    expect(corpo.get("cake_type[requires_decoration]")).toBe("false");
  });

  it("limpa as escolhas com valores vazios (forma, massa e recheios)", () => {
    const corpo = corpoDoTipoDeBolo(base);
    expect(corpo.get("cake_type[default_pan_spec_id]")).toBe("");
    expect(corpo.get("cake_type[default_batter_type_id]")).toBe("");
    expect(corpo.getAll("cake_type[default_filling_ids][]")).toEqual([""]);
  });

  it("envia a imagem em cake_type[image] ou remove_image, nunca os dois", () => {
    const comArquivo = corpoDoTipoDeBolo({ ...base, image: imagem(), removeImage: true });
    expect((comArquivo.get("cake_type[image]") as File).name).toBe("bolo.png");
    expect(comArquivo.has("cake_type[remove_image]")).toBe(false);

    const removendo = corpoDoTipoDeBolo({ ...base, removeImage: true });
    expect(removendo.get("cake_type[remove_image]")).toBe("true");
    expect(removendo.has("cake_type[image]")).toBe(false);
  });
});

describe("TiposDeBoloPage", () => {
  it("lista com forma, massa e recheios padrão, marcando o que está inativo", async () => {
    logarComo(PERMISSOES);
    apiDeTipos();
    renderRotas("/catalogo/tipos-de-bolo");

    expect(await screen.findByText("Bolo Frozen")).toBeInTheDocument();
    expect(screen.getAllByText("Redondo 20 cm").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/20 cm de diâmetro · 7 cm de altura/).length).toBeGreaterThan(0);
    // A massa padrão foi inativada depois: continua aparecendo, marcada.
    expect(screen.getAllByText("Pão de ló (inativo)").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ninho com morango").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Exige").length).toBeGreaterThan(0);
  });

  it("filtra por decoração enviando requires_decoration", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDeTipos();
    renderRotas("/catalogo/tipos-de-bolo");

    expect(await screen.findByText("Bolo Frozen")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Decoração"), "sim");

    await waitFor(() =>
      expect(chamadas.consultas.at(-1)?.searchParams.get("requires_decoration")).toBe("true"),
    );
  });

  it("exclui depois da confirmação", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDeTipos();
    renderRotas("/catalogo/tipos-de-bolo");

    await userEvent.click(await screen.findByRole("button", { name: "Ações do tipo de bolo Bolo Frozen" }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Excluir" }));
    await userEvent.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Excluir" }),
    );

    await waitFor(() => expect(chamadas.excluidos).toEqual(["5"]));
  });

  it("esconde Novo tipo de bolo e as ações sem as permissões", async () => {
    logarComo(["cake_types.index"]);
    apiDeTipos();
    renderRotas("/catalogo/tipos-de-bolo");

    expect(await screen.findByText("Bolo Frozen")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Novo tipo de bolo/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ações do tipo/ })).not.toBeInTheDocument();
  });
});

describe("TipoDeBoloFormPage", () => {
  it("cria o tipo em multipart com padrões, recheios, toggles e imagem", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDeTipos();
    renderRotas("/catalogo/tipos-de-bolo/novo");

    await userEvent.type(await screen.findByLabelText(/^Nome/), "Bolo Unicórnio");
    await userEvent.type(screen.getByLabelText("Descrição"), "Colorido");

    await userEvent.click(screen.getByRole("combobox", { name: /Forma padrão/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Quadrada 25 cm" }));
    await userEvent.click(screen.getByRole("combobox", { name: /Massa padrão/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Chocolate" }));

    await userEvent.click(screen.getByRole("combobox", { name: /Recheios padrão/ }));
    await userEvent.click(await screen.findByRole("option", { name: "Brigadeiro" }));
    await userEvent.click(screen.getByRole("option", { name: "Doce de leite" }));
    await userEvent.keyboard("{Escape}");

    await userEvent.click(screen.getByRole("switch", { name: "Exige decoração" }));
    await userEvent.upload(screen.getByLabelText("Escolher imagem do tipo de bolo"), imagem());
    expect(screen.getByAltText("Imagem do tipo de bolo")).toHaveAttribute("src", "blob:previa");

    await userEvent.click(screen.getByRole("button", { name: "Criar tipo de bolo" }));

    expect(await screen.findByText("fim da lista")).toBeInTheDocument();
    expect(chamadas.enviado?.tipo).toMatch(/^multipart\/form-data; boundary=/);
    const corpo = chamadas.enviado?.corpo ?? "";
    for (const trecho of [
      'name="cake_type[name]"\r\n\r\nBolo Unicórnio',
      'name="cake_type[default_pan_spec_id]"\r\n\r\n4',
      'name="cake_type[default_batter_type_id]"\r\n\r\n5',
      'name="cake_type[requires_decoration]"\r\n\r\ntrue',
      'name="cake_type[requires_reinforcement]"\r\n\r\nfalse',
      'name="cake_type[active]"\r\n\r\ntrue',
      'name="cake_type[image]"; filename="bolo.png"',
    ]) {
      expect(corpo).toContain(trecho);
    }
    // Recheios: uma parte `[]` por id, no tipo certo (números como texto do multipart).
    expect(corpo.match(/name="cake_type\[default_filling_ids\]\[\]"\r\n\r\n(\d+)/g)).toEqual([
      'name="cake_type[default_filling_ids][]"\r\n\r\n6',
      'name="cake_type[default_filling_ids][]"\r\n\r\n7',
    ]);
  });

  it("exige o nome", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDeTipos();
    renderRotas("/catalogo/tipos-de-bolo/novo");

    await userEvent.click(await screen.findByRole("button", { name: "Criar tipo de bolo" }));

    expect(await screen.findByText("Informe o nome.")).toBeInTheDocument();
    expect(chamadas.enviado).toBeUndefined();
  });

  it("recusa imagem de tipo inválido ou acima de 5 MB", async () => {
    logarComo(PERMISSOES);
    apiDeTipos();
    renderRotas("/catalogo/tipos-de-bolo/novo");

    const entrada = await screen.findByLabelText("Escolher imagem do tipo de bolo");
    await userEvent.setup({ applyAccept: false }).upload(entrada, imagem("doc.pdf", "application/pdf"));
    expect(await screen.findByText("Use uma imagem JPG, PNG ou WebP.")).toBeInTheDocument();

    await userEvent.upload(entrada, imagem("grande.png", "image/png", 6 * 1024 * 1024));
    expect(await screen.findByText("A imagem deve ter no máximo 5 MB.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Desfazer escolha" })).not.toBeInTheDocument();
  });

  it("carrega o tipo, mostra os padrões (inativos marcados) e remove a imagem com remove_image", async () => {
    logarComo(PERMISSOES);
    const chamadas = apiDeTipos();
    renderRotas("/catalogo/tipos-de-bolo/5");

    expect(await screen.findByRole("heading", { name: "Editar tipo de bolo: Bolo Frozen" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nome/)).toHaveValue("Bolo Frozen");
    expect(screen.getByRole("combobox", { name: /Forma padrão/ })).toHaveTextContent("Redondo 20 cm");
    expect(screen.getByRole("combobox", { name: /Massa padrão/ })).toHaveTextContent("Pão de ló (inativo)");
    expect(screen.getByRole("button", { name: "Remover Ninho com morango" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Exige decoração" })).toBeChecked();
    expect(screen.getByAltText("Imagem do tipo de bolo")).toHaveAttribute(
      "src",
      "https://cdn.exemplo.com/frozen.webp",
    );

    await userEvent.click(screen.getByRole("button", { name: "Remover imagem" }));
    expect(screen.queryByAltText("Imagem do tipo de bolo")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("fim da lista")).toBeInTheDocument();
    const corpo = chamadas.enviado?.corpo ?? "";
    expect(corpo).toContain('name="cake_type[remove_image]"\r\n\r\ntrue');
    expect(corpo).not.toContain('name="cake_type[image]"');
    // Os padrões já existentes seguem no PATCH (a escolha inativa não é perdida).
    expect(corpo).toContain('name="cake_type[default_batter_type_id]"\r\n\r\n2');
    expect(corpo).toContain('name="cake_type[default_filling_ids][]"\r\n\r\n4');
  });

  it("pede confirmação para descartar alterações ao cancelar", async () => {
    logarComo(PERMISSOES);
    apiDeTipos();
    renderRotas("/catalogo/tipos-de-bolo/novo");

    await userEvent.type(await screen.findByLabelText(/^Nome/), "rascunho");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    const confirmacao = await screen.findByRole("alertdialog");
    await userEvent.click(within(confirmacao).getByRole("button", { name: "Descartar" }));
    expect(await screen.findByText("fim da lista")).toBeInTheDocument();
  });
});
