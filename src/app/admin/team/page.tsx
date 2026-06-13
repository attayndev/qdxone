import { notFound } from "next/navigation";
import { currentOrg, getMembership } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import { effectiveTier, planLimits, TIER_LABEL } from "@/lib/plan";
import InviteMemberForm from "./InviteMemberForm";
import RemoveMemberButton from "./RemoveMemberButton";

export default async function TeamPage() {
  const org = await currentOrg();
  if (!org) notFound();
  const me = await getMembership(org.id);

  const supa = adminClient();
  const { data: rows } = await supa
    .from("org_members")
    .select("user_id, role, created_at")
    .eq("org_id", org.id)
    .order("created_at", { ascending: true });
  const members = rows ?? [];

  // Resolve each member's email (small list — one lookup each).
  const withEmail = await Promise.all(
    members.map(async (mem) => {
      const { data } = await supa.auth.admin.getUserById(mem.user_id);
      return { ...mem, email: data?.user?.email ?? "(unknown)" };
    })
  );

  const tier = effectiveTier(org);
  const limits = planLimits(tier, org.location_count);
  const used = members.length;
  const seatLabel =
    limits.seats === null ? `${used} of unlimited` : `${used} of ${limits.seats}`;
  const atLimit = limits.seats !== null && used >= limits.seats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight">Team</h1>
        <p className="text-[color:var(--brand-ink-muted)]">
          Managers who can sign in and review candidates.
        </p>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-extrabold text-lg">Add a manager</h2>
          <span className="text-sm text-[color:var(--brand-ink-muted)]">
            {seatLabel} seats used · {TIER_LABEL[tier]} plan
          </span>
        </div>
        <div className="mt-3">
          <InviteMemberForm disabled={atLimit} />
        </div>
        <p className="mt-3 text-xs text-[color:var(--brand-ink-muted)]">
          {tier === "solo"
            ? "Solo includes 2 logins. Add a second location to move to Operator (2 + 1 per location)."
            : tier === "operator"
              ? "Operator includes 2 logins plus 1 for each location."
              : "Your plan includes unlimited logins."}
        </p>
      </div>

      <div className="card p-0 overflow-hidden">
        <ul className="divide-y divide-[color:var(--brand-line)]">
          {withEmail.map((mem) => (
            <li
              key={mem.user_id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="font-semibold truncate">
                  {mem.email}
                  {me?.user_id === mem.user_id && (
                    <span className="text-[color:var(--brand-ink-muted)] font-normal">
                      {" "}
                      (you)
                    </span>
                  )}
                </div>
                <div className="text-xs text-[color:var(--brand-ink-muted)]">
                  {mem.role === "owner" ? "Owner" : "Manager"} · joined{" "}
                  {new Date(mem.created_at).toLocaleDateString()}
                </div>
              </div>
              {mem.role !== "owner" && me?.user_id !== mem.user_id && (
                <RemoveMemberButton userId={mem.user_id} email={mem.email} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
