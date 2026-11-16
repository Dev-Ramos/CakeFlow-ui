import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { Alert } from "@/ui/components/Alert";
import { Badge } from "@/ui/components/Badge";
import { Card } from "@/ui/components/Card";
import { DataTable, type DataTableColumn } from "@/ui/components/DataTable";
import { Input } from "@/ui/components/Input";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { Pagination } from "@/ui/components/Pagination";
import { SelectNativo } from "@/ui/components/SelectNativo";
import { buttonVariants } from "@/ui/design-system/variants";
import { cn } from "@/ui/lib/cn";
import { formatarReais } from "@/ui/lib/dinheiro";
import { useDebounce } from "@/ui/lib/useDebounce";
import { useOrders } from "../hooks/useOrders";
import { formatarDataHora, formatarTelefone } from "../lib/datas";
import { STATUS_DO_PEDIDO, statusInfo } from "../lib/status";
import type { FulfillmentType, OrderListItem, OrderListParams } from "../types/order";

const LIMITE = 10;

export function PedidosPage() {
  const { can } = useAuth();

  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("");
  const [tipo, setTipo] = useState<FulfillmentType | "">("");
  const [soAtrasados, setSoAtrasados] = useState(false);
  const [entregaDe, setEntregaDe] = useState("");
  const [entregaAte, setEntregaAte] = useState("");
  const termo = useDebounce(busca.trim());

  const params: OrderListParams = {
    page,
    limit: LIMITE,
    search: termo || undefined,
    status: status ? [status] : undefined,
    fulfillmentType: tipo || undefined,
    late: soAtrasados || undefined,
    deliveryDateFrom: entregaDe || undefined,
    deliveryDateTo: entregaAte || undefined,
  };
  const pedidos = useOrders(params);
  const meta = pedidos.data?.meta;

  /** Qualquer filtro volta para a primeira página. */
  const filtrar =
    <T,>(definir: (valor: T) => void) =>
    (valor: T) => {
      definir(valor);
      setPage(1);
    };

  const verValores = can("orders.view_prices");

  const colunas: Array<DataTableColumn<OrderListItem>> = [
    {
      key: "code",
      header: "Pedido",
      alinhamento: "esquerda",
      render: (pedido) => (
        <Link to={`/pedidos/${pedido.id}`} className="text-primary underline-offset-2 hover:underline">
          {pedido.code}
        </Link>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      alinhamento: "esquerda",
      render: (pedido) => (
        <div>
          <span className="text-on-surface">{pedido.customerName}</span>
          <span className="block text-body-sm text-tertiary">{formatarTelefone(pedido.customerPhone)}</span>
        </div>
      ),
    },
    {
      key: "delivery",
      header: "Entrega",
      render: (pedido) => (
        <div className="flex flex-col items-center gap-1">
          <span>{formatarDataHora(pedido.deliveryAt)}</span>
          {pedido.late && (
            <Badge tone="danger" size="sm">
              Atrasado
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "type",
      header: "Tipo",
      prioridade: "media",
      render: (pedido) => (pedido.fulfillmentType === "delivery" ? "Entrega" : "Retirada"),
    },
    { key: "items", header: "Bolos", prioridade: "media", render: (pedido) => pedido.itemsCount },
    {
      key: "status",
      header: "Situação",
      render: (pedido) => {
        const { rotulo, tom } = statusInfo(pedido.status);
        return (
          <Badge tone={tom} dot>
            {rotulo}
          </Badge>
        );
      },
    },
    ...(verValores
      ? [
          {
            key: "total",
            header: "Total",
            alinhamento: "direita" as const,
            prioridade: "baixa" as const,
            render: (pedido: OrderListItem) =>
              pedido.totalCents === null ? "—" : formatarReais(pedido.totalCents),
          },
        ]
      : []),
  ];

  return (
    <PageShell>
      <PageHeader
        title="Pedidos"
        description="A entrega mais próxima aparece primeiro."
        actions={
          can("orders.create") && (
            <Link to="/pedidos/novo" className={cn(buttonVariants({ variant: "primary" }))}>
              <Plus size={16} aria-hidden="true" /> Novo pedido
            </Link>
          )
        }
      />

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
            placeholder="Cliente ou código…"
            value={busca}
            onChange={(event) => filtrar(setBusca)(event.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-48">
          <SelectNativo
            aria-label="Situação"
            value={status}
            onChange={(event) => filtrar(setStatus)(event.target.value)}
          >
            <option value="">Todas as situações</option>
            {STATUS_DO_PEDIDO.map((valor) => (
              <option key={valor} value={valor}>
                {statusInfo(valor).rotulo}
              </option>
            ))}
          </SelectNativo>
        </div>
        <div className="w-40">
          <SelectNativo
            aria-label="Tipo"
            value={tipo}
            onChange={(event) => filtrar(setTipo)(event.target.value as FulfillmentType | "")}
          >
            <option value="">Entrega e retirada</option>
            <option value="delivery">Entrega</option>
            <option value="pickup">Retirada</option>
          </SelectNativo>
        </div>
        <div className="w-40">
          <Input
            type="date"
            aria-label="Entrega a partir de"
            value={entregaDe}
            onChange={(event) => filtrar(setEntregaDe)(event.target.value)}
          />
        </div>
        <div className="w-40">
          <Input
            type="date"
            aria-label="Entrega até"
            value={entregaAte}
            onChange={(event) => filtrar(setEntregaAte)(event.target.value)}
          />
        </div>
        <label className="flex h-[42px] items-center gap-2 text-body-md text-on-surface">
          <input
            type="checkbox"
            checked={soAtrasados}
            onChange={(event) => filtrar(setSoAtrasados)(event.target.checked)}
          />
          Só atrasados
        </label>
      </div>

      {pedidos.isError && (
        <Alert tone="danger" title="Não foi possível carregar os pedidos.">
          {pedidos.error.message}{" "}
          <button type="button" className="underline" onClick={() => void pedidos.refetch()}>
            Tentar novamente
          </button>
        </Alert>
      )}

      <Card padded={false} className="overflow-hidden">
        <DataTable
          caption="Pedidos"
          columns={colunas}
          rows={pedidos.data?.data ?? []}
          getRowKey={(pedido) => pedido.id}
          loading={pedidos.isLoading}
          emptyMessage="Nenhum pedido encontrado."
          colunasPorPrioridade
        />
        {meta && (
          <Pagination
            page={page}
            limit={meta.limit}
            count={meta.count}
            pages={meta.pages}
            rotulo="pedidos"
            onPageChange={setPage}
          />
        )}
      </Card>
    </PageShell>
  );
}
