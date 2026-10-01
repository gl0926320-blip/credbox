import {
  NextResponse,
} from "next/server";

import {
  revalidatePath,
} from "next/cache";

import {
  supabaseAdmin,
} from "../../../lib/supabase/admin";

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
    return null;
  }

  const parsed =
    Number(
      raw.replace(
        ",",
        "."
      )
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}

function sanitizeFilename(
  filename: string
) {
  return filename
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );
}

async function resolveLinks(
  data: FormData
) {
  let clientId =
    text(
      data,
      "cliente_id"
    );

  let operationId =
    text(
      data,
      "operacao_id"
    );

  let vehicleId =
    text(
      data,
      "veiculo_id"
    );

  let operation:
    | {
        id: string;
        cliente_id: string | null;
        veiculo_id: string | null;
        tipo: string;
        valor_total: number | null;
      }
    | null = null;

  if (operationId) {
    const {
      data:
        operationData,
      error,
    } =
      await supabaseAdmin
        .from(
          "operacoes"
        )
        .select(`
          id,
          cliente_id,
          veiculo_id,
          tipo,
          valor_total
        `)
        .eq(
          "id",
          operationId
        )
        .single();

    if (
      error ||
      !operationData
    ) {
      throw new Error(
        "Operação vinculada não encontrada."
      );
    }

    operation =
      operationData;

    /*
     * A operação é a fonte principal.
     * Isso impede associar contrato do
     * Lucas a outro cliente por engano.
     */
    if (
      operation.cliente_id
    ) {
      clientId =
        operation.cliente_id;
    }

    if (
      operation.veiculo_id
    ) {
      vehicleId =
        operation.veiculo_id;
    }
  }

  if (!clientId) {
    throw new Error(
      "Selecione um cliente ou uma operação vinculada a um cliente."
    );
  }

  const {
    data:
      client,
    error:
      clientError,
  } =
    await supabaseAdmin
      .from(
        "clientes"
      )
      .select(
        "id,nome"
      )
      .eq(
        "id",
        clientId
      )
      .single();

  if (
    clientError ||
    !client
  ) {
    throw new Error(
      "Cliente não encontrado."
    );
  }

  if (vehicleId) {
    const {
      data:
        vehicle,
      error:
        vehicleError,
    } =
      await supabaseAdmin
        .from(
          "veiculos"
        )
        .select(
          "id"
        )
        .eq(
          "id",
          vehicleId
        )
        .single();

    if (
      vehicleError ||
      !vehicle
    ) {
      throw new Error(
        "Veículo não encontrado."
      );
    }
  }

  return {
    clientId,
    operationId:
      operationId ||
      null,

    vehicleId:
      vehicleId ||
      null,

    operation,
  };
}

async function uploadFiles(
  contractId: string,
  data: FormData
) {
  const files =
    data.getAll(
      "arquivos"
    );

  const errors:
    string[] = [];

  for (
    let index = 0;
    index <
    files.length;
    index++
  ) {
    const file =
      files[index];

    if (
      !(file instanceof File) ||
      file.size === 0
    ) {
      continue;
    }

    if (
      file.size >
      15 *
        1024 *
        1024
    ) {
      errors.push(
        `${file.name}: máximo de 15 MB.`
      );

      continue;
    }

    const safeName =
      sanitizeFilename(
        file.name
      );

    const path =
      `${contractId}/${crypto.randomUUID()}-${safeName}`;

    const buffer =
      await file.arrayBuffer();

    const {
      error:
        uploadError,
    } =
      await supabaseAdmin.storage
        .from(
          "contract-documents"
        )
        .upload(
          path,
          buffer,
          {
            contentType:
              file.type ||
              "application/octet-stream",

            upsert:
              false,
          }
        );

    if (
      uploadError
    ) {
      errors.push(
        `${file.name}: ${uploadError.message}`
      );

      continue;
    }

    const {
      error:
        fileError,
    } =
      await supabaseAdmin
        .from(
          "contrato_arquivos"
        )
        .insert({
          contrato_id:
            contractId,

          nome_arquivo:
            file.name,

          caminho_storage:
            path,

          mime_type:
            file.type ||
            null,

          tamanho_bytes:
            file.size,
        });

    if (
      fileError
    ) {
      errors.push(
        `${file.name}: ${fileError.message}`
      );
    }
  }

  return errors;
}

async function buildPayload(
  data: FormData
) {
  const links =
    await resolveLinks(
      data
    );

  const providedType =
    text(
      data,
      "tipo"
    );

  const providedValue =
    numeric(
      data,
      "valor_contrato"
    );

  return {
    cliente_id:
      links.clientId,

    operacao_id:
      links.operationId,

    veiculo_id:
      links.vehicleId,

    numero:
      text(
        data,
        "numero"
      ) || null,

    titulo:
      text(
        data,
        "titulo"
      ),

    tipo:
      providedType ||
      links.operation?.tipo ||
      "outro",

    data_assinatura:
      text(
        data,
        "data_assinatura"
      ) || null,

    inicio_vigencia:
      text(
        data,
        "inicio_vigencia"
      ) || null,

    fim_vigencia:
      text(
        data,
        "fim_vigencia"
      ) || null,

    valor_contrato:
      providedValue ??
      links.operation
        ?.valor_total ??
      null,

    status:
      text(
        data,
        "status"
      ) ||
      "ativo",

    observacoes:
      text(
        data,
        "observacoes"
      ) || null,

    updated_at:
      new Date()
        .toISOString(),
  };
}

export async function POST(
  request: Request
) {
  try {
    const data =
      await request.formData();

    const values =
      await buildPayload(
        data
      );

    if (
      !values.titulo
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o título do contrato.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data:
        contract,
      error,
    } =
      await supabaseAdmin
        .from(
          "contratos"
        )
        .insert(
          values
        )
        .select()
        .single();

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message,
          details:
            error.details,
        },
        {
          status: 400,
        }
      );
    }

    const fileErrors =
      await uploadFiles(
        contract.id,
        data
      );

    revalidatePath(
      "/contratos"
    );

    revalidatePath(
      "/clientes"
    );

    revalidatePath(
      "/operacoes"
    );

    return NextResponse.json(
      {
        success: true,
        contract,
        fileErrors,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CONTRACT POST:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao cadastrar contrato.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: Request
) {
  try {
    const data =
      await request.formData();

    const id =
      text(
        data,
        "id"
      );

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Contrato não informado.",
        },
        {
          status: 400,
        }
      );
    }

    const values =
      await buildPayload(
        data
      );

    if (
      !values.titulo
    ) {
      return NextResponse.json(
        {
          error:
            "Informe o título do contrato.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data:
        contract,
      error,
    } =
      await supabaseAdmin
        .from(
          "contratos"
        )
        .update(
          values
        )
        .eq(
          "id",
          id
        )
        .select()
        .single();

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message,
          details:
            error.details,
        },
        {
          status: 400,
        }
      );
    }

    const fileErrors =
      await uploadFiles(
        id,
        data
      );

    revalidatePath(
      "/contratos"
    );

    return NextResponse.json({
      success: true,
      contract,
      fileErrors,
    });
  } catch (error) {
    console.error(
      "CONTRACT PATCH:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao editar contrato.",
      },
      {
        status: 500,
      }
    );
  }
}