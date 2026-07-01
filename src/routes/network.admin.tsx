import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, X, Eye, ShieldCheck, Search, Inbox } from "lucide-react";
import { useNetStore, approveRequest, rejectRequest, type EnrollmentRequest } from "@/lib/network-state";
import { toast } from "sonner";

export const Route = createFileRoute("/network/admin")({
  head: () => ({ meta: [{ title: "Admin Console — EduAI Network" }] }),
  component: AdminConsole,
});

function AdminConsole() {
  const requests = useNetStore((s) => s.requests);
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<EnrollmentRequest | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchesFilter = filter === "all" || r.status === filter;
      const matchesQ = q.trim().length === 0 || `${r.fullName} ${r.email} ${r.university}`.toLowerCase().includes(q.toLowerCase());
      return matchesFilter && matchesQ;
    });
  }, [requests, q, filter]);

  const counts = useMemo(() => ({
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  }), [requests]);

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
          <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-fuchsia-500/15 text-fuchsia-200 border border-fuchsia-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin · Clerk
          </span>
        </div>

        <h1 className="mt-6 text-3xl md:text-4xl font-black tracking-tight">Enrollment Approvals</h1>
        <p className="text-sm text-white/60">Review student requests, preview receipts, approve or reject.</p>

        {/* KPIs */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <KPI label="Pending" value={counts.pending} tone="amber" onClick={() => setFilter("pending")} active={filter === "pending"} />
          <KPI label="Approved" value={counts.approved} tone="emerald" onClick={() => setFilter("approved")} active={filter === "approved"} />
          <KPI label="Rejected" value={counts.rejected} tone="rose" onClick={() => setFilter("rejected")} active={filter === "rejected"} />
        </div>

        {/* Search */}
        <div className="mt-5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, or university…"
            className="w-full h-11 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-white/40 outline-none focus:border-fuchsia-400" />
        </div>

        {/* Table */}
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

function KPI({ label, value, tone, onClick, active }: { label: string; value: number; tone: "amber" | "emerald" | "rose"; onClick: () => void; active: boolean }) {
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
