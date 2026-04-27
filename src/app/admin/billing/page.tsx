import { notFound } from "next/navigation";
import { currentOrg } from "@/lib/tenancy";
import { getUsageForPeriod } from "@/lib/usage";
import {
  openBillingPortal,
  startCheckoutForCurrentOrg,
} from "@/app/admin/billing/actions";
import type { OrganizationRow } from "@/lib/supabase/types";

interface PageProps {
  searchParams: Promise<{ success?: string; canceled?: string }>;
}

export default async function BillingPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const org = await currentOrg();
  if (!org) notFound();

  const usage = await getUsageForPeriod({
    orgId: org.id,
    typeKey: "questionnaire",
  });

  const cycle = org.billing_cycle ?? "annual";
  const overagePerCents = cycle === "monthly" ? 400 : 300;
  const overageCost = (usage.overage * overagePerCents) / 100;
  const trialEnds = org.trial_ends_at
    ? new Date(org.trial_ends_at)
    : null;
  const inTrial = org.plan === "trial" && trialEnds && trialEnds > new Date();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Billing & usage</h1>
        <p className="text-[color:var(--brand-ink-muted)]">
          Plan, usage this month, and projected charges.
        </p>
      </div>

      {sp.success && (
        <p className="card text-emerald-700 bg-emerald-50">
          Subscription activated. Welcome aboard.
        </p>
      )}
      {sp.canceled && (
        <p className="card">
          Checkout canceled — you can finish later.
        </p>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Stat label="Plan" value={planLabel(org)} />
        <Stat label="Cycle" value={cycle === "monthly" ? "Monthly" : "Annual"} />
        <Stat
          label={inTrial ? "Trial ends" : "Status"}
          value={
            inTrial && trialEnds
              ? trialEnds.toLocaleDateString()
              : org.status
          }
        />
      </div>

      <div className="card">
        <h2 className="font-extrabold text-lg">This month</h2>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Used" value={usage.used} small />
          <Stat label="Included" value={usage.quota} small />
          <Stat label="Overage" value={usage.overage} small />
          <Stat
            label="Overage charges"
            value={`$${overageCost.toFixed(2)}`}
            small
          />
        </div>
        <p className="mt-3 text-xs text-[color:var(--brand-ink-muted)]">
          Each overage test bills at $
          {(overagePerCents / 100).toFixed(2)} on the{" "}
          {cycle === "monthly" ? "monthly" : "annual"} cycle.
        </p>
      </div>

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-extrabold text-lg">Manage billing</h2>
          <p className="text-sm text-[color:var(--brand-ink-muted)]">
            Update payment method, cancel, or download invoices in the
            Stripe-hosted portal.
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
            <form
              action={async () => {
                "use server";
                await startCheckoutForCurrentOrg("starter", cycle);
              }}
            >
              <button type="submit" className="btn-primary">
                Subscribe — Starter
              </button>
            </form>
            <form
              action={async () => {
                "use server";
                await startCheckoutForCurrentOrg("growth", cycle);
              }}
            >
              <button type="submit" className="btn-ghost">
                Subscribe — Growth
              </button>
            </form>
          </div>
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

function planLabel(org: OrganizationRow): string {
  if (org.plan === "trial") return "Trial";
  if (org.plan === "starter") return "Starter (10/mo)";
  if (org.plan === "growth") return "Growth (25/mo)";
  return "Canceled";
}
