import { orgUrl } from "./tenancy";
import { sendSms } from "./sms";

/**
 * Deliver the assessment link to a candidate. Email (Resend) goes to everyone;
 * SMS (Telnyx) fires ONLY when the candidate gave TCPA consent (`smsConsent`) —
 * the caller is responsible for passing the stored consent flag, so the gate is
 * enforced at this single layer. Both are best-effort.
 */
export async function sendAssessmentLink(args: {
  token: string;
  orgSlug: string;
  orgName: string;
  firstName: string;
  email: string;
  phone?: string | null;
  smsConsent: boolean;
}): Promise<void> {
  const link = orgUrl(args.orgSlug, `/a/${args.token}`);

  if (process.env.RESEND_API_KEY) {
    try {
      const { sendAssessmentEmail } = await import("./email");
      await sendAssessmentEmail({
        to: args.email,
        firstName: args.firstName,
        orgSlug: args.orgSlug,
        orgName: args.orgName,
        token: args.token,
      });
    } catch (e) {
      console.error("assessment email failed", e);
    }
  }

  // TCPA: only text candidates who consented. Sender named + STOP/HELP inline.
  if (args.smsConsent && args.phone) {
    await sendSms(
      args.phone,
      `${args.firstName ? args.firstName + ", " : ""}finish your ${args.orgName} application (via QDX) with a quick 5-minute assessment: ${link} (valid 72h). Reply STOP to opt out, HELP for help.`
    );
  }
}
