"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function PortalLogoutButton() {
  const router = useRouter();

  async function logout() {
    try {
      const supabase = createClient();

      await supabase.auth.signOut();

      router.replace("/portal/login");
      router.refresh();
    } catch (error) {
      console.error("Erro ao sair:", error);
      window.location.href = "/portal/login";
    }
  }

  return (
    <button
      type="button"
      className="client-portal-logout"
      onClick={logout}
    >
      <LogOut size={15} />
      <span>Sair</span>
    </button>
  );
}