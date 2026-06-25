import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BookOpen, FileText, Download, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatISTDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/student/materials")({
  head: () => ({ meta: [{ title: "Academic Modules — EduTrack" }] }),
  component: Materials,
});

interface Material {
  id: string;
  title: string;
  subject: string;
  module: string | null;
  course: string | null;
  description: string | null;
  file_url: string;
  created_at: string;
}

function Materials() {
  const [items, setItems] = useState<Material[] | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data, error } = await supabase
          .from("learning_materials")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (active) setItems((data ?? []) as Material[]);
      } catch (e) {
        console.warn(e);
        if (active) setItems([]);
        toast.error("Couldn't load study materials");
      }
    }
    load();
    const ch = supabase
      .channel("materials:student")
      .on("postgres_changes", { event: "*", schema: "public", table: "learning_materials" }, () => load())
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, []);

  const grouped = (items ?? []).reduce<Record<string, Material[]>>((acc, m) => {
    const key = m.subject || "General";
    (acc[key] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="pb-6">
      <header className="px-6 pt-10 pb-5">
        <h1 className="text-2xl font-black">Academic Modules</h1>
        <p className="text-sm text-muted-foreground mt-1">Subject-wise PPTs & study notes.</p>
      </header>

      <div className="px-5 space-y-5">
        {items === null && (
          <div className="rounded-2xl bg-surface shadow-soft p-8 grid place-items-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {items !== null && items.length === 0 && (
          <div className="rounded-2xl bg-surface shadow-soft p-8 text-center">
            <BookOpen className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No study material published yet.</p>
          </div>
        )}
        {Object.entries(grouped).map(([subject, list]) => (
          <section key={subject}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl gradient-primary text-primary-foreground grid place-items-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold">{subject}</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {list.length} {list.length === 1 ? "file" : "files"}
              </span>
            </div>
            <div className="space-y-2">
              {list.map((m) => (
                <a
                  key={m.id}
                  href={m.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-2xl bg-surface shadow-soft p-4 active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent text-primary grid place-items-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{m.title}</p>
                      {m.module && (
                        <p className="text-[11px] text-primary font-semibold mt-0.5">Module · {m.module}</p>
                      )}
                      {m.description && (
                        <p className="text-[12px] text-muted-foreground mt-1 line-clamp-2">{m.description}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{formatISTDate(m.created_at)}</p>
                    </div>
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-secondary grid place-items-center text-muted-foreground">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// Avoid TS warning for unused import
void Download;
