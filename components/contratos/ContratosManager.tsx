"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Eye,
  FileCheck2,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  UploadCloud,
  UserRound,
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
  status?: string | null;
};

type Vehicle = {
  id: string;
  marca: string;
  modelo: string;
  placa?: string | null;
  status?: string | null;
};

type Operation = {
  id: string;

  cliente_id?: string | null;
  veiculo_id?: string | null;

  tipo: string;

  descricao?: string | null;

  valor_total?: number | null;

  status?: string | null;

  clientes?:
    | Client
    | Client[]
    | null;

  veiculos?:
    | Vehicle
    | Vehicle[]
    | null;
};

type ContractFile = {
  id: string;

  nome_arquivo: string;

  caminho_storage: string;

  mime_type?: string | null;

  tamanho_bytes?: number | null;

  created_at?: string | null;
};

type Contract = {
  id: string;

  cliente_id?: string | null;
  operacao_id?: string | null;
  veiculo_id?: string | null;

  numero?: string | null;

  titulo: string;

  tipo: string;

  data_assinatura?: string | null;

  inicio_vigencia?: string | null;

  fim_vigencia?: string | null;

  valor_contrato?: number | null;

  status: string;

  observacoes?: string | null;

  created_at?: string | null;

  clientes:
    | Client
    | Client[]
    | null;

  operacoes:
    | Operation
    | Operation[]
    | null;

  veiculos:
    | Vehicle
    | Vehicle[]
    | null;

  contrato_arquivos?:
    | ContractFile[]
    | null;
};

interface Props {
  initialContracts?: Contract[];
  clients?: Client[];
  operations?: Operation[];
  vehicles?: Vehicle[];
}

type ApiResponse = {
  success?: boolean;
  error?: string;
  details?: string;
};

const typeNames: Record<string, string> = {
  locacao_compra:
    "Locação com compra final",

  venda_veiculo:
    "Venda de veículo",

  venda_parcelada:
    "Venda parcelada",

  emprestimo:
    "Empréstimo",

  cessao:
    "Cessão",

  aditivo:
    "Aditivo",

  outro:
    "Outro",
};

const statusNames: Record<string, string> = {
  rascunho: "Rascunho",
  ativo: "Ativo",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
  vencido: "Vencido",
};

function single<T>(
  value:
    | T
    | T[]
    | null
    | undefined
): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function currency(
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
  ).format(
    Number(value)
  );
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "—";
  }

  const parts =
    value.split("-");

  if (
    parts.length !== 3
  ) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatFileSize(
  bytes?: number | null
) {
  if (!bytes) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

export default function ContratosManager({
  initialContracts = [],
  clients = [],
  operations = [],
  vehicles = [],
}: Props) {
  const router =
    useRouter();

  const contracts =
    Array.isArray(
      initialContracts
    )
      ? initialContracts
      : [];

  const safeClients =
    Array.isArray(clients)
      ? clients
      : [];

  const safeOperations =
    Array.isArray(operations)
      ? operations
      : [];

  const safeVehicles =
    Array.isArray(vehicles)
      ? vehicles
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
    typeFilter,
    setTypeFilter,
  ] = useState("todos");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingContract,
    setEditingContract,
  ] =
    useState<Contract | null>(
      null
    );

  const [
    details,
    setDetails,
  ] =
    useState<Contract | null>(
      null
    );

  const [
    selectedClientId,
    setSelectedClientId,
  ] = useState("");

  const [
    selectedOperationId,
    setSelectedOperationId,
  ] = useState("");

  const [
    selectedVehicleId,
    setSelectedVehicleId,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const selectedOperation =
    useMemo(() => {
      return (
        safeOperations.find(
          (operation) =>
            operation.id ===
            selectedOperationId
        ) ?? null
      );
    }, [
      safeOperations,
      selectedOperationId,
    ]);

  const availableOperations =
    useMemo(() => {
      if (!selectedClientId) {
        return safeOperations;
      }

      return safeOperations.filter(
        (operation) =>
          operation.cliente_id ===
          selectedClientId
      );
    }, [
      safeOperations,
      selectedClientId,
    ]);

  const filtered =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return contracts.filter(
        (contract) => {
          const client =
            single(
              contract.clientes
            );

          const vehicle =
            single(
              contract.veiculos
            );

          const searchable =
            [
              contract.numero,
              contract.titulo,
              typeNames[
                contract.tipo
              ],
              client?.nome,
              client?.cpf,
              vehicle?.marca,
              vehicle?.modelo,
              vehicle?.placa,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          return (
            (!term ||
              searchable.includes(
                term
              )) &&
            (statusFilter ===
              "todos" ||
              contract.status ===
                statusFilter) &&
            (typeFilter ===
              "todos" ||
              contract.tipo ===
                typeFilter)
          );
        }
      );
    }, [
      contracts,
      search,
      statusFilter,
      typeFilter,
    ]);

  const counters =
    useMemo(() => ({
      total:
        contracts.length,

      active:
        contracts.filter(
          (item) =>
            item.status ===
            "ativo"
        ).length,

      drafts:
        contracts.filter(
          (item) =>
            item.status ===
            "rascunho"
        ).length,

      finished:
        contracts.filter(
          (item) =>
            item.status ===
            "finalizado"
        ).length,
    }), [contracts]);

  function openNew() {
    setEditingContract(
      null
    );

    setSelectedClientId(
      ""
    );

    setSelectedOperationId(
      ""
    );

    setSelectedVehicleId(
      ""
    );

    setError("");

    setModalOpen(
      true
    );
  }

  function openEdit(
    contract: Contract
  ) {
    setEditingContract(
      contract
    );

    setSelectedClientId(
      contract.cliente_id ??
        ""
    );

    setSelectedOperationId(
      contract.operacao_id ??
        ""
    );

    setSelectedVehicleId(
      contract.veiculo_id ??
        ""
    );

    setError("");

    setModalOpen(
      true
    );
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setEditingContract(
      null
    );

    setSelectedClientId(
      ""
    );

    setSelectedOperationId(
      ""
    );

    setSelectedVehicleId(
      ""
    );

    setError("");

    setModalOpen(
      false
    );
  }

  function handleClientChange(
    clientId: string
  ) {
    setSelectedClientId(
      clientId
    );

    if (
      selectedOperationId
    ) {
      const operation =
        safeOperations.find(
          (item) =>
            item.id ===
            selectedOperationId
        );

      if (
        operation &&
        operation.cliente_id !==
          clientId
      ) {
        setSelectedOperationId(
          ""
        );

        setSelectedVehicleId(
          ""
        );
      }
    }
  }

  function handleOperationChange(
    operationId: string
  ) {
    setSelectedOperationId(
      operationId
    );

    if (!operationId) {
      return;
    }

    const operation =
      safeOperations.find(
        (item) =>
          item.id ===
          operationId
      );

    if (!operation) {
      return;
    }

    if (
      operation.cliente_id
    ) {
      setSelectedClientId(
        operation.cliente_id
      );
    }

    if (
      operation.veiculo_id
    ) {
      setSelectedVehicleId(
        operation.veiculo_id
      );
    }
  }

  async function submit(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setError("");

    const formData =
      new FormData(
        event.currentTarget
      );

    formData.set(
      "cliente_id",
      selectedClientId
    );

    formData.set(
      "operacao_id",
      selectedOperationId
    );

    formData.set(
      "veiculo_id",
      selectedVehicleId
    );

    if (
      editingContract
    ) {
      formData.set(
        "id",
        editingContract.id
      );
    }

    try {
      const response =
        await fetch(
          "/api/contratos",
          {
            method:
              editingContract
                ? "PATCH"
                : "POST",

            body:
              formData,
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
        setError(
          data.error ||
            data.details ||
            "Não foi possível salvar o contrato."
        );

        return;
      }

      closeModal();

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro de comunicação."
      );
    } finally {
      setSaving(false);
    }
  }

  async function openFile(
    file: ContractFile
  ) {
    try {
      const response =
        await fetch(
          `/api/contratos/arquivo?path=${encodeURIComponent(
            file.caminho_storage
          )}`
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.url
      ) {
        throw new Error(
          data.error ||
            "Não foi possível abrir o arquivo."
        );
      }

      window.open(
        data.url,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Erro ao abrir arquivo."
      );
    }
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">
            DOCUMENTOS
          </span>

          <h1>
            Contratos
          </h1>

          <p>
            Central integrada de
            contratos, clientes,
            operações e veículos.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openNew}
        >
          <Plus size={17} />

          Novo contrato
        </button>
      </header>

      <section className="contract-summary-grid">
        <article className="contract-summary-card">
          <div className="contract-summary-icon">
            <FolderOpen />
          </div>

          <div>
            <span>Total</span>

            <strong>
              {counters.total}
            </strong>

            <small>
              contratos cadastrados
            </small>
          </div>
        </article>

        <article className="contract-summary-card contract-summary-green">
          <div className="contract-summary-icon">
            <CheckCircle2 />
          </div>

          <div>
            <span>Ativos</span>

            <strong>
              {counters.active}
            </strong>

            <small>
              em vigência
            </small>
          </div>
        </article>

        <article className="contract-summary-card contract-summary-yellow">
          <div className="contract-summary-icon">
            <FileText />
          </div>

          <div>
            <span>
              Rascunhos
            </span>

            <strong>
              {counters.drafts}
            </strong>

            <small>
              pendentes
            </small>
          </div>
        </article>

        <article className="contract-summary-card contract-summary-blue">
          <div className="contract-summary-icon">
            <FileCheck2 />
          </div>

          <div>
            <span>
              Finalizados
            </span>

            <strong>
              {counters.finished}
            </strong>

            <small>
              encerrados
            </small>
          </div>
        </article>
      </section>

      <section className="vehicle-toolbar">
        <div className="vehicle-search">
          <Search size={17} />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Buscar contrato, Lucas, CPF, CB 300, placa..."
          />
        </div>

        <select
          value={
            typeFilter
          }
          onChange={(event) =>
            setTypeFilter(
              event.target.value
            )
          }
        >
          <option value="todos">
            Todos os tipos
          </option>

          <option value="locacao_compra">
            Locação c/ compra
          </option>

          <option value="venda_veiculo">
            Venda veículo
          </option>

          <option value="venda_parcelada">
            Venda parcelada
          </option>

          <option value="emprestimo">
            Empréstimo
          </option>

          <option value="aditivo">
            Aditivo
          </option>

          <option value="outro">
            Outro
          </option>
        </select>

        <select
          value={
            statusFilter
          }
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="todos">
            Todos os status
          </option>

          <option value="rascunho">
            Rascunho
          </option>

          <option value="ativo">
            Ativo
          </option>

          <option value="finalizado">
            Finalizado
          </option>

          <option value="cancelado">
            Cancelado
          </option>

          <option value="vencido">
            Vencido
          </option>
        </select>
      </section>

      <section className="vehicle-table-card">
        <div className="vehicle-table-scroll">
          <table className="vehicle-table contract-table">
            <thead>
              <tr>
                <th>Contrato</th>
                <th>Cliente</th>
                <th>Veículo</th>
                <th>Tipo</th>
                <th>Assinatura</th>
                <th>Vigência</th>
                <th>Valor</th>
                <th>Arquivos</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="vehicle-table-empty"
                  >
                    Nenhum contrato
                    encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map(
                  (contract) => {
                    const client =
                      single(
                        contract.clientes
                      );

                    const vehicle =
                      single(
                        contract.veiculos
                      );

                    const files =
                      Array.isArray(
                        contract.contrato_arquivos
                      )
                        ? contract.contrato_arquivos
                        : [];

                    return (
                      <tr
                        key={
                          contract.id
                        }
                      >
                        <td>
                          <div className="contract-name-cell">
                            <div className="contract-file-icon">
                              <FileText
                                size={
                                  15
                                }
                              />
                            </div>

                            <div>
                              <strong>
                                {
                                  contract.titulo
                                }
                              </strong>

                              <span>
                                {contract.numero
                                  ? `Nº ${contract.numero}`
                                  : "Sem número"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="contract-client">
                            <strong>
                              {client?.nome ??
                                "—"}
                            </strong>

                            <span>
                              {client?.cpf ??
                                ""}
                            </span>
                          </div>
                        </td>

                        <td>
                          {vehicle ? (
                            <div className="contract-vehicle">
                              <strong>
                                {
                                  vehicle.marca
                                }{" "}
                                {
                                  vehicle.modelo
                                }
                              </strong>

                              <span>
                                {vehicle.placa ??
                                  ""}
                              </span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>
                          {typeNames[
                            contract.tipo
                          ] ??
                            contract.tipo}
                        </td>

                        <td>
                          {formatDate(
                            contract.data_assinatura
                          )}
                        </td>

                        <td>
                          {contract.inicio_vigencia ||
                          contract.fim_vigencia
                            ? `${formatDate(
                                contract.inicio_vigencia
                              )} → ${formatDate(
                                contract.fim_vigencia
                              )}`
                            : "—"}
                        </td>

                        <td>
                          {currency(
                            contract.valor_contrato
                          )}
                        </td>

                        <td>
                          <span className="contract-files-count">
                            {files.length}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`contract-status contract-status-${contract.status}`}
                          >
                            {statusNames[
                              contract.status
                            ] ??
                              contract.status}
                          </span>
                        </td>

                        <td>
                          <div className="contract-actions">
                            <button
                              type="button"
                              className="vehicle-edit-button"
                              onClick={() =>
                                setDetails(
                                  contract
                                )
                              }
                            >
                              <Eye
                                size={
                                  13
                                }
                              />

                              Ver
                            </button>

                            <button
                              type="button"
                              className="vehicle-edit-button"
                              onClick={() =>
                                openEdit(
                                  contract
                                )
                              }
                            >
                              <Pencil
                                size={
                                  13
                                }
                              />

                              Editar
                            </button>
                          </div>
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

      {modalOpen && (
        <div className="vehicle-modal-overlay">
          <div className="vehicle-modal contract-form-modal">
            <header className="vehicle-modal-header">
              <div>
                <span>
                  {editingContract
                    ? "EDITAR CONTRATO"
                    : "NOVO CONTRATO"}
                </span>

                <h2>
                  {editingContract
                    ? "Editar contrato"
                    : "Cadastrar contrato"}
                </h2>

                <p>
                  Vincule o documento à
                  operação, cliente e
                  veículo.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeModal
                }
              >
                <X size={20} />
              </button>
            </header>

            <form
              key={
                editingContract?.id ??
                "new-contract"
              }
              onSubmit={
                submit
              }
            >
              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <UserRound
                    size={18}
                  />

                  <div>
                    <strong>
                      Vínculo da operação
                    </strong>

                    <span>
                      Selecione a operação e
                      o CredBox preencherá o
                      cliente e veículo.
                    </span>
                  </div>
                </div>

                <div className="contract-link-highlight">
                  <label>
                    Operação vinculada

                    <select
                      value={
                        selectedOperationId
                      }
                      onChange={(event) =>
                        handleOperationChange(
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Selecione uma operação
                      </option>

                      {availableOperations.map(
                        (operation) => {
                          const client =
                            single(
                              operation.clientes
                            );

                          const vehicle =
                            single(
                              operation.veiculos
                            );

                          return (
                            <option
                              key={
                                operation.id
                              }
                              value={
                                operation.id
                              }
                            >
                              {client?.nome ??
                                "Sem cliente"}
                              {" • "}
                              {typeNames[
                                operation.tipo
                              ] ??
                                operation.tipo}
                              {vehicle
                                ? ` • ${vehicle.marca} ${vehicle.modelo}`
                                : ""}
                            </option>
                          );
                        }
                      )}
                    </select>
                  </label>
                </div>

                <div className="vehicle-form-grid">
                  <label>
                    Cliente *

                    <select
                      required
                      value={
                        selectedClientId
                      }
                      onChange={(event) =>
                        handleClientChange(
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Selecione
                      </option>

                      {safeClients.map(
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

                  <label>
                    Veículo

                    <select
                      value={
                        selectedVehicleId
                      }
                      onChange={(event) =>
                        setSelectedVehicleId(
                          event.target.value
                        )
                      }
                    >
                      <option value="">
                        Sem veículo
                      </option>

                      {safeVehicles.map(
                        (vehicle) => (
                          <option
                            key={
                              vehicle.id
                            }
                            value={
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
                            {vehicle.placa ??
                              "sem placa"}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>

                {selectedOperation && (
                  <div className="contract-operation-preview">
                    <div>
                      <span>
                        Cliente
                      </span>

                      <strong>
                        {single(
                          selectedOperation.clientes
                        )?.nome ??
                          "—"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Veículo
                      </span>

                      <strong>
                        {single(
                          selectedOperation.veiculos
                        )
                          ? `${single(
                              selectedOperation.veiculos
                            )?.marca} ${single(
                              selectedOperation.veiculos
                            )?.modelo}`
                          : "Sem veículo"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Valor operação
                      </span>

                      <strong>
                        {currency(
                          selectedOperation.valor_total
                        )}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <FileText
                    size={18}
                  />

                  <div>
                    <strong>
                      Identificação
                    </strong>

                    <span>
                      Dados do contrato
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid">
                  <label className="form-full">
                    Título *

                    <input
                      name="titulo"
                      required
                      defaultValue={
                        editingContract?.titulo ??
                        ""
                      }
                      placeholder="Ex.: Contrato CB 300R - Lucas Pereira"
                    />
                  </label>

                  <label>
                    Número

                    <input
                      name="numero"
                      defaultValue={
                        editingContract?.numero ??
                        ""
                      }
                      placeholder="2026-001"
                    />
                  </label>

                  <label>
                    Tipo *

                    <select
                      name="tipo"
                      required
                      defaultValue={
                        editingContract?.tipo ??
                        selectedOperation?.tipo ??
                        "locacao_compra"
                      }
                    >
                      <option value="locacao_compra">
                        Locação com compra final
                      </option>

                      <option value="venda_veiculo">
                        Venda de veículo
                      </option>

                      <option value="venda_parcelada">
                        Venda parcelada
                      </option>

                      <option value="emprestimo">
                        Empréstimo
                      </option>

                      <option value="cessao">
                        Cessão
                      </option>

                      <option value="aditivo">
                        Aditivo
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
                        editingContract?.status ??
                        "ativo"
                      }
                    >
                      <option value="rascunho">
                        Rascunho
                      </option>

                      <option value="ativo">
                        Ativo
                      </option>

                      <option value="finalizado">
                        Finalizado
                      </option>

                      <option value="cancelado">
                        Cancelado
                      </option>

                      <option value="vencido">
                        Vencido
                      </option>
                    </select>
                  </label>

                  <label>
                    Valor do contrato

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="valor_contrato"
                      defaultValue={
                        editingContract?.valor_contrato ??
                        selectedOperation?.valor_total ??
                        ""
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <CalendarDays
                    size={18}
                  />

                  <div>
                    <strong>
                      Datas
                    </strong>

                    <span>
                      Assinatura e vigência
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid">
                  <label>
                    Data assinatura

                    <input
                      type="date"
                      name="data_assinatura"
                      defaultValue={
                        editingContract?.data_assinatura ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Início vigência

                    <input
                      type="date"
                      name="inicio_vigencia"
                      defaultValue={
                        editingContract?.inicio_vigencia ??
                        ""
                      }
                    />
                  </label>

                  <label>
                    Fim vigência

                    <input
                      type="date"
                      name="fim_vigencia"
                      defaultValue={
                        editingContract?.fim_vigencia ??
                        ""
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <UploadCloud
                    size={18}
                  />

                  <div>
                    <strong>
                      Arquivos
                    </strong>

                    <span>
                      Contrato assinado,
                      fotos ou anexos
                    </span>
                  </div>
                </div>

                <label className="vehicle-file-upload">
                  <UploadCloud
                    size={24}
                  />

                  <strong>
                    Adicionar arquivos
                  </strong>

                  <span>
                    PDF, JPG ou PNG —
                    até 15 MB
                  </span>

                  <input
                    type="file"
                    name="arquivos"
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
                      editingContract?.observacoes ??
                      ""
                    }
                  />
                </label>
              </div>

              {error && (
                <div className="form-error">
                  {error}
                </div>
              )}

              <footer className="vehicle-modal-footer">
                <button
                  type="button"
                  className="secondary-button"
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
                    : editingContract
                      ? "Salvar alterações"
                      : "Cadastrar contrato"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {details && (
        <div className="vehicle-modal-overlay">
          <div className="vehicle-modal contract-details-modal">
            <header className="vehicle-modal-header">
              <div>
                <span>
                  CONTRATO
                </span>

                <h2>
                  {
                    details.titulo
                  }
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setDetails(null)
                }
              >
                <X size={20} />
              </button>
            </header>

            <div className="contract-details-body">
              <div className="contract-detail-grid">
                <div>
                  <span>
                    Cliente
                  </span>

                  <strong>
                    {single(
                      details.clientes
                    )?.nome ??
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Veículo
                  </span>

                  <strong>
                    {single(
                      details.veiculos
                    )
                      ? `${single(
                          details.veiculos
                        )?.marca} ${single(
                          details.veiculos
                        )?.modelo}`
                      : "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Valor
                  </span>

                  <strong>
                    {currency(
                      details.valor_contrato
                    )}
                  </strong>
                </div>
              </div>

              <div className="contract-section-title">
                <FileText
                  size={17}
                />

                <div>
                  <strong>
                    Arquivos
                  </strong>
                </div>
              </div>

              {!Array.isArray(
                details.contrato_arquivos
              ) ||
              details.contrato_arquivos.length ===
                0 ? (
                <div className="contract-no-files">
                  Nenhum arquivo anexado.
                </div>
              ) : (
                <div className="contract-files-list">
                  {details.contrato_arquivos.map(
                    (file) => (
                      <article
                        key={
                          file.id
                        }
                        className="contract-file-row"
                      >
                        <div className="contract-file-main">
                          <div className="contract-file-icon">
                            <FileText
                              size={
                                16
                              }
                            />
                          </div>

                          <div>
                            <strong>
                              {
                                file.nome_arquivo
                              }
                            </strong>

                            <span>
                              {formatFileSize(
                                file.tamanho_bytes
                              )}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="contract-open-file"
                          onClick={() =>
                            openFile(
                              file
                            )
                          }
                        >
                          <Eye
                            size={
                              14
                            }
                          />

                          Abrir
                        </button>
                      </article>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}