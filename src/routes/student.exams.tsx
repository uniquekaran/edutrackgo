import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { FileText, Download, BookOpenCheck, CloudDownload, Filter, Clock } from "lucide-react";
import { RouteSkeleton } from "@/components/RouteSkeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SYLLABUS_MODULE_TAG } from "@/lib/syllabus-subjects";

export const Route = createFileRoute("/student/exams")({
  head: () => ({ meta: [{ title: "Exam Portal & PYQs — EduTrack" }] }),
  pendingComponent: RouteSkeleton,
  component: ExamPortal,
});

interface Paper {
  title: string;      // shown on the card AND used to match the uploaded syllabus subject
  year: number;
  subject: string;
  stream: string;
}

// Card titles are aligned with SYLLABUS_SUBJECTS so admin uploads land here.
const PAPERS: Paper[] = [
  { title: "Engineering Mathematics", year: 2024, subject: "Mathematics", stream: "B.Tech" },
  { title: "Data Structures & Algorithms", year: 2024, subject: "Computer Science", stream: "B.Tech" },
  { title: "Operating Systems", year: 2023, subject: "Computer Science", stream: "B.Tech" },
  { title: "Digital Electronics", year: 2023, subject: "Electronics", stream: "B.Tech" },
  { title: "Database Management Systems", year: 2024, subject: "Computer Science", stream: "BCA" },
  { title: "Financial Accounting", year: 2024, subject: "Commerce", stream: "B.Com" },
  { title: "Microeconomics", year: 2023, subject: "Economics", stream: "BA" },
  { title: "Organic Chemistry", year: 2024, subject: "Chemistry", stream: "B.Sc" },
  { title: "Pharmaceutical Analysis", year: 2024, subject: "Pharma", stream: "B.Pharma" },
  { title: "Workshop Practice", year: 2023, subject: "Mechanical", stream: "Poly" },
];

const AKTU_SYLLABUS = "https://aktu.ac.in/syllabus.html";

const PATTERNS = [
  { title: "AKTU Official Syllabus Repository", url: AKTU_SYLLABUS },
  { title: "CBSE Class 12 — Latest Pattern 2025", url: "https://cbseacademic.nic.in/curriculum_2025.html" },
  { title: "UGC CBCS Framework", url: "https://www.ugc.gov.in/oldpdf/cbcs/B.Sc-Model-Curriculum.pdf" },
];

const STREAMS = ["All", "B.Tech", "BCA", "B.Sc", "B.Com", "BA", "B.Pharma", "Poly"];

function ExamPortal() {
  const [filter, setFilter] = useState("All");
  const [syllabusMap, setSyllabusMap] = useState<Record<string, string>>({});
  const visible = filter === "All" ? PAPERS : PAPERS.filter((p) => p.stream === filter);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase
        .from("learning_materials")
        .select("subject, file_url")
        .eq("module", SYLLABUS_MODULE_TAG);
      if (!active) return;
      const map: Record<string, string> = {};
      (data ?? []).forEach((r) => { if (r.subject && r.file_url) map[r.subject] = r.file_url; });
      setSyllabusMap(map);
    }
    load();
    const ch = supabase
      .channel("student:syllabus")
      .on("postgres_changes", { event: "*", schema: "public", table: "learning_materials" }, () => load())
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, []);

  const uploadedCount = useMemo(() => Object.keys(syllabusMap).length, [syllabusMap]);

  function downloadPaper(p: Paper) {
    const url = syllabusMap[p.title];
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.title}.pdf`;
    a.target = "_blank";
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Downloading ${p.title}…`);
  }

  return (
    <div className="pb-8">
      <header className="px-6 pt-10 pb-5 gradient-primary text-primary-foreground rounded-b-[2rem]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 grid place-items-center">
            <BookOpenCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black leading-tight">Exam Portal & PYQs</h1>
            <p className="text-[11px] opacity-90">
              {uploadedCount > 0
                ? `${uploadedCount} syllabus PDF${uploadedCount === 1 ? "" : "s"} available for download`
                : "Syllabi appear here as soon as your teacher uploads them"}
            </p>
          </div>
        </div>
      </header>

      <section className="px-5 -mt-6 mb-4">
        <div className="rounded-2xl glass-strong neon-border shadow-elevated p-3">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filter stream</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STREAMS.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition ${
                  filter === s ? "gradient-primary text-primary-foreground shadow-soft" : "bg-secondary text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Previous Year Questions & Syllabi</h2>
        <div className="space-y-2.5">
          {visible.map((p) => {
            const available = !!syllabusMap[p.title];
            return (
              <button
                key={p.title + p.year}
                onClick={() => available ? downloadPaper(p) : toast.info("Syllabus will appear here once your teacher uploads it.")}
                disabled={!available}
                className={`w-full text-left rounded-2xl glass shadow-soft p-3.5 flex items-start gap-3 transition ${
                  available ? "active:scale-[0.99]" : "opacity-70 cursor-not-allowed"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${
                  available ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-tight truncate">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {p.stream} · {p.subject} · {p.year}
                  </p>
                </div>
                {available ? (
                  <div className="flex items-center gap-1 text-primary shrink-0 mt-1.5">
                    <Download className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Download</span>
                  </div>
                ) : (
                  <span className="shrink-0 mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                    <Clock className="w-3 h-3" /> Pending Upload
                  </span>
                )}
              </button>
            );
          })}
          {visible.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-6">No papers for this stream yet.</p>
          )}
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Latest exam patterns</h2>
        <div className="space-y-2.5">
          {PATTERNS.map((p) => (
            <a
              key={p.title}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-left rounded-2xl glass shadow-soft p-3.5 flex items-center gap-3 active:scale-[0.99] transition"
            >
              <div className="w-10 h-10 rounded-xl bg-accent text-primary grid place-items-center shrink-0">
                <CloudDownload className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight truncate">{p.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Official model paper</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
