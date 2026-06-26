import { useEffect, useState } from "react";
import { Plus, Check, Trash2, ListTodo, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Todo {
  id: string;
  title: string;
  done: boolean;
  due_date: string | null;
  created_at: string;
}

export function TodoWidget({ userId }: { userId: string }) {
  const [items, setItems] = useState<Todo[] | null>(null);
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase
        .from("todo_list")
        .select("*")
        .eq("user_id", userId)
        .order("done", { ascending: true })
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) { console.warn(error); setItems([]); return; }
      setItems((data ?? []) as Todo[]);
    }
    load();
    const ch = supabase
      .channel(`todos:${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "todo_list", filter: `user_id=eq.${userId}` }, () => load())
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, [userId]);

  async function add() {
    const title = text.trim();
    if (!title) return;
    setAdding(true);
    const { error } = await supabase.from("todo_list").insert({ user_id: userId, title });
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    setText("");
  }

  async function toggle(t: Todo) {
    await supabase.from("todo_list").update({ done: !t.done }).eq("id", t.id);
  }

  async function remove(t: Todo) {
    await supabase.from("todo_list").delete().eq("id", t.id);
  }

  const open = (items ?? []).filter((t) => !t.done);
  const done = (items ?? []).filter((t) => t.done);
  const total = (items ?? []).length;
  const pct = total === 0 ? 0 : Math.round((done.length / total) * 100);

  return (
    <div className="rounded-2xl glass shadow-soft p-4">
      <div className="flex items-center gap-3">
        <TodoRing pct={pct} />
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold flex items-center gap-1.5">
            <ListTodo className="w-4 h-4 text-primary" /> My Tasks
          </h2>
          <p className="text-[11px] text-muted-foreground font-medium">
            {done.length}/{total || 0} done · {open.length} open
          </p>
        </div>
      </div>


      <div className="mt-3 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") add(); }}
          placeholder="Add a task…"
          className="flex-1 h-11 px-3 rounded-xl bg-secondary outline-none text-sm font-medium border border-transparent focus:border-primary focus:bg-surface transition-all"
        />
        <button
          onClick={add}
          disabled={adding || !text.trim()}
          className="h-11 w-11 rounded-xl gradient-primary text-primary-foreground grid place-items-center active:scale-95 disabled:opacity-50"
          aria-label="Add task"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      <ul className="mt-3 divide-y divide-border">
        {items === null && (
          <li className="py-4 grid place-items-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></li>
        )}
        {items !== null && items.length === 0 && (
          <li className="py-5 text-center text-xs text-muted-foreground">No tasks yet. Add one above.</li>
        )}
        {[...open, ...done].map((t) => (
          <li key={t.id} className="py-2.5 flex items-center gap-3">
            <button
              onClick={() => toggle(t)}
              aria-label={t.done ? "Mark open" : "Mark done"}
              className={`w-6 h-6 rounded-md border grid place-items-center shrink-0 transition-colors ${
                t.done ? "bg-success border-success text-success-foreground" : "border-border bg-surface"
              }`}
            >
              {t.done && <Check className="w-3.5 h-3.5" />}
            </button>
            <p className={`flex-1 text-sm font-semibold truncate ${t.done ? "line-through text-muted-foreground" : ""}`}>
              {t.title}
            </p>
            <button
              onClick={() => remove(t)}
              className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              aria-label="Delete task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TodoRing({ pct }: { pct: number }) {
  const size = 52;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-secondary)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#todoring)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 500ms ease" }}
        />
        <defs>
          <linearGradient id="todoring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-primary-glow)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-[11px] font-black">{pct}%</span>
      </div>
    </div>
  );
}

