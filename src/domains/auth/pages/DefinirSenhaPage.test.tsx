import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { API, renderAuth } from "../test/renderAuth";
import { DefinirSenhaPage } from "./DefinirSenhaPage";

function renderPagina(rota: string) {
  return renderAuth(
    <Routes>
      <Route path="/definir-senha" element={<DefinirSenhaPage />} />
      <Route path="/login" element={<p>tela de login</p>} />
    </Routes>,
    rota,
  );
}

function conviteValido() {
  server.use(
    http.get(`${API}/auth/convites/abc`, () =>
      HttpResponse.json({ nome: "Júlia Prado", email: "julia@cakeflow.com.br" }),
    ),
  );
}

describe("DefinirSenhaPage", () => {
  it("sem token e sem sessão, volta para o login", async () => {
    renderPagina("/definir-senha");
    expect(await screen.findByText("tela de login")).toBeInTheDocument();
  });

  it("mostra link expirado quando o convite é inválido", async () => {
    server.use(http.get(`${API}/auth/convites/abc`, () => new HttpResponse(null, { status: 410 })));
    renderPagina("/definir-senha?token=abc");

    expect(await screen.findByRole("heading", { name: "Link expirado" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao login" })).toHaveAttribute("href", "/login");
  });

  it("saúda o convidado e valida as senhas", async () => {
    conviteValido();
    renderPagina("/definir-senha?token=abc");

    expect(await screen.findByRole("heading", { name: /Bem-vindo\(a\) ao Cakeflow, Júlia!/ })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/^Nova senha/), "curta");
    await userEvent.type(screen.getByLabelText(/Confirmar senha/), "outra");
    await userEvent.click(screen.getByRole("button", { name: "Definir senha" }));

    expect(await screen.findByText("Use pelo menos 8 caracteres.", { selector: "p[role=alert]" })).toBeInTheDocument();
    expect(screen.getByText("As senhas não conferem.")).toBeInTheDocument();
  });

  it("define a senha com o token do convite e volta para o login", async () => {
    conviteValido();
    let corpo: unknown;
    server.use(
      http.post(`${API}/auth/definir-senha`, async ({ request }) => {
        corpo = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderPagina("/definir-senha?token=abc");

    await userEvent.type(await screen.findByLabelText(/^Nova senha/), "senhaforte1");
    await userEvent.type(screen.getByLabelText(/Confirmar senha/), "senhaforte1");
    await userEvent.click(screen.getByRole("button", { name: "Definir senha" }));

    expect(await screen.findByText("tela de login")).toBeInTheDocument();
    expect(corpo).toEqual({ token: "abc", senha: "senhaforte1" });
  });

  it("mostra o erro do servidor ao definir a senha", async () => {
    conviteValido();
    server.use(
      http.post(`${API}/auth/definir-senha`, () =>
        HttpResponse.json({ message: "Senha muito comum." }, { status: 422 }),
      ),
    );
    renderPagina("/definir-senha?token=abc");

    await userEvent.type(await screen.findByLabelText(/^Nova senha/), "senhaforte1");
    await userEvent.type(screen.getByLabelText(/Confirmar senha/), "senhaforte1");
    await userEvent.click(screen.getByRole("button", { name: "Definir senha" }));

    expect(await screen.findByText("Senha muito comum.")).toBeInTheDocument();
  });
});
