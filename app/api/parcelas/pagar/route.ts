import {
  NextResponse,
} from "next/server";

import {
  revalidatePath,
} from "next/cache";

import {
  supabaseAdmin,
} from "../../../../lib/supabase/admin";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

function text(
  data: FormData,
  key: string
) {
  const value =
    data.get(key);

  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function numeric(
  data: FormData,
  key: string
) {
  const raw =
    text(
      data,
      key
    );

  if (!raw) {
    return 0;
  }

  const value =
    Number(
      raw.replace(
        ",",
        "."
      )
    );

  return Number.isFinite(
    value
  )
    ? value
    : 0;
}

export async function POST(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const parcelaId =
      text(
        formData,
        "parcela_id"
      );

    const amount =
      numeric(
        formData,
        "valor_pago"
      );

    let discountPercent =
      numeric(
        formData,
        "desconto_percentual"
      );

    discountPercent =
      Math.min(
        100,
        Math.max(
          0,
          discountPercent
        )
      );

    const paymentDate =
      text(
        formData,
        "data_pagamento"
      );

    const paymentMethod =
      text(
        formData,
        "forma_pagamento"
      );

    if (!parcelaId) {
      return NextResponse.json(
        {
          error:
            "Parcela não informada.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      amount < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Valor de pagamento inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (!paymentDate) {
      return NextResponse.json(
        {
          error:
            "Informe a data do pagamento.",
        },
        {
          status: 400,
        }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        {
          error:
            "Informe a forma de pagamento.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data:
        installment,
      error:
        installmentError,
    } =
      await supabaseAdmin
        .from(
          "parcelas"
        )
        .select(`
          id,
          operacao_id,
          valor,
          valor_pago,
          desconto_valor,
          status
        `)
        .eq(
          "id",
          parcelaId
        )
        .single();

    if (
      installmentError ||
      !installment
    ) {
      return NextResponse.json(
        {
          error:
            "Parcela não encontrada.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      installment.status ===
      "pago"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta parcela já está paga.",
        },
        {
          status: 400,
        }
      );
    }

    const originalValue =
      Number(
        installment.valor
      );

    const alreadyPaid =
      Number(
        installment.valor_pago ??
          0
      );

    const existingDiscount =
      Number(
        installment.desconto_valor ??
          0
      );

    const currentBalance =
      Math.max(
        0,
        originalValue -
          alreadyPaid -
          existingDiscount
      );

    const discountValue =
      Number(
        (
          currentBalance *
          (discountPercent /
            100)
        ).toFixed(2)
      );

    const payableAfterDiscount =
      Math.max(
        0,
        Number(
          (
            currentBalance -
            discountValue
          ).toFixed(2)
        )
      );

    if (
      amount >
      payableAfterDiscount +
        0.01
    ) {
      return NextResponse.json(
        {
          error:
            `O valor recebido não pode ultrapassar ${payableAfterDiscount.toLocaleString(
              "pt-BR",
              {
                style:
                  "currency",
                currency:
                  "BRL",
              }
            )}.`,
        },
        {
          status: 400,
        }
      );
    }

    if (
      amount === 0 &&
      discountValue === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Informe um valor pago ou um desconto.",
        },
        {
          status: 400,
        }
      );
    }

    let proofPath:
      | string
      | null = null;

    const proof =
      formData.get(
        "comprovante"
      );

    if (
      proof instanceof File &&
      proof.size > 0
    ) {
      if (
        proof.size >
        10 *
          1024 *
          1024
      ) {
        return NextResponse.json(
          {
            error:
              "O comprovante deve ter no máximo 10 MB.",
          },
          {
            status: 400,
          }
        );
      }

      const safeName =
        proof.name
          .normalize("NFD")
          .replace(
            /[\u0300-\u036f]/g,
            ""
          )
          .replace(
            /[^a-zA-Z0-9._-]/g,
            "_"
          );

      proofPath =
        `${installment.operacao_id}/${parcelaId}/${crypto.randomUUID()}-${safeName}`;

      const buffer =
        await proof.arrayBuffer();

      const {
        error:
          uploadError,
      } =
        await supabaseAdmin
          .storage
          .from(
            "payment-proofs"
          )
          .upload(
            proofPath,
            buffer,
            {
              contentType:
                proof.type ||
                "application/octet-stream",

              upsert: false,
            }
          );

      if (uploadError) {
        return NextResponse.json(
          {
            error:
              `Erro ao enviar comprovante: ${uploadError.message}`,
          },
          {
            status: 400,
          }
        );
      }
    }

    const newPaid =
      Number(
        (
          alreadyPaid +
          amount
        ).toFixed(2)
      );

    const newDiscount =
      Number(
        (
          existingDiscount +
          discountValue
        ).toFixed(2)
      );

    const totalLiquidated =
      newPaid +
      newDiscount;

    const fullyPaid =
      totalLiquidated >=
      originalValue -
        0.01;

    const newStatus =
      fullyPaid
        ? "pago"
        : newPaid > 0 ||
            newDiscount > 0
          ? "parcial"
          : "pendente";

    const {
      error:
        paymentError,
    } =
      await supabaseAdmin
        .from(
          "pagamentos"
        )
        .insert({
          parcela_id:
            parcelaId,

          operacao_id:
            installment.operacao_id,

          valor:
            amount,

          data_pagamento:
            paymentDate,

          forma_pagamento:
            paymentMethod,

          comprovante_path:
            proofPath,

          desconto_percentual:
            discountPercent,

          desconto_valor:
            discountValue,

          observacoes:
            text(
              formData,
              "observacoes"
            ) || null,
        });

    if (
      paymentError
    ) {
      throw new Error(
        paymentError.message
      );
    }

    const {
      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          "parcelas"
        )
        .update({
          valor_pago:
            newPaid,

          desconto_valor:
            newDiscount,

          status:
            newStatus,

          pago_em:
            fullyPaid
              ? paymentDate
              : null,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          parcelaId
        );

    if (
      updateError
    ) {
      throw new Error(
        updateError.message
      );
    }

    /*
     * Verifica se ainda há
     * parcelas abertas.
     */

    const {
      data:
        operationInstallments,
      error:
        remainingError,
    } =
      await supabaseAdmin
        .from(
          "parcelas"
        )
        .select(`
          id,
          valor,
          valor_pago,
          desconto_valor,
          status
        `)
        .eq(
          "operacao_id",
          installment.operacao_id
        );

    if (
      remainingError
    ) {
      throw new Error(
        remainingError.message
      );
    }

    const hasOpenBalance =
      (
        operationInstallments ??
        []
      ).some(
        (item) => {
          const balance =
            Number(
              item.valor
            ) -
            Number(
              item.valor_pago ??
                0
            ) -
            Number(
              item.desconto_valor ??
                0
            );

          return (
            balance >
            0.01
          );
        }
      );

    if (
      !hasOpenBalance
    ) {
      const {
        data:
          operation,
        error:
          operationError,
      } =
        await supabaseAdmin
          .from(
            "operacoes"
          )
          .update({
            status:
              "quitada",

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            installment.operacao_id
          )
          .select(
            "veiculo_id"
          )
          .single();

      if (
        operationError
      ) {
        console.error(
          operationError
        );
      }

      if (
        operation?.veiculo_id
      ) {
        await supabaseAdmin
          .from(
            "veiculos"
          )
          .update({
            status:
              "quitado",

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            operation.veiculo_id
          );
      }
    }

    revalidatePath(
      "/operacoes"
    );

    revalidatePath(
      "/parcelas"
    );

    revalidatePath(
      "/veiculos"
    );

    revalidatePath(
      "/clientes"
    );

    revalidatePath("/");

    return NextResponse.json({
      success: true,

      payment: {
        amount,
        discountPercent,
        discountValue,
        fullyPaid,
        status:
          newStatus,
      },
    });
  } catch (error) {
    console.error(
      "PAYMENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao registrar pagamento.",
      },
      {
        status: 500,
      }
    );
  }
}