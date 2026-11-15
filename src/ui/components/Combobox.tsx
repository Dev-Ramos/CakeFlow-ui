import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { controlBase, controlHeight } from "../design-system/variants";
import { cn } from "../lib/cn";
import { fold } from "../lib/fold";
import { usePopupOverflow } from "../lib/popupOverflow";
import { fieldDescribedBy } from "./Field";

export interface ComboboxOption {
  value: string;
  label: string;
  hint?: string;
}

export interface ComboboxProps {
  id?: string;
  options: ComboboxOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  /** Notifica o texto digitado na busca (para busca server-side). */
  onSearch?: (query: string) => void;
  /** Texto exibido no trigger quando nada está selecionado. */
  placeholder?: string;
  /** Placeholder do input de busca. */
  searchPlaceholder?: string;
  loading?: boolean;
  /** Permite limpar a seleção via botão X. */
  allowEmpty?: boolean;
  disabled?: boolean;
  /**
   * Estado de erro (uso com `Field`): liga `aria-invalid` no trigger e aponta
   * `aria-describedby` para a mensagem do Field. Requer `id` — o mesmo do Field.
   */
  error?: boolean;
  /** O Field correspondente tem dica (`{id}-hint`)? Entra no `aria-describedby`. */
  hasHint?: boolean;
  "aria-label"?: string;
  /** Sobrepõe o `aria-describedby` derivado do Field (casos fora do Field). */
  "aria-describedby"?: string;
  className?: string;
}

/**
 * Select com busca acessível. Renderiza a lista inline (posicionada com
 * `absolute`, sem portal) para ser plenamente testável e evitar os problemas de
 * pointer/portal do Radix Select. Presentacional — não decide regra de negócio.
 */
export function Combobox({
  id,
  options,
  value,
  onChange,
  onSearch,
  placeholder = "Selecione",
  searchPlaceholder = "Buscar…",
  loading = false,
  allowEmpty = false,
  disabled = false,
  error = false,
  hasHint = false,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  className,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndexBruto, setActiveIndex] = useState(0);
  const { alturaExcedente, medirPopup, resetarExcedente } = usePopupOverflow();

  const reactId = useId();
  const baseId = id ?? reactId;
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = fold(query.trim());
    if (!q) return options;
    return options.filter((option) => fold(`${option.label} ${option.hint ?? ""}`).includes(q));
  }, [options, query]);

  // Mantém o destaque dentro dos limites da lista filtrada (derivado, sem efeito).
  const activeIndex =
    filtered.length === 0 ? 0 : Math.min(activeIndexBruto, filtered.length - 1);

  // Foco automático no input de busca ao abrir.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function openList() {
    if (disabled) return;
    setQuery("");
    onSearch?.("");
    const currentIndex = options.findIndex((option) => option.value === value);
    setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    setOpen(true);
  }

  function closeList() {
    resetarExcedente();
    setOpen(false);
    setQuery("");
    onSearch?.("");
  }

  function selectOption(option: ComboboxOption) {
    onChange(option.value);
    closeList();
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (filtered.length > 0) setActiveIndex((activeIndex + 1) % filtered.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (filtered.length > 0) {
          setActiveIndex((activeIndex - 1 + filtered.length) % filtered.length);
        }
        break;
      case "Enter": {
        event.preventDefault();
        const option = filtered[activeIndex];
        if (option) selectOption(option);
        break;
      }
      case "Escape":
        event.preventDefault();
        closeList();
        break;
      default:
        break;
    }
  }

  const activeOption = open ? filtered[activeIndex] : undefined;
  const mostrarLimpar = allowEmpty && selected !== null && !disabled;
  // a11y do estado de erro (mesma regra do TextField): descreve o trigger pelos ids do Field.
  const describedBy =
    ariaDescribedBy ?? (id ? fieldDescribedBy(id, { hint: hasHint, error }) : undefined);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/*
        Âncora própria (separada do espaçador abaixo): o popup usa `top-full`,
        100% da altura deste container. Se o espaçador vivesse aqui dentro, a
        medição inicial ficaria desatualizada assim que ele nascesse e o popup se
        afastaria do botão. Como irmão FORA da âncora, a altura dela nunca muda.
      */}
      <div className="relative">
        <button
          type="button"
          id={id}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listboxId : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          onClick={() => (open ? closeList() : openList())}
          className={cn(
            "flex w-full items-center justify-between gap-2",
            controlHeight,
            controlBase,
            "disabled:cursor-not-allowed",
            // Reserva espaço para o botão "Limpar" (absoluto, em right-8) não cobrir o texto.
            mostrarLimpar && "pr-14",
          )}
        >
          <span className={cn("truncate", !selected && "text-outline")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown size={16} aria-hidden="true" className="shrink-0 text-on-surface-variant" />
        </button>
        {mostrarLimpar && (
          <button
            type="button"
            aria-label="Limpar seleção"
            onClick={() => onChange(null)}
            className={cn(
              // Alvo de toque >= 24px (WCAG 2.5.8): área 24×24 centrando o glifo de 14px.
              "absolute right-8 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-on-surface-variant",
              "hover:bg-surface-container hover:text-on-surface",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            )}
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}

        {open && (
          <div
            ref={medirPopup}
            className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-modal"
          >
            <div className="flex items-center gap-2 border-b border-outline-variant px-3 py-2">
              <Search size={16} aria-hidden="true" className="shrink-0 text-on-surface-variant" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  onSearch?.(event.target.value);
                }}
                onKeyDown={onInputKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-controls={listboxId}
                aria-activedescendant={activeOption ? optionId(activeIndex) : undefined}
                className="w-full bg-transparent text-body-md text-on-surface outline-none placeholder:text-outline"
              />
            </div>

            <ul id={listboxId} role="listbox" className="max-h-60 overflow-auto p-1">
              {loading ? (
                <li className="px-2 py-1.5 text-body-md text-on-surface-variant">Carregando…</li>
              ) : filtered.length === 0 ? (
                <li className="px-2 py-1.5 text-body-md text-on-surface-variant">Nenhum resultado</li>
              ) : (
                filtered.map((option, index) => {
                  const isSelected = option.value === value;
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={option.value}
                      id={optionId(index)}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectOption(option)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex cursor-pointer select-none items-center justify-between gap-2 rounded px-2 py-1.5 text-body-md text-on-surface",
                        isActive && "bg-surface-container",
                        isSelected && "font-medium text-primary",
                      )}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{option.label}</span>
                        {option.hint && (
                          <span className="truncate text-body-sm text-outline">
                            {option.hint}
                          </span>
                        )}
                      </span>
                      {isSelected && (
                        <Check size={16} aria-hidden="true" className="shrink-0 text-primary" />
                      )}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
      {open && alturaExcedente > 0 && (
        <div aria-hidden="true" style={{ height: alturaExcedente + 4 }} />
      )}
    </div>
  );
}
