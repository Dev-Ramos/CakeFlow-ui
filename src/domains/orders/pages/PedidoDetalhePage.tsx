import { useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { Alert } from "@/ui/components/Alert";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { Card } from "@/ui/components/Card";
import { LoadingState } from "@/ui/components/LoadingState";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { ResumoDeValores } from "@/ui/components/ResumoDeValores";
import { buttonVariants } from "@/ui/design-system/variants";
import { cn } from "@/ui/lib/cn";
import { CancelamentoDialog } from "../components/CancelamentoDialog";
import { useOrder, useOrderEvents } from "../hooks/useOrders";
import { formatarData, formatarDataHora, formatarTelefone } from "../lib/datas";
import { linhasDoPricing } from "../lib/linhasDoPricing";
import { podeCancelar, STATUS_NAO_EDITAVEIS, statusInfo } from "../lib/status";
import { TIPOS_DE_DECORACAO } from "../schemas/orderSchema";
import type { Order, OrderItem } from "../types/order";

const LISTA = "/pedidos";

const ROTULO_DO_EVENTO: Record<string, string> = {
  created: "Pedido criado",
  updated: "Pedido alterado",
  status_changed: "Situação alterada",
  cancellation_requested: "Cancelamento solicitado",
  cancellation_approved: "Cancelamento aprovado",
  cancellation_denied: "Cancelamento negado",
  canceled: "Pedido cancelado",
  handed_over: "Entrega registrada",
};

const nomeDaDecoracao = (valor: string) => TIPOS_DE_DECORACAO.find((t) => t.value === valor)?.label ?? valor;

function StatusBadge({ status }: { status: string }) {
  const { rotulo, tom } = statusInfo(status);
  return (
    <Badge tone={tom} dot>
      {rotulo}
    </Badge>
  );
}

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-label-md text-tertiary">{rotulo}</dt>
      <dd className="text-body-md text-on-surface">{children || "—"}</dd>
    </div>
  );
}

function CartaoDoBolo({ bolo }: { bolo: OrderItem }) {
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-headline-sm text-on-surface">
          {bolo.position}. {bolo.title}
        </h3>
        <StatusBadge status={bolo.status} />
      </div>
      <dl className="grid gap-3 sm:grid-cols-3">
        <Dado rotulo="Modelo">{bolo.cakeType?.name ?? "Personalizado"}</Dado>
        <Dado rotulo="Cores">{bolo.colors}</Dado>
        <Dado rotulo="Dedicatória">{bolo.dedicationText}</Dado>
        <Dado rotulo="Blindagem">{bolo.hasReinforcement ? "Sim" : "Não"}</Dado>
        <Dado rotulo="Decoração">
          {bolo.hasDecoration ? bolo.decorationKinds.map(nomeDaDecoracao).join(", ") || "Sim" : "Não"}
        </Dado>
        <Dado rotulo="Detalhes da decoração">{bolo.decorationDetails}</Dado>
        <Dado rotulo="Alergias">{bolo.allergiesNotes}</Dado>
        <Dado rotulo="Observações">{bolo.notes}</Dado>
      </dl>
      {(bolo.referenceImageUrl || bolo.decorationImageUrls.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {bolo.referenceImageUrl && (
            <img
              src={bolo.referenceImageUrl}
              alt={`Referência de ${bolo.title}`}
              className="h-24 w-24 rounded-lg border border-outline-variant object-cover"
            />
          )}
          {bolo.decorationImageUrls.map((url) => (
            <img
              key={url}
              src={url}
              alt={`Decoração de ${bolo.title}`}
              className="h-24 w-24 rounded-lg border border-outline-variant object-cover"
            />
          ))}
        </div>
      )}
      <ol className="space-y-2">
        {bolo.tiers.map((andar) => (
          <li key={andar.id} className="rounded-lg border border-outline-variant p-3 text-body-md">
            <span className="text-on-surface">
              Andar {andar.level}: {andar.panSpec.name} ({andar.panSpec.dimensionsLabel}) com{" "}
              {andar.batterType.name}, {andar.layersCount} {andar.layersCount === 1 ? "camada" : "camadas"}
            </span>
            <span className="block text-body-sm text-tertiary">
              Recheios: {andar.fillings.map((r) => r.name).join(", ") || "—"}
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function LinhaDoTempo({ pedidoId }: { pedidoId: number }) {
  const eventos = useOrderEvents(pedidoId);
  return (
    <Card className="space-y-3">
      <h2 className="text-headline-sm text-on-surface">Linha do tempo</h2>
      {eventos.isLoading && <LoadingState title="Carregando a linha do tempo" />}
      {eventos.isError && (
        <Alert tone="danger" title="Não foi possível carregar a linha do tempo.">
          {eventos.error.message}
        </Alert>
      )}
      <ol className="space-y-3">
        {eventos.data?.map((evento) => (
          <li key={evento.id} className="border-l-2 border-outline-variant pl-3">
            <p className="text-body-md text-on-surface">
              {ROTULO_DO_EVENTO[evento.kind] ?? evento.kind}
              {evento.toStatus && <> — {statusInfo(evento.toStatus).rotulo}</>}
            </p>
            <p className="text-body-sm text-tertiary">
              {formatarDataHora(evento.createdAt)}
              {evento.userName && <> · {evento.userName}</>}
            </p>
            {evento.note && <p className="text-body-sm text-on-surface-variant">{evento.note}</p>}
          </li>
        ))}
      </ol>
    </Card>
  );
}

function Detalhe({ pedido }: { pedido: Order }) {
  const { can } = useAuth();
  const [cancelando, setCancelando] = useState<"direto" | "solicitar">();
  const editavel = !STATUS_NAO_EDITAVEIS.includes(pedido.status);
  const cancelavel = podeCancelar(pedido.status);
  const entrega = pedido.fulfillmentType === "delivery";
  const { address } = pedido;

  return (
    <PageShell>
      <PageHeader
        title={pedido.code}
        description={`${pedido.customerName} · ${pedido.itemsCount} ${pedido.itemsCount === 1 ? "bolo" : "bolos"}`}
        actions={
          <>
            <StatusBadge status={pedido.status} />
            {pedido.late && <Badge tone="danger">Atrasado</Badge>}
            {can("orders.update") && editavel && (
              <Link
                to={`/pedidos/${pedido.id}/editar`}
                className={cn(buttonVariants({ variant: "secondary" }))}
              >
                Editar
              </Link>
            )}
            {cancelavel && can("orders.request_cancel") && (
              <Button variant="neutral" onClick={() => setCancelando("solicitar")}>
                Solicitar cancelamento
              </Button>
            )}
            {cancelavel && can("orders.cancel") && (
              <Button variant="danger" onClick={() => setCancelando("direto")}>
                Cancelar pedido
              </Button>
            )}
          </>
        }
      />

      {pedido.status === "cancelation_in_progress" && (
        <Alert tone="warning" title="Cancelamento em análise.">
          A administração ainda vai decidir. Enquanto isso o pedido não pode ser alterado.
        </Alert>
      )}
      {pedido.originalOrder && (
        <Alert tone="info">
          Reaproveita o pedido cancelado{" "}
          <Link to={`/pedidos/${pedido.originalOrder.id}`} className="underline">
            {pedido.originalOrder.code}
          </Link>
          .
        </Alert>
      )}

      <Card className="space-y-4">
        <h2 className="text-headline-sm text-on-surface">Cliente e entrega</h2>
        <dl className="grid gap-3 sm:grid-cols-3">
          <Dado rotulo="Cliente">{pedido.customerName}</Dado>
          <Dado rotulo="Telefone">{formatarTelefone(pedido.customerPhone)}</Dado>
          <Dado rotulo="Tipo">{entrega ? "Entrega" : "Retirada"}</Dado>
          <Dado rotulo="Produção">{formatarData(pedido.productionDate)}</Dado>
          <Dado rotulo={entrega ? "Entrega" : "Retirada"}>{formatarDataHora(pedido.deliveryAt)}</Dado>
          <Dado rotulo="Criado por">{pedido.createdBy?.name}</Dado>
          {entrega && (
            <>
              <Dado rotulo="Endereço">
                {[`${address.street}, ${address.number}`, address.complement].filter(Boolean).join(" · ")}
              </Dado>
              <Dado rotulo="Bairro e cidade">{`${address.neighborhood} — ${address.city}`}</Dado>
              <Dado rotulo="Ponto de referência">{address.reference}</Dado>
            </>
          )}
        </dl>
        {pedido.notes && <Dado rotulo="Observações">{pedido.notes}</Dado>}
      </Card>

      {pedido.items.map((bolo) => (
        <CartaoDoBolo key={bolo.id} bolo={bolo} />
      ))}

      {pedido.pricing && (
        <Card className="space-y-3">
          <h2 className="text-headline-sm text-on-surface">Valores</h2>
          <ResumoDeValores linhas={linhasDoPricing(pedido.pricing)} />
          <p className="text-body-sm text-tertiary">
            Valores congelados na criação ou na última alteração do pedido.
          </p>
        </Card>
      )}

      {can("orders.read") && <LinhaDoTempo pedidoId={pedido.id} />}

      <Link to={LISTA} className={cn(buttonVariants({ variant: "neutral" }), "self-start")}>
        Voltar para os pedidos
      </Link>

      {cancelando && (
        <CancelamentoDialog
          orderId={pedido.id}
          orderCode={pedido.code}
          modo={cancelando}
          onClose={() => setCancelando(undefined)}
        />
      )}
    </PageShell>
  );
}

export function PedidoDetalhePage() {
  const { id } = useParams();
  const pedido = useOrder(Number(id));

  if (pedido.isPending) return <LoadingState title="Carregando o pedido" className="py-16" />;
  if (pedido.isError) {
    return (
      <PageShell>
        <Alert tone="danger" title="Não foi possível carregar o pedido.">
          {pedido.error.message}
        </Alert>
        <Link to={LISTA} className={cn(buttonVariants({ variant: "neutral" }))}>
          Voltar para os pedidos
        </Link>
      </PageShell>
    );
  }
  return <Detalhe pedido={pedido.data} />;
}
