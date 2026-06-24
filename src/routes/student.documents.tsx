import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { FileText, IdCard, ScrollText, Upload, CheckCircle2, Clock, XCircle } from "lucide-react";
import { uploadDocument, useStore, CATEGORY_LABELS, type DocCategory, type DocStatus } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/student/documents")({
  head: () => ({ meta: [{ title: "Documents — EduTrack" }] }),
  component: Documents,
});

const CATS: { key: DocCategory; icon: React.ReactNode; hint: string }[] = [
  { key: "academic", icon: <FileText className="w-5 h-5" />, hint: "Transcripts, marksheets, certificates" },
  { key: "identity", icon: <IdCard className="w-5 h-5" />, hint: "Aadhaar, passport, license" },
  { key: "noc", icon: <ScrollText className="w-5 h-5" />, hint: "No-objection certificates" },
];

function Documents() {
  const user = useStore((s) => s.user)!;
  const docs = useStore((s) => s.documents.filter((d) => d.ownerId === user.id));

  return (
    <div className="pb-6">
      <header className="px-6 pt-10 pb-5">
        <h1 className="text-2xl font-black">Document Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload, track and manage verification status.</p>
      </header>

      <div className="px-5 space-y-3">
        {CATS.map((c) => {
          const items = docs.filter((d) => d.category === c.key);
          return <CategoryCard key={c.key} cat={c} items={items} ownerId={user.id} ownerName={user.name} />;
        })}
      </div>
    </div>
  );
}

function CategoryCard({
  cat,
  items,
  ownerId,
  ownerName,
}: {
  cat: { key: DocCategory; icon: React.ReactNode; hint: string };
  items: ReturnType<typeof useStore<any>>;
  ownerId: string;
  ownerName: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    uploadDocument({ ownerId, ownerName, category: cat.key, fileName: f.name });
    toast.success(`${f.name} uploaded — pending verification`);
    e.target.value = "";
  }
  return (
    <div className="rounded-2xl bg-surface shadow-soft overflow-hidden">
      <div className="p-4 flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl gradient-primary text-primary-foreground grid place-items-center shrink-0">
          {cat.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold">{CATEGORY_LABELS[cat.key]}</h3>
          <p className="text-xs text-muted-foreground">{cat.hint}</p>
        </div>
        <input ref={ref} type="file" className="hidden" onChange={onFile} />
        <button
          onClick={() => ref.current?.click()}
          className="shrink-0 h-10 px-3 rounded-xl bg-accent text-primary text-xs font-bold flex items-center gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
      </div>
      {items.length > 0 && (
        <ul className="border-t border-border divide-y divide-border">
          {items.map((d: any) => (
            <li key={d.id} className="flex items-center gap-3 px-4 py-3">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="flex-1 min-w-0 truncate text-sm font-medium">{d.fileName}</p>
              <StatusTag status={d.status} />
            </li>
          ))}
        </ul>
      )}
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
