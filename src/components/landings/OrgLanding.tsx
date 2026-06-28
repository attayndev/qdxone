import Link from "next/link";
import { BrandHeader, BrandFooter } from "@/components/Brand";
import { BrandTheme } from "@/components/BrandTheme";
import { adminClient } from "@/lib/supabase/admin";
import { getOrgLocations } from "@/lib/locations";
import { careersCopy } from "@/lib/careers-copy";
import type { OrganizationRow } from "@/lib/supabase/types";
import type { Database } from "@/lib/supabase/database.types";

type PostingRow = Database["public"]["Tables"]["job_postings"]["Row"];
type Posting = Pick<PostingRow, "id" | "title" | "public_token" | "location_id">;

/**
 * The branded org landing — shown at the org's subdomain root. The store's
 * public careers page: hero + the open roles right under it, then the culture
 * pitch. Colors/logo/font come from `org.branding` via <BrandTheme>; wording
 * from `org.branding` copy fields.
 */
export default async function OrgLanding({ org }: { org: OrganizationRow }) {
  const b = org.branding;
  const eyebrow =
    b.hero_copy_eyebrow ?? `Now hiring · ${b.location_subtitle ?? org.name}`;
  const h1Pre = b.hero_copy_h1_pre ?? "Join the team.";
  const h1Post = b.hero_copy_h1_post ?? "Earn it.";
  const copy = careersCopy(b);

  const supa = adminClient();
  const { data } = await supa
    .from("job_postings")
    .select("id, title, public_token, location_id")
    .eq("org_id", org.id)
    .eq("status", "open")
    .order("created_at", { ascending: false });
  const postings = (data as Posting[] | null) ?? [];

  // When the org runs more than one store, group openings by location so an
  // applicant picks the right store (rather than guessing from a dropdown).
  const locations = await getOrgLocations(org.id);
  const multiLocation = locations.length >= 2;
  const groups = multiLocation
    ? [
        ...locations.map((l) => ({
          key: l.id,
          label: l.city ? `${l.name} · ${l.city}` : l.name,
          postings: postings.filter((p) => p.location_id === l.id),
        })),
        {
          key: "all",
          label: "All locations",
          postings: postings.filter(
            (p) => !p.location_id || !locations.some((l) => l.id === p.location_id)
          ),
        },
      ].filter((g) => g.postings.length > 0)
    : [];

  return (
    <>
      <BrandTheme branding={b} />
      <BrandHeader org={org} />
      <main className="flex-1">
        {/* Hero — compact; the jobs are the next thing the eye hits. */}
        <section className="px-4 sm:px-6 pt-10 sm:pt-14 pb-8">
          <div className="max-w-2xl mx-auto text-center">
            <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)] mb-4">
              {eyebrow}
            </span>
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">
              {h1Pre}{" "}
              <span className="text-[color:var(--brand-pink)]">{h1Post}</span>
            </h1>
            <p className="mt-5 text-lg text-[color:var(--brand-ink-muted)] max-w-xl mx-auto">
              {copy.subhead}
            </p>
          </div>
        </section>

        {/* Open positions — primary content, light cards on the page. */}
        <section id="openings" className="px-4 sm:px-6 pb-14">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Open positions
              </h2>
              {postings.length > 0 && (
                <span className="chip bg-[color:var(--brand-pink-50)] text-[color:var(--brand-pink-600)]">
                  {postings.length} open
                </span>
              )}
            </div>

            {postings.length === 0 ? (
              <div className="card text-center text-[color:var(--brand-ink-muted)]">
                No open roles posted right now — check back soon, or stop by{" "}
                {org.name} and ask.
              </div>
            ) : multiLocation ? (
              <div className="space-y-7">
                {groups.map((g) => (
                  <div key={g.key}>
                    <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-ink-muted)] mb-3">
                      {g.label}
                    </h3>
                    <ul className="space-y-3">
                      {g.postings.map((p) => (
                        <PostingCard key={p.id} p={p} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {postings.map((p) => (
                  <PostingCard key={p.id} p={p} />
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Culture pitch — secondary, below the jobs. */}
        <section
          id="what-were-looking-for"
          className="px-4 sm:px-6 py-12 bg-[color:var(--brand-surface)] border-y border-[color:var(--brand-line)]"
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center">
              What we look for
            </h2>
            <p className="text-center text-[color:var(--brand-ink-muted)] mt-2 max-w-xl mx-auto">
              {copy.lookForIntro}
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              {copy.values.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl p-5 bg-[color:var(--brand-cream)] border border-[color:var(--brand-line)]"
                >
                  {item.emoji && <div className="text-2xl">{item.emoji}</div>}
                  <h3 className="mt-2 font-bold text-lg">{item.title}</h3>
                  <p className="text-[color:var(--brand-ink-muted)] mt-1 text-sm leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 sm:px-6 py-12">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              The role, straight up
            </h2>
            {copy.roleIntro && (
              <p className="mt-3 text-[color:var(--brand-ink-muted)] max-w-2xl">
                {copy.roleIntro}
              </p>
            )}
            <ul className="mt-5 space-y-3 text-[color:var(--brand-ink)]">
              {copy.rolePoints.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="mt-2 inline-block w-2 h-2 rounded-full bg-[color:var(--brand-pink)] flex-shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <BrandFooter org={org} />
    </>
  );
}

function PostingCard({ p }: { p: Posting }) {
  return (
    <li className="card flex items-center justify-between gap-4 flex-wrap">
      <div className="font-bold text-lg text-[color:var(--brand-ink)]">
        {p.title}
      </div>
      <Link
        href={`/j/${encodeURIComponent(p.public_token)}`}
        className="btn-primary"
      >
        Apply
      </Link>
    </li>
  );
}
