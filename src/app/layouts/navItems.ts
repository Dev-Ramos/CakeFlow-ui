import {
  BookOpen,
  ChefHat,
  CircleHelp,
  CookingPot,
  LayoutDashboard,
  Palette,
  Receipt,
  ShieldCheck,
  Store,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Casa só a rota exata (necessário para o "Início"). */
  end?: boolean;
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

export const navRodape: NavItem[] = [
  { to: "/catalogo", label: "Catálogo", icon: BookOpen },
  { to: "/administracao", label: "Administração", icon: ShieldCheck },
];
