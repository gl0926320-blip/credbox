"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  Banknote,
  CalendarDays,
  Car,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  FileText,
  HandCoins,
  Percent,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  TrendingDown,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";

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
  ano_modelo?: number | null;
  ano_fabricacao?: number | null;
  status?: string | null;
};

type Payment = {
  id: string;
  valor: number;
  data_pagamento: string;
  forma_pagamento: string;
  comprovante_path?: string | null;
  desconto_percentual?: number | null;
  desconto_valor?: number | null;
};

type Installment = {
  id: string;
  numero: number;
  vencimento: string;
  valor: number;
  valor_pago: number;
  desconto_valor?: number | null;
  status: string;
  pago_em?: string | null;
  pagamentos?: Payment[] | null;
};

type OperationDocument = {
  id: string;
  tipo: string;
  nome_arquivo: string;
  caminho_storage: string;
};

type Operation = {
  id: string;

  cliente_id: string;
  veiculo_id?: string | null;

  tipo: string;

  descricao?: string | null;

  valor_total: number;
  entrada: number;

  caucao_prevista: number;
  caucao_recebida: number;
  caucao_status: string;

  quantidade_parcelas: number;
  valor_parcela: number;

  periodicidade: string;
  primeiro_vencimento: string;

  status: string;

  observacoes?: string | null;

  clientes:
    | Client
    | Client[]
    | null;

  veiculos:
    | Vehicle
    | Vehicle[]
    | null;

  parcelas?: Installment[] | null;

  operacao_documentos?:
    | OperationDocument[]
    | null;
};

interface Props {
  initialOperations?: Operation[];
  clients?: Client[];
  vehicles?: Vehicle[];
}

const operationNames: Record<string, string> = {
  locacao_compra:
    "Locação com compra final",

  venda_veiculo:
    "Venda de veículo",

  emprestimo:
    "Empréstimo",

  venda_parcelada:
    "Venda parcelada",

  outro:
    "Outro",
};

const operationStatus: Record<string, string> = {
  ativa: "Ativa",
  quitada: "Quitada",
  cancelada: "Cancelada",
  inadimplente: "Inadimplente",
};

const installmentStatus: Record<string, string> = {
  pendente: "Pendente",
  parcial: "Parcial",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

function currency(
  value?: number | null
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(
    Number(value ?? 0)
  );
}

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

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "—";
  }

  const parts =
    value.split("-");

  if (parts.length !== 3) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function effectiveStatus(
  installment: Installment
) {
  if (
    installment.status === "pago" ||
    installment.status === "parcial" ||
    installment.status === "cancelado"
  ) {
    return installment.status;
  }

  const today =
    new Date()
      .toISOString()
      .slice(0, 10);

  if (
    installment.vencimento <
    today
  ) {
    return "atrasado";
  }

  return "pendente";
}

function installmentBalance(
  installment: Installment
) {
  return Math.max(
    0,
    Number(installment.valor ?? 0) -
      Number(installment.valor_pago ?? 0) -
      Number(installment.desconto_valor ?? 0)
  );
}

function operationTotals(
  operation: Operation
) {
  const installments =
    Array.isArray(
      operation.parcelas
    )
      ? operation.parcelas
      : [];

  const contracted =
    installments.reduce(
      (sum, item) =>
        sum +
        Number(
          item.valor ?? 0
        ),
      0
    );

  const paid =
    installments.reduce(
      (sum, item) =>
        sum +
        Number(
          item.valor_pago ?? 0
        ),
      0
    );

  const discount =
    installments.reduce(
      (sum, item) =>
        sum +
        Number(
          item.desconto_valor ?? 0
        ),
      0
    );

  const remaining =
    installments.reduce(
      (sum, item) =>
        sum +
        installmentBalance(
          item
        ),
      0
    );

  const paidCount =
    installments.filter(
      (item) =>
        item.status ===
        "pago"
    ).length;

  const overdueCount =
    installments.filter(
      (item) =>
        effectiveStatus(
          item
        ) ===
        "atrasado"
    ).length;

  const nextInstallment =
    installments
      .filter(
        (item) =>
          installmentBalance(
            item
          ) > 0
      )
      .slice()
      .sort(
        (a, b) =>
          a.vencimento.localeCompare(
            b.vencimento
          )
      )[0] ?? null;

  return {
    contracted,
    paid,
    discount,
    remaining,
    paidCount,
    overdueCount,
    nextInstallment,
    installments,
  };
}

export default function OperacoesManager({
  initialOperations = [],
  clients = [],
  vehicles = [],
}: Props) {
  const router =
    useRouter();

  const operations =
    Array.isArray(
      initialOperations
    )
      ? initialOperations
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
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    details,
    setDetails,
  ] =
    useState<Operation | null>(
      null
    );

  const [
    selectedInstallment,
    setSelectedInstallment,
  ] =
    useState<Installment | null>(
      null
    );

  const [
    discountPercent,
    setDiscountPercent,
  ] = useState(0);

  const [
    paymentValue,
    setPaymentValue,
  ] = useState("");

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const filtered =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      return operations.filter(
        (operation) => {
          const client =
            single(
              operation.clientes
            );

          const vehicle =
            single(
              operation.veiculos
            );

          const searchable =
            [
              client?.nome,
              vehicle?.marca,
              vehicle?.modelo,
              vehicle?.placa,
              operationNames[
                operation.tipo
              ],
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
              operation.status ===
                statusFilter)
          );
        }
      );
    }, [
      operations,
      search,
      statusFilter,
    ]);

  const globalTotals =
    useMemo(() => {
      let contracted = 0;
      let paid = 0;
      let discount = 0;
      let remaining = 0;
      let overdue = 0;

      operations.forEach(
        (operation) => {
          const totals =
            operationTotals(
              operation
            );

          contracted +=
            totals.contracted;

          paid +=
            totals.paid;

          discount +=
            totals.discount;

          remaining +=
            totals.remaining;

          overdue +=
            totals.overdueCount;
        }
      );

      return {
        contracted,
        paid,
        discount,
        remaining,
        overdue,
      };
    }, [operations]);

  function openPayment(
    installment: Installment
  ) {
    const balance =
      installmentBalance(
        installment
      );

    setSelectedInstallment(
      installment
    );

    setDiscountPercent(
      0
    );

    setPaymentValue(
      balance.toFixed(2)
    );

    setError("");
  }

  function applyDiscount(
    percentage: number
  ) {
    if (
      !selectedInstallment
    ) {
      return;
    }

    const balance =
      installmentBalance(
        selectedInstallment
      );

    const discount =
      balance *
      (percentage / 100);

    const payable =
      Math.max(
        0,
        balance -
          discount
      );

    setDiscountPercent(
      percentage
    );

    setPaymentValue(
      payable.toFixed(2)
    );
  }

  async function submitPayment(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !selectedInstallment ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");

    const formData =
      new FormData(
        event.currentTarget
      );

    formData.set(
      "parcela_id",
      selectedInstallment.id
    );

    formData.set(
      "desconto_percentual",
      String(
        discountPercent
      )
    );

    try {
      const response =
        await fetch(
          "/api/parcelas/pagar",
          {
            method: "POST",
            body: formData,
          }
        );

      const raw =
        await response.text();

      let data: {
        error?: string;
      } = {};

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

      if (
        !response.ok
      ) {
        setError(
          data.error ||
            "Não foi possível registrar o pagamento."
        );

        return;
      }

      setSelectedInstallment(
        null
      );

      setDiscountPercent(
        0
      );

      setPaymentValue("");

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

  async function submitOperation(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setError("");

    const form =
      event.currentTarget;

    try {
      const response =
        await fetch(
          "/api/operacoes",
          {
            method: "POST",
            body:
              new FormData(
                form
              ),
          }
        );

      const raw =
        await response.text();

      let data: {
        error?: string;
        details?: string;
      } = {};

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
            "Não foi possível criar a operação."
        );

        return;
      }

      form.reset();

      setModalOpen(false);

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

  const selectedBalance =
    selectedInstallment
      ? installmentBalance(
          selectedInstallment
        )
      : 0;

  const selectedDiscount =
    selectedBalance *
    (discountPercent /
      100);

  const selectedFinal =
    Math.max(
      0,
      selectedBalance -
        selectedDiscount
    );

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <span className="page-eyebrow">
            FINANCEIRO
          </span>

          <h1>
            Operações
          </h1>

          <p>
            Contratos,
            empréstimos, vendas
            e locações com
            controle financeiro
            completo.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setError("");
            setModalOpen(true);
          }}
        >
          <Plus size={17} />

          Nova operação
        </button>
      </header>

      <section className="finance-dashboard">
        <article className="finance-card">
          <div className="finance-card-icon">
            <WalletCards size={19} />
          </div>

          <div>
            <span>
              Valor contratado
            </span>

            <strong>
              {currency(
                globalTotals.contracted
              )}
            </strong>

            <small>
              Total original
              das parcelas
            </small>
          </div>
        </article>

        <article className="finance-card finance-card-green">
          <div className="finance-card-icon">
            <CheckCircle2 size={19} />
          </div>

          <div>
            <span>
              Total recebido
            </span>

            <strong>
              {currency(
                globalTotals.paid
              )}
            </strong>

            <small>
              Dinheiro recebido
            </small>
          </div>
        </article>

        <article className="finance-card finance-card-blue">
          <div className="finance-card-icon">
            <Banknote size={19} />
          </div>

          <div>
            <span>
              Saldo a receber
            </span>

            <strong>
              {currency(
                globalTotals.remaining
              )}
            </strong>

            <small>
              Saldo real aberto
            </small>
          </div>
        </article>

        <article className="finance-card finance-card-purple">
          <div className="finance-card-icon">
            <Percent size={19} />
          </div>

          <div>
            <span>
              Descontos
            </span>

            <strong>
              {currency(
                globalTotals.discount
              )}
            </strong>

            <small>
              Benefícios concedidos
            </small>
          </div>
        </article>
      </section>

      <section className="finance-secondary-summary">
        <div>
          <HandCoins size={15} />

          <span>
            Operações ativas
          </span>

          <strong>
            {
              operations.filter(
                (item) =>
                  item.status ===
                  "ativa"
              ).length
            }
          </strong>
        </div>

        <div>
          <Clock3 size={15} />

          <span>
            Parcelas atrasadas
          </span>

          <strong>
            {
              globalTotals.overdue
            }
          </strong>
        </div>
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
            placeholder="Buscar cliente, veículo, placa ou operação..."
          />
        </div>

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

          <option value="ativa">
            Ativas
          </option>

          <option value="quitada">
            Quitadas
          </option>

          <option value="inadimplente">
            Inadimplentes
          </option>

          <option value="cancelada">
            Canceladas
          </option>
        </select>
      </section>

      <section className="vehicle-table-card">
        <div className="vehicle-table-scroll">
          <table className="vehicle-table operation-table">
            <thead>
              <tr>
                <th>
                  Cliente
                </th>

                <th>
                  Operação
                </th>

                <th>
                  Veículo
                </th>

                <th>
                  Parcela
                </th>

                <th>
                  Progresso
                </th>

                <th>
                  Recebido
                </th>

                <th>
                  Desconto
                </th>

                <th>
                  Saldo
                </th>

                <th>
                  Caução
                </th>

                <th>
                  Próximo venc.
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
              {filtered.map(
                (operation) => {
                  const client =
                    single(
                      operation.clientes
                    );

                  const vehicle =
                    single(
                      operation.veiculos
                    );

                  const totals =
                    operationTotals(
                      operation
                    );

                  return (
                    <tr
                      key={
                        operation.id
                      }
                    >
                      <td>
                        <strong>
                          {client?.nome ??
                            "—"}
                        </strong>
                      </td>

                      <td>
                        {operationNames[
                          operation.tipo
                        ] ??
                          operation.tipo}
                      </td>

                      <td>
                        {vehicle
                          ? `${vehicle.marca} ${vehicle.modelo}`
                          : "—"}
                      </td>

                      <td>
                        {currency(
                          operation.valor_parcela
                        )}
                      </td>

                      <td>
                        <strong>
                          {
                            totals.paidCount
                          }
                          /
                          {
                            operation.quantidade_parcelas
                          }
                        </strong>
                      </td>

                      <td>
                        {currency(
                          totals.paid
                        )}
                      </td>

                      <td>
                        {currency(
                          totals.discount
                        )}
                      </td>

                      <td>
                        <strong>
                          {currency(
                            totals.remaining
                          )}
                        </strong>
                      </td>

                      <td>
                        {currency(
                          operation.caucao_recebida
                        )}
                      </td>

                      <td>
                        {totals.nextInstallment
                          ? formatDate(
                              totals.nextInstallment
                                .vencimento
                            )
                          : "Quitado"}
                      </td>

                      <td>
                        <span
                          className={`operation-status operation-status-${operation.status}`}
                        >
                          {operationStatus[
                            operation.status
                          ] ??
                            operation.status}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="vehicle-edit-button"
                          onClick={() =>
                            setDetails(
                              operation
                            )
                          }
                        >
                          <Eye
                            size={
                              14
                            }
                          />

                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>
        </div>
      </section>

      {details && (
        <div className="vehicle-modal-overlay">
          <div className="vehicle-modal operation-details-modal">
            <header className="vehicle-modal-header">
              <div>
                <span>
                  OPERAÇÃO
                </span>

                <h2>
                  {single(
                    details.clientes
                  )?.nome ??
                    "Detalhes"}
                </h2>

                <p>
                  {operationNames[
                    details.tipo
                  ] ??
                    details.tipo}
                </p>
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

            <div className="operation-details-body">
              {(() => {
                const totals =
                  operationTotals(
                    details
                  );

                const vehicle =
                  single(
                    details.veiculos
                  );

                return (
                  <>
                    <div className="operation-profile">
                      <div>
                        <span>
                          Veículo
                        </span>

                        <strong>
                          {vehicle
                            ? `${vehicle.marca} ${vehicle.modelo}`
                            : "Sem veículo"}
                        </strong>

                        <small>
                          {vehicle?.placa ??
                            ""}
                        </small>
                      </div>

                      <div>
                        <span>
                          Periodicidade
                        </span>

                        <strong className="capitalize">
                          {
                            details.periodicidade
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          Parcelas
                        </span>

                        <strong>
                          {
                            details.quantidade_parcelas
                          }{" "}
                          ×{" "}
                          {currency(
                            details.valor_parcela
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="operation-detail-cards">
                      <div>
                        <CircleDollarSign />

                        <span>
                          Valor contratado
                        </span>

                        <strong>
                          {currency(
                            totals.contracted
                          )}
                        </strong>
                      </div>

                      <div className="detail-green">
                        <CheckCircle2 />

                        <span>
                          Recebido
                        </span>

                        <strong>
                          {currency(
                            totals.paid
                          )}
                        </strong>
                      </div>

                      <div className="detail-blue">
                        <Banknote />

                        <span>
                          Saldo
                        </span>

                        <strong>
                          {currency(
                            totals.remaining
                          )}
                        </strong>
                      </div>

                      <div className="detail-purple">
                        <Percent />

                        <span>
                          Descontos
                        </span>

                        <strong>
                          {currency(
                            totals.discount
                          )}
                        </strong>
                      </div>

                      <div>
                        <ShieldCheck />

                        <span>
                          Caução recebida
                        </span>

                        <strong>
                          {currency(
                            details.caucao_recebida
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="operation-installments-header">
                      <div>
                        <h3>
                          Parcelas
                        </h3>

                        <p>
                          Clique em
                          Dar baixa para
                          registrar o
                          pagamento.
                        </p>
                      </div>

                      <div className="operation-progress">
                        <strong>
                          {
                            totals.paidCount
                          }
                          /
                          {
                            details.quantidade_parcelas
                          }
                        </strong>

                        <span>
                          pagas
                        </span>
                      </div>
                    </div>

                    <div className="vehicle-table-scroll">
                      <table className="vehicle-table operation-installment-table">
                        <thead>
                          <tr>
                            <th>
                              Nº
                            </th>

                            <th>
                              Vencimento
                            </th>

                            <th>
                              Valor
                            </th>

                            <th>
                              Recebido
                            </th>

                            <th>
                              Desconto
                            </th>

                            <th>
                              Saldo
                            </th>

                            <th>
                              Status
                            </th>

                            <th>
                              Comprovante
                            </th>

                            <th>
                              Ação
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {(
                            details.parcelas ??
                            []
                          )
                            .slice()
                            .sort(
                              (
                                a,
                                b
                              ) =>
                                a.numero -
                                b.numero
                            )
                            .map(
                              (
                                installment
                              ) => {
                                const status =
                                  effectiveStatus(
                                    installment
                                  );

                                const balance =
                                  installmentBalance(
                                    installment
                                  );

                                const hasProof =
                                  (
                                    installment.pagamentos ??
                                    []
                                  ).some(
                                    (
                                      payment
                                    ) =>
                                      !!payment.comprovante_path
                                  );

                                return (
                                  <tr
                                    key={
                                      installment.id
                                    }
                                    className={
                                      status ===
                                      "pago"
                                        ? "installment-row-paid"
                                        : status ===
                                            "atrasado"
                                          ? "installment-row-overdue"
                                          : ""
                                    }
                                  >
                                    <td>
                                      <strong>
                                        {
                                          installment.numero
                                        }
                                      </strong>
                                    </td>

                                    <td>
                                      {formatDate(
                                        installment.vencimento
                                      )}
                                    </td>

                                    <td>
                                      {currency(
                                        installment.valor
                                      )}
                                    </td>

                                    <td>
                                      {currency(
                                        installment.valor_pago
                                      )}
                                    </td>

                                    <td>
                                      {currency(
                                        installment.desconto_valor
                                      )}
                                    </td>

                                    <td>
                                      <strong>
                                        {currency(
                                          balance
                                        )}
                                      </strong>
                                    </td>

                                    <td>
                                      <span
                                        className={`installment-status installment-status-${status}`}
                                      >
                                        {installmentStatus[
                                          status
                                        ] ??
                                          status}
                                      </span>
                                    </td>

                                    <td>
                                      {hasProof ? (
                                        <span className="proof-ok">
                                          <ReceiptText
                                            size={
                                              13
                                            }
                                          />

                                          Anexado
                                        </span>
                                      ) : (
                                        "—"
                                      )}
                                    </td>

                                    <td>
                                      {balance >
                                      0 ? (
                                        <button
                                          type="button"
                                          className="payment-action-button"
                                          onClick={() =>
                                            openPayment(
                                              installment
                                            )
                                          }
                                        >
                                          <CheckCircle2
                                            size={
                                              14
                                            }
                                          />

                                          Dar baixa
                                        </button>
                                      ) : (
                                        <span className="paid-label">
                                          <CheckCircle2
                                            size={
                                              13
                                            }
                                          />

                                          Pago
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              }
                            )}
                        </tbody>
                      </table>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {selectedInstallment && (
        <div className="vehicle-modal-overlay payment-layer">
          <div className="payment-modal">
            <header className="vehicle-modal-header">
              <div>
                <span>
                  DAR BAIXA
                </span>

                <h2>
                  Parcela{" "}
                  {
                    selectedInstallment.numero
                  }
                </h2>

                <p>
                  Registre pagamento,
                  desconto e comprovante.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setSelectedInstallment(
                    null
                  )
                }
              >
                <X size={20} />
              </button>
            </header>

            <form
              onSubmit={
                submitPayment
              }
            >
              <div className="payment-summary-box">
                <div>
                  <span>
                    Valor original
                  </span>

                  <strong>
                    {currency(
                      selectedInstallment.valor
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Já recebido
                  </span>

                  <strong>
                    {currency(
                      selectedInstallment.valor_pago
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Saldo atual
                  </span>

                  <strong>
                    {currency(
                      selectedBalance
                    )}
                  </strong>
                </div>
              </div>

              <div className="payment-section">
                <div className="payment-section-title">
                  <Percent
                    size={
                      17
                    }
                  />

                  <div>
                    <strong>
                      Desconto
                    </strong>

                    <span>
                      Use para
                      antecipação ou
                      negociação.
                    </span>
                  </div>
                </div>

                <div className="discount-buttons">
                  {[0, 5, 10, 20, 30, 50].map(
                    (
                      percentage
                    ) => (
                      <button
                        key={
                          percentage
                        }
                        type="button"
                        className={
                          discountPercent ===
                          percentage
                            ? "discount-option active"
                            : "discount-option"
                        }
                        onClick={() =>
                          applyDiscount(
                            percentage
                          )
                        }
                      >
                        {percentage ===
                        0
                          ? "Sem desconto"
                          : `${percentage}%`}
                      </button>
                    )
                  )}
                </div>

                <label className="custom-discount">
                  Desconto personalizado (%)

                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      discountPercent
                    }
                    onChange={(
                      event
                    ) => {
                      let value =
                        Number(
                          event.target
                            .value
                        );

                      if (
                        !Number.isFinite(
                          value
                        )
                      ) {
                        value =
                          0;
                      }

                      value =
                        Math.min(
                          100,
                          Math.max(
                            0,
                            value
                          )
                        );

                      applyDiscount(
                        value
                      );
                    }}
                  />
                </label>

                <div className="discount-preview">
                  <div>
                    <span>
                      Desconto
                    </span>

                    <strong>
                      -{" "}
                      {currency(
                        selectedDiscount
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Valor após
                      desconto
                    </span>

                    <strong>
                      {currency(
                        selectedFinal
                      )}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="payment-section">
                <div className="vehicle-form-grid">
                  <label>
                    Valor recebido *

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="valor_pago"
                      required
                      value={
                        paymentValue
                      }
                      onChange={(
                        event
                      ) =>
                        setPaymentValue(
                          event.target
                            .value
                        )
                      }
                    />
                  </label>

                  <label>
                    Data do pagamento *

                    <input
                      type="date"
                      name="data_pagamento"
                      required
                      defaultValue={
                        new Date()
                          .toISOString()
                          .slice(
                            0,
                            10
                          )
                      }
                    />
                  </label>

                  <label>
                    Forma de pagamento *

                    <select
                      name="forma_pagamento"
                      required
                      defaultValue="pix"
                    >
                      <option value="pix">
                        PIX
                      </option>

                      <option value="dinheiro">
                        Dinheiro
                      </option>

                      <option value="transferencia">
                        Transferência
                      </option>

                      <option value="cartao">
                        Cartão
                      </option>

                      <option value="outro">
                        Outro
                      </option>
                    </select>
                  </label>

                  <label>
                    Comprovante

                    <input
                      type="file"
                      name="comprovante"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </label>

                  <label className="form-full">
                    Observação

                    <textarea
                      name="observacoes"
                      rows={3}
                      placeholder="Ex.: pagamento antecipado com 10% de desconto."
                    />
                  </label>
                </div>
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
                  onClick={() =>
                    setSelectedInstallment(
                      null
                    )
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
                  <CheckCircle2
                    size={
                      16
                    }
                  />

                  {saving
                    ? "Salvando..."
                    : "Confirmar pagamento"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="vehicle-modal-overlay">
          <div className="vehicle-modal">
            <header className="vehicle-modal-header">
              <div>
                <span>
                  NOVA OPERAÇÃO
                </span>

                <h2>
                  Criar operação
                </h2>

                <p>
                  As parcelas serão
                  criadas
                  automaticamente.
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

            <form
              onSubmit={
                submitOperation
              }
            >
              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <UserRound
                    size={
                      18
                    }
                  />

                  <div>
                    <strong>
                      Cliente
                    </strong>

                    <span>
                      Titular da
                      operação
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

                      {clients.map(
                        (
                          client
                        ) => (
                          <option
                            value={
                              client.id
                            }
                            key={
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
                  <Car
                    size={
                      18
                    }
                  />

                  <div>
                    <strong>
                      Negócio
                    </strong>

                    <span>
                      Tipo e veículo
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid">
                  <label>
                    Tipo *

                    <select
                      name="tipo"
                      required
                      defaultValue="locacao_compra"
                    >
                      <option value="locacao_compra">
                        Locação com compra final
                      </option>

                      <option value="venda_veiculo">
                        Venda de veículo
                      </option>

                      <option value="emprestimo">
                        Empréstimo
                      </option>

                      <option value="venda_parcelada">
                        Venda parcelada
                      </option>

                      <option value="outro">
                        Outro
                      </option>
                    </select>
                  </label>

                  <label>
                    Veículo

                    <select
                      name="veiculo_id"
                      defaultValue=""
                    >
                      <option value="">
                        Sem veículo
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
                            {" - "}
                            {vehicle.placa ??
                              "sem placa"}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label className="form-full">
                    Descrição

                    <input
                      name="descricao"
                      placeholder="Descrição da operação"
                    />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <Banknote
                    size={
                      18
                    }
                  />

                  <div>
                    <strong>
                      Valores
                    </strong>

                    <span>
                      Entrada e
                      caução
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid">
                  <label>
                    Entrada

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="entrada"
                      defaultValue="0"
                    />
                  </label>

                  <label>
                    Caução prevista

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="caucao_prevista"
                      defaultValue="0"
                    />
                  </label>

                  <label>
                    Caução recebida

                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="caucao_recebida"
                      defaultValue="0"
                    />
                  </label>

                  <label>
                    Status caução

                    <select
                      name="caucao_status"
                      defaultValue="nao_aplicavel"
                    >
                      <option value="nao_aplicavel">
                        Não aplicável
                      </option>

                      <option value="pendente">
                        Pendente
                      </option>

                      <option value="recebida">
                        Recebida
                      </option>

                      <option value="utilizada_parcial">
                        Utilizada parcialmente
                      </option>

                      <option value="utilizada">
                        Utilizada
                      </option>

                      <option value="devolvida">
                        Devolvida
                      </option>
                    </select>
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <CalendarDays
                    size={
                      18
                    }
                  />

                  <div>
                    <strong>
                      Parcelamento
                    </strong>

                    <span>
                      Cronograma
                      automático
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid">
                  <label>
                    Quantidade *

                    <input
                      type="number"
                      min="1"
                      name="quantidade_parcelas"
                      required
                    />
                  </label>

                  <label>
                    Valor parcela *

                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      name="valor_parcela"
                      required
                    />
                  </label>

                  <label>
                    Frequência *

                    <select
                      name="periodicidade"
                      defaultValue="mensal"
                    >
                      <option value="semanal">
                        Semanal
                      </option>

                      <option value="quinzenal">
                        Quinzenal
                      </option>

                      <option value="mensal">
                        Mensal
                      </option>
                    </select>
                  </label>

                  <label>
                    Primeiro vencimento *

                    <input
                      type="date"
                      name="primeiro_vencimento"
                      required
                    />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <div className="vehicle-form-section-title">
                  <FileText
                    size={
                      18
                    }
                  />

                  <div>
                    <strong>
                      Documentos
                    </strong>

                    <span>
                      Contrato e
                      caução
                    </span>
                  </div>
                </div>

                <div className="vehicle-form-grid">
                  <label>
                    Contrato

                    <input
                      type="file"
                      name="contrato"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </label>

                  <label>
                    Comprovante caução

                    <input
                      type="file"
                      name="comprovante_caucao"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <label className="vehicle-notes">
                  Observações

                  <textarea
                    rows={4}
                    name="observacoes"
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
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Criando..."
                    : "Criar operação"}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}