import { act, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { useAuth } from "../hooks/useAuth";
import { tokenStorage } from "../storage/tokenStorage";
import { usuarioStorage } from "../storage/usuarioStorage";
import { payload, usuario } from "../test/fixtures";
import { API, renderAuth } from "../test/renderAuth";

function Sonda() {
  const { status, can } = useAuth();
  return (
    <div>
      <p>status: {status}</p>
      <p>{can("users.create") ? "pode criar usuários" : "não pode criar usuários"}</p>
    </div>
  );
}

afterEach(() => {
  tokenStorage.clear();
  usuarioStorage.clear();
});

describe("AuthProvider", () => {
  it("can() reflete as permissões atualizadas pelo /me", async () => {
    tokenStorage.set("token-abc");
    // A cópia salva ainda tem a permissão; o servidor já a removeu.
    usuarioStorage.set(usuario);
    server.use(
      http.get(`${API}/me`, () =>
        HttpResponse.json({ ...payload, permissions: ["users.index"] }),
      ),
    );
    renderAuth(<Sonda />);

    expect(screen.getByText("pode criar usuários")).toBeInTheDocument();
    expect(await screen.findByText("não pode criar usuários")).toBeInTheDocument();
    expect(usuarioStorage.get()?.permissions).toEqual(["users.index"]);
  });

  it("encerra a sessão quando o logout acontece em outra aba", async () => {
    tokenStorage.set("token-abc");
    usuarioStorage.set(usuario);
    server.use(http.get(`${API}/me`, () => HttpResponse.json(payload)));
    renderAuth(<Sonda />);
    expect(screen.getByText("status: autenticado")).toBeInTheDocument();

    // Em outra aba o token foi removido: o navegador dispara `storage` aqui.
    act(() => {
      tokenStorage.clear();
      window.dispatchEvent(
        new StorageEvent("storage", { key: "cakeflow.accessToken", newValue: null }),
      );
    });

    await waitFor(() => expect(screen.getByText("status: anonimo")).toBeInTheDocument());
    // O /me que já estava em andamento responde depois e não pode reabrir a sessão.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.getByText("status: anonimo")).toBeInTheDocument();
    expect(usuarioStorage.get()).toBeNull();
  });
});
