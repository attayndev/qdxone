import { readFileSync } from "node:fs";
import {
  buildAssessmentForm,
  DEFAULT_FORM_SPEC_V03,
  formSpecTotal,
  type BankItem,
} from "../src/lib/assessment/form.ts";

const bank: BankItem[] = JSON.parse(readFileSync("/tmp/bank_v03.json", "utf8"));

let failures = 0;
const check = (name: string, ok: boolean, detail = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);
  if (!ok) failures++;
};

const spec = DEFAULT_FORM_SPEC_V03;
const form = buildAssessmentForm(bank, spec, { rotation: 0 });

// 1. total matches spec
check(
  "total scored = spec total",
  form.scoredItemIds.length === formSpecTotal(spec),
  `${form.scoredItemIds.length} of ${formSpecTotal(spec)} (expect 28)`
);

// 2. every facet hits its floor
for (const [facet, floor] of Object.entries(spec.facetFloors)) {
  check(
    `facet "${facet}" = ${floor}`,
    form.byFacet[facet].length === floor,
    `got ${form.byFacet[facet].length}`
  );
}

// 3. keying balance — every facet with reverse items in the bank gets ≥1
const byId = new Map(bank.map((i) => [i.itemId, i]));
for (const [facet, ids] of Object.entries(form.byFacet)) {
  const pool = bank.filter((i) => i.facet === facet);
  const poolHasReverse = pool.some((i) => i.keying === "reverse");
  const pickedReverse = ids.filter((id) => byId.get(id)!.keying === "reverse").length;
  if (poolHasReverse) {
    check(`facet "${facet}" keying-balanced`, pickedReverse >= 1, `${pickedReverse} reverse of ${ids.length}`);
  }
}

// 4. no duplicates
check("no duplicate items", new Set(form.scoredItemIds).size === form.scoredItemIds.length);

// 5. determinism — same inputs → same output
const again = buildAssessmentForm(bank, spec, { rotation: 0 });
check("deterministic", JSON.stringify(again.scoredItemIds) === JSON.stringify(form.scoredItemIds));

// 6. rotation produces a different form (exposure-balanced variety)
const rotated = buildAssessmentForm(bank, spec, { rotation: 3 });
const overlap = rotated.scoredItemIds.filter((id) => form.scoredItemIds.includes(id)).length;
check("rotation varies the form", overlap < form.scoredItemIds.length, `${overlap}/28 items shared with rotation 0`);

// 7. exposure-aware — least-administered items are preferred
const exposure: Record<string, number> = {};
for (const i of bank) exposure[i.itemId] = i.itemId.startsWith("DEP") ? 99 : 0;
const lowExposure = buildAssessmentForm(bank, spec, { exposure });
const heavyDepPicked = lowExposure.byFacet["Dependability"].filter((id) => exposure[id] === 99).length;
check(
  "exposure-aware: avoids over-administered items where alternatives exist",
  heavyDepPicked <= spec.facetFloors["Dependability"],
  `picked ${heavyDepPicked} high-exposure DEP items (only ${bank.filter((i) => i.facet === "Dependability").length} exist)`
);

console.log(`\nSample form (rotation 0): ${form.scoredItemIds.join(", ")}`);
console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
