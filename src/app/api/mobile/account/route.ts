import { NextResponse, type NextRequest } from "next/server";
import { authedOrg } from "@/lib/mobile/auth";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Self-service account deletion (App Store 5.1.1(v) / Google Play). Removes the
 * operator's own account + personal footprint: their auth user (email, name),
 * org memberships, and push tokens. Org-owned business records — candidates,
 * postings, assessments — belong to the EMPLOYER (the data controller per the
 * privacy policy) and are retained; deleting one operator does not erase the
 * employer's hiring data. After this, the operator's tokens are invalid.
 */
export async function DELETE(request: NextRequest) {
  const ctx = await authedOrg(request);
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const admin = adminClient();
  const uid = ctx.userId;
  try {
    await admin.from("push_tokens").delete().eq("user_id", uid);
    await admin.from("org_members").delete().eq("user_id", uid);
    const { error } = await admin.auth.admin.deleteUser(uid);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    // Best-effort audit trail (the org record still exists).
    try {
      await admin
        .from("audit_events")
        .insert({ org_id: ctx.orgId, kind: "account.deleted", meta: { user_id: uid } });
    } catch {
      /* audit is best-effort */
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Deletion failed." },
      { status: 500 }
    );
  }
}
