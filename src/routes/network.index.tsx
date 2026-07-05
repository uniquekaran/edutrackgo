import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, ShieldCheck, ArrowRight, Sparkles, Users, ArrowLeft, BookOpen } from "lucide-react";

export const Route = createFileRoute("/network/")({
  head: () => ({
    meta: [
      { title: "EduAI Network — Choose your portal" },
      { name: "description", content: "The multi-tenant university network with AI-powered study help." },
    ],
  }),
  component: NetworkLanding,
});

function NetworkLanding() {
  return (
    <div className="min-h-screen w-full bg-[#050915] text-white relative overflow-hidden">
      {/* aurora bg */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[36rem] h-[36rem] rounded-full bg-indigo-600/30 blur-[120px]" />
        <div className="absolute -bottom-40 -right-32 w-[36rem] h-[36rem] rounded-full bg-fuchsia-500/20 blur-[120px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[28rem] h-[28rem] rounded-full bg-cyan-400/10 blur-[120px]" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col md:grid md:grid-cols-2">
        {/* Left: brand */}
        <section className="p-8 md:p-14 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur hover:bg-white/15 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 grid place-items-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-70">Multi-tenant</p>
              <h1 className="text-lg font-black">EduAI Network</h1>
            </div>
          </div>

          <div className="mt-10 md:mt-0">
            <h2 className="text-4xl md:text-6xl font-black leading-[1.02] tracking-tight">
              One login.<br />
              <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                Every campus.
              </span>
            </h2>
            <p className="mt-5 max-w-md text-white/70 leading-relaxed">
              Join your university's private network. Chat with your classmates, learn from your teachers,
              and study with an AI tutor trained on UP Board, NDA, and university curriculum.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              <Chip>🎓 Section-isolated rosters</Chip>
              <Chip>🔒 Zero personal data leaks</Chip>
              <Chip>🤖 Gemini AI tutor</Chip>
            </div>
          </div>

          <p className="hidden md:block text-xs text-white/40 mt-10">© EduAI · A safer campus network</p>
        </section>

        {/* Right: portal cards */}
        <section className="p-8 md:p-14 flex items-center">
          <div className="w-full max-w-md mx-auto space-y-4">
            <PortalCard
              to="/network/register"
              icon={<GraduationCap className="w-6 h-6" />}
              tag="Student"
              title="Apply to join your campus"
              body="Pick your university, course, year & section. Upload your admission fee receipt to get verified by your college."
              gradient="from-indigo-500 to-blue-600"
            />
            <PortalCard
              to="/network/teacher"
              icon={<BookOpen className="w-6 h-6" />}
              tag="Teacher · Faculty"
              title="Upload syllabus & PYQs"
              body="Publish PDFs by subject. Students see the download instantly in their Exam Portal — no admin overlap."
              gradient="from-emerald-500 to-cyan-500"
            />
            <PortalCard
              to="/network/admin"
              icon={<ShieldCheck className="w-6 h-6" />}
              tag="Admin · Clerk"
              title="Review pending enrollments"
              body="Approve or reject student requests. Preview uploaded receipts and grant campus access."
              gradient="from-fuchsia-500 to-rose-500"
            />
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 grid place-items-center">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Already approved?</p>
                <p className="text-xs text-white/60">Jump straight to your campus dashboard.</p>
              </div>
              <Link
                to="/network/campus"
                className="text-xs font-bold px-3 py-2 rounded-lg bg-white text-slate-900 hover:bg-white/90 transition"
              >
                Enter
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/8 border border-white/10 backdrop-blur">
      {children}
    </span>
  );
}

function PortalCard({
  to, icon, tag, title, body, gradient,
}: {
  to: string; icon: React.ReactNode; tag: string; title: string; body: string; gradient: string;
}) {
  return (
    <Link
      to={to}
      className="group relative block rounded-3xl p-[1px] bg-gradient-to-br from-white/20 to-white/5 hover:from-white/40 transition"
    >
      <div className="rounded-3xl bg-slate-950/70 backdrop-blur-xl p-6 relative overflow-hidden">
        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br ${gradient} opacity-30 blur-2xl group-hover:opacity-50 transition`} />
        <div className="relative flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} grid place-items-center text-white shadow-lg`}>
            {icon}
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-white/60 font-bold">{tag}</span>
        </div>
        <h3 className="relative mt-4 text-xl font-black tracking-tight">{title}</h3>
        <p className="relative mt-2 text-sm text-white/70 leading-relaxed">{body}</p>
        <div className="relative mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white/90 group-hover:gap-3 transition-all">
          Continue <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}
