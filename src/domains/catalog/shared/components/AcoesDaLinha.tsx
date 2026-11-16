import { Pencil, Trash2 } from "lucide-react";
import { Dropdown } from "@/ui/components/dropdown/Dropdown";

export interface AcoesDaLinhaProps {
  /** Nome acessível do menu (ex.: "Ações da forma Redondo 20 cm"). */
  rotulo: string;
  /** Sem a função, a opção não aparece (usuário sem permissão). */
  onEditar?: () => void;
  onExcluir?: () => void;
}

/** Menu "Editar / Excluir" da linha da tabela; some se não houver nenhuma ação. */
export function AcoesDaLinha({ rotulo, onEditar, onExcluir }: AcoesDaLinhaProps) {
  if (!onEditar && !onExcluir) return null;

  return (
    <Dropdown>
      <Dropdown.Trigger aria-label={rotulo} />
      <Dropdown.Content>
        {onEditar && (
          <Dropdown.Option icon={<Pencil size={16} />} onClick={onEditar}>
            Editar
          </Dropdown.Option>
        )}
        {onEditar && onExcluir && <Dropdown.Separator />}
        {onExcluir && (
          <Dropdown.Option icon={<Trash2 size={16} />} variant="danger" onClick={onExcluir}>
            Excluir
          </Dropdown.Option>
        )}
      </Dropdown.Content>
    </Dropdown>
  );
}
