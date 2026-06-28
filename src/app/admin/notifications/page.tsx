import { notFound } from "next/navigation";
import { currentOrg, requireMembership } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import NotificationPrefs from "@/components/admin/NotificationPrefs";
import type { NotifyPrefs } from "@/lib/notify-prefs";

export default async function NotificationsPage() {
  const org = await currentOrg();
  if (!org) notFound();
  const m = await requireMembership(org.id);
  if (!m) notFound();

  const supa = adminClient();
  const { data } = await supa
    .from("org_members")
    .select("*")
    .eq("org_id", org.id)
    .eq("user_id", m.user_id)
    .maybeSingle();
  // notify_prefs/phone added in migration 0011 — read loosely.
  const row = data as unknown as { notify_prefs: NotifyPrefs | null; phone: string | null } | null;

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
      <p className="text-[color:var(--brand-ink-muted)] max-w-2xl">
        Choose what you want to hear about. These are your own settings —
        everyone on the team tunes their own.
      </p>
      <div className="mt-6">
        <NotificationPrefs
          initialPrefs={row?.notify_prefs ?? {}}
          initialPhone={row?.phone ?? ""}
        />
      </div>
    </div>
  );
}
