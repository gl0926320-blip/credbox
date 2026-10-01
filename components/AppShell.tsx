"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";

import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  /*
   * LOGIN ADMIN + PORTAL DO CLIENTE
   * não utilizam o layout administrativo.
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

  return (
    <div className="application">
      {/* SIDEBAR DESKTOP */}
      <aside className="desktop-sidebar-wrapper">
        <Sidebar />
      </aside>

      {/* HEADER MOBILE */}
      <MobileHeader
        onMenuClick={() =>
          setMobileMenuOpen(true)
        }
      />

      {/* MENU MOBILE */}
      {mobileMenuOpen && (
        <>
          <button
            type="button"
            className="mobile-sidebar-backdrop"
            aria-label="Fechar menu"
            onClick={() =>
              setMobileMenuOpen(false)
            }
          />

          <aside className="mobile-sidebar-wrapper">
            <Sidebar />
          </aside>
        </>
      )}

      {/* CONTEÚDO */}
      <main className="application-content">
        {children}
      </main>
    </div>
  );
}