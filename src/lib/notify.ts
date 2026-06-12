import { orgUrl } from "./tenancy";
import { sendSms } from "./sms";

/**
 * Deliver the assessment link to a candidate via email (Resend) and SMS
 * (Twilio). Both are best-effort — whichever is configured fires.
 */
export async function sendAssessmentLink(args: {
  token: string;
  orgSlug: string;
  orgName: string;
  firstName: string;
  email: string;
  phone?: string | null;
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

  await sendSms(
    args.phone,
    `${args.firstName ? args.firstName + ", " : ""}finish your ${args.orgName} application with a quick 5-minute assessment: ${link} (link valid 72h)`
  );
}
