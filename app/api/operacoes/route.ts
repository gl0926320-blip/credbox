import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { supabaseAdmin } from "../../../lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function string(
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

function number(
  data: FormData,
  key: string
) {
  const value =
    string(
      data,
      key
    );

  if (!value) {
    return 0;
  }

  const parsed =
    Number(
      value.replace(
        ",",
        "."
      )
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function parseDate(
  value: string
) {
  const [
    year,
    month,
    day,
  ] =
    value
      .split("-")
      .map(Number);

  return new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );
}

function dateString(
  date: Date
) {
  return date
    .toISOString()
    .slice(0, 10);
}

function nextDate(
  first: string,
  frequency: string,
  index: number
) {
  const date =
    parseDate(first);

  if (
    frequency ===
    "semanal"
  ) {
    date.setUTCDate(
      date.getUTCDate() +
        7 * index
    );
  }

  if (
    frequency ===
    "quinzenal"
  ) {
    date.setUTCDate(
      date.getUTCDate() +
        14 * index
    );
  }

  if (
    frequency ===
    "mensal"
  ) {
    date.setUTCMonth(
      date.getUTCMonth() +
        index
    );
  }

  return dateString(
    date
  );
}

function vehicleStatus(
  type: string
) {
  if (
    type ===
      "venda_veiculo" ||
    type ===
      "venda_parcelada"
  ) {
    return "vendido";
  }

  if (
    type ===
    "locacao_compra"
  ) {
    return "locado";
  }

  return null;
}

function linkType(
  type: string
) {
  if (
    type ===
    "locacao_compra"
  ) {
    return "locacao_compra";
  }

  if (
    type ===
      "venda_veiculo" ||
    type ===
      "venda_parcelada"
  ) {
    return "venda_parcelada";
  }

  if (
    type ===
    "emprestimo"
  ) {
    return "emprestimo_garantia";
  }

  return "outro";
}

async function uploadDocument(
  operationId: string,
  file: FormDataEntryValue | null,
  type:
    | "contrato"
    | "comprovante_caucao"
) {
  if (
    !(file instanceof File) ||
    file.size === 0
  ) {
    return;
  }

  const safeName =
    file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

  const path =
    `${operationId}/${crypto.randomUUID()}-${safeName}`;

  const buffer =
    await file.arrayBuffer();

  const {
    error:
      uploadError,
  } =
    await supabaseAdmin
      .storage
      .from(
        "operation-documents"
      )
      .upload(
        path,
        buffer,
        {
          contentType:
            file.type ||
            "application/octet-stream",
        }
      );

  if (uploadError) {
    throw new Error(
      uploadError.message
    );
  }

  const {
    error:
      documentError,
  } =
    await supabaseAdmin
      .from(
        "operacao_documentos"
      )
      .insert({
        operacao_id:
          operationId,

        tipo:
          type,

        nome_arquivo:
          file.name,

        caminho_storage:
          path,

        mime_type:
          file.type,

        tamanho_bytes:
          file.size,
      });

  if (documentError) {
    throw new Error(
      documentError.message
    );
  }
}

export async function POST(
  request: Request
) {
  let operationId:
    | string
    | null = null;

  try {
    const data =
      await request.formData();

    const clienteId =
      string(
        data,
        "cliente_id"
      );

    const veiculoId =
      string(
        data,
        "veiculo_id"
      );

    const tipo =
      string(
        data,
        "tipo"
      );

    const quantidade =
      Math.trunc(
        number(
          data,
          "quantidade_parcelas"
        )
      );

    const valorParcela =
      number(
        data,
        "valor_parcela"
      );

    const primeiroVencimento =
      string(
        data,
        "primeiro_vencimento"
      );

    const periodicidade =
      string(
        data,
        "periodicidade"
      );

    if (
      !clienteId ||
      !tipo ||
      quantidade <= 0 ||
      valorParcela <= 0 ||
      !primeiroVencimento
    ) {
      return NextResponse.json(
        {
          error:
            "Preencha os campos obrigatórios.",
        },
        {
          status: 400,
        }
      );
    }

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
        .insert({
          cliente_id:
            clienteId,

          veiculo_id:
            veiculoId ||
            null,

          tipo,

          descricao:
            string(
              data,
              "descricao"
            ) || null,

          valor_total:
            number(
              data,
              "valor_total"
            ),

          entrada:
            number(
              data,
              "entrada"
            ),

          caucao_prevista:
            number(
              data,
              "caucao_prevista"
            ),

          caucao_recebida:
            number(
              data,
              "caucao_recebida"
            ),

          caucao_status:
            string(
              data,
              "caucao_status"
            ) ||
            "nao_aplicavel",

          quantidade_parcelas:
            quantidade,

          valor_parcela:
            valorParcela,

          periodicidade,

          primeiro_vencimento:
            primeiroVencimento,

          status:
            "ativa",

          observacoes:
            string(
              data,
              "observacoes"
            ) || null,
        })
        .select()
        .single();

    if (
      operationError
    ) {
      throw new Error(
        operationError.message
      );
    }

    operationId =
      operation.id;

    const installments =
      Array.from(
        {
          length:
            quantidade,
        },
        (
          _,
          index
        ) => ({
          operacao_id:
            operation.id,

          numero:
            index + 1,

          vencimento:
            nextDate(
              primeiroVencimento,
              periodicidade,
              index
            ),

          valor:
            valorParcela,

          valor_pago:
            0,

          status:
            "pendente",
        })
      );

    const {
      error:
        installmentsError,
    } =
      await supabaseAdmin
        .from(
          "parcelas"
        )
        .insert(
          installments
        );

    if (
      installmentsError
    ) {
      throw new Error(
        installmentsError.message
      );
    }

    if (veiculoId) {
      const {
        data:
          currentLinks,
      } =
        await supabaseAdmin
          .from(
            "cliente_veiculos"
          )
          .select(
            "id,cliente_id"
          )
          .eq(
            "veiculo_id",
            veiculoId
          )
          .eq(
            "ativo",
            true
          );

      const activeLink =
        currentLinks?.[0];

      if (
        activeLink &&
        activeLink.cliente_id !==
          clienteId
      ) {
        throw new Error(
          "Este veículo já está vinculado a outro cliente."
        );
      }

      if (!activeLink) {
        await supabaseAdmin
          .from(
            "cliente_veiculos"
          )
          .insert({
            cliente_id:
              clienteId,

            veiculo_id:
              veiculoId,

            tipo_vinculo:
              linkType(
                tipo
              ),

            ativo:
              true,

            data_inicio:
              new Date()
                .toISOString()
                .slice(
                  0,
                  10
                ),
          });
      }

      const status =
        vehicleStatus(
          tipo
        );

      if (status) {
        await supabaseAdmin
          .from(
            "veiculos"
          )
          .update({
            status,

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            veiculoId
          );
      }
    }

    await uploadDocument(
      operation.id,
      data.get(
        "contrato"
      ),
      "contrato"
    );

    await uploadDocument(
      operation.id,
      data.get(
        "comprovante_caucao"
      ),
      "comprovante_caucao"
    );

    revalidatePath(
      "/operacoes"
    );

    revalidatePath(
      "/parcelas"
    );

    revalidatePath(
      "/clientes"
    );

    revalidatePath(
      "/veiculos"
    );

    return NextResponse.json(
      {
        success: true,

        operation,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE OPERATION:",
      error
    );

    /*
     * Rollback simples caso
     * alguma etapa posterior falhe.
     */
    if (operationId) {
      await supabaseAdmin
        .from(
          "operacoes"
        )
        .delete()
        .eq(
          "id",
          operationId
        );
    }

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Erro ao criar operação.",
      },
      {
        status: 500,
      }
    );
  }
}