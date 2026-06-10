import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { extractSlugFromHost } from "@/lib/tenancy";
import { authCookieDomain } from "@/lib/host";

/**
 * Multi-tenant proxy.
 *  1. Pull the org slug from the Host header. Forward it to the app via
 *     the `x-org-slug` header so server components can read it.
 *  2. Refresh the Supabase auth session cookie.
 *  3. Gate `/admin/*` on subdomains: must be signed in AND a member of
 *     the org named by the subdomain.
 *  4. Apex hosts only see marketing/auth/signup; subdomains only see
 *     the org app. Conflicts are redirected to the right host.
 */
export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  const slug = extractSlugFromHost(host);
  const path = request.nextUrl.pathname;

  // Forward the slug to the app via a request header.
  const forwardedHeaders = new Headers(request.headers);
  if (slug) forwardedHeaders.set("x-org-slug", slug);
  else forwardedHeaders.delete("x-org-slug");

  let response = NextResponse.next({
    request: { headers: forwardedHeaders },
  });

  // Path zoning between apex and subdomain.
  // Apex: marketing pages + signup + login + auth callback only.
  // Subdomain: existing app (admin / invite / apply).
  const APEX_ONLY = [
    "/",
    "/pricing",
    "/signup",
    "/login",
    "/auth/callback",
    "/how-it-works",
    "/assessments",
    "/for-qsr",
    "/for-independents",
    "/about",
    "/demo",
    "/super",
  ];
  const SUBDOMAIN_ONLY_PREFIXES = ["/admin", "/invite", "/apply", "/j"];

  const isApex = !slug;
  const isSubdomain = !!slug;

  if (isApex && SUBDOMAIN_ONLY_PREFIXES.some((p) => path.startsWith(p))) {
    // Visiting /admin or /apply on apex: redirect to login on apex
    // (we don't know which org). Otherwise show 404.
    if (path.startsWith("/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request: { headers: forwardedHeaders } });
  }

  // On subdomain, lock auth/marketing routes to the apex.
  if (
    isSubdomain &&
    (APEX_ONLY.includes(path) ||
      path === "/pricing" ||
      path === "/signup" ||
      path === "/login")
  ) {
    // Allow / on subdomain (it'll show the org's branded landing).
    if (path !== "/") {
      // Preserve the query string — the magic-link callback carries `?code=`
      // and dropping it breaks the auth exchange.
      const apexRedirect = `${request.nextUrl.protocol}//${rootHost(host)}${path}${request.nextUrl.search}`;
      return NextResponse.redirect(apexRedirect);
    }
  }

  // Refresh Supabase session + admin gate
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          // Scope the session cookie to `.qdx.one` so one login is valid
          // across the apex and every operator subdomain.
          const domain = authCookieDomain(host);
          for (const { name, value, options } of toSet) {
            request.cookies.set(name, value);
            response.cookies.set(
              name,
              value,
              domain ? { ...options, domain } : options
            );
          }
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Admin route gate (subdomain only).
  if (isSubdomain && path.startsWith("/admin") && path !== "/admin/login") {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", path);
      return NextResponse.redirect(url);
    }
    // Confirm the user is a member of THIS org.
    const { data: org } = await supabase
      .from("organizations")
      .select("id, status, trial_ends_at")
      .eq("slug", slug!)
      .maybeSingle();
    if (!org) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "unknown_org");
      return NextResponse.redirect(url);
    }
    const { data: member } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", org.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!member) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "not_member");
      return NextResponse.redirect(url);
    }

    // Billing gate. A lapsed org keeps its CANDIDATE funnel fully open
    // (job posting / apply / assessment / status) — only the operator
    // admin is restricted to the billing page until they fix payment.
    const trialExpired =
      org.status === "trialing" &&
      !!org.trial_ends_at &&
      new Date(org.trial_ends_at).getTime() < Date.now();
    const lapsed =
      org.status === "past_due" || org.status === "canceled" || trialExpired;
    if (lapsed && !path.startsWith("/admin/billing")) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/billing";
      url.searchParams.set(
        "reason",
        org.status === "past_due"
          ? "past_due"
          : org.status === "canceled"
            ? "canceled"
            : "trial_expired"
      );
      return NextResponse.redirect(url);
    }
  }

  return response;
}

function rootHost(host: string | null): string {
  if (!host) return "localhost:3000";
  const cleaned = host.split(":");
  const port = cleaned[1] ? `:${cleaned[1]}` : "";
  const h = cleaned[0];
  if (h.endsWith(".localhost") || h.endsWith(".lvh.me")) {
    const root = h.endsWith(".lvh.me") ? "lvh.me" : "localhost";
    return `${root}${port}`;
  }
  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "qdx.one";
  return root;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
