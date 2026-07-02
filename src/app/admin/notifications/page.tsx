import { notFound } from "next/navigation";
import { currentOrg, requireMembership } from "@/lib/tenancy";
import { adminClient } from "@/lib/supabase/admin";
import NotificationPrefs from "@/components/admin/NotificationPrefs";
import ProfileForm from "@/components/admin/ProfileForm";
import type { NotifyPrefs } from "@/lib/notify-prefs";

export default async function NotificationsPage() {
  const org = await currentOrg();
  if (!org) notFound();
  const m = await requireMembership(org.id);
  if (!m) notFound();

  const supa = adminClient();
  const [{ data }, { data: userData }] = await Promise.all([
    supa
      .from("org_members")
      .select("*")
      .eq("org_id", org.id)
      .eq("user_id", m.user_id)
      .maybeSingle(),
    supa.auth.admin.getUserById(m.user_id),
  ]);
  // notify_prefs/phone added in migration 0011 — read loosely.
  const row = data as unknown as { notify_prefs: NotifyPrefs | null; phone: string | null } | null;
  const meta = (userData.user?.user_metadata ?? {}) as { first_name?: string; last_name?: string };

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Your account</h1>
      <p className="text-[color:var(--brand-ink-muted)] max-w-2xl">
        Your name and what you want to hear about. These are your own settings —
        everyone on the team tunes their own.
      </p>

      <div className="mt-6">
        <ProfileForm
          initialFirst={meta.first_name ?? ""}
          initialLast={meta.last_name ?? ""}
          email={userData.user?.email ?? ""}
        />
      </div>

      <div className="mt-6">
        <NotificationPrefs
          initialPrefs={row?.notify_prefs ?? {}}
          initialPhone={row?.phone ?? ""}
        />
      </div>
    </div>
  );
}
