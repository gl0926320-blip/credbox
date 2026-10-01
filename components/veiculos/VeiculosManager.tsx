"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Bike,
  Car,
  CheckCircle2,
  FileText,
  Gauge,
  Pencil,
  Plus,
  Search,
  Truck,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";

type VehicleDocument = {
  id: string;
  tipo: string;
  nome_arquivo: string;
  caminho_storage: string;
};

type VehicleClient = {
  id: string;
  nome: string;
  cpf?: string | null;
  telefone?: string | null;
};

type VehicleLink = {
  id: string;
  ativo: boolean;
  tipo_vinculo: string;
  data_inicio?: string | null;
  clientes:
    | VehicleClient
    | VehicleClient[]
    | null;
};

type Vehicle = {
  id: string;
  tipo: string;

  marca: string;
  modelo: string;
  versao?: string | null;

  ano_fabricacao?: number | null;
  ano_modelo?: number | null;

  placa?: string | null;
  renavam?: string | null;
  chassi?: string | null;

  cor?: string | null;
  combustivel?: string | null;
  cambio?: string | null;

  quilometragem?: number | null;

  valor_compra?: number | null;
  valor_fipe?: number | null;
  valor_venda?: number | null;

  data_compra?: string | null;

  status?: string | null;

  observacoes?: string | null;

  created_at?: string;

  veiculo_documentos?: VehicleDocument[] | null;

  cliente_veiculos?: VehicleLink[] | null;
};

interface Props {
  initialVehicles?: Vehicle[];
}

type ApiResponse = {
  success?: boolean;
  error?: string;
  details?: string;
  message?: string;
  uploadErrors?: string[];
};

const statusNames: Record<string, string> = {
  disponivel: "Disponível",
  negociacao: "Em negociação",
  vendido: "Vendido",
  locado: "Locado",
  quitado: "Quitado",
  manutencao: "Manutenção",
  inativo: "Inativo",
};

function formatCurrency(
  value?: number | null
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(Number(value));
}

function VehicleIcon({
  type,
}: {
  type: string;
}) {
  if (type === "moto") {
    return <Bike size={17} />;
  }

  if (
    type === "caminhao" ||
    type === "utilitario" ||
    type === "van"
  ) {
    return <Truck size={17} />;
  }

  return <Car size={17} />;
}

function getCurrentLink(
  vehicle: Vehicle
) {
  const links =
    Array.isArray(
      vehicle.cliente_veiculos
    )
      ? vehicle.cliente_veiculos
      : [];

  return (
    links.find(
      (link) =>
        link.ativo === true
    ) ?? null
  );
}

function getCurrentClient(
  vehicle: Vehicle
): VehicleClient | null {
  const link =
    getCurrentLink(vehicle);

  if (!link) {
    return null;
  }

  if (
    Array.isArray(
      link.clientes
    )
  ) {
    return (
      link.clientes[0] ??
      null
    );
  }

  return link.clientes ?? null;
}

export default function VeiculosManager({
  initialVehicles = [],
}: Props) {
  const router = useRouter();

  const vehicles =
    Array.isArray(
      initialVehicles
    )
      ? initialVehicles
      : [];

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingVehicle,
    setEditingVehicle,
  ] =
    useState<Vehicle | null>(
      null
    );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("todos");

  const [
    tipo,
    setTipo,
  ] = useState("todos");

  const [
    clientFilter,
    setClientFilter,
  ] = useState("todos");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const filteredVehicles =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return vehicles.filter(
        (vehicle) => {
          const client =
            getCurrentClient(
              vehicle
            );

          const searchable =
            [
              vehicle.marca,
              vehicle.modelo,
              vehicle.versao,
              vehicle.placa,
              vehicle.renavam,
              client?.nome,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          const matchSearch =
            !term ||
            searchable.includes(
              term
            );

          const matchType =
            tipo === "todos" ||
            vehicle.tipo === tipo;

          const matchStatus =
            status === "todos" ||
            vehicle.status ===
              status;

          const hasClient =
            client !== null;

          const matchClient =
            clientFilter ===
              "todos" ||
            (clientFilter ===
              "com_cliente" &&
              hasClient) ||
            (clientFilter ===
              "sem_cliente" &&
              !hasClient);

          return (
            matchSearch &&
            matchType &&
            matchStatus &&
            matchClient
          );
        }
      );
    }, [
      vehicles,
      search,
      tipo,
      status,
      clientFilter,
    ]);

  function openNewVehicle() {
    setEditingVehicle(null);
    setMessage("");
    setModalOpen(true);
  }

  function openEditVehicle(
    vehicle: Vehicle
  ) {
    setEditingVehicle(
      vehicle
    );

    setMessage("");

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setEditingVehicle(null);
    setMessage("");
    setModalOpen(false);
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
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

    if (editingVehicle) {
      formData.set(
        "id",
        editingVehicle.id
      );
    }

    try {
      const response =
        await fetch(
          "/api/veiculos",
          {
            method:
              editingVehicle
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
            JSON.parse(raw);
        } catch {
          throw new Error(
            raw
          );
        }
      }

      if (!response.ok) {
        setMessage(
          data.error ||
            data.details ||
            "Não foi possível salvar o veículo."
        );

        return;
      }

      if (
        data.uploadErrors &&
        data.uploadErrors.length
      ) {
        console.warn(
          data.uploadErrors
        );
      }

      form.reset();

      setEditingVehicle(
        null
      );

      setModalOpen(false);

      router.refresh();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Falha de comunicação com o servidor."
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
            PATRIMÔNIO
          </span>

          <h1>
            Veículos
          </h1>

          <p>
            Controle sua
            frota, situação,
            valores e vínculos.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={
            openNewVehicle
          }
        >
          <Plus size={17} />

          Novo veículo
        </button>
      </header>

      <section className="vehicle-toolbar">
        <div className="vehicle-search">
          <Search
            size={17}
          />

          <input
            value={search}
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="Buscar veículo, placa, RENAVAM ou cliente..."
          />
        </div>

        <select
          value={tipo}
          onChange={(
            event
          ) =>
            setTipo(
              event.target
                .value
            )
          }
        >
          <option value="todos">
            Todos os tipos
          </option>

          <option value="carro">
            Carro
          </option>

          <option value="moto">
            Moto
          </option>

          <option value="utilitario">
            Utilitário
          </option>

          <option value="van">
            Van
          </option>

          <option value="caminhao">
            Caminhão
          </option>

          <option value="outro">
            Outro
          </option>
        </select>

        <select
          value={status}
          onChange={(
            event
          ) =>
            setStatus(
              event.target
                .value
            )
          }
        >
          <option value="todos">
            Todos os status
          </option>

          <option value="disponivel">
            Disponível
          </option>

          <option value="negociacao">
            Em negociação
          </option>

          <option value="locado">
            Locado
          </option>

          <option value="vendido">
            Vendido
          </option>

          <option value="quitado">
            Quitado
          </option>

          <option value="manutencao">
            Manutenção
          </option>

          <option value="inativo">
            Inativo
          </option>
        </select>

        <select
          value={
            clientFilter
          }
          onChange={(
            event
          ) =>
            setClientFilter(
              event.target
                .value
            )
          }
        >
          <option value="todos">
            Todos os vínculos
          </option>

          <option value="com_cliente">
            Com cliente
          </option>

          <option value="sem_cliente">
            Sem cliente
          </option>
        </select>
      </section>

      <section className="vehicle-table-card">
        <div className="vehicle-table-scroll">
          <table className="vehicle-table">
            <thead>
              <tr>
                <th>
                  Veículo
                </th>

                <th>
                  Placa
                </th>

                <th>
                  Ano
                </th>

                <th>
                  Cliente atual
                </th>

                <th>
                  Status
                </th>

                <th>
                  Compra
                </th>

                <th>
                  FIPE
                </th>

                <th>
                  Venda
                </th>

                <th>
                  KM
                </th>

                <th>
                  Docs
                </th>

                <th className="vehicle-actions-column">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredVehicles.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      11
                    }
                    className="vehicle-table-empty"
                  >
                    Nenhum veículo
                    encontrado.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(
                  (
                    vehicle
                  ) => {
                    const client =
                      getCurrentClient(
                        vehicle
                      );

                    const vehicleStatus =
                      vehicle.status ??
                      "disponivel";

                    return (
                      <tr
                        key={
                          vehicle.id
                        }
                      >
                        <td>
                          <div className="vehicle-table-name">
                            <div className="vehicle-table-icon">
                              <VehicleIcon
                                type={
                                  vehicle.tipo
                                }
                              />
                            </div>

                            <div>
                              <strong>
                                {
                                  vehicle.marca
                                }{" "}
                                {
                                  vehicle.modelo
                                }
                              </strong>

                              <span>
                                {vehicle.versao ||
                                  vehicle.tipo}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="vehicle-nowrap">
                          {vehicle.placa ||
                            "—"}
                        </td>

                        <td>
                          {vehicle.ano_modelo ||
                            vehicle.ano_fabricacao ||
                            "—"}
                        </td>

                        <td>
                          {client ? (
                            <div className="vehicle-table-client">
                              <strong>
                                {
                                  client.nome
                                }
                              </strong>

                              <span>
                                {client.telefone ||
                                  client.cpf ||
                                  ""}
                              </span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>
                          <span
                            className={`vehicle-status vehicle-status-${vehicleStatus}`}
                          >
                            {statusNames[
                              vehicleStatus
                            ] ??
                              vehicleStatus}
                          </span>
                        </td>

                        <td className="vehicle-nowrap">
                          {formatCurrency(
                            vehicle.valor_compra
                          )}
                        </td>

                        <td className="vehicle-nowrap">
                          {formatCurrency(
                            vehicle.valor_fipe
                          )}
                        </td>

                        <td className="vehicle-nowrap">
                          {formatCurrency(
                            vehicle.valor_venda
                          )}
                        </td>

                        <td className="vehicle-nowrap">
                          {Number(
                            vehicle.quilometragem ??
                              0
                          ).toLocaleString(
                            "pt-BR"
                          )}
                        </td>

                        <td>
                          {Array.isArray(
                            vehicle.veiculo_documentos
                          )
                            ? vehicle
                                .veiculo_documentos
                                .length
                            : 0}
                        </td>

                        <td>
                          <button
                            type="button"
                            className="vehicle-edit-button"
                            onClick={() =>
                              openEditVehicle(
                                vehicle
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
              filteredVehicles.length
            }{" "}
            veículo(s)
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
                  {editingVehicle
                    ? "EDITAR PATRIMÔNIO"
                    : "NOVO PATRIMÔNIO"}
                </span>

                <h2>
                  {editingVehicle
                    ? "Editar veículo"
                    : "Cadastrar veículo"}
                </h2>

                <p>
                  {editingVehicle
                    ? "Atualize os dados cadastrados deste veículo."
                    : "Preencha os dados para adicionar o veículo ao CredBox."}
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
                editingVehicle?.id ??
                "new"
              }
              onSubmit={
                handleSubmit
              }
            >
              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <Car
                    size={18}
                  />

                  <div>
                    <strong>
                      Identificação
                    </strong>

                    <span>
                      Dados principais
                      do veículo
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid">
                  <label>
                    Tipo *

                    <select
                      name="tipo"
                      required
                      defaultValue={
                        editingVehicle?.tipo ??
                        ""
                      }
                    >
                      <option
                        value=""
                        disabled
                      >
                        Selecione
                      </option>

                      <option value="carro">
                        Carro
                      </option>

                      <option value="moto">
                        Moto
                      </option>

                      <option value="utilitario">
                        Utilitário
                      </option>

                      <option value="van">
                        Van
                      </option>

                      <option value="caminhao">
                        Caminhão
                      </option>

                      <option value="outro">
                        Outro
                      </option>
                    </select>
                  </label>

                  <label>
                    Status

                    <select
                      name="status"
                      defaultValue={
                        editingVehicle?.status ??
                        "disponivel"
                      }
                    >
                      <option value="disponivel">
                        Disponível
                      </option>

                      <option value="negociacao">
                        Em negociação
                      </option>

                      <option value="locado">
                        Locado
                      </option>

                      <option value="vendido">
                        Vendido
                      </option>

                      <option value="quitado">
                        Quitado
                      </option>

                      <option value="manutencao">
                        Manutenção
                      </option>

                      <option value="inativo">
                        Inativo
                      </option>
                    </select>
                  </label>

                  <label>
                    Marca *

                    <input
                      name="marca"
                      required
                      defaultValue={
                        editingVehicle?.marca ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Modelo *

                    <input
                      name="modelo"
                      required
                      defaultValue={
                        editingVehicle?.modelo ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Versão

                    <input
                      name="versao"
                      defaultValue={
                        editingVehicle?.versao ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Cor

                    <input
                      name="cor"
                      defaultValue={
                        editingVehicle?.cor ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Ano fabricação

                    <input
                      type="number"
                      name="ano_fabricacao"
                      min="1900"
                      max="2100"
                      defaultValue={
                        editingVehicle?.ano_fabricacao ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Ano modelo

                    <input
                      type="number"
                      name="ano_modelo"
                      min="1900"
                      max="2100"
                      defaultValue={
                        editingVehicle?.ano_modelo ??
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
                      Documentação
                    </strong>

                    <span>
                      Identificação
                      documental
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid">
                  <label>
                    Placa

                    <input
                      name="placa"
                      defaultValue={
                        editingVehicle?.placa ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    RENAVAM

                    <input
                      name="renavam"
                      defaultValue={
                        editingVehicle?.renavam ??
                        ""
                      }
                    />
                  </label>

                  <label className="form-full">
                    Chassi

                    <input
                      name="chassi"
                      defaultValue={
                        editingVehicle?.chassi ??
                        ""
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <Gauge
                    size={18}
                  />

                  <div>
                    <strong>
                      Características
                    </strong>

                    <span>
                      Mecânica e
                      utilização
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid">
                  <label>
                    Combustível

                    <select
                      name="combustivel"
                      defaultValue={
                        editingVehicle?.combustivel ??
                        ""
                      }
                    >
                      <option value="">
                        Selecione
                      </option>

                      <option value="gasolina">
                        Gasolina
                      </option>

                      <option value="etanol">
                        Etanol
                      </option>

                      <option value="flex">
                        Flex
                      </option>

                      <option value="diesel">
                        Diesel
                      </option>

                      <option value="eletrico">
                        Elétrico
                      </option>

                      <option value="hibrido">
                        Híbrido
                      </option>
                    </select>
                  </label>

                  <label>
                    Câmbio

                    <select
                      name="cambio"
                      defaultValue={
                        editingVehicle?.cambio ??
                        ""
                      }
                    >
                      <option value="">
                        Selecione
                      </option>

                      <option value="manual">
                        Manual
                      </option>

                      <option value="automatico">
                        Automático
                      </option>

                      <option value="cvt">
                        CVT
                      </option>

                      <option value="automatizado">
                        Automatizado
                      </option>
                    </select>
                  </label>

                  <label>
                    Quilometragem

                    <input
                      type="number"
                      name="quilometragem"
                      min="0"
                      defaultValue={
                        editingVehicle?.quilometragem ??
                        0
                      }
                    />
                  </label>

                  <label>
                    Data da compra

                    <input
                      type="date"
                      name="data_compra"
                      defaultValue={
                        editingVehicle?.data_compra ??
                        ""
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <CheckCircle2
                    size={18}
                  />

                  <div>
                    <strong>
                      Financeiro
                    </strong>

                    <span>
                      Valores do
                      patrimônio
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid vehicle-money-grid">
                  <label>
                    Valor compra

                    <input
                      name="valor_compra"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={
                        editingVehicle?.valor_compra ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Valor FIPE

                    <input
                      name="valor_fipe"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={
                        editingVehicle?.valor_fipe ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Valor venda

                    <input
                      name="valor_venda"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={
                        editingVehicle?.valor_venda ??
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
                      Documentos
                    </strong>

                    <span>
                      Adicione novos
                      arquivos
                    </span>
                  </div>
                </div>

                {editingVehicle &&
                  Array.isArray(
                    editingVehicle.veiculo_documentos
                  ) &&
                  editingVehicle
                    .veiculo_documentos
                    .length >
                    0 && (
                    <div className="vehicle-existing-documents">
                      {editingVehicle.veiculo_documentos.map(
                        (
                          document
                        ) => (
                          <div
                            key={
                              document.id
                            }
                          >
                            <FileText
                              size={
                                14
                              }
                            />

                            {
                              document.nome_arquivo
                            }
                          </div>
                        )
                      )}
                    </div>
                  )}

                <label className="vehicle-file-upload">
                  <FileText
                    size={23}
                  />

                  <strong>
                    Adicionar
                    documentos
                  </strong>

                  <span>
                    PDF, JPG ou
                    PNG — até
                    10 MB
                  </span>

                  <input
                    type="file"
                    name="documentos"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
              </div>

              <div className="vehicle-form-section">
                <label className="vehicle-notes">
                  Observações

                  <textarea
                    name="observacoes"
                    rows={4}
                    defaultValue={
                      editingVehicle?.observacoes ??
                      ""
                    }
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
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
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
                    : editingVehicle
                      ? "Salvar alterações"
                      : "Cadastrar veículo"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}