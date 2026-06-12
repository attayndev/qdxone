import { notFound } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import {
  openBillingPortal,
  startCheckoutForCurrentOrg,
} from "@/app/admin/billing/actions";
import type { OrganizationRow } from "@/lib/supabase/types";

interface PageProps {
  searchParams: Promise<{
    success?: string;
    canceled?: string;
    reason?: string;
  }>;
}

export default async function BillingPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const org = await currentOrg();
  if (!org) notFound();

  // Completed candidate assessments this calendar month = the billable unit.
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();
  const supa = adminClient();
  const { count } = await supa
    .from("assessment_sessions")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("subject_type", "candidate")
    .eq("status", "complete")
    .gte("completed_at", monthStart);

  const used = count ?? 0;
  const quota = org.monthly_assessment_quota; // null = unlimited
  const trialEnds = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const inTrial = org.status === "trialing" && trialEnds && trialEnds > now;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Billing & usage</h1>
        <p className="text-[color:var(--brand-ink-muted)]">
          Plan, completed assessments this month, and trial status.
        </p>
      </div>

      {sp.reason && (
        <p className="card bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] font-semibold">
          {sp.reason === "trial_expired"
            ? "Your free trial has ended. Add a plan to keep reviewing candidates."
            : sp.reason === "past_due"
              ? "Your last payment failed. Update your card to restore access."
              : "Your subscription was canceled. Resubscribe to continue."}
        </p>
      )}
      {sp.success && (
        <p className="card text-emerald-700 bg-emerald-50">
          You&apos;re all set — trial started. Welcome aboard.
        </p>
      )}
      {sp.canceled && <p className="card">Checkout canceled — you can finish later.</p>}

      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Plan" value={planLabel(org)} />
        <Stat label="Status" value={statusLabel(org.status)} />
        <Stat
          label={inTrial ? "Trial ends" : "Member since"}
          value={
            inTrial && trialEnds
              ? trialEnds.toLocaleDateString()
              : new Date(org.created_at).toLocaleDateString()
          }
        />
      </div>

      <div className="card">
        <h2 className="font-extrabold text-lg">This month</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat label="Completed assessments" value={used} small />
          <Stat
            label="Included"
            value={quota === null ? "Unlimited" : quota}
            small
          />
          <Stat
            label="Remaining"
            value={quota === null ? "∞" : Math.max(0, quota - used)}
            small
          />
        </div>
        {quota !== null && used >= quota && (
          <p className="mt-3 text-sm text-[color:var(--brand-pink-600)] font-semibold">
            You&apos;ve used your {quota} included assessments. Candidates keep
            applying — additional completed assessments this month bill at $
            {overageRate(org.plan)} each.
          </p>
        )}
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-lg">Manage billing</h2>
          <p className="text-sm text-[color:var(--brand-ink-muted)]">
            Update your card, change plan, or download invoices.
          </p>
        </div>
        {org.stripe_customer_id ? (
          <form action={openBillingPortal}>
            <button type="submit" className="btn-primary">
              Open billing portal
            </button>
          </form>
        ) : (
          <div className="flex flex-wrap gap-2">
            <SubscribeButton plan="starter" label="Starter — 25/mo" primary />
            <SubscribeButton plan="growth" label="Growth — 75/mo" />
          </div>
        )}
      </div>
    </div>
  );
}

function SubscribeButton({
  plan,
  label,
  primary,
}: {
  plan: "starter" | "growth";
  label: string;
  primary?: boolean;
}) {
  return (
    <form
      action={async () => {
        "use server";
        await startCheckoutForCurrentOrg(plan);
      }}
    >
      <button type="submit" className={primary ? "btn-primary" : "btn-ghost"}>
        {label}
      </button>
    </form>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: React.ReactNode;
  small?: boolean;
}) {
  return (
    <div className={small ? "" : "card"}>
      <div className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
        {label}
      </div>
      <div className={small ? "text-2xl font-black mt-1" : "text-3xl font-black mt-1"}>
        {value}
      </div>
    </div>
  );
}

function planLabel(org: OrganizationRow): string {
  switch (org.plan) {
    case "starter":
      return "Starter (25/mo)";
    case "growth":
      return "Growth (75/mo)";
    case "multi_unit":
      return "Multi-unit";
    default:
      return "—";
  }
}

// Per-completed-assessment overage once the monthly quota is used up.
function overageRate(plan: OrganizationRow["plan"]): number {
  return plan === "growth" ? 2 : 3;
}

function statusLabel(status: string): string {
  return status === "trialing"
    ? "Trialing"
    : status === "active"
      ? "Active"
      : status === "past_due"
        ? "Past due"
        : "Canceled";
}
