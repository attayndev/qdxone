/**
 * Twilio SMS wrapper. Best-effort: when Twilio env vars are unset (or there's
 * no recipient number), it no-ops so the app works without SMS configured.
 */
export async function sendSms(
  to: string | null | undefined,
  body: string
): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from || !to) return false;
  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(sid, token);
    await client.messages.create({ to, from, body });
    return true;
  } catch (e) {
    console.error("sms send failed", e);
    return false;
  }
}
