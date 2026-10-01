import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { supabaseAdmin } from "../../../lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getString(
  formData: FormData,
  field: string
) {
  const value = formData.get(field);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function getNumber(
  formData: FormData,
  field: string
) {
  const value = getString(
    formData,
    field
  );

  if (!value) {
    return null;
  }

  const parsed = Number(
    value.replace(",", ".")
  );

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function sanitizeFilename(
  filename: string
) {
  return filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_");
}

function normalizePlate(
  value: string
) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalizeRenavam(
  value: string
) {
  return value.replace(
    /\D/g,
    ""
  );
}

function normalizeChassi(
  value: string
) {
  return value
    .toUpperCase()
    .replace(/\s/g, "");
}

function buildVehiclePayload(
  formData: FormData
) {
  const placa =
    normalizePlate(
      getString(
        formData,
        "placa"
      )
    );

  const renavam =
    normalizeRenavam(
      getString(
        formData,
        "renavam"
      )
    );

  const chassi =
    normalizeChassi(
      getString(
        formData,
        "chassi"
      )
    );

  return {
    tipo:
      getString(
        formData,
        "tipo"
      ),

    marca:
      getString(
        formData,
        "marca"
      ),

    modelo:
      getString(
        formData,
        "modelo"
      ),

    versao:
      getString(
        formData,
        "versao"
      ) || null,

    ano_fabricacao:
      getNumber(
        formData,
        "ano_fabricacao"
      ),

    ano_modelo:
      getNumber(
        formData,
        "ano_modelo"
      ),

    placa:
      placa || null,

    renavam:
      renavam || null,

    chassi:
      chassi || null,

    cor:
      getString(
        formData,
        "cor"
      ) || null,

    combustivel:
      getString(
        formData,
        "combustivel"
      ) || null,

    cambio:
      getString(
        formData,
        "cambio"
      ) || null,

    quilometragem:
      getNumber(
        formData,
        "quilometragem"
      ) ?? 0,

    valor_compra:
      getNumber(
        formData,
        "valor_compra"
      ),

    valor_fipe:
      getNumber(
        formData,
        "valor_fipe"
      ),

    valor_venda:
      getNumber(
        formData,
        "valor_venda"
      ),

    data_compra:
      getString(
        formData,
        "data_compra"
      ) || null,

    status:
      getString(
        formData,
        "status"
      ) || "disponivel",

    observacoes:
      getString(
        formData,
        "observacoes"
      ) || null,

    updated_at:
      new Date().toISOString(),
  };
}

async function uploadDocuments(
  vehicleId: string,
  formData: FormData
) {
  const documents =
    formData.getAll(
      "documentos"
    );

  const uploadErrors:
    string[] = [];

  for (
    let index = 0;
    index < documents.length;
    index++
  ) {
    const document =
      documents[index];

    if (
      !(document instanceof File)
    ) {
      continue;
    }

    if (
      document.size === 0
    ) {
      continue;
    }

    if (
      document.size >
      10 * 1024 * 1024
    ) {
      uploadErrors.push(
        `${document.name}: arquivo maior que 10 MB.`
      );

      continue;
    }

    const safeFilename =
      sanitizeFilename(
        document.name
      );

    const path =
      `${vehicleId}/${crypto.randomUUID()}-${safeFilename}`;

    const buffer =
      await document.arrayBuffer();

    const {
      error:
        storageError,
    } =
      await supabaseAdmin
        .storage
        .from(
          "vehicle-documents"
        )
        .upload(
          path,
          buffer,
          {
            contentType:
              document.type ||
              "application/octet-stream",

            upsert: false,
          }
        );

    if (
      storageError
    ) {
      console.error(
        "Erro Storage:",
        storageError
      );

      uploadErrors.push(
        `${document.name}: ${storageError.message}`
      );

      continue;
    }

    const {
      error:
        documentError,
    } =
      await supabaseAdmin
        .from(
          "veiculo_documentos"
        )
        .insert({
          veiculo_id:
            vehicleId,

          tipo: "outro",

          nome_arquivo:
            document.name,

          caminho_storage:
            path,

          mime_type:
            document.type ||
            null,

          tamanho_bytes:
            document.size,
        });

    if (
      documentError
    ) {
      console.error(
        "Erro documento:",
        documentError
      );

      uploadErrors.push(
        `${document.name}: ${documentError.message}`
      );
    }
  }

  return uploadErrors;
}

/* =========================
   TESTE DA API
========================= */

export async function GET() {
  return NextResponse.json({
    success: true,
    route: "/api/veiculos",
  });
}

/* =========================
   CRIAR VEÍCULO
========================= */

export async function POST(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const payload =
      buildVehiclePayload(
        formData
      );

    if (
      !payload.tipo ||
      !payload.marca ||
      !payload.modelo
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tipo, marca e modelo são obrigatórios.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: vehicle,
      error,
    } =
      await supabaseAdmin
        .from("veiculos")
        .insert(payload)
        .select()
        .single();

    if (error) {
      console.error(
        "Erro POST veículo:",
        error
      );

      if (
        error.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Já existe um veículo com essa placa ou chassi.",
            details:
              error.details,
          },
          {
            status: 409,
          }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
          details:
            error.details,
          code:
            error.code,
          hint:
            error.hint,
        },
        {
          status: 400,
        }
      );
    }

    const uploadErrors =
      await uploadDocuments(
        vehicle.id,
        formData
      );

    revalidatePath(
      "/veiculos"
    );

    return NextResponse.json(
      {
        success: true,

        message:
          "Veículo cadastrado com sucesso.",

        vehicle,

        uploadErrors,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Erro POST:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Erro interno ao cadastrar veículo.",

        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================
   EDITAR VEÍCULO
========================= */

export async function PATCH(
  request: Request
) {
  try {
    const formData =
      await request.formData();

    const id =
      getString(
        formData,
        "id"
      );

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "ID do veículo não informado.",
        },
        {
          status: 400,
        }
      );
    }

    const payload =
      buildVehiclePayload(
        formData
      );

    if (
      !payload.tipo ||
      !payload.marca ||
      !payload.modelo
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tipo, marca e modelo são obrigatórios.",
        },
        {
          status: 400,
        }
      );
    }

    console.log(
      "Atualizando veículo:",
      id
    );

    console.log(
      "Payload:",
      payload
    );

    const {
      data: vehicle,
      error,
    } =
      await supabaseAdmin
        .from("veiculos")
        .update(payload)
        .eq(
          "id",
          id
        )
        .select()
        .single();

    if (error) {
      console.error(
        "Erro PATCH veículo:",
        error
      );

      if (
        error.code ===
        "23505"
      ) {
        return NextResponse.json(
          {
            success: false,

            error:
              "Já existe outro veículo utilizando essa placa ou chassi.",

            details:
              error.details,

            code:
              error.code,
          },
          {
            status: 409,
          }
        );
      }

      return NextResponse.json(
        {
          success: false,

          error:
            error.message,

          details:
            error.details,

          code:
            error.code,

          hint:
            error.hint,
        },
        {
          status: 400,
        }
      );
    }

    if (!vehicle) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Veículo não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const uploadErrors =
      await uploadDocuments(
        vehicle.id,
        formData
      );

    revalidatePath(
      "/veiculos"
    );

    revalidatePath(
      "/clientes"
    );

    return NextResponse.json({
      success: true,

      message:
        "Veículo atualizado com sucesso.",

      vehicle,

      uploadErrors,
    });
  } catch (error) {
    console.error(
      "ERRO PATCH FINAL:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Erro interno ao atualizar veículo.",

        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      {
        status: 500,
      }
    );
  }
}