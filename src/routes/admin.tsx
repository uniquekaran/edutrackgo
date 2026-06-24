import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Users, ShieldCheck, Megaphone, LogOut, CheckCircle2, XCircle, Send,
  ExternalLink, FileText, Search, ChevronRight, X, Loader2, BarChart3,
  CalendarCheck, AlertTriangle,
} from "lucide-react";
import { MobileShell } from "@/components/MobileShell";
import { useStore, signOut as clearLocalUser, broadcast } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StatusTag, type DocStatus } from "./student.documents";

const ADMIN_BYPASS_EMAIL = "630karan2@gmail.com";

interface DocRow {
  id: string;
  student_id: string;
  student_name: string;
  document_type: string;
  file_url: string;
  status: DocStatus;
  created_at: string;
}
interface StudentRow {
  id: string;
  email: string;
  full_name: string | null;
  department: string | null;
  created_at: string;
}

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Console — EduTrack" }] }),
  component: AdminConsole,
});

type Tab = "roster" | "documents" | "analytics";

function AdminConsole() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const [bootError, setBootError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentRow[] | null>(null);
  const [docs, setDocs] = useState<DocRow[] | null>(null);
  const [tab, setTab] = useState<Tab>("roster");
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [preview, setPreview] = useState<DocRow | null>(null);

  // Auth gate: wait for hydration; bypass for the configured admin email.
  const isAuthorized = useMemo(() => {
    if (!user) return null; // still loading
    if (user.email?.toLowerCase() === ADMIN_BYPASS_EMAIL) return true;
    return user.role === "admin";
  }, [user]);

  useEffect(() => {
    if (isAuthorized === false) {
      navigate({ to: "/student" });
    }
  }, [isAuthorized, navigate]);

  // Load data once authorized
  useEffect(() => {
    if (isAuthorized !== true) return;
    let cancelled = false;

    async function load() {
      try {
        const [studentsRes, docsRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, email, full_name, department, created_at")
            .order("created_at", { ascending: false }),
          supabase
            .from("documents")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);
        if (studentsRes.error) throw studentsRes.error;
        if (docsRes.error) throw docsRes.error;

        // Filter out admin roles
        const { data: adminRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");
        const adminIds = new Set((adminRoles ?? []).map((r) => r.user_id));

        if (cancelled) return;
        setStudents(((studentsRes.data ?? []) as StudentRow[]).filter((s) => !adminIds.has(s.id)));
        setDocs((docsRes.data ?? []) as DocRow[]);
      } catch (e) {
        if (cancelled) return;
        setBootError(e instanceof Error ? e.message : "Failed to load admin data");
      }
    }
    load();

    const ch = supabase
      .channel("admin:documents")
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [isAuthorized]);

  // --- Loading / gating UI ---
  if (isAuthorized === null) return <FullScreenSpinner label="Loading dashboard…" />;
  if (isAuthorized === false) return <FullScreenSpinner label="Loading dashboard…" />;
  if (bootError) {
    return (
      <MobileShell>
        <div className="flex-1 grid place-items-center px-6 text-center">
          <div>
            <AlertTriangle className="w-10 h-10 mx-auto text-destructive" />
            <p className="mt-3 font-bold">Couldn't load the dashboard</p>
            <p className="mt-1 text-sm text-muted-foreground">{bootError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 h-10 rounded-xl gradient-primary text-primary-foreground font-bold text-sm"
            >Retry</button>
          </div>
        </div>
      </MobileShell>
    );
  }
  if (!students || !docs || !user) return <FullScreenSpinner label="Loading dashboard…" />;

  const pendingCount = docs.filter((d) => d.status === "pending").length;
  const firstName = user.name?.split(" ")[0] ?? "Admin";

  async function handleSignOut() {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
    clearLocalUser();
    navigate({ to: "/auth" });
  }

  return (
    <MobileShell>
      <header className="px-6 pt-10 pb-8 gradient-primary text-primary-foreground rounded-b-[2rem]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-80">Admin Console</p>
            <h1 className="text-2xl font-black mt-0.5">Hello, {firstName}</h1>
          </div>
          <button
            onClick={handleSignOut}
            className="w-10 h-10 rounded-xl bg-white/15 grid place-items-center"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-5">
          <KPI label="Students" value={students.length} />
          <KPI label="Pending" value={pendingCount} />
          <KPI label="Verified" value={docs.filter((d) => d.status === "verified").length} />
        </div>
      </header>

      <div className="px-5 -mt-5 sticky top-0 z-20">
        <div className="rounded-2xl bg-surface shadow-elevated p-1 grid grid-cols-3 gap-1">
          <TabBtn active={tab === "roster"} onClick={() => setTab("roster")} icon={<Users className="w-4 h-4" />} label="Roster" />
          <TabBtn active={tab === "documents"} onClick={() => setTab("documents")} icon={<ShieldCheck className="w-4 h-4" />} label="Documents" />
          <TabBtn active={tab === "analytics"} onClick={() => setTab("analytics")} icon={<BarChart3 className="w-4 h-4" />} label="Analytics" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 animate-in fade-in duration-200" key={tab}>
        {tab === "roster" && <Roster students={students} docs={docs} onOpen={setSelectedStudent} />}
        {tab === "documents" && <DocumentsHub docs={docs} onPreview={setPreview} />}
        {tab === "analytics" && <Analytics students={students} docs={docs} authorName={user.name ?? "Admin"} />}
      </div>

      {selectedStudent && (
        <StudentProfilePanel
          student={selectedStudent}
          docs={docs.filter((d) => d.student_id === selectedStudent.id)}
          onClose={() => setSelectedStudent(null)}
          onPreview={setPreview}
        />
      )}

      {preview && <DocPreviewModal doc={preview} onClose={() => setPreview(null)} />}
    </MobileShell>
  );
}

function FullScreenSpinner({ label }: { label: string }) {
  return (
    <MobileShell>
      <div className="flex-1 grid place-items-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/15" />
            <Loader2 className="absolute inset-0 m-auto w-12 h-12 text-primary animate-spin" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{label}</p>
        </div>
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

/* ============================ Tab 1: Roster ============================ */

function Roster({
  students, docs, onOpen,
}: { students: StudentRow[]; docs: DocRow[]; onOpen: (s: StudentRow) => void }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return students;
    return students.filter((s) =>
      (s.full_name ?? "").toLowerCase().includes(term) ||
      (s.email ?? "").toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term),
    );
  }, [q, students]);

  return (
    <div className="px-5 pt-5 space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, or UID"
          className="w-full h-12 pl-9 pr-3 rounded-xl bg-secondary outline-none text-sm font-medium border border-transparent focus:border-primary focus:bg-surface transition-all"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">No students match your search.</p>
      )}

      {filtered.map((s) => {
        const initials = (s.full_name ?? s.email ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
        const studentDocs = docs.filter((d) => d.student_id === s.id);
        const pending = studentDocs.filter((d) => d.status === "pending").length;
        return (
          <button
            key={s.id}
            onClick={() => onOpen(s)}
            className="w-full rounded-2xl bg-surface shadow-soft p-4 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl gradient-primary text-primary-foreground grid place-items-center font-black shrink-0">
              {initials || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{s.full_name ?? "Unnamed student"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{s.email}</p>
              <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5 font-mono">UID: {s.id}</p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {pending > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-warning/15 text-warning-foreground border border-warning/30">
                  {pending} pending
                </span>
              )}
              <span className="text-[11px] text-primary font-bold inline-flex items-center gap-0.5">
                View <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* =================== Student Profile + Docs side-panel =================== */

function StudentProfilePanel({
  student, docs, onClose, onPreview,
}: { student: StudentRow; docs: DocRow[]; onClose: () => void; onPreview: (d: DocRow) => void }) {
  async function setStatus(id: string, status: DocStatus) {
    const { error } = await supabase.from("documents").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "verified" ? "Document approved" : "Document rejected");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 animate-in fade-in" onClick={onClose}>
      <div
        className="bg-surface w-full max-w-md max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-elevated flex flex-col animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl gradient-primary text-primary-foreground grid place-items-center font-black shrink-0">
            {(student.full_name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold truncate">{student.full_name ?? "Unnamed student"}</p>
            <p className="text-xs text-muted-foreground truncate">{student.email}</p>
            <p className="text-[10px] text-muted-foreground/80 truncate mt-0.5 font-mono">UID: {student.id}</p>
            {student.department && (
              <p className="text-[11px] text-muted-foreground mt-0.5">{student.department}</p>
            )}
          </div>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg grid place-items-center hover:bg-accent/50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">All documents</h3>
          {docs.length === 0 && (
            <div className="rounded-xl bg-secondary/50 p-6 text-center text-sm text-muted-foreground">
              No documents uploaded yet.
            </div>
          )}
          {docs.map((d) => (
            <div key={d.id} className="rounded-2xl bg-secondary/40 p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent text-primary grid place-items-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{d.document_type}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(d.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusTag status={d.status} />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {d.file_url ? (
                  <button
                    onClick={() => onPreview(d)}
                    className="h-10 rounded-xl bg-surface border border-border font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <FileText className="w-3.5 h-3.5" /> View
                  </button>
                ) : (
                  <div className="h-10 rounded-xl bg-surface/50 border border-dashed border-border text-muted-foreground font-bold text-xs flex items-center justify-center">
                    No file
                  </div>
                )}
                <button
                  onClick={() => setStatus(d.id, "rejected")}
                  className="h-10 rounded-xl bg-destructive/10 text-destructive font-bold text-xs flex items-center justify-center gap-1 active:scale-[0.98]"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  onClick={() => setStatus(d.id, "verified")}
                  className="h-10 rounded-xl bg-success text-success-foreground font-bold text-xs flex items-center justify-center gap-1 active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========================== Tab 2: Documents Hub ========================== */

function DocumentsHub({ docs, onPreview }: { docs: DocRow[]; onPreview: (d: DocRow) => void }) {
  const pending = docs.filter((d) => d.status === "pending");
  const recent = docs.filter((d) => d.status !== "pending").slice(0, 20);

  async function setStatus(id: string, status: DocStatus) {
    const { error } = await supabase.from("documents").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "verified" ? "Document approved" : "Document rejected");
  }

  return (
    <div className="px-5 pt-5 space-y-5">
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Pending requests
        </h2>
        <div className="space-y-3">
          {pending.length === 0 && (
            <div className="rounded-2xl bg-surface shadow-soft p-6 text-center">
              <ShieldCheck className="w-7 h-7 mx-auto text-success" />
              <p className="mt-2 text-sm">All caught up.</p>
            </div>
          )}
          {pending.map((d) => (
            <div key={d.id} className="rounded-2xl bg-surface shadow-soft p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent text-primary grid place-items-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{d.student_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {d.document_type} · {new Date(d.created_at).toLocaleDateString()}
                  </p>
                </div>
                {d.file_url && (
                  <button
                    onClick={() => onPreview(d)}
                    className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-accent/50"
                    aria-label="Preview file"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => setStatus(d.id, "rejected")} className="h-11 rounded-xl bg-destructive/10 text-destructive font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98]">
                  <XCircle className="w-4 h-4" /> Reject
                </button>
                <button onClick={() => setStatus(d.id, "verified")} className="h-11 rounded-xl bg-success text-success-foreground font-bold text-sm flex items-center justify-center gap-1.5 active:scale-[0.98]">
                  <CheckCircle2 className="w-4 h-4" /> Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Recently processed
          </h2>
          <div className="rounded-2xl bg-surface shadow-soft divide-y divide-border">
            {recent.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{d.student_name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{d.document_type}</p>
                </div>
                {d.file_url && (
                  <button
                    onClick={() => onPreview(d)}
                    className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-accent/50"
                    aria-label="Preview file"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                )}
                <StatusTag status={d.status} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ===================== Tab 3: Analytics & Broadcast ===================== */

function Analytics({
  students, docs, authorName,
}: { students: StudentRow[]; docs: DocRow[]; authorName: string }) {
  const attendance = useStore((s) => s.attendance);
  const announcements = useStore((s) => s.announcements);
  const today = new Date().toISOString().slice(0, 10);
  const presentToday = attendance.filter((a) => a.date === today);
  const pendingCount = docs.filter((d) => d.status === "pending").length;

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
      <div className="grid grid-cols-3 gap-2">
        <MetricCard label="Students" value={students.length} icon={<Users className="w-4 h-4" />} />
        <MetricCard label="Pending" value={pendingCount} icon={<ShieldCheck className="w-4 h-4" />} />
        <MetricCard label="Present" value={presentToday.length} icon={<CalendarCheck className="w-4 h-4" />} />
      </div>

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Live attendance · today
        </h2>
        <div className="rounded-2xl bg-surface shadow-soft p-4">
          {presentToday.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No check-ins recorded yet today.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {presentToday.map((a) => {
                const s = students.find((x) => x.id === a.userId);
                const label = s?.full_name ?? a.userId.slice(0, 6);
                const initials = label.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
                return (
                  <div key={a.userId} className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center text-xs font-black">
                      {initials || "?"}
                    </div>
                    <p className="text-[10px] text-center truncate w-full">{label}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="rounded-2xl bg-surface shadow-soft p-4">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" /> Broadcast
        </h2>
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
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Message</label>
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
            className="w-full h-14 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elevated active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Send Announcement
          </button>
        </div>
      </div>

      {announcements.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Live noticeboard
          </h2>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-2xl bg-surface shadow-soft p-4">
                <p className="text-sm font-bold">{a.title}</p>
                <p className="text-[11px] text-muted-foreground">{new Date(a.createdAt).toLocaleString()}</p>
                <p className="mt-2 text-sm">{a.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-surface shadow-soft p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <p className="text-[10px] uppercase tracking-wider font-bold">{label}</p>
      </div>
      <p className="text-2xl font-black mt-1">{value}</p>
    </div>
  );
}
