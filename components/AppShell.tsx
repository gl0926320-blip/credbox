"use client";

import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  /*
   * Portal do cliente e páginas públicas
   * não carregam Sidebar nem MobileHeader
   * do painel administrativo.
   */
  const isPublicRoute =
    pathname === "/login" ||
    pathname.startsWith("/portal");

  if (isPublicRoute) {
    return (
      <div className="public-application">
        {children}
      </div>
    );
  }

  /*
   * Painel administrativo.
   */
  return (
    <div className="application">
      <div className="desktop-sidebar-wrapper">
        <Sidebar />
      </div>

      <MobileHeader
        onMenuClick={() => {
          /*
           * Mantém compatibilidade com
           * a interface atual do MobileHeader.
           *
           * Depois podemos conectar aqui
           * o drawer/menu mobile do admin.
           */
        }}
      />

      <main className="application-content">
        {children}
      </main>
    </div>
  );
}