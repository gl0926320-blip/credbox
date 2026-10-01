"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  Copy,
  Eye,
  KeyRound,
  Link2,
  Lock,
  Percent,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

type Client = {
  id: string;
  nome: string;
  cpf?: string | null;
  telefone?: string | null;
  email?: string | null;
  data_nascimento?: string | null;
  status?: string | null;
};

type PortalUser = {
  id: string;
  auth_user_id: string;
  cliente_id: string;
  ativo: boolean;
  primeiro_acesso: boolean;
  ultimo_acesso?: string | null;
  created_at?: string | null;

  clientes:
    | {
        id: string;
        nome: string;
        cpf?: string | null;
        telefone?: string | null;
        email?: string | null;
      }
    | {
        id: string;
        nome: string;
        cpf?: string | null;
        telefone?: string | null;
        email?: string | null;
      }[]
    | null;
};

type PortalConfig = {
  id: string;
  desconto_antecipacao_ativo: boolean;
  desconto_maximo_percentual: number;
  mensagem_antecipacao?: string | null;
  mostrar_contratos: boolean;
  mostrar_comprovantes: boolean;
  mostrar_veiculo: boolean;
};

interface Props {
  clients?: Client[];
  portalUsers?: PortalUser[];
  config?: PortalConfig | null;
}

function single<T>(
  value: T | T[] | null | undefined
): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default function ConfiguracoesManager({
  clients = [],
  portalUsers = [],
  config,
}: Props) {
  const router = useRouter();

  const safeClients =
    Array.isArray(clients)
      ? clients
      : [];

  const safePortalUsers =
    Array.isArray(portalUsers)
      ? portalUsers
      : [];

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    generatedAccess,
    setGeneratedAccess,
  ] = useState<{
    email: string;
    password: string;
    portalUrl: string;
  } | null>(null);

  const filteredUsers =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return safePortalUsers.filter(
        (portalUser) => {
          const client =
            single(
              portalUser.clientes
            );

          const text =
            [
              client?.nome,
              client?.cpf,
              client?.telefone,
              client?.email,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return (
            !term ||
            text.includes(term)
          );
        }
      );
    }, [
      safePortalUsers,
      search,
    ]);

  const clientsWithoutAccess =
    safeClients.filter(
      (client) =>
        !safePortalUsers.some(
          (portalUser) =>
            portalUser.cliente_id ===
            client.id
        )
    );

  async function createPortalUser(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setMessage("");
    setGeneratedAccess(null);

    const formData =
      new FormData(
        event.currentTarget
      );

    try {
      const response =
        await fetch(
          "/api/portal/usuarios",
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setMessage(
          data.error ||
            "Não foi possível criar o acesso."
        );

        return;
      }

      setGeneratedAccess({
        email:
          data.email,
        password:
          data.password,
        portalUrl:
          `${window.location.origin}/portal/login`,
      });

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Erro de comunicação."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleUser(
    portalUser: PortalUser
  ) {
    try {
      await fetch(
        "/api/portal/usuarios",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id:
              portalUser.id,

            ativo:
              !portalUser.ativo,
          }),
        }
      );

      router.refresh();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">
            SISTEMA
          </span>

          <h1>
            Configurações
          </h1>

          <p>
            Usuários,
            portal do cliente
            e regras do CredBox.
          </p>
        </div>
      </header>

      <section className="settings-hero-grid">
        <article>
          <div className="settings-hero-icon">
            <Users />
          </div>

          <span>
            Usuários do portal
          </span>

          <strong>
            {
              safePortalUsers.length
            }
          </strong>

          <small>
            acessos criados
          </small>
        </article>

        <article>
          <div className="settings-hero-icon green">
            <CheckCircle2 />
          </div>

          <span>
            Ativos
          </span>

          <strong>
            {
              safePortalUsers.filter(
                (user) =>
                  user.ativo
              ).length
            }
          </strong>

          <small>
            podem acessar
          </small>
        </article>

        <article>
          <div className="settings-hero-icon blue">
            <Percent />
          </div>

          <span>
            Antecipação
          </span>

          <strong>
            Até{" "}
            {Number(
              config?.desconto_maximo_percentual ??
                90
            ).toFixed(0)}
            %
          </strong>

          <small>
            desconto configurado
          </small>
        </article>
      </section>

      <section className="settings-panel">
        <header className="settings-panel-header">
          <div>
            <span>
              PORTAL DO CLIENTE
            </span>

            <h2>
              Usuários
            </h2>

            <p>
              Crie acessos ligados
              diretamente aos
              clientes cadastrados.
            </p>
          </div>

          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setGeneratedAccess(
                null
              );

              setMessage("");

              setModalOpen(
                true
              );
            }}
          >
            <Plus size={16} />

            Criar acesso
          </button>
        </header>

        <div className="settings-user-search">
          <Search size={16} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Buscar cliente, CPF, telefone ou e-mail..."
          />
        </div>

        <div className="vehicle-table-scroll">
          <table className="vehicle-table settings-users-table">
            <thead>
              <tr>
                <th>
                  Cliente
                </th>

                <th>
                  Login
                </th>

                <th>
                  Primeiro acesso
                </th>

                <th>
                  Último acesso
                </th>

                <th>
                  Status
                </th>

                <th>
                  Ação
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="vehicle-table-empty"
                  >
                    Nenhum usuário
                    do portal criado.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(
                  (portalUser) => {
                    const client =
                      single(
                        portalUser.clientes
                      );

                    return (
                      <tr
                        key={
                          portalUser.id
                        }
                      >
                        <td>
                          <div className="settings-client">
                            <div>
                              <UserRound
                                size={14}
                              />
                            </div>

                            <section>
                              <strong>
                                {client?.nome ??
                                  "—"}
                              </strong>

                              <span>
                                {client?.telefone ??
                                  ""}
                              </span>
                            </section>
                          </div>
                        </td>

                        <td>
                          {client?.email ??
                            "—"}
                        </td>

                        <td>
                          {portalUser.primeiro_acesso
                            ? "Pendente"
                            : "Concluído"}
                        </td>

                        <td>
                          {portalUser.ultimo_acesso
                            ? new Date(
                                portalUser.ultimo_acesso
                              ).toLocaleString(
                                "pt-BR"
                              )
                            : "Nunca"}
                        </td>

                        <td>
                          <span
                            className={
                              portalUser.ativo
                                ? "portal-user-status active"
                                : "portal-user-status blocked"
                            }
                          >
                            {portalUser.ativo
                              ? "Ativo"
                              : "Bloqueado"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="vehicle-edit-button"
                            onClick={() =>
                              toggleUser(
                                portalUser
                              )
                            }
                          >
                            {portalUser.ativo
                              ? "Bloquear"
                              : "Ativar"}
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="settings-panel">
        <header className="settings-panel-header">
          <div>
            <span>
              EXPERIÊNCIA
            </span>

            <h2>
              Portal do cliente
            </h2>

            <p>
              Informações que o
              cliente poderá consultar.
            </p>
          </div>
        </header>

        <div className="portal-feature-grid">
          <article>
            <WalletFeature
              icon={
                <FileText />
              }
              title="Contratos"
              description="Consultar contratos vinculados."
              enabled={
                config?.mostrar_contratos ??
                true
              }
            />
          </article>

          <article>
            <WalletFeature
              icon={
                <ReceiptText />
              }
              title="Comprovantes"
              description="Visualizar histórico e comprovantes."
              enabled={
                config?.mostrar_comprovantes ??
                true
              }
            />
          </article>

          <article>
            <WalletFeature
              icon={
                <Eye />
              }
              title="Veículo"
              description="Consultar veículo vinculado."
              enabled={
                config?.mostrar_veiculo ??
                true
              }
            />
          </article>

          <article>
            <WalletFeature
              icon={
                <Percent />
              }
              title="Antecipação"
              description={`Até ${Number(
                config?.desconto_maximo_percentual ??
                  90
              ).toFixed(
                0
              )}% conforme condição definida.`}
              enabled={
                config?.desconto_antecipacao_ativo ??
                true
              }
            />
          </article>
        </div>
      </section>

      {modalOpen && (
        <div className="vehicle-modal-overlay">
          <div className="portal-user-modal">
            <header className="vehicle-modal-header">
              <div>
                <span>
                  NOVO ACESSO
                </span>

                <h2>
                  Criar usuário
                </h2>

                <p>
                  O usuário ficará
                  vinculado ao
                  cliente escolhido.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setModalOpen(
                    false
                  )
                }
              >
                <X size={20} />
              </button>
            </header>

            {!generatedAccess ? (
              <form
                onSubmit={
                  createPortalUser
                }
              >
                <div className="vehicle-form-section">
                  <div className="vehicle-form-section-title">
                    <UserRound
                      size={18}
                    />

                    <div>
                      <strong>
                        Cliente
                      </strong>

                      <span>
                        Cliente que
                        terá acesso
                        ao portal.
                      </span>
                    </div>
                  </div>

                  <div className="vehicle-form-grid">
                    <label className="form-full">
                      Cliente *

                      <select
                        name="cliente_id"
                        required
                        defaultValue=""
                      >
                        <option
                          value=""
                          disabled
                        >
                          Selecione
                        </option>

                        {clientsWithoutAccess.map(
                          (client) => (
                            <option
                              key={
                                client.id
                              }
                              value={
                                client.id
                              }
                            >
                              {
                                client.nome
                              }
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  </div>
                </div>

                <div className="vehicle-form-section">
                  <div className="vehicle-form-section-title">
                    <KeyRound
                      size={18}
                    />

                    <div>
                      <strong>
                        Credenciais
                      </strong>

                      <span>
                        Acesso inicial.
                      </span>
                    </div>
                  </div>

                  <div className="vehicle-form-grid">
                    <label className="form-full">
                      E-mail de acesso *

                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="cliente@email.com"
                      />
                    </label>

                    <label className="form-full">
                      Senha temporária *

                      <input
                        type="text"
                        name="password"
                        required
                        minLength={8}
                        placeholder="Mínimo 8 caracteres"
                      />
                    </label>
                  </div>

                  <div className="portal-security-notice">
                    <ShieldCheck
                      size={17}
                    />

                    <div>
                      <strong>
                        Acesso individual
                      </strong>

                      <span>
                        Este usuário só
                        poderá visualizar
                        informações do
                        cliente vinculado.
                      </span>
                    </div>
                  </div>
                </div>

                {message && (
                  <div className="form-error">
                    {message}
                  </div>
                )}

                <footer className="vehicle-modal-footer">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setModalOpen(
                        false
                      )
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving}
                  >
                    {saving
                      ? "Criando..."
                      : "Criar acesso"}
                  </button>
                </footer>
              </form>
            ) : (
              <div className="portal-access-created">
                <div className="portal-access-success">
                  <CheckCircle2
                    size={27}
                  />

                  <h3>
                    Acesso criado
                  </h3>

                  <p>
                    Envie os dados
                    abaixo ao cliente.
                  </p>
                </div>

                <div className="portal-credentials">
                  <div>
                    <span>
                      Link
                    </span>

                    <strong>
                      {
                        generatedAccess.portalUrl
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Usuário
                    </span>

                    <strong>
                      {
                        generatedAccess.email
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Senha temporária
                    </span>

                    <strong>
                      {
                        generatedAccess.password
                      }
                    </strong>
                  </div>
                </div>

                <footer className="vehicle-modal-footer">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() =>
                      setModalOpen(
                        false
                      )
                    }
                  >
                    Concluir
                  </button>
                </footer>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WalletFeature({
  icon,
  title,
  description,
  enabled,
}: {
  icon:
    React.ReactNode;
  title:
    string;
  description:
    string;
  enabled:
    boolean;
}) {
  return (
    <div className="portal-feature">
      <div className="portal-feature-icon">
        {icon}
      </div>

      <div>
        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>
      </div>

      <span
        className={
          enabled
            ? "portal-feature-state active"
            : "portal-feature-state"
        }
      >
        {enabled
          ? "Ativo"
          : "Desativado"}
      </span>
    </div>
  );
}

function FileText() {
  return (
    <FileTextIcon />
  );
}

function FileTextIcon() {
  return (
    <FileTextBase />
  );
}

function FileTextBase() {
  return null;
}

function ReceiptText() {
  return (
    <ReceiptTextBase />
  );
}

function ReceiptTextBase() {
  return null;
}