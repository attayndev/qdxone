import {
  scoreAssessment,
  screenerProfile,
  type ScoredItem,
} from "../src/lib/assessment/scoring.ts";

let fails = 0;
const check = (name: string, ok: boolean, got = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${got ? "  → " + got : ""}`);
  if (!ok) fails++;
};

// Build 3 items for a category at a given raw value (positive-keyed).
const cat = (category: string, value: number): ScoredItem[] =>
  Array.from({ length: 3 }, () => ({
    value,
    facet: `${category}-f`,
    category,
    keying: "positive" as const,
  }));

const run = (v: Record<string, number>) =>
  scoreAssessment(
    Object.entries(v).flatMap(([c, val]) => cat(c, val))
  );

const C = "Conscientiousness", A = "Agreeableness", S = "Self-Direction", E = "Emotional Stability";

check("all high → Strong fit", run({ [C]: 5, [A]: 5, [S]: 5, [E]: 5 }).overall === "Strong fit");
check("3 high + 1 mid, ownership high → Strong fit", run({ [C]: 5, [A]: 5, [S]: 5, [E]: 3 }).overall === "Strong fit");
check("3 high + ownership mid → Strong fit", run({ [C]: 5, [A]: 5, [E]: 5, [S]: 3 }).overall === "Strong fit");
check("2 high, 2 mid → Consider", run({ [C]: 5, [A]: 5, [S]: 3, [E]: 3 }).overall === "Consider");
check("2 high, 1 low → Consider", run({ [C]: 5, [A]: 5, [S]: 3, [E]: 2 }).overall === "Consider");
check("1 high, 1 low → Caution", run({ [C]: 5, [A]: 3, [S]: 3, [E]: 2 }).overall === "Caution");
check("2 low → Not recommended", run({ [C]: 5, [A]: 5, [S]: 2, [E]: 2 }).overall === "Not recommended");
check("all low → Not recommended", run({ [C]: 2, [A]: 2, [S]: 2, [E]: 2 }).overall === "Not recommended");
check("<4 categories → Incomplete", run({ [C]: 5, [A]: 5 }).overall === "Incomplete");

// Reverse keying: a reverse item answered 5 → scored 1 (Low).
const rev = scoreAssessment([
  { value: 5, facet: "f", category: C, keying: "reverse" },
  { value: 5, facet: "f", category: C, keying: "reverse" },
]);
check("reverse-keyed 5 → Low band", rev.categories[0].band === "Low", rev.categories[0].mean.toFixed(1));

// Bands
const strong = run({ [C]: 5, [A]: 5, [S]: 5, [E]: 5 });
check("stars for Strong = 5", strong.stars === 5);
check("attitude null when no attitude facets", strong.attitude === null);

// Attitude composite
const att = scoreAssessment([
  { value: 5, facet: "Coachability", category: A, keying: "positive" },
  { value: 5, facet: "Customer Warmth", category: A, keying: "positive" },
  { value: 1, facet: "Team Cooperation", category: A, keying: "positive" },
]);
check("attitude composite computed", att.attitude !== null && Math.abs(att.attitude.mean - 11 / 3) < 0.01, att.attitude?.mean.toFixed(2));

// Screener
check("MOT-04=1 → zero missed (positive)", screenerProfile({ "MOT-04": 1 }).some((f) => f.tone === "positive"));
check("MOT-01=2 never flagged", screenerProfile({ "MOT-01": 2 }).length === 0);
check("MOT-04=4 → concern", screenerProfile({ "MOT-04": 4 }).some((f) => f.tone === "concern"));

console.log(fails === 0 ? "\nALL PASSED" : `\n${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
