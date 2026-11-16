import { useState } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useDebounce } from "../../lib/useDebounce";
import { Formulario } from "./Formulario";

interface Opcao {
  value: number;
  label: string;
  hint?: string;
}

/** Hook de options (recebe o termo já com debounce): `GET <recurso>/options?search=`. */
type UsarOpcoes = (busca: string) => UseQueryResult<Opcao[]>;

interface CampoDeBuscaProps {
  name: string;
  label: string;
  usarOpcoes: UsarOpcoes;
  /** O que já está escolhido (edição), para o rótulo aparecer antes de vir numa busca. */
  selecionada?: Opcao;
  required?: boolean;
  disabled?: boolean;
  allowEmpty?: boolean;
  placeholder?: string;
  /** Chamado quando o usuário troca a opção (não na carga inicial). */
  onChange?: (value: number | string | null) => void;
}

/**
 * Select de uma opção com busca no servidor. Cada campo guarda o seu próprio termo, então
 * pode se repetir (andares, bolos) sem um estado de busca por linha na tela.
 */
export function CampoDeBusca({
  usarOpcoes,
  selecionada,
  placeholder = "Selecione",
  ...campo
}: CampoDeBuscaProps) {
  const [busca, setBusca] = useState("");
  const opcoes = usarOpcoes(useDebounce(busca.trim()));
  return (
    <Formulario.Combobox
      {...campo}
      options={opcoes.data ?? []}
      selectedOption={selecionada}
      onSearch={setBusca}
      loading={opcoes.isLoading}
      placeholder={placeholder}
      searchPlaceholder="Buscar…"
    />
  );
}

interface CampoDeBuscaMultiProps {
  name: string;
  label: string;
  usarOpcoes: UsarOpcoes;
  selecionadas?: Opcao[];
  disabled?: boolean;
  descricao?: string;
}

/** Versão de seleção múltipla de {@link CampoDeBusca}. */
export function CampoDeBuscaMulti({ usarOpcoes, selecionadas, ...campo }: CampoDeBuscaMultiProps) {
  const [busca, setBusca] = useState("");
  const opcoes = usarOpcoes(useDebounce(busca.trim()));
  return (
    <Formulario.ComboboxMulti
      {...campo}
      options={opcoes.data ?? []}
      selectedOptions={selecionadas}
      onSearch={setBusca}
      loading={opcoes.isLoading}
      placeholder="Selecione"
      searchPlaceholder="Buscar…"
    />
  );
}
