import { notFound } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import {
  openBillingPortal,
  startCheckoutForCurrentOrg,
} from "@/app/admin/billing/actions";
import {
  effectiveTier,
  planLimits,
  monthlyBasePrice,
  TIER_LABEL,
} from "@/lib/plan";

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

  const tier = effectiveTier(org);
  const limits = planLimits(tier, org.location_count);
  const now = new Date();
  const trialEnds = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const inTrial = org.status === "trialing" && trialEnds && trialEnds > now;
  const locLabel = `${org.location_count} location${org.location_count === 1 ? "" : "s"}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Billing</h1>
        <p className="text-[color:var(--brand-ink-muted)]">
          Your plan, seats, and trial status.
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
        <Stat label="Plan" value={`${TIER_LABEL[tier]} · ${locLabel}`} />
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
        <h2 className="font-extrabold text-lg">What&apos;s included</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat label="Assessments" value="Unlimited" small />
          <Stat
            label="Seats"
            value={limits.seats === null ? "Unlimited" : limits.seats}
            small
          />
          <Stat
            label="Price"
            value={
              tier === "enterprise"
                ? "Custom"
                : `$${monthlyBasePrice(tier, org.location_count)}/mo`
            }
            small
          />
        </div>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-lg">Manage billing</h2>
          <p className="text-sm text-[color:var(--brand-ink-muted)]">
            {tier === "enterprise"
              ? "Your plan is managed by our team."
              : "Update your card, change cycle, or download invoices."}
          </p>
        </div>
        {tier === "enterprise" ? (
          <a href="/demo" className="btn-ghost">
            Contact us
          </a>
        ) : org.stripe_customer_id ? (
          <form action={openBillingPortal}>
            <button type="submit" className="btn-primary">
              Open billing portal
            </button>
          </form>
        ) : (
          <form action={startCheckoutForCurrentOrg}>
            <button type="submit" className="btn-primary">
              Start {TIER_LABEL[tier]} — ${monthlyBasePrice(tier, org.location_count)}/mo
            </button>
          </form>
        )}
      </div>
    </div>
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

function statusLabel(status: string): string {
  return status === "trialing"
    ? "Trialing"
    : status === "active"
      ? "Active"
      : status === "past_due"
        ? "Past due"
        : "Canceled";
}
