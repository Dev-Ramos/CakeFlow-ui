import { useEffect, useState } from "react";

/**
 * Devolve `value` atrasado em `delay` ms: só muda depois que o valor para de
 * variar. Serve para buscas server-side — o campo atualiza o estado a cada
 * tecla, e a requisição usa o valor com debounce.
 *
 * ```ts
 * const [busca, setBusca] = useState("");
 * const termo = useDebounce(busca);
 * const opcoes = useRoleOptions(termo);
 * <Combobox onSearch={setBusca} … />
 * ```
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
