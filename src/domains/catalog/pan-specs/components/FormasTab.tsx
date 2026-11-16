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
import { useDeletePanSpec, usePanSpecs } from "../hooks/usePanSpecs";
import type { PanSpec } from "../types/panSpec";
import { FormaDialog } from "./FormaDialog";

/** `undefined` = fechado; `{}` = nova forma; `{ forma }` = editar. */
type Dialogo = { forma?: PanSpec } | undefined;

/** Aba Formas: lista paginada com busca no servidor e modal de cadastro. */
export function FormasTab() {
  const { can } = useAuth();
  const confirm = useConfirm();
  const listagem = useListagem();
  const formas = usePanSpecs(listagem.params);
  const remover = useDeletePanSpec();
  const [dialogo, setDialogo] = useState<Dialogo>(undefined);

  const linhas = formas.data?.data ?? [];

  async function excluir(forma: PanSpec) {
    const confirmado = await confirm({
      titulo: `Excluir a forma "${forma.name}"?`,
      descricao: "Esta ação não pode ser desfeita. Para só tirar a forma de uso, inative-a.",
      confirmar: "Excluir",
      tom: "danger",
    });
    if (!confirmado) return;
    // Forma em uso responde 409: a mensagem da API sai no toast global de erro.
    remover.mutate(forma.id, {
      onSuccess: () => {
        toast.success("Forma excluída.");
        if (linhas.length === 1 && listagem.page > 1) listagem.setPage(listagem.page - 1);
      },
    });
  }

  const columns: Array<DataTableColumn<PanSpec>> = [
    {
      key: "name",
      header: "Forma",
      alinhamento: "esquerda",
      render: (forma) => <span className="text-label-md text-on-surface">{forma.name}</span>,
    },
    { key: "dimensions", header: "Medidas", alinhamento: "esquerda", render: (forma) => forma.dimensionsLabel },
    { key: "height", header: "Altura", prioridade: "media", render: (forma) => `${forma.heightCm} cm` },
    {
      key: "servings",
      header: "Porções",
      prioridade: "baixa",
      render: (forma) => forma.servings ?? <span className="text-tertiary">—</span>,
    },
    {
      key: "priced",
      header: "Preço",
      prioridade: "media",
      render: (forma) =>
        forma.priced ? <Badge tone="info">Definido</Badge> : <Badge tone="warning">Sem preço</Badge>,
    },
    { key: "active", header: "Situação", render: (forma) => <SituacaoBadge active={forma.active} /> },
    {
      key: "actions",
      header: "Ações",
      alinhamento: "direita",
      render: (forma) => (
        <AcoesDaLinha
          rotulo={`Ações da forma ${forma.name}`}
          onEditar={can("pan_specs.update") ? () => setDialogo({ forma }) : undefined}
          onExcluir={can("pan_specs.delete") ? () => void excluir(forma) : undefined}
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
          placeholder="Buscar forma pelo nome…"
        />
        {can("pan_specs.create") && (
          <Button icon={<Plus size={16} />} onClick={() => setDialogo({})}>
            Nova forma
          </Button>
        )}
      </div>

      <ListaDoCatalogo
        caption="Formas"
        columns={columns}
        consulta={formas}
        getRowKey={(forma) => forma.id}
        rotulo="formas"
        erro="Não foi possível carregar as formas."
        page={listagem.page}
        onPageChange={listagem.setPage}
        vazio="Nenhuma forma encontrada."
      />

      {dialogo && (
        <FormaDialog
          key={dialogo.forma?.id ?? "nova"}
          forma={dialogo.forma}
          onClose={() => setDialogo(undefined)}
        />
      )}
    </div>
  );
}
