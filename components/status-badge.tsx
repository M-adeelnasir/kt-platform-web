const STATUS_STYLES: Record<string, string> = {
  active:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-400/20",
  on_notice:
    "bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-400/20",
  departed:
    "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-500/20 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-400/20",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_STYLES[status] ?? STATUS_STYLES.departed;
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}
