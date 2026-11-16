import { api } from "@/services/http/api";

/**
 * Perfil do próprio usuário (contrato: `docs/API-perfil.md` da API).
 *
 * - `PATCH /me` edita `user[name]`, `user[last_name]` e a foto (`user[image]`, arquivo;
 *   `user[remove_image]="true"` apaga). Com arquivo, o corpo é `multipart/form-data`;
 *   sem arquivo, pode ser JSON. Não se define o `Content-Type` à mão: o boundary é do navegador.
 * - `PATCH /me/password` troca a senha.
 * Todas devolvem o mesmo payload do `GET /me`, mas o front recarrega o `/me` depois de cada uma.
 */
export const accountApi = {
  atualizarPerfil: async ({ name, lastName }: { name: string; lastName: string }): Promise<void> => {
    await api.patch("/me", { user: { name, last_name: lastName } });
  },

  enviarFoto: async (arquivo: File): Promise<void> => {
    const corpo = new FormData();
    corpo.append("user[image]", arquivo);
    await api.patch("/me", corpo);
  },

  removerFoto: async (): Promise<void> => {
    await api.patch("/me", { user: { remove_image: "true" } });
  },

  trocarSenha: async (dados: {
    currentPassword: string;
    password: string;
    passwordConfirmation: string;
  }): Promise<void> => {
    await api.patch("/me/password", {
      user: {
        current_password: dados.currentPassword,
        password: dados.password,
        password_confirmation: dados.passwordConfirmation,
      },
    });
  },
};
