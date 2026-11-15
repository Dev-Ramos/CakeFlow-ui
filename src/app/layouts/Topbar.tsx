import { Bell, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { Button } from "@/ui/components/Button";
import { Input } from "@/ui/components/Input";

export interface TopbarProps {
  onAbrirMenu: () => void;
}

function iniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");
}

/** Barra superior fixa (64px): menu (celular), busca global, usuário e sair. */
export function Topbar({ onAbrirMenu }: TopbarProps) {
  const { usuario, logout } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-outline-variant bg-surface-container-lowest shadow-sm md:left-[72px] lg:left-64">
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            icon={<Menu size={20} />}
            onClick={onAbrirMenu}
            className="md:hidden"
          />
          <div role="search" className="relative w-full max-w-md">
            <Search
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-tertiary"
            />
            <Input
              type="search"
              aria-label="Buscar"
              placeholder="Buscar pedidos, clientes, receitas…"
              className="bg-background pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Notificações" icon={<Bell size={20} />} />
          <span aria-hidden="true" className="h-6 w-px bg-outline-variant" />
          {usuario && (
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-primary-fixed-dim bg-primary-fixed text-body-md font-bold text-primary"
              >
                {iniciais(usuario.nome)}
              </span>
              <div className="hidden min-w-0 xl:block">
                <p className="truncate text-label-md text-on-surface">{usuario.nome}</p>
                <p className="truncate text-label-sm text-tertiary">{usuario.cargo}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sair"
            title="Sair"
            icon={<LogOut size={20} />}
            onClick={logout}
          />
        </div>
      </div>
    </header>
  );
}
