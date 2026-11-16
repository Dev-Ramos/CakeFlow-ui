import { useState } from "react";
import { Cake, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useConfirm } from "@/ui/confirm/useConfirm";
import { toast } from "@/ui/toast/toast";
import { Badge } from "@/ui/components/Badge";
import type { DataTableColumn } from "@/ui/components/DataTable";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { SelectNativo } from "@/ui/components/SelectNativo";
import { buttonVariants } from "@/ui/design-system/variants";
import { cn } from "@/ui/lib/cn";
import { AcoesDaLinha } from "../../shared/components/AcoesDaLinha";
import {
  FiltrosDaLista,
  ListaDoCatalogo,
  SituacaoBadge,
} from "../../shared/components/ListaDoCatalogo";
import { useListagem } from "../../shared/hooks/useListagem";
import { useCakeTypes, useDeleteCakeType } from "../hooks/useCakeTypes";
import type { CakeType } from "../types/cakeType";

type FiltroDeDecoracao = "todos" | "sim" | "nao";

const marcaInativo = (ativo: boolean) => (ativo ? "" : " (inativo)");

function Miniatura({ tipo }: { tipo: CakeType }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low text-outline">
      {tipo.imageUrl ? (
        <img src={tipo.imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        <Cake size={18} aria-hidden="true" />
      )}
    </span>
  );
}

/** Catálogo ▸ Tipos de bolo: lista com busca, situação e "exige decoração". */
export function TiposDeBoloPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const listagem = useListagem();
  const confirm = useConfirm();
  const remover = useDeleteCakeType();
  const [decoracao, setDecoracao] = useState<FiltroDeDecoracao>("todos");

  const tipos = useCakeTypes({
    ...listagem.params,
    requiresDecoration: decoracao === "todos" ? undefined : decoracao === "sim",
  });
  const linhas = tipos.data?.data ?? [];

  async function excluir(tipo: CakeType) {
    const confirmado = await confirm({
      titulo: `Excluir o tipo de bolo "${tipo.name}"?`,
      descricao: "Esta ação não pode ser desfeita. Para só tirá-lo de uso, inative-o.",
      confirmar: "Excluir",
      tom: "danger",
    });
    if (!confirmado) return;
    // Tipo em uso responde 409: a mensagem da API sai no toast global de erro.
    remover.mutate(tipo.id, {
      onSuccess: () => {
        toast.success("Tipo de bolo excluído.");
        if (linhas.length === 1 && listagem.page > 1) listagem.setPage(listagem.page - 1);
      },
    });
  }

  const columns: Array<DataTableColumn<CakeType>> = [
    {
      key: "name",
      header: "Tipo de bolo",
      alinhamento: "esquerda",
      render: (tipo) => (
        <div className="flex min-w-0 items-center gap-3">
          <Miniatura tipo={tipo} />
          <div className="min-w-0">
            <p className="truncate text-label-md text-on-surface">{tipo.name}</p>
            {tipo.description && <p className="truncate text-body-sm text-tertiary">{tipo.description}</p>}
          </div>
        </div>
      ),
    },
    {
      key: "panSpec",
      header: "Forma padrão",
      alinhamento: "esquerda",
      prioridade: "media",
      render: (tipo) =>
        tipo.defaultPanSpec ? (
          <div className="min-w-0">
            <p className="truncate">
              {tipo.defaultPanSpec.name}
              {marcaInativo(tipo.defaultPanSpec.active)}
            </p>
            <p className="truncate text-body-sm text-tertiary">
              {tipo.defaultPanSpec.dimensionsLabel} · {tipo.defaultPanSpec.heightCm} cm de altura
            </p>
          </div>
        ) : (
          <span className="text-tertiary">—</span>
        ),
    },
    {
      key: "batterType",
      header: "Massa padrão",
      alinhamento: "esquerda",
      prioridade: "media",
      render: (tipo) =>
        tipo.defaultBatterType ? (
          `${tipo.defaultBatterType.name}${marcaInativo(tipo.defaultBatterType.active)}`
        ) : (
          <span className="text-tertiary">—</span>
        ),
    },
    {
      key: "fillings",
      header: "Recheios padrão",
      alinhamento: "esquerda",
      prioridade: "baixa",
      render: (tipo) =>
        tipo.defaultFillings.length === 0 ? (
          <span className="text-tertiary">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {tipo.defaultFillings.map((recheio) => (
              <Badge key={recheio.id} tone="primary">
                {recheio.name}
                {marcaInativo(recheio.active)}
              </Badge>
            ))}
          </div>
        ),
    },
    {
      key: "decoration",
      header: "Decoração",
      prioridade: "media",
      render: (tipo) =>
        tipo.requiresDecoration ? <Badge tone="warning">Exige</Badge> : <span className="text-tertiary">—</span>,
    },
    { key: "active", header: "Situação", render: (tipo) => <SituacaoBadge active={tipo.active} /> },
    {
      key: "actions",
      header: "Ações",
      alinhamento: "direita",
      render: (tipo) => (
        <AcoesDaLinha
          rotulo={`Ações do tipo de bolo ${tipo.name}`}
          onEditar={
            can("cake_types.update") ? () => navigate(`/catalogo/tipos-de-bolo/${tipo.id}`) : undefined
          }
          onExcluir={can("cake_types.delete") ? () => void excluir(tipo) : undefined}
        />
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Tipos de bolo"
        description="Os bolos do catálogo e seus padrões de forma, massa e recheios."
        actions={
          can("cake_types.create") && (
            <Link to="/catalogo/tipos-de-bolo/novo" className={cn(buttonVariants())}>
              <Plus size={16} aria-hidden="true" />
              Novo tipo de bolo
            </Link>
          )
        }
      />

      <FiltrosDaLista
        busca={listagem.busca}
        onBusca={listagem.setBusca}
        situacao={listagem.situacao}
        onSituacao={listagem.setSituacao}
        placeholder="Buscar tipo de bolo pelo nome…"
      >
        <div className="w-48">
          <SelectNativo
            aria-label="Decoração"
            value={decoracao}
            onChange={(event) => {
              setDecoracao(event.target.value as FiltroDeDecoracao);
              listagem.setPage(1);
            }}
          >
            <option value="todos">Com ou sem decoração</option>
            <option value="sim">Exige decoração</option>
            <option value="nao">Não exige decoração</option>
          </SelectNativo>
        </div>
      </FiltrosDaLista>

      <ListaDoCatalogo
        caption="Tipos de bolo"
        columns={columns}
        consulta={tipos}
        getRowKey={(tipo) => tipo.id}
        rotulo="tipos de bolo"
        erro="Não foi possível carregar os tipos de bolo."
        page={listagem.page}
        onPageChange={listagem.setPage}
        vazio="Nenhum tipo de bolo encontrado."
      />
    </PageShell>
  );
}
