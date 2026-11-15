import { useCallback, useState } from "react";

/**
 * Borda inferior da área visível que pode recortar `elemento`: o primeiro
 * ancestral que realmente rola (o `Dialog`, um painel com `overflow-y-auto`).
 * Fora dele nada corta o popup, então ele pode sobrepor o conteúdo seguinte.
 *
 * `overflowX !== 'hidden'` descarta o falso-positivo de cards: por regra do CSS,
 * `overflow-x: hidden` sem mexer no eixo Y faz o browser computar `overflow-y`
 * como `auto`, mesmo sem nada rolando ali.
 */
export function limiteInferiorVisivel(elemento: HTMLElement): number {
  let atual = elemento.parentElement;

  while (atual) {
    const { overflowX, overflowY } = getComputedStyle(atual);
    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      overflowX !== "hidden"
    ) {
      return atual.getBoundingClientRect().bottom;
    }
    atual = atual.parentElement;
  }

  return Infinity;
}

/**
 * Mede, ao montar o popup, quanto dele fica para fora do ancestral que rola de
 * verdade — e é só isso que o chamador deve reservar no fluxo (um espaçador
 * `aria-hidden`). Reservar a altura cheia empurraria o layout sem necessidade.
 */
export function usePopupOverflow() {
  const [alturaExcedente, setAlturaExcedente] = useState(0);

  const medirPopup = useCallback((elemento: HTMLElement | null) => {
    if (!elemento) {
      setAlturaExcedente(0);
      return;
    }

    const limite = limiteInferiorVisivel(elemento);
    const excedente = elemento.getBoundingClientRect().bottom - limite;
    setAlturaExcedente(excedente > 0 ? excedente : 0);
  }, []);

  const resetarExcedente = useCallback(() => setAlturaExcedente(0), []);

  return { alturaExcedente, medirPopup, resetarExcedente } as const;
}
