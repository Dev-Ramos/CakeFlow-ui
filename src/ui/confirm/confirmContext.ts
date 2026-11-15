import { createContext } from "react";
import type { ConfirmContextValue } from "./types";

/** Contexto de confirmação imperativa. Consumido via `useConfirm`, provido por `ConfirmProvider`. */
export const ConfirmContext = createContext<ConfirmContextValue | null>(null);
