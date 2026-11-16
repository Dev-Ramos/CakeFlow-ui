import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import type { DataTableColumn } from "@/ui/components/DataTable";
import { useConfirm } from "@/ui/confirm/useConfirm";
import { toast } from "@/ui/toast/toast";
import { AcoesDaLinha } from "../../shared/components/AcoesDaLinha";
import {
  FiltrosDaLista,
  ListaDoCatalogo,
  SituacaoBadge,
} from "../../shared/components/ListaDoCatalogo";
import { useListagem } from "../../shared/hooks/useListagem";
import { useDeleteFilling, useFillings } from "../hooks/useFillings";
import type { Filling } from "../types/filling";
import { RecheioDialog } from "./RecheioDialog";

/** `undefined` = fechado; `{}` = novo recheio; `{ recheio }` = editar. */
type Dialogo = { recheio?: Filling } | undefined;

/** Aba Recheios: lista paginada com busca no servidor e modal de cadastro. */
export function RecheiosTab() {
  const { can } = useAuth();
  const confirm = useConfirm();
  const listagem = useListagem();
  const recheios = useFillings(listagem.params);
  const remover = useDeleteFilling();
  const [dialogo, setDialogo] = useState<Dialogo>(undefined);

  const linhas = recheios.data?.data ?? [];

  async function excluir(recheio: Filling) {
    const confirmado = await confirm({
      titulo: `Excluir o recheio "${recheio.name}"?`,
      descricao: "Esta ação não pode ser desfeita. Para só tirar o recheio de uso, inative-o.",
      confirmar: "Excluir",
      tom: "danger",
    });
    if (!confirmado) return;
    // Recheio em uso responde 409: a mensagem da API sai no toast global de erro.
    remover.mutate(recheio.id, {
      onSuccess: () => {
        toast.success("Recheio excluído.");
        if (linhas.length === 1 && listagem.page > 1) listagem.setPage(listagem.page - 1);
      },
    });
  }

  const columns: Array<DataTableColumn<Filling>> = [
    {
      key: "name",
      header: "Recheio",
      alinhamento: "esquerda",
      render: (recheio) => <span className="text-label-md text-on-surface">{recheio.name}</span>,
    },
    {
      key: "description",
      header: "Descrição",
      alinhamento: "esquerda",
      prioridade: "media",
      render: (recheio) => recheio.description || <span className="text-tertiary">—</span>,
    },
    {
      key: "priced",
      header: "Preço",
      prioridade: "media",
      render: (recheio) =>
        recheio.priced ? <Badge tone="info">Definido</Badge> : <Badge tone="warning">Sem preço</Badge>,
    },
    { key: "active", header: "Situação", render: (recheio) => <SituacaoBadge active={recheio.active} /> },
    {
      key: "actions",
      header: "Ações",
      alinhamento: "direita",
      render: (recheio) => (
        <AcoesDaLinha
          rotulo={`Ações do recheio ${recheio.name}`}
          onEditar={can("fillings.update") ? () => setDialogo({ recheio }) : undefined}
          onExcluir={can("fillings.delete") ? () => void excluir(recheio) : undefined}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <FiltrosDaLista
          busca={listagem.busca}
          onBusca={listagem.setBusca}
          situacao={listagem.situacao}
          onSituacao={listagem.setSituacao}
          placeholder="Buscar recheio pelo nome…"
        />
        {can("fillings.create") && (
          <Button icon={<Plus size={16} />} onClick={() => setDialogo({})}>
            Novo recheio
          </Button>
        )}
      </div>

      <ListaDoCatalogo
        caption="Recheios"
        columns={columns}
        consulta={recheios}
        getRowKey={(recheio) => recheio.id}
        rotulo="recheios"
        erro="Não foi possível carregar os recheios."
        page={listagem.page}
        onPageChange={listagem.setPage}
        vazio="Nenhum recheio encontrado."
      />

      {dialogo && (
        <RecheioDialog
          key={dialogo.recheio?.id ?? "novo"}
          recheio={dialogo.recheio}
          onClose={() => setDialogo(undefined)}
        />
      )}
    </div>
  );
}
