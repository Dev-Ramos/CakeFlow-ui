import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "../components/Button";
import { cn } from "../lib/cn";
import { ConfirmContext } from "./confirmContext";
import type { ConfirmContextValue, ConfirmOptions } from "./types";

interface ActiveConfirm extends ConfirmOptions {
  /** Resolve a Promise retornada por `confirm()`. */
  resolve: (value: boolean) => void;
}

export interface ConfirmProviderProps {
  children: ReactNode;
}

/**
 * Provê confirmação imperativa de ações destrutivas sobre o `AlertDialog` (Radix).
 * Embrulhe a app com este provider para habilitar `useConfirm()`.
 *
 * Usa AlertDialog (não Dialog) de propósito: a semântica é `role="alertdialog"`,
 * clique fora **não** fecha (evita o dismiss acidental — e o loop quando o
 * confirm abre por cima de outro Dialog modal) e, ao fechar, o foco volta ao
 * elemento que estava focado quando `confirm()` foi chamado.
 */
export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [active, setActive] = useState<ActiveConfirm | null>(null);
  // Garante que cancelar/fechar resolva mesmo se o diálogo sumir sem clique explícito.
  const pending = useRef<ActiveConfirm | null>(null);
  // Elemento focado no momento do confirm() — recebe o foco de volta ao fechar.
  const focoAnterior = useRef<HTMLElement | null>(null);

  const settle = useCallback((value: boolean) => {
    const current = pending.current;
    pending.current = null;
    setActive(null);
    current?.resolve(value);
  }, []);

  const confirm = useCallback<ConfirmContextValue["confirm"]>((opcoes) => {
    return new Promise<boolean>((resolve) => {
      // Resolve uma confirmação anterior ainda pendente como cancelada.
      pending.current?.resolve(false);
      focoAnterior.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const next: ActiveConfirm = { ...opcoes, resolve };
      pending.current = next;
      setActive(next);
    });
  }, []);

  const value = useMemo<ConfirmContextValue>(() => ({ confirm }), [confirm]);

  const tom = active?.tom ?? "danger";

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <AlertDialogPrimitive.Root
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) settle(false);
        }}
      >
        {active ? (
          <AlertDialogPrimitive.Portal>
            <AlertDialogPrimitive.Overlay className="fixed inset-0 z-40 bg-scrim" />
            <AlertDialogPrimitive.Content
              className={cn(
                "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
                "max-h-[85vh] overflow-y-auto",
                "rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-modal",
                "focus:outline-none",
              )}
              onCloseAutoFocus={(event) => {
                // Devolve o foco a quem pediu a confirmação, em vez de deixá-lo cair no body.
                // Se o elemento já saiu do DOM (ex.: o form fechou), deixa o default do Radix.
                const alvo = focoAnterior.current;
                focoAnterior.current = null;
                if (alvo?.isConnected) {
                  event.preventDefault();
                  alvo.focus();
                }
              }}
            >
              <AlertDialogPrimitive.Title className="text-headline-sm text-on-surface">
                {active.titulo}
              </AlertDialogPrimitive.Title>
              {active.descricao ? (
                <AlertDialogPrimitive.Description className="mt-1 text-body-md text-on-surface-variant">
                  {active.descricao}
                </AlertDialogPrimitive.Description>
              ) : null}
              <div className="mt-6 flex justify-end gap-3">
                <AlertDialogPrimitive.Cancel asChild>
                  <Button variant="neutral" onClick={() => settle(false)}>
                    {active.cancelar ?? "Cancelar"}
                  </Button>
                </AlertDialogPrimitive.Cancel>
                <AlertDialogPrimitive.Action asChild>
                  <Button
                    variant={tom}
                    icon={tom === "danger" ? <AlertTriangle size={16} aria-hidden="true" /> : undefined}
                    onClick={() => settle(true)}
                  >
                    {active.confirmar ?? "Confirmar"}
                  </Button>
                </AlertDialogPrimitive.Action>
              </div>
            </AlertDialogPrimitive.Content>
          </AlertDialogPrimitive.Portal>
        ) : null}
      </AlertDialogPrimitive.Root>
    </ConfirmContext.Provider>
  );
}
