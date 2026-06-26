import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "edutrack:theme";

function apply(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function ThemeToggle({ variant = "ghost" }: { variant?: "ghost" | "onPrimary" }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem(KEY)) as
      | "light"
      | "dark"
      | null;
    const next =
      stored ??
      (typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setTheme(next);
    apply(next);
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
  }

  const base =
    variant === "onPrimary"
      ? "bg-white/15 text-primary-foreground"
      : "bg-secondary text-foreground";

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      suppressHydrationWarning
      className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 active:scale-90 transition-transform ${base}`}
    >
      {mounted && theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
