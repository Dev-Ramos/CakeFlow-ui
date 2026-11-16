import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/domains/auth/hooks/useAuth";
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
import { useBatterTypes, useDeleteBatterType } from "../hooks/useBatterTypes";
import type { BatterType } from "../types/batterType";
import { MassaDialog } from "./MassaDialog";

/** `undefined` = fechado; `{}` = nova massa; `{ massa }` = editar. */
type Dialogo = { massa?: BatterType } | undefined;

/** Aba Massas: lista paginada com busca no servidor e modal de cadastro. */
export function MassasTab() {
  const { can } = useAuth();
  const confirm = useConfirm();
  const listagem = useListagem();
  const massas = useBatterTypes(listagem.params);
  const remover = useDeleteBatterType();
  const [dialogo, setDialogo] = useState<Dialogo>(undefined);

  const linhas = massas.data?.data ?? [];

  async function excluir(massa: BatterType) {
    const confirmado = await confirm({
      titulo: `Excluir a massa "${massa.name}"?`,
      descricao: "Esta ação não pode ser desfeita. Para só tirar a massa de uso, inative-a.",
      confirmar: "Excluir",
      tom: "danger",
    });
    if (!confirmado) return;
    // Massa em uso responde 409: a mensagem da API sai no toast global de erro.
    remover.mutate(massa.id, {
      onSuccess: () => {
        toast.success("Massa excluída.");
        // Apagou o único item da última página: volta uma página.
        if (linhas.length === 1 && listagem.page > 1) listagem.setPage(listagem.page - 1);
      },
    });
  }

  const columns: Array<DataTableColumn<BatterType>> = [
    {
      key: "name",
      header: "Massa",
      alinhamento: "esquerda",
      render: (massa) => <span className="text-label-md text-on-surface">{massa.name}</span>,
    },
    {
      key: "description",
      header: "Descrição",
      alinhamento: "esquerda",
      prioridade: "media",
      render: (massa) => massa.description || <span className="text-tertiary">—</span>,
    },
    { key: "active", header: "Situação", render: (massa) => <SituacaoBadge active={massa.active} /> },
    {
      key: "actions",
      header: "Ações",
      alinhamento: "direita",
      render: (massa) => (
        <AcoesDaLinha
          rotulo={`Ações da massa ${massa.name}`}
          onEditar={can("batter_types.update") ? () => setDialogo({ massa }) : undefined}
          onExcluir={can("batter_types.delete") ? () => void excluir(massa) : undefined}
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
          placeholder="Buscar massa pelo nome…"
        />
        {can("batter_types.create") && (
          <Button icon={<Plus size={16} />} onClick={() => setDialogo({})}>
            Nova massa
          </Button>
        )}
      </div>

      <ListaDoCatalogo
        caption="Massas"
        columns={columns}
        consulta={massas}
        getRowKey={(massa) => massa.id}
        rotulo="massas"
        erro="Não foi possível carregar as massas."
        page={listagem.page}
        onPageChange={listagem.setPage}
        vazio="Nenhuma massa encontrada."
      />

      {dialogo && (
        <MassaDialog
          key={dialogo.massa?.id ?? "nova"}
          massa={dialogo.massa}
          onClose={() => setDialogo(undefined)}
        />
      )}
    </div>
  );
}
