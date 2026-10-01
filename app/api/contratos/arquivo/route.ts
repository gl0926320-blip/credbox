import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "../../../../lib/supabase/admin";

export const runtime =
  "nodejs";

export const dynamic =
  "force-dynamic";

export async function GET(
  request:
    NextRequest
) {
  try {
    const path =
      request.nextUrl.searchParams.get(
        "path"
      );

    if (!path) {
      return NextResponse.json(
        {
          error:
            "Arquivo não informado.",
        },
        {
          status:
            400,
        }
      );
    }

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .storage
        .from(
          "contract-documents"
        )
        .createSignedUrl(
          path,
          60 * 5
        );

    if (
      error ||
      !data
    ) {
      return NextResponse.json(
        {
          error:
            error?.message ||
            "Não foi possível abrir o arquivo.",
        },
        {
          status:
            400,
        }
      );
    }

    return NextResponse.json({
      success:
        true,

      url:
        data.signedUrl,
    });
  } catch (
    error
  ) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro ao abrir arquivo.",
      },
      {
        status:
          500,
      }
    );
  }
}