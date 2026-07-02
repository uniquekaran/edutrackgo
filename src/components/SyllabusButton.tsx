import { CloudDownload } from "lucide-react";
import { toast } from "sonner";

/**
 * Syllabus button — routes directly to the official AKTU syllabus portal
 * in a new tab. No 404, no course prompt.
 */
export function SyllabusButton({ className = "" }: { className?: string }) {
  function handleClick() {
    try {
      const w = window.open("https://aktu.ac.in/syllabus.html", "_blank", "noopener,noreferrer");
      if (!w) toast.info("Please allow pop-ups to open the syllabus portal");
      else toast.success("Opening AKTU syllabus portal…");
    } catch {
      toast.error("Could not open syllabus. Try again.");
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`group relative overflow-hidden rounded-2xl gradient-primary text-primary-foreground p-3 active:scale-[0.97] transition-transform halo-glow text-left ${className}`}
    >
      <CloudDownload className="w-5 h-5" />
      <p className="mt-2 text-[12px] font-black leading-tight">Download Syllabus</p>
      <p className="text-[9px] opacity-80 mt-0.5">Official AKTU portal</p>
    </button>
  );
}

export default SyllabusButton;
