"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CalendarDays,
  Car,
  ChevronLeft,
  FileText,
  HandCoins,
  LayoutDashboard,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    label: "Veículos",
    href: "/veiculos",
    icon: Car,
  },
  {
    label: "Operações",
    href: "/operacoes",
    icon: HandCoins,
  },
  {
    label: "Parcelas",
    href: "/parcelas",
    icon: CalendarDays,
  },
  {
    label: "Contratos",
    href: "/contratos",
    icon: FileText,
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    icon: Settings,
  },
];

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export default function Sidebar({
  mobile = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  return (
    <aside
      className={`sidebar ${
        mobile ? "sidebar-mobile" : ""
      }`}
    >
      <div className="brand">
        <div className="brand-symbol">
          <WalletCards size={22} strokeWidth={2} />
        </div>

        <div className="brand-copy">
          <strong>CredBox</strong>
          <span>Gestão financeira</span>
        </div>
      </div>

      <div className="sidebar-section-label">
        MENU PRINCIPAL
      </div>

      <nav className="navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`navigation-item ${
                active ? "active" : ""
              }`}
            >
              <Icon size={19} strokeWidth={1.9} />

              <span>{item.label}</span>

              {active && (
                <span className="navigation-active-dot" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-account">
        <div className="sidebar-avatar">GL</div>

        <div className="sidebar-account-copy">
          <strong>Administrador</strong>
          <span>CredBox</span>
        </div>

        <ChevronLeft
          size={16}
          className="sidebar-account-arrow"
        />
      </div>
    </aside>
  );
}