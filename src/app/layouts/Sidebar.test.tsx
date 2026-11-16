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
    expect(screen.getByRole("link", { name: /Catálogo/ })).toBeInTheDocument();
  });
});
