import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { Card } from "@/ui/components/Card";
import { EmptyState } from "@/ui/components/EmptyState";
import { PageHeader } from "@/ui/components/PageHeader";
import { PageShell } from "@/ui/components/PageShell";
import { useAuth } from "../hooks/useAuth";

export interface RequirePermissionProps {
  /** Permissão no formato `recurso.acao` (ex.: `users.index`). Com uma lista, basta ter uma delas. */
  permission: string | string[];
  children: ReactNode;
}

/**
 * Mostra o conteúdo só para quem tem a permissão; senão, "Acesso negado".
 * Controla apenas a apresentação: a autorização real é sempre do servidor.
 */
export function RequirePermission({ permission, children }: RequirePermissionProps) {
  const { can } = useAuth();

  const permissoes = Array.isArray(permission) ? permission : [permission];
  if (permissoes.some(can)) return <>{children}</>;

  return (
    <PageShell>
      <PageHeader title="Acesso negado" />
      <Card padded={false}>
        <EmptyState
          icon={<ShieldAlert size={24} />}
          title="Você não tem permissão para acessar esta página."
          description="Fale com a administração do ateliê para solicitar acesso."
        />
      </Card>
    </PageShell>
  );
}
