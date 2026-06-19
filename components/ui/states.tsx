import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function EmptyState({
  icon,
  title,
  body,
  actions,
  dashed = true,
}: {
  icon?: ReactNode;
  title: string;
  body?: string;
  actions?: ReactNode;
  dashed?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-card px-6 py-12 text-center",
        dashed ? "border border-dashed border-border-strong" : "border border-border bg-panel",
      )}
    >
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-bg-muted text-fg-muted">
          {icon}
        </span>
      )}
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {body && <p className="max-w-[400px] text-sm text-fg-muted">{body}</p>}
      {actions && <div className="mt-1 flex gap-2">{actions}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  code,
  body,
  actions,
}: {
  title: string;
  code?: string;
  body?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-[color:var(--danger-tint)] bg-danger-tint px-6 py-12 text-center">
      <h3 className="text-base font-semibold text-danger-text">{title}</h3>
      {code && (
        <code className="rounded bg-bg-muted px-2 py-0.5 font-mono text-xs text-fg-muted">
          {code}
        </code>
      )}
      {body && <p className="max-w-[400px] text-sm text-fg-muted">{body}</p>}
      {actions && <div className="mt-1 flex gap-2">{actions}</div>}
    </div>
  );
}
