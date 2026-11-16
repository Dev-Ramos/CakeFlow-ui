import {
  BookOpen,
  Cake,
  Ban,
  ChefHat,
  ClipboardList,
  CircleHelp,
  CookingPot,
  KeyRound,
  Layers,
  LayoutDashboard,
  Palette,
  Receipt,
  Tag,
  ShieldCheck,
  Store,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Casa só a rota exata (necessário para o "Início"). */
  end?: boolean;
  /**
   * Permissão necessária para o item aparecer (`recurso.acao`). Com uma lista, basta ter
   * uma delas. Sem ela, é visível a todos.
   */
  permission?: string | string[];
}

/** Grupo expansível: aparece só se ao menos um filho estiver visível. */
export interface NavGroup {
  label: string;
  icon: LucideIcon;
  children: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export function isNavGroup(entrada: NavEntry): entrada is NavGroup {
  return "children" in entrada;
}

/**
 * Módulos da sidebar (ordem do design). Cada item passa a funcionar quando o
 * domínio correspondente registrar sua rota; até lá cai na página "em construção".
 */
export const navPrincipal: NavItem[] = [
  { to: "/", label: "Início", icon: LayoutDashboard, end: true },
  { to: "/pedidos", label: "Pedidos", icon: Receipt, permission: "orders.index" },
  { to: "/fila-do-forno", label: "Fila do Forno", icon: CookingPot },
  { to: "/lista-do-confeiteiro", label: "Lista do Confeiteiro", icon: ChefHat },
  { to: "/decoracao", label: "Decoração", icon: Palette },
  { to: "/bolos-disponiveis", label: "Bolos Disponíveis", icon: Store },
  { to: "/duvidas", label: "Dúvidas", icon: CircleHelp },
];

export const navRodape: NavEntry[] = [
  {
    label: "Catálogo",
    icon: BookOpen,
    children: [
      {
        to: "/catalogo/componentes",
        label: "Componentes",
        icon: Layers,
        permission: ["pan_specs.index", "batter_types.index", "fillings.index"],
      },
      {
        to: "/catalogo/fichas-tecnicas",
        label: "Fichas técnicas",
        icon: ClipboardList,
        permission: "technical_sheets.index",
      },
      {
        to: "/catalogo/tipos-de-bolo",
        label: "Tipos de bolo",
        icon: Cake,
        permission: "cake_types.index",
      },
    ],
  },
  {
    label: "Administração",
    icon: ShieldCheck,
    children: [
      { to: "/administracao/usuarios", label: "Usuários", icon: Users, permission: "users.index" },
      {
        to: "/administracao/cargos",
        label: "Cargos e permissões",
        icon: KeyRound,
        permission: "roles.index",
      },
      {
        to: "/administracao/precos",
        label: "Preços e acréscimos",
        icon: Tag,
        permission: "pricing.index",
      },
      {
        to: "/administracao/solicitacoes-de-cancelamento",
        label: "Solicitações de cancelamento",
        icon: Ban,
        permission: "orders.approve_cancel",
      },
    ],
  },
];

/** Mantém só o que o usuário pode ver; grupos sem filhos visíveis somem. */
export function filtrarPorPermissao(
  entradas: NavEntry[],
  can: (permission: string) => boolean,
): NavEntry[] {
  const visivel = (item: NavItem) => {
    if (!item.permission) return true;
    return (Array.isArray(item.permission) ? item.permission : [item.permission]).some(can);
  };

  return entradas.flatMap((entrada): NavEntry[] => {
    if (!isNavGroup(entrada)) return visivel(entrada) ? [entrada] : [];
    const filhos = entrada.children.filter(visivel);
    return filhos.length > 0 ? [{ ...entrada, children: filhos }] : [];
  });
}
