/* eslint-disable react-refresh/only-export-components -- compound component do design system. */
import type { ComponentProps } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator } from "../DropdownMenu";
import { DropdownOption } from "./DropdownOption";
import { DropdownTrigger } from "./DropdownTrigger";

export type DropdownProps = ComponentProps<typeof DropdownMenu>;

function DropdownBase(props: DropdownProps) {
  return <DropdownMenu {...props} />;
}

type DropdownComposto = typeof DropdownBase & {
  Trigger: typeof DropdownTrigger;
  Content: typeof DropdownMenuContent;
  Option: typeof DropdownOption;
  Separator: typeof DropdownMenuSeparator;
};

/**
 * Menu de ações (compound component) — o formato padrão para a coluna de ações
 * de linha de tabela (`DataTable`).
 *
 * ```tsx
 * <Dropdown>
 *   <Dropdown.Trigger />
 *   <Dropdown.Content>
 *     <Dropdown.Option icon={<Pencil size={16} />} onClick={() => editar(item)}>
 *       Editar
 *     </Dropdown.Option>
 *     <Dropdown.Separator />
 *     <Dropdown.Option icon={<Trash2 size={16} />} variant="danger" onClick={() => excluir(item)}>
 *       Excluir
 *     </Dropdown.Option>
 *   </Dropdown.Content>
 * </Dropdown>
 * ```
 */
export const Dropdown = Object.assign(DropdownBase, {
  Trigger: DropdownTrigger,
  Content: DropdownMenuContent,
  Option: DropdownOption,
  Separator: DropdownMenuSeparator,
}) as DropdownComposto;
