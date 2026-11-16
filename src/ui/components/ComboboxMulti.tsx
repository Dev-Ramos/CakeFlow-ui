import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "../lib/cn";
import { fold } from "../lib/fold";
import { mesmoValor, type ValorDeOpcao } from "../lib/valorDeOpcao";
import { fieldDescribedBy } from "./Field";

export interface ComboboxMultiOption<V extends ValorDeOpcao = string> {
  value: V;
  label: string;
  hint?: string;
  /**
   * Opção travada: aparece marcada, mas o usuário não consegue desmarcar. Serve
   * para valores que já existem no destino e não podem ser desfeitos pela tela.
   */
  disabled?: boolean;
}

export interface ComboboxMultiProps<V extends ValorDeOpcao = string> {
  id?: string;
  options: ComboboxMultiOption<V>[];
  value: V[];
  /** Devolve os valores no tipo original das opções (número continua número). */
  onChange: (value: V[]) => void;
  /**
   * Notifica o texto digitado na busca. Quando informado, a busca é server-side:
   * o componente NÃO filtra `options` localmente — quem usa troca as opções (e
   * aplica o debounce, ver `useDebounce`). Chamado com "" ao abrir e ao fechar.
   */
  onSearch?: (query: string) => void;
  /**
   * Opções já escolhidas, para mostrar os rótulos antes de virem numa busca
   * (ex.: edição de um registro). Só valem para valores que estão em `value`.
   */
  selectedOptions?: ComboboxMultiOption<V>[];
  /** Texto do trigger quando nada está selecionado. */
  placeholder?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  disabled?: boolean;
  error?: boolean;
  hasHint?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
  className?: string;
}

/** Seleção múltipla com busca. Mesma ergonomia do `Combobox`; a lista não fecha ao marcar. */
export function ComboboxMulti<V extends ValorDeOpcao = string>({
  id,
  options,
  value,
  onChange,
  onSearch,
  selectedOptions,
  placeholder = "Selecione",
  searchPlaceholder = "Buscar…",
  loading = false,
  disabled = false,
  error = false,
  hasHint = false,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  className,
}: ComboboxMultiProps<V>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndexBruto, setActiveIndex] = useState(0);

  const reactId = useId();
  const baseId = id ?? reactId;
  const listboxId = `${baseId}-listbox`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Ordem das opções, não a de clique: senão o mesmo conjunto aparece escrito de
   * um jeito a cada vez que o usuário marca e desmarca.
   */
  // Com busca server-side a lista muda a cada termo: lembra as opções já vistas para os
  // chips continuarem com rótulo quando a opção sai da lista.
  const [lembradas, setLembradas] = useState<ComboboxMultiOption<V>[]>([]);

  const selecionados = useMemo(() => {
    const daLista = options.filter((option) => value.some((v) => mesmoValor(v, option.value)));
    const fora = value
      .filter((v) => !daLista.some((option) => mesmoValor(option.value, v)))
      .map(
        (v) =>
          lembradas.find((option) => mesmoValor(option.value, v)) ??
          selectedOptions?.find((option) => mesmoValor(option.value, v)),
      )
      .filter((option): option is ComboboxMultiOption<V> => option !== undefined);
    return [...daLista, ...fora];
  }, [options, value, lembradas, selectedOptions]);

  const estaMarcado = (v: V) => value.some((atual) => mesmoValor(atual, v));

  const buscaNoServidor = onSearch !== undefined;
  const filtered = useMemo(() => {
    // Com `onSearch`, a lista já vem filtrada pelo servidor.
    if (buscaNoServidor) return options;
    const q = fold(query.trim());
    if (!q) return options;
    return options.filter((option) => fold(`${option.label} ${option.hint ?? ""}`).includes(q));
  }, [options, query, buscaNoServidor]);

  // Mantém o destaque dentro dos limites da lista filtrada (derivado, sem efeito).
  const activeIndex =
    filtered.length === 0 ? 0 : Math.min(activeIndexBruto, filtered.length - 1);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

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
    setActiveIndex(0);
    setOpen(true);
  }

  function closeList() {
    setOpen(false);
    setQuery("");
    onSearch?.("");
  }

  /** Alterna sem fechar: o ponto do múltiplo é marcar vários numa abertura só. */
  function alternar(option: ComboboxMultiOption<V>) {
    if (option.disabled) return;
    setLembradas((atual) => [...atual.filter((o) => !mesmoValor(o.value, option.value)), option]);
    onChange(
      estaMarcado(option.value)
        ? value.filter((v) => !mesmoValor(v, option.value))
        : [...value, option.value],
    );
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
        if (option) alternar(option);
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
  const describedBy =
    ariaDescribedBy ?? (id ? fieldDescribedBy(id, { hint: hasHint, error }) : undefined);

  const removiveis = selecionados.filter((option) => !option.disabled);

  return (
    <div ref={rootRef} className={className}>
      <div className="relative">
        <div
          className={cn(
            "flex w-full flex-wrap items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1.5 text-body-md text-on-surface",
            "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary",
            error && "border-error",
            disabled && "cursor-not-allowed bg-surface-container",
          )}
        >
          {selecionados.map((option) => (
            <span
              key={option.value}
              className={cn(
                "flex max-w-full items-center gap-1 rounded-full bg-surface-container py-0.5 pl-2 text-body-sm",
                option.disabled ? "pr-2 text-on-surface-variant" : "pr-0.5",
              )}
            >
              <span className="truncate">{option.label}</span>
              {!option.disabled && (
                <button
                  type="button"
                  aria-label={`Remover ${option.label}`}
                  disabled={disabled}
                  onClick={() => alternar(option)}
                  className={cn(
                    // Alvo de toque >= 24px (WCAG 2.5.8) sem inflar o chip.
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-on-surface-variant",
                    "hover:bg-outline-variant hover:text-on-surface",
                    "focus-visible:ring-1",
                  )}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </span>
          ))}

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
              "flex min-w-16 flex-1 items-center justify-between gap-2 self-stretch py-0.5 text-left",
              "focus:outline-none",
              "disabled:cursor-not-allowed",
            )}
          >
            <span className="truncate text-outline">
              {selecionados.length === 0 ? placeholder : ""}
            </span>
            <ChevronsUpDown size={16} aria-hidden="true" className="shrink-0 text-on-surface-variant" />
          </button>

          {/* Limpar tudo só aparece quando há o que limpar — e nunca remove opção travada. */}
          {removiveis.length > 0 && !disabled && (
            <button
              type="button"
              aria-label="Limpar seleção"
              onClick={() => onChange(value.filter((v) => !removiveis.some((o) => mesmoValor(o.value, v))))}
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded text-on-surface-variant",
                "hover:bg-surface-container hover:text-on-surface",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              )}
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest shadow-modal">
            <div className="flex items-center gap-2 border-b border-outline-variant px-3 py-2">
              <Search size={16} aria-hidden="true" className="shrink-0 text-on-surface-variant" />
              {/* Filtro do popup: textbox simples — o role=combobox é ÚNICO e vive no trigger. */}
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

            <ul
              id={listboxId}
              role="listbox"
              aria-multiselectable="true"
              className="max-h-52 overflow-auto p-1"
            >
              {loading ? (
                <li className="px-2 py-1.5 text-body-md text-on-surface-variant">Carregando…</li>
              ) : filtered.length === 0 ? (
                <li className="px-2 py-1.5 text-body-md text-on-surface-variant">Nenhum resultado</li>
              ) : (
                filtered.map((option, index) => {
                  const marcado = estaMarcado(option.value);
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={option.value}
                      id={optionId(index)}
                      role="option"
                      aria-selected={marcado}
                      aria-disabled={option.disabled ? true : undefined}
                      onClick={() => alternar(option)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn(
                        "flex select-none items-center gap-2 rounded px-2 py-1.5 text-body-md text-on-surface",
                        option.disabled ? "cursor-not-allowed text-on-surface-variant" : "cursor-pointer",
                        isActive && !option.disabled && "bg-surface-container",
                        marcado && !option.disabled && "font-medium text-primary",
                      )}
                    >
                      {/* Checkbox só visual: o estado real vive em `aria-selected` do option. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                          marcado
                            ? "border-primary bg-primary text-on-primary"
                            : "border-outline-variant",
                          option.disabled && "opacity-60",
                        )}
                      >
                        {marcado && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{option.label}</span>
                        {option.hint && (
                          <span className="truncate text-body-sm text-outline">
                            {option.hint}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
