import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { Rol } from "@/lib/types/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** Route → required app_metadata.role mapping (strict). */
const PROTECTED_ROUTES: Record<string, Rol> = {
  "/panel-root": Rol.ROOT,
  "/panel-admin": Rol.ADMINISTRADOR,
};

/**
 * Refreshes the Supabase session and enforces role-based access
 * on protected panel routes.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Always refresh session so cookies stay up-to-date.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Check each protected prefix.
  for (const [prefix, requiredRole] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      // Not logged in → redirect to login.
      if (!user) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        return NextResponse.redirect(loginUrl);
      }

      // Logged in but wrong role → redirect to home.
      const userRole = (user.app_metadata as Record<string, unknown>)?.role;
      if (userRole !== requiredRole) {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = "/";
        return NextResponse.redirect(homeUrl);
      }

      // Authorized — fall through.
      break;
    }
  }

  return supabaseResponse;
}
