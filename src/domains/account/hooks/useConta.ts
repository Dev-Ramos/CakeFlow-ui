import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { accountApi } from "../api/accountApi";

/**
 * Mutations da conta. Todas recarregam o usuário (`/me`) no sucesso, para a topbar
 * e a página mostrarem o que o servidor gravou (nome novo, `image_url` nova).
 */
function useMutationDaConta<TVariaveis>(
  mutationFn: (variaveis: TVariaveis) => Promise<void>,
  silenciarToast = false,
) {
  const { atualizarUsuario } = useAuth();
  return useMutation({
    mutationFn,
    onSuccess: atualizarUsuario,
    meta: { silenciarToast },
  });
}

export const useAtualizarPerfil = () => useMutationDaConta(accountApi.atualizarPerfil);
export const useEnviarFoto = () => useMutationDaConta(accountApi.enviarFoto);
export const useRemoverFoto = () => useMutationDaConta(accountApi.removerFoto);
/** A troca de senha mostra o erro no próprio formulário (por `code`), sem toast. */
export const useTrocarSenha = () => useMutationDaConta(accountApi.trocarSenha, true);
