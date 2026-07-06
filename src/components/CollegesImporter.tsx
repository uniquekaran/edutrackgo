import { useEffect, useRef, useState } from "react";
import { Upload, FileText, Loader2, CheckCircle2, Database, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { bulkImportColleges, countColleges, parseCollegesCSV } from "@/lib/colleges-db";

export function CollegesImporter() {
  const [count, setCount] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ name: string; state?: string | null; city?: string | null }[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function refresh() { setCount(await countColleges()); }
  useEffect(() => { void refresh(); }, []);

  async function onPick(f: File | null) {
    setErr(null);
    setPreview([]);
    setFile(f);
    if (!f) return;
    if (!/\.csv$/i.test(f.name)) { setErr("Please choose a .csv file."); return; }
    const text = await f.text();
    const rows = parseCollegesCSV(text);
    if (rows.length === 0) { setErr("The CSV had no data rows. Expected a header with at least a `name` column."); return; }
    setPreview(rows.slice(0, 5));
    toast.info(`Parsed ${rows.length} rows from ${f.name}`);
  }

  async function importNow() {
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const text = await file.text();
      const rows = parseCollegesCSV(text);
      const { inserted } = await bulkImportColleges(rows);
      toast.success(`Imported ${inserted} colleges`);
      setFile(null);
      setPreview([]);
      if (inputRef.current) inputRef.current.value = "";
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import failed";
      setErr(msg);
      toast.error(msg);
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 grid place-items-center shadow-lg">
            <Database className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black">Global Colleges Directory</h2>
            <p className="text-xs text-white/60 mt-0.5">
              {count === null ? "Loading…" : `${count.toLocaleString("en-IN")} institutions in database`}
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> Live to students
          </span>
        </div>

        <div className="mt-5 rounded-xl border border-dashed border-white/15 bg-black/20 p-5 text-center">
          <FileText className="w-8 h-8 mx-auto text-white/50" />
          <p className="mt-2 text-sm font-semibold">Upload CSV of Indian colleges</p>
          <p className="text-[11px] text-white/50 mt-1">
            Columns: <code>name</code> (required), <code>state</code>, <code>city</code>, <code>type</code>. First row = header.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            id="colleges-csv"
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
          <label
            htmlFor="colleges-csv"
            className="inline-flex mt-4 items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-white/10 border border-white/15 hover:bg-white/15 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> Choose CSV
          </label>
          {file && <p className="mt-2 text-[11px] text-white/70">{file.name}</p>}
        </div>

        {err && (
          <div className="mt-3 flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="whitespace-pre-wrap">{err}</p>
          </div>
        )}

        {preview.length > 0 && (
          <div className="mt-4">
            <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2">Preview · first 5 rows</p>
            <div className="rounded-xl border border-white/10 overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr className="text-left text-[10px] uppercase text-white/50">
                    <th className="px-3 py-2 font-semibold">Name</th>
                    <th className="px-3 py-2 font-semibold hidden sm:table-cell">State</th>
                    <th className="px-3 py-2 font-semibold hidden md:table-cell">City</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {preview.map((r, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2 hidden sm:table-cell text-white/60">{r.state ?? "—"}</td>
                      <td className="px-3 py-2 hidden md:table-cell text-white/60">{r.city ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          onClick={importNow}
          disabled={!file || busy}
          className="w-full mt-4 h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : <><Upload className="w-4 h-4" /> Import to database</>}
        </button>
        <p className="mt-2 text-[10.5px] text-white/50 text-center">
          Duplicates (same name, case-insensitive) are skipped automatically.
        </p>
      </div>
    </div>
  );
}
