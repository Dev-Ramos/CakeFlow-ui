import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/authApi";

/** Define a senha (convite ou troca obrigatória) com o erro exibido na própria tela. */
export function useDefinirSenha() {
  return useMutation({
    mutationFn: authApi.definirSenha,
    meta: { silenciarToast: true },
  });
}
