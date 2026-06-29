import { useEffect, useState } from "react";
import { FileSpreadsheet, Loader2, X, GraduationCap, CloudDownload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/lib/store";
import { COURSE_OPTIONS, COURSE_SYLLABUS } from "@/lib/colleges";
import { toast } from "sonner";

/**
 * Smart syllabus button — reads student's active course from
 * `student_profiles_detail`. If empty, opens a glass modal asking for
 * the target course, persists it, then opens the corresponding PDF
 * (simulated as fetched from the connected Google Drive folder).
 */
export function SyllabusButton({ className = "" }: { className?: string }) {
  const user = useStore((s) => s.user);
  const [course, setCourse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      try {
        const { data } = await supabase
          .from("student_profiles_detail")
          .select("course")
          .eq("user_id", user.id)
          .maybeSingle();
        if (active && data?.course) setCourse(data.course);
      } catch (e) { console.warn(e); }
    })();
    return () => { active = false; };
  }, [user]);

  async function fetchFromDrive(c: string) {
    setLoading(true);
    try {
      const url = COURSE_SYLLABUS[c] ?? COURSE_SYLLABUS.Other;
      // Simulated Google Drive fetch latency
      await new Promise((r) => setTimeout(r, 450));
      window.open(url, "_blank", "noopener");
      toast.success(`Fetched ${c} syllabus from Drive`);
    } finally {
      setLoading(false);
    }
  }

  async function handleClick() {
    if (course) {
      void fetchFromDrive(course);
      return;
    }
    setPick("");
    setOpen(true);
  }

  async function confirm() {
    if (!pick || !user) return;
    setLoading(true);
    try {
      await supabase
        .from("student_profiles_detail")
        .upsert({ user_id: user.id, course: pick }, { onConflict: "user_id" });
      setCourse(pick);
      setOpen(false);
      await fetchFromDrive(pick);
    } catch (e) {
      console.warn(e);
      toast.error("Could not save your course");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`group relative overflow-hidden rounded-2xl gradient-primary text-primary-foreground p-3 active:scale-[0.97] transition-transform halo-glow text-left disabled:opacity-70 ${className}`}
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CloudDownload className="w-5 h-5" />}
        <p className="mt-2 text-[12px] font-black leading-tight">Download Syllabus</p>
        <p className="text-[9px] opacity-80 mt-0.5">
          {course ? `${course} · via Drive` : "Tap to set course"}
        </p>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center p-5 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl glass-strong neon-border shadow-elevated p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl gradient-primary text-primary-foreground grid place-items-center">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black">Select your stream</p>
                  <p className="text-[10px] text-muted-foreground">We'll save it and pull your curriculum.</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 grid place-items-center rounded-xl hover:bg-accent/50">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="mt-4 text-xs font-semibold text-muted-foreground">Please select your target course/stream to continue.</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {COURSE_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setPick(c)}
                  className={`h-11 rounded-xl text-xs font-bold border transition-all ${
                    pick === c
                      ? "gradient-primary text-primary-foreground border-transparent shadow-elevated"
                      : "bg-secondary border-border text-foreground hover:border-primary/40"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              onClick={confirm}
              disabled={!pick || loading}
              className="mt-5 w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              {loading ? "Fetching from Drive…" : "Save & download"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default SyllabusButton;
