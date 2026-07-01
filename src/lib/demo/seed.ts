/**
 * Demo restaurant seed — a CLONE of the real "16 Handles New City" org with all
 * PII scrubbed. Cloning (vs. synthesizing) means the assessment responses, and
 * therefore the fits, are genuinely real — the demo shows the actual product
 * with life in it, just anonymized.
 *
 * Scrubbed: names (→ a fixed fake pool), email (→ derived), phone (→ (845)
 * 555-12NN), and reference contacts (→ "N Broadway"). Kept: work history,
 * availability, ZIP, custom answers, and every assessment response (the value).
 *
 * Idempotent: reseeding wipes the demo org's candidates/postings first, so the
 * demo always reflects the current source data.
 */

import "server-only";
import { adminClient } from "@/lib/supabase/admin";
import { generateToken } from "@/lib/tokens";

export const DEMO_SLUG = "demo";
const DEMO_NAME = "Broadway Scoops (Demo)";
const SOURCE_NAME_MATCH = "%16 handles%"; // resolve the source org by name

const FAKE_NAMES: [string, string][] = [
  ["Maya", "Rivera"], ["Devin", "Carter"], ["Aisha", "Bello"], ["Cody", "Nguyen"],
  ["Brianna", "Hughes"], ["Jordan", "Pierce"], ["Tyler", "Owens"], ["Sam", "Whitfield"],
  ["Riley", "Dawson"], ["Priya", "Anand"], ["Marcus", "Bennett"], ["Chloe", "Foster"],
  ["Diego", "Marsh"], ["Nina", "Patel"], ["Owen", "Brooks"], ["Zoe", "Callahan"],
  ["Isaiah", "Reed"], ["Lena", "Ortiz"], ["Caleb", "Nash"], ["Grace", "Sullivan"],
  ["Andre", "Coleman"], ["Sofia", "Mercado"], ["Ethan", "Park"], ["Talia", "Weiss"],
];

const fakePhone = (i: number) => `(845) 555-12${String(i % 100).padStart(2, "0")}`;

export async function resetDemoOrg(): Promise<{ orgId: string; candidates: number }> {
  const supa = adminClient();

  // Source org (the real 16 Handles).
  const { data: srcRow } = await supa
    .from("organizations")
    .select("id, branding")
    .ilike("name", SOURCE_NAME_MATCH)
    .limit(1)
    .maybeSingle();
  const source = srcRow as { id: string; branding: unknown } | null;
  if (!source) throw new Error("Source org (16 Handles) not found — nothing to clone.");

  // Demo org (upsert by slug so reseeding keeps its id + members).
  const { data: existing } = await supa.from("organizations").select("id").eq("slug", DEMO_SLUG).maybeSingle();
  let orgId = (existing as { id: string } | null)?.id;
  const orgFields = {
    slug: DEMO_SLUG,
    name: DEMO_NAME,
    plan: "operator",
    status: "active",
    location_count: 1,
    branding: source.branding, // reuse roles/branding so postings/roles line up
  };
  if (orgId) {
    await supa.from("organizations").update(orgFields as never).eq("id", orgId);
  } else {
    const { data: created, error } = await supa
      .from("organizations")
      .insert(orgFields as never)
      .select("id")
      .single();
    if (error || !created) throw new Error(`demo org create: ${error?.message}`);
    orgId = (created as { id: string }).id;
  }

  // Wipe prior demo candidates/postings (FK order). Org + members preserved.
  const { data: oldSess } = await supa.from("assessment_sessions").select("id").eq("org_id", orgId);
  const oldSessionIds = ((oldSess as { id: string }[] | null) ?? []).map((s) => s.id);
  if (oldSessionIds.length) await supa.from("assessment_responses").delete().in("session_id", oldSessionIds);
  await supa.from("assessment_sessions").delete().eq("org_id", orgId);
  await supa.from("applications").delete().eq("org_id", orgId);
  await supa.from("job_postings").delete().eq("org_id", orgId);
  await supa.from("locations").delete().eq("org_id", orgId);

  // One store, on Broadway.
  const { data: loc } = await supa
    .from("locations")
    .insert({ org_id: orgId, name: "Broadway Scoops — Main St", city: "New City", region: "NY" } as never)
    .select("id")
    .single();
  const locationId = (loc as { id: string } | null)?.id ?? null;

  // Clone open postings (title + pay), fresh tokens.
  const { data: srcPostings } = await supa
    .from("job_postings")
    .select("title, pay_min, pay_max, pay_period, tips")
    .eq("org_id", source.id)
    .limit(5);
  for (const p of (srcPostings as Record<string, unknown>[] | null) ?? []) {
    await supa.from("job_postings").insert({
      org_id: orgId,
      location_id: locationId,
      title: p.title,
      public_token: generateToken(),
      status: "open",
      pay_min: p.pay_min ?? 16,
      pay_max: p.pay_max ?? 18,
      pay_period: p.pay_period ?? "hour",
      tips: p.tips ?? true,
    } as never);
  }

  // Clone candidates + their assessments, scrubbing PII.
  const { data: srcApps } = await supa
    .from("applications")
    .select("*")
    .eq("org_id", source.id)
    .order("submitted_at", { ascending: false })
    .limit(40);
  const apps = (srcApps as Record<string, unknown>[] | null) ?? [];

  let i = 0;
  for (const a of apps) {
    const [first, last] = FAKE_NAMES[i % FAKE_NAMES.length];
    const suffix = i >= FAKE_NAMES.length ? String(Math.floor(i / FAKE_NAMES.length) + 1) : "";
    const refs = ((a.job_references as { name: string; contact: string }[] | null) ?? []).map((_r, j) => ({
      name: FAKE_NAMES[(i + j + 5) % FAKE_NAMES.length].join(" "),
      contact: `${100 + j} Broadway`,
    }));

    const { data: newApp } = await supa
      .from("applications")
      .insert({
        org_id: orgId,
        location_id: locationId,
        first_name: first,
        last_name: last + suffix,
        email: `${first}.${last}${suffix}@example.com`.toLowerCase(),
        phone: fakePhone(i + 1),
        positions: a.positions,
        status: a.status,
        submitted_at: a.submitted_at,
        eligible_to_work: a.eligible_to_work,
        postal_code: a.postal_code,
        earliest_start_date: a.earliest_start_date,
        availability: a.availability,
        work_history: a.work_history,
        job_references: refs,
        custom_answers: a.custom_answers,
        decision: a.decision ?? null,
        decision_at: a.decision_at ?? null,
      } as never)
      .select("id")
      .single();
    const newAppId = (newApp as { id: string } | null)?.id;
    if (!newAppId) {
      i++;
      continue;
    }

    // Clone the candidate assessment session + every response verbatim.
    const { data: srcSess } = await supa
      .from("assessment_sessions")
      .select("*")
      .eq("application_id", a.id as string)
      .eq("subject_type", "candidate")
      .maybeSingle();
    const s = srcSess as Record<string, unknown> | null;
    if (s) {
      const { data: newSess } = await supa
        .from("assessment_sessions")
        .insert({
          org_id: orgId,
          location_id: locationId,
          subject_type: "candidate",
          application_id: newAppId,
          methodology_version: s.methodology_version,
          form_item_ids: s.form_item_ids,
          status: s.status,
          delivery_channels: [],
          access_token: generateToken(),
          expires_at: s.expires_at,
          started_at: s.started_at,
          completed_at: s.completed_at,
        } as never)
        .select("id")
        .single();
      const newSessId = (newSess as { id: string } | null)?.id;
      if (newSessId) {
        const { data: srcResp } = await supa
          .from("assessment_responses")
          .select("item_id, item_kind, value_int, value_text, response_ms, sequence")
          .eq("session_id", s.id as string);
        const rows = ((srcResp as Record<string, unknown>[] | null) ?? []).map((r) => ({
          session_id: newSessId,
          item_id: r.item_id,
          item_kind: r.item_kind,
          value_int: r.value_int,
          value_text: r.value_text,
          response_ms: r.response_ms,
          sequence: r.sequence,
        }));
        if (rows.length) await supa.from("assessment_responses").insert(rows as never);
      }
    }
    i++;
  }

  // Let platform admins view the demo directly (members of the demo org).
  const { data: admins } = await supa.from("platform_admins").select("user_id");
  for (const row of (admins as { user_id: string | null }[] | null) ?? []) {
    if (row.user_id) {
      await supa
        .from("org_members")
        .upsert({ org_id: orgId, user_id: row.user_id, role: "owner" } as never, { onConflict: "org_id,user_id" });
    }
  }

  return { orgId, candidates: apps.length };
}
