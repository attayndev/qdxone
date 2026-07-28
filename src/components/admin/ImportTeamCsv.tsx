"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { parseTeamCsv, type ParsedTeamCsv } from "@/lib/team-csv";
import { importTeamCsv } from "@/app/admin/employees/actions";

export default function ImportTeamCsv() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [csv, setCsv] = useState<string>("");
  const [parsed, setParsed] = useState<ParsedTeamCsv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsv(text);
      setParsed(parseTeamCsv(text));
    };
    reader.readAsText(file);
    e.target.value = ""; // allow re-selecting the same file
  }

  function confirmImport() {
    setError(null);
    const fd = new FormData();
    fd.set("csv", csv);
    start(async () => {
      const res = await importTeamCsv(fd);
      if (res.ok) {
        setResult(`Imported ${res.created} employee${res.created === 1 ? "" : "s"}${res.skipped ? `, skipped ${res.skipped}` : ""}.`);
        setParsed(null);
        setCsv("");
        router.refresh();
      } else setError(res.error);
    });
  }

  function close() {
    setParsed(null);
    setCsv("");
    setError(null);
  }

  return (
    <div className="text-right">
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
      <button type="button" className="btn-ghost whitespace-nowrap" onClick={() => fileRef.current?.click()}>
        Import team (CSV)
      </button>
      {result && <div className="text-sm text-emerald-700 mt-1">{result}</div>}

      {parsed && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={close}>
          <div className="card w-full max-w-2xl max-h-[85vh] overflow-auto text-left" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-extrabold text-lg">Import team</h2>
            {parsed.headerError ? (
              <p className="text-sm text-rose-600 mt-2">{parsed.headerError}</p>
            ) : (
              <>
                <p className="text-sm text-[color:var(--brand-ink-muted)] mt-1">
                  {parsed.okCount} to import{parsed.skipCount ? ` · ${parsed.skipCount} will be skipped` : ""}.
                  Columns: name, email (required), phone, role (optional).
                </p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-[color:var(--brand-ink-muted)]">
                        <th className="py-1 pr-3">Name</th>
                        <th className="py-1 pr-3">Email</th>
                        <th className="py-1 pr-3">Phone</th>
                        <th className="py-1 pr-3">Role</th>
                        <th className="py-1">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.map((r) => (
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
            )}
            {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
            <div className="flex items-center gap-2 mt-4">
              {!parsed.headerError && (
                <button className="btn-primary" onClick={confirmImport} disabled={pending || parsed.okCount === 0}>
                  {pending ? "Importing…" : `Import ${parsed.okCount}`}
                </button>
              )}
              <button className="btn-ghost" onClick={close}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
