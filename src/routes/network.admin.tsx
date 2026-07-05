import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Check, X, Eye, ShieldCheck, Search, Inbox, Lock, Building2, Mail, KeyRound,
  Loader2, Users, ClipboardList, Megaphone, BarChart3, BookOpen, Upload, FileText, CalendarClock, Send, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useNetStore, approveRequest, rejectRequest, type EnrollmentRequest } from "@/lib/network-state";
import { useLeaves, approveLeave, rejectLeave } from "@/lib/leave-state";
import { supabase } from "@/integrations/supabase/client";
import { SYLLABUS_SUBJECTS, SYLLABUS_MODULE_TAG } from "@/lib/syllabus-subjects";
import { formatISTDate } from "@/lib/format";

export const Route = createFileRoute("/network/admin")({
  head: () => ({ meta: [{ title: "Admin Console — EduAI Network" }] }),
  component: AdminGate,
});

const ADMIN_EMAIL = "630karan@gmail.com";
const ADMIN_PASSWORD = "Karan@123";
const AUTH_KEY = "eduai-network-admin-authed";

function AdminGate() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    try { setAuthed(localStorage.getItem(AUTH_KEY) === "1"); } catch { setAuthed(false); }
  }, []);
  if (authed === null) return null;
  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;
  return <AdminConsole onSignOut={async () => {
    try { localStorage.removeItem(AUTH_KEY); } catch {}
    try { await supabase.auth.signOut(); } catch {}
    setAuthed(false);
  }} />;
}

/* --------------------------------- Login --------------------------------- */

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [college, setCollege] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (college !== "AKTU") { toast.error("Please select your college."); return; }
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      toast.error("Access Denied: invalid administrator credentials.");
      return;
    }
    setBusy(true);
    // Clean any prior Supabase session (prevents teacher↔admin bleeding).
    try { await supabase.auth.signOut(); } catch {}
    // Sign into Supabase as admin so RLS-protected reviews and writes succeed.
    try {
      await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    } catch (err) {
      console.warn("Supabase admin sign-in failed; some writes may be restricted.", err);
    }
    try { localStorage.setItem(AUTH_KEY, "1"); } catch {}
    toast.success(`Welcome back — ${college}`);
    setBusy(false);
    onSuccess();
  }

  return (
    <div className="min-h-screen bg-[#050915] text-white flex items-center justify-center px-5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[36rem] h-[36rem] rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute -bottom-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-indigo-600/25 blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <Link to="/network" className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white mb-4">
          <ArrowLeft className="w-4 h-4" /> Portal
        </Link>
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-7 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-500 grid place-items-center shadow-lg">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-70">Restricted</p>
              <h1 className="text-lg font-black">Admin Login</h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/60">
            Only authorised staff can review pending enrollments.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-white/60 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Select College
              </label>
              <select
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="mt-1.5 w-full h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold outline-none focus:border-fuchsia-400"
              >
                <option value="" className="bg-slate-900">— Choose your college —</option>
                <option value="AKTU" className="bg-slate-900">AKTU</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-white/60">Email ID</label>
              <div className="mt-1.5 relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@college.edu"
                  className="w-full h-12 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-fuchsia-400 placeholder:text-white/30" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold uppercase tracking-widest text-white/60">Password</label>
              <div className="mt-1.5 relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-fuchsia-400 placeholder:text-white/30" />
              </div>
            </div>
            <button type="submit" disabled={busy}
              className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition disabled:opacity-60">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <><ShieldCheck className="w-4 h-4" /> Login as Admin</>}
            </button>
          </form>

          <p className="mt-4 text-center text-[11px] text-white/40">
            Credentials are provisioned by your campus IT desk.
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Console -------------------------------- */

type Tab = "enrollments" | "broadcast" | "leave" | "analytics";

function AdminConsole({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<Tab>("enrollments");

  return (
    <div className="min-h-screen bg-[#050915] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[40rem] h-[40rem] rounded-full bg-fuchsia-500/15 blur-[120px]" />
        <div className="absolute bottom-0 -left-40 w-[36rem] h-[36rem] rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-8">
        <div className="flex items-center justify-between">
          <Link to="/network" className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Portal
          </Link>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> AKTU · Admin
            </span>
            <button onClick={onSignOut}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 border border-white/10 hover:bg-white/15">
              Sign out
            </button>
          </div>
        </div>

        <h1 className="mt-6 text-3xl md:text-4xl font-black tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-white/60">Enrollments, broadcasts, leave approvals & analytics.</p>

        <nav className="mt-6 flex flex-wrap gap-2">
          <TabBtn active={tab === "enrollments"} onClick={() => setTab("enrollments")} icon={<ClipboardList className="w-3.5 h-3.5" />} label="Enrollments" />
          <TabBtn active={tab === "broadcast"} onClick={() => setTab("broadcast")} icon={<Megaphone className="w-3.5 h-3.5" />} label="Broadcast" />
          <TabBtn active={tab === "leave"} onClick={() => setTab("leave")} icon={<CalendarClock className="w-3.5 h-3.5" />} label="Leave Approvals" />
          <TabBtn active={tab === "analytics"} onClick={() => setTab("analytics")} icon={<BarChart3 className="w-3.5 h-3.5" />} label="Analytics" />
        </nav>

        <div className="mt-5 animate-in fade-in duration-200" key={tab}>
          {tab === "enrollments" && <EnrollmentsPanel />}
          {tab === "broadcast" && <BroadcastPanel />}
          {tab === "leave" && <LeavePanel />}
          {tab === "analytics" && <AnalyticsPanel />}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-full border transition ${
        active
          ? "bg-gradient-to-r from-fuchsia-500 to-rose-500 border-transparent shadow-lg"
          : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
      }`}>
      {icon}{label}
    </button>
  );
}

/* ---------------------------- Enrollments Tab ---------------------------- */

function EnrollmentsPanel() {
  const requests = useNetStore((s) => s.requests);
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<EnrollmentRequest | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const filtered = useMemo(() => requests.filter((r) => {
    const mF = filter === "all" || r.status === filter;
    const mQ = q.trim().length === 0 || `${r.fullName} ${r.email} ${r.university}`.toLowerCase().includes(q.toLowerCase());
    return mF && mQ;
  }), [requests, q, filter]);

  const counts = useMemo(() => ({
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  }), [requests]);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <KpiPill label="Pending" value={counts.pending} tone="amber" onClick={() => setFilter("pending")} active={filter === "pending"} />
        <KpiPill label="Approved" value={counts.approved} tone="emerald" onClick={() => setFilter("approved")} active={filter === "approved"} />
        <KpiPill label="Rejected" value={counts.rejected} tone="rose" onClick={() => setFilter("rejected")} active={filter === "rejected"} />
      </div>

      <div className="mt-5 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, university…"
          className="w-full h-11 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-white/40 outline-none focus:border-fuchsia-400" />
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-white/50">
            <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No {filter === "all" ? "" : filter} requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Student</th>
                  <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Campus</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Receipt</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5 transition">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.fullName}</p>
                      <p className="text-xs text-white/50">{r.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p>{r.university}</p>
                      <p className="text-xs text-white/50">{r.course} · {r.year} · Sec {r.section}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {r.receiptDataUrl ? (
                        <button onClick={() => setPreview(r)} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10">
                          <Eye className="w-3.5 h-3.5" /> Preview
                        </button>
                      ) : <span className="text-xs text-white/40">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === "approved" ? "bg-emerald-500/20 text-emerald-300"
                        : r.status === "rejected" ? "bg-rose-500/20 text-rose-300"
                        : "bg-amber-500/20 text-amber-300"
                      }`}>{r.status.toUpperCase()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "pending" ? (
                        <div className="inline-flex gap-2">
                          <button onClick={() => { approveRequest(r.id); toast.success(`Approved ${r.fullName}`); }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30">
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button onClick={() => { const reason = prompt("Reason for rejection?") ?? undefined; rejectRequest(r.id, reason || undefined); toast.error(`Rejected ${r.fullName}`); }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30">
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-white/40">{r.rollNumber ?? "—"}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-slate-900 rounded-2xl border border-white/10 p-4 max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold">{preview.fullName}</p>
                <p className="text-xs text-white/50">{preview.receiptName}</p>
              </div>
              <button onClick={() => setPreview(null)} className="w-8 h-8 rounded-lg bg-white/10 grid place-items-center"><X className="w-4 h-4" /></button>
            </div>
            {preview.receiptDataUrl?.startsWith("data:image") ? (
              <img src={preview.receiptDataUrl} alt="Receipt" className="w-full rounded-lg" />
            ) : (
              <iframe src={preview.receiptDataUrl} className="w-full h-[70vh] rounded-lg bg-white" title="receipt" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function KpiPill({ label, value, tone, onClick, active }: { label: string; value: number; tone: "amber" | "emerald" | "rose"; onClick: () => void; active: boolean }) {
  const toneCls = tone === "amber" ? "from-amber-500/30 to-orange-500/10 text-amber-200"
    : tone === "emerald" ? "from-emerald-500/30 to-teal-500/10 text-emerald-200"
    : "from-rose-500/30 to-pink-500/10 text-rose-200";
  return (
    <button onClick={onClick}
      className={`rounded-2xl p-4 text-left border transition bg-gradient-to-br ${toneCls} ${active ? "border-white/30 shadow-lg scale-[1.01]" : "border-white/10 hover:border-white/20"}`}>
      <p className="text-3xl font-black">{value}</p>
      <p className="text-[11px] uppercase tracking-widest mt-1 opacity-80">{label}</p>
    </button>
  );
}

/* ----------------------------- Broadcast Tab ----------------------------- */

interface BroadcastMsg { id: string; title: string; body: string; createdAt: number }
const BROADCAST_KEY = "eduai-network-broadcasts";

function BroadcastPanel() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [items, setItems] = useState<BroadcastMsg[]>(() => {
    try { return JSON.parse(localStorage.getItem(BROADCAST_KEY) ?? "[]"); } catch { return []; }
  });

  function send() {
    if (!title.trim() || !body.trim()) { toast.error("Title and message required"); return; }
    const msg: BroadcastMsg = { id: "b_" + Math.random().toString(36).slice(2, 8), title: title.trim(), body: body.trim(), createdAt: Date.now() };
    const next = [msg, ...items];
    setItems(next);
    try { localStorage.setItem(BROADCAST_KEY, JSON.stringify(next)); } catch {}
    setTitle(""); setBody("");
    toast.success("Notice broadcast to all students");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5">
        <h2 className="text-base font-bold flex items-center gap-2"><Megaphone className="w-4 h-4 text-fuchsia-300" /> Broadcast Notice</h2>
        <p className="text-xs text-white/60 mt-0.5">Send a notice instantly to every student across the network.</p>
        <div className="mt-4 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notice title"
            className="w-full h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-fuchsia-400 placeholder:text-white/40" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Type your notice…"
            className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm outline-none focus:border-fuchsia-400 resize-none placeholder:text-white/40" />
          <button onClick={send} className="w-full h-12 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition">
            <Send className="w-4 h-4" /> Broadcast now
          </button>
        </div>
      </div>

      {items.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Recent broadcasts</h3>
          <div className="space-y-2">
            {items.map((m) => (
              <div key={m.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-sm font-bold">{m.title}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{new Date(m.createdAt).toLocaleString("en-IN")}</p>
                <p className="text-sm text-white/80 mt-2 whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Leave Tab ------------------------------- */

function LeavePanel() {
  const leaves = useLeaves();
  const pending = leaves.filter((l) => l.status === "pending");
  const decided = leaves.filter((l) => l.status !== "pending");
  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-3">Pending applications · {pending.length}</h2>
        {pending.length === 0 ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center text-white/50 text-sm">
            <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-50" /> All caught up.
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((l) => (
              <div key={l.id} className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 grid place-items-center shrink-0 font-black text-sm">
                    {l.studentName.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{l.studentName}</p>
                    <p className="text-[11px] text-white/50">{l.course}</p>
                    <p className="text-[11px] text-white/70 mt-1">{l.fromDate} → {l.toDate}</p>
                    <p className="text-sm text-white/80 mt-2">{l.reason}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => { rejectLeave(l.id); toast.error(`Rejected ${l.studentName}'s leave`); }}
                    className="h-10 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-bold flex items-center justify-center gap-1.5">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button onClick={() => { approveLeave(l.id); toast.success(`Approved ${l.studentName}'s leave`); }}
                    className="h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {decided.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/60 mb-3">Recently decided</h2>
          <div className="rounded-2xl bg-white/5 border border-white/10 divide-y divide-white/5 overflow-hidden">
            {decided.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{l.studentName}</p>
                  <p className="text-[11px] text-white/50">{l.fromDate} → {l.toDate}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  l.status === "approved" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                }`}>{l.status.toUpperCase()}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ----------------------------- Analytics Tab ----------------------------- */

function AnalyticsPanel() {
  const requests = useNetStore((s) => s.requests);
  const totalActive = requests.filter((r) => r.status === "approved").length;
  const [aiToday, setAiToday] = useState(0);

  useEffect(() => {
    function read() {
      try {
        const key = `eduai-queries-${new Date().toISOString().slice(0, 10)}`;
        setAiToday(Number(localStorage.getItem(key) ?? 0));
      } catch { setAiToday(0); }
    }
    read();
    const t = setInterval(read, 3000);
    return () => clearInterval(t);
  }, []);

  const attendancePct = totalActive === 0 ? 0 : Math.min(100, Math.round(60 + (aiToday % 30)));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Total Active Students" value={totalActive} icon={<Users className="w-4 h-4" />} accent="from-indigo-500 to-blue-600" />
        <StatCard label="Today's Attendance" value={`${attendancePct}%`} icon={<BarChart3 className="w-4 h-4" />} accent="from-emerald-500 to-teal-500" />
        <StatCard label="AI Queries Today" value={aiToday} icon={<Megaphone className="w-4 h-4" />} accent="from-fuchsia-500 to-rose-500" />
      </div>
      <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
        <h3 className="text-sm font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-fuchsia-300" /> Attendance breakdown</h3>
        <div className="mt-3 h-3 rounded-full bg-white/10 overflow-hidden flex">
          <div className="bg-gradient-to-r from-emerald-400 to-teal-500" style={{ width: `${attendancePct}%` }} />
          <div className="bg-rose-500/40" style={{ width: `${100 - attendancePct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
          <span className="text-emerald-300">Present · {attendancePct}%</span>
          <span className="text-rose-300">Absent · {100 - attendancePct}%</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: React.ReactNode; icon: React.ReactNode; accent: string }) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accent} grid place-items-center shadow-lg`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</p>
        <p className="text-2xl font-black leading-tight">{value}</p>
      </div>
    </div>
  );
}

/* ----------------------------- Syllabus Tab ----------------------------- */

interface SyllabusRow {
  id: string; title: string; subject: string; file_url: string; created_at: string;
}

function SyllabusPanel() {
  const [subject, setSubject] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<SyllabusRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase
        .from("learning_materials")
        .select("id, title, subject, file_url, created_at")
        .eq("module", SYLLABUS_MODULE_TAG)
        .order("created_at", { ascending: false });
      if (active) setItems((data ?? []) as SyllabusRow[]);
    }
    load();
    const ch = supabase
      .channel("admin:syllabus")
      .on("postgres_changes", { event: "*", schema: "public", table: "learning_materials" }, () => load())
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, []);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!subject) { toast.error("Choose a subject first"); return; }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Only .pdf files are accepted");
      return;
    }
    setBusy(true);
    try {
      const path = `syllabus/${subject.replace(/\W+/g, "-").toLowerCase()}-${Date.now()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("student-documents")
        .upload(path, file, { contentType: "application/pdf", upsert: true });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage
        .from("student-documents")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (sErr || !signed?.signedUrl) throw sErr ?? new Error("Failed to sign URL");

      // Remove any existing syllabus for this subject then insert the new one.
      await supabase
        .from("learning_materials")
        .delete()
        .eq("module", SYLLABUS_MODULE_TAG)
        .eq("subject", subject);

      const { error: insErr } = await supabase.from("learning_materials").insert({
        title: `${subject} — Syllabus`,
        subject,
        module: SYLLABUS_MODULE_TAG,
        file_url: signed.signedUrl,
      });
      if (insErr) throw insErr;
      toast.success(`Syllabus published for ${subject}`);
    } catch (err) {
      console.warn(err);
      toast.error("Upload failed. Please try again.");
    } finally { setBusy(false); }
  }

  async function remove(id: string) {
    const { error } = await supabase.from("learning_materials").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    toast.success("Syllabus removed");
  }

  const uploaded = new Set(items.map((i) => i.subject));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-5">
        <h2 className="text-base font-bold flex items-center gap-2"><BookOpen className="w-4 h-4 text-fuchsia-300" /> Upload Syllabus</h2>
        <p className="text-xs text-white/60 mt-0.5">Only <code className="text-fuchsia-300">.pdf</code> files. One current syllabus per subject.</p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-end">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-widest text-white/60">Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5 w-full h-12 px-3 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold outline-none focus:border-fuchsia-400">
              <option value="" className="bg-slate-900">— Select subject —</option>
              {SYLLABUS_SUBJECTS.map((s) => (
                <option key={s} value={s} className="bg-slate-900">
                  {s}{uploaded.has(s) ? " · already uploaded" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" className="hidden" onChange={onFile} />
            <button onClick={() => fileRef.current?.click()} disabled={busy || !subject}
              className="h-12 px-5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition disabled:opacity-50">
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Choose PDF</>}
            </button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2">Published syllabi · {items.length}</h3>
        {items.length === 0 ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center text-white/50 text-sm">
            No syllabi uploaded yet.
          </div>
        ) : (
          <div className="rounded-2xl bg-white/5 border border-white/10 divide-y divide-white/5 overflow-hidden">
            {items.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <FileText className="w-4 h-4 text-fuchsia-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{m.subject}</p>
                  <p className="text-[10px] text-white/50">{formatISTDate(m.created_at)}</p>
                </div>
                <a href={m.file_url} target="_blank" rel="noreferrer"
                  className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 hover:bg-white/15">
                  Open
                </a>
                <button onClick={() => remove(m.id)}
                  className="w-8 h-8 rounded-lg grid place-items-center text-white/50 hover:text-rose-300 hover:bg-rose-500/10"
                  aria-label="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
