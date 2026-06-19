import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

const TONES: Record<Tone, string> = {
  neutral: "bg-bg-muted text-fg-muted",
  accent: "bg-accent-tint text-accent-text",
  success: "bg-success-tint text-success-text",
  warning: "bg-warning-tint text-warning-text",
  danger: "bg-danger-tint text-danger-text",
};

const DOT: Record<Tone, string> = {
  neutral: "bg-fg-faint",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/** Maps a backend status string to a label + tone. */
const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  active: { label: "Active", tone: "neutral" },
  on_notice: { label: "Capturing", tone: "warning" },
  departed: { label: "Ready", tone: "success" },
  connecting: { label: "Connecting", tone: "warning" },
  connected: { label: "Connected", tone: "success" },
};

export function StatusPill({
  status,
  label,
  tone,
}: {
  status?: string;
  label?: string;
  tone?: Tone;
}) {
  const mapped = status ? STATUS_MAP[status] : undefined;
  const t = tone ?? mapped?.tone ?? "neutral";
  const text = label ?? mapped?.label ?? status ?? "";
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-medium",
        TONES[t],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[t])} />
      {text}
    </span>
  );
}
