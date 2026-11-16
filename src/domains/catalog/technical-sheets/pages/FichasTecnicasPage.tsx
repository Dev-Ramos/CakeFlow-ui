import { useState } from "react";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { Button } from "@/ui/components/Button";
import { Combobox } from "@/ui/components/Combobox";
import type { DataTableColumn } from "@/ui/components/DataTable";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { useConfirm } from "@/ui/confirm/useConfirm";
import { buttonVariants } from "@/ui/design-system/variants";
import { cn } from "@/ui/lib/cn";
import { useDebounce } from "@/ui/lib/useDebounce";
import { toast } from "@/ui/toast/toast";
import { useBatterTypeOptions } from "../../batter-types/hooks/useBatterTypes";
import { usePanSpecOptions } from "../../pan-specs/hooks/usePanSpecs";
import { AcoesDaLinha } from "../../shared/components/AcoesDaLinha";
import { ListaDoCatalogo } from "../../shared/components/ListaDoCatalogo";
import { useDeleteTechnicalSheet, useTechnicalSheets } from "../hooks/useTechnicalSheets";
import type { TechnicalSheet } from "../types/technicalSheet";

const LIMITE = 10;

/** Catálogo ▸ Fichas técnicas: lista com filtro por forma e por massa (busca no servidor). */
export function FichasTecnicasPage() {
  const { can } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const remover = useDeleteTechnicalSheet();

  const [page, setPage] = useState(1);
  const [panSpecId, setPanSpecId] = useState<number | null>(null);
  const [batterTypeId, setBatterTypeId] = useState<number | null>(null);
  const [buscaForma, setBuscaForma] = useState("");
  const [buscaMassa, setBuscaMassa] = useState("");

  const formas = usePanSpecOptions(useDebounce(buscaForma.trim()));
  const massas = useBatterTypeOptions(useDebounce(buscaMassa.trim()));
  const fichas = useTechnicalSheets({
    page,
    limit: LIMITE,
    panSpecId: panSpecId ?? undefined,
    batterTypeId: batterTypeId ?? undefined,
  });
  const linhas = fichas.data?.data ?? [];

  async function excluir(ficha: TechnicalSheet) {
    const confirmado = await confirm({
      titulo: `Excluir a ficha de ${ficha.panSpec.name} com ${ficha.batterType.name}?`,
      descricao: "Esta ação não pode ser desfeita.",
      confirmar: "Excluir",
      tom: "danger",
    });
    if (!confirmado) return;
    // Ficha usada por camada de pedido responde 409: a mensagem da API sai no toast global.
    remover.mutate(ficha.id, {
      onSuccess: () => {
        toast.success("Ficha técnica excluída.");
        if (linhas.length === 1 && page > 1) setPage(page - 1);
      },
    });
  }

  const columns: Array<DataTableColumn<TechnicalSheet>> = [
    {
      key: "panSpec",
      header: "Forma",
      alinhamento: "esquerda",
      render: (ficha) => <span className="text-label-md text-on-surface">{ficha.panSpec.name}</span>,
    },
    { key: "batterType", header: "Massa", alinhamento: "esquerda", render: (ficha) => ficha.batterType.name },
    { key: "quantity", header: "Massa (g)", prioridade: "media", render: (ficha) => ficha.batterQuantityG },
    {
      key: "oven",
      header: "Forno",
      prioridade: "media",
      render: (ficha) => {
        const partes = [
          ficha.bakeTempC !== null ? `${ficha.bakeTempC} °C` : null,
          ficha.bakeTimeMin !== null ? `${ficha.bakeTimeMin} min` : null,
        ].filter(Boolean);
        return partes.length > 0 ? partes.join(" · ") : <span className="text-tertiary">—</span>;
      },
    },
    {
      key: "ingredients",
      header: "Ingredientes",
      prioridade: "baixa",
      render: (ficha) => ficha.ingredientsCount,
    },
    {
      key: "actions",
      header: "Ações",
      alinhamento: "direita",
      render: (ficha) => (
        <AcoesDaLinha
          rotulo={`Ações da ficha ${ficha.panSpec.name} com ${ficha.batterType.name}`}
          onEditar={
            can("technical_sheets.update")
              ? () => navigate(`/catalogo/fichas-tecnicas/${ficha.id}`)
              : undefined
          }
          onExcluir={can("technical_sheets.delete") ? () => void excluir(ficha) : undefined}
        />
      ),
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Fichas técnicas"
        description="Quantidade de massa, forno e ingredientes de cada combinação de forma e massa."
        actions={
          can("technical_sheets.create") && (
            <Link to="/catalogo/fichas-tecnicas/nova" className={cn(buttonVariants())}>
              <Plus size={16} aria-hidden="true" />
              Nova ficha
            </Link>
          )
        }
      />

      <div role="search" className="flex flex-wrap items-end gap-3">
        <div className="w-full max-w-xs">
          <Combobox
            aria-label="Filtrar por forma"
            placeholder="Todas as formas"
            searchPlaceholder="Buscar forma…"
            options={formas.data ?? []}
            value={panSpecId}
            onChange={(valor) => {
              setPanSpecId(valor);
              setPage(1);
            }}
            onSearch={setBuscaForma}
            loading={formas.isLoading}
            allowEmpty
          />
        </div>
        <div className="w-full max-w-xs">
          <Combobox
            aria-label="Filtrar por massa"
            placeholder="Todas as massas"
            searchPlaceholder="Buscar massa…"
            options={massas.data ?? []}
            value={batterTypeId}
            onChange={(valor) => {
              setBatterTypeId(valor);
              setPage(1);
            }}
            onSearch={setBuscaMassa}
            loading={massas.isLoading}
            allowEmpty
          />
        </div>
        {(panSpecId !== null || batterTypeId !== null) && (
          <Button
            variant="ghost"
            onClick={() => {
              setPanSpecId(null);
              setBatterTypeId(null);
              setPage(1);
            }}
          >
            Limpar filtros
          </Button>
        )}
      </div>

      <ListaDoCatalogo
        caption="Fichas técnicas"
        columns={columns}
        consulta={fichas}
        getRowKey={(ficha) => ficha.id}
        rotulo="fichas"
        erro="Não foi possível carregar as fichas técnicas."
        page={page}
        onPageChange={setPage}
        vazio="Nenhuma ficha técnica encontrada."
      />
    </PageShell>
  );
}
