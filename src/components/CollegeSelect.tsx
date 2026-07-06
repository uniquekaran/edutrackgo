import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Check, ChevronDown, Loader2 } from "lucide-react";
import { COLLEGES } from "@/lib/colleges";
import { searchColleges } from "@/lib/colleges-db";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function CollegeSelect({ value, onChange, label = "College Name", placeholder = "Search verified institutions…", className }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  useEffect(() => { setQ(value); }, [value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced remote search with static fallback
  useEffect(() => {
    if (!open) return;
    const mySeq = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      const list = await searchColleges(q, 40);
      if (mySeq === seq.current) {
        setResults(list);
        setLoading(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  const initialFallback = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (needle ? COLLEGES.filter((c) => c.toLowerCase().includes(needle)) : COLLEGES).slice(0, 40);
  }, [q]);
  const list = results.length > 0 ? results : initialFallback;

  function pick(c: string) {
    onChange(c);
    setQ(c);
    setOpen(false);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && (
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      )}
      <div className="mt-1 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          value={q}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          placeholder={placeholder}
          className="w-full h-11 pl-9 pr-9 rounded-xl bg-secondary outline-none text-sm font-semibold border border-transparent focus:border-primary focus:bg-surface transition-all"
        />
        {loading ? (
          <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
        ) : (
          <ChevronDown
            onClick={() => setOpen((o) => !o)}
            className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer"
          />
        )}
      </div>
      {open && (
        <div className="absolute z-40 mt-1.5 left-0 right-0 max-h-64 overflow-y-auto rounded-2xl glass-strong neon-border shadow-elevated p-1">
          {list.length === 0 && !loading && (
            <div className="px-3 py-3">
              <p className="text-xs text-muted-foreground text-center mb-2">No matching institution.</p>
              {q.trim().length > 2 && (
                <button
                  type="button"
                  onClick={() => pick(q.trim())}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold bg-primary/10 hover:bg-primary/20"
                >
                  Use "{q.trim()}"
                </button>
              )}
            </div>
          )}
          {list.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => pick(c)}
              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold hover:bg-accent/50 flex items-center justify-between gap-2"
            >
              <span className="truncate">{c}</span>
              {value === c && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CollegeSelect;
