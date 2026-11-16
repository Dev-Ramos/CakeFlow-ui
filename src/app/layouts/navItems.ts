import {
  BookOpen,
  ChefHat,
  CircleHelp,
  CookingPot,
  KeyRound,
  LayoutDashboard,
  Palette,
  Receipt,
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
  /** Permissão necessária para o item aparecer (`recurso.acao`). Sem ela, é visível a todos. */
  permission?: string;
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
  { to: "/pedidos", label: "Pedidos", icon: Receipt },
  { to: "/fila-do-forno", label: "Fila do Forno", icon: CookingPot },
  { to: "/lista-do-confeiteiro", label: "Lista do Confeiteiro", icon: ChefHat },
  { to: "/decoracao", label: "Decoração", icon: Palette },
  { to: "/bolos-disponiveis", label: "Bolos Disponíveis", icon: Store },
  { to: "/duvidas", label: "Dúvidas", icon: CircleHelp },
];

export const navRodape: NavEntry[] = [
  { to: "/catalogo", label: "Catálogo", icon: BookOpen },
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
    ],
  },
];

/** Mantém só o que o usuário pode ver; grupos sem filhos visíveis somem. */
export function filtrarPorPermissao(
  entradas: NavEntry[],
  can: (permission: string) => boolean,
): NavEntry[] {
  const visivel = (item: NavItem) => !item.permission || can(item.permission);

  return entradas.flatMap((entrada): NavEntry[] => {
    if (!isNavGroup(entrada)) return visivel(entrada) ? [entrada] : [];
    const filhos = entrada.children.filter(visivel);
    return filhos.length > 0 ? [{ ...entrada, children: filhos }] : [];
  });
}
