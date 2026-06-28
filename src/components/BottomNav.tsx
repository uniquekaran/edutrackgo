import { Link } from "@tanstack/react-router";
import { LayoutDashboard, ShieldCheck, ScrollText, BookOpen, User } from "lucide-react";

export function BottomNav() {
  const items = [
    { to: "/student" as const, label: "Home", icon: LayoutDashboard, exact: true },
    { to: "/student/vault" as const, label: "Vault", icon: ShieldCheck },
    { to: "/student/noc" as const, label: "NOC", icon: ScrollText },
    { to: "/student/materials" as const, label: "Learn", icon: BookOpen },
    { to: "/student/profile" as const, label: "Me", icon: User },
  ];
  return (
    <nav className="sticky bottom-0 z-30 mx-2 mb-2 rounded-3xl glass-strong neon-border px-1 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: it.exact }}
              className="group relative flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-2xl text-muted-foreground data-[status=active]:text-primary transition-colors duration-200 active:scale-95"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-1 rounded-2xl opacity-0 scale-75 gradient-primary blur-xl group-data-[status=active]:opacity-40 group-data-[status=active]:scale-110 transition-all duration-500"
              />
              <span className="relative grid place-items-center w-10 h-10 rounded-2xl transition-all duration-300 group-data-[status=active]:gradient-primary group-data-[status=active]:text-primary-foreground group-data-[status=active]:halo-glow group-data-[status=active]:-translate-y-1 group-data-[status=active]:scale-110 group-active:scale-90">
                <Icon className="w-[18px] h-[18px] transition-transform duration-300" />
              </span>
              <span className="text-[10px] font-semibold tracking-wide transition-all">
                {it.label}
              </span>
              <span
                aria-hidden
                className="absolute -bottom-0.5 left-1/2 w-1.5 h-1.5 rounded-full bg-primary-glow opacity-0 group-data-[status=active]:opacity-100 shadow-[0_0_8px_var(--color-primary-glow)]"
                style={{ transform: "translateX(-50%)" }}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
