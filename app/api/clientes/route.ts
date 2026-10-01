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

function getString(
  formData: FormData,
  field: string
) {
  const value =
    formData.get(
      field
    );

  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

function cleanNumber(
  value: string
) {
  return value.replace(
    /\D/g,
    ""
  );
}

async function ensureVehicleAvailable(
  vehicleId: string
) {
  const {
    data,
    error,
  } =
    await supabaseAdmin
      .from("veiculos")
      .select(
        "id,status"
      )
      .eq(
        "id",
        vehicleId
      )
      .single();

  if (
    error ||
    !data
  ) {
    throw new Error(
      "Veículo não encontrado."
    );
  }

  if (
    data.status !==
    "disponivel"
  ) {
    throw new Error(
      "Este veículo não está mais disponível."
    );
  }

  return data;
}

function vehicleStatusFromBusiness(
  businessType: string
) {
  if (
    businessType ===
    "venda_parcelada"
  ) {
    return "vendido";
  }

  return "locado";
}

function buildClientPayload(
  formData: FormData
) {
  const cpf =
    cleanNumber(
      getString(
        formData,
        "cpf"
      )
    );

  return {
    nome:
      getString(
        formData,
        "nome"
      ),

    cpf:
      cpf || null,

    rg:
      getString(
        formData,
        "rg"
      ) || null,

    telefone:
      getString(
        formData,
        "telefone"
      ) || null,

    telefone_secundario:
      getString(
        formData,
        "telefone_secundario"
      ) || null,

    email:
      getString(
        formData,
        "email"
      ) || null,

    data_nascimento:
      getString(
        formData,
        "data_nascimento"
      ) || null,

    cnh:
      getString(
        formData,
        "cnh"
      ) || null,

    cep:
      getString(
        formData,
        "cep"
      ) || null,

    endereco:
      getString(
        formData,
        "endereco"
      ) || null,

    numero:
      getString(
        formData,
        "numero"
      ) || null,

    complemento:
      getString(
        formData,
        "complemento"
      ) || null,

    bairro:
      getString(
        formData,
        "bairro"
      ) || null,

    cidade:
      getString(
        formData,
        "cidade"
      ) || null,

    estado:
      getString(
        formData,
        "estado"
      )
        .toUpperCase() ||
      null,

    contato_emergencia_nome:
      getString(
        formData,
        "contato_emergencia_nome"
      ) || null,

    contato_emergencia_telefone:
      getString(
        formData,
        "contato_emergencia_telefone"
      ) || null,

    observacoes:
      getString(
        formData,
        "observacoes"
      ) || null,

    status:
      getString(
        formData,
        "status"
      ) || "ativo",

    updated_at:
      new Date()
        .toISOString(),
  };
}

export async function POST(
  request: Request
) {
  let createdClientId:
    | string
    | null = null;

  try {
    const formData =
      await request.formData();

    const payload =
      buildClientPayload(
        formData
      );

    if (
      !payload.nome
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nome do cliente é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: client,
      error,
    } =
      await supabaseAdmin
        .from("clientes")
        .insert(payload)
        .select()
        .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status: 400,
        }
      );
    }

    createdClientId =
      client.id;

    const shouldLink =
      getString(
        formData,
        "vincular_veiculo"
      ) === "true";

    const vehicleId =
      getString(
        formData,
        "veiculo_id"
      );

    const businessType =
      getString(
        formData,
        "tipo_vinculo"
      ) ||
      "locacao_compra";

    if (
      shouldLink &&
      vehicleId
    ) {
      await ensureVehicleAvailable(
        vehicleId
      );

      const {
        error:
          linkError,
      } =
        await supabaseAdmin
          .from(
            "cliente_veiculos"
          )
          .insert({
            cliente_id:
              client.id,

            veiculo_id:
              vehicleId,

            tipo_vinculo:
              businessType,

            ativo: true,

            data_inicio:
              new Date()
                .toISOString()
                .slice(
                  0,
                  10
                ),
          });

      if (
        linkError
      ) {
        throw new Error(
          linkError.message
        );
      }

      const {
        error:
          vehicleError,
      } =
        await supabaseAdmin
          .from(
            "veiculos"
          )
          .update({
            status:
              vehicleStatusFromBusiness(
                businessType
              ),

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            vehicleId
          );

      if (
        vehicleError
      ) {
        throw new Error(
          vehicleError.message
        );
      }
    }

    revalidatePath(
      "/clientes"
    );

    revalidatePath(
      "/veiculos"
    );

    return NextResponse.json(
      {
        success: true,

        client,
      },
      {
        status: 201,
      }
    );
  } catch (
    error
  ) {
    if (
      createdClientId
    ) {
      await supabaseAdmin
        .from(
          "clientes"
        )
        .delete()
        .eq(
          "id",
          createdClientId
        );
    }

    console.error(
      "CLIENT POST ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Erro ao cadastrar cliente.",
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
            "Cliente não informado.",
        },
        {
          status: 400,
        }
      );
    }

    const payload =
      buildClientPayload(
        formData
      );

    if (
      !payload.nome
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nome do cliente é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      error:
        updateError,
    } =
      await supabaseAdmin
        .from("clientes")
        .update(payload)
        .eq(
          "id",
          id
        );

    if (
      updateError
    ) {
      throw new Error(
        updateError.message
      );
    }

    const {
      data:
        currentLinks,
      error:
        currentLinkError,
    } =
      await supabaseAdmin
        .from(
          "cliente_veiculos"
        )
        .select(
          "id,veiculo_id,tipo_vinculo"
        )
        .eq(
          "cliente_id",
          id
        )
        .eq(
          "ativo",
          true
        );

    if (
      currentLinkError
    ) {
      throw new Error(
        currentLinkError.message
      );
    }

    const currentLink =
      currentLinks?.[0] ??
      null;

    const shouldLink =
      getString(
        formData,
        "vincular_veiculo"
      ) === "true";

    const newVehicleId =
      getString(
        formData,
        "veiculo_id"
      );

    const businessType =
      getString(
        formData,
        "tipo_vinculo"
      ) ||
      "locacao_compra";

    /*
     * Usuário decidiu:
     * DEIXAR EM ESPERA
     */
    if (
      !shouldLink
    ) {
      if (
        currentLink
      ) {
        await supabaseAdmin
          .from(
            "cliente_veiculos"
          )
          .update({
            ativo: false,

            data_fim:
              new Date()
                .toISOString()
                .slice(
                  0,
                  10
                ),
          })
          .eq(
            "id",
            currentLink.id
          );

        await supabaseAdmin
          .from(
            "veiculos"
          )
          .update({
            status:
              "disponivel",

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            currentLink.veiculo_id
          );
      }
    }

    /*
     * Usuário quer veículo.
     */
    if (
      shouldLink &&
      newVehicleId
    ) {
      const sameVehicle =
        currentLink?.veiculo_id ===
        newVehicleId;

      /*
       * Mesmo veículo:
       * só muda tipo de vínculo/status.
       */
      if (
        sameVehicle &&
        currentLink
      ) {
        await supabaseAdmin
          .from(
            "cliente_veiculos"
          )
          .update({
            tipo_vinculo:
              businessType,
          })
          .eq(
            "id",
            currentLink.id
          );

        await supabaseAdmin
          .from(
            "veiculos"
          )
          .update({
            status:
              vehicleStatusFromBusiness(
                businessType
              ),

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            newVehicleId
          );
      }

      /*
       * Troca de veículo.
       */
      if (
        !sameVehicle
      ) {
        await ensureVehicleAvailable(
          newVehicleId
        );

        if (
          currentLink
        ) {
          await supabaseAdmin
            .from(
              "cliente_veiculos"
            )
            .update({
              ativo:
                false,

              data_fim:
                new Date()
                  .toISOString()
                  .slice(
                    0,
                    10
                  ),
            })
            .eq(
              "id",
              currentLink.id
            );

          await supabaseAdmin
            .from(
              "veiculos"
            )
            .update({
              status:
                "disponivel",

              updated_at:
                new Date()
                  .toISOString(),
            })
            .eq(
              "id",
              currentLink.veiculo_id
            );
        }

        const {
          error:
            newLinkError,
        } =
          await supabaseAdmin
            .from(
              "cliente_veiculos"
            )
            .insert({
              cliente_id:
                id,

              veiculo_id:
                newVehicleId,

              tipo_vinculo:
                businessType,

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

        if (
          newLinkError
        ) {
          throw new Error(
            newLinkError.message
          );
        }

        await supabaseAdmin
          .from(
            "veiculos"
          )
          .update({
            status:
              vehicleStatusFromBusiness(
                businessType
              ),

            updated_at:
              new Date()
                .toISOString(),
          })
          .eq(
            "id",
            newVehicleId
          );
      }
    }

    revalidatePath(
      "/clientes"
    );

    revalidatePath(
      "/veiculos"
    );

    return NextResponse.json({
      success: true,
    });
  } catch (
    error
  ) {
    console.error(
      "CLIENT PATCH ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar cliente.",
      },
      {
        status: 500,
      }
    );
  }
}