"use client";

import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bike,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  FileText,
  HandCoins,
  Percent,
  ReceiptText,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
} from "lucide-react";

import Link from "next/link";

type Client = {
  id: string;
  nome: string;
  cpf?: string | null;
  telefone?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type LinkClient = {
  id: string;
  nome: string;
};

type VehicleLink = {
  id: string;
  ativo: boolean;
  tipo_vinculo: string;

  clientes:
    | LinkClient
    | LinkClient[]
    | null;
};

type Vehicle = {
  id: string;
  tipo: string;
  marca: string;
  modelo: string;
  placa?: string | null;
  status?: string | null;
  valor_compra?: number | null;
  valor_fipe?: number | null;
  valor_venda?: number | null;
  created_at?: string | null;

  cliente_veiculos?:
    | VehicleLink[]
    | null;
};

type OperationClient = {
  id: string;
  nome: string;
  telefone?: string | null;
};

type OperationVehicle = {
  id: string;
  marca: string;
  modelo: string;
  placa?: string | null;
};

type Payment = {
  id: string;
  valor: number;
  data_pagamento: string;
  forma_pagamento: string;
  comprovante_path?: string | null;
  desconto_percentual?: number | null;
  desconto_valor?: number | null;
  created_at?: string | null;
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

  pagamentos?:
    | Payment[]
    | null;
};

type Operation = {
  id: string;

  cliente_id: string;

  veiculo_id?:
    | string
    | null;

  tipo: string;

  descricao?:
    | string
    | null;

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

  created_at?: string | null;

  clientes:
    | OperationClient
    | OperationClient[]
    | null;

  veiculos:
    | OperationVehicle
    | OperationVehicle[]
    | null;

  parcelas?:
    | Installment[]
    | null;
};

type ContractClient = {
  id: string;
  nome: string;
};

type Contract = {
  id: string;

  titulo: string;

  numero?: string | null;

  tipo: string;

  status: string;

  valor_contrato?: number | null;

  data_assinatura?: string | null;

  inicio_vigencia?: string | null;

  fim_vigencia?: string | null;

  created_at?: string | null;

  clientes:
    | ContractClient
    | ContractClient[]
    | null;
};

interface Props {
  clients?: Client[];
  vehicles?: Vehicle[];
  operations?: Operation[];
  contracts?: Contract[];
}

type FlattenedInstallment = {
  installment: Installment;
  operation: Operation;
  client: OperationClient | null;
  vehicle: OperationVehicle | null;
};

type FlattenedPayment = {
  payment: Payment;
  operation: Operation;
  installment: Installment;
  client: OperationClient | null;
  vehicle: OperationVehicle | null;
};

const operationNames:
  Record<string, string> = {
  locacao_compra:
    "Locação com compra final",

  venda_veiculo:
    "Venda de veículo",

  venda_parcelada:
    "Venda parcelada",

  emprestimo:
    "Empréstimo",

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
    Array.isArray(value)
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
      style: "currency",
      currency: "BRL",
    }
  ).format(
    Number(
      value ?? 0
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

  const datePart =
    value.slice(
      0,
      10
    );

  const [
    year,
    month,
    day,
  ] =
    datePart.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function todayString() {
  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
        1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function addDays(
  value: string,
  days: number
) {
  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  date.setDate(
    date.getDate() +
      days
  );

  return [
    date.getFullYear(),
    String(
      date.getMonth() +
        1
    ).padStart(
      2,
      "0"
    ),
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    ),
  ].join("-");
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

  if (
    installment.vencimento <
    todayString()
  ) {
    return "atrasado";
  }

  return "pendente";
}

function getMonthKey(
  date: Date
) {
  return `${date.getFullYear()}-${String(
    date.getMonth() +
      1
  ).padStart(
    2,
    "0"
  )}`;
}

function monthName(
  key: string
) {
  const [
    year,
    month,
  ] =
    key.split("-");

  const date =
    new Date(
      Number(year),
      Number(month) -
        1,
      1
    );

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      month: "short",
    }
  )
    .format(date)
    .replace(".", "");
}

function vehicleIcon(
  type: string
) {
  if (
    type === "moto"
  ) {
    return (
      <Bike size={15} />
    );
  }

  return (
    <Car size={15} />
  );
}

export default function DashboardManager({
  clients = [],
  vehicles = [],
  operations = [],
  contracts = [],
}: Props) {
  const safeClients =
    Array.isArray(clients)
      ? clients
      : [];

  const safeVehicles =
    Array.isArray(vehicles)
      ? vehicles
      : [];

  const safeOperations =
    Array.isArray(operations)
      ? operations
      : [];

  const safeContracts =
    Array.isArray(contracts)
      ? contracts
      : [];

  const today =
    todayString();

  const next7 =
    addDays(
      today,
      7
    );

  const allInstallments:
    FlattenedInstallment[] =
    [];

  const allPayments:
    FlattenedPayment[] =
    [];

  safeOperations.forEach(
    (operation) => {
      const client =
        single(
          operation.clientes
        );

      const vehicle =
        single(
          operation.veiculos
        );

      const installments =
        Array.isArray(
          operation.parcelas
        )
          ? operation.parcelas
          : [];

      installments.forEach(
        (installment) => {
          allInstallments.push({
            installment,
            operation,
            client,
            vehicle,
          });

          const payments =
            Array.isArray(
              installment.pagamentos
            )
              ? installment.pagamentos
              : [];

          payments.forEach(
            (payment) => {
              allPayments.push({
                payment,
                operation,
                installment,
                client,
                vehicle,
              });
            }
          );
        }
      );
    }
  );

  const totalContracted =
    allInstallments.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.installment
            .valor ?? 0
        ),
      0
    );

  const totalReceived =
    allInstallments.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.installment
            .valor_pago ?? 0
        ),
      0
    );

  const totalDiscount =
    allInstallments.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.installment
            .desconto_valor ??
            0
        ),
      0
    );

  const totalOpen =
    allInstallments.reduce(
      (
        total,
        item
      ) =>
        total +
        installmentBalance(
          item.installment
        ),
      0
    );

  const overdue =
    allInstallments.filter(
      (item) =>
        effectiveStatus(
          item.installment
        ) ===
        "atrasado"
    );

  const overdueValue =
    overdue.reduce(
      (
        total,
        item
      ) =>
        total +
        installmentBalance(
          item.installment
        ),
      0
    );

  const dueToday =
    allInstallments.filter(
      (item) =>
        item.installment
          .vencimento ===
          today &&
        installmentBalance(
          item.installment
        ) > 0
    );

  const upcoming =
    allInstallments
      .filter(
        (item) =>
          item.installment
            .vencimento >=
            today &&
          item.installment
            .vencimento <=
            next7 &&
          installmentBalance(
            item.installment
          ) > 0
      )
      .sort(
        (a, b) =>
          a.installment
            .vencimento.localeCompare(
              b.installment
                .vencimento
            )
      );

  const totalCaucao =
    safeOperations.reduce(
      (
        total,
        operation
      ) =>
        total +
        Number(
          operation.caucao_recebida ??
            0
        ),
      0
    );

  const activeOperations =
    safeOperations.filter(
      (operation) =>
        operation.status ===
        "ativa"
    );

  const activeClients =
    safeClients.filter(
      (client) =>
        client.status ===
        "ativo"
    );

  const availableVehicles =
    safeVehicles.filter(
      (vehicle) =>
        vehicle.status ===
        "disponivel"
    );

  const allocatedVehicles =
    safeVehicles.filter(
      (vehicle) =>
        vehicle.status ===
          "locado" ||
        vehicle.status ===
          "vendido"
    );

  const activeContracts =
    safeContracts.filter(
      (contract) =>
        contract.status ===
        "ativo"
    );

  const paidInstallments =
    allInstallments.filter(
      (item) =>
        effectiveStatus(
          item.installment
        ) ===
        "pago"
    );

  const receiveRate =
    totalContracted > 0
      ? Math.min(
          100,
          (
            (totalReceived +
              totalDiscount) /
            totalContracted
          ) *
            100
        )
      : 0;

  const recentPayments =
    allPayments
      .slice()
      .sort(
        (a, b) =>
          (
            b.payment
              .created_at ??
            b.payment
              .data_pagamento
          ).localeCompare(
            a.payment
              .created_at ??
              a.payment
                .data_pagamento
          )
      )
      .slice(
        0,
        6
      );

  const recentOperations =
    safeOperations
      .slice()
      .sort(
        (a, b) =>
          (
            b.created_at ??
            ""
          ).localeCompare(
            a.created_at ??
              ""
          )
      )
      .slice(
        0,
        5
      );

  const monthKeys: string[] =
    [];

  const now =
    new Date();

  for (
    let index = 5;
    index >= 0;
    index--
  ) {
    const date =
      new Date(
        now.getFullYear(),
        now.getMonth() -
          index,
        1
      );

    monthKeys.push(
      getMonthKey(date)
    );
  }

  const monthlyValues =
    monthKeys.map(
      (month) => {
        const received =
          allPayments
            .filter(
              (item) =>
                item.payment
                  .data_pagamento
                  ?.startsWith(
                    month
                  )
            )
            .reduce(
              (
                total,
                item
              ) =>
                total +
                Number(
                  item.payment
                    .valor ??
                    0
                ),
              0
            );

        return {
          month,
          received,
        };
      }
    );

  const maxMonthValue =
    Math.max(
      1,
      ...monthlyValues.map(
        (item) =>
          item.received
      )
    );

  return (
    <div className="page-container dashboard-page">
      <header className="page-header dashboard-header">
        <div>
          <span className="page-eyebrow">
            VISÃO GERAL
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Acompanhe sua
            carteira financeira,
            patrimônio,
            recebimentos e
            próximos vencimentos.
          </p>
        </div>

        <Link
          href="/operacoes"
          className="primary-button dashboard-new-operation"
        >
          <HandCoins
            size={
              17
            }
          />

          Nova operação
        </Link>
      </header>

      {/* PRINCIPAIS INDICADORES */}

      <section className="dashboard-kpi-grid">
        <article className="dashboard-kpi">
          <div className="dashboard-kpi-icon purple">
            <WalletCards
              size={
                20
              }
            />
          </div>

          <div className="dashboard-kpi-body">
            <span>
              Carteira contratada
            </span>

            <strong>
              {currency(
                totalContracted
              )}
            </strong>

            <small>
              {
                safeOperations.length
              }{" "}
              operação(ões)
            </small>
          </div>
        </article>

        <article className="dashboard-kpi">
          <div className="dashboard-kpi-icon green">
            <CheckCircle2
              size={
                20
              }
            />
          </div>

          <div className="dashboard-kpi-body">
            <span>
              Total recebido
            </span>

            <strong>
              {currency(
                totalReceived
              )}
            </strong>

            <small>
              {
                paidInstallments.length
              }{" "}
              parcela(s) paga(s)
            </small>
          </div>
        </article>

        <article className="dashboard-kpi">
          <div className="dashboard-kpi-icon blue">
            <Banknote
              size={
                20
              }
            />
          </div>

          <div className="dashboard-kpi-body">
            <span>
              Saldo a receber
            </span>

            <strong>
              {currency(
                totalOpen
              )}
            </strong>

            <small>
              carteira ainda
              aberta
            </small>
          </div>
        </article>

        <article className="dashboard-kpi dashboard-kpi-danger">
          <div className="dashboard-kpi-icon red">
            <AlertTriangle
              size={
                20
              }
            />
          </div>

          <div className="dashboard-kpi-body">
            <span>
              Em atraso
            </span>

            <strong>
              {currency(
                overdueValue
              )}
            </strong>

            <small>
              {
                overdue.length
              }{" "}
              parcela(s)
            </small>
          </div>
        </article>
      </section>

      {/* SEGUNDA LINHA */}

      <section className="dashboard-small-kpis">
        <article>
          <Users
            size={
              17
            }
          />

          <div>
            <span>
              Clientes ativos
            </span>

            <strong>
              {
                activeClients.length
              }
            </strong>
          </div>
        </article>

        <article>
          <Car
            size={
              17
            }
          />

          <div>
            <span>
              Veículos vinculados
            </span>

            <strong>
              {
                allocatedVehicles.length
              }
            </strong>
          </div>
        </article>

        <article>
          <Car
            size={
              17
            }
          />

          <div>
            <span>
              Disponíveis
            </span>

            <strong>
              {
                availableVehicles.length
              }
            </strong>
          </div>
        </article>

        <article>
          <FileText
            size={
              17
            }
          />

          <div>
            <span>
              Contratos ativos
            </span>

            <strong>
              {
                activeContracts.length
              }
            </strong>
          </div>
        </article>

        <article>
          <HandCoins
            size={
              17
            }
          />

          <div>
            <span>
              Cauções recebidas
            </span>

            <strong>
              {currency(
                totalCaucao
              )}
            </strong>
          </div>
        </article>

        <article>
          <Percent
            size={
              17
            }
          />

          <div>
            <span>
              Descontos
            </span>

            <strong>
              {currency(
                totalDiscount
              )}
            </strong>
          </div>
        </article>
      </section>

      {/* BLOCO CENTRAL */}

      <section className="dashboard-main-grid">
        {/* RECEBIMENTO */}

        <article className="dashboard-panel dashboard-performance-panel">
          <header className="dashboard-panel-header">
            <div>
              <span>
                DESEMPENHO
              </span>

              <h2>
                Recebimentos
              </h2>
            </div>

            <TrendingUp
              size={
                18
              }
            />
          </header>

          <div className="dashboard-progress-summary">
            <div>
              <span>
                Progresso da
                carteira
              </span>

              <strong>
                {receiveRate.toFixed(
                  1
                )}
                %
              </strong>
            </div>

            <div className="dashboard-progress-track">
              <div
                className="dashboard-progress-value"
                style={{
                  width: `${receiveRate}%`,
                }}
              />
            </div>

            <div className="dashboard-progress-labels">
              <span>
                Recebido + descontos
              </span>

              <strong>
                {currency(
                  totalReceived +
                    totalDiscount
                )}
              </strong>
            </div>
          </div>

          <div className="dashboard-month-chart">
            {monthlyValues.map(
              (item) => {
                const height =
                  Math.max(
                    5,
                    (item.received /
                      maxMonthValue) *
                      100
                  );

                return (
                  <div
                    className="dashboard-month-column"
                    key={
                      item.month
                    }
                  >
                    <div className="dashboard-month-value">
                      <div
                        style={{
                          height: `${height}%`,
                        }}
                      />
                    </div>

                    <strong>
                      {currency(
                        item.received
                      )}
                    </strong>

                    <span>
                      {monthName(
                        item.month
                      )}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </article>

        {/* RESUMO HOJE */}

        <article className="dashboard-panel">
          <header className="dashboard-panel-header">
            <div>
              <span>
                COBRANÇA
              </span>

              <h2>
                Hoje
              </h2>
            </div>

            <CalendarDays
              size={
                18
              }
            />
          </header>

          <div className="dashboard-today-value">
            <span>
              Vencendo hoje
            </span>

            <strong>
              {currency(
                dueToday.reduce(
                  (
                    total,
                    item
                  ) =>
                    total +
                    installmentBalance(
                      item.installment
                    ),
                  0
                )
              )}
            </strong>

            <small>
              {
                dueToday.length
              }{" "}
              parcela(s)
            </small>
          </div>

          <Link
            href="/parcelas"
            className="dashboard-panel-link"
          >
            Ver contas a
            receber

            <ArrowRight
              size={
                14
              }
            />
          </Link>
        </article>
      </section>

      {/* PRÓXIMOS VENCIMENTOS */}

      <section className="dashboard-panel dashboard-full-panel">
        <header className="dashboard-panel-header">
          <div>
            <span>
              PRÓXIMOS 7 DIAS
            </span>

            <h2>
              Próximos
              vencimentos
            </h2>
          </div>

          <Link
            href="/parcelas"
            className="dashboard-text-link"
          >
            Ver todas

            <ArrowRight
              size={
                13
              }
            />
          </Link>
        </header>

        {upcoming.length ===
        0 ? (
          <div className="dashboard-empty">
            <CheckCircle2
              size={
                22
              }
            />

            <strong>
              Nenhum vencimento
              próximo
            </strong>

            <span>
              Não existem
              parcelas nos
              próximos 7 dias.
            </span>
          </div>
        ) : (
          <div className="dashboard-table-scroll">
            <table className="dashboard-table">
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
                    Situação
                  </th>
                </tr>
              </thead>

              <tbody>
                {upcoming
                  .slice(
                    0,
                    8
                  )
                  .map(
                    (
                      item
                    ) => {
                      const status =
                        effectiveStatus(
                          item.installment
                        );

                      return (
                        <tr
                          key={
                            item
                              .installment
                              .id
                          }
                        >
                          <td>
                            <div className="dashboard-person">
                              <div>
                                <UserRound
                                  size={
                                    13
                                  }
                                />
                              </div>

                              <strong>
                                {item.client
                                  ?.nome ??
                                  "—"}
                              </strong>
                            </div>
                          </td>

                          <td>
                            {item.vehicle
                              ? `${item.vehicle.marca} ${item.vehicle.modelo}`
                              : "—"}
                          </td>

                          <td>
                            {
                              item
                                .installment
                                .numero
                            }
                            /
                            {
                              item
                                .operation
                                .quantidade_parcelas
                            }
                          </td>

                          <td>
                            {formatDate(
                              item
                                .installment
                                .vencimento
                            )}
                          </td>

                          <td>
                            <strong>
                              {currency(
                                installmentBalance(
                                  item.installment
                                )
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`dashboard-status dashboard-status-${status}`}
                            >
                              {status ===
                              "atrasado"
                                ? "Atrasado"
                                : "A vencer"}
                            </span>
                          </td>
                        </tr>
                      );
                    }
                  )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* BLOCOS INFERIORES */}

      <section className="dashboard-bottom-grid">
        {/* PAGAMENTOS */}

        <article className="dashboard-panel">
          <header className="dashboard-panel-header">
            <div>
              <span>
                MOVIMENTAÇÕES
              </span>

              <h2>
                Últimos
                recebimentos
              </h2>
            </div>

            <ReceiptText
              size={
                18
              }
            />
          </header>

          {recentPayments.length ===
          0 ? (
            <div className="dashboard-empty compact">
              <span>
                Nenhum pagamento
                registrado.
              </span>
            </div>
          ) : (
            <div className="dashboard-activity-list">
              {recentPayments.map(
                (
                  item
                ) => (
                  <article
                    key={
                      item.payment
                        .id
                    }
                    className="dashboard-activity"
                  >
                    <div className="dashboard-activity-icon payment">
                      <CheckCircle2
                        size={
                          15
                        }
                      />
                    </div>

                    <div className="dashboard-activity-main">
                      <strong>
                        {item.client
                          ?.nome ??
                          "Cliente"}
                      </strong>

                      <span>
                        Parcela{" "}
                        {
                          item
                            .installment
                            .numero
                        }
                        {" • "}
                        {formatDate(
                          item.payment
                            .data_pagamento
                        )}
                      </span>
                    </div>

                    <strong className="dashboard-positive-value">
                      +
                      {currency(
                        item.payment
                          .valor
                      )}
                    </strong>
                  </article>
                )
              )}
            </div>
          )}

          <Link
            href="/parcelas"
            className="dashboard-panel-link"
          >
            Abrir parcelas

            <ArrowRight
              size={
                14
              }
            />
          </Link>
        </article>

        {/* OPERAÇÕES */}

        <article className="dashboard-panel">
          <header className="dashboard-panel-header">
            <div>
              <span>
                CARTEIRA
              </span>

              <h2>
                Operações
                recentes
              </h2>
            </div>

            <WalletCards
              size={
                18
              }
            />
          </header>

          {recentOperations.length ===
          0 ? (
            <div className="dashboard-empty compact">
              <span>
                Nenhuma operação
                cadastrada.
              </span>
            </div>
          ) : (
            <div className="dashboard-activity-list">
              {recentOperations.map(
                (
                  operation
                ) => {
                  const client =
                    single(
                      operation.clientes
                    );

                  const vehicle =
                    single(
                      operation.veiculos
                    );

                  const installments =
                    Array.isArray(
                      operation.parcelas
                    )
                      ? operation.parcelas
                      : [];

                  const paid =
                    installments.reduce(
                      (
                        total,
                        installment
                      ) =>
                        total +
                        Number(
                          installment.valor_pago ??
                            0
                        ),
                      0
                    );

                  return (
                    <article
                      key={
                        operation.id
                      }
                      className="dashboard-activity"
                    >
                      <div className="dashboard-activity-icon operation">
                        <HandCoins
                          size={
                            15
                          }
                        />
                      </div>

                      <div className="dashboard-activity-main">
                        <strong>
                          {client?.nome ??
                            "—"}
                        </strong>

                        <span>
                          {operationNames[
                            operation.tipo
                          ] ??
                            operation.tipo}
                          {vehicle
                            ? ` • ${vehicle.marca} ${vehicle.modelo}`
                            : ""}
                        </span>
                      </div>

                      <div className="dashboard-operation-mini">
                        <strong>
                          {currency(
                            paid
                          )}
                        </strong>

                        <span>
                          recebido
                        </span>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}

          <Link
            href="/operacoes"
            className="dashboard-panel-link"
          >
            Abrir operações

            <ArrowRight
              size={
                14
              }
            />
          </Link>
        </article>

        {/* VEÍCULOS */}

        <article className="dashboard-panel">
          <header className="dashboard-panel-header">
            <div>
              <span>
                PATRIMÔNIO
              </span>

              <h2>
                Veículos
              </h2>
            </div>

            <Car
              size={
                18
              }
            />
          </header>

          <div className="dashboard-vehicle-stats">
            <div>
              <span>
                Total
              </span>

              <strong>
                {
                  safeVehicles.length
                }
              </strong>
            </div>

            <div>
              <span>
                Disponíveis
              </span>

              <strong>
                {
                  availableVehicles.length
                }
              </strong>
            </div>

            <div>
              <span>
                Vinculados
              </span>

              <strong>
                {
                  allocatedVehicles.length
                }
              </strong>
            </div>
          </div>

          <div className="dashboard-vehicle-list">
            {safeVehicles
              .slice(
                0,
                5
              )
              .map(
                (
                  vehicle
                ) => {
                  const links =
                    Array.isArray(
                      vehicle.cliente_veiculos
                    )
                      ? vehicle.cliente_veiculos
                      : [];

                  const current =
                    links.find(
                      (link) =>
                        link.ativo
                    );

                  const client =
                    current
                      ? single(
                          current.clientes
                        )
                      : null;

                  return (
                    <article
                      key={
                        vehicle.id
                      }
                    >
                      <div className="dashboard-vehicle-icon">
                        {vehicleIcon(
                          vehicle.tipo
                        )}
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
                          {vehicle.placa ??
                            "Sem placa"}
                          {client
                            ? ` • ${client.nome}`
                            : ""}
                        </span>
                      </div>

                      <span
                        className={`dashboard-status dashboard-status-${vehicle.status}`}
                      >
                        {vehicle.status ===
                        "disponivel"
                          ? "Disponível"
                          : vehicle.status ===
                              "locado"
                            ? "Locado"
                            : vehicle.status ===
                                "vendido"
                              ? "Vendido"
                              : vehicle.status ??
                                "—"}
                      </span>
                    </article>
                  );
                }
              )}
          </div>

          <Link
            href="/veiculos"
            className="dashboard-panel-link"
          >
            Abrir veículos

            <ArrowRight
              size={
                14
              }
            />
          </Link>
        </article>
      </section>

      {/* ACESSO RÁPIDO */}

      <section className="dashboard-quick-section">
        <header>
          <div>
            <span>
              ACESSO RÁPIDO
            </span>

            <h2>
              Gerenciar CredBox
            </h2>
          </div>
        </header>

        <div className="dashboard-quick-grid">
          <Link href="/clientes">
            <div className="dashboard-quick-icon">
              <Users
                size={
                  19
                }
              />
            </div>

            <strong>
              Clientes
            </strong>

            <span>
              Cadastros e
              vínculos
            </span>
          </Link>

          <Link href="/veiculos">
            <div className="dashboard-quick-icon">
              <Car
                size={
                  19
                }
              />
            </div>

            <strong>
              Veículos
            </strong>

            <span>
              Patrimônio e
              situação
            </span>
          </Link>

          <Link href="/operacoes">
            <div className="dashboard-quick-icon">
              <HandCoins
                size={
                  19
                }
              />
            </div>

            <strong>
              Operações
            </strong>

            <span>
              Contratos
              financeiros
            </span>
          </Link>

          <Link href="/parcelas">
            <div className="dashboard-quick-icon">
              <CalendarDays
                size={
                  19
                }
              />
            </div>

            <strong>
              Parcelas
            </strong>

            <span>
              Cobrança e
              pagamentos
            </span>
          </Link>

          <Link href="/contratos">
            <div className="dashboard-quick-icon">
              <FileText
                size={
                  19
                }
              />
            </div>

            <strong>
              Contratos
            </strong>

            <span>
              Documentos e
              vigências
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}