"use server";

import { revalidatePath } from "next/cache";
import { currentOrgOrThrow, requireMembership } from "@/lib/tenancy";
import { disconnect } from "@/lib/scheduling/connections";
import type { CalendarProviderId } from "@/lib/calendar-providers/provider";

/** Disconnect the current user's calendar for this org (best-effort revoke). */
export async function disconnectCalendar(provider: CalendarProviderId): Promise<void> {
  const org = await currentOrgOrThrow();
  const m = await requireMembership(org.id);
  await disconnect(org.id, m.user_id, provider);
  revalidatePath("/admin/scheduling");
}
