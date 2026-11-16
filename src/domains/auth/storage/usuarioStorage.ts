import { usuarioSchema } from "../schemas/usuarioSchema";
import type { Usuario } from "../types/auth";

const CHAVE = "cakeflow.user";

/**
 * Cópia do usuário (dados e permissões) no localStorage, só para a aplicação
 * sobreviver a um F5 sem tela de carregamento. A fonte de verdade é a API: a
 * cada carregamento o `AuthProvider` revalida pelo `GET /me` e sobrescreve esta cópia.
 */
export const usuarioStorage = {
  get(): Usuario | null {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return null;
      const lido = usuarioSchema.safeParse(JSON.parse(bruto));
      return lido.success ? lido.data : null;
    } catch {
      return null;
    }
  },
  set(usuario: Usuario): void {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(usuario));
    } catch {
      // Sem armazenamento disponível: segue só em memória.
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      // Nada a limpar.
    }
  },
};
