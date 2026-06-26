import { Link } from "@tanstack/react-router";
import { LayoutDashboard, FileText, Megaphone, BookOpen, User } from "lucide-react";

export function BottomNav() {
  const items = [
    { to: "/student" as const, label: "Home", icon: LayoutDashboard, exact: true },
    { to: "/student/materials" as const, label: "Learn", icon: BookOpen },
    { to: "/student/documents" as const, label: "Docs", icon: FileText },
    { to: "/student/announcements" as const, label: "Notice", icon: Megaphone },
    { to: "/student/profile" as const, label: "Me", icon: User },
  ];
  return (
    <nav className="sticky bottom-0 z-30 glass-strong border-t border-border px-1 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: it.exact }}
              className="group relative flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl text-muted-foreground data-[status=active]:text-primary transition-colors duration-200 active:scale-95"
            >
              {/* gradient pill behind active */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-1 rounded-2xl opacity-0 scale-75 gradient-primary blur-md group-data-[status=active]:opacity-30 group-data-[status=active]:scale-100 transition-all duration-300"
              />
              <span className="relative grid place-items-center w-9 h-9 rounded-2xl transition-all duration-300 group-data-[status=active]:bg-accent group-data-[status=active]:shadow-soft group-data-[status=active]:-translate-y-0.5 group-active:scale-90">
                <Icon className="w-[18px] h-[18px] transition-transform duration-300 group-data-[status=active]:scale-110" />
              </span>
              <span className="text-[10px] font-semibold tracking-wide transition-all">
                {it.label}
              </span>
              <span
                aria-hidden
                className="absolute -bottom-0.5 left-1/2 w-1 h-1 rounded-full bg-primary opacity-0 group-data-[status=active]:opacity-100"
                style={{ transform: "translateX(-50%)" }}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
