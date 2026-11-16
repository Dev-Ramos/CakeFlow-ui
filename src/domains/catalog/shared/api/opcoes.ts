import { api } from "@/services/http/api";
import type { Opcao } from "../types/catalog";

interface OpcaoPayload {
  value: number;
  label: string;
  hint?: string | null;
}

/**
 * `GET <caminho>/options?search=` — itens ativos para selects, com busca no servidor.
 * Resposta: `{ data: [{ value, label, hint }] }`.
 */
export async function buscarOpcoes(caminho: string, search?: string): Promise<Opcao[]> {
  const termo = search?.trim();
  const { data } = await api.get<{ data: OpcaoPayload[] }>(`${caminho}/options`, {
    params: termo ? { search: termo } : undefined,
  });
  return data.data.map(({ value, label, hint }) => ({ value, label, hint: hint ?? undefined }));
}
