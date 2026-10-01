import { redirect } from "next/navigation";
import { WalletCards } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import AdminLoginForm from "@/components/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: admin } = await supabase
      .from("admin_usuarios")
      .select("id,ativo")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (admin?.ativo) {
      redirect("/");
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-brand">
        <div>
          <div className="admin-login-brand-logo">
            <WalletCards size={25} />
          </div>

          <span>CREDBOX</span>

          <h2>
            Gestão financeira
            <br />
            em um só lugar.
          </h2>

          <p>
            Clientes, veículos, contratos,
            parcelas e recebimentos organizados
            em uma única plataforma.
          </p>
        </div>

        <small>
          CredBox • Área administrativa
        </small>
      </section>

      <section className="admin-login-content">
        <AdminLoginForm />
      </section>
    </main>
  );
}