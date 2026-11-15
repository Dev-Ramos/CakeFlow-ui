import { useMutation } from "@tanstack/react-query";
import { useAuth } from "./useAuth";

/** Login com o erro exibido na própria tela (sem toast global). */
export function useLogin() {
  const { login } = useAuth();
  return useMutation({
    mutationFn: login,
    meta: { silenciarToast: true },
  });
}
