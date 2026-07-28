/**
 * Pure CSV parsing for the "import existing team" upload — no server/DOM deps so
 * the preview (client) and the create action (server) share one parser, and it's
 * unit-tested. Maps a header row to first/last/email/phone/role, validates each
 * row, and flags rows to skip (missing name/email, bad email, already on roster).
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

const HEADER_ALIASES: Record<string, string[]> = {
  first_name: ["firstname", "first", "fname", "givenname"],
  last_name: ["lastname", "last", "lname", "surname", "familyname"],
  name: ["name", "fullname", "employeename", "employee"],
  email: ["email", "emailaddress", "emailid", "mail", "workemail"],
  phone: ["phone", "phonenumber", "mobile", "cell", "tel", "telephone", "cellphone", "mobilenumber"],
  role: ["role", "position", "title", "jobtitle", "job"],
};

function mapHeaders(headers: string[]): Record<string, number> {
  const idx: Record<string, number> = {};
  headers.forEach((h, i) => {
    const n = norm(h);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (idx[field] === undefined && aliases.includes(n)) idx[field] = i;
    }
  });
  return idx;
}

const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

function splitName(full: string): [string, string] {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return [parts[0] ?? "", ""];
  return [parts[0], parts.slice(1).join(" ")];
}

/**
 * Parse a team CSV. `existingEmails` (lowercased) marks rows already on the roster.
 */
export function parseTeamCsv(text: string, existingEmails?: Set<string>): ParsedTeamCsv {
  const grid = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (grid.length === 0) return { rows: [], headerError: "The file is empty.", okCount: 0, skipCount: 0 };

  const headers = grid[0];
  const col = mapHeaders(headers);
  if (col.email === undefined) {
    return { rows: [], headerError: "No email column found — an email is required to send the assessment.", okCount: 0, skipCount: 0 };
  }
  if (col.first_name === undefined && col.name === undefined) {
    return { rows: [], headerError: "No name column found (add a 'name', or 'first name' + 'last name').", okCount: 0, skipCount: 0 };
  }

  const cell = (r: string[], i: number | undefined) => (i === undefined ? "" : (r[i] ?? "").trim());
  const rows: ParsedTeamRow[] = [];
  for (let i = 1; i < grid.length; i++) {
    const r = grid[i];
    let first = cell(r, col.first_name);
    let last = cell(r, col.last_name);
    if (!first && col.name !== undefined) [first, last] = splitName(cell(r, col.name));
    const email = cell(r, col.email).toLowerCase();
    const phone = cell(r, col.phone);
    const role = cell(r, col.role);

    let ok = true;
    let reason: string | undefined;
    if (!first && !last) { ok = false; reason = "Missing name"; }
    else if (!email || !emailValid(email)) { ok = false; reason = "Missing or invalid email"; }
    else if (existingEmails?.has(email)) { ok = false; reason = "Already on roster"; }

    rows.push({ rowNum: i, first_name: first, last_name: last, email, phone, role, ok, reason });
  }

  return {
    rows,
    okCount: rows.filter((r) => r.ok).length,
    skipCount: rows.filter((r) => !r.ok).length,
  };
}
