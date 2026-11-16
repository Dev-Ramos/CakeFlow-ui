import type { UseQueryResult } from "@tanstack/react-query";
import type { Paginated } from "@/services/http/pagination";
import { Alert } from "@/ui/components/Alert";
import { Badge } from "@/ui/components/Badge";
import { Card } from "@/ui/components/Card";
import { DataTable, type DataTableColumn } from "@/ui/components/DataTable";
import { Input } from "@/ui/components/Input";
import { Pagination } from "@/ui/components/Pagination";
import { centavosParaTexto } from "@/ui/lib/dinheiro";
import type { PriceRow } from "../types/pricing";

interface Props {
  titulo: string;
  descricao: string;
  /** Cabeçalho da coluna do valor ("Valor da camada", "Acréscimo"). */
  rotuloDoValor: string;
  /** Nome dos itens no rodapé e nos rótulos dos campos ("forma", "recheio"). */
  item: string;
  consulta: UseQueryResult<Paginated<PriceRow>>;
  /** Valores digitados e ainda não salvos, por id da linha. */
  edicoes: Record<number, string>;
  /** Erro devolvido pela API para a linha que falhou ao salvar. */
  erros: Record<number, string>;
  onEditar: (linha: PriceRow, texto: string) => void;
  somenteLeitura: boolean;
  page: number;
  onPage: (page: number) => void;
}

/** Cartão com a lista de preços (forma ou recheio): um campo de valor por linha. */
export function TabelaDePrecos({
  titulo,
  descricao,
  rotuloDoValor,
  item,
  consulta,
  edicoes,
  erros,
  onEditar,
  somenteLeitura,
  page,
  onPage,
}: Props) {
  const meta = consulta.data?.meta;

  const colunas: Array<DataTableColumn<PriceRow>> = [
    {
      key: "name",
      header: "Nome",
      render: (linha) => (
        <div>
          <span className="text-on-surface">{linha.name}</span>
          {linha.detail && <span className="block text-body-sm text-tertiary">{linha.detail}</span>}
        </div>
      ),
      alinhamento: "esquerda",
    },
    {
      key: "active",
      header: "Situação",
      prioridade: "media",
      render: (linha) => (
        <Badge tone={linha.active ? "success" : "neutral"} dot>
          {linha.active ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      key: "price",
      header: rotuloDoValor,
      render: (linha) => {
        const texto = edicoes[linha.id] ?? centavosParaTexto(linha.priceCents);
        return (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="text-body-md text-tertiary">
                R$
              </span>
              <Input
                aria-label={`${rotuloDoValor} de ${item} ${linha.name}`}
                aria-invalid={erros[linha.id] ? true : undefined}
                inputMode="decimal"
                placeholder={linha.priceCents === null ? "Sem preço" : undefined}
                value={texto}
                disabled={somenteLeitura}
                onChange={(event) => onEditar(linha, event.target.value)}
                className="w-28 text-right"
              />
            </div>
            {erros[linha.id] && <span className="text-body-sm text-danger-text">{erros[linha.id]}</span>}
          </div>
        );
      },
    },
    {
      key: "updated",
      header: "Alterado por",
      prioridade: "baixa",
      render: (linha) => linha.updatedByName ?? "—",
    },
  ];

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="space-y-1 p-5 pb-3">
        <h2 className="text-headline-sm text-on-surface">{titulo}</h2>
        <p className="text-body-md text-tertiary">{descricao}</p>
      </div>
      {consulta.isError && (
        <Alert tone="danger" title={`Não foi possível carregar as ${item}s.`} className="mx-5 mb-3">
          {consulta.error.message}
        </Alert>
      )}
      <DataTable
        caption={titulo}
        columns={colunas}
        rows={consulta.data?.data ?? []}
        getRowKey={(linha) => linha.id}
        loading={consulta.isLoading}
        emptyMessage={`Nenhum ${item} cadastrado.`}
        colunasPorPrioridade
      />
      {meta && (
        <Pagination
          page={page}
          limit={meta.limit}
          count={meta.count}
          pages={meta.pages}
          rotulo={`${item}s`}
          onPageChange={onPage}
        />
      )}
    </Card>
  );
}
