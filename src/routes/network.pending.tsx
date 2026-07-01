import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { useNetStore, myRequest } from "@/lib/network-state";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/network/pending")({
  head: () => ({ meta: [{ title: "Approval Pending — EduAI Network" }] }),
  component: Pending,
});

function Pending() {
  const user = useStore((s) => s.user);
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setUid(user?.id ?? localStorage.getItem("eduai-current-userid"));
  }, [user]);

  const req = useNetStore((s) => (uid ? s.requests.find((r) => r.userId === uid) : undefined));
  const anyReq = uid ? myRequest(uid) : undefined;
  const r = req ?? anyReq;

  return (
    <div className="min-h-screen bg-[#050915] text-white flex items-center justify-center px-5 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[36rem] h-[36rem] rounded-full bg-amber-500/15 blur-[120px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-8 text-center shadow-2xl">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center shadow-xl">
            <Clock className="w-10 h-10 text-white animate-pulse" />
          </div>
          <h1 className="mt-6 text-3xl font-black tracking-tight">Approval Pending</h1>
          <p className="mt-3 text-white/70 leading-relaxed">
            Your request is at the <span className="text-white font-semibold">University Admin desk</span>.
            You'll gain campus access as soon as your receipt is verified.
          </p>

          {r && (
            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4 text-left text-sm space-y-1">
              <Row k="Name" v={r.fullName} />
              <Row k="University" v={r.university} />
              <Row k="Course" v={`${r.course} · ${r.year} · Sec ${r.section}`} />
              <Row k="Submitted" v={new Date(r.createdAt).toLocaleString("en-IN")} />
              <Row k="Status" v={
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  r.status === "approved" ? "bg-emerald-500/20 text-emerald-300"
                  : r.status === "rejected" ? "bg-rose-500/20 text-rose-300"
                  : "bg-amber-500/20 text-amber-300"
                }`}>{r.status.toUpperCase()}</span>
              } />
              {r.status === "rejected" && r.rejectionReason && (
                <p className="text-xs text-rose-300/80 pt-1">Reason: {r.rejectionReason}</p>
              )}
            </div>
          )}

          <div className="mt-6 space-y-3">
            {r?.status === "approved" ? (
              <Link to="/network/campus" className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 font-bold shadow-lg">
                <ShieldCheck className="w-5 h-5" /> Enter campus <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <button onClick={() => location.reload()} className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-white/10 border border-white/10 font-semibold text-sm">
                <RefreshCw className="w-4 h-4" /> Refresh status
              </button>
            )}
            <Link to="/network" className="block text-xs text-white/50 hover:text-white/80">Back to portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/50 text-xs uppercase tracking-widest">{k}</span>
      <span className="text-white/90 font-medium text-right">{v}</span>
    </div>
  );
}
