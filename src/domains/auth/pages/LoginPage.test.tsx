import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { tokenStorage } from "../storage/tokenStorage";
import { API, renderAuth } from "../test/renderAuth";
import { LoginPage } from "./LoginPage";

function renderLogin() {
  return renderAuth(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/definir-senha" element={<p>tela definir senha</p>} />
      <Route path="/" element={<p>tela inicial</p>} />
    </Routes>,
    "/login",
  );
}

async function preencherEEnviar(email = "ana@cakeflow.com.br", senha = "segredo123") {
  await userEvent.type(screen.getByLabelText(/E-mail/), email);
  await userEvent.type(screen.getByLabelText(/^Senha/), senha);
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

const usuario = {
  id: 1,
  name: "Ana Souza",
  email: "ana@cakeflow.com.br",
  role: "Administradora",
  mustChangePassword: false,
};

afterEach(() => tokenStorage.clear());

describe("LoginPage", () => {
  it("valida os campos obrigatórios antes de chamar a API", async () => {
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Informe o e-mail.")).toBeInTheDocument();
    expect(screen.getByText("Informe a senha.")).toBeInTheDocument();
  });

  it("mostra erro quando as credenciais são inválidas", async () => {
    server.use(http.post(`${API}/login`, () => new HttpResponse(null, { status: 401 })));
    renderLogin();
    await preencherEEnviar();

    expect(await screen.findByText("E-mail ou senha inválidos.")).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
  });

  it("autentica, guarda o token e vai para o início", async () => {
    server.use(
      http.post(`${API}/login`, () =>
        HttpResponse.json({ accessToken: "token-abc", user: usuario }),
      ),
    );
    renderLogin();
    await preencherEEnviar();

    expect(await screen.findByText("tela inicial")).toBeInTheDocument();
    expect(tokenStorage.get()).toBe("token-abc");
  });

  it("envia os campos em inglês (email e password) para a API", async () => {
    let corpo: unknown;
    server.use(
      http.post(`${API}/login`, async ({ request }) => {
        corpo = await request.json();
        return HttpResponse.json({ accessToken: "token-abc", user: usuario });
      }),
    );
    renderLogin();
    await preencherEEnviar("ana@cakeflow.com.br", "segredo123");

    expect(await screen.findByText("tela inicial")).toBeInTheDocument();
    expect(corpo).toEqual({ email: "ana@cakeflow.com.br", password: "segredo123" });
  });

  it("redireciona para definir a senha quando é primeiro acesso", async () => {
    server.use(
      http.post(`${API}/login`, () =>
        HttpResponse.json({
          accessToken: "token-abc",
          user: { ...usuario, mustChangePassword: true },
        }),
      ),
    );
    renderLogin();
    await preencherEEnviar();

    expect(await screen.findByText("tela definir senha")).toBeInTheDocument();
  });

  it("alterna a visibilidade da senha", async () => {
    renderLogin();
    const campo = screen.getByLabelText(/^Senha/);
    expect(campo).toHaveAttribute("type", "password");

    await userEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    await waitFor(() => expect(campo).toHaveAttribute("type", "text"));
  });
});
