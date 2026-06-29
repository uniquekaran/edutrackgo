import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Send, Bot, User as UserIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { RouteSkeleton } from "@/components/RouteSkeleton";

export const Route = createFileRoute("/student/eduai")({
  head: () => ({ meta: [{ title: "EduAI Assistant — EduTrack" }] }),
  pendingComponent: RouteSkeleton,
  component: EduAIPage,
});

interface Msg { id: string; role: "user" | "ai"; text: string; ts: number }

const SUGGESTIONS = [
  "Daily study tips for me",
  "Build a roadmap for next 30 days",
  "Career options after my course",
  "How to score high in internals",
  "Best free resources for my stream",
];

function generateReply(prompt: string, course: string): string {
  const c = course || "your stream";
  const p = prompt.toLowerCase();

  if (/roadmap|plan|30 day|schedule/.test(p)) {
    return `Here's a focused 30-day roadmap for ${c}:\n\n• Week 1 — revisit fundamentals; 1h theory + 1h problem-solving daily.\n• Week 2 — pick 2 core subjects, build a small project around each.\n• Week 3 — past-paper drills (PYQs), timed mocks every alternate day.\n• Week 4 — full syllabus revision, weak-topic loop, mock test x3.\n\nTip: end each day with a 5-min written recap. Retention spikes ~30%.`;
  }
  if (/career|job|placement|after/.test(p)) {
    return `Career directions for ${c}:\n\n1. Core industry roles aligned with your major.\n2. Adjacent roles — data, product, research, public sector.\n3. Higher studies — GATE / GRE / CAT depending on goal.\n\nStart by listing 3 dream companies, reverse-engineer their JDs, and map skills you need by month-end.`;
  }
  if (/tip|study|focus|motivation/.test(p)) {
    return `Daily study tips:\n\n• Use the 50/10 rule — 50 min deep work, 10 min walk.\n• Active recall > re-reading. Close the book, write what you remember.\n• Sleep 7h+; memory consolidates only when you rest.\n• One "hard topic" before noon, easy revision at night.`;
  }
  if (/internal|exam|score|marks/.test(p)) {
    return `To top your internals:\n\n• Map the syllabus to the weightage chart and front-load high-weight units.\n• Solve last 5 years PYQs from the Exam Portal — patterns repeat ~40%.\n• Make a one-page formula/keyword sheet per unit. Revise it 3x before the exam.`;
  }
  if (/resource|book|free|course/.test(p)) {
    return `Free quality resources for ${c}:\n\n• NPTEL & SWAYAM (govt of India, certificate-eligible)\n• MIT OCW & Stanford Online for advanced topics\n• YouTube — Gate Smashers, NESO Academy, Khan Academy\n• Open syllabus PDFs are in the Exam Portal tab.`;
  }
  return `Got it — "${prompt}". Based on ${c}, here's my take:\n\nBreak this into a 3-step action: (1) Identify the exact sub-topic, (2) spend 25 minutes on focused practice, (3) write a 3-line summary. Ask me to expand any step and I'll detail it for you.`;
}

function EduAIPage() {
  const maybeUser = useStore((s) => s.user);
  const [course, setCourse] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!maybeUser) return;
    let active = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("student_profiles_detail")
          .select("course")
          .eq("user_id", maybeUser.id)
          .maybeSingle();
        if (active && data?.course) setCourse(data.course);
      } catch (e) { console.warn(e); }
    })();
    return () => { active = false; };
  }, [maybeUser]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "ai",
        ts: Date.now(),
        text: `Hey! I'm EduAI 👋 — your study companion${course ? ` for ${course}` : ""}. Ask me anything academic: roadmaps, doubts, exam strategy, or career paths.`,
      }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  function send(prompt?: string) {
    const value = (prompt ?? text).trim();
    if (!value || thinking) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text: value, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setText("");
    setThinking(true);
    const reply = generateReply(value, course);
    const delay = 500 + Math.min(1200, reply.length * 6);
    setTimeout(() => {
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "ai", text: reply, ts: Date.now() }]);
      setThinking(false);
    }, delay);
  }

  const greeting = useMemo(() => course ? `Tuned for ${course}` : "Personalised to your profile", [course]);

  if (!maybeUser) return null;

  return (
    <div className="flex flex-col h-[100dvh] md:h-auto md:min-h-[80vh] pb-2">
      <header className="px-6 pt-10 pb-5 gradient-primary text-primary-foreground rounded-b-[2rem]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 grid place-items-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight">EduAI Assistant</h1>
            <p className="text-[11px] opacity-90">{greeting}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "ai" && (
              <div className="w-8 h-8 rounded-xl gradient-primary text-primary-foreground grid place-items-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap shadow-soft ${
              m.role === "user"
                ? "gradient-primary text-primary-foreground rounded-tr-md"
                : "glass-strong rounded-tl-md"
            }`}>
              {m.text}
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-accent text-primary grid place-items-center shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2 justify-start">
            <div className="w-8 h-8 rounded-xl gradient-primary text-primary-foreground grid place-items-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="glass-strong rounded-2xl rounded-tl-md px-3.5 py-3 shadow-soft">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "120ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "240ms" }} />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full glass border border-primary/20 hover:bg-accent/40 transition"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="px-3 pb-3 pt-2">
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-center gap-2 rounded-2xl glass-strong neon-border p-1.5"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask EduAI anything academic…"
            className="flex-1 h-11 px-3 bg-transparent outline-none text-sm font-medium"
          />
          <button
            type="submit"
            disabled={thinking || !text.trim()}
            className="w-11 h-11 rounded-xl gradient-primary text-primary-foreground grid place-items-center disabled:opacity-50 active:scale-90 transition"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
