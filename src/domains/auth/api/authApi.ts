import { env } from "@/config/env";
import { api } from "@/services/http/api";
import { ApiError } from "@/services/http/errors";
import type {
  AuthPayload,
  DefinirSenhaDTO,
  LoginDTO,
  LoginResultado,
  Usuario,
} from "../types/auth";

/** Header da resposta de login que carrega o token (exige Access-Control-Expose-Headers no backend). */
const HEADER_DO_TOKEN = "authorization";

/** A API pode devolver a URL da foto relativa (`/rails/...`): completa com o endereço dela. */
function urlAbsoluta(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("/") ? `${env.VITE_API_URL.replace(/\/$/, "")}${url}` : url;
}

function paraUsuario({ user, roles, permissions }: AuthPayload): Usuario {
  return {
    id: user.id,
    name: user.name,
    lastName: user.last_name,
    email: user.email,
    avatarUrl: urlAbsoluta(user.image_url),
    roles,
    permissions,
  };
}

/** Aceita o token puro ou no formato `Bearer <token>`. */
function extrairToken(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const token = valor.replace(/^Bearer\s+/i, "").trim();
  return token || null;
}

export const authApi = {
  login: async (payload: LoginDTO): Promise<LoginResultado> => {
    // 401 aqui é "credenciais inválidas", não sessão expirada.
    const resposta = await api.post<AuthPayload>("/login", payload, {
      skipUnauthorizedHandler: true,
    });

    const accessToken = extrairToken(resposta.headers[HEADER_DO_TOKEN]);
    if (!accessToken) {
      throw new ApiError("Não foi possível concluir o login: a API não devolveu o token de acesso.", {
        status: null,
      });
    }

    return { accessToken, usuario: paraUsuario(resposta.data) };
  },

  me: async (): Promise<Usuario> => {
    // Quem chama decide o que fazer em caso de falha (ex.: revalidar a sessão).
    const { data } = await api.get<AuthPayload>("/me", { skipUnauthorizedHandler: true });
    return paraUsuario(data);
  },

  /**
   * `PUT /password`. O token do link NÃO é validado antes: é a API quem o valida,
   * ao receber a senha. Sem sessão, então um 401 aqui não deve derrubar nada.
   */
  definirSenha: async ({ token, password, passwordConfirmation }: DefinirSenhaDTO): Promise<void> => {
    await api.put(
      "/password",
      {
        user: {
          reset_password_token: token,
          password,
          password_confirmation: passwordConfirmation,
        },
      },
      { skipUnauthorizedHandler: true },
    );
  },
};
