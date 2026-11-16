import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { tokenStorage } from "../storage/tokenStorage";
import { usuarioStorage } from "../storage/usuarioStorage";
import { API, renderAuth } from "../test/renderAuth";
import { payload, respostaDeLogin, usuario } from "../test/fixtures";
import { LoginPage } from "./LoginPage";

function renderLogin() {
  return renderAuth(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<p>tela inicial</p>} />
    </Routes>,
    "/login",
  );
}

async function preencherEEnviar(email = "super@cakeflow.com.br", senha = "segredo123") {
  await userEvent.type(screen.getByLabelText(/E-mail/), email);
  await userEvent.type(screen.getByLabelText(/^Senha/), senha);
  await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
}

afterEach(() => {
  tokenStorage.clear();
  usuarioStorage.clear();
});

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

  it("autentica, salva token e usuário no localStorage e vai para o início", async () => {
    server.use(http.post(`${API}/login`, () => respostaDeLogin("token-abc")));
    renderLogin();
    await preencherEEnviar();

    expect(await screen.findByText("tela inicial")).toBeInTheDocument();
    // O prefixo "Bearer " do header não é guardado.
    expect(tokenStorage.get()).toBe("token-abc");
    expect(usuarioStorage.get()).toEqual(usuario);
  });

  it("envia os campos em inglês (email e password) para a API", async () => {
    let corpo: unknown;
    server.use(
      http.post(`${API}/login`, async ({ request }) => {
        corpo = await request.json();
        return respostaDeLogin();
      }),
    );
    renderLogin();
    await preencherEEnviar("super@cakeflow.com.br", "segredo123");

    expect(await screen.findByText("tela inicial")).toBeInTheDocument();
    expect(corpo).toEqual({ email: "super@cakeflow.com.br", password: "segredo123" });
  });

  it("falha quando a API não devolve o token no header", async () => {
    server.use(http.post(`${API}/login`, () => HttpResponse.json(payload)));
    renderLogin();
    await preencherEEnviar();

    expect(await screen.findByText(/a API não devolveu o token de acesso/)).toBeInTheDocument();
    expect(tokenStorage.get()).toBeNull();
    expect(usuarioStorage.get()).toBeNull();
  });

  it("alterna a visibilidade da senha", async () => {
    renderLogin();
    const campo = screen.getByLabelText(/^Senha/);
    expect(campo).toHaveAttribute("type", "password");

    await userEvent.click(screen.getByRole("button", { name: "Mostrar senha" }));
    await waitFor(() => expect(campo).toHaveAttribute("type", "text"));
  });
});
