/**
 * Telnyx SMS wrapper (REST v2, no SDK dependency). Best-effort: when the Telnyx
 * env vars are unset (or there's no recipient), it no-ops so the app works
 * without SMS configured.
 *
 * Env: TELNYX_API_KEY + TELNYX_FROM (a number on the account). Optional
 * TELNYX_MESSAGING_PROFILE_ID for number-pool / sender-pool sending.
 */
/** Has this number sent STOP? Best-effort — never blocks a send if the check errors. */
async function isOptedOut(phone: string): Promise<boolean> {
  try {
    const { adminClient } = await import("@/lib/supabase/admin");
    const { data, error } = await adminClient()
      .from("sms_opt_outs")
      .select("phone")
      .eq("phone", phone)
      .limit(1);
    if (error) return false; // table missing / transient → don't block
    return (data?.length ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function sendSms(
  to: string | null | undefined,
  body: string
): Promise<boolean> {
  const apiKey = process.env.TELNYX_API_KEY;
  const from = process.env.TELNYX_FROM;
  if (!apiKey || !from || !to) return false;
  // Honor an in-app opt-out (a persisted STOP) before spending a send.
  if (await isOptedOut(to)) return false;
  try {
    const res = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        text: body,
        ...(process.env.TELNYX_MESSAGING_PROFILE_ID
          ? { messaging_profile_id: process.env.TELNYX_MESSAGING_PROFILE_ID }
          : {}),
      }),
    });
    if (!res.ok) {
      console.error("sms send failed", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("sms send failed", e);
    return false;
  }
}
