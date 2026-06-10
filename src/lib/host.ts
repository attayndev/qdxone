/**
 * Host helpers shared by the proxy, the Supabase clients, and signup.
 * Dependency-free on purpose — imported from both `tenancy.ts` and
 * `supabase/server.ts`, so it must not import either (no import cycle).
 */

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "qdx.one";

/**
 * Cookie domain that scopes the Supabase auth session so one login is
 * valid across the apex AND every `*.qdx.one` operator subdomain.
 *
 *  - prod  `qdx.one` / `<slug>.qdx.one`  → `.qdx.one`
 *  - dev   `<slug>.lvh.me`               → `.lvh.me`
 *  - dev   `localhost` / `<slug>.localhost` → undefined (host-only; browsers
 *          don't reliably share cookies across `.localhost`, so use lvh.me
 *          for multi-tenant dev)
 *  - custom domains (`careers.brand.com`) → undefined (host-only); operators
 *          don't authenticate there, candidates use tokens.
 */
export function authCookieDomain(host: string | null): string | undefined {
  if (!host) return undefined;
  const h = host.split(":")[0].toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost")) return undefined;
  if (h === "lvh.me" || h.endsWith(".lvh.me")) return ".lvh.me";
  if (h === ROOT_DOMAIN || h.endsWith(`.${ROOT_DOMAIN}`)) return `.${ROOT_DOMAIN}`;
  return undefined;
}

/**
 * Apex (no-subdomain) URL. Auth callbacks for signup/login land here so
 * the session cookie is written once on the apex and — thanks to the
 * `.qdx.one` cookie domain — carries to the operator's subdomain.
 */
export function apexUrl(path = ""): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? `https://${ROOT_DOMAIN}`;
  return `${base.replace(/\/$/, "")}${path}`;
}
