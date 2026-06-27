import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Plus,
  ChevronLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  CalendarDays,
  PartyPopper,
  Briefcase,
  ScrollText,
  Send,
  Sparkles,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatISTDateTime } from "@/lib/format";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RouteSkeleton } from "@/components/RouteSkeleton";

export const Route = createFileRoute("/student/noc")({
  head: () => ({ meta: [{ title: "NOC Requests — EduTrack" }] }),
  pendingComponent: RouteSkeleton,
  component: NOCPage,
});

type NocStatus = "pending" | "approved" | "rejected";
type NocType = "leave" | "event" | "internship" | "other";

interface NocRow {
  id: string;
  student_id: string;
  student_name: string;
  request_type: NocType;
  reason: string;
  from_date: string | null;
  to_date: string | null;
  event_name: string | null;
  status: NocStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const TYPE_META: Record<NocType, { label: string; icon: typeof CalendarDays; tint: string }> = {
  leave: { label: "Leave", icon: CalendarDays, tint: "from-indigo-500/40 to-blue-500/30" },
  event: { label: "Event", icon: PartyPopper, tint: "from-fuchsia-500/40 to-pink-500/30" },
  internship: { label: "Internship", icon: Briefcase, tint: "from-amber-500/40 to-orange-500/30" },
  other: { label: "Other", icon: ScrollText, tint: "from-emerald-500/40 to-teal-500/30" },
};

const STEPS: { key: NocStatus; label: string }[] = [
  { key: "pending", label: "Submitted" },
  { key: "pending", label: "Under Review" },
  { key: "approved", label: "Decision" },
];

function NOCPage() {
  const maybe = useStore((s) => s.user);
  if (!maybe) return null;
  const user = maybe;

  const [rows, setRows] = useState<NocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data, error } = await (supabase as any)
          .from("noc_requests")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });
        if (!active) return;
        if (error) throw error;
        setRows((data ?? []) as NocRow[]);
      } catch (err) {
        console.warn("noc load failed", err);
        toast.error("Couldn't load NOC requests");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const ch = supabase
      .channel(`noc:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "noc_requests", filter: `student_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [user.id]);

  return (
    <div className="pb-10 min-h-full">
      <header className="px-6 pt-10 pb-6 gradient-primary text-primary-foreground rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute -right-12 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to="/student" className="inline-flex items-center gap-1 text-xs opacity-90 hover:opacity-100">
              <ChevronLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <h1 className="mt-1.5 text-2xl font-black flex items-center gap-2">
              <ScrollText className="w-6 h-6" /> NOC Requests
            </h1>
            <p className="text-xs opacity-90 mt-1">Apply for leave, events & internships — track live.</p>
          </div>
          <ThemeToggle variant="onPrimary" />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="relative mt-5 w-full h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 text-sm font-bold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
        >
          <Plus className="w-4 h-4" /> New NOC Application
        </button>
      </header>

      <section className="px-5 mt-5 space-y-3">
        {loading ? (
          <div className="rounded-2xl glass shadow-soft p-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-3xl glass shadow-soft p-8 text-center">
            <Sparkles className="w-7 h-7 mx-auto text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">No NOC requests yet</p>
            <p className="text-xs text-muted-foreground mt-1">Apply for leave or events with a single tap above.</p>
          </div>
        ) : (
          rows.map((r) => <NocCard key={r.id} row={r} />)
        )}
      </section>

      {showForm && (
        <NocFormSheet
          userId={user.id}
          userName={user.name}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function NocCard({ row }: { row: NocRow }) {
  const meta = TYPE_META[row.request_type];
  const Icon = meta.icon;
  const stepIndex = row.status === "pending" ? 1 : 2;
  const isRejected = row.status === "rejected";

  return (
    <div className="relative overflow-hidden rounded-3xl glass-strong shadow-elevated p-4">
      <div aria-hidden className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${meta.tint} blur-2xl opacity-60`} />
      <div className="relative flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl gradient-primary text-primary-foreground grid place-items-center shrink-0 shadow-soft">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold leading-tight">
              {meta.label} NOC{row.event_name ? ` · ${row.event_name}` : ""}
            </p>
            <StatusPill status={row.status} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{row.reason}</p>
          {(row.from_date || row.to_date) && (
            <p className="text-[10px] text-muted-foreground/80 mt-1">
              {row.from_date && new Date(row.from_date).toLocaleDateString("en-IN")}
              {row.to_date ? ` → ${new Date(row.to_date).toLocaleDateString("en-IN")}` : ""}
            </p>
          )}
        </div>
      </div>

      {/* Tracker */}
      <div className="relative mt-4 px-1">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const reached = i <= stepIndex;
            const isLastDecision = i === 2;
            const Cls = isLastDecision && isRejected ? XCircle : reached ? CheckCircle2 : Clock;
            const color = isLastDecision && isRejected ? "text-rose-500 bg-rose-500/15" : reached ? "text-emerald-500 bg-emerald-500/15" : "text-muted-foreground bg-muted/40";
            return (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-7 h-7 rounded-full grid place-items-center border border-border ${color}`}>
                  <Cls className="w-3.5 h-3.5" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground">{isLastDecision && isRejected ? "Rejected" : isLastDecision && row.status === "approved" ? "Approved" : s.label}</span>
              </div>
            );
          })}
        </div>
        <div className="absolute left-7 right-7 top-3.5 h-[2px] bg-border -z-10 rounded-full" />
        <div
          className="absolute left-7 top-3.5 h-[2px] rounded-full -z-10 transition-all duration-500"
          style={{
            width: `calc(${(stepIndex / (STEPS.length - 1)) * 100}% - ${stepIndex === 0 ? 0 : 14}px)`,
            background: isRejected ? "var(--color-destructive)" : "var(--color-primary)",
          }}
        />
      </div>

      {row.admin_notes && (
        <div className="relative mt-3 rounded-xl border border-border bg-muted/40 px-3 py-2">
          <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Admin note</p>
          <p className="text-xs mt-0.5">{row.admin_notes}</p>
        </div>
      )}

      <p className="relative text-[10px] text-muted-foreground/80 mt-3">Updated {formatISTDateTime(row.updated_at)}</p>
    </div>
  );
}

function StatusPill({ status }: { status: NocStatus }) {
  const map = {
    pending: { Icon: Clock, label: "Pending", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
    approved: { Icon: CheckCircle2, label: "Approved", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
    rejected: { Icon: XCircle, label: "Rejected", cls: "bg-rose-500/15 text-rose-500 border-rose-500/30" },
  } as const;
  const { Icon, label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${cls}`}>
      <Icon className="w-2.5 h-2.5" /> {label}
    </span>
  );
}

function NocFormSheet({
  userId,
  userName,
  onClose,
}: {
  userId: string;
  userName: string;
  onClose: () => void;
}) {
  const [type, setType] = useState<NocType>("leave");
  const [reason, setReason] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [eventName, setEventName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please describe the reason");
      return;
    }
    setSubmitting(true);
    const { error } = await (supabase as any).from("noc_requests").insert({
      student_id: userId,
      student_name: userName,
      request_type: type,
      reason: reason.trim(),
      from_date: fromDate || null,
      to_date: toDate || null,
      event_name: eventName.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("NOC request submitted");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 p-3 animate-in fade-in" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md glass-strong rounded-3xl shadow-elevated p-5 max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-black">New NOC</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg grid place-items-center hover:bg-accent/50">
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</label>
        <div className="mt-1.5 grid grid-cols-4 gap-1.5">
          {(Object.keys(TYPE_META) as NocType[]).map((k) => {
            const M = TYPE_META[k];
            const Icon = M.icon;
            const active = type === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setType(k)}
                className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[10px] font-bold transition ${
                  active
                    ? "gradient-primary text-primary-foreground border-transparent shadow-soft"
                    : "glass border-border text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {M.label}
              </button>
            );
          })}
        </div>

        {(type === "event" || type === "internship") && (
          <>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-4 block">
              {type === "event" ? "Event name" : "Organisation"}
            </label>
            <input
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder={type === "event" ? "e.g. TechFest 2026" : "e.g. Infosys Ltd."}
              className="mt-1.5 w-full h-11 px-3.5 rounded-xl bg-secondary outline-none text-sm font-semibold border border-transparent focus:border-primary focus:bg-surface transition"
            />
          </>
        )}

        <div className="grid grid-cols-2 gap-2 mt-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="mt-1.5 w-full h-11 px-3 rounded-xl bg-secondary outline-none text-sm font-semibold border border-transparent focus:border-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">To</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="mt-1.5 w-full h-11 px-3 rounded-xl bg-secondary outline-none text-sm font-semibold border border-transparent focus:border-primary"
            />
          </div>
        </div>

        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-4 block">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Briefly explain the purpose of this NOC…"
          className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl bg-secondary outline-none text-sm border border-transparent focus:border-primary resize-none"
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm inline-flex items-center justify-center gap-2 shadow-elevated active:scale-[0.98] transition disabled:opacity-70"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {submitting ? "Submitting…" : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
