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

/** Routes that only guests (unauthenticated) can access. */
const VISITANTE_ONLY_ROUTES = ["/login", "/register", "/password-recovery"];


/**
 * Create a redirect response that preserves any cookies
 * that were set on the Supabase response (e.g. refreshed tokens).
 */
function redirectWithSupabaseCookies(
  url: URL,
  supabaseResponse: NextResponse,
): NextResponse {
  const response = NextResponse.redirect(url);

  supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}

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

  // 1. Visitante-only routes check (Login/Register protection)
  // If user is logged in and tries to access auth pages, redirect to home.
  if (user) {
    const isVisitanteRoute = VISITANTE_ONLY_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

    if (isVisitanteRoute) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return redirectWithSupabaseCookies(homeUrl, supabaseResponse);
    }
  }

  // 2. Protected routes check (Role-based access)
  for (const [prefix, requiredRole] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(prefix)) {
      // Not logged in → redirect to login.
      if (!user) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        return redirectWithSupabaseCookies(loginUrl, supabaseResponse);
      }

      // Logged in but wrong role → redirect to home.
      const userRole = (user.app_metadata as Record<string, unknown>)?.role as Rol;
      if (userRole !== requiredRole) {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = "/";
        return redirectWithSupabaseCookies(homeUrl, supabaseResponse);
      }

      // Authorized — fall through.
      break;
    }
  }

  // 3. Admin onboarding guard
  const userRole = user
    ? ((user.app_metadata as Record<string, unknown>)?.role as Rol)
    : null;
  const profileComplete =
    (user?.app_metadata as Record<string, unknown>)?.profile_complete === true;

  // 3a. Admin con perfil incompleto fuera de /completar-perfil → forzar onboarding
  if (userRole === Rol.ADMINISTRADOR && !profileComplete && !pathname.startsWith("/completar-perfil")) {
    const url = request.nextUrl.clone();
    url.pathname = "/completar-perfil";
    return redirectWithSupabaseCookies(url, supabaseResponse);
  }

  // 3b. /completar-perfil solo es accesible para admins con perfil incompleto
  if (pathname.startsWith("/completar-perfil")) {
    const denied = !user || userRole !== Rol.ADMINISTRADOR || profileComplete;
    const url = request.nextUrl.clone();
    url.pathname = !user ? "/login" : "/";
    if (denied) return redirectWithSupabaseCookies(url, supabaseResponse);
  }


  // 4. Special case: /perfil protection
  if (pathname.startsWith("/perfil")) {
    // Requires login
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      return redirectWithSupabaseCookies(loginUrl, supabaseResponse);
    }

    const userRole = (user.app_metadata as Record<string, unknown>)?.role as Rol;

    // ROOT cannot access profile (no personal data)
    if (userRole === Rol.ROOT) {
      const rootUrl = request.nextUrl.clone();
      rootUrl.pathname = "/panel-root";
      return redirectWithSupabaseCookies(rootUrl, supabaseResponse);
    }

    // Only CLIENTE and ADMINISTRADOR allowed
    if (userRole !== Rol.CLIENTE && userRole !== Rol.ADMINISTRADOR) {
      // VISITANTE (in theory shouldn't happen if user exists) or invalid role
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = "/";
      return redirectWithSupabaseCookies(homeUrl, supabaseResponse);
    }
  }

  return supabaseResponse;
}
