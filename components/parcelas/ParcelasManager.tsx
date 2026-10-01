"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Percent,
  ReceiptText,
  Search,
  WalletCards,
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
};

type Vehicle = {
  id: string;
  marca: string;
  modelo: string;
  placa?: string | null;
};

type Operation = {
  id: string;

  tipo: string;

  descricao?: string | null;

  valor_total: number;

  quantidade_parcelas: number;

  valor_parcela: number;

  periodicidade: string;

  status: string;

  clientes:
    | Client
    | Client[]
    | null;

  veiculos:
    | Vehicle
    | Vehicle[]
    | null;
};

type Payment = {
  id: string;

  valor: number;

  data_pagamento: string;

  forma_pagamento: string;

  comprovante_path?: string | null;

  desconto_percentual?: number | null;

  desconto_valor?: number | null;

  observacoes?: string | null;

  created_at?: string;
};

type Installment = {
  id: string;

  operacao_id: string;

  numero: number;

  vencimento: string;

  valor: number;

  valor_pago: number;

  desconto_valor?: number | null;

  status: string;

  pago_em?: string | null;

  observacoes?: string | null;

  created_at?: string;

  operacoes:
    | Operation
    | Operation[]
    | null;

  pagamentos?:
    | Payment[]
    | null;
};

interface Props {
  initialInstallments?: Installment[];
}

type ApiResponse = {
  success?: boolean;
  error?: string;
  details?: string;
};

const operationNames:
  Record<string, string> = {
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

const statusNames:
  Record<string, string> = {
  pendente:
    "Pendente",

  parcial:
    "Parcial",

  pago:
    "Pago",

  atrasado:
    "Atrasado",

  cancelado:
    "Cancelado",
};

const paymentNames:
  Record<string, string> = {
  pix:
    "PIX",

  dinheiro:
    "Dinheiro",

  transferencia:
    "Transferência",

  cartao:
    "Cartão",

  outro:
    "Outro",
};

function single<T>(
  value:
    | T
    | T[]
    | null
    | undefined
): T | null {
  if (
    Array.isArray(
      value
    )
  ) {
    return (
      value[0] ??
      null
    );
  }

  return (
    value ??
    null
  );
}

function currency(
  value?:
    | number
    | null
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL",
    }
  ).format(
    Number(
      value ??
        0
    )
  );
}

function formatDate(
  value?:
    | string
    | null
) {
  if (!value) {
    return "—";
  }

  const parts =
    value.split("-");

  if (
    parts.length !==
    3
  ) {
    return value;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function todayString() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      now.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function addDays(
  date:
    string,
  days:
    number
) {
  const [
    year,
    month,
    day,
  ] =
    date
      .split("-")
      .map(Number);

  const result =
    new Date(
      year,
      month - 1,
      day
    );

  result.setDate(
    result.getDate() +
      days
  );

  const y =
    result.getFullYear();

  const m =
    String(
      result.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const d =
    String(
      result.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${y}-${m}-${d}`;
}

function installmentBalance(
  installment:
    Installment
) {
  return Math.max(
    0,

    Number(
      installment.valor ??
        0
    ) -
      Number(
        installment.valor_pago ??
          0
      ) -
      Number(
        installment.desconto_valor ??
          0
      )
  );
}

function effectiveStatus(
  installment:
    Installment
) {
  if (
    installment.status ===
      "pago" ||
    installment.status ===
      "parcial" ||
    installment.status ===
      "cancelado"
  ) {
    return installment.status;
  }

  const today =
    todayString();

  if (
    installment.vencimento <
    today
  ) {
    return "atrasado";
  }

  return "pendente";
}

export default function ParcelasManager({
  initialInstallments = [],
}: Props) {
  const router =
    useRouter();

  const installments =
    Array.isArray(
      initialInstallments
    )
      ? initialInstallments
      : [];

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState("todos");

  const [
    periodFilter,
    setPeriodFilter,
  ] =
    useState("todos");

  const [
    operationFilter,
    setOperationFilter,
  ] =
    useState("todos");

  const [
    selectedInstallment,
    setSelectedInstallment,
  ] =
    useState<Installment | null>(
      null
    );

  const [
    historyInstallment,
    setHistoryInstallment,
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

      const today =
        todayString();

      const next7 =
        addDays(
          today,
          7
        );

      return installments.filter(
        (
          installment
        ) => {
          const operation =
            single(
              installment.operacoes
            );

          const client =
            single(
              operation?.clientes
            );

          const vehicle =
            single(
              operation?.veiculos
            );

          const currentStatus =
            effectiveStatus(
              installment
            );

          const searchable =
            [
              client?.nome,
              client?.cpf,
              client?.telefone,

              vehicle?.marca,
              vehicle?.modelo,
              vehicle?.placa,

              operationNames[
                operation?.tipo ??
                  ""
              ],

              installment.numero,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();

          const matchesSearch =
            !term ||
            searchable.includes(
              term
            );

          const matchesStatus =
            statusFilter ===
              "todos" ||
            currentStatus ===
              statusFilter;

          const matchesOperation =
            operationFilter ===
              "todos" ||
            operation?.tipo ===
              operationFilter;

          let matchesPeriod =
            true;

          if (
            periodFilter ===
            "hoje"
          ) {
            matchesPeriod =
              installment.vencimento ===
              today;
          }

          if (
            periodFilter ===
            "atrasadas"
          ) {
            matchesPeriod =
              currentStatus ===
              "atrasado";
          }

          if (
            periodFilter ===
            "proximos7"
          ) {
            matchesPeriod =
              installment.vencimento >=
                today &&
              installment.vencimento <=
                next7 &&
              currentStatus !==
                "pago";
          }

          if (
            periodFilter ===
            "pagas"
          ) {
            matchesPeriod =
              currentStatus ===
              "pago";
          }

          return (
            matchesSearch &&
            matchesStatus &&
            matchesOperation &&
            matchesPeriod
          );
        }
      );
    }, [
      installments,
      search,
      statusFilter,
      periodFilter,
      operationFilter,
    ]);

  const totals =
    useMemo(() => {
      return installments.reduce(
        (
          result,
          item
        ) => {
          const balance =
            installmentBalance(
              item
            );

          const currentStatus =
            effectiveStatus(
              item
            );

          result.total +=
            Number(
              item.valor ??
                0
            );

          result.received +=
            Number(
              item.valor_pago ??
                0
            );

          result.discount +=
            Number(
              item.desconto_valor ??
                0
            );

          result.balance +=
            balance;

          if (
            currentStatus ===
            "atrasado"
          ) {
            result.overdue +=
              balance;

            result.overdueCount +=
              1;
          }

          if (
            currentStatus ===
            "pago"
          ) {
            result.paidCount +=
              1;
          }

          return result;
        },
        {
          total: 0,
          received: 0,
          discount: 0,
          balance: 0,
          overdue: 0,
          overdueCount: 0,
          paidCount: 0,
        }
      );
    }, [installments]);

  function openPayment(
    installment:
      Installment
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
      balance.toFixed(
        2
      )
    );

    setError("");
  }

  function applyDiscount(
    percentage:
      number
  ) {
    if (
      !selectedInstallment
    ) {
      return;
    }

    let safe =
      percentage;

    if (
      !Number.isFinite(
        safe
      )
    ) {
      safe = 0;
    }

    safe =
      Math.max(
        0,
        Math.min(
          100,
          safe
        )
      );

    const balance =
      installmentBalance(
        selectedInstallment
      );

    const discount =
      balance *
      (safe /
        100);

    const final =
      Math.max(
        0,
        balance -
          discount
      );

    setDiscountPercent(
      safe
    );

    setPaymentValue(
      final.toFixed(
        2
      )
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
            method:
              "POST",

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
        setError(
          data.error ||
            data.details ||
            "Erro ao registrar pagamento."
        );

        return;
      }

      setSelectedInstallment(
        null
      );

      setDiscountPercent(
        0
      );

      setPaymentValue(
        ""
      );

      router.refresh();
    } catch (
      err
    ) {
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
            CONTAS A RECEBER
          </span>

          <h1>
            Parcelas
          </h1>

          <p>
            Controle
            vencimentos,
            pagamentos,
            descontos e
            comprovantes.
          </p>
        </div>
      </header>

      <section className="finance-dashboard">
        <article className="finance-card">
          <div className="finance-card-icon">
            <WalletCards
              size={19}
            />
          </div>

          <div>
            <span>
              Carteira total
            </span>

            <strong>
              {currency(
                totals.total
              )}
            </strong>

            <small>
              Valor original
              das parcelas
            </small>
          </div>
        </article>

        <article className="finance-card finance-card-green">
          <div className="finance-card-icon">
            <CheckCircle2
              size={19}
            />
          </div>

          <div>
            <span>
              Recebido
            </span>

            <strong>
              {currency(
                totals.received
              )}
            </strong>

            <small>
              {
                totals.paidCount
              }{" "}
              parcela(s)
              quitada(s)
            </small>
          </div>
        </article>

        <article className="finance-card finance-card-blue">
          <div className="finance-card-icon">
            <Banknote
              size={19}
            />
          </div>

          <div>
            <span>
              Saldo aberto
            </span>

            <strong>
              {currency(
                totals.balance
              )}
            </strong>

            <small>
              Total ainda a
              receber
            </small>
          </div>
        </article>

        <article className="finance-card finance-card-red">
          <div className="finance-card-icon">
            <AlertTriangle
              size={19}
            />
          </div>

          <div>
            <span>
              Em atraso
            </span>

            <strong>
              {currency(
                totals.overdue
              )}
            </strong>

            <small>
              {
                totals.overdueCount
              }{" "}
              parcela(s)
            </small>
          </div>
        </article>
      </section>

      <section className="parcel-discount-summary">
        <Percent
          size={15}
        />

        <span>
          Descontos
          concedidos
        </span>

        <strong>
          {currency(
            totals.discount
          )}
        </strong>
      </section>

      <section className="vehicle-toolbar parcel-toolbar">
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
            placeholder="Buscar cliente, CPF, telefone, veículo, placa ou parcela..."
          />
        </div>

        <select
          value={
            periodFilter
          }
          onChange={(
            event
          ) =>
            setPeriodFilter(
              event.target
                .value
            )
          }
        >
          <option value="todos">
            Todas as datas
          </option>

          <option value="hoje">
            Vencem hoje
          </option>

          <option value="atrasadas">
            Atrasadas
          </option>

          <option value="proximos7">
            Próximos 7 dias
          </option>

          <option value="pagas">
            Pagas
          </option>
        </select>

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

          <option value="pendente">
            Pendentes
          </option>

          <option value="atrasado">
            Atrasadas
          </option>

          <option value="parcial">
            Parciais
          </option>

          <option value="pago">
            Pagas
          </option>
        </select>

        <select
          value={
            operationFilter
          }
          onChange={(
            event
          ) =>
            setOperationFilter(
              event.target
                .value
            )
          }
        >
          <option value="todos">
            Todas operações
          </option>

          <option value="locacao_compra">
            Locação c/ compra
          </option>

          <option value="venda_veiculo">
            Venda veículo
          </option>

          <option value="emprestimo">
            Empréstimo
          </option>

          <option value="venda_parcelada">
            Venda parcelada
          </option>
        </select>
      </section>

      <section className="vehicle-table-card">
        <div className="vehicle-table-scroll">
          <table className="vehicle-table parcel-table">
            <thead>
              <tr>
                <th>
                  Cliente
                </th>

                <th>
                  Veículo
                </th>

                <th>
                  Parcela
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
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={
                      11
                    }
                    className="vehicle-table-empty"
                  >
                    Nenhuma
                    parcela
                    encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map(
                  (
                    installment
                  ) => {
                    const operation =
                      single(
                        installment.operacoes
                      );

                    const client =
                      single(
                        operation?.clientes
                      );

                    const vehicle =
                      single(
                        operation?.veiculos
                      );

                    const currentStatus =
                      effectiveStatus(
                        installment
                      );

                    const balance =
                      installmentBalance(
                        installment
                      );

                    const payments =
                      Array.isArray(
                        installment.pagamentos
                      )
                        ? installment.pagamentos
                        : [];

                    const hasProof =
                      payments.some(
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
                          currentStatus ===
                          "pago"
                            ? "installment-row-paid"
                            : currentStatus ===
                                "atrasado"
                              ? "installment-row-overdue"
                              : ""
                        }
                      >
                        <td>
                          <div className="parcel-client">
                            <strong>
                              {client?.nome ??
                                "—"}
                            </strong>

                            <span>
                              {client?.telefone ??
                                ""}
                            </span>
                          </div>
                        </td>

                        <td>
                          {vehicle ? (
                            <div className="parcel-vehicle">
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
                          <strong>
                            {
                              installment.numero
                            }
                          </strong>

                          <span className="parcel-total-count">
                            /
                            {operation?.quantidade_parcelas ??
                              "—"}
                          </span>
                        </td>

                        <td className="vehicle-nowrap">
                          {formatDate(
                            installment.vencimento
                          )}
                        </td>

                        <td className="vehicle-nowrap">
                          {currency(
                            installment.valor
                          )}
                        </td>

                        <td className="vehicle-nowrap">
                          {currency(
                            installment.valor_pago
                          )}
                        </td>

                        <td className="vehicle-nowrap">
                          {Number(
                            installment.desconto_valor ??
                              0
                          ) >
                          0 ? (
                            <span className="parcel-discount-value">
                              -
                              {currency(
                                installment.desconto_valor
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="vehicle-nowrap">
                          <strong>
                            {currency(
                              balance
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`installment-status installment-status-${currentStatus}`}
                          >
                            {statusNames[
                              currentStatus
                            ] ??
                              currentStatus}
                          </span>
                        </td>

                        <td>
                          {hasProof ? (
                            <span className="proof-ok">
                              <FileCheck2
                                size={
                                  13
                                }
                              />

                              Sim
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>
                          <div className="parcel-actions">
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
                                    13
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

                            <button
                              type="button"
                              className="parcel-history-button"
                              onClick={() =>
                                setHistoryInstallment(
                                  installment
                                )
                              }
                            >
                              <Eye
                                size={
                                  13
                                }
                              />

                              Histórico
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

        <footer className="vehicle-table-footer">
          <span>
            {
              filtered.length
            }{" "}
            parcela(s)
          </span>
        </footer>
      </section>

      {selectedInstallment && (
        <div className="vehicle-modal-overlay payment-layer">
          <div className="payment-modal">
            <header className="vehicle-modal-header">
              <div>
                <span>
                  REGISTRAR PAGAMENTO
                </span>

                <h2>
                  Parcela{" "}
                  {
                    selectedInstallment.numero
                  }
                </h2>

                <p>
                  Pagamento,
                  desconto e
                  comprovante.
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
                <X
                  size={
                    20
                  }
                />
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
                    Valor da
                    parcela
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
                    Saldo
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
                      Ideal para
                      pagamento
                      antecipado.
                    </span>
                  </div>
                </div>

                <div className="discount-buttons">
                  {[
                    0,
                    5,
                    10,
                    15,
                    20,
                    30,
                    50,
                  ].map(
                    (
                      percentage
                    ) => (
                      <button
                        type="button"
                        key={
                          percentage
                        }
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
                  Outro desconto
                  (%)

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
                    ) =>
                      applyDiscount(
                        Number(
                          event.target
                            .value
                        )
                      )
                    }
                  />
                </label>

                <div className="discount-preview">
                  <div>
                    <span>
                      Desconto
                    </span>

                    <strong>
                      -
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
                      name="valor_pago"
                      min="0"
                      step="0.01"
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
                    Data do
                    pagamento *

                    <input
                      type="date"
                      name="data_pagamento"
                      required
                      defaultValue={
                        todayString()
                      }
                    />
                  </label>

                  <label>
                    Forma de
                    pagamento *

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
                      placeholder="Ex.: pagamento antecipado com desconto."
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

      {historyInstallment && (
        <div className="vehicle-modal-overlay payment-layer">
          <div className="parcel-history-modal">
            <header className="vehicle-modal-header">
              <div>
                <span>
                  HISTÓRICO
                </span>

                <h2>
                  Parcela{" "}
                  {
                    historyInstallment.numero
                  }
                </h2>

                <p>
                  Movimentações
                  financeiras da
                  parcela.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setHistoryInstallment(
                    null
                  )
                }
              >
                <X
                  size={
                    20
                  }
                />
              </button>
            </header>

            <div className="parcel-history-body">
              <div className="payment-summary-box">
                <div>
                  <span>
                    Original
                  </span>

                  <strong>
                    {currency(
                      historyInstallment.valor
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Recebido
                  </span>

                  <strong>
                    {currency(
                      historyInstallment.valor_pago
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Desconto
                  </span>

                  <strong>
                    {currency(
                      historyInstallment.desconto_valor
                    )}
                  </strong>
                </div>
              </div>

              <h3>
                Pagamentos
              </h3>

              {!Array.isArray(
                historyInstallment.pagamentos
              ) ||
              historyInstallment
                .pagamentos
                .length ===
                0 ? (
                <div className="parcel-history-empty">
                  Nenhum
                  pagamento
                  registrado.
                </div>
              ) : (
                <div className="parcel-payment-history">
                  {historyInstallment.pagamentos
                    .slice()
                    .sort(
                      (
                        a,
                        b
                      ) =>
                        b.data_pagamento.localeCompare(
                          a.data_pagamento
                        )
                    )
                    .map(
                      (
                        payment
                      ) => (
                        <article
                          key={
                            payment.id
                          }
                          className="parcel-payment-entry"
                        >
                          <div className="parcel-payment-entry-icon">
                            <ReceiptText
                              size={
                                16
                              }
                            />
                          </div>

                          <div className="parcel-payment-entry-main">
                            <strong>
                              {currency(
                                payment.valor
                              )}
                            </strong>

                            <span>
                              {formatDate(
                                payment.data_pagamento
                              )}
                              {" • "}
                              {paymentNames[
                                payment.forma_pagamento
                              ] ??
                                payment.forma_pagamento}
                            </span>

                            {payment.observacoes && (
                              <small>
                                {
                                  payment.observacoes
                                }
                              </small>
                            )}
                          </div>

                          <div className="parcel-payment-entry-side">
                            {Number(
                              payment.desconto_valor ??
                                0
                            ) >
                              0 && (
                              <span className="history-discount">
                                -
                                {currency(
                                  payment.desconto_valor
                                )}
                              </span>
                            )}

                            {payment.comprovante_path && (
                              <span className="proof-ok">
                                <FileCheck2
                                  size={
                                    12
                                  }
                                />

                                Comprovante
                              </span>
                            )}
                          </div>
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