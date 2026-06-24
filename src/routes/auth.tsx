import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, GraduationCap, Mail, Lock, User as UserIcon, ShieldCheck } from "lucide-react";
import { signIn, type Role } from "@/lib/store";
import { toast } from "sonner";
import { MobileShell } from "@/components/MobileShell";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — EduTrack" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }
    if (mode === "signup" && !name) {
      toast.error("Please enter your name");
      return;
    }
    const u = signIn({ name, email, password, role, isSignup: mode === "signup" });
    toast.success(`Welcome${mode === "signup" ? "" : " back"}, ${u.name.split(" ")[0]}!`);
    navigate({ to: u.role === "admin" ? "/admin" : "/student" });
  }

  return (
    <MobileShell>
      <div className="px-6 pt-10 pb-6 gradient-primary text-primary-foreground">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm opacity-90">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="mt-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/15 grid place-items-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black">EduTrack</h1>
        </div>
        <h2 className="mt-6 text-3xl font-black">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>
        <p className="mt-1 text-sm opacity-90">
          {mode === "login" ? "Sign in to continue to your dashboard." : "Join your campus in under a minute."}
        </p>
      </div>

      <div className="flex-1 px-6 -mt-6">
        <div className="rounded-3xl bg-surface shadow-soft p-5">
          <div className="grid grid-cols-2 bg-secondary rounded-xl p-1 mb-5">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`h-10 rounded-lg text-sm font-bold transition-all ${
                  mode === m ? "bg-surface shadow-soft text-foreground" : "text-muted-foreground"
                }`}
              >
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <Field icon={<UserIcon className="w-4 h-4" />} label="Full Name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aria Mehta"
                  className="w-full bg-transparent outline-none text-sm font-medium"
                />
              </Field>
            )}
            <Field icon={<Mail className="w-4 h-4" />} label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="w-full bg-transparent outline-none text-sm font-medium"
              />
            </Field>
            <Field icon={<Lock className="w-4 h-4" />} label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent outline-none text-sm font-medium"
              />
            </Field>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Role</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <RoleCard active={role === "student"} onClick={() => setRole("student")} icon={<GraduationCap className="w-5 h-5" />} label="Student" />
                <RoleCard active={role === "admin"} onClick={() => setRole("admin")} icon={<ShieldCheck className="w-5 h-5" />} label="Administrator" />
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 w-full h-13 py-3.5 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elevated active:scale-[0.98] transition-transform"
            >
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Try <span className="font-semibold text-foreground">aria@college.edu</span> (student) or <span className="font-semibold text-foreground">dean@college.edu</span> (admin)
          </p>
        </div>
      </div>
    </MobileShell>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1.5 flex items-center gap-2.5 px-3.5 h-12 rounded-xl bg-secondary border border-transparent focus-within:border-primary focus-within:bg-surface transition-all">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}

function RoleCard({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${
        active ? "border-primary bg-accent text-primary" : "border-border bg-surface text-muted-foreground"
      }`}
    >
      {icon}
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}
