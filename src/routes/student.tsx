import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { MobileShell } from "@/components/MobileShell";
import { store } from "@/lib/store";

export const Route = createFileRoute("/student")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    const u = store.get().user;
    if (!u) throw redirect({ to: "/auth" });
    if (u.role !== "student") throw redirect({ to: "/admin" });
  },
  component: StudentLayout,
});

function StudentLayout() {
  return (
    <MobileShell>
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
      <BottomNav />
    </MobileShell>
  );
}
