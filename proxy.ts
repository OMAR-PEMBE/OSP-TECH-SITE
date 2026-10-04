import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session refresh and the first gate on /admin (architecture.md 7).
 *
 * Named `proxy.ts` because Next 16 renamed the middleware convention; the
 * behaviour is unchanged — it still runs before the cache on every matched
 * request.
 *
 * Two jobs:
 *
 *  1. Refresh the Supabase session cookie. Server Components cannot write
 *     cookies, so without this the access token would expire mid-session and
 *     the owner would be logged out while working.
 *
 *  2. Bounce unauthenticated requests away from /admin before any admin code
 *     runs. This is a convenience, not the security boundary — middleware
 *     checks only that *a* user is signed in, because reading the `profiles`
 *     row for a role check on every request would put a database round trip
 *     in front of every asset. The real checks are the `requireOwner()` guard
 *     in the admin layout and every action, plus RLS underneath both
 *     (security.md 3).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  /* Must be getUser(), not getSession(): this call is what refreshes the
     token, and it verifies with the auth server rather than trusting the
     cookie. Do not add code between creating the client and this call. */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    /* Remember where they were going, so logging in lands them there rather
       than dumping them on the dashboard. */
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  /* Already signed in and visiting the login page: send them on. */
  if (pathname === "/login" && user) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  return response;
}

export const config = {
  /* Everything except Next's internals and static assets. Running this on
     every image and font would add an auth round trip to each one. */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff|woff2)$).*)",
  ],
};
