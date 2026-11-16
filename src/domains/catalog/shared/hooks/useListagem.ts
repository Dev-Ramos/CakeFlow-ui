import { useState } from "react";
import { useDebounce } from "@/ui/lib/useDebounce";
import type { ListParams } from "../types/catalog";

export type FiltroDeSituacao = "todos" | "ativos" | "inativos";

const LIMITE = 10;

/**
 * Estado das listas do catálogo: página, busca (com debounce, feita no servidor via
 * `search`) e filtro de situação (`active`). Qualquer filtro volta para a página 1.
 */
export function useListagem() {
  const [page, setPage] = useState(1);
  const [busca, setBuscaBruta] = useState("");
  const [situacao, setSituacaoBruta] = useState<FiltroDeSituacao>("todos");
  const termo = useDebounce(busca.trim());

  const params: ListParams = {
    page,
    limit: LIMITE,
    search: termo || undefined,
    active: situacao === "todos" ? undefined : situacao === "ativos",
  };

  return {
    params,
    page,
    setPage,
    busca,
    setBusca: (valor: string) => {
      setBuscaBruta(valor);
      setPage(1);
    },
    situacao,
    setSituacao: (valor: FiltroDeSituacao) => {
      setSituacaoBruta(valor);
      setPage(1);
    },
  };
}
