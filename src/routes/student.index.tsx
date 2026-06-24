import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { Calendar, CheckCircle2, TrendingUp, Sparkles, LogOut } from "lucide-react";
import { attendanceStats, markAttendance, signOut as clearLocalUser, useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatISTDay } from "@/lib/format";

export const Route = createFileRoute("/student/")({
  head: () => ({ meta: [{ title: "Dashboard — EduTrack" }] }),
  component: StudentDashboard,
});

function StudentDashboard() {
  const user = useStore((s) => s.user)!;
  const attendance = useStore((s) => s.attendance);

  const stats = useMemo(() => attendanceStats(user.id), [attendance, user.id]);
  const today = new Date().toISOString().slice(0, 10);
  const markedToday = attendance.some((a) => a.userId === user.id && a.date === today);

  const recent = useMemo(
    () =>
      [...attendance]
        .filter((a) => a.userId === user.id)
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 6),
    [attendance, user.id],
  );

  function handleMark() {
    const ok = markAttendance(user.id);
    if (ok) toast.success("Attendance marked for today");
    else toast.info("You've already marked attendance today");
  }

  return (
    <div className="pb-6">
      <header className="px-6 pt-10 pb-6 gradient-primary text-primary-foreground rounded-b-[2rem]">
        <p className="text-xs uppercase tracking-widest opacity-80">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
        <h1 className="mt-1 text-2xl font-black">Hi, {user.name.split(" ")[0]} 👋</h1>
        <p className="text-sm opacity-90 mt-0.5">{user.department}</p>
      </header>

      <section className="px-5 -mt-12">
        <div className="rounded-3xl bg-surface shadow-elevated p-5">
          <div className="flex items-center gap-5">
            <Ring pct={stats.pct} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Attendance</p>
              <p className="text-3xl font-black mt-0.5">{stats.pct}%</p>
              <p className="text-sm text-muted-foreground mt-0.5">{stats.days} of {stats.total} days</p>
            </div>
          </div>

          <button
            onClick={handleMark}
            disabled={markedToday}
            className={`mt-5 w-full h-14 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
              markedToday
                ? "bg-success/15 text-success cursor-not-allowed"
                : "gradient-primary text-primary-foreground shadow-elevated"
            }`}
          >
            {markedToday ? (<><CheckCircle2 className="w-5 h-5" /> Marked for today</>) : (<><Sparkles className="w-5 h-5" /> Mark Today's Attendance</>)}
          </button>
        </div>
      </section>

      <section className="px-5 mt-6 grid grid-cols-2 gap-3">
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="This week" value={`${recent.filter((r) => withinDays(r.date, 7)).length} days`} />
        <StatCard icon={<Calendar className="w-4 h-4" />} label="Streak" value={`${calcStreak(recent.map((r) => r.date))} days`} />
      </section>

      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Recent attendance</h2>
        </div>
        <div className="rounded-2xl bg-surface shadow-soft divide-y divide-border">
          {recent.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground text-center">No attendance yet. Mark today's!</p>
          )}
          {recent.map((r) => (
            <div key={r.date} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-success/15 text-success grid place-items-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{formatDate(r.date)}</p>
                  <p className="text-[11px] text-muted-foreground">Present</p>
                </div>
              </div>
              <span className="text-[11px] font-bold uppercase text-success">On time</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const size = 96;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-secondary)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#g1)"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-primary-glow)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-xl font-black">{pct}%</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface shadow-soft p-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-black">{value}</p>
    </div>
  );
}

function withinDays(date: string, days: number) {
  const d = new Date(date).getTime();
  return Date.now() - d < days * 86400000;
}
function calcStreak(dates: string[]) {
  const set = new Set(dates);
  let s = 0;
  const d = new Date();
  while (set.has(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1); }
  if (s === 0) { d.setDate(d.getDate() - 1); while (set.has(d.toISOString().slice(0, 10))) { s++; d.setDate(d.getDate() - 1); } }
  return s;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
