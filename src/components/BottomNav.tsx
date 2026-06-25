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
    <nav className="sticky bottom-0 z-30 bg-surface/95 backdrop-blur border-t border-border px-1 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: it.exact }}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl text-muted-foreground data-[status=active]:text-primary data-[status=active]:bg-accent transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
