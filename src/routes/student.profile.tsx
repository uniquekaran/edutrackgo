import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Save, IdCard, User as UserIcon, ShieldCheck, FileBadge } from "lucide-react";
import { useStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatISTDate } from "@/lib/format";
import { RouteSkeleton } from "@/components/RouteSkeleton";

export const Route = createFileRoute("/student/profile")({
  head: () => ({ meta: [{ title: "My Profile — EduTrack" }] }),
  pendingComponent: RouteSkeleton,
  component: ProfilePage,
});


const COURSES = ["B.Tech", "B.Pharma", "BCA", "B.Sc", "B.Com", "BA", "Poly", "Other"] as const;
const BLOOD = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const AVATAR_BUCKET = "student-avatars";

interface Detail {
  full_name: string;
  course: string;
  semester: string;
  roll_number: string;
  father_name: string;
  mother_name: string;
  college_name: string;
  blood_group: string;
  avatar_url: string;
}

const EMPTY: Detail = {
  full_name: "", course: "", semester: "", roll_number: "",
  father_name: "", mother_name: "", college_name: "", blood_group: "", avatar_url: "",
};

function ProfilePage() {
  const maybeUser = useStore((s) => s.user);
  if (!maybeUser) return null;
  const user = maybeUser;
  const [detail, setDetail] = useState<Detail>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [verifiedDocs, setVerifiedDocs] = useState<Array<{ id: string; document_type: string; created_at: string }>>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    async function loadVerified() {
      try {
        const { data } = await supabase
          .from("documents")
          .select("id, document_type, created_at, status")
          .eq("student_id", user.id)
          .eq("status", "verified")
          .order("created_at", { ascending: false });
        if (mounted) setVerifiedDocs((data ?? []) as typeof verifiedDocs);
      } catch (e) { console.warn(e); }
    }
    loadVerified();
    const ch = supabase
      .channel(`profile-verified:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents", filter: `student_id=eq.${user.id}` },
        () => loadVerified(),
      )
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(ch); };
  }, [user.id]);


  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data, error } = await supabase
          .from("student_profiles_detail")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (!active) return;
        if (data) {
          const d: Detail = {
            full_name: data.full_name ?? user.name ?? "",
            course: data.course ?? "",
            semester: data.semester ?? "",
            roll_number: data.roll_number ?? "",
            father_name: data.father_name ?? "",
            mother_name: data.mother_name ?? "",
            college_name: data.college_name ?? "",
            blood_group: data.blood_group ?? "",
            avatar_url: data.avatar_url ?? "",
          };
          setDetail(d);
          if (d.avatar_url) await refreshAvatar(d.avatar_url);
        } else {
          setDetail((p) => ({ ...p, full_name: user.name ?? "" }));
        }
      } catch (e) {
        console.warn(e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  async function refreshAvatar(path: string) {
    if (!path) return;
    if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) {
      setAvatarPreview(path);
      return;
    }
    try {
      const { data } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 60 * 60 * 24 * 30);
      if (data?.signedUrl) setAvatarPreview(data.signedUrl);
    } catch (e) { console.warn(e); }
  }

  function update<K extends keyof Detail>(k: K, v: Detail[K]) {
    setDetail((p) => ({ ...p, [k]: v }));
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    let stored = "";
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, {
        contentType: file.type, upsert: true,
      });
      if (error) throw error;
      stored = path;
      await refreshAvatar(path);
      update("avatar_url", path);
      toast.success("Photo updated");
    } catch (err) {
      console.warn(err);
      const blob = URL.createObjectURL(file);
      setAvatarPreview(blob);
      update("avatar_url", blob);
      toast.warning("Stored locally — upload was blocked");
    } finally {
      setUploading(false);
    }
    void stored;
  }

  async function save() {
    if (!detail.full_name.trim()) { toast.error("Full name is required"); return; }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("student_profiles_detail")
        .upsert({ user_id: user.id, ...detail }, { onConflict: "user_id" });
      if (error) throw error;
      // Mirror full_name + avatar_url to profiles for admin roster display
      await supabase.from("profiles").update({
        full_name: detail.full_name,
        avatar_url: detail.avatar_url || null,
      }).eq("id", user.id);
      toast.success("Profile saved");
    } catch (e) {
      console.warn(e);
      toast.error("Couldn't save profile");
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="flex-1 grid place-items-center pt-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const initials = (detail.full_name || user.email).split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="pb-8">
      <header className="px-6 pt-10 pb-4">
        <h1 className="text-2xl font-black">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your bio-data & ID.</p>
      </header>

      {/* Digital ID Card */}
      <section className="px-5">
        <div className="relative rounded-3xl overflow-hidden shadow-elevated">
          <div className="absolute inset-0 gradient-primary" />
          <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
          <div className="relative p-5 text-primary-foreground">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IdCard className="w-4 h-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Student ID Card</p>
              </div>
              <p className="text-[10px] font-bold opacity-80">EduTrack</p>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <div className="relative w-20 h-24 rounded-2xl bg-white/15 border border-white/20 overflow-hidden grid place-items-center shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black">{initials || "?"}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-black leading-tight truncate">{detail.full_name || "—"}</p>
                <p className="text-[11px] opacity-90 truncate">{user.email}</p>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                  <Pair k="Course" v={detail.course} />
                  <Pair k="Sem" v={detail.semester} />
                  <Pair k="Roll" v={detail.roll_number} />
                  <Pair k="Blood" v={detail.blood_group} />
                </div>
              </div>
            </div>
            <p className="mt-4 text-[9px] opacity-70 uppercase tracking-widest truncate">UID · {user.id}</p>
          </div>
        </div>
      </section>

      {/* Photo upload */}
      <section className="px-5 mt-5">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-12 rounded-2xl bg-surface shadow-soft border border-border font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Camera className="w-4 h-4" /> {avatarPreview ? "Change photo" : "Upload photo"}</>}
        </button>
      </section>

      {/* Bio-data form */}
      <section className="px-5 mt-5">
        <div className="rounded-2xl bg-surface shadow-soft p-5 space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2"><UserIcon className="w-4 h-4 text-primary" /> Bio-data</h2>
          <Field label="Full Name" v={detail.full_name} onChange={(v) => update("full_name", v)} />
          <SelectField label="Course" v={detail.course} options={COURSES as unknown as string[]} onChange={(v) => update("course", v)} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Semester" v={detail.semester} onChange={(v) => update("semester", v)} />
            <Field label="Roll Number" v={detail.roll_number} onChange={(v) => update("roll_number", v)} />
          </div>
          <Field label="Father's Name" v={detail.father_name} onChange={(v) => update("father_name", v)} />
          <Field label="Mother's Name" v={detail.mother_name} onChange={(v) => update("mother_name", v)} />
          <Field label="College Name" v={detail.college_name} onChange={(v) => update("college_name", v)} />
          <SelectField label="Blood Group" v={detail.blood_group} options={BLOOD as unknown as string[]} onChange={(v) => update("blood_group", v)} />

          <button
            onClick={save}
            disabled={saving}
            className="mt-2 w-full h-12 rounded-2xl gradient-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save profile</>}
          </button>
        </div>
      </section>
    </div>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <p className="opacity-70 uppercase tracking-wider">{k}</p>
      <p className="font-bold truncate">{v || "—"}</p>
    </div>
  );
}

function Field({ label, v, onChange }: { label: string; v: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        value={v}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-11 px-3 rounded-xl bg-secondary outline-none text-sm font-semibold border border-transparent focus:border-primary focus:bg-surface transition-all"
      />
    </div>
  );
}

function SelectField({ label, v, options, onChange }: { label: string; v: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <select
        value={v}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full h-11 px-3 rounded-xl bg-secondary outline-none text-sm font-semibold border border-transparent focus:border-primary focus:bg-surface transition-all"
      >
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
