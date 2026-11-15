import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { AuthProvider } from "@/domains/auth/components/AuthProvider";
import { tokenStorage } from "@/domains/auth/storage/tokenStorage";
import { usuarioStorage } from "@/domains/auth/storage/usuarioStorage";
import { payload, usuario } from "@/domains/auth/test/fixtures";
import { server } from "@/test/server";
import { ProtectedRoute } from "./ProtectedRoute";

const API = "http://localhost:3000";

function renderRotas() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={["/pedidos"]}>
          <Routes>
            <Route path="/login" element={<p>tela de login</p>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/pedidos" element={<p>conteúdo protegido</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  tokenStorage.clear();
  usuarioStorage.clear();
});

describe("ProtectedRoute", () => {
  it("sem sessão, redireciona para o login", async () => {
    renderRotas();
    expect(await screen.findByText("tela de login")).toBeInTheDocument();
  });

  it("com token e cópia do usuário, mostra a página na hora e revalida pelo /me", async () => {
    tokenStorage.set("token-abc");
    usuarioStorage.set({ ...usuario, permissions: ["users.index"] });
    let autorizacao: string | null = null;
    server.use(
      http.get(`${API}/me`, ({ request }) => {
        autorizacao = request.headers.get("authorization");
        return HttpResponse.json(payload);
      }),
    );
    renderRotas();

    // Sem tela de carregamento: a cópia salva já basta para renderizar.
    expect(screen.getByText("conteúdo protegido")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    // O /me atualiza a cópia com as permissões que vieram do servidor.
    await waitFor(() => expect(usuarioStorage.get()).toEqual(usuario));
    expect(autorizacao).toBe("Bearer token-abc");
  });

  it("com token e sem cópia, mostra carregamento até o /me responder", async () => {
    tokenStorage.set("token-abc");
    server.use(http.get(`${API}/me`, () => HttpResponse.json(payload)));
    renderRotas();

    expect(screen.getByRole("status")).toHaveTextContent("Carregando o ateliê");
    expect(await screen.findByText("conteúdo protegido")).toBeInTheDocument();
    expect(usuarioStorage.get()).toEqual(usuario);
  });

  it("ignora uma cópia salva em formato inválido", async () => {
    tokenStorage.set("token-abc");
    localStorage.setItem("cakeflow.user", JSON.stringify({ nome: "formato antigo" }));
    server.use(http.get(`${API}/me`, () => HttpResponse.json(payload)));
    renderRotas();

    expect(screen.getByRole("status")).toHaveTextContent("Carregando o ateliê");
    expect(await screen.findByText("conteúdo protegido")).toBeInTheDocument();
  });

  it("se o /me recusa o token (401), limpa tudo e vai para o login", async () => {
    tokenStorage.set("token-velho");
    usuarioStorage.set(usuario);
    server.use(http.get(`${API}/me`, () => new HttpResponse(null, { status: 401 })));
    renderRotas();

    expect(await screen.findByText("tela de login")).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
    expect(usuarioStorage.get()).toBeNull();
  });

  it("se o /me falha por erro do servidor, mantém a sessão salva", async () => {
    tokenStorage.set("token-abc");
    usuarioStorage.set(usuario);
    server.use(http.get(`${API}/me`, () => new HttpResponse(null, { status: 500 })));
    renderRotas();

    // Dá tempo da revalidação falhar e confirma que nada foi apagado.
    await waitFor(() => expect(screen.getByText("conteúdo protegido")).toBeInTheDocument());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.getByText("conteúdo protegido")).toBeInTheDocument();
    expect(tokenStorage.get()).toBe("token-abc");
    expect(usuarioStorage.get()).toEqual(usuario);
  });
});
