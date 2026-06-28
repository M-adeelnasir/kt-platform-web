import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { BrandIcon } from "@/components/ui/brand-icon";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/cn";

const META: Record<string, { name: string; sub: string }> = {
  google: { name: "Google Workspace", sub: "Drive · Docs · Gmail" },
  github: { name: "GitHub", sub: "Commits · PRs · issues" },
  atlassian: { name: "Atlassian", sub: "Jira · Confluence" },
  microsoft: { name: "Microsoft 365", sub: "Outlook · OneDrive · Teams" },
};

const STATUS_PILL: Record<string, { label: string; tone: "success" | "accent" | "warning" | "neutral" }> = {
  connected: { label: "Connected", tone: "success" },
  syncing: { label: "Syncing", tone: "accent" },
  action_needed: { label: "Action needed", tone: "warning" },
  not_connected: { label: "Not connected", tone: "neutral" },
};

export function ConnectorCard({
  type,
  status,
  footer,
  action,
}: {
  type: string;
  status: string;
  footer?: ReactNode;
  action?: ReactNode;
}) {
  const meta = META[type] ?? { name: type, sub: "" };
  const pill = STATUS_PILL[status] ?? STATUS_PILL.not_connected;
  const attention = status === "action_needed";

  return (
    <Card className={cn("flex flex-col gap-3 p-4", attention && "border-warning-b")}>
      <div className="flex items-center gap-3">
        <BrandIcon type={type} size={40} icon={18} />
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-fg">{meta.name}</div>
          <div className="text-[12px] text-fg-faint">{meta.sub}</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <StatusPill label={pill.label} tone={pill.tone} />
        {footer && <span className="text-[12px] text-fg-muted">{footer}</span>}
      </div>
      {action && <div className="border-t border-border pt-3">{action}</div>}
    </Card>
  );
}
