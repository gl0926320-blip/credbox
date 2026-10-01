import {
  LayoutDashboard,
  Users,
  Car,
  HandCoins,
  CalendarDays,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const navigation: NavigationItem[] = [
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