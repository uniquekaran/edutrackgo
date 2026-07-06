import { supabase } from "@/integrations/supabase/client";
import { COLLEGES } from "@/lib/colleges";

export interface CollegeRow {
  id?: string;
  name: string;
  state?: string | null;
  city?: string | null;
  type?: string | null;
}

/**
 * Search colleges from the `colleges` DB. Falls back to the bundled static list
 * when the DB is empty (fresh projects) or unreachable.
 */
export async function searchColleges(query: string, limit = 30): Promise<string[]> {
  const q = query.trim();
  try {
    let req = supabase.from("colleges").select("name").order("name").limit(limit);
    if (q) req = req.ilike("name", `%${q}%`);
    const { data, error } = await req;
    if (error) throw error;
    if (data && data.length > 0) return data.map((r) => r.name as string);
  } catch (e) {
    console.warn("searchColleges: DB fallback to static list", e);
  }
  const needle = q.toLowerCase();
  return (needle ? COLLEGES.filter((c) => c.toLowerCase().includes(needle)) : COLLEGES).slice(0, limit);
}

/**
 * Bulk-import parsed CSV rows into `colleges`. Uses upsert on lower(name) via the
 * unique index. Returns how many rows were sent.
 */
export async function bulkImportColleges(rows: CollegeRow[]) {
  if (rows.length === 0) return { inserted: 0 };
  const cleaned = rows
    .map((r) => ({
      name: r.name?.trim(),
      state: r.state?.trim() || null,
      city: r.city?.trim() || null,
      type: r.type?.trim() || null,
    }))
    .filter((r) => r.name && r.name.length > 1);
  // Chunk to keep payloads reasonable
  const chunkSize = 500;
  let inserted = 0;
  for (let i = 0; i < cleaned.length; i += chunkSize) {
    const chunk = cleaned.slice(i, i + chunkSize);
    const { error } = await supabase.from("colleges").upsert(chunk, { onConflict: "name", ignoreDuplicates: true });
    if (error) throw error;
    inserted += chunk.length;
  }
  return { inserted };
}

/**
 * Very small CSV parser: supports quoted fields, comma delimiter, header row.
 * Header column names are normalised (lowercased, trimmed). Recognised: name, state, city, type.
 */
export function parseCollegesCSV(text: string): CollegeRow[] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
        cur = []; field = "";
        if (c === "\r" && text[i + 1] === "\n") i++;
      } else field += c;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const nameIdx = header.indexOf("name") === -1 ? 0 : header.indexOf("name");
  const stateIdx = header.indexOf("state");
  const cityIdx = header.indexOf("city");
  const typeIdx = header.indexOf("type");
  return rows.slice(1)
    .filter((r) => r.some((v) => v && v.trim()))
    .map((r) => ({
      name: r[nameIdx] ?? "",
      state: stateIdx >= 0 ? r[stateIdx] : null,
      city: cityIdx >= 0 ? r[cityIdx] : null,
      type: typeIdx >= 0 ? r[typeIdx] : null,
    }));
}

export async function countColleges(): Promise<number> {
  try {
    const { count, error } = await supabase.from("colleges").select("*", { count: "exact", head: true });
    if (error) throw error;
    return count ?? 0;
  } catch { return 0; }
}
