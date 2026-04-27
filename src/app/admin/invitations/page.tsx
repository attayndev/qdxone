import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { InvitationRow } from "@/lib/supabase/types";
import InvitationsClient from "@/components/admin/InvitationsClient";
import { currentOrg, orgUrl } from "@/lib/tenancy";

export default async function InvitationsPage() {
  const org = await currentOrg();
  if (!org) notFound();
  const supa = await createClient();
  const { data } = await supa
    .from("invitations")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(500);
  const invitations = (data ?? []) as InvitationRow[];

  // Build invitation URLs against the org's own subdomain.
  const baseUrl = orgUrl(org.slug);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Invitations</h1>
          <p className="text-[color:var(--brand-ink-muted)]">
            Create, send, copy, and expire invitation links.
          </p>
        </div>
      </div>

      <InvitationsClient invitations={invitations} baseUrl={baseUrl} />
    </div>
  );
}
