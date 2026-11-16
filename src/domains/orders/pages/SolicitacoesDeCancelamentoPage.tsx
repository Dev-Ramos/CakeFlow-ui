import { useState } from "react";
import { Link } from "react-router";
import { Alert } from "@/ui/components/Alert";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { Card } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { LoadingState } from "@/ui/components/LoadingState";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { Pagination } from "@/ui/components/Pagination";
import { SelectNativo } from "@/ui/components/SelectNativo";
import { useConfirm } from "@/ui/confirm/useConfirm";
import { toast } from "@/ui/toast/toast";
import { useApproveCancellation, useCancellationRequests, useDenyCancellation } from "../hooks/useOrders";
import { formatarDataHora } from "../lib/datas";
import { statusInfo } from "../lib/status";
import type { CancellationRequest, CancellationStatus } from "../types/order";

const LIMITE = 10;

const SITUACOES: Array<{ value: CancellationStatus; label: string }> = [
  { value: "pending", label: "Pendentes" },
  { value: "approved", label: "Aprovadas" },
  { value: "denied", label: "Negadas" },
];

const TOM: Record<CancellationStatus, "warning" | "success" | "neutral"> = {
  pending: "warning",
  approved: "success",
  denied: "neutral",
};

/** S-24: o Super Admin aprova ou nega os pedidos de cancelamento feitos pelos atendentes. */
export function SolicitacoesDeCancelamentoPage() {
  const confirm = useConfirm();
  const aprovar = useApproveCancellation();
  const negar = useDenyCancellation();

  const [page, setPage] = useState(1);
  const [situacao, setSituacao] = useState<CancellationStatus>("pending");
  const solicitacoes = useCancellationRequests({ page, limit: LIMITE, status: situacao });
  const meta = solicitacoes.data?.meta;

  async function decidir(solicitacao: CancellationRequest, decisao: "approve" | "deny") {
    const aprovando = decisao === "approve";
    const confirmado = await confirm({
      titulo: aprovando
        ? `Cancelar ${solicitacao.order.code}?`
        : `Negar o cancelamento de ${solicitacao.order.code}?`,
      descricao: aprovando
        ? "O pedido e os bolos serão cancelados. Esta ação não pode ser desfeita."
        : "O pedido volta ao que era antes da solicitação.",
      confirmar: aprovando ? "Aprovar" : "Negar",
      tom: aprovando ? "danger" : undefined,
    });
    if (!confirmado) return;
    (aprovando ? aprovar : negar).mutate(solicitacao.id, {
      onSuccess: () => toast.success(aprovando ? "Cancelamento aprovado." : "Cancelamento negado."),
    });
  }

  return (
    <PageShell>
      <PageHeader
        title="Solicitações de cancelamento"
        description="Pedidos que os atendentes pediram para cancelar."
      />

      <div className="w-48">
        <SelectNativo
          aria-label="Situação"
          value={situacao}
          onChange={(event) => {
            setSituacao(event.target.value as CancellationStatus);
            setPage(1);
          }}
        >
          {SITUACOES.map((opcao) => (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label}
            </option>
          ))}
        </SelectNativo>
      </div>

      {solicitacoes.isError && (
        <Alert tone="danger" title="Não foi possível carregar as solicitações.">
          {solicitacoes.error.message}
        </Alert>
      )}
      {solicitacoes.isLoading && <LoadingState title="Carregando as solicitações" />}
      {solicitacoes.data?.data.length === 0 && (
        <Card padded={false}>
          <EmptyState title="Nenhuma solicitação nesta situação." />
        </Card>
      )}

      {solicitacoes.data?.data.map((solicitacao) => (
        <Card key={solicitacao.id} className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-headline-sm text-on-surface">
              <Link to={`/pedidos/${solicitacao.order.id}`} className="text-primary hover:underline">
                {solicitacao.order.code}
              </Link>{" "}
              · {solicitacao.order.customerName}
            </h2>
            <Badge tone={TOM[solicitacao.status]} dot>
              {SITUACOES.find((s) => s.value === solicitacao.status)?.label.replace(/s$/, "")}
            </Badge>
          </div>
          <p className="text-body-sm text-tertiary">
            Entrega em {formatarDataHora(solicitacao.order.deliveryAt)} · pedido por{" "}
            {solicitacao.createdByName ?? "—"} em {formatarDataHora(solicitacao.createdAt)}
          </p>
          <p className="text-body-md text-on-surface">{solicitacao.description}</p>
          <ul className="space-y-1 text-body-sm text-on-surface-variant">
            {solicitacao.items.map((bolo) => (
              <li key={bolo.id}>
                <strong className="font-medium text-on-surface">{bolo.title}</strong> (
                {statusInfo(bolo.status).rotulo}): {bolo.outcome}
              </li>
            ))}
          </ul>
          {solicitacao.status === "pending" && (
            <div className="flex justify-end gap-2">
              <Button variant="neutral" onClick={() => void decidir(solicitacao, "deny")}>
                Negar
              </Button>
              <Button variant="danger" onClick={() => void decidir(solicitacao, "approve")}>
                Aprovar cancelamento
              </Button>
            </div>
          )}
        </Card>
      ))}

      {meta && (
        <Pagination
          page={page}
          limit={meta.limit}
          count={meta.count}
          pages={meta.pages}
          rotulo="solicitações"
          onPageChange={setPage}
        />
      )}
    </PageShell>
  );
}
