/**
 * Cloudflare Worker entry — fronts the Next.js app running inside a Cloudflare
 * Container. The container runs the FULL Node.js runtime, so `src/proxy.ts`
 * middleware (subdomain→org routing, Supabase session refresh, /admin gate)
 * runs unchanged. Cloudflare handles `*.qdx.one` wildcard TLS natively.
 *
 * Reusable pattern for moving the rest of the apps off Vercel:
 *   1. Build the Next app as a standalone Docker image (see Dockerfile).
 *   2. Run it as a Container; this Worker proxies every request to it.
 *   3. Server secrets are injected from the Worker env into the container's
 *      process.env via `envVars` (in the constructor below) — never baked in.
 */
import { Container, getContainer } from "@cloudflare/containers";

export interface Env {
  NEXT_CONTAINER: DurableObjectNamespace<NextContainer>;

  // Static media bucket (the commercial, etc.), served at /media/* — see fetch().
  MEDIA: R2Bucket;

  // Server-only secrets — set with `wrangler secret put <NAME>` (or in the
  // Cloudflare dashboard). NEXT_PUBLIC_* are NOT here; they're baked into the
  // image at build time (public values — see Dockerfile).
  SUPABASE_SERVICE_ROLE_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_SOLO_MONTHLY?: string;
  STRIPE_PRICE_SOLO_ANNUAL?: string;
  STRIPE_PRICE_OPERATOR_MONTHLY?: string;
  STRIPE_PRICE_OPERATOR_ANNUAL?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  PLATFORM_OWNER_EMAILS?: string;
  ANTHROPIC_API_KEY?: string;
  AI_MODEL?: string;
  TELNYX_API_KEY?: string;
  TELNYX_FROM?: string;
  TELNYX_MESSAGING_PROFILE_ID?: string;
  // Interview scheduling — Google Calendar OAuth + token encryption.
  CALENDAR_TOKEN_KEY?: string;
  GOOGLE_CALENDAR_CLIENT_ID?: string;
  GOOGLE_CALENDAR_CLIENT_SECRET?: string;
  // Shared secret authenticating the cron → /api/cron/scheduling drain call.
  CRON_SECRET?: string;
}

// Worker env keys forwarded into the container process as environment vars.
const CONTAINER_SECRETS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_SOLO_MONTHLY",
  "STRIPE_PRICE_SOLO_ANNUAL",
  "STRIPE_PRICE_OPERATOR_MONTHLY",
  "STRIPE_PRICE_OPERATOR_ANNUAL",
  "RESEND_API_KEY",
  "RESEND_FROM",
  "PLATFORM_OWNER_EMAILS",
  "ANTHROPIC_API_KEY",
  "AI_MODEL",
  "TELNYX_API_KEY",
  "TELNYX_FROM",
  "TELNYX_MESSAGING_PROFILE_ID",
  "CALENDAR_TOKEN_KEY",
  "GOOGLE_CALENDAR_CLIENT_ID",
  "GOOGLE_CALENDAR_CLIENT_SECRET",
  "CRON_SECRET",
] as const;

export class NextContainer extends Container<Env> {
  // Port the Next standalone server listens on (Dockerfile: PORT=3000).
  defaultPort = 3000;
  // Keep the instance warm a while so the candidate funnel isn't cold-starting.
  sleepAfter = "1h";

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    // Inject the Worker's runtime secrets into the container's process.env.
    for (const key of CONTAINER_SECRETS) {
      const value = env[key];
      if (typeof value === "string" && value.length > 0) {
        this.envVars[key] = value;
      }
    }
    this.envVars.NODE_ENV = "production";
  }
}

/**
 * Serve a static file from the MEDIA R2 bucket, with HTTP Range support so
 * browsers can seek/stream video. Strong, immutable caching lets Cloudflare's
 * edge cache it after the first hit. GET/HEAD only.
 */
async function serveMedia(request: Request, env: Env, url: URL): Promise<Response> {
  const key = decodeURIComponent(url.pathname.slice("/media/".length));
  if (!key) return new Response("Not found", { status: 404 });
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const ranged = request.headers.has("range");
  const object = await env.MEDIA.get(key, ranged ? { range: request.headers } : undefined);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  if (request.method === "HEAD") {
    headers.set("Content-Length", String(object.size));
    return new Response(null, { status: 200, headers });
  }

  // `body` is present on an R2ObjectBody (a GET hit); a plain R2Object has none.
  const body = (object as R2ObjectBody).body ?? null;
  if (object.range && "offset" in object.range) {
    const offset = object.range.offset ?? 0;
    const length = object.range.length ?? object.size - offset;
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
    headers.set("Content-Length", String(length));
    return new Response(body, { status: 206, headers });
  }

  headers.set("Content-Length", String(object.size));
  return new Response(body, { status: 200, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // Static media is served from R2 by the Worker; everything else proxies to
    // the Next container (one shared instance serves every tenant — all state
    // lives in Supabase). To scale out later: `getRandom(env.NEXT_CONTAINER, N)`.
    if (url.pathname.startsWith("/media/")) return serveMedia(request, env, url);
    return getContainer(env.NEXT_CONTAINER, "main").fetch(request);
  },

  // Cloudflare cron → drain the scheduling outbox by calling into the container.
  // The container holds the Next runtime (Supabase, Resend, Google clients); the
  // Worker just authenticates the call with the shared secret.
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    const run = async () => {
      if (!env.CRON_SECRET) return;
      const res = await getContainer(env.NEXT_CONTAINER, "main").fetch(
        new Request("https://qdx.one/api/cron/scheduling", {
          method: "POST",
          headers: { "x-cron-secret": env.CRON_SECRET },
        })
      );
      if (!res.ok) console.error("[cron] scheduling drain failed:", res.status, await res.text());
    };
    ctx.waitUntil(run());
  },
};
