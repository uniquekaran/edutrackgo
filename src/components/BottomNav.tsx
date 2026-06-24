import { Link } from "@tanstack/react-router";
import { LayoutDashboard, FileText, Megaphone, LogOut } from "lucide-react";
import { signOut } from "@/lib/store";
import { useNavigate } from "@tanstack/react-router";

export function BottomNav() {
  const navigate = useNavigate();
  const items = [
    { to: "/student" as const, label: "Home", icon: LayoutDashboard, exact: true },
    { to: "/student/documents" as const, label: "Docs", icon: FileText },
    { to: "/student/announcements" as const, label: "Notice", icon: Megaphone },
  ];
  return (
    <nav className="sticky bottom-0 z-30 bg-surface/95 backdrop-blur border-t border-border px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              activeOptions={{ exact: it.exact }}
              className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-muted-foreground data-[status=active]:text-primary data-[status=active]:bg-accent transition-colors"
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-semibold">{it.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => { signOut(); navigate({ to: "/auth" }); }}
          className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Exit</span>
        </button>
      </div>
    </nav>
  );
}
