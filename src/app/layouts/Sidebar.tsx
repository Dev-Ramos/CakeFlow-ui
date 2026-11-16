import { useId, useState } from "react";
import { Cake, ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { cn } from "@/ui/lib/cn";
import {
  filtrarPorPermissao,
  isNavGroup,
  navPrincipal,
  navRodape,
  type NavGroup,
  type NavItem,
} from "./navItems";

/** No tablet a sidebar vira um dock só de ícones (72px): esconde os rótulos. */
const rotulo = "md:max-lg:hidden";

const baseDoItem = cn(
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-on-surface-variant",
  "transition-all duration-150 active:scale-[0.99]",
  "hover:bg-surface-container-low hover:text-on-surface",
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
);

const itemAtivo = "bg-surface-container text-primary hover:text-primary";

function ItemDeNavegacao({
  item,
  onNavegar,
  semIcone = false,
}: {
  item: NavItem;
  onNavegar: () => void;
  semIcone?: boolean;
}) {
  const Icone = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      title={item.label}
      onClick={onNavegar}
      className={({ isActive }) =>
        cn(baseDoItem, "md:max-lg:justify-center", isActive && itemAtivo)
      }
    >
      {!semIcone && <Icone size={20} aria-hidden="true" className="shrink-0" />}
      <span className={cn("text-label-md", !semIcone && rotulo)}>{item.label}</span>
    </NavLink>
  );
}

/** Grupo expansível. No dock do tablet vira um atalho (ícone) para o primeiro filho. */
function GrupoDeNavegacao({ grupo, onNavegar }: { grupo: NavGroup; onNavegar: () => void }) {
  const { pathname } = useLocation();
  const ativo = grupo.children.some((filho) => pathname.startsWith(filho.to));
  const [aberto, setAberto] = useState(ativo);
  const painelId = useId();
  const Icone = grupo.icon;

  return (
    <div>
      <NavLink
        to={grupo.children[0].to}
        aria-label={grupo.label}
        title={grupo.label}
        onClick={onNavegar}
        className={cn(baseDoItem, "hidden md:max-lg:flex md:max-lg:justify-center", ativo && itemAtivo)}
      >
        <Icone size={20} aria-hidden="true" />
      </NavLink>

      <div className={rotulo}>
        <button
          type="button"
          aria-expanded={aberto}
          aria-controls={painelId}
          onClick={() => setAberto((atual) => !atual)}
          className={cn(baseDoItem, "w-full", ativo && "text-primary")}
        >
          <Icone size={20} aria-hidden="true" className="shrink-0" />
          <span className="flex-1 text-left text-label-md">{grupo.label}</span>
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={cn("shrink-0 transition-transform", aberto && "rotate-180")}
          />
        </button>
        {aberto && (
          <ul id={painelId} className="mt-1 space-y-1 pl-4">
            {grupo.children.map((filho) => (
              <li key={filho.to}>
                <ItemDeNavegacao item={filho} onNavegar={onNavegar} semIcone />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export interface SidebarProps {
  /** Drawer aberto (só tem efeito no celular; de `md` para cima a sidebar é fixa). */
  aberto: boolean;
  onFechar: () => void;
}

/** Navegação principal: fixa (256px) no desktop, dock de ícones (72px) no tablet, drawer no celular. */
export function Sidebar({ aberto, onFechar }: SidebarProps) {
  const { can } = useAuth();
  const principal = filtrarPorPermissao(navPrincipal, can) as NavItem[];
  const rodape = filtrarPorPermissao(navRodape, can);

  return (
    <>
      {aberto && (
        <div className="fixed inset-0 z-40 bg-scrim md:hidden" onClick={onFechar} aria-hidden="true" />
      )}
      <aside
        aria-label="Navegação principal"
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-outline-variant",
          "bg-surface-container-lowest shadow-sm transition-transform",
          "md:w-[72px] md:translate-x-0 lg:w-64",
          aberto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
          <div>
            <div className="mb-6 flex items-center gap-3 md:max-lg:justify-center">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary shadow-sm">
                <Cake size={22} aria-hidden="true" />
              </div>
              <div className={rotulo}>
                <p className="text-headline-md leading-tight tracking-tight text-primary">Cakeflow</p>
                <p className="text-body-sm text-tertiary">Atelier Confeitaria</p>
              </div>
            </div>

            {/* <Link
              to="/pedidos/novo"
              aria-label="Novo Pedido"
              onClick={onFechar}
              className={cn(buttonVariants(), "mb-6 w-full md:max-lg:px-0")}
            >
              <CirclePlus size={18} aria-hidden="true" />
              <span className={rotulo}>Novo Pedido</span>
            </Link> */}

            <nav aria-label="Módulos" className="space-y-1">
              {principal.map((item) => (
                <ItemDeNavegacao key={item.to} item={item} onNavegar={onFechar} />
              ))}
            </nav>
          </div>

          {rodape.length > 0 && (
            <nav
              aria-label="Configurações"
              className="mt-4 space-y-1 border-t border-outline-variant pt-4"
            >
              {rodape.map((entrada) =>
                isNavGroup(entrada) ? (
                  <GrupoDeNavegacao key={entrada.label} grupo={entrada} onNavegar={onFechar} />
                ) : (
                  <ItemDeNavegacao key={entrada.to} item={entrada} onNavegar={onFechar} />
                ),
              )}
            </nav>
          )}
        </div>
      </aside>
    </>
  );
}
