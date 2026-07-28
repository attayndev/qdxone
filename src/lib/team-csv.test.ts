import { describe, it, expect } from "vitest";
import { parseCsv, parseTeamCsv } from "./team-csv";

describe("parseCsv", () => {
  it("handles quoted fields with commas and escaped quotes", () => {
    const g = parseCsv('a,b\n"x,y","he said ""hi"""\n');
    expect(g).toEqual([["a", "b"], ["x,y", 'he said "hi"']]);
  });
  it("handles CRLF and a final line without newline", () => {
    expect(parseCsv("a,b\r\n1,2")).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("parseTeamCsv", () => {
  it("maps varied headers, splits a single name column, validates", () => {
    const csv = [
      "Full Name,Email Address,Phone,Position",
      "Maya Rivera,maya@x.com,555-1000,Shift Lead",
      "Cody,cody@x.com,,",
      "No Email,,555,",
      "Bad Email,notanemail,555,",
    ].join("\n");
    const res = parseTeamCsv(csv);
    expect(res.headerError).toBeUndefined();
    expect(res.rows).toHaveLength(4);
    expect(res.rows[0]).toMatchObject({ first_name: "Maya", last_name: "Rivera", email: "maya@x.com", role: "Shift Lead", ok: true });
    expect(res.rows[1]).toMatchObject({ first_name: "Cody", last_name: "", ok: true }); // single-word name is fine
    expect(res.rows[2]).toMatchObject({ ok: false, reason: "Missing or invalid email" });
    expect(res.rows[3]).toMatchObject({ ok: false, reason: "Missing or invalid email" });
    expect(res.okCount).toBe(2);
    expect(res.skipCount).toBe(2);
  });

  it("uses first/last columns and flags roster duplicates (case-insensitive)", () => {
    const csv = "first name,last name,email\nAsha,Bello,ASHA@x.com\n";
    const res = parseTeamCsv(csv, new Set(["asha@x.com"]));
    expect(res.rows[0]).toMatchObject({ first_name: "Asha", last_name: "Bello", email: "asha@x.com", ok: false, reason: "Already on roster" });
  });

  it("errors when there's no email or no name column", () => {
    expect(parseTeamCsv("name,phone\nA,5").headerError).toMatch(/email/i);
    expect(parseTeamCsv("email,phone\na@x.com,5").headerError).toMatch(/name/i);
  });
});
