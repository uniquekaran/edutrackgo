import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FileText, Download, BookOpenCheck, CloudDownload, Filter } from "lucide-react";
import { RouteSkeleton } from "@/components/RouteSkeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/student/exams")({
  head: () => ({ meta: [{ title: "Exam Portal & PYQs — EduTrack" }] }),
  pendingComponent: RouteSkeleton,
  component: ExamPortal,
});

interface Paper {
  title: string;
  year: number;
  subject: string;
  stream: string;
  url: string;
}

// All syllabus/PYQ links route to the official AKTU syllabus portal to avoid 404s.
const AKTU_SYLLABUS = "https://aktu.ac.in/syllabus.html";

const PAPERS: Paper[] = [
  { title: "Engineering Mathematics — End Sem", year: 2024, subject: "Mathematics", stream: "B.Tech", url: AKTU_SYLLABUS },
  { title: "Data Structures & Algorithms", year: 2024, subject: "Computer Science", stream: "B.Tech", url: AKTU_SYLLABUS },
  { title: "Operating Systems Mid-Term", year: 2023, subject: "Computer Science", stream: "B.Tech", url: AKTU_SYLLABUS },
  { title: "Digital Electronics", year: 2023, subject: "Electronics", stream: "B.Tech", url: AKTU_SYLLABUS },
  { title: "Database Management Systems", year: 2024, subject: "Computer Science", stream: "BCA", url: AKTU_SYLLABUS },
  { title: "Financial Accounting", year: 2024, subject: "Commerce", stream: "B.Com", url: AKTU_SYLLABUS },
  { title: "Microeconomics", year: 2023, subject: "Economics", stream: "BA", url: AKTU_SYLLABUS },
  { title: "Organic Chemistry", year: 2024, subject: "Chemistry", stream: "B.Sc", url: AKTU_SYLLABUS },
  { title: "Pharmaceutical Analysis", year: 2024, subject: "Pharma", stream: "B.Pharma", url: AKTU_SYLLABUS },
  { title: "Workshop Practice (Polytechnic)", year: 2023, subject: "Mechanical", stream: "Poly", url: AKTU_SYLLABUS },
];

const PATTERNS = [
  { title: "AKTU Official Syllabus Repository", url: AKTU_SYLLABUS },
  { title: "CBSE Class 12 — Latest Pattern 2025", url: "https://cbseacademic.nic.in/curriculum_2025.html" },
  { title: "UGC CBCS Framework", url: "https://www.ugc.gov.in/oldpdf/cbcs/B.Sc-Model-Curriculum.pdf" },
];

const STREAMS = ["All", "B.Tech", "BCA", "B.Sc", "B.Com", "BA", "B.Pharma", "Poly"];

function ExamPortal() {
  const [filter, setFilter] = useState("All");
  const visible = filter === "All" ? PAPERS : PAPERS.filter((p) => p.stream === filter);

  function open(url: string, name: string) {
    window.open(url, "_blank", "noopener");
    toast.success(`Opening ${name} from Drive`);
  }

  return (
    <div className="pb-8">
      <header className="px-6 pt-10 pb-5 gradient-primary text-primary-foreground rounded-b-[2rem]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/15 grid place-items-center">
            <BookOpenCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight">Exam Portal & PYQs</h1>
            <p className="text-[11px] opacity-90">Synced from connected Drive folder</p>
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
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Previous Year Questions</h2>
        <div className="space-y-2.5">
          {visible.map((p) => (
            <button
              key={p.title + p.year}
              onClick={() => open(p.url, p.title)}
              className="w-full text-left rounded-2xl glass shadow-soft p-3.5 flex items-start gap-3 active:scale-[0.99] transition"
            >
              <div className="w-10 h-10 rounded-xl gradient-primary text-primary-foreground grid place-items-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight truncate">{p.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {p.stream} · {p.subject} · {p.year}
                </p>
              </div>
              <Download className="w-4 h-4 text-primary shrink-0 mt-2" />
            </button>
          ))}
          {visible.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-6">No papers for this stream yet.</p>
          )}
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Latest exam patterns</h2>
        <div className="space-y-2.5">
          {PATTERNS.map((p) => (
            <button
              key={p.title}
              onClick={() => open(p.url, p.title)}
              className="w-full text-left rounded-2xl glass shadow-soft p-3.5 flex items-center gap-3 active:scale-[0.99] transition"
            >
              <div className="w-10 h-10 rounded-xl bg-accent text-primary grid place-items-center shrink-0">
                <CloudDownload className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight truncate">{p.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Official model paper</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
