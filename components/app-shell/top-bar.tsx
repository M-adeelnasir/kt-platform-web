"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  employees: "Employees",
  "knowledge-bases": "Knowledge bases",
  interviews: "Interview",
};

function crumbs(pathname: string): string[] {
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length === 0) return ["Home"];
  const out: string[] = [LABELS[segs[0]] ?? segs[0]];
  // A second dynamic segment (an id) shows as a generic "Detail" crumb.
  if (segs.length > 1) out.push("Detail");
  return out;
}

export function TopBar() {
  const pathname = usePathname();
  const parts = crumbs(pathname);
  return (
    <header className="sticky top-0 z-10 flex h-[57px] items-center justify-between border-b border-border bg-bg/80 px-6 backdrop-blur">
      <div className="flex items-center gap-1.5 text-[13px]">
        {parts.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={13} className="text-fg-faint" />}
            <span className={i === parts.length - 1 ? "font-semibold text-fg" : "text-fg-muted"}>
              {c}
            </span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-bg-muted text-[12px] font-semibold text-fg-muted">
          LU
        </span>
      </div>
    </header>
  );
}
