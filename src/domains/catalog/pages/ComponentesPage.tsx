import { useSearchParams } from "react-router";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { Tabs, type TabItem } from "@/ui/components/Tabs";
import { MassasTab } from "../batter-types/components/MassasTab";
import { RecheiosTab } from "../fillings/components/RecheiosTab";
import { FormasTab } from "../pan-specs/components/FormasTab";

const ABAS = [
  { value: "formas", label: "Formas", permission: "pan_specs.index" },
  { value: "massas", label: "Massas", permission: "batter_types.index" },
  { value: "recheios", label: "Recheios", permission: "fillings.index" },
] as const;

/**
 * Catálogo ▸ Componentes: abas Formas, Massas e Recheios, cada uma com a sua lista e o
 * seu modal de cadastro. Cada aba aparece só para quem tem o `index` do recurso; a aba
 * escolhida fica na URL (`?aba=massas`).
 */
export function ComponentesPage() {
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();

  const disponiveis = ABAS.filter((aba) => can(aba.permission));
  const itens: TabItem[] = disponiveis.map(({ value, label }) => ({ value, label }));
  const pedida = params.get("aba");
  const atual = disponiveis.find((aba) => aba.value === pedida)?.value ?? disponiveis[0]?.value;

  return (
    <PageShell>
      <PageHeader
        title="Componentes"
        description="Formas, massas e recheios usados nos bolos. Os preços ficam em Preços e acréscimos."
      />
      {atual && (
        <Tabs
          ariaLabel="Componentes"
          items={itens}
          value={atual}
          onChange={(aba) => setParams({ aba }, { replace: true })}
        >
          {atual === "formas" && <FormasTab />}
          {atual === "massas" && <MassasTab />}
          {atual === "recheios" && <RecheiosTab />}
        </Tabs>
      )}
    </PageShell>
  );
}
