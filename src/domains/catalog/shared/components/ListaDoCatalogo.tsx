import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { Search } from "lucide-react";
import type { Paginated } from "@/services/http/pagination";
import { Alert } from "@/ui/components/Alert";
import { Badge } from "@/ui/components/Badge";
import { Card } from "@/ui/components/Card";
import { DataTable, type DataTableColumn } from "@/ui/components/DataTable";
import { Input } from "@/ui/components/Input";
import { Pagination } from "@/ui/components/Pagination";
import { SelectNativo } from "@/ui/components/SelectNativo";
import type { FiltroDeSituacao } from "../hooks/useListagem";

export function SituacaoBadge({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? "success" : "neutral"} dot>
      {active ? "Ativo" : "Inativo"}
    </Badge>
  );
}

export interface FiltrosDaListaProps {
  busca: string;
  onBusca: (valor: string) => void;
  situacao?: FiltroDeSituacao;
  onSituacao?: (valor: FiltroDeSituacao) => void;
  placeholder?: string;
  /** Filtros extras da tela (ex.: "exige decoração"). */
  children?: ReactNode;
}

/** Busca por nome (no servidor), filtro de situação e filtros extras. */
export function FiltrosDaLista({
  busca,
  onBusca,
  situacao,
  onSituacao,
  placeholder = "Buscar pelo nome…",
  children,
}: FiltrosDaListaProps) {
  return (
    <div role="search" className="flex flex-wrap items-end gap-3">
      <div className="relative w-full min-w-48 max-w-sm flex-1">
        <Search
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary"
        />
        <Input
          type="search"
          aria-label="Buscar"
          placeholder={placeholder}
          value={busca}
          onChange={(event) => onBusca(event.target.value)}
          className="pl-9"
        />
      </div>
      {situacao !== undefined && onSituacao && (
        <div className="w-40">
          <SelectNativo
            aria-label="Situação"
            value={situacao}
            onChange={(event) => onSituacao(event.target.value as FiltroDeSituacao)}
          >
            <option value="todos">Todas as situações</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </SelectNativo>
        </div>
      )}
      {children}
    </div>
  );
}

export interface ListaDoCatalogoProps<T> {
  caption: string;
  columns: Array<DataTableColumn<T>>;
  consulta: UseQueryResult<Paginated<T>>;
  getRowKey: (item: T) => string | number;
  /** Nome dos itens no rodapé ("Mostrando 1 a 10 de N formas"). */
  rotulo: string;
  /** Título do alerta de erro (ex.: "Não foi possível carregar as formas."). */
  erro: string;
  page: number;
  onPageChange: (page: number) => void;
  vazio: string;
}

/** Tabela paginada pela API, com alerta de erro e rodapé de paginação. */
export function ListaDoCatalogo<T>({
  caption,
  columns,
  consulta,
  getRowKey,
  rotulo,
  erro,
  page,
  onPageChange,
  vazio,
}: ListaDoCatalogoProps<T>) {
  const meta = consulta.data?.meta;
  return (
    <>
      {consulta.isError && (
        <Alert tone="danger" title={erro}>
          {consulta.error.message}{" "}
          <button type="button" className="underline" onClick={() => void consulta.refetch()}>
            Tentar novamente
          </button>
        </Alert>
      )}
      <Card padded={false} className="overflow-hidden">
        <DataTable
          caption={caption}
          columns={columns}
          rows={consulta.data?.data ?? []}
          getRowKey={getRowKey}
          loading={consulta.isLoading}
          emptyMessage={vazio}
          colunasPorPrioridade
        />
        {meta && (
          <Pagination
            page={page}
            limit={meta.limit}
            count={meta.count}
            pages={meta.pages}
            rotulo={rotulo}
            onPageChange={onPageChange}
          />
        )}
      </Card>
    </>
  );
}
