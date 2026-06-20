"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookText,
  LayoutDashboard,
  Plug,
  ShieldAlert,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/knowledge-bases", label: "Knowledge bases", icon: BookText },
];

const INSIGHTS_NAV = [
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/knowledge-risk", label: "Knowledge risk", icon: ShieldAlert },
  { href: "/integrations", label: "Integrations", icon: Plug },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 flex w-[248px] flex-col border-r border-border bg-bg-subtle">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[9px] bg-[linear-gradient(150deg,var(--accent),var(--accent-hover))] text-accent-fg">
          <BookText size={16} />
        </span>
        <div className="leading-tight">
          <div className="text-[14px] font-semibold text-fg">Continuity</div>
          <div className="text-[11px] text-fg-faint">Acme · Workspace</div>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 px-3 pt-2">
        <NavGroup label="Workspace" items={NAV} pathname={pathname} />
        <div className="pt-3" />
        <NavGroup label="Insights" items={INSIGHTS_NAV} pathname={pathname} />
      </nav>

      {/* User card pinned at bottom */}
      <div className="mt-auto m-3 flex items-center gap-2.5 rounded-lg border border-border bg-panel px-3 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-muted text-[12px] font-semibold text-fg-muted">
          LU
        </span>
        <div className="leading-tight">
          <div className="text-[12.5px] font-medium text-fg">Local User</div>
          <div className="text-[11px] text-fg-faint">Owner</div>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: { href: string; label: string; icon: typeof Users }[];
  pathname: string;
}) {
  return (
    <>
      <div className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-fg-faint">
        {label}
      </div>
      {items.map(({ href, label: itemLabel, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors",
              active
                ? "border border-accent-tint-b bg-accent-tint font-semibold text-accent-text"
                : "border border-transparent text-fg-muted hover:bg-bg-muted hover:text-fg",
            )}
          >
            <Icon size={16} />
            {itemLabel}
          </Link>
        );
      })}
    </>
  );
}
