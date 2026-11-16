import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { API, renderAuth } from "../test/renderAuth";
import { DefinirSenhaPage } from "./DefinirSenhaPage";

const ROTA = "/definir-senha?reset_password_token=abc";

function renderPagina(rota: string) {
  return renderAuth(
    <Routes>
      <Route path="/definir-senha" element={<DefinirSenhaPage />} />
      <Route path="/login" element={<p>tela de login</p>} />
    </Routes>,
    rota,
  );
}

async function preencherEEnviar(senha: string, confirmacao = senha) {
  await userEvent.type(await screen.findByLabelText(/^Nova senha/), senha);
  await userEvent.type(screen.getByLabelText(/Confirmar senha/), confirmacao);
  await userEvent.click(screen.getByRole("button", { name: "Definir senha" }));
}

describe("DefinirSenhaPage", () => {
  it("sem token e sem sessão, volta para o login", async () => {
    renderPagina("/definir-senha");
    expect(await screen.findByText("tela de login")).toBeInTheDocument();
  });

  it("mostra o formulário direto, sem consultar a API antes (o token só é validado no envio)", async () => {
    // Qualquer requisição sem handler quebraria o teste (`onUnhandledFrame: error`).
    renderPagina(ROTA);

    expect(await screen.findByRole("heading", { name: /Bem-vindo\(a\) ao Cakeflow!/ })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nova senha/)).toBeInTheDocument();
  });

  it("valida as senhas no formulário", async () => {
    renderPagina(ROTA);

    await preencherEEnviar("curta", "outra");

    expect(await screen.findByText("Use pelo menos 8 caracteres.", { selector: "p[role=alert]" })).toBeInTheDocument();
    expect(screen.getByText("As senhas não conferem.")).toBeInTheDocument();
  });

  it("envia PUT /password com o reset_password_token e volta para o login", async () => {
    let corpo: unknown;
    server.use(
      http.put(`${API}/password`, async ({ request }) => {
        corpo = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderPagina(ROTA);

    await preencherEEnviar("senhaforte1");

    expect(await screen.findByText("tela de login")).toBeInTheDocument();
    expect(corpo).toEqual({
      user: {
        reset_password_token: "abc",
        password: "senhaforte1",
        password_confirmation: "senhaforte1",
      },
    });
  });

  it("mostra o erro da API (ex.: token inválido) no próprio formulário", async () => {
    server.use(
      http.put(`${API}/password`, () =>
        HttpResponse.json({ errors: ["Reset password token is invalid"] }, { status: 422 }),
      ),
    );
    renderPagina(ROTA);

    await preencherEEnviar("senhaforte1");

    expect(await screen.findByText(/Reset password token is invalid/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Definir senha" })).toBeInTheDocument();
  });

  it("mostra link expirado quando a API diz que o link não existe mais", async () => {
    server.use(http.put(`${API}/password`, () => new HttpResponse(null, { status: 410 })));
    renderPagina(ROTA);

    await preencherEEnviar("senhaforte1");

    expect(await screen.findByRole("heading", { name: "Link expirado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao login" })).toHaveAttribute("href", "/login");
  });
});
