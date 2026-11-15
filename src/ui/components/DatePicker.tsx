import { useEffect, useId, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { controlBase, controlHeight } from "../design-system/variants";
import { cn } from "../lib/cn";
import { usePopupOverflow } from "../lib/popupOverflow";
import {
  DIAS_SEMANA_PT,
  MESES_PT,
  combinarDataEHorario,
  dataEntre,
  deslocarMes,
  formatarDataCurta,
  formatarHoraCurta,
  gradeDoMes,
  inicioDoMes,
  lerHorarioDoInput,
  mesmoDia,
  mesmoMes,
} from "../lib/calendario";
import { Button } from "./Button";
import { fieldDescribedBy } from "./Field";

/** Par de datas do modo `intervalo` — clique na primeira define `inicio`, na segunda, `fim`. */
export interface DatePickerIntervalo {
  inicio: Date | null;
  fim: Date | null;
}

interface DatePickerBaseProps {
  id?: string;
  /** Texto exibido no trigger quando nada está selecionado. */
  placeholder?: string;
  disabled?: boolean;
  /** Permite limpar a seleção via botão X. */
  allowEmpty?: boolean;
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

export type DatePickerProps =
  | (DatePickerBaseProps & {
      /** `false`/ausente (padrão): uma data + horário — default `00:00:00` no dia escolhido. */
      intervalo?: false;
      value: Date | null;
      onChange: (value: Date | null) => void;
    })
  | (DatePickerBaseProps & {
      /** `true`: intervalo de datas — clique na primeira, depois na segunda. Sem horário. */
      intervalo: true;
      value: DatePickerIntervalo;
      onChange: (value: DatePickerIntervalo) => void;
    });

interface Horario {
  horas: number;
  minutos: number;
  segundos: number;
}

const HORARIO_MEIA_NOITE: Horario = { horas: 0, minutos: 0, segundos: 0 };

function horarioDeData(data: Date | null): Horario {
  if (!data) return HORARIO_MEIA_NOITE;
  return { horas: data.getHours(), minutos: data.getMinutes(), segundos: data.getSeconds() };
}

function horarioParaInputValue(horario: Horario): string {
  const hh = String(horario.horas).padStart(2, "0");
  const mm = String(horario.minutos).padStart(2, "0");
  const ss = String(horario.segundos).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

/** `{horas,minutos,segundos}` → `Date` só com hora (o dia é arbitrário; só a hora é usada). */
function criarHorarioComo(horario: Horario): Date {
  return new Date(2000, 0, 1, horario.horas, horario.minutos, horario.segundos);
}

/** Texto do trigger no modo intervalo: nenhum, só início (em progresso) ou início–fim. */
function textoIntervalo(valor: DatePickerIntervalo): string | null {
  if (!valor.inicio) return null;
  if (!valor.fim) return `${formatarDataCurta(valor.inicio)} – …`;
  return `${formatarDataCurta(valor.inicio)} – ${formatarDataCurta(valor.fim)}`;
}

/**
 * Campo de calendário: trigger que abre um mini calendário em popup (sem portal,
 * mesma decisão do `Combobox`). Dois modos, via `intervalo`:
 *
 * - **Único** (padrão): uma data + horário (default `00:00:00` no dia escolhido,
 *   ajustável depois de escolher a data).
 * - **Intervalo**: duas datas — primeiro clique define o início, o segundo o fim
 *   (troca a ordem sozinho se o segundo clique for anterior). Sem horário.
 *
 * Presentacional — não decide regra de negócio.
 */
export function DatePicker(props: DatePickerProps) {
  const {
    id,
    placeholder = "Selecione a data",
    disabled = false,
    allowEmpty = false,
    error = false,
    hasHint = false,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedBy,
    className,
  } = props;

  const [open, setOpen] = useState(false);
  const [mesVisivel, setMesVisivel] = useState(() =>
    inicioDoMes(
      props.intervalo
        ? (props.value.inicio ?? props.value.fim ?? new Date())
        : (props.value ?? new Date()),
    ),
  );
  const [horario, setHorario] = useState(() => horarioDeData(props.intervalo ? null : props.value));

  const reactId = useId();
  const baseId = id ?? reactId;
  const dialogId = `${baseId}-calendario`;

  const rootRef = useRef<HTMLDivElement>(null);
  const { alturaExcedente, medirPopup, resetarExcedente } = usePopupOverflow();

  // Fecha ao clicar fora — mesmo padrão do Combobox.
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

  // Fecha no Escape, em `document`: nada dentro do popup recebe foco ao abrir
  // (diferente do Combobox), então um handler só no popup nunca veria a tecla.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function abrir() {
    if (disabled) return;
    // Sincroniza o mês exibido e o horário de trabalho com o valor atual ao reabrir.
    if (props.intervalo) {
      setMesVisivel(inicioDoMes(props.value.inicio ?? props.value.fim ?? new Date()));
    } else {
      setMesVisivel(inicioDoMes(props.value ?? new Date()));
      setHorario(horarioDeData(props.value));
    }
    setOpen(true);
  }

  function fechar() {
    resetarExcedente();
    setOpen(false);
  }

  function limpar() {
    if (props.intervalo) {
      props.onChange({ inicio: null, fim: null });
    } else {
      props.onChange(null);
    }
  }

  function selecionarDiaUnico(dia: Date) {
    if (props.intervalo) return;
    props.onChange(combinarDataEHorario(dia, criarHorarioComo(horario)));
  }

  function selecionarDiaIntervalo(dia: Date) {
    if (!props.intervalo) return;
    const { inicio, fim } = props.value;

    // Sem início, ou intervalo já completo: começa um novo intervalo a partir daqui.
    if (!inicio || fim) {
      props.onChange({ inicio: dia, fim: null });
      return;
    }

    // Segundo clique: define o fim, trocando a ordem se vier antes do início.
    const emOrdem = dia.getTime() >= inicio.getTime();
    props.onChange(emOrdem ? { inicio, fim: dia } : { inicio: dia, fim: inicio });
    fechar();
  }

  function onHorarioChange(valorInput: string) {
    if (props.intervalo || !valorInput) return;
    const novoHorario = lerHorarioDoInput(valorInput);
    setHorario(novoHorario);
    // Já existe uma data escolhida: reaplica o horário imediatamente.
    if (props.value) {
      props.onChange(combinarDataEHorario(props.value, criarHorarioComo(novoHorario)));
    }
  }

  const valorSelecionado = props.intervalo ? props.value.inicio !== null : props.value !== null;
  const mostrarLimpar = allowEmpty && valorSelecionado && !disabled;
  const describedBy =
    ariaDescribedBy ?? (id ? fieldDescribedBy(id, { hint: hasHint, error }) : undefined);

  const textoTrigger = props.intervalo
    ? textoIntervalo(props.value)
    : props.value
      ? `${formatarDataCurta(props.value)} ${formatarHoraCurta(props.value)}`
      : null;

  const grade = gradeDoMes(mesVisivel);
  const hoje = new Date();

  const botaoMes =
    "flex h-8 w-8 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Âncora própria separada do espaçador (mesma correção do `Combobox`). */}
      <div className="relative">
        <button
          type="button"
          id={id}
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? dialogId : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          disabled={disabled}
          onClick={() => (open ? fechar() : abrir())}
          className={cn(
            "flex w-full items-center justify-between gap-2",
            controlHeight,
            controlBase,
            "disabled:cursor-not-allowed",
            mostrarLimpar && "pr-14",
          )}
        >
          <span className={cn("truncate", !textoTrigger && "text-outline")}>
            {textoTrigger ?? placeholder}
          </span>
          <Calendar size={16} aria-hidden="true" className="shrink-0 text-on-surface-variant" />
        </button>

        {mostrarLimpar && (
          <button
            type="button"
            aria-label="Limpar seleção"
            onClick={limpar}
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
            id={dialogId}
            role="dialog"
            aria-label="Selecionar data"
            className={cn(
              "absolute left-0 top-full z-50 mt-1 w-72 max-w-[calc(100vw-2rem)] overflow-hidden",
              "rounded-lg border border-outline-variant bg-surface-container-lowest p-3 shadow-modal sm:w-80",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                aria-label="Mês anterior"
                onClick={() => setMesVisivel((atual) => deslocarMes(atual, -1))}
                className={botaoMes}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <span className="text-body-md font-medium text-on-surface">
                {MESES_PT[mesVisivel.getMonth()]} {mesVisivel.getFullYear()}
              </span>
              <button
                type="button"
                aria-label="Próximo mês"
                onClick={() => setMesVisivel((atual) => deslocarMes(atual, 1))}
                className={botaoMes}
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1">
              {DIAS_SEMANA_PT.map((rotulo, indice) => (
                <span
                  key={indice}
                  aria-hidden="true"
                  className="flex h-7 items-center justify-center text-body-sm font-medium text-on-surface-variant"
                >
                  {rotulo}
                </span>
              ))}
              {grade.map((dia) => {
                const foraDoMes = !mesmoMes(dia, mesVisivel);
                const eHoje = mesmoDia(dia, hoje);
                const selecionado = props.intervalo
                  ? mesmoDia(dia, props.value.inicio) || mesmoDia(dia, props.value.fim)
                  : mesmoDia(dia, props.value);
                const noIntervalo = props.intervalo
                  ? dataEntre(dia, props.value.inicio, props.value.fim)
                  : false;

                return (
                  <button
                    key={dia.toISOString()}
                    type="button"
                    disabled={disabled}
                    aria-label={formatarDataCurta(dia)}
                    aria-current={eHoje ? "date" : undefined}
                    aria-pressed={selecionado}
                    onClick={() =>
                      props.intervalo ? selecionarDiaIntervalo(dia) : selecionarDiaUnico(dia)
                    }
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg text-body-md",
                      "hover:bg-surface-container focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      foraDoMes ? "text-outline" : "text-on-surface",
                      eHoje && !selecionado && "ring-1 ring-inset ring-primary",
                      noIntervalo && "rounded-none bg-primary-fixed",
                      selecionado && "bg-primary text-on-primary hover:bg-primary-container",
                    )}
                  >
                    {dia.getDate()}
                  </button>
                );
              })}
            </div>

            {!props.intervalo && (
              <div className="mt-3 flex items-center gap-2 border-t border-outline-variant pt-3">
                <label htmlFor={`${baseId}-horario`} className="text-body-sm text-on-surface-variant">
                  Horário
                </label>
                <input
                  id={`${baseId}-horario`}
                  type="time"
                  step={1}
                  value={horarioParaInputValue(horario)}
                  onChange={(event) => onHorarioChange(event.target.value)}
                  className={cn("h-8 flex-1", controlBase, "px-2 py-1")}
                />
                <Button size="sm" onClick={fechar}>
                  Confirmar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
      {open && alturaExcedente > 0 && (
        <div aria-hidden="true" style={{ height: alturaExcedente + 4 }} />
      )}
    </div>
  );
}
