import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Users, ShieldCheck, Megaphone, LogOut, GraduationCap, CheckCircle2, XCircle, Send } from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { store, useStore, signOut, attendanceStats, setDocStatus, broadcast, CATEGORY_LABELS } from "@/lib/store";
import { toast } from "sonner";
import { StatusTag } from "./student.documents";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const u = store.get().user;
    if (!u) throw redirect({ to: "/auth" });
    if (u.role !== "admin") throw redirect({ to: "/student" });
  },
  head: () => ({ meta: [{ title: "Admin Console — EduTrack" }] }),
  component: AdminConsole,
});

type Tab = "roster" | "verify" | "broadcast";

function AdminConsole() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user)!;
  const users = useStore((s) => s.users.filter((u) => u.role === "student"));
  const pendingCount = useStore((s) => s.documents.filter((d) => d.status === "pending").length);
  const [tab, setTab] = useState<Tab>("roster");

  return (
    <MobileShell>
      <header className="px-6 pt-10 pb-8 gradient-primary text-primary-foreground rounded-b-[2rem]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-80">Admin Console</p>
            <h1 className="text-2xl font-black mt-0.5">Hello, {user.name.split(" ")[0]}</h1>
          </div>
          <button
            onClick={() => { signOut(); navigate({ to: "/auth" }); }}
            className="w-10 h-10 rounded-xl bg-white/15 grid place-items-center"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-5">
          <KPI label="Students" value={users.length} />
          <KPI label="Pending" value={pendingCount} />
          <KPI label="Notices" value={store.get().announcements.length} />
        </div>
      </header>

      <div className="px-5 -mt-5 sticky top-0 z-20">
        <div className="rounded-2xl bg-surface shadow-elevated p-1 grid grid-cols-3 gap-1">
          <TabBtn active={tab === "roster"} onClick={() => setTab("roster")} icon={<Users className="w-4 h-4" />} label="Roster" />
          <TabBtn active={tab === "verify"} onClick={() => setTab("verify")} icon={<ShieldCheck className="w-4 h-4" />} label="Verify" />
          <TabBtn active={tab === "broadcast"} onClick={() => setTab("broadcast")} icon={<Megaphone className="w-4 h-4" />} label="Broadcast" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {tab === "roster" && <Roster />}
        {tab === "verify" && <Verify />}
        {tab === "broadcast" && <Broadcast authorName={user.name} />}
      </div>
    </MobileShell>
  );
}

function KPI({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-3">
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-xl font-black mt-0.5">{value}</p>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all ${
        active ? "gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function Roster() {
  const students = useStore((s) => s.users.filter((u) => u.role === "student"));
  const attendance = useStore((s) => s.attendance);
  return (
    <div className="px-5 pt-5 space-y-3">
      {students.map((u) => {
        const stats = attendanceStats(u.id);
        const initials = u.name.split(" ").map((p) => p[0]).slice(0, 2).join("");
        return (
          <div key={u.id} className="rounded-2xl bg-surface shadow-soft p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl gradient-primary text-primary-foreground grid place-items-center font-black shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{u.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{u.department || "—"}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full gradient-primary" style={{ width: `${stats.pct}%` }} />
                </div>
                <span className="text-[11px] font-bold tabular-nums">{stats.pct}%</span>
              </div>
            </div>
            <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        );
      })}
      {/* eslint-disable-next-line react/jsx-no-useless-fragment */}
      {students.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No students yet.</p>}
    </div>
  );
}

function Verify() {
  const docs = useStore((s) => s.documents.filter((d) => d.status === "pending"));
  const recent = useStore((s) => s.documents.filter((d) => d.status !== "pending").slice(0, 8));

  function approve(id: string) { setDocStatus(id, "verified"); toast.success("Document approved"); }
  function reject(id: string) { setDocStatus(id, "rejected"); toast.error("Document rejected"); }

  return (
    <div className="px-5 pt-5 space-y-5">
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Pending requests</h2>
        <div className="space-y-3">
          {docs.length === 0 && (
            <div className="rounded-2xl bg-surface shadow-soft p-6 text-center">
              <ShieldCheck className="w-7 h-7 mx-auto text-success" />
              <p className="mt-2 text-sm">All caught up.</p>
            </div>
          )}
          {docs.map((d) => (
            <div key={d.id} className="rounded-2xl bg-surface shadow-soft p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent text-primary grid place-items-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{d.ownerName}</p>
                  <p className="text-[11px] text-muted-foreground">{CATEGORY_LABELS[d.category]} · {d.fileName}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => reject(d.id)} className="h-11 rounded-xl bg-destructive/10 text-destructive font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98]">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => approve(d.id)} className="h-11 rounded-xl bg-success text-success-foreground font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98]">
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Recently processed</h2>
          <div className="rounded-2xl bg-surface shadow-soft divide-y divide-border">
            {recent.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{d.ownerName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{d.fileName}</p>
                </div>
                <StatusTag status={d.status} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Broadcast({ authorName }: { authorName: string }) {
  const list = useStore((s) => s.announcements);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function push() {
    if (!title.trim() || !body.trim()) { toast.error("Title and body required"); return; }
    broadcast({ title: title.trim(), body: body.trim(), authorName });
    setTitle(""); setBody("");
    toast.success("Broadcast pushed to all students");
  }

  return (
    <div className="px-5 pt-5 space-y-5">
      <div className="rounded-2xl bg-surface shadow-soft p-4">
        <h2 className="text-base font-bold">New announcement</h2>
        <p className="text-xs text-muted-foreground">Pushed instantly to every student feed.</p>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Library hours updated"
              className="mt-1.5 w-full h-12 px-3.5 rounded-xl bg-secondary outline-none text-sm font-medium border border-transparent focus:border-primary focus:bg-surface transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Share the details students need to know…"
              className="mt-1.5 w-full px-3.5 py-3 rounded-xl bg-secondary outline-none text-sm font-medium border border-transparent focus:border-primary focus:bg-surface transition-all resize-none"
            />
          </div>
          <button
            onClick={push}
            className="w-full h-13 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elevated active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Push Broadcast
          </button>
        </div>
      </div>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Live noticeboard</h2>
        <div className="space-y-3">
          {list.map((a) => (
            <div key={a.id} className="rounded-2xl bg-surface shadow-soft p-4">
              <p className="text-sm font-bold">{a.title}</p>
              <p className="text-[11px] text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</p>
              <p className="mt-2 text-sm">{a.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
