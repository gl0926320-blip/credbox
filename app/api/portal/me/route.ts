import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  supabaseAdmin,
} from "@/lib/supabase/admin";

export const dynamic =
  "force-dynamic";

export async function GET() {
  try {
    const supabase =
      await createClient();

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await supabase.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Sessão não encontrada.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data:
        portalUser,
      error,
    } =
      await supabaseAdmin
        .from(
          "portal_usuarios"
        )
        .select(`
          id,
          cliente_id,
          ativo,
          primeiro_acesso
        `)
        .eq(
          "auth_user_id",
          user.id
        )
        .maybeSingle();

    if (
      error ||
      !portalUser
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Este usuário não está vinculado a um cliente.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      !portalUser.ativo
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Este acesso está bloqueado.",
        },
        {
          status: 403,
        }
      );
    }

    return NextResponse.json({
      success: true,

      cliente_id:
        portalUser.cliente_id,

      primeiro_acesso:
        portalUser.primeiro_acesso,
    });
  } catch (error) {
    console.error(
      "PORTAL ME:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        error:
          "Erro ao verificar o acesso.",
      },
      {
        status: 500,
      }
    );
  }
}