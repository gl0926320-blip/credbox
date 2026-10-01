"use client";

import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
} from "lucide-react";

type Installment = {
  id: string;
  numero: number;
  vencimento: string;
  valor: number;
  valor_pago?: number | null;
  desconto_valor?: number | null;
  status?: string | null;
  pago_em?: string | null;
};

interface Props {
  installments: Installment[];
}

const PAGE_SIZE = 10;

function currency(
  value?: number | null
) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  ).format(Number(value ?? 0));
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "—";
  }

  const dateOnly =
    value.slice(0, 10);

  const [
    year,
    month,
    day,
  ] = dateOnly.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

function getStatus(
  installment: Installment
) {
  const status =
    String(
      installment.status ?? ""
    ).toLowerCase();

  if (
    status === "pago" ||
    status === "quitado"
  ) {
    return {
      label: "Pago",
      className: "paid",
    };
  }

  if (
    status === "parcial"
  ) {
    return {
      label: "Parcial",
      className: "partial",
    };
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  const dueDate =
    new Date(
      `${installment.vencimento}T00:00:00`
    );

  if (
    dueDate.getTime() <
    today.getTime()
  ) {
    return {
      label:
        "Em atraso",
      className:
        "overdue",
    };
  }

  return {
    label:
      "Pendente",
    className:
      "pending",
  };
}

export default function PortalParcelasTable({
  installments,
}: Props) {
  const [
    page,
    setPage,
  ] =
    useState(1);

  const sorted =
    useMemo(
      () =>
        [...installments].sort(
          (a, b) =>
            Number(a.numero) -
            Number(b.numero)
        ),
      [installments]
    );

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        sorted.length /
          PAGE_SIZE
      )
    );

  const safePage =
    Math.min(
      page,
      totalPages
    );

  const start =
    (safePage - 1) *
    PAGE_SIZE;

  const visible =
    sorted.slice(
      start,
      start + PAGE_SIZE
    );

  const first =
    sorted.length === 0
      ? 0
      : start + 1;

  const last =
    Math.min(
      start +
        PAGE_SIZE,
      sorted.length
    );

  return (
    <div className="portal-installments">
      <div className="portal-installments-meta">
        <span>
          Exibindo{" "}
          <strong>
            {first}–{last}
          </strong>{" "}
          de{" "}
          <strong>
            {
              sorted.length
            }
          </strong>{" "}
          parcelas
        </span>

        <span>
          Página{" "}
          <strong>
            {safePage}
          </strong>{" "}
          de{" "}
          <strong>
            {totalPages}
          </strong>
        </span>
      </div>

      {/* DESKTOP / TABLET */}

      <div className="portal-installments-table-wrap">
        <table className="portal-installments-table">
          <thead>
            <tr>
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
                Pago
              </th>

              <th>
                Saldo
              </th>

              <th>
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {visible.map(
              (
                installment
              ) => {
                const paid =
                  Number(
                    installment.valor_pago ??
                      0
                  );

                const discount =
                  Number(
                    installment.desconto_valor ??
                      0
                  );

                const remaining =
                  Math.max(
                    0,
                    Number(
                      installment.valor ??
                        0
                    ) -
                      paid -
                      discount
                  );

                const status =
                  getStatus(
                    installment
                  );

                return (
                  <tr
                    key={
                      installment.id
                    }
                  >
                    <td>
                      <strong>
                        #
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
                        paid
                      )}
                    </td>

                    <td>
                      <strong>
                        {currency(
                          remaining
                        )}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`portal-installment-status ${status.className}`}
                      >
                        {
                          status.label
                        }
                      </span>
                    </td>
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE */}

      <div className="portal-installments-mobile">
        {visible.map(
          (
            installment
          ) => {
            const paid =
              Number(
                installment.valor_pago ??
                  0
              );

            const discount =
              Number(
                installment.desconto_valor ??
                  0
              );

            const remaining =
              Math.max(
                0,
                Number(
                  installment.valor ??
                    0
                ) -
                  paid -
                  discount
              );

            const status =
              getStatus(
                installment
              );

            return (
              <article
                key={
                  installment.id
                }
                className="portal-installment-mobile-card"
              >
                <header>
                  <div>
                    <span>
                      PARCELA
                    </span>

                    <strong>
                      #
                      {
                        installment.numero
                      }
                    </strong>
                  </div>

                  <span
                    className={`portal-installment-status ${status.className}`}
                  >
                    {status.className ===
                    "paid" ? (
                      <CheckCircle2
                        size={
                          13
                        }
                      />
                    ) : (
                      <Clock3
                        size={
                          13
                        }
                      />
                    )}

                    {
                      status.label
                    }
                  </span>
                </header>

                <div className="portal-installment-mobile-grid">
                  <div>
                    <span>
                      Vencimento
                    </span>

                    <strong>
                      {formatDate(
                        installment.vencimento
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Valor
                    </span>

                    <strong>
                      {currency(
                        installment.valor
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Pago
                    </span>

                    <strong>
                      {currency(
                        paid
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Saldo
                    </span>

                    <strong>
                      {currency(
                        remaining
                      )}
                    </strong>
                  </div>
                </div>
              </article>
            );
          }
        )}
      </div>

      {sorted.length >
        PAGE_SIZE && (
        <footer className="portal-pagination">
          <button
            type="button"
            disabled={
              safePage <= 1
            }
            onClick={() =>
              setPage(
                (
                  current
                ) =>
                  Math.max(
                    1,
                    current -
                      1
                  )
              )
            }
          >
            <ChevronLeft
              size={15}
            />

            Anterior
          </button>

          <div className="portal-page-numbers">
            {Array.from(
              {
                length:
                  totalPages,
              },
              (_, index) =>
                index + 1
            ).map(
              (
                number
              ) => (
                <button
                  type="button"
                  key={
                    number
                  }
                  className={
                    number ===
                    safePage
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setPage(
                      number
                    )
                  }
                >
                  {
                    number
                  }
                </button>
              )
            )}
          </div>

          <button
            type="button"
            disabled={
              safePage >=
              totalPages
            }
            onClick={() =>
              setPage(
                (
                  current
                ) =>
                  Math.min(
                    totalPages,
                    current +
                      1
                  )
              )
            }
          >
            Próxima

            <ChevronRight
              size={15}
            />
          </button>
        </footer>
      )}
    </div>
  );
}