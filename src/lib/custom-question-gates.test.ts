import { describe, it, expect } from "vitest";
import {
  evaluateCustomGates,
  fitCapFromGates,
  applyFitCap,
} from "./custom-question-gates";
import type { CustomQuestion } from "./supabase/types";

const legalAge: CustomQuestion = {
  id: "age18",
  label: "Are you 18 or older?",
  type: "yes_no",
  required: true,
  gate: "legal",
  expected: "yes",
};
const knockout: CustomQuestion = {
  id: "weekends",
  label: "Can you work weekends?",
  type: "yes_no",
  required: true,
  gate: "knockout",
  expected: "yes",
};
const flag: CustomQuestion = {
  id: "car",
  label: "Do you have a car?",
  type: "yes_no",
  required: false,
  gate: "flag",
  expected: "yes",
};
const ungated: CustomQuestion = {
  id: "note",
  label: "Anything else?",
  type: "short_text",
  required: false,
};

describe("evaluateCustomGates", () => {
  it("fails a present, mismatched answer (case-insensitive)", () => {
    const f = evaluateCustomGates([legalAge], [{ id: "age18", value: "No" }]);
    expect(f).toHaveLength(1);
    expect(f[0].gate).toBe("legal");
  });

  it("passes a matching answer", () => {
    expect(evaluateCustomGates([legalAge], [{ id: "age18", value: "yes" }])).toHaveLength(0);
  });

  it("does NOT fail a missing answer (role-scoped / never asked)", () => {
    expect(evaluateCustomGates([legalAge], [])).toHaveLength(0);
    expect(evaluateCustomGates([legalAge], [{ id: "age18", value: "" }])).toHaveLength(0);
  });

  it("ignores ungated questions", () => {
    expect(evaluateCustomGates([ungated], [{ id: "note", value: "whatever" }])).toHaveLength(0);
  });
});

describe("fitCapFromGates", () => {
  it("legal fail caps at Not recommended (worst wins)", () => {
    const f = evaluateCustomGates(
      [legalAge, knockout],
      [
        { id: "age18", value: "no" },
        { id: "weekends", value: "no" },
      ]
    );
    expect(fitCapFromGates(f)).toBe("Not recommended");
  });

  it("knockout fail caps at Caution", () => {
    const f = evaluateCustomGates([knockout], [{ id: "weekends", value: "no" }]);
    expect(fitCapFromGates(f)).toBe("Caution");
  });

  it("flag fail does not cap", () => {
    const f = evaluateCustomGates([flag], [{ id: "car", value: "no" }]);
    expect(fitCapFromGates(f)).toBeNull();
  });
});

describe("applyFitCap", () => {
  it("caps Strong fit down to the cap", () => {
    expect(applyFitCap("Strong fit", "Caution")).toBe("Caution");
    expect(applyFitCap("Strong fit", "Not recommended")).toBe("Not recommended");
  });
  it("never raises a fit already below the cap", () => {
    expect(applyFitCap("Not recommended", "Caution")).toBe("Not recommended");
  });
  it("leaves the fit unchanged when there is no cap", () => {
    expect(applyFitCap("Strong fit", null)).toBe("Strong fit");
  });
  it("leaves Incomplete alone", () => {
    expect(applyFitCap("Incomplete", "Not recommended")).toBe("Incomplete");
  });
});
