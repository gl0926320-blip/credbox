"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

export default function AdminLoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError || !data.user) {
        throw new Error("E-mail ou senha inválidos.");
      }

      const { data: admin, error: adminError } =
        await supabase
          .from("admin_usuarios")
          .select("id,auth_user_id,nome,ativo")
          .eq("auth_user_id", data.user.id)
          .maybeSingle();

      if (
        adminError ||
        !admin ||
        !admin.ativo
      ) {
        await supabase.auth.signOut();

        throw new Error(
          "Este usuário não possui acesso administrativo."
        );
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className="admin-login-form"
    >
      <div className="admin-login-icon">
        <ShieldCheck size={24} />
      </div>

      <div className="admin-login-heading">
        <span>ACESSO ADMINISTRATIVO</span>

        <h1>Entrar no CredBox</h1>

        <p>
          Utilize suas credenciais para acessar
          a gestão financeira.
        </p>
      </div>

      <div className="admin-login-field">
        <label htmlFor="admin-email">
          E-mail
        </label>

        <div className="admin-login-input">
          <Mail size={17} />

          <input
            id="admin-email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />
        </div>
      </div>

      <div className="admin-login-field">
        <label htmlFor="admin-password">
          Senha
        </label>

        <div className="admin-login-input">
          <LockKeyhole size={17} />

          <input
            id="admin-password"
            type={
              showPassword
                ? "text"
                : "password"
            }
            autoComplete="current-password"
            placeholder="Sua senha"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword(
                (current) => !current
              )
            }
            aria-label={
              showPassword
                ? "Ocultar senha"
                : "Mostrar senha"
            }
          >
            {showPassword ? (
              <EyeOff size={17} />
            ) : (
              <Eye size={17} />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-login-error">
          {error}
        </div>
      )}

      <button
        type="submit"
        className="admin-login-submit"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2
              size={17}
              className="admin-login-spinner"
            />

            Entrando...
          </>
        ) : (
          <>
            Entrar no painel
            <ArrowRight size={17} />
          </>
        )}
      </button>
    </form>
  );
}