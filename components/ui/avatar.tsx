import { cn } from "@/lib/cn";

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Gradient teal avatar for the subject; neutral for everyone else. */
export function Avatar({
  name,
  size = 42,
  variant = "subject",
  className,
}: {
  name: string;
  size?: number;
  variant?: "subject" | "neutral";
  className?: string;
}) {
  const isSubject = variant === "subject";
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold",
        isSubject
          ? "bg-[linear-gradient(150deg,var(--accent),var(--accent-hover))] text-accent-fg"
          : "border border-border bg-bg-muted text-fg-muted",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
