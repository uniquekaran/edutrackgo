import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { setCurrentUser, signOut as clearLocalUser, randomDepartment, store } from "@/lib/store";
import type { User } from "@/lib/store";

async function hydrateUser(userId: string, email: string, fallbackName?: string, avatarUrl?: string): Promise<User | null> {
  // Fetch profile + role in parallel
  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, department").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(),
  ]);

  const role = roleRow ? "admin" : "student";
  const name = profile?.full_name || fallbackName || email.split("@")[0];

  // Backfill department for students if missing
  let department = profile?.department ?? undefined;
  if (role === "student" && !department && profile) {
    department = randomDepartment();
    await supabase.from("profiles").update({ department }).eq("id", userId);
  }

  // If trigger somehow didn't fire (rare), make sure a profile row exists
  if (!profile) {
    await supabase.from("profiles").upsert({
      id: userId,
      email,
      full_name: name,
      avatar_url: avatarUrl ?? null,
      department: role === "student" ? randomDepartment() : null,
    });
  }

  return { id: userId, name, email, role, department };
}

export function useSupabaseAuth() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    let mounted = true;

    const sync = async (session: import("@supabase/supabase-js").Session | null, opts?: { redirect?: boolean }) => {
      if (!session?.user) {
        clearLocalUser();
        return;
      }
      const u = session.user;
      const user = await hydrateUser(
        u.id,
        u.email ?? "",
        (u.user_metadata as { full_name?: string; name?: string })?.full_name ??
          (u.user_metadata as { name?: string })?.name,
        (u.user_metadata as { avatar_url?: string })?.avatar_url,
      );
      if (!mounted || !user) return;
      setCurrentUser(user);
      if (opts?.redirect) {
        navigate({ to: user.role === "admin" ? "/admin" : "/student" });
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data }) => sync(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        // Defer DB calls to avoid deadlocks in the callback
        setTimeout(() => sync(session, { redirect: true }), 0);
      } else if (event === "SIGNED_OUT") {
        clearLocalUser();
        navigate({ to: "/auth" });
      } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        setTimeout(() => sync(session), 0);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep guarded routes honest if local user state desyncs
  void pathname;
  void store;
}
