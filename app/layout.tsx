import type { Metadata } from "next";

import "./globals.css";

import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: {
    default: "CredBox",
    template: "%s | CredBox",
  },

  description:
    "Sistema para gestão de clientes, veículos, contratos, operações e recebimentos.",

  applicationName: "CredBox",

  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}