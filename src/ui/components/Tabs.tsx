import { useId, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  /** Nome acessível da lista de abas. */
  ariaLabel: string;
  /** Conteúdo da aba selecionada. */
  children: ReactNode;
  className?: string;
}

/**
 * Abas acessíveis (WAI-ARIA): setas, Home e End movem a seleção. Controlado e
 * presentacional: renderiza só o painel da aba ativa (quem usa decide o conteúdo).
 */
export function Tabs({ items, value, onChange, ariaLabel, children, className }: TabsProps) {
  const baseId = useId();
  const idDaAba = (valor: string) => `${baseId}-aba-${valor}`;
  const idDoPainel = `${baseId}-painel`;

  function aoTeclar(event: KeyboardEvent<HTMLButtonElement>, indice: number) {
    const ultimo = items.length - 1;
    const proximo =
      event.key === "ArrowRight"
        ? (indice + 1) % items.length
        : event.key === "ArrowLeft"
          ? (indice - 1 + items.length) % items.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? ultimo
              : null;
    if (proximo === null) return;

    event.preventDefault();
    onChange(items[proximo].value);
    document.getElementById(idDaAba(items[proximo].value))?.focus();
  }

  return (
    <div className={className}>
      <div role="tablist" aria-label={ariaLabel} className="flex gap-1 border-b border-outline-variant">
        {items.map((item, indice) => {
          const selecionada = item.value === value;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              id={idDaAba(item.value)}
              aria-selected={selecionada}
              aria-controls={idDoPainel}
              tabIndex={selecionada ? 0 : -1}
              onClick={() => onChange(item.value)}
              onKeyDown={(event) => aoTeclar(event, indice)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-label-lg transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
                selecionada
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={idDoPainel} aria-labelledby={idDaAba(value)} className="pt-4">
        {children}
      </div>
    </div>
  );
}
