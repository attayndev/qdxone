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

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // One shared container serves every tenant (all state lives in Supabase).
    // To scale horizontally later: `getRandom(env.NEXT_CONTAINER, N)`.
    return getContainer(env.NEXT_CONTAINER, "main").fetch(request);
  },
};
