import { adminClient } from "@/lib/supabase/admin";
import { getOrgLocations } from "@/lib/locations";
import type { OrganizationRow, OrgBranding } from "@/lib/supabase/types";

/**
 * First-run setup status, DERIVED FROM DATA (not a flag that can drift) so the
 * checklist is always accurate and self-healing. A step is "done" when the
 * thing it creates exists.
 */
export type OnboardingStatus = {
  hasStore: boolean;
  hasJob: boolean;
  hasBranding: boolean;
  hasTeam: boolean;
  assessmentSet: boolean;
  doneCount: number;
  total: number;
  complete: boolean;
  dismissed: boolean;
};

export type OnboardingLocation = { id: string; name: string };

function brandingTouched(b: OrgBranding | null | undefined): boolean {
  return !!(
    b &&
    (b.primary_color ||
      b.logo_url ||
      b.hero_copy_subhead ||
      (b.values && b.values.length > 0))
  );
}

export async function getOnboarding(
  org: OrganizationRow
): Promise<{ status: OnboardingStatus; locations: OnboardingLocation[] }> {
  const supa = adminClient();
  const [openPostings, members, locs] = await Promise.all([
    supa
      .from("job_postings")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id)
      .eq("status", "open"),
    supa
      .from("org_members")
      .select("*", { count: "exact", head: true })
      .eq("org_id", org.id),
    getOrgLocations(org.id),
  ]);

  const b = org.branding;
  const hasStore = locs.length > 0;
  const hasJob = (openPostings.count ?? 0) > 0;
  const hasBranding = brandingTouched(b);
  const hasTeam = (members.count ?? 0) > 1;
  const assessmentSet = typeof b?.auto_send_assessment === "boolean";

  const steps = [hasStore, hasJob, hasBranding, hasTeam, assessmentSet];
  const doneCount = steps.filter(Boolean).length;

  return {
    status: {
      hasStore,
      hasJob,
      hasBranding,
      hasTeam,
      assessmentSet,
      doneCount,
      total: steps.length,
      complete: doneCount === steps.length,
      dismissed: !!b?.onboarding_dismissed,
    },
    locations: locs.map((l) => ({ id: l.id, name: l.name })),
  };
}
