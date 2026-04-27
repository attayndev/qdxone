"use client";

import { createClient } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        router.replace("/admin/login");
      }}
      className="text-sm font-semibold text-[color:var(--brand-pink-600)] hover:underline"
    >
      {busy ? "…" : "Sign out"}
    </button>
  );
}
