import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SetStaffPasswordForm from "@/components/staff/SetStaffPasswordForm";

/**
 * Reached from the emailed magic link (a session is already established). The
 * employee sets a password, then signs in with email+password thereafter.
 */
export default async function StaffSetPasswordPage() {
  const supa = await createClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  // No session (link expired / opened cold) → send them to sign in.
  if (!user) redirect("/staff/login");

  return (
    <div className="max-w-sm mx-auto mt-6">
      <h1 className="text-2xl font-black tracking-tight">Set your password</h1>
      <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1 mb-5">
        Choose a password to see your schedule. You&apos;ll use it to sign in from now on.
      </p>
      <SetStaffPasswordForm />
    </div>
  );
}
