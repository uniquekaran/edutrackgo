import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/student/announcements")({
  head: () => ({ meta: [{ title: "Announcements — EduTrack" }] }),
  component: Announcements,
});

function Announcements() {
  const list = useStore((s) => s.announcements);
  return (
    <div className="pb-6">
      <header className="px-6 pt-10 pb-5">
        <h1 className="text-2xl font-black">Noticeboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Live updates from administration.</p>
      </header>
      <div className="px-5 space-y-3">
        {list.length === 0 && (
          <div className="rounded-2xl bg-surface shadow-soft p-8 text-center">
            <Megaphone className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No announcements yet.</p>
          </div>
        )}
        {list.map((a) => (
          <article key={a.id} className="rounded-2xl bg-surface shadow-soft p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center shrink-0">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold">{a.title}</h3>
                <p className="text-xs text-muted-foreground">{a.authorName} · {new Date(a.createdAt).toLocaleString()}</p>
                <p className="mt-2 text-sm leading-relaxed">{a.body}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
