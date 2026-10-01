import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value
              );
            }
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname =
    request.nextUrl.pathname;

  /*
   * ROTAS DO PORTAL DO CLIENTE
   *
   * O próprio /portal continua
   * cuidando da autenticação do cliente.
   */
  if (
    pathname.startsWith(
      "/portal"
    )
  ) {
    return response;
  }

  /*
   * LOGIN ADMINISTRATIVO
   */

  if (
    pathname === "/login"
  ) {
    if (!user) {
      return response;
    }

    const {
      data: admin,
    } = await supabase
      .from(
        "admin_usuarios"
      )
      .select(
        "id,ativo"
      )
      .eq(
        "auth_user_id",
        user.id
      )
      .maybeSingle();

    if (admin?.ativo) {
      return NextResponse.redirect(
        new URL(
          "/",
          request.url
        )
      );
    }

    return response;
  }

  /*
   * ROTAS ADMINISTRATIVAS
   */

  const protectedRoutes = [
    "/",
    "/clientes",
    "/veiculos",
    "/operacoes",
    "/parcelas",
    "/contratos",
    "/configuracoes",
  ];

  const isProtected =
    protectedRoutes.some(
      (route) =>
        route === "/"
          ? pathname === "/"
          : pathname === route ||
            pathname.startsWith(
              `${route}/`
            )
    );

  if (!isProtected) {
    return response;
  }

  /*
   * SEM LOGIN:
   * manda para /login
   */

  if (!user) {
    const loginUrl =
      new URL(
        "/login",
        request.url
      );

    return NextResponse.redirect(
      loginUrl
    );
  }

  /*
   * TEM LOGIN:
   * confirma se é ADMIN.
   */

  const {
    data: admin,
  } = await supabase
    .from("admin_usuarios")
    .select("id,ativo")
    .eq(
      "auth_user_id",
      user.id
    )
    .maybeSingle();

  if (!admin?.ativo) {
    await supabase.auth.signOut();

    return NextResponse.redirect(
      new URL(
        "/login",
        request.url
      )
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};