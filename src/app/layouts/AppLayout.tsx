import { useState } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

/** Shell autenticado: sidebar + topbar fixas e a área de conteúdo (`Outlet`). */
export function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        Ir para o conteúdo
      </a>
      <Sidebar aberto={menuAberto} onFechar={() => setMenuAberto(false)} />
      <Topbar onAbrirMenu={() => setMenuAberto(true)} />
      <main
        id="conteudo"
        tabIndex={-1}
        className="mt-16 p-4 focus:outline-none md:ml-[72px] md:p-6 lg:ml-64 lg:p-8"
      >
        <Outlet />
      </main>
    </div>
  );
}
