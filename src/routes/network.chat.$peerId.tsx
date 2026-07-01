import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Flag, Send, Shield } from "lucide-react";
import { useStore } from "@/lib/store";
import { useNetStore, sendMessage, reportMessage } from "@/lib/network-state";
import { generateClassmates } from "@/lib/network-data";
import { toast } from "sonner";

export const Route = createFileRoute("/network/chat/$peerId")({
  head: () => ({ meta: [{ title: "Chat — EduAI Network" }] }),
  component: ChatRoute,
});

function ChatRoute() {
  const { peerId } = useParams({ from: "/network/chat/$peerId" });
  const user = useStore((s) => s.user);
  const [uid, setUid] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setUid(user?.id ?? localStorage.getItem("eduai-current-userid"));
  }, [user]);

  const requests = useNetStore((s) => s.requests);
  const allMessages = useNetStore((s) => s.messages);
  const myReq = useMemo(
    () => requests.find((r) => uid && r.userId === uid && r.status === "approved") ?? requests.find((r) => r.status === "approved"),
    [requests, uid],
  );

  const peer = useMemo(() => {
    if (!myReq) return null;
    const seed = `${myReq.university}-${myReq.course}-${myReq.year}-${myReq.section}`;
    return generateClassmates(seed).find((c) => c.id === peerId) ?? null;
  }, [myReq, peerId]);

  const thread = useMemo(() => {
    if (!uid) return [];
    return allMessages
      .filter((m) => (m.fromId === uid && m.toId === peerId) || (m.fromId === peerId && m.toId === uid))
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [allMessages, uid, peerId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread]);

  // Simulate peer auto-reply once on first message
  useEffect(() => {
    if (!uid || !peer) return;
    if (thread.length === 1 && thread[0].fromId === uid) {
      const t = setTimeout(() => {
        sendMessage(peerId, uid, "Hey! 👋 What's up?");
      }, 1400);
      return () => clearTimeout(t);
    }
  }, [thread, uid, peerId, peer]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!uid || !text.trim()) return;
    sendMessage(uid, peerId, text);
    setText("");
  }

  if (!peer) {
    return (
      <div className="min-h-screen bg-[#050915] text-white grid place-items-center px-5">
        <div className="text-center">
          <p className="text-sm text-white/60">Classmate not found.</p>
          <Link to="/network/campus" className="mt-4 inline-block text-sm font-bold text-indigo-300 hover:underline">Back to campus</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050915] text-white flex flex-col">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] rounded-full bg-indigo-600/15 blur-[120px]" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
          <Link to="/network/campus" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 grid place-items-center hover:bg-white/10">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 grid place-items-center font-black">
            {peer.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{peer.name}</p>
            <p className="text-[10px] text-white/50 font-mono">{peer.rollNumber}</p>
          </div>
          <button onClick={() => setReportOpen(true)} className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20">
            <Flag className="w-3.5 h-3.5" /> Report
          </button>
        </div>
      </header>

      <div className="flex-1 relative z-10 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-4 space-y-2">
          <div className="mx-auto max-w-md rounded-2xl bg-white/5 border border-white/10 p-3 text-[11px] text-white/60 text-center">
            <Shield className="w-3.5 h-3.5 inline-block mr-1 text-indigo-300" />
            Chats stay inside your section. Personal contact info is hidden for safety.
          </div>

          {thread.map((m) => {
            const mine = m.fromId === uid;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-[13px] shadow ${
                  mine ? "bg-gradient-to-br from-indigo-500 to-fuchsia-600 rounded-tr-md"
                  : "bg-white/8 border border-white/10 rounded-tl-md"
                } ${m.reported ? "ring-2 ring-rose-500/50" : ""}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[9px] mt-1 ${mine ? "text-white/60" : "text-white/40"}`}>
                    {new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    {m.reported && " · reported"}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      <form onSubmit={submit} className="relative z-10 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-2xl px-3 py-3 flex items-center gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message…"
            className="flex-1 h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-sm placeholder:text-white/40 outline-none focus:border-indigo-400" />
          <button type="submit" disabled={!text.trim()}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-600 grid place-items-center disabled:opacity-40 active:scale-95 transition">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {reportOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={() => setReportOpen(false)}>
          <div className="bg-slate-900 rounded-2xl border border-white/10 p-5 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-black">Report {peer.name}?</h3>
            <p className="mt-1 text-xs text-white/60">This flags the recent conversation for admin review. Their profile stays visible until action is taken.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setReportOpen(false)} className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold">Cancel</button>
              <button onClick={() => {
                thread.filter((m) => m.fromId === peerId).slice(-5).forEach((m) => reportMessage(m.id));
                toast.error(`Reported ${peer.name}. Admin will review.`);
                setReportOpen(false);
              }} className="flex-1 h-11 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-sm font-bold">Report user</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
