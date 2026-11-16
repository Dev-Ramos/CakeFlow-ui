import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { tokenStorage } from "../storage/tokenStorage";
import { usuarioStorage } from "../storage/usuarioStorage";
import { payload, usuario } from "../test/fixtures";
import { API, renderAuth } from "../test/renderAuth";
import { RequirePermission } from "./RequirePermission";

function logarComo(permissions: string[]) {
  tokenStorage.set("token-teste");
  usuarioStorage.set({ ...usuario, permissions });
  server.use(http.get(`${API}/me`, () => HttpResponse.json({ ...payload, permissions })));
}

afterEach(() => {
  tokenStorage.clear();
  usuarioStorage.clear();
});

describe("RequirePermission", () => {
  it("mostra o conteúdo para quem tem a permissão", () => {
    logarComo(["users.index"]);
    renderAuth(
      <RequirePermission permission="users.index">
        <p>conteúdo liberado</p>
      </RequirePermission>,
    );

    expect(screen.getByText("conteúdo liberado")).toBeInTheDocument();
  });

  it("mostra acesso negado para quem não tem", () => {
    logarComo(["users.index"]);
    renderAuth(
      <RequirePermission permission="roles.delete">
        <p>conteúdo liberado</p>
      </RequirePermission>,
    );

    expect(screen.getByRole("heading", { name: "Acesso negado" })).toBeInTheDocument();
    expect(screen.queryByText("conteúdo liberado")).not.toBeInTheDocument();
  });

  it("com uma lista de permissões, basta ter uma delas", () => {
    logarComo(["fillings.index"]);
    renderAuth(
      <RequirePermission permission={["pan_specs.index", "batter_types.index", "fillings.index"]}>
        <p>conteúdo liberado</p>
      </RequirePermission>,
    );

    expect(screen.getByText("conteúdo liberado")).toBeInTheDocument();
  });

  it("com uma lista de permissões, nega quando não tem nenhuma", () => {
    logarComo(["users.index"]);
    renderAuth(
      <RequirePermission permission={["pan_specs.index", "batter_types.index"]}>
        <p>conteúdo liberado</p>
      </RequirePermission>,
    );

    expect(screen.getByRole("heading", { name: "Acesso negado" })).toBeInTheDocument();
  });
});
