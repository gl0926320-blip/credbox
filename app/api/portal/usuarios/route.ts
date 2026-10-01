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

export async function POST(
  request: Request
) {
  let authUserId:
    | string
    | null = null;

  try {
    const data =
      await request.formData();

    const clienteId =
      text(
        data,
        "cliente_id"
      );

    const email =
      text(
        data,
        "email"
      ).toLowerCase();

    const password =
      text(
        data,
        "password"
      );

    if (
      !clienteId ||
      !email ||
      password.length <
        8
    ) {
      return NextResponse.json(
        {
          error:
            "Cliente, e-mail e senha com no mínimo 8 caracteres são obrigatórios.",
        },
        {
          status: 400,
        }
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
          clienteId
        )
        .single();

    if (
      clientError ||
      !client
    ) {
      return NextResponse.json(
        {
          error:
            "Cliente não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const {
      data:
        existingPortal,
    } =
      await supabaseAdmin
        .from(
          "portal_usuarios"
        )
        .select("id")
        .eq(
          "cliente_id",
          clienteId
        )
        .maybeSingle();

    if (
      existingPortal
    ) {
      return NextResponse.json(
        {
          error:
            "Este cliente já possui acesso ao portal.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data:
        authData,
      error:
        authError,
    } =
      await supabaseAdmin
        .auth
        .admin
        .createUser({
          email,
          password,

          email_confirm:
            true,

          user_metadata: {
            nome:
              client.nome,

            tipo:
              "cliente_portal",
          },
        });

    if (
      authError ||
      !authData.user
    ) {
      throw new Error(
        authError?.message ||
          "Não foi possível criar o usuário."
      );
    }

    authUserId =
      authData.user.id;

    const {
      error:
        portalError,
    } =
      await supabaseAdmin
        .from(
          "portal_usuarios"
        )
        .insert({
          auth_user_id:
            authData.user.id,

          cliente_id:
            clienteId,

          ativo:
            true,

          primeiro_acesso:
            true,
        });

    if (
      portalError
    ) {
      throw new Error(
        portalError.message
      );
    }

    revalidatePath(
      "/configuracoes"
    );

    return NextResponse.json({
      success: true,

      email,

      password,
    });
  } catch (error) {
    if (
      authUserId
    ) {
      await supabaseAdmin
        .auth
        .admin
        .deleteUser(
          authUserId
        );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao criar usuário.",
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
    const body =
      await request.json();

    const id =
      body.id as string;

    const ativo =
      Boolean(
        body.ativo
      );

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Usuário não informado.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data:
        portalUser,
      error:
        portalError,
    } =
      await supabaseAdmin
        .from(
          "portal_usuarios"
        )
        .update({
          ativo,

          updated_at:
            new Date()
              .toISOString(),
        })
        .eq(
          "id",
          id
        )
        .select(`
          id,
          auth_user_id
        `)
        .single();

    if (
      portalError ||
      !portalUser
    ) {
      throw new Error(
        portalError?.message ||
          "Usuário não encontrado."
      );
    }

    /*
     * Também bane/desbane
     * o usuário no Auth.
     */

    const {
      error:
        authError,
    } =
      await supabaseAdmin
        .auth
        .admin
        .updateUserById(
          portalUser.auth_user_id,
          {
            ban_duration:
              ativo
                ? "none"
                : "876000h",
          }
        );

    if (
      authError
    ) {
      console.error(
        authError
      );
    }

    revalidatePath(
      "/configuracoes"
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao alterar usuário.",
      },
      {
        status: 500,
      }
    );
  }
}