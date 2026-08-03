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
import { fitByApplication, categoryBandsByApplication } from "@/lib/assessment/fit";
import { nextReviewDue } from "@/lib/employees";
import { REVIEW_CATEGORIES } from "@/lib/review-categories";
import { weekDates, addDays } from "@/lib/shifts-core";
import { orgRoles } from "@/lib/roles";
import type { OrgBranding } from "@/lib/supabase/types";

export const DEMO_SLUG = "demo";
export const DEMO_USER_EMAIL = "demo@qdx.one";
const DEMO_NAME = "Broadway Scoops (Demo)";
const SOURCE_NAME_MATCH = "%16 handles%"; // resolve the source org by name

const FAKE_NAMES: [string, string][] = [
  ["Devin", "Carter"], ["Aisha", "Bello"], ["Jordan", "Pierce"], ["Sam", "Whitfield"],
  ["Riley", "Dawson"], ["Marcus", "Bennett"], ["Chloe", "Foster"], ["Nina", "Patel"],
  ["Isaiah", "Reed"], ["Lena", "Ortiz"], ["Grace", "Sullivan"], ["Andre", "Coleman"],
  ["Ethan", "Park"], ["Talia", "Weiss"], ["Naomi", "Fields"], ["Elias", "Romano"],
  ["Simone", "Clarke"], ["Darnell", "Boyd"], ["Yuki", "Tanaka"], ["Rosa", "Delgado"],
  ["Malik", "Osei"], ["Freya", "Lindqvist"], ["Hector", "Villa"], ["Amara", "Okafor"],
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
    // Reuse roles/colors, but drop the source's logo — the demo shows a plain
    // "BS" initials mark instead of the real store's logo.
    branding: { ...(source.branding as Record<string, unknown>), logo_url: null },
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
  // Shifts + employees first — reviews/role-changes cascade with employees.
  await supa.from("shifts").delete().eq("org_id", orgId);
  await supa.from("employees").delete().eq("org_id", orgId);
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

  // Restore candidates + assessments from the FROZEN anonymized snapshot, so the
  // demo is identical every night and independent of the live source changing.
  // Bootstrap-capture one from live on first run (or if it's ever been cleared).
  let restored = await restoreDemoFromSnapshot(orgId, locationId);
  if (restored === 0) {
    await captureDemoSnapshot();
    restored = await restoreDemoFromSnapshot(orgId, locationId);
  }

  // Populate the Employees module + its analytics: a coherent roster of hires
  // with backdated reviews whose ratings trend with assessment fit (so the
  // "does the assessment predict performance?" story is visible in the demo).
  await seedDemoEmployees(orgId, orgRoles(orgFields.branding as unknown as OrgBranding));

  // Populate the Schedule module: a published current-week schedule.
  await seedDemoScheduleWeek(orgId, locationId);

  // Let platform admins view the demo directly (members of the demo org).
  const { data: admins } = await supa.from("platform_admins").select("user_id");
  for (const row of (admins as { user_id: string | null }[] | null) ?? []) {
    if (row.user_id) {
      await supa
        .from("org_members")
        .upsert({ org_id: orgId, user_id: row.user_id, role: "owner" } as never, { onConflict: "org_id,user_id" });
    }
  }

  // Ensure the shared demo user (powers the public "Enter demo" one-click).
  const { data: userList } = await supa.auth.admin.listUsers();
  let demoUserId = (userList?.users ?? []).find((u) => u.email === DEMO_USER_EMAIL)?.id;
  if (!demoUserId) {
    const { data: created } = await supa.auth.admin.createUser({
      email: DEMO_USER_EMAIL,
      email_confirm: true,
    });
    demoUserId = created.user?.id;
  }
  if (demoUserId) {
    await supa
      .from("org_members")
      .upsert({ org_id: orgId, user_id: demoUserId, role: "admin" } as never, { onConflict: "org_id,user_id" });
  }

  return { orgId, candidates: restored };
}

// ── Frozen anonymized snapshot ─────────────────────────────────────────────
interface SnapshotResponse {
  item_id: unknown;
  item_kind: unknown;
  value_int: unknown;
  value_text: unknown;
  response_ms: unknown;
  sequence: unknown;
}
interface SnapshotCandidate {
  app: Record<string, unknown>; // already-anonymized application fields
  session: Record<string, unknown> | null;
  responses: SnapshotResponse[];
}
interface DemoSnapshot {
  candidates: SnapshotCandidate[];
}

/**
 * Capture a fresh anonymized snapshot from live 16 Handles: band-stratified
 * sampling + PII scrub (fake names/email/phone/references), frozen to
 * `demo_snapshot`. Nightly resets reload THIS, so the demo is stable; call this
 * (via the /super "Refresh demo from live" button) only to intentionally update
 * the canonical data. Returns how many candidates were captured.
 */
export async function captureDemoSnapshot(): Promise<{ captured: number }> {
  const supa = adminClient();
  const { data: srcRow } = await supa
    .from("organizations")
    .select("id")
    .ilike("name", SOURCE_NAME_MATCH)
    .limit(1)
    .maybeSingle();
  const source = srcRow as { id: string } | null;
  if (!source) throw new Error("Source org (16 Handles) not found — cannot capture demo snapshot.");

  const { data: srcApps } = await supa
    .from("applications")
    .select("*")
    .eq("org_id", source.id)
    .order("submitted_at", { ascending: false });
  const srcFit = await fitByApplication(source.id);
  // Only candidates with a REAL, complete fit — never Incomplete/unassessed ones
  // (they'd render "—" and look like broken junk in the demo). Cap at the
  // fake-name pool size so every demo name is unique (no "Name2" suffixes).
  const scored = ((srcApps as Record<string, unknown>[] | null) ?? []).filter((a) => {
    const b = srcFit.get(a.id as string);
    return !!b && b !== "Incomplete";
  });
  const apps = sampleAcrossBands(
    scored,
    (a) => srcFit.get(a.id as string) ?? "Incomplete",
    FAKE_NAMES.length
  );

  const candidates: SnapshotCandidate[] = [];
  let i = 0;
  for (const a of apps) {
    const [first, last] = FAKE_NAMES[i % FAKE_NAMES.length];
    const suffix = i >= FAKE_NAMES.length ? String(Math.floor(i / FAKE_NAMES.length) + 1) : "";
    const refs = ((a.job_references as { name: string; contact: string }[] | null) ?? []).map((_r, j) => ({
      name: FAKE_NAMES[(i + j + 5) % FAKE_NAMES.length].join(" "),
      contact: `${100 + j} Broadway`,
    }));

    const { data: srcSess } = await supa
      .from("assessment_sessions")
      .select("*")
      .eq("application_id", a.id as string)
      .eq("subject_type", "candidate")
      .maybeSingle();
    const band = srcFit.get(a.id as string);
    const s = srcSess as Record<string, unknown> | null;
    let session: Record<string, unknown> | null = null;
    let responses: SnapshotResponse[] = [];
    if (s) {
      session = {
        methodology_version: s.methodology_version,
        form_item_ids: s.form_item_ids,
        status: s.status,
        expires_at: s.expires_at,
        started_at: s.started_at,
        completed_at: s.completed_at,
      };
      const { data: srcResp } = await supa
        .from("assessment_responses")
        .select("item_id, item_kind, value_int, value_text, response_ms, sequence")
        .eq("session_id", s.id as string);
      responses = (srcResp as SnapshotResponse[] | null) ?? [];
    }

    candidates.push({
      app: {
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
        // Leave Caution candidates UNDECIDED so a couple show in the open pipeline
        // as flagged-and-awaiting-a-call (the demo's whole "scored shortlist" point);
        // otherwise the source's decisions hide them in the decided view.
        decision: band === "Caution" ? null : a.decision ?? null,
        decision_at: band === "Caution" ? null : a.decision_at ?? null,
      },
      session,
      responses,
    });
    i++;
  }

  // Keep exactly one canonical snapshot.
  await supa.from("demo_snapshot").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supa.from("demo_snapshot").insert({ data: { candidates } } as never);
  return { captured: candidates.length };
}

/** Reload the frozen snapshot into the demo org (fresh ids/tokens, re-parented). */
async function restoreDemoFromSnapshot(orgId: string, locationId: string | null): Promise<number> {
  const supa = adminClient();
  const { data: snapRow } = await supa
    .from("demo_snapshot")
    .select("data")
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const snap = (snapRow as { data: DemoSnapshot } | null)?.data;
  if (!snap?.candidates?.length) return 0;

  let count = 0;
  for (const c of snap.candidates) {
    const { data: newApp } = await supa
      .from("applications")
      .insert({ org_id: orgId, location_id: locationId, resume_token: generateToken(), ...c.app } as never)
      .select("id")
      .single();
    const newAppId = (newApp as { id: string } | null)?.id;
    if (!newAppId) continue;
    count++;
    if (c.session) {
      const { data: newSess } = await supa
        .from("assessment_sessions")
        .insert({
          org_id: orgId,
          location_id: locationId,
          subject_type: "candidate",
          application_id: newAppId,
          delivery_channels: [],
          access_token: generateToken(),
          ...c.session,
        } as never)
        .select("id")
        .single();
      const newSessId = (newSess as { id: string } | null)?.id;
      if (newSessId && c.responses.length) {
        await supa
          .from("assessment_responses")
          .insert(c.responses.map((r) => ({ session_id: newSessId, ...r })) as never);
      }
    }
  }
  return count;
}

/**
 * Round-robin across fit bands so a capped sample GUARANTEES coverage of every
 * band present (Strong fit / Consider / Caution / Not recommended), rather than
 * skewing to whatever band dominates the raw list. This is what makes the demo
 * show all assessment outcome types, per the demo's whole purpose.
 */
function sampleAcrossBands<T>(items: T[], bandOf: (t: T) => string, cap: number): T[] {
  const ORDER = ["Strong fit", "Consider", "Caution", "Not recommended", "Incomplete"];
  const buckets = new Map<string, T[]>(ORDER.map((b) => [b, []]));
  for (const it of items) (buckets.get(bandOf(it)) ?? buckets.get("Incomplete")!).push(it);
  const out: T[] = [];
  let progressed = true;
  while (out.length < cap && progressed) {
    progressed = false;
    for (const b of ORDER) {
      const bucket = buckets.get(b)!;
      if (bucket.length) {
        out.push(bucket.shift()!);
        progressed = true;
        if (out.length >= cap) break;
      }
    }
  }
  return out;
}

/** UTC date `days` before now (date math stays in UTC — no DST drift). */
function daysAgoUTC(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

// Review ratings (1–5 ints) trend with the assessment fit band, cycled across
// an employee's reviews. This is what makes the demo analytics tell the story.
const BAND_RATINGS: Record<string, number[]> = {
  "Strong fit": [5, 4, 5, 4],
  Consider: [4, 3, 4],
  Caution: [3, 2, 3],
  "Not recommended": [2, 1, 2],
  Incomplete: [3, 3],
};
const BAND_RANK: Record<string, number> = {
  "Strong fit": 0,
  Consider: 1,
  Caution: 2,
  "Not recommended": 3,
  Incomplete: 4,
};

const WAGE_BY_ROLE: Record<string, number> = {
  "Team Member": 16,
  "Shift Lead": 18.5,
  "Assistant Manager": 21,
  Manager: 25,
};

// Per-dimension on-job ratings trend with the assessment band on that dimension,
// so the "assessment accuracy by dimension" view shows a real relationship.
const DIM_BAND_RATINGS: Record<string, number[]> = {
  High: [5, 4, 5],
  Mid: [4, 3, 3],
  Low: [2, 2, 3],
};

/**
 * Seed a believable single-store employee roster from the demo's hires, with
 * backdated reviews whose ratings trend with each person's assessment fit, a
 * couple of promotions, and one departure — so the Employees module and its
 * "does the assessment predict performance?" analytics are populated and
 * compelling. Illustrative demo data, demo org only.
 */
async function seedDemoEmployees(orgId: string, ladder: string[]): Promise<void> {
  const supa = adminClient();
  const roles = ladder.length
    ? ladder
    : ["Team Member", "Shift Lead", "Assistant Manager", "Manager"];
  const [fit, catBands] = await Promise.all([
    fitByApplication(orgId),
    categoryBandsByApplication(orgId),
  ]);

  const { data: appRows } = await supa
    .from("applications")
    .select("id, positions, decision, first_name, last_name")
    .eq("org_id", orgId);
  const apps = (
    (appRows as
      | {
          id: string;
          positions: string[] | null;
          decision: string | null;
          first_name: string;
          last_name: string;
        }[]
      | null) ?? []
  ).map((a) => ({ ...a, band: fit.get(a.id) ?? "Incomplete" }));

  // Roster: everyone already hired, then fill with a SPREAD across fit bands (not
  // just best-fit) up to a believable headcount — so the Employees module and the
  // "does the assessment predict performance?" analytics show the full spectrum
  // (including a Caution/Not-recommended hire who then underperforms/departs).
  const TARGET = 10;
  const roster: typeof apps = [];
  const chosen = new Set<string>();
  for (const a of apps)
    if (a.decision === "hired") {
      roster.push(a);
      chosen.add(a.id);
    }
  const rest = apps.filter((a) => !chosen.has(a.id) && a.band !== "Incomplete");
  for (const a of sampleAcrossBands(rest, (x) => x.band, TARGET)) {
    if (roster.length >= TARGET) break;
    roster.push(a);
    chosen.add(a.id);
  }
  // Present the roster best-fit first for a tidy list.
  roster.sort((x, y) => (BAND_RANK[x.band] ?? 5) - (BAND_RANK[y.band] ?? 5));

  let idx = 0;
  for (const a of roster) {
    const band = a.band;
    const tenureMonths = 2 + (idx % 8); // 2..9 months — spans onboarding + tenured
    const hiredAt = daysAgoUTC(tenureMonths * 30);
    const startRole = a.positions?.[0] ?? roles[0];
    const roleIdx = roles.indexOf(startRole);
    const promote =
      band === "Strong fit" && tenureMonths >= 5 && roleIdx >= 0 && roleIdx < roles.length - 1;
    const currentRole = promote ? roles[roleIdx + 1] : startRole;
    const terminate = band === "Not recommended" && idx % 2 === 1;

    // Mark hired for coherence (candidate list ↔ roster).
    if (a.decision !== "hired") {
      await supa
        .from("applications")
        .update({
          decision: "hired",
          decision_at: hiredAt.toISOString(),
          status: "decision_made",
        } as never)
        .eq("id", a.id)
        .eq("org_id", orgId);
    }

    const reviewCount = Math.min(3, tenureMonths); // monthly reviews, up to 3
    const reviewDates: Date[] = [];
    for (let k = 1; k <= reviewCount; k++) reviewDates.push(daysAgoUTC((tenureMonths - k) * 30));
    const lastReview = reviewDates[reviewDates.length - 1] ?? hiredAt;

    const { data: empRow } = await supa
      .from("employees")
      .insert({
        org_id: orgId,
        location_id: null,
        application_id: a.id,
        first_name: a.first_name,
        last_name: a.last_name,
        current_role_name: currentRole,
        employment_status: terminate ? "terminated" : "employed",
        hired_at: hiredAt.toISOString().slice(0, 10),
        terminated_at: terminate ? daysAgoUTC(10).toISOString().slice(0, 10) : null,
        termination_reason: terminate ? "Attendance" : null,
        next_review_due: terminate ? null : nextReviewDue(lastReview, hiredAt),
        hourly_wage: WAGE_BY_ROLE[currentRole] ?? 16,
      } as never)
      .select("id")
      .single();
    const empId = (empRow as { id: string } | null)?.id;
    if (!empId) {
      idx++;
      continue;
    }

    // Reviews (backdated): overall trends with fit band; each category rating
    // trends with that candidate's assessment band on that dimension.
    const ratings = BAND_RATINGS[band] ?? BAND_RATINGS.Incomplete;
    const bands = catBands.get(a.id); // academic → High/Mid/Low
    const reviews = reviewDates.map((d, k) => {
      const catCols: Record<string, number | null> = {};
      for (const c of REVIEW_CATEGORIES) {
        const dimBand = bands?.get(c.academic);
        const scale = dimBand ? DIM_BAND_RATINGS[dimBand] : null;
        catCols[c.column] = scale ? scale[k % scale.length] : null;
      }
      return {
        employee_id: empId,
        org_id: orgId,
        reviewed_at: d.toISOString(),
        role_at_review: startRole,
        rating: ratings[k % ratings.length],
        ...catCols,
        still_employed: true,
        notes: null,
      };
    });
    if (reviews.length) await supa.from("employee_reviews").insert(reviews as never);

    // Role history: initial role, plus a promotion if earned.
    const roleChanges: Record<string, unknown>[] = [
      {
        employee_id: empId,
        org_id: orgId,
        from_role: null,
        to_role: startRole,
        changed_at: hiredAt.toISOString(),
      },
    ];
    if (promote) {
      roleChanges.push({
        employee_id: empId,
        org_id: orgId,
        from_role: startRole,
        to_role: currentRole,
        changed_at: daysAgoUTC(Math.max(15, (tenureMonths - 3) * 30)).toISOString(),
      });
    }
    await supa.from("employee_role_changes").insert(roleChanges as never);

    idx++;
  }
}

// Shift patterns for the demo week (openers → closers).
const SHIFT_PATTERNS = [
  { start: "10:00:00", end: "18:00:00" },
  { start: "11:00:00", end: "19:00:00" },
  { start: "15:00:00", end: "23:00:00" },
  { start: "17:00:00", end: "23:00:00" },
];

/** Seed a published current-week schedule so the demo Schedule tab is populated. */
async function seedDemoScheduleWeek(orgId: string, locationId: string | null): Promise<void> {
  if (!locationId) return;
  const supa = adminClient();
  const { data: empRows } = await supa
    .from("employees")
    .select("id, current_role_name")
    .eq("org_id", orgId)
    .eq("employment_status", "employed");
  const emps = (empRows as { id: string; current_role_name: string | null }[] | null) ?? [];
  if (emps.length === 0) return;

  const dates = weekDates(new Date().toISOString().slice(0, 10));
  const now = new Date().toISOString();
  const rows: Record<string, unknown>[] = [];
  let i = 0;
  for (const d of dates) {
    const nShifts = 3 + (i % 2); // 3–4 shifts/day
    for (let k = 0; k < nShifts; k++) {
      const emp = emps[(i * 3 + k) % emps.length];
      const p = SHIFT_PATTERNS[(i + k) % SHIFT_PATTERNS.length];
      rows.push({
        org_id: orgId,
        location_id: locationId,
        employee_id: emp.id,
        role: emp.current_role_name,
        shift_date: d,
        start_time: p.start,
        end_time: p.end,
        status: "published",
        published_at: now,
      });
    }
    if (i === 2 || i === 5) {
      rows.push({
        org_id: orgId,
        location_id: locationId,
        employee_id: null, // an open shift
        role: "Team Member",
        shift_date: d,
        start_time: "18:00:00",
        end_time: "22:00:00",
        status: "published",
        published_at: now,
      });
    }
    i++;
  }
  await supa.from("shifts").insert(rows as never);

  // A few block-off (unavailability) examples so the availability feature shows.
  const blocks: Record<string, unknown>[] = [];
  if (emps[0]) blocks.push({ org_id: orgId, employee_id: emps[0].id, day_of_week: 1, all_day: true, note: "Class" });
  if (emps[1]) blocks.push({ org_id: orgId, employee_id: emps[1].id, day_of_week: 3, all_day: false, start_time: "09:00:00", end_time: "15:00:00", note: "Second job" });
  if (emps[3]) blocks.push({ org_id: orgId, employee_id: emps[3].id, day_of_week: 0, all_day: true, note: "Family day" });
  if (blocks.length) await supa.from("employee_unavailability").insert(blocks as never);

  // Time-off: one approved (shows on the schedule) + one pending (the queue).
  const timeOff: Record<string, unknown>[] = [];
  if (emps[4]) timeOff.push({ org_id: orgId, employee_id: emps[4].id, start_date: dates[4], end_date: dates[4], all_day: true, reason: "Wedding", status: "approved", reviewed_at: now });
  if (emps[5]) timeOff.push({ org_id: orgId, employee_id: emps[5].id, start_date: addDays(dates[6], 3), end_date: addDays(dates[6], 5), all_day: true, reason: "Vacation", status: "pending" });
  if (timeOff.length) await supa.from("time_off_requests").insert(timeOff as never);

  // A pending claim (on an open shift) + a drop (on an assigned shift).
  const [{ data: openShift }, { data: assignedShift }] = await Promise.all([
    supa.from("shifts").select("id").eq("org_id", orgId).is("employee_id", null).limit(1).maybeSingle(),
    supa.from("shifts").select("id, employee_id").eq("org_id", orgId).not("employee_id", "is", null).limit(1).maybeSingle(),
  ]);
  const reqs: Record<string, unknown>[] = [];
  const os = openShift as { id: string } | null;
  const as = assignedShift as { id: string; employee_id: string } | null;
  if (os && emps[6]) reqs.push({ org_id: orgId, shift_id: os.id, employee_id: emps[6].id, kind: "claim" });
  if (as) reqs.push({ org_id: orgId, shift_id: as.id, employee_id: as.employee_id, kind: "drop" });
  if (reqs.length) await supa.from("shift_requests").insert(reqs as never);

  // Two-party swaps: one proposed (waiting on coworker), one accepted (waiting on manager).
  // Pick assigned upcoming shifts from four distinct employees so no shift is reused.
  const today = new Date().toISOString().slice(0, 10);
  const { data: assignedRows } = await supa
    .from("shifts")
    .select("id, employee_id, shift_date")
    .eq("org_id", orgId)
    .not("employee_id", "is", null)
    .gte("shift_date", today)
    .order("shift_date", { ascending: true });
  const seen = new Set<string>();
  const oneEach: { id: string; employee_id: string }[] = [];
  for (const s of (assignedRows as { id: string; employee_id: string }[] | null) ?? []) {
    if (seen.has(s.employee_id)) continue;
    seen.add(s.employee_id);
    oneEach.push({ id: s.id, employee_id: s.employee_id });
    if (oneEach.length === 4) break;
  }
  const swaps: Record<string, unknown>[] = [];
  if (oneEach.length >= 2) {
    swaps.push({
      org_id: orgId,
      from_employee_id: oneEach[0].employee_id,
      from_shift_id: oneEach[0].id,
      to_employee_id: oneEach[1].employee_id,
      to_shift_id: oneEach[1].id,
      status: "proposed",
    });
  }
  if (oneEach.length >= 4) {
    swaps.push({
      org_id: orgId,
      from_employee_id: oneEach[2].employee_id,
      from_shift_id: oneEach[2].id,
      to_employee_id: oneEach[3].employee_id,
      to_shift_id: oneEach[3].id,
      status: "accepted",
    });
  }
  if (swaps.length) await supa.from("shift_swaps").insert(swaps as never);
}
