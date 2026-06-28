import { notFound } from "next/navigation";
import { currentOrg, getMembership } from "@/lib/tenancy";
import { googleOAuthConfigured } from "@/lib/calendar-providers/config";
import { listConnectionStatuses } from "@/lib/scheduling/connections";
import { disconnectCalendar } from "./actions";

interface PageProps {
  searchParams: Promise<{ connected?: string; error?: string }>;
}

const ERRORS: Record<string, string> = {
  not_configured: "Google Calendar isn't set up on this server yet.",
  oauth_state_invalid: "That connect link expired. Please try again.",
  oauth_nonce_mismatch: "Couldn't verify the request. Please try again.",
  access_denied: "You declined access on Google's screen.",
  missing_code: "Google didn't return an authorization code. Please try again.",
  connect_failed: "We couldn't finish connecting. Please try again.",
};

export default async function SchedulingPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const org = await currentOrg();
  if (!org) notFound();
  const m = await getMembership(org.id);
  if (!m) notFound();

  const configured = googleOAuthConfigured();
  const connections = await listConnectionStatuses(org.id, m.user_id);
  const google = connections.find((c) => c.provider === "google" && c.status !== "revoked");

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Calendar</h1>
      <p className="text-[color:var(--brand-ink-muted)] mb-6 max-w-prose">
        Connect your calendar so QDX can read your free/busy times and put
        confirmed interviews on your schedule. We never share what&apos;s on your
        calendar — only whether a time is free.
      </p>

      {sp.connected === "google" && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Google Calendar connected.
        </div>
      )}
      {sp.error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {ERRORS[sp.error] ?? "Something went wrong. Please try again."}
        </div>
      )}

      <div className="rounded-xl border border-black/10 bg-white p-5 max-w-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold">Google Calendar</div>
            {google ? (
              <div className="text-sm text-[color:var(--brand-ink-muted)]">
                Connected{google.email ? ` · ${google.email}` : ""}
                {google.status === "expired" && " (needs reconnect)"}
              </div>
            ) : (
              <div className="text-sm text-[color:var(--brand-ink-muted)]">
                Not connected
              </div>
            )}
          </div>

          {google ? (
            <form action={disconnectCalendar.bind(null, "google")}>
              <button
                type="submit"
                className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium hover:bg-black/5"
              >
                Disconnect
              </button>
            </form>
          ) : configured ? (
            <a href="/admin/scheduling/connect/google" className="btn-primary">
              Connect
            </a>
          ) : (
            <span className="text-sm text-[color:var(--brand-ink-muted)]">
              Unavailable
            </span>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-[color:var(--brand-ink-muted)] max-w-prose">
        Setting up availability rules and interview types comes next. Once your
        calendar is connected you&apos;ll be able to send candidates a link to
        book a time that works for both of you.
      </p>
    </div>
  );
}
