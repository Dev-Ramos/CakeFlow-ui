import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { AuthProvider } from "@/domains/auth/components/AuthProvider";
import { tokenStorage } from "@/domains/auth/storage/tokenStorage";
import { server } from "@/test/server";
import { ProtectedRoute } from "./ProtectedRoute";

const API = "http://localhost:3000";
const usuario = {
  id: 1,
  name: "Ana Souza",
  email: "ana@cakeflow.com.br",
  role: "Administradora",
  mustChangePassword: false,
};

function renderRotas() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={["/pedidos"]}>
          <Routes>
            <Route path="/login" element={<p>tela de login</p>} />
            <Route path="/definir-senha" element={<p>tela definir senha</p>} />
            <Route element={<ProtectedRoute />}>
              <Route path="/pedidos" element={<p>conteúdo protegido</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

afterEach(() => tokenStorage.clear());

describe("ProtectedRoute", () => {
  it("sem sessão, redireciona para o login", async () => {
    renderRotas();
    expect(await screen.findByText("tela de login")).toBeInTheDocument();
  });

  it("restaura a sessão pelo token e libera a rota", async () => {
    tokenStorage.set("token-abc");
    let autorizacao: string | null = null;
    server.use(
      http.get(`${API}/me`, ({ request }) => {
        autorizacao = request.headers.get("authorization");
        return HttpResponse.json(usuario);
      }),
    );
    renderRotas();

    expect(screen.getByRole("status")).toHaveTextContent("Carregando o ateliê");
    expect(await screen.findByText("conteúdo protegido")).toBeInTheDocument();
    expect(autorizacao).toBe("Bearer token-abc");
  });

  it("com senha pendente, redireciona para definir a senha", async () => {
    tokenStorage.set("token-abc");
    server.use(
      http.get(`${API}/me`, () => HttpResponse.json({ ...usuario, mustChangePassword: true })),
    );
    renderRotas();

    expect(await screen.findByText("tela definir senha")).toBeInTheDocument();
  });

  it("com token inválido, limpa a sessão e vai para o login", async () => {
    tokenStorage.set("token-velho");
    server.use(http.get(`${API}/me`, () => new HttpResponse(null, { status: 401 })));
    renderRotas();

    expect(await screen.findByText("tela de login")).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
  });
});
