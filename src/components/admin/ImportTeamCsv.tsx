"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  csvColumns,
  autoMap,
  buildRows,
  MAPPING_FIELDS,
  type FieldMapping,
} from "@/lib/team-csv";
import { importTeamCsv } from "@/app/admin/employees/actions";

export default function ImportTeamCsv() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [csv, setCsv] = useState<string | null>(null);
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState<FieldMapping | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // Columns + data rows recompute when the header toggle flips.
  const { columns, dataRows } = useMemo(
    () => (csv ? csvColumns(csv, hasHeader) : { columns: [], dataRows: [] }),
    [csv, hasHeader]
  );
  const preview = useMemo(
    () => (mapping ? buildRows(dataRows, mapping) : null),
    [dataRows, mapping]
  );

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsv(text);
      setHasHeader(true);
      setMapping(autoMap(csvColumns(text, true).columns));
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function toggleHeader(next: boolean) {
    setHasHeader(next);
    if (csv) setMapping(autoMap(csvColumns(csv, next).columns)); // re-guess for the new columns
  }

  function setField(key: keyof FieldMapping, idx: number) {
    setMapping((m) => (m ? { ...m, [key]: idx } : m));
  }

  function confirmImport() {
    if (!csv || !mapping) return;
    setError(null);
    const fd = new FormData();
    fd.set("csv", csv);
    fd.set("has_header", String(hasHeader));
    fd.set("mapping", JSON.stringify(mapping));
    start(async () => {
      const res = await importTeamCsv(fd);
      if (res.ok) {
        setResult(`Imported ${res.created} employee${res.created === 1 ? "" : "s"}${res.skipped ? `, skipped ${res.skipped}` : ""}.`);
        close();
        router.refresh();
      } else setError(res.error);
    });
  }

  function close() {
    setCsv(null);
    setMapping(null);
    setError(null);
  }

  return (
    <div className="text-right">
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
      <button type="button" className="btn-ghost whitespace-nowrap" onClick={() => fileRef.current?.click()}>
        Import team (CSV)
      </button>
      {result && <div className="text-sm text-emerald-700 mt-1">{result}</div>}

      {csv && mapping && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={close}>
          <div className="card w-full max-w-2xl max-h-[88vh] overflow-auto text-left" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-extrabold text-lg">Import team</h2>
            <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
              Match your spreadsheet&apos;s columns to the right fields, then review.
            </p>

            <label className="flex items-center gap-2 mt-3 text-sm">
              <input type="checkbox" checked={hasHeader} onChange={(e) => toggleHeader(e.target.checked)} />
              First row is column headings
            </label>

            {/* Column → field mapping */}
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              {MAPPING_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="label">
                    {f.label}
                    {f.required && <span className="text-rose-500"> *</span>}
                  </label>
                  <select
                    className="input"
                    value={mapping[f.key]}
                    onChange={(e) => setField(f.key, Number(e.target.value))}
                  >
                    <option value={-1}>— none —</option>
                    {columns.map((c, i) => (
                      <option key={i} value={i}>{c || `Column ${i + 1}`}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview */}
            {preview?.headerError ? (
              <p className="text-sm text-rose-600 mt-3">{preview.headerError}</p>
            ) : preview ? (
              <>
                <div className="text-sm text-[color:var(--brand-ink-muted)] mt-4">
                  {preview.okCount} to import{preview.skipCount ? ` · ${preview.skipCount} will be skipped` : ""}.
                </div>
                <div className="mt-2 overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-[color:var(--brand-surface)]">
                      <tr className="text-left text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
                        <th className="py-1 pr-3">Name</th>
                        <th className="py-1 pr-3">Email</th>
                        <th className="py-1 pr-3">Phone</th>
                        <th className="py-1 pr-3">Role</th>
                        <th className="py-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((r) => (
                        <tr key={r.rowNum} className="border-t border-[color:var(--brand-line)]">
                          <td className="py-1 pr-3">{`${r.first_name} ${r.last_name}`.trim() || "—"}</td>
                          <td className="py-1 pr-3">{r.email || "—"}</td>
                          <td className="py-1 pr-3">{r.phone || "—"}</td>
                          <td className="py-1 pr-3">{r.role || "—"}</td>
                          <td className="py-1">
                            {r.ok ? (
                              <span className="chip bg-emerald-100 text-emerald-800">Import</span>
                            ) : (
                              <span className="chip bg-gray-200 text-gray-600">Skip · {r.reason}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
            <div className="flex items-center gap-2 mt-4">
              <button
                className="btn-primary"
                onClick={confirmImport}
                disabled={pending || !preview || !!preview.headerError || preview.okCount === 0}
              >
                {pending ? "Importing…" : `Import ${preview?.okCount ?? 0}`}
              </button>
              <button className="btn-ghost" onClick={close}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
