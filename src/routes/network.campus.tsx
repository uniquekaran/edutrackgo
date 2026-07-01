import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, GraduationCap, MessageSquare, ArrowLeft, ShieldCheck, LogOut, BookOpen } from "lucide-react";
import { useStore } from "@/lib/store";
import { useNetStore } from "@/lib/network-state";
import { generateClassmates, teachersForCourse } from "@/lib/network-data";
import { StudyBuddy } from "@/components/StudyBuddy";

export const Route = createFileRoute("/network/campus")({
  head: () => ({ meta: [{ title: "Campus — EduAI Network" }] }),
  component: Campus,
});

function Campus() {
  const user = useStore((s) => s.user);
  const requests = useNetStore((s) => s.requests);
  const navigate = useNavigate();
  const [uid, setUid] = useState<string | null>(null);
  const [tab, setTab] = useState<"classmates" | "teachers">("classmates");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUid(user?.id ?? localStorage.getItem("eduai-current-userid"));
  }, [user]);

  const myReq = useMemo(
    () => requests.find((r) => uid && r.userId === uid && r.status === "approved") ?? requests.find((r) => r.status === "approved"),
    [requests, uid],
  );

  // If no approved request found at all, gate access
  useEffect(() => {
    if (uid === null) return; // still loading
    const anyApproved = requests.some((r) => r.status === "approved");
    if (!anyApproved) navigate({ to: "/network" });
  }, [uid, requests, navigate]);

  if (!myReq) {
    return (
      <div className="min-h-screen bg-[#050915] text-white grid place-items-center px-5">
        <div className="text-center max-w-sm">
          <p className="text-sm text-white/60">You need to be approved to enter campus.</p>
          <Link to="/network" className="mt-4 inline-block text-sm font-bold text-indigo-300 hover:underline">Back to portal</Link>
        </div>
      </div>
    );
  }

  const sectionSeed = `${myReq.university}-${myReq.course}-${myReq.year}-${myReq.section}`;
  const classmates = generateClassmates(sectionSeed);
  const teachers = teachersForCourse(myReq.course);

  return (
    <div className="min-h-screen bg-[#050915] text-white relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-fuchsia-500/15 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-5 py-6">
        <div className="flex items-center justify-between">
          <Link to="/network" className="inline-flex items-center gap-2 text-xs font-semibold text-white/70 hover:text-white">
            <ArrowLeft className="w-4 h-4" /> Portal
          </Link>
          <button onClick={() => { try { localStorage.removeItem("eduai-current-userid"); } catch {}; navigate({ to: "/network" }); }}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>

        {/* Identity card */}
        <div className="mt-5 rounded-3xl p-[1px] bg-gradient-to-br from-indigo-400/40 via-fuchsia-400/30 to-cyan-400/40">
          <div className="rounded-3xl bg-slate-950/80 backdrop-blur-xl p-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3" /> APPROVED
                </span>
                <h1 className="mt-2 text-2xl font-black tracking-tight">{myReq.fullName}</h1>
                <p className="text-xs text-white/60 mt-0.5">{myReq.university}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-white/50">EduAI Roll No.</p>
                <p className="mt-0.5 font-mono text-sm text-indigo-300 font-bold">{myReq.rollNumber ?? "—"}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <StatChip label="Course" value={myReq.course} />
              <StatChip label="Year" value={myReq.year.replace(" Year","")} />
              <StatChip label="Section" value={myReq.section} />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          {(["classmates","teachers"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`h-10 rounded-lg text-sm font-bold capitalize transition ${tab === t ? "bg-gradient-to-r from-indigo-500 to-fuchsia-600 shadow" : "text-white/60 hover:text-white"}`}>
              {t === "classmates" ? <><Users className="w-4 h-4 inline-block mr-1.5" />Classmates</> : <><GraduationCap className="w-4 h-4 inline-block mr-1.5" />Teachers</>}
            </button>
          ))}
        </div>

        {tab === "classmates" && (
          <section className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-black">Section {myReq.section}</h2>
                <p className="text-[11px] text-white/50">Only your section · No phone or email visible for safety</p>
              </div>
              <span className="text-xs text-white/50">{classmates.length} students</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {classmates.map((c) => (
                <Link
                  key={c.id}
                  to="/network/chat/$peerId"
                  params={{ peerId: c.id }}
                  className="group rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 hover:border-indigo-400/40 hover:bg-white/8 transition"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 grid place-items-center text-lg font-black">
                    {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <p className="mt-3 text-sm font-bold truncate">{c.name}</p>
                  <p className="text-[10px] text-white/50 font-mono">{c.rollNumber}</p>
                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300 opacity-0 group-hover:opacity-100 transition">
                    <MessageSquare className="w-3 h-3" /> Message
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {tab === "teachers" && (
          <section className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-black">Faculty · {myReq.course}</h2>
                <p className="text-[11px] text-white/50">Assigned to your course</p>
              </div>
              <span className="text-xs text-white/50">{teachers.length} faculty</span>
            </div>
            <div className="space-y-2">
              {teachers.map((t) => (
                <div key={t.id} className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4 flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/10 grid place-items-center">
                    <BookOpen className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{t.name}</p>
                    <p className="text-xs text-white/50">{t.subject} · {t.designation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <StudyBuddy />
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-2">
      <p className="text-[9px] uppercase tracking-widest text-white/50">{label}</p>
      <p className="mt-0.5 font-bold text-sm">{value}</p>
    </div>
  );
}
