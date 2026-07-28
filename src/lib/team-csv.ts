/**
 * Pure CSV parsing for the "import existing team" upload — no server/DOM deps so
 * the preview (client) and the create action (server) share one parser, and it's
 * unit-tested. Supports an explicit column→field mapping and a "first row is
 * headings" toggle; falls back to auto-mapping the header row.
 */

export interface ParsedTeamRow {
  rowNum: number; // 1-based data row (excludes header)
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  ok: boolean;
  reason?: string; // why it will be skipped
}

export interface ParsedTeamCsv {
  rows: ParsedTeamRow[];
  headerError?: string;
  okCount: number;
  skipCount: number;
}

/** Column index per field; -1 = not mapped. */
export interface FieldMapping {
  first_name: number;
  last_name: number;
  email: number;
  phone: number;
  role: number;
}

export const MAPPING_FIELDS: Array<{ key: keyof FieldMapping; label: string; required: boolean }> = [
  { key: "first_name", label: "First name", required: true },
  { key: "last_name", label: "Last name", required: false },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "role", label: "Role", required: false },
];

/** RFC-ish CSV → rows of cells. Handles quoted fields, embedded commas, "" escapes, CRLF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const t = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (inQuotes) {
      if (c === '"') {
        if (t[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function splitName(full: string): [string, string] {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return [parts[0] ?? "", ""];
  return [parts[0], parts.slice(1).join(" ")];
}

const HEADER_ALIASES: Record<string, string[]> = {
  first_name: ["firstname", "first", "fname", "givenname"],
  last_name: ["lastname", "last", "lname", "surname", "familyname"],
  name: ["name", "fullname", "employeename", "employee"],
  email: ["email", "emailaddress", "emailid", "mail", "workemail"],
  phone: ["phone", "phonenumber", "mobile", "cell", "tel", "telephone", "cellphone", "mobilenumber"],
  role: ["role", "position", "title", "jobtitle", "job"],
};

/** Split a parsed grid into column labels + data rows, honoring the header toggle. */
export function csvColumns(text: string, hasHeader: boolean): { columns: string[]; dataRows: string[][] } {
  const grid = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (grid.length === 0) return { columns: [], dataRows: [] };
  if (hasHeader) return { columns: grid[0], dataRows: grid.slice(1) };
  const width = Math.max(...grid.map((r) => r.length));
  const columns = Array.from({ length: width }, (_, i) => `Column ${i + 1}`);
  return { columns, dataRows: grid };
}

/** Best-guess mapping from column labels (used to pre-fill the interstitial). */
export function autoMap(columns: string[]): FieldMapping {
  const idx: Record<string, number> = {};
  columns.forEach((h, i) => {
    const n = norm(h);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (idx[field] === undefined && aliases.includes(n)) idx[field] = i;
    }
  });
  return {
    first_name: idx.first_name ?? idx.name ?? -1, // a single "name" column maps here (auto-split)
    last_name: idx.last_name ?? -1,
    email: idx.email ?? -1,
    phone: idx.phone ?? -1,
    role: idx.role ?? -1,
  };
}

/** Build validated rows from data rows + an explicit mapping. */
export function buildRows(
  dataRows: string[][],
  mapping: FieldMapping,
  existingEmails?: Set<string>
): ParsedTeamCsv {
  if (mapping.first_name < 0) return { rows: [], headerError: "Map a name column.", okCount: 0, skipCount: 0 };
  if (mapping.email < 0) return { rows: [], headerError: "Map an email column — it's required to send the assessment.", okCount: 0, skipCount: 0 };

  const cell = (r: string[], i: number) => (i < 0 ? "" : (r[i] ?? "").trim());
  const rows: ParsedTeamRow[] = dataRows.map((r, i) => {
    let first = cell(r, mapping.first_name);
    let last = cell(r, mapping.last_name);
    if (mapping.last_name < 0 && first) [first, last] = splitName(first); // single name column
    const email = cell(r, mapping.email).toLowerCase();
    const phone = cell(r, mapping.phone);
    const role = cell(r, mapping.role);

    let ok = true;
    let reason: string | undefined;
    if (!first && !last) { ok = false; reason = "Missing name"; }
    else if (!email || !emailValid(email)) { ok = false; reason = "Missing or invalid email"; }
    else if (existingEmails?.has(email)) { ok = false; reason = "Already on roster"; }

    return { rowNum: i + 1, first_name: first, last_name: last, email, phone, role, ok, reason };
  });
  return {
    rows,
    okCount: rows.filter((r) => r.ok).length,
    skipCount: rows.filter((r) => !r.ok).length,
  };
}

/** Convenience: parse with the header row auto-mapped (server default / simple path). */
export function parseTeamCsv(text: string, existingEmails?: Set<string>): ParsedTeamCsv {
  const { columns, dataRows } = csvColumns(text, true);
  if (columns.length === 0) return { rows: [], headerError: "The file is empty.", okCount: 0, skipCount: 0 };
  return buildRows(dataRows, autoMap(columns), existingEmails);
}
