const CHAVE = "cakeflow.accessToken";

/**
 * Armazenamento do access token no localStorage (sobrevive ao F5 e é
 * compartilhado entre abas).
 *
 * Atenção: localStorage é acessível a scripts da página (risco em caso de XSS).
 * Se o backend passar a oferecer cookie HttpOnly, só este arquivo muda.
 */
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(CHAVE);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      localStorage.setItem(CHAVE, token);
    } catch {
      // Sem armazenamento disponível: a sessão vive só em memória.
    }
  },
  clear(): void {
    try {
      localStorage.removeItem(CHAVE);
    } catch {
      // Nada a limpar.
    }
  },
  /**
   * Avisa quando o token muda em OUTRA aba (o evento `storage` não dispara na
   * aba que alterou). Serve para encerrar a sessão em todas as abas no logout.
   */
  subscribe(callback: (token: string | null) => void): () => void {
    const aoMudar = (evento: StorageEvent) => {
      // `key === null` é `localStorage.clear()`.
      if (evento.key === CHAVE || evento.key === null) callback(evento.newValue);
    };
    window.addEventListener("storage", aoMudar);
    return () => window.removeEventListener("storage", aoMudar);
  },
};
