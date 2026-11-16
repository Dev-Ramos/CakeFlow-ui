import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { payload } from "@/domains/auth/test/fixtures";
import { API, renderAuth } from "@/domains/auth/test/renderAuth";
import { limparSessao, logarComo } from "@/domains/user-management/test/sessao";
import { server } from "@/test/server";
import { ConfirmProvider } from "@/ui/confirm/ConfirmProvider";
import { MinhaContaPage } from "./MinhaContaPage";

function renderPagina() {
  return renderAuth(
    <ConfirmProvider>
      <Routes>
        <Route path="/minha-conta" element={<MinhaContaPage />} />
      </Routes>
    </ConfirmProvider>,
    "/minha-conta",
  );
}

interface Chamadas {
  /** Cada `PATCH /me`: tipo do conteúdo e corpo bruto (multipart ou JSON). */
  perfil: Array<{ tipo: string | null; corpo: string }>;
  senha: unknown[];
}

/** API da conta em memória: `/me` devolve o que os PATCH gravaram, como a API real. */
function apiDaConta({
  comFoto = false,
  erroDeSenha,
}: { comFoto?: boolean; erroDeSenha?: { code: string; errors: string[] } } = {}) {
  let imageUrl: string | null = comFoto ? "https://cdn.exemplo.com/foto.png" : null;
  let nome = payload.user.name;
  const chamadas: Chamadas = { perfil: [], senha: [] };

  const corpoDoMe = () => ({ ...payload, user: { ...payload.user, name: nome, image_url: imageUrl } });

  server.use(
    http.get(`${API}/me`, () => HttpResponse.json(corpoDoMe())),
    http.patch(`${API}/me`, async ({ request }) => {
      // Corpo bruto: o `formData()` do MSW não aceita o `File` do jsdom (outro realm).
      const tipo = request.headers.get("content-type");
      const corpo = await request.text();
      chamadas.perfil.push({ tipo, corpo });

      if (tipo?.startsWith("multipart/form-data")) imageUrl = "/storage/foto-nova.png";
      else {
        const { user } = JSON.parse(corpo) as { user: { name?: string; remove_image?: string } };
        if (user.name) nome = user.name;
        if (user.remove_image === "true") imageUrl = null;
      }
      return HttpResponse.json(corpoDoMe());
    }),
    http.patch(`${API}/me/password`, async ({ request }) => {
      chamadas.senha.push(await request.json());
      if (erroDeSenha) return HttpResponse.json(erroDeSenha, { status: 422 });
      return HttpResponse.json(corpoDoMe());
    }),
  );
  return chamadas;
}

const imagem = (nome = "foto.png", tipo = "image/png", tamanho = 1024) =>
  new File([new Uint8Array(tamanho)], nome, { type: tipo });

const fotoDoAvatar = () =>
  screen.getByRole("img", { name: /^Foto de / }).querySelector("img");

beforeAll(() => {
  // jsdom não implementa a URL de prévia dos arquivos.
  URL.createObjectURL = vi.fn(() => "blob:previa");
  URL.revokeObjectURL = vi.fn();
});
afterEach(limparSessao);

describe("MinhaContaPage — dados e foto", () => {
  it("mostra os dados do usuário e as iniciais quando não há foto", async () => {
    logarComo(["users.index"]);
    apiDaConta();
    renderPagina();

    expect(await screen.findByRole("heading", { name: "Minha conta" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nome/)).toHaveValue("Super");
    expect(screen.getByLabelText(/^Sobrenome/)).toHaveValue("Admin");
    expect(screen.getByText("super@cakeflow.com.br")).toBeInTheDocument();
    expect(screen.getByText("superadmin")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Foto de Super Admin" })).toHaveTextContent("SA");
    expect(screen.getByRole("button", { name: "Escolher foto" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remover" })).not.toBeInTheDocument();
  });

  it("mostra a prévia e envia a foto em multipart (user[image]) só ao salvar", async () => {
    logarComo(["users.index"]);
    const chamadas = apiDaConta();
    renderPagina();

    await userEvent.upload(await screen.findByLabelText("Escolher foto de perfil"), imagem());

    // Prévia no avatar; nada foi enviado ainda.
    expect(fotoDoAvatar()).toHaveAttribute("src", "blob:previa");
    expect(chamadas.perfil).toHaveLength(0);

    await userEvent.click(screen.getByRole("button", { name: "Salvar foto" }));

    await waitFor(() => expect(chamadas.perfil).toHaveLength(1));
    // Sem Content-Type manual: o boundary vem do navegador/cliente HTTP.
    expect(chamadas.perfil[0].tipo).toMatch(/^multipart\/form-data; boundary=/);
    expect(chamadas.perfil[0].corpo).toContain('name="user[image]"; filename="foto.png"');

    // O /me é recarregado: a foto passa a vir da API (URL relativa completada) e o botão vira "Trocar".
    expect(await screen.findByRole("button", { name: "Trocar foto" })).toBeInTheDocument();
    expect(fotoDoAvatar()).toHaveAttribute("src", `${API}/storage/foto-nova.png`);
  });

  it("cancela a escolha sem enviar", async () => {
    logarComo(["users.index"]);
    const chamadas = apiDaConta();
    renderPagina();

    await userEvent.upload(await screen.findByLabelText("Escolher foto de perfil"), imagem());
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByRole("button", { name: "Escolher foto" })).toBeInTheDocument();
    expect(chamadas.perfil).toHaveLength(0);
  });

  it("recusa arquivo que não é JPG, PNG ou WebP", async () => {
    logarComo(["users.index"]);
    const chamadas = apiDaConta();
    renderPagina();

    const entrada = await screen.findByLabelText("Escolher foto de perfil");
    // `applyAccept: false`: simula quem contorna o filtro do seletor de arquivos.
    await userEvent.setup({ applyAccept: false }).upload(entrada, imagem("doc.pdf", "application/pdf"));

    expect(await screen.findByText("Use uma imagem JPG, PNG ou WebP.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar foto" })).not.toBeInTheDocument();
    expect(chamadas.perfil).toHaveLength(0);
  });

  it("recusa imagem acima de 5 MB", async () => {
    logarComo(["users.index"]);
    apiDaConta();
    renderPagina();

    await userEvent.upload(
      await screen.findByLabelText("Escolher foto de perfil"),
      imagem("grande.png", "image/png", 6 * 1024 * 1024),
    );

    expect(await screen.findByText("A imagem deve ter no máximo 5 MB.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Salvar foto" })).not.toBeInTheDocument();
  });

  it("aceita imagem de até 5 MB", async () => {
    logarComo(["users.index"]);
    apiDaConta();
    renderPagina();

    await userEvent.upload(
      await screen.findByLabelText("Escolher foto de perfil"),
      imagem("limite.png", "image/png", 5 * 1024 * 1024),
    );

    expect(await screen.findByRole("button", { name: "Salvar foto" })).toBeInTheDocument();
  });

  it("remove a foto enviando user[remove_image]=true depois da confirmação", async () => {
    logarComo(["users.index"]);
    const chamadas = apiDaConta({ comFoto: true });
    renderPagina();

    await userEvent.click(await screen.findByRole("button", { name: "Remover" }));
    const confirmacao = await screen.findByRole("alertdialog");
    await userEvent.click(within(confirmacao).getByRole("button", { name: "Remover" }));

    await waitFor(() => expect(chamadas.perfil).toHaveLength(1));
    expect(JSON.parse(chamadas.perfil[0].corpo)).toEqual({ user: { remove_image: "true" } });
    expect(await screen.findByRole("button", { name: "Escolher foto" })).toBeInTheDocument();
  });
});

describe("MinhaContaPage — dados pessoais", () => {
  it("só habilita salvar depois de editar e envia name e last_name", async () => {
    logarComo(["users.index"]);
    const chamadas = apiDaConta();
    renderPagina();

    const salvar = await screen.findByRole("button", { name: "Salvar alterações" });
    expect(salvar).toBeDisabled();

    await userEvent.clear(screen.getByLabelText(/^Nome/));
    await userEvent.type(screen.getByLabelText(/^Nome/), "Maria");
    expect(salvar).toBeEnabled();
    await userEvent.click(salvar);

    await waitFor(() => expect(chamadas.perfil).toHaveLength(1));
    expect(chamadas.perfil[0].tipo).toMatch(/^application\/json/);
    expect(JSON.parse(chamadas.perfil[0].corpo)).toEqual({
      user: { name: "Maria", last_name: "Admin" },
    });
    // Voltou à linha de base: nada a salvar.
    await waitFor(() => expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeDisabled());
  });

  it("exige nome e sobrenome", async () => {
    logarComo(["users.index"]);
    const chamadas = apiDaConta();
    renderPagina();

    await userEvent.clear(await screen.findByLabelText(/^Nome/));
    await userEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(await screen.findByText("Informe o nome.")).toBeInTheDocument();
    expect(chamadas.perfil).toHaveLength(0);
  });
});

describe("MinhaContaPage — alterar senha", () => {
  async function preencherSenha(atual: string, nova: string, confirmacao = nova) {
    await userEvent.type(await screen.findByLabelText(/^Senha atual/), atual);
    await userEvent.type(screen.getByLabelText(/^Nova senha/), nova);
    await userEvent.type(screen.getByLabelText(/^Confirmar nova senha/), confirmacao);
    await userEvent.click(screen.getByRole("button", { name: "Alterar senha" }));
  }

  it("envia PATCH /me/password com os campos em inglês e limpa o formulário", async () => {
    logarComo(["users.index"]);
    const chamadas = apiDaConta();
    renderPagina();

    await preencherSenha("senha-atual", "nova-senha-123");

    await waitFor(() => expect(chamadas.senha).toHaveLength(1));
    expect(chamadas.senha[0]).toEqual({
      user: {
        current_password: "senha-atual",
        password: "nova-senha-123",
        password_confirmation: "nova-senha-123",
      },
    });
    await waitFor(() => expect(screen.getByLabelText(/^Senha atual/)).toHaveValue(""));
  });

  it("valida tamanho mínimo e confirmação antes de enviar", async () => {
    logarComo(["users.index"]);
    const chamadas = apiDaConta();
    renderPagina();

    await preencherSenha("senha-atual", "123", "456");

    expect(await screen.findByText("Use pelo menos 6 caracteres.", { selector: "p[role=alert]" })).toBeInTheDocument();
    expect(screen.getByText("As senhas não conferem.")).toBeInTheDocument();
    expect(chamadas.senha).toHaveLength(0);
  });

  it("mostra 'senha atual incorreta' no campo da senha atual (code invalid_current_password)", async () => {
    logarComo(["users.index"]);
    apiDaConta({
      erroDeSenha: { code: "invalid_current_password", errors: ["Current password is invalid"] },
    });
    renderPagina();

    await preencherSenha("errada", "nova-senha-123");

    expect(await screen.findByText("A senha atual está incorreta.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha atual/)).toHaveAttribute("aria-invalid", "true");
  });

  it("mostra 'diferente da atual' no campo da nova senha (code same_password)", async () => {
    logarComo(["users.index"]);
    apiDaConta({
      erroDeSenha: {
        code: "same_password",
        errors: ["New password cannot be the same as the current password"],
      },
    });
    renderPagina();

    await preencherSenha("mesma-senha", "mesma-senha");

    expect(await screen.findByText("A nova senha deve ser diferente da atual.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nova senha/)).toHaveAttribute("aria-invalid", "true");
  });

  it("mostra a mensagem da API para um erro sem campo próprio (code invalid)", async () => {
    logarComo(["users.index"]);
    apiDaConta({ erroDeSenha: { code: "invalid", errors: ["Password is too short"] } });
    renderPagina();

    await preencherSenha("senha-atual", "nova-senha-123");

    expect(await screen.findByText("Password is too short")).toBeInTheDocument();
  });
});
