"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Car,
  CheckCircle2,
  Clock3,
  FileText,
  Pencil,
  Phone,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

type Vehicle = {
  id: string;

  tipo: string;

  marca: string;
  modelo: string;

  placa?: string | null;

  ano_modelo?: number | null;

  ano_fabricacao?: number | null;

  status?: string | null;
};

type ClientVehicleLink = {
  id: string;

  veiculo_id?: string;

  tipo_vinculo: string;

  ativo: boolean;

  data_inicio?: string | null;

  veiculos:
    | Vehicle
    | Vehicle[]
    | null;
};

type Client = {
  id: string;

  nome: string;

  cpf?: string | null;

  rg?: string | null;

  telefone?: string | null;

  telefone_secundario?: string | null;

  email?: string | null;

  data_nascimento?: string | null;

  cnh?: string | null;

  cep?: string | null;

  endereco?: string | null;

  numero?: string | null;

  complemento?: string | null;

  bairro?: string | null;

  cidade?: string | null;

  estado?: string | null;

  contato_emergencia_nome?: string | null;

  contato_emergencia_telefone?: string | null;

  observacoes?: string | null;

  status?: string | null;

  created_at?: string;

  cliente_veiculos?:
    | ClientVehicleLink[]
    | null;
};

interface Props {
  initialClients?: Client[];

  availableVehicles?: Vehicle[];
}

type ApiResponse = {
  success?: boolean;

  error?: string;

  details?: string;

  message?: string;
};

const clientStatusNames:
  Record<string, string> = {
  ativo: "Ativo",
  inativo: "Inativo",
  bloqueado: "Bloqueado",
};

const businessNames:
  Record<string, string> = {
  locacao_compra:
    "Locação com compra final",

  venda_parcelada:
    "Venda parcelada",

  emprestimo_garantia:
    "Empréstimo com garantia",

  cessao: "Cessão",

  outro: "Outro",
};

function formatCPF(
  cpf?: string | null
) {
  if (!cpf) {
    return "—";
  }

  const clean =
    cpf.replace(
      /\D/g,
      ""
    );

  if (
    clean.length !== 11
  ) {
    return cpf;
  }

  return clean.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    "$1.$2.$3-$4"
  );
}

function getCurrentLink(
  client: Client
) {
  const links =
    Array.isArray(
      client.cliente_veiculos
    )
      ? client.cliente_veiculos
      : [];

  return (
    links.find(
      (link) =>
        link.ativo === true
    ) ?? null
  );
}

function getVehicleFromLink(
  link:
    | ClientVehicleLink
    | null
): Vehicle | null {
  if (!link) {
    return null;
  }

  if (
    Array.isArray(
      link.veiculos
    )
  ) {
    return (
      link.veiculos[0] ??
      null
    );
  }

  return (
    link.veiculos ??
    null
  );
}

export default function ClientesManager({
  initialClients = [],
  availableVehicles = [],
}: Props) {
  const router =
    useRouter();

  const clients =
    Array.isArray(
      initialClients
    )
      ? initialClients
      : [];

  const vehicles =
    Array.isArray(
      availableVehicles
    )
      ? availableVehicles
      : [];

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("todos");

  const [
    vehicleFilter,
    setVehicleFilter,
  ] = useState("todos");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingClient,
    setEditingClient,
  ] =
    useState<Client | null>(
      null
    );

  const [
    linkVehicle,
    setLinkVehicle,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const filteredClients =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return clients.filter(
        (client) => {
          const link =
            getCurrentLink(
              client
            );

          const vehicle =
            getVehicleFromLink(
              link
            );

          const searchable =
            [
              client.nome,
              client.cpf,
              client.telefone,
              client.email,
              vehicle?.marca,
              vehicle?.modelo,
              vehicle?.placa,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          const matchSearch =
            !term ||
            searchable.includes(
              term
            );

          const matchStatus =
            statusFilter ===
              "todos" ||
            client.status ===
              statusFilter;

          const hasVehicle =
            vehicle !== null;

          const matchVehicle =
            vehicleFilter ===
              "todos" ||
            (vehicleFilter ===
              "com_veiculo" &&
              hasVehicle) ||
            (vehicleFilter ===
              "espera" &&
              !hasVehicle);

          return (
            matchSearch &&
            matchStatus &&
            matchVehicle
          );
        }
      );
    }, [
      clients,
      search,
      statusFilter,
      vehicleFilter,
    ]);

  function openNewClient() {
    setEditingClient(
      null
    );

    setLinkVehicle(
      false
    );

    setMessage("");

    setModalOpen(
      true
    );
  }

  function openEditClient(
    client: Client
  ) {
    setEditingClient(
      client
    );

    const currentLink =
      getCurrentLink(
        client
      );

    setLinkVehicle(
      currentLink !== null
    );

    setMessage("");

    setModalOpen(
      true
    );
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setEditingClient(
      null
    );

    setLinkVehicle(
      false
    );

    setMessage("");

    setModalOpen(
      false
    );
  }

  async function handleSubmit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);

    setMessage("");

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    formData.set(
      "vincular_veiculo",
      linkVehicle
        ? "true"
        : "false"
    );

    if (
      editingClient
    ) {
      formData.set(
        "id",
        editingClient.id
      );
    }

    try {
      const response =
        await fetch(
          "/api/clientes",
          {
            method:
              editingClient
                ? "PATCH"
                : "POST",

            body: formData,
          }
        );

      const raw =
        await response.text();

      let data:
        ApiResponse = {};

      if (raw) {
        try {
          data =
            JSON.parse(
              raw
            );
        } catch {
          throw new Error(
            raw
          );
        }
      }

      if (
        !response.ok
      ) {
        setMessage(
          data.error ||
            data.details ||
            "Não foi possível salvar o cliente."
        );

        return;
      }

      setModalOpen(
        false
      );

      setEditingClient(
        null
      );

      setLinkVehicle(
        false
      );

      router.refresh();
    } catch (
      error
    ) {
      console.error(
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Erro de comunicação com o servidor."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">
            CADASTROS
          </span>

          <h1>
            Clientes
          </h1>

          <p>
            Gerencie clientes,
            compradores,
            locatários e
            devedores.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={
            openNewClient
          }
        >
          <Plus
            size={17}
          />

          Novo cliente
        </button>
      </header>

      <section className="vehicle-toolbar">
        <div className="vehicle-search">
          <Search
            size={17}
          />

          <input
            type="text"
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="Buscar nome, CPF, telefone, veículo ou placa..."
          />
        </div>

        <select
          value={
            statusFilter
          }
          onChange={(
            event
          ) =>
            setStatusFilter(
              event.target
                .value
            )
          }
        >
          <option value="todos">
            Todos os status
          </option>

          <option value="ativo">
            Ativos
          </option>

          <option value="inativo">
            Inativos
          </option>

          <option value="bloqueado">
            Bloqueados
          </option>
        </select>

        <select
          value={
            vehicleFilter
          }
          onChange={(
            event
          ) =>
            setVehicleFilter(
              event.target
                .value
            )
          }
        >
          <option value="todos">
            Todos
          </option>

          <option value="com_veiculo">
            Com veículo
          </option>

          <option value="espera">
            Em espera
          </option>
        </select>
      </section>

      <section className="vehicle-table-card">
        <div className="vehicle-table-scroll">
          <table className="vehicle-table clients-table">
            <thead>
              <tr>
                <th>
                  Cliente
                </th>

                <th>
                  CPF
                </th>

                <th>
                  Telefone
                </th>

                <th>
                  Veículo
                </th>

                <th>
                  Tipo negócio
                </th>

                <th>
                  Situação
                </th>

                <th>
                  Status
                </th>

                <th>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredClients.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      8
                    }
                    className="vehicle-table-empty"
                  >
                    Nenhum
                    cliente
                    encontrado.
                  </td>
                </tr>
              ) : (
                filteredClients.map(
                  (
                    client
                  ) => {
                    const link =
                      getCurrentLink(
                        client
                      );

                    const vehicle =
                      getVehicleFromLink(
                        link
                      );

                    const status =
                      client.status ??
                      "ativo";

                    return (
                      <tr
                        key={
                          client.id
                        }
                      >
                        <td>
                          <div className="client-table-name">
                            <div className="client-avatar">
                              <UserRound
                                size={
                                  15
                                }
                              />
                            </div>

                            <div>
                              <strong>
                                {
                                  client.nome
                                }
                              </strong>

                              <span>
                                {client.email ||
                                  "Sem e-mail"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="vehicle-nowrap">
                          {formatCPF(
                            client.cpf
                          )}
                        </td>

                        <td className="vehicle-nowrap">
                          {client.telefone ||
                            "—"}
                        </td>

                        <td>
                          {vehicle ? (
                            <div className="client-vehicle">
                              <strong>
                                {
                                  vehicle.marca
                                }{" "}
                                {
                                  vehicle.modelo
                                }
                              </strong>

                              <span>
                                {vehicle.placa ||
                                  "Sem placa"}
                              </span>
                            </div>
                          ) : (
                            <span className="waiting-badge">
                              <Clock3
                                size={
                                  12
                                }
                              />

                              Em espera
                            </span>
                          )}
                        </td>

                        <td>
                          {link
                            ? businessNames[
                                link.tipo_vinculo
                              ] ||
                              link.tipo_vinculo
                            : "—"}
                        </td>

                        <td>
                          {vehicle ? (
                            <span className="client-linked-badge">
                              <CheckCircle2
                                size={
                                  12
                                }
                              />

                              Vinculado
                            </span>
                          ) : (
                            <span className="waiting-badge">
                              Aguardando
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            className={`client-status client-status-${status}`}
                          >
                            {clientStatusNames[
                              status
                            ] ||
                              status}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="vehicle-edit-button"
                            onClick={() =>
                              openEditClient(
                                client
                              )
                            }
                          >
                            <Pencil
                              size={
                                14
                              }
                            />

                            Editar
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

        <footer className="vehicle-table-footer">
          <span>
            {
              filteredClients.length
            }{" "}
            cliente(s)
          </span>
        </footer>
      </section>

      {modalOpen && (
        <div
          className="vehicle-modal-overlay"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="vehicle-modal">
            <header className="vehicle-modal-header">
              <div>
                <span>
                  {editingClient
                    ? "EDITAR CLIENTE"
                    : "NOVO CLIENTE"}
                </span>

                <h2>
                  {editingClient
                    ? "Editar cliente"
                    : "Cadastrar cliente"}
                </h2>

                <p>
                  Dados pessoais,
                  contato e vínculo
                  com veículo.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeModal
                }
              >
                <X
                  size={20}
                />
              </button>
            </header>

            <form
              key={
                editingClient?.id ??
                "new-client"
              }
              onSubmit={
                handleSubmit
              }
            >
              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <UserRound
                    size={18}
                  />

                  <div>
                    <strong>
                      Dados pessoais
                    </strong>

                    <span>
                      Identificação
                      do cliente
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid">
                  <label className="form-full">
                    Nome completo *

                    <input
                      name="nome"
                      required
                      defaultValue={
                        editingClient?.nome ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    CPF

                    <input
                      name="cpf"
                      defaultValue={
                        editingClient?.cpf ??
                        ""
                      }
                      placeholder="000.000.000-00"
                    />
                  </label>

                  <label>
                    RG

                    <input
                      name="rg"
                      defaultValue={
                        editingClient?.rg ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Data de
                    nascimento

                    <input
                      type="date"
                      name="data_nascimento"
                      defaultValue={
                        editingClient?.data_nascimento ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    CNH

                    <input
                      name="cnh"
                      defaultValue={
                        editingClient?.cnh ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Status

                    <select
                      name="status"
                      defaultValue={
                        editingClient?.status ??
                        "ativo"
                      }
                    >
                      <option value="ativo">
                        Ativo
                      </option>

                      <option value="inativo">
                        Inativo
                      </option>

                      <option value="bloqueado">
                        Bloqueado
                      </option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <Phone
                    size={18}
                  />

                  <div>
                    <strong>
                      Contato
                    </strong>

                    <span>
                      Telefones e
                      comunicação
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid">
                  <label>
                    Telefone

                    <input
                      name="telefone"
                      defaultValue={
                        editingClient?.telefone ??
                        ""
                      }
                      placeholder="(62) 99999-9999"
                    />
                  </label>

                  <label>
                    Telefone
                    secundário

                    <input
                      name="telefone_secundario"
                      defaultValue={
                        editingClient?.telefone_secundario ??
                        ""
                      }
                    />
                  </label>

                  <label className="form-full">
                    E-mail

                    <input
                      type="email"
                      name="email"
                      defaultValue={
                        editingClient?.email ??
                        ""
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <FileText
                    size={18}
                  />

                  <div>
                    <strong>
                      Endereço
                    </strong>

                    <span>
                      Residência do
                      cliente
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid">
                  <label>
                    CEP

                    <input
                      name="cep"
                      defaultValue={
                        editingClient?.cep ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Estado

                    <input
                      name="estado"
                      maxLength={
                        2
                      }
                      defaultValue={
                        editingClient?.estado ??
                        ""
                      }
                    />
                  </label>

                  <label className="form-full">
                    Endereço

                    <input
                      name="endereco"
                      defaultValue={
                        editingClient?.endereco ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Número

                    <input
                      name="numero"
                      defaultValue={
                        editingClient?.numero ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Complemento

                    <input
                      name="complemento"
                      defaultValue={
                        editingClient?.complemento ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Bairro

                    <input
                      name="bairro"
                      defaultValue={
                        editingClient?.bairro ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Cidade

                    <input
                      name="cidade"
                      defaultValue={
                        editingClient?.cidade ??
                        ""
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <Users
                    size={18}
                  />

                  <div>
                    <strong>
                      Contato de
                      emergência
                    </strong>

                    <span>
                      Pessoa de
                      referência
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid">
                  <label>
                    Nome

                    <input
                      name="contato_emergencia_nome"
                      defaultValue={
                        editingClient?.contato_emergencia_nome ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Telefone

                    <input
                      name="contato_emergencia_telefone"
                      defaultValue={
                        editingClient?.contato_emergencia_telefone ??
                        ""
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <Car
                    size={18}
                  />

                  <div>
                    <strong>
                      Veículo
                    </strong>

                    <span>
                      Vincule agora ou
                      deixe o cliente em
                      espera
                    </span>
                  </div>
                </div>

                <div className="client-link-choice">
                  <button
                    type="button"
                    className={
                      !linkVehicle
                        ? "client-choice active"
                        : "client-choice"
                    }
                    onClick={() =>
                      setLinkVehicle(
                        false
                      )
                    }
                  >
                    <Clock3
                      size={
                        17
                      }
                    />

                    <div>
                      <strong>
                        Deixar em espera
                      </strong>

                      <span>
                        Cadastrar sem
                        veículo
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={
                      linkVehicle
                        ? "client-choice active"
                        : "client-choice"
                    }
                    onClick={() =>
                      setLinkVehicle(
                        true
                      )
                    }
                  >
                    <Car
                      size={
                        17
                      }
                    />

                    <div>
                      <strong>
                        Vincular veículo
                      </strong>

                      <span>
                        Selecionar
                        disponível
                      </span>
                    </div>
                  </button>
                </div>

                {linkVehicle && (
                  <div className="vehicle-form-grid client-vehicle-fields">
                    <label className="form-full">
                      Veículo disponível *

                      <select
                        name="veiculo_id"
                        required={
                          linkVehicle
                        }
                        defaultValue={
                          getCurrentLink(
                            editingClient ??
                              ({} as Client)
                          )
                            ?.veiculo_id ??
                          ""
                        }
                      >
                        <option value="">
                          Selecione um
                          veículo
                        </option>

                        {vehicles.map(
                          (
                            vehicle
                          ) => (
                            <option
                              value={
                                vehicle.id
                              }
                              key={
                                vehicle.id
                              }
                            >
                              {
                                vehicle.marca
                              }{" "}
                              {
                                vehicle.modelo
                              }
                              {" • "}
                              {vehicle.placa ||
                                "sem placa"}
                              {" • "}
                              {vehicle.ano_modelo ||
                                vehicle.ano_fabricacao ||
                                ""}
                            </option>
                          )
                        )}
                      </select>
                    </label>

                    <label className="form-full">
                      Tipo da operação *

                      <select
                        name="tipo_vinculo"
                        required={
                          linkVehicle
                        }
                        defaultValue={
                          getCurrentLink(
                            editingClient ??
                              ({} as Client)
                          )
                            ?.tipo_vinculo ??
                          "locacao_compra"
                        }
                      >
                        <option value="locacao_compra">
                          Locação com
                          compra final
                        </option>

                        <option value="venda_parcelada">
                          Venda
                          parcelada
                        </option>

                        <option value="emprestimo_garantia">
                          Empréstimo com
                          garantia
                        </option>

                        <option value="cessao">
                          Cessão
                        </option>

                        <option value="outro">
                          Outro
                        </option>
                      </select>
                    </label>
                  </div>
                )}
              </div>

              <div className="vehicle-form-section">
                <label className="vehicle-notes">
                  Observações

                  <textarea
                    name="observacoes"
                    rows={4}
                    defaultValue={
                      editingClient?.observacoes ??
                      ""
                    }
                    placeholder="Informações adicionais sobre o cliente..."
                  />
                </label>
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
                  disabled={
                    saving
                  }
                  onClick={
                    closeModal
                  }
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Salvando..."
                    : editingClient
                      ? "Salvar alterações"
                      : "Cadastrar cliente"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}