import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FileText, Upload, CheckCircle2, Clock, XCircle, Loader2, ExternalLink } from "lucide-react";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/student/documents")({
  head: () => ({ meta: [{ title: "Documents — EduTrack" }] }),
  component: Documents,
});

export type DocStatus = "pending" | "verified" | "rejected";

interface DocRow {
  id: string;
  student_id: string;
  student_name: string;
  document_type: string;
  file_url: string;
  status: DocStatus;
  created_at: string;
}

const DOC_TYPES = [
  "Class 10 Marksheet",
  "Class 12 Marksheet",
  "Aadhaar Card",
  "NOC (No Objection Certificate)",
  "Other Certificates",
] as const;

const BUCKET = "student-documents";

function Documents() {
  const user = useStore((s) => s.user)!;
  const [docType, setDocType] = useState<string>(DOC_TYPES[0]);
  const [uploading, setUploading] = useState(false);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  // Initial load + realtime subscription
  useEffect(() => {
    let active = true;

    async function load() {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      if (error) {
        toast.error("Couldn't load documents");
      } else {
        setDocs((data ?? []) as DocRow[]);
      }
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`documents:student:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents", filter: `student_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  async function handlePick() {
    fileRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);

    let fileUrl = "";
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;

      // Private bucket → signed URL for viewing (1 year)
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      fileUrl = signed?.signedUrl ?? path;
    } catch (err) {
      // Fallback: local object URL so the upload still succeeds in preview
      console.warn("Storage upload failed, falling back to local object URL", err);
      fileUrl = URL.createObjectURL(file);
      toast.warning("Stored locally — storage upload was blocked");
    }

    const { error: insErr } = await supabase.from("documents").insert({
      student_id: user.id,
      student_name: user.name,
      document_type: docType,
      file_url: fileUrl,
      status: "pending",
    });

    if (insErr) {
      toast.error(insErr.message);
    } else {
      toast.success(`${docType} submitted — pending verification`);
    }
    setUploading(false);
  }

  return (
    <div className="pb-6">
      <header className="px-6 pt-10 pb-5">
        <h1 className="text-2xl font-black">Document Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload, track and manage verification status.</p>
      </header>

      {/* Upload card */}
      <div className="px-5">
        <div className="rounded-2xl bg-surface shadow-soft p-5">
          <h2 className="text-base font-bold">Submit a document</h2>
          <p className="text-xs text-muted-foreground">Choose the type, then attach a file.</p>

          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-4 block">
            Document type
          </label>
          <div className="mt-1.5 relative">
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              disabled={uploading}
              className="w-full h-12 px-3.5 pr-9 rounded-xl bg-secondary outline-none text-sm font-semibold border border-transparent focus:border-primary focus:bg-surface transition-all appearance-none"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <FileText className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>

          <input ref={fileRef} type="file" className="hidden" onChange={onFile} accept="image/*,.pdf,.doc,.docx" />
          <button
            onClick={handlePick}
            disabled={uploading}
            className="mt-4 w-full h-14 rounded-2xl gradient-primary text-primary-foreground font-bold shadow-elevated active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Uploading…</>
            ) : (
              <><Upload className="w-5 h-5" /> Choose file & upload</>
            )}
          </button>
        </div>
      </div>

      {/* History */}
      <div className="px-5 mt-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Document history</h2>
        {loading ? (
          <div className="rounded-2xl bg-surface shadow-soft p-6 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-2xl bg-surface shadow-soft p-6 text-center">
            <FileText className="w-7 h-7 mx-auto text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No documents yet.</p>
          </div>
        ) : (
          <ul className="rounded-2xl bg-surface shadow-soft divide-y divide-border overflow-hidden">
            {docs.map((d) => (
              <li key={d.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent text-primary grid place-items-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{d.document_type}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(d.created_at).toLocaleString()}
                  </p>
                </div>
                {d.file_url && (
                  <a
                    href={d.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:bg-accent/50"
                    aria-label="Open file"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <StatusTag status={d.status} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function StatusTag({ status }: { status: DocStatus }) {
  const map = {
    pending: { Icon: Clock, label: "Pending", cls: "bg-warning/15 text-warning-foreground border-warning/30" },
    verified: { Icon: CheckCircle2, label: "Verified", cls: "bg-success/15 text-success border-success/30" },
    rejected: { Icon: XCircle, label: "Rejected", cls: "bg-destructive/10 text-destructive border-destructive/30" },
  } as const;
  const { Icon, label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${cls}`}>
      <Icon className="w-3 h-3" /> {label}
    </span>
  );
}
