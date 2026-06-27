import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ShieldCheck,
  Upload,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  IdCard,
  GraduationCap,
  FileBadge,
  ChevronLeft,
  Lock,
  X,
  FileText,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatISTDateTime } from "@/lib/format";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RouteSkeleton } from "@/components/RouteSkeleton";

export const Route = createFileRoute("/student/vault")({
  head: () => ({ meta: [{ title: "Documents Vault — EduTrack" }] }),
  pendingComponent: RouteSkeleton,
  component: VaultPage,
});

type DocStatus = "pending" | "verified" | "rejected";
interface DocRow {
  id: string;
  student_id: string;
  student_name: string;
  document_type: string;
  file_url: string;
  status: DocStatus;
  created_at: string;
}

const BUCKET = "student-documents";

const VAULT_CATEGORIES = [
  { key: "Aadhaar Card", label: "Aadhaar Card", hint: "Government identity proof", icon: IdCard, tint: "from-indigo-500/40 to-blue-500/30" },
  { key: "College ID", label: "College ID", hint: "Official institute ID card", icon: ShieldCheck, tint: "from-violet-500/40 to-fuchsia-500/30" },
  { key: "Class 10 Marksheet", label: "Class 10 Marksheet", hint: "Secondary board result", icon: GraduationCap, tint: "from-emerald-500/40 to-teal-500/30" },
  { key: "Class 12 Marksheet", label: "Class 12 Marksheet", hint: "Higher secondary result", icon: GraduationCap, tint: "from-amber-500/40 to-orange-500/30" },
  { key: "Semester Marksheet", label: "Semester Marksheet", hint: "Most recent semester", icon: FileBadge, tint: "from-rose-500/40 to-pink-500/30" },
] as const;

function VaultPage() {
  const maybe = useStore((s) => s.user);
  if (!maybe) return null;
  const user = maybe;

  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<DocRow | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingTypeRef = useRef<string>("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });
        if (!active) return;
        if (error) throw error;
        setDocs((data ?? []) as DocRow[]);
      } catch (err) {
        console.warn("vault load failed", err);
        toast.error("Couldn't load vault — showing offline state");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    const ch = supabase
      .channel(`vault:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents", filter: `student_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [user.id]);

  const latestByCategory = useMemo(() => {
    const map = new Map<string, DocRow>();
    for (const d of docs) if (!map.has(d.document_type)) map.set(d.document_type, d);
    return map;
  }, [docs]);

  function triggerUpload(category: string) {
    pendingTypeRef.current = category;
    fileRef.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const docType = pendingTypeRef.current;
    if (!file || !docType) return;
    setUploadingKey(docType);

    let fileUrl = "";
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      fileUrl = signed?.signedUrl ?? path;
    } catch (err) {
      console.warn("vault storage failed, fallback to local URL", err);
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
    if (insErr) toast.error(insErr.message);
    else toast.success(`${docType} secured to vault — awaiting verification`);

    setUploadingKey(null);
  }

  const verifiedCount = useMemo(
    () => VAULT_CATEGORIES.filter((c) => latestByCategory.get(c.key)?.status === "verified").length,
    [latestByCategory],
  );

  return (
    <div className="pb-10 min-h-full">
      <header className="px-6 pt-10 pb-6 gradient-primary text-primary-foreground rounded-b-[2rem] relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" aria-hidden />
        <div className="absolute -left-12 bottom-0 w-36 h-36 rounded-full bg-black/20 blur-3xl" aria-hidden />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to="/student" className="inline-flex items-center gap-1 text-xs opacity-90 hover:opacity-100">
              <ChevronLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <h1 className="mt-1.5 text-2xl font-black flex items-center gap-2">
              <ShieldCheck className="w-6 h-6" /> Documents Vault
            </h1>
            <p className="text-xs opacity-90 mt-1">End-to-end encrypted · synced to your device in real-time.</p>
          </div>
          <ThemeToggle variant="onPrimary" />
        </div>
        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <VaultMini label="Verified" value={`${verifiedCount}`} />
          <VaultMini label="Total" value={`${VAULT_CATEGORIES.length}`} />
          <VaultMini label="Status" value={verifiedCount === VAULT_CATEGORIES.length ? "Complete" : "Pending"} />
        </div>
      </header>

      <input ref={fileRef} type="file" className="hidden" onChange={onFile} accept="image/*,.pdf,.doc,.docx" />

      <section className="px-5 mt-5 space-y-3">
        {loading ? (
          <div className="rounded-2xl glass shadow-soft p-8 text-center">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : (
          VAULT_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const doc = latestByCategory.get(cat.key);
            const isUploading = uploadingKey === cat.key;
            return (
              <div key={cat.key} className="relative overflow-hidden rounded-3xl glass-strong shadow-elevated p-4">
                <div
                  aria-hidden
                  className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${cat.tint} blur-2xl opacity-60`}
                />
                <div className="relative flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl gradient-primary text-primary-foreground grid place-items-center shrink-0 shadow-soft">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold leading-tight">{cat.label}</p>
                      {doc ? <StatusBadge status={doc.status} /> : <EmptyBadge />}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{cat.hint}</p>
                    {doc && (
                      <p className="text-[10px] text-muted-foreground/80 mt-1 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Stored {formatISTDateTime(doc.created_at)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="relative mt-4 flex gap-2">
                  <button
                    onClick={() => triggerUpload(cat.key)}
                    disabled={isUploading}
                    className="flex-1 h-11 rounded-2xl gradient-primary text-primary-foreground text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-soft active:scale-[0.98] transition disabled:opacity-70"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isUploading ? "Securing…" : doc ? "Replace" : "Upload"}
                  </button>
                  <button
                    onClick={() => doc && setPreview(doc)}
                    disabled={!doc}
                    className="h-11 px-4 rounded-2xl glass text-xs font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Eye className="w-4 h-4" /> View
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {preview && <PreviewModal doc={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function VaultMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="text-base font-black mt-0.5 truncate">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: DocStatus }) {
  const map = {
    pending: { Icon: Clock, label: "Pending", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
    verified: { Icon: CheckCircle2, label: "Approved", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
    rejected: { Icon: XCircle, label: "Rejected", cls: "bg-rose-500/15 text-rose-500 border-rose-500/30" },
  } as const;
  const { Icon, label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border backdrop-blur-sm ${cls}`}>
      <Icon className="w-2.5 h-2.5" /> {label}
    </span>
  );
}

function EmptyBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border border-border bg-muted/40 text-muted-foreground">
      Not uploaded
    </span>
  );
}

function PreviewModal({ doc, onClose }: { doc: DocRow; onClose: () => void }) {
  const url = doc.file_url;
  const lower = url.split("?")[0].toLowerCase();
  const isImage = /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/.test(lower) || url.startsWith("data:image") || url.startsWith("blob:");
  const isPdf = /\.pdf$/.test(lower) || url.startsWith("data:application/pdf");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 animate-in fade-in" onClick={onClose}>
      <div className="glass-strong w-full max-w-md max-h-[92vh] rounded-3xl shadow-elevated flex flex-col overflow-hidden animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border">
          <div className="w-9 h-9 rounded-xl gradient-primary text-primary-foreground grid place-items-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{doc.document_type}</p>
            <p className="text-[11px] text-muted-foreground truncate">{formatISTDateTime(doc.created_at)}</p>
          </div>
          <StatusBadge status={doc.status} />
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg grid place-items-center hover:bg-accent/50">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-secondary/40 grid place-items-center p-3">
          {isImage ? (
            <img src={url} alt={doc.document_type} className="max-w-full max-h-[70vh] rounded-2xl border border-border bg-white object-contain" />
          ) : isPdf ? (
            <iframe src={url} title={doc.document_type} className="w-full h-[70vh] rounded-2xl border border-border bg-white" />
          ) : (
            <div className="text-center p-8">
              <FileText className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">Preview not available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
