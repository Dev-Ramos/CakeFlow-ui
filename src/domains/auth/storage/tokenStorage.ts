const CHAVE = "cakeflow.accessToken";

/**
 * Armazenamento do access token.
 *
 * PROVISÓRIO: sessionStorage (some ao fechar a aba) até o contrato de
 * autenticação definir refresh token / cookie HttpOnly — alternativa mais
 * segura, pois sessionStorage é acessível a scripts. Trocar só este arquivo.
 */
export const tokenStorage = {
  get(): string | null {
    try {
      return sessionStorage.getItem(CHAVE);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      sessionStorage.setItem(CHAVE, token);
    } catch {
      // Sem armazenamento disponível: a sessão vive só em memória.
    }
  },
  clear(): void {
    try {
      sessionStorage.removeItem(CHAVE);
    } catch {
      // Nada a limpar.
    }
  },
};
