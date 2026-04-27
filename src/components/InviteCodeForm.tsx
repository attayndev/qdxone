"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Tiny client form on the landing page. Lets a candidate paste a token
 * (e.g. from a text) and jump to /invite/[token]. The actual validity
 * check happens server-side on the destination route.
 */
export default function InviteCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const token = code.trim();
        if (!token) return;
        setLoading(true);
        router.push(`/invite/${encodeURIComponent(token)}`);
      }}
      className="flex flex-col sm:flex-row gap-3 items-stretch max-w-md mx-auto"
    >
      <input
        type="text"
        inputMode="text"
        autoComplete="off"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Invitation code"
        className="input flex-1 text-center sm:text-left bg-white text-[color:var(--brand-ink)]"
        aria-label="Invitation code"
      />
      <button
        type="submit"
        className="btn-primary"
        disabled={loading || !code.trim()}
      >
        {loading ? "Opening…" : "Continue"}
      </button>
    </form>
  );
}
