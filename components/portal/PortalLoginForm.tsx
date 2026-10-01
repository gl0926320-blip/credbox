"use client";

import {
  useState,
} from "react";

import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/client";

export default function PortalLoginForm() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  async function handleLogin(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase =
        createClient();

      const {
        data,
        error:
          loginError,
      } =
        await supabase
          .auth
          .signInWithPassword({
            email:
              email
                .trim()
                .toLowerCase(),

            password,
          });

      if (
        loginError ||
        !data.user
      ) {
        setError(
          "E-mail ou senha incorretos."
        );

        return;
      }

      /*
       * Verifica se é realmente
       * usuário do Portal CredBox.
       */

      const response =
        await fetch(
          "/api/portal/me",
          {
            method: "GET",

            cache:
              "no-store",
          }
        );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        await supabase.auth.signOut();

        setError(
          result.error ||
            "Este usuário não possui acesso ao portal."
        );

        return;
      }

      router.replace(
        "/portal"
      );

      router.refresh();
    } catch (
      loginError
    ) {
      console.error(
        loginError
      );

      setError(
        "Não foi possível entrar. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="portal-login-page">
      <section className="portal-login-brand">
        <div className="portal-login-brand-content">
          <div className="portal-login-logo">
            <div>
              <WalletCards
                size={24}
              />
            </div>

            <section>
              <strong>
                CredBox
              </strong>

              <span>
                Gestão financeira
              </span>
            </section>
          </div>

          <div className="portal-login-presentation">
            <span>
              PORTAL DO CLIENTE
            </span>

            <h1>
              Sua vida financeira,
              organizada em um só lugar.
            </h1>

            <p>
              Consulte seus contratos,
              parcelas, pagamentos,
              saldo restante e condições
              de antecipação.
            </p>
          </div>

          <div className="portal-login-benefits">
            <article>
              <div>
                <ShieldCheck
                  size={17}
                />
              </div>

              <section>
                <strong>
                  Ambiente seguro
                </strong>

                <span>
                  Seus dados ficam
                  disponíveis somente
                  para sua conta.
                </span>
              </section>
            </article>

            <article>
              <div>
                <WalletCards
                  size={17}
                />
              </div>

              <section>
                <strong>
                  Controle financeiro
                </strong>

                <span>
                  Consulte pagamentos,
                  saldo e próximas
                  parcelas.
                </span>
              </section>
            </article>

            <article>
              <div>
                <KeyRound
                  size={17}
                />
              </div>

              <section>
                <strong>
                  Acesso individual
                </strong>

                <span>
                  Utilize as credenciais
                  fornecidas pelo
                  CredBox.
                </span>
              </section>
            </article>
          </div>

          <footer className="portal-login-brand-footer">
            CredBox • Gestão financeira
          </footer>
        </div>
      </section>

      <section className="portal-login-area">
        <div className="portal-login-mobile-logo">
          <div>
            <WalletCards
              size={21}
            />
          </div>

          <section>
            <strong>
              CredBox
            </strong>

            <span>
              Portal do Cliente
            </span>
          </section>
        </div>

        <div className="portal-login-card">
          <div className="portal-login-card-icon">
            <LockKeyhole
              size={22}
            />
          </div>

          <div className="portal-login-heading">
            <span>
              ACESSO SEGURO
            </span>

            <h2>
              Acesse sua conta
            </h2>

            <p>
              Informe seu e-mail e
              senha para consultar seus
              dados financeiros.
            </p>
          </div>

          <form
            onSubmit={
              handleLogin
            }
          >
            <label className="portal-login-field">
              E-mail

              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target
                      .value
                  )
                }
                placeholder="seu@email.com"
              />
            </label>

            <label className="portal-login-field">
              Senha

              <div className="portal-password-field">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  autoComplete="current-password"
                  required
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event.target
                        .value
                    )
                  }
                  placeholder="Digite sua senha"
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Ocultar senha"
                      : "Mostrar senha"
                  }
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword ? (
                    <EyeOff
                      size={
                        17
                      }
                    />
                  ) : (
                    <Eye
                      size={
                        17
                      }
                    />
                  )}
                </button>
              </div>
            </label>

            {error && (
              <div className="portal-login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="portal-login-button"
              disabled={
                loading
              }
            >
              <span>
                {loading
                  ? "Entrando..."
                  : "Entrar no portal"}
              </span>

              {!loading && (
                <ArrowRight
                  size={
                    17
                  }
                />
              )}
            </button>
          </form>

          <div className="portal-login-help">
            <ShieldCheck
              size={14}
            />

            <p>
              Não compartilhe sua
              senha. Em caso de
              problemas com seu
              acesso, entre em contato
              com o responsável pelo
              CredBox.
            </p>
          </div>
        </div>

        <footer className="portal-login-mobile-footer">
          © 2026 CredBox
        </footer>
      </section>
    </main>
  );
}