"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  // Avoid hydration mismatch: render a placeholder until mounted.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-[34px] w-[34px] items-center justify-center rounded-ctl border border-border text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg"
    >
      {mounted ? (
        isDark ? (
          <Sun size={16} />
        ) : (
          <Moon size={16} />
        )
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  );
}
