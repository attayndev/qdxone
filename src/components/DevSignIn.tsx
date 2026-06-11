import { devSignIn } from "@/app/login/actions";

/**
 * DEV ONLY sign-in (no email). Rendered only when NODE_ENV !== production.
 */
export default function DevSignIn() {
  return (
    <form
      action={devSignIn}
      className="mt-6 border-t border-dashed border-[color:var(--brand-line)] pt-4"
    >
      <p className="text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
        Dev only · skip email
      </p>
      <div className="mt-2 space-y-2">
        <input
          className="input"
          name="email"
          type="email"
          inputMode="email"
          autoCapitalize="none"
          placeholder="you@example.com"
          required
        />
        <div className="flex gap-2">
          <input
            className="input flex-1"
            name="slug"
            defaultValue="16handlesnewcity"
            placeholder="org slug"
          />
          <button type="submit" className="btn-ghost whitespace-nowrap">
            Dev sign-in
          </button>
        </div>
      </div>
    </form>
  );
}
