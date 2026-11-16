import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/ui/components/Checkbox";
import { EmptyState } from "@/ui/components/EmptyState";
import { cn } from "@/ui/lib/cn";
import type { PermissionGroup } from "../types/role";

export interface PermissionMatrixProps {
  /** Permissões disponíveis, agrupadas por recurso (resposta de `GET /permissions`). */
  grupos: PermissionGroup[];
  /** Ids das permissões marcadas. */
  value: number[];
  onChange: (ids: number[]) => void;
}

/**
 * Um dropdown (card recolhível) por recurso: `resource` é o título e cada
 * `value` uma caixa. Começam recolhidos; o contador `marcadas/total` no cabeçalho
 * mostra o que está selecionado sem precisar abrir.
 */
export function PermissionMatrix({ grupos, value, onChange }: PermissionMatrixProps) {
  if (grupos.length === 0) {
    return (
      <EmptyState
        title="Nenhuma permissão disponível."
        description="As permissões aparecem aqui conforme o backend as disponibiliza."
      />
    );
  }

  return (
    <div role="group" aria-label="Permissões" className="grid items-start gap-3 md:grid-cols-2">
      {grupos.map((grupo) => (
        <GrupoDePermissoes key={grupo.resource} grupo={grupo} value={value} onChange={onChange} />
      ))}
    </div>
  );
}

function GrupoDePermissoes({
  grupo,
  value,
  onChange,
}: { grupo: PermissionGroup } & Pick<PermissionMatrixProps, "value" | "onChange">) {
  const [aberto, setAberto] = useState(false);
  const painelId = useId();

  const ids = grupo.permissions.map((permissao) => permissao.id);
  const marcadas = ids.filter((id) => value.includes(id)).length;
  const todas = ids.length > 0 && marcadas === ids.length;

  function alternar(id: number) {
    onChange(value.includes(id) ? value.filter((atual) => atual !== id) : [...value, id]);
  }

  return (
    <section
      aria-label={grupo.resource}
      className="overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest"
    >
      <header
        className={cn(
          "flex items-center justify-between gap-3 bg-surface-container-low pr-4",
          aberto && "border-b border-outline-variant",
        )}
      >
        <button
          type="button"
          aria-expanded={aberto}
          aria-controls={painelId}
          onClick={() => setAberto((atual) => !atual)}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 px-4 py-3 text-left",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
          )}
        >
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={cn("shrink-0 text-on-surface-variant transition-transform", !aberto && "-rotate-90")}
          />
          <span className="truncate text-label-lg text-on-surface">{grupo.resource}</span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-label-sm tabular-nums",
              marcadas > 0 ? "bg-primary-fixed text-primary" : "bg-surface-container text-tertiary",
            )}
          >
            {marcadas}/{ids.length}
          </span>
        </button>

        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-label-md text-on-surface-variant">
          <Checkbox
            aria-label={`${grupo.resource}: todos`}
            checked={todas}
            ref={(el) => {
              if (el) el.indeterminate = marcadas > 0 && !todas;
            }}
            onChange={() =>
              onChange(
                todas ? value.filter((id) => !ids.includes(id)) : [...new Set([...value, ...ids])],
              )
            }
          />
          Todos
        </label>
      </header>

      {aberto && (
        <div id={painelId} className="grid grid-cols-2 gap-2 p-4">
          {grupo.permissions.map((permissao) => (
            <label
              key={permissao.id}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-body-md transition-colors",
                "border-outline-variant text-on-surface hover:bg-surface-container-low",
                "has-[:checked]:border-primary/40 has-[:checked]:bg-primary-fixed/40",
              )}
            >
              <Checkbox
                aria-label={`${grupo.resource}: ${permissao.value}`}
                checked={value.includes(permissao.id)}
                onChange={() => alternar(permissao.id)}
              />
              <span className="truncate">{permissao.value}</span>
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
