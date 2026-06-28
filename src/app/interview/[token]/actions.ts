"use server";

import { currentOrg } from "@/lib/tenancy";
import { getInvitationByToken } from "@/lib/scheduling/invitations";
import { createBooking } from "@/lib/scheduling/bookings";

export type BookSlotResult =
  | { ok: true }
  | { ok: false; reason: "taken" | "invalid" | "expired" | "error"; message: string };

/**
 * Public booking endpoint. Re-resolves the invitation server-side from the token
 * (never trusts the client) and writes the booking with concurrency protection.
 */
export async function bookSlot(token: string, startIso: string): Promise<BookSlotResult> {
  const org = await currentOrg();
  if (!org) return { ok: false, reason: "invalid", message: "Invalid link." };

  const inv = await getInvitationByToken(org.id, token);
  if (!inv) return { ok: false, reason: "invalid", message: "This link is no longer valid." };

  const result = await createBooking(inv, startIso);
  if (result.ok) return { ok: true };
  return { ok: false, reason: result.reason, message: result.message };
}
