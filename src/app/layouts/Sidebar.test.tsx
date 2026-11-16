import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { renderAuth } from "@/domains/auth/test/renderAuth";
import { limparSessao, logarComo } from "@/domains/user-management/test/sessao";
import { Sidebar } from "./Sidebar";

function renderSidebar() {
  return renderAuth(<Sidebar aberto={false} onFechar={() => {}} />);
}

afterEach(limparSessao);

describe("Sidebar", () => {
  it("mostra em Administração só o que o usuário pode acessar", async () => {
    logarComo(["users.index"]);
    renderSidebar();

    await userEvent.click(screen.getByRole("button", { name: /Administração/ }));

    expect(screen.getByRole("link", { name: "Usuários" })).toHaveAttribute(
      "href",
      "/administracao/usuarios",
    );
    expect(screen.queryByRole("link", { name: "Cargos e permissões" })).not.toBeInTheDocument();
  });

  it("mostra usuários e cargos para quem tem as duas permissões", async () => {
    logarComo(["users.index", "roles.index"]);
    renderSidebar();

    await userEvent.click(screen.getByRole("button", { name: /Administração/ }));

    expect(screen.getByRole("link", { name: "Usuários" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cargos e permissões" })).toHaveAttribute(
      "href",
      "/administracao/cargos",
    );
  });

  it("esconde o grupo Administração sem nenhuma das permissões", () => {
    logarComo(["orders.index"]);
    renderSidebar();

    expect(screen.queryByRole("button", { name: /Administração/ })).not.toBeInTheDocument();
  });

  it("esconde o grupo Catálogo sem nenhuma permissão de catálogo", () => {
    logarComo(["orders.index"]);
    renderSidebar();

    expect(screen.queryByRole("button", { name: /Catálogo/ })).not.toBeInTheDocument();
  });

  it("mostra Componentes com qualquer um dos três index (formas, massas ou recheios)", async () => {
    logarComo(["batter_types.index"]);
    renderSidebar();

    await userEvent.click(screen.getByRole("button", { name: /Catálogo/ }));

    expect(screen.getByRole("link", { name: "Componentes" })).toHaveAttribute(
      "href",
      "/catalogo/componentes",
    );
    expect(screen.queryByRole("link", { name: "Fichas técnicas" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tipos de bolo" })).not.toBeInTheDocument();
  });

  it("mostra fichas técnicas e tipos de bolo conforme o index de cada um", async () => {
    logarComo(["technical_sheets.index", "cake_types.index"]);
    renderSidebar();

    await userEvent.click(screen.getByRole("button", { name: /Catálogo/ }));

    expect(screen.getByRole("link", { name: "Fichas técnicas" })).toHaveAttribute(
      "href",
      "/catalogo/fichas-tecnicas",
    );
    expect(screen.getByRole("link", { name: "Tipos de bolo" })).toHaveAttribute(
      "href",
      "/catalogo/tipos-de-bolo",
    );
    expect(screen.queryByRole("link", { name: "Componentes" })).not.toBeInTheDocument();
  });

  it("mostra Pedidos só com orders.index", () => {
    logarComo(["pan_specs.index"]);
    const { unmount } = renderSidebar();
    expect(screen.queryByRole("link", { name: "Pedidos" })).not.toBeInTheDocument();
    unmount();

    logarComo(["orders.index"]);
    renderSidebar();
    expect(screen.getByRole("link", { name: "Pedidos" })).toHaveAttribute("href", "/pedidos");
  });

  it("mostra Preços e acréscimos e Solicitações de cancelamento em Administração, cada um com a sua permissão", async () => {
    logarComo(["pricing.index"]);
    const { unmount } = renderSidebar();
    await userEvent.click(screen.getByRole("button", { name: /Administração/ }));
    expect(screen.getByRole("link", { name: "Preços e acréscimos" })).toHaveAttribute(
      "href",
      "/administracao/precos",
    );
    expect(screen.queryByRole("link", { name: "Solicitações de cancelamento" })).not.toBeInTheDocument();
    unmount();

    logarComo(["orders.approve_cancel"]);
    renderSidebar();
    await userEvent.click(screen.getByRole("button", { name: /Administração/ }));
    expect(screen.getByRole("link", { name: "Solicitações de cancelamento" })).toHaveAttribute(
      "href",
      "/administracao/solicitacoes-de-cancelamento",
    );
    expect(screen.queryByRole("link", { name: "Preços e acréscimos" })).not.toBeInTheDocument();
  });
});
