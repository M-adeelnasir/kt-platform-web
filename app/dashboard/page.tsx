"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2 } from "lucide-react";
import { getDashboard, type Dashboard } from "@/lib/api/client";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ConnectorCard } from "@/components/ui/connector-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

const REFRESH_MS = 10_000;

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await getDashboard());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const t = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 md:px-10">
      <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-fg">Dashboard</h1>
      <p className="mt-1 text-[13px] text-fg-muted">
        Workspace overview — who&apos;s on notice, connector sync health, and live jobs.
      </p>

      {error && <p className="mt-4 text-sm text-danger-text">{error}</p>}

      {!data ? (
        <DashboardSkeleton />
      ) : (
        <>
          <KpiRow data={data} />
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
            <OnNotice people={data.on_notice} />
            <ActiveJobs jobs={data.active_jobs} />
          </div>
          <ConnectorHealth connectors={data.connectors} />
        </>
      )}
    </div>
  );
}

function KpiRow({ data }: { data: Dashboard }) {
  const k = data.kpis;
  const jobKinds = countBy(data.active_jobs.map((j) => j.kind));
  const jobsSub =
    data.active_jobs.length === 0
      ? "none running"
      : Object.entries(jobKinds)
          .map(([kind, n]) => `${n} ${kind}`)
          .join(" · ");
  const attention = data.connectors.find((c) => c.status === "action_needed");

  const cards = [
    { dot: "bg-warning", label: "On notice", value: k.on_notice, sub: `${k.departing_soon} departing within 30 days` },
    { dot: "bg-success", label: "Knowledge bases ready", value: k.kbs_ready, sub: `of ${k.kbs_total} total` },
    { dot: "bg-accent", label: "Jobs running", value: k.jobs_running, sub: jobsSub },
    {
      dot: k.needs_attention ? "bg-danger" : "bg-success",
      label: "Needs attention",
      value: k.needs_attention,
      sub: attention ? `${cap(attention.type)} needs reconnect` : "all connectors healthy",
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <div className="flex items-center gap-2 text-[12.5px] text-fg-muted">
            <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
            {c.label}
          </div>
          <div className="mt-2 text-[28px] font-semibold tabular-nums text-fg">{c.value}</div>
          <div className="mt-0.5 text-[11.5px] text-fg-faint">{c.sub}</div>
        </Card>
      ))}
    </div>
  );
}

function OnNotice({ people }: { people: Dashboard["on_notice"] }) {
  const router = useRouter();
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5">
        <h2 className="text-[14.5px] font-semibold text-fg">On notice</h2>
        <span className="text-[12px] text-fg-faint">capture progress</span>
      </div>
      {people.length === 0 ? (
        <p className="px-4 pb-5 text-[13px] text-fg-muted">No one is on notice right now.</p>
      ) : (
        <div className="divide-y divide-border border-t border-border">
          {people.map((p) => {
            const href = p.knowledge_base_id ? `/knowledge-bases/${p.knowledge_base_id}` : null;
            return (
              <button
                key={p.employee_id}
                disabled={!href}
                onClick={() => href && router.push(href)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors enabled:hover:bg-bg-subtle disabled:cursor-default"
              >
                <Avatar name={p.name} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-fg">{p.name}</div>
                  <div className="truncate text-[12px] text-fg-muted">
                    {[p.title, p.notice_end_date ? `departing ${fmtDate(p.notice_end_date)}` : null]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </div>
                </div>
                <CaptureBar value={p.capture_progress} />
                {href && <ChevronRight size={16} className="text-fg-faint" />}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function CaptureBar({ value }: { value: number }) {
  const tone = value >= 95 ? "bg-success" : value < 40 ? "bg-warning" : "bg-accent";
  return (
    <div className="w-[140px]">
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-fg-faint">Capture</span>
        <span className="flex items-center gap-1.5 font-mono tabular-nums text-fg-muted">
          {value < 40 && (
            <span className="rounded-full bg-warning-tint px-1.5 text-[10px] font-medium text-warning-text">
              behind
            </span>
          )}
          {value}%
        </span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-bg-muted">
        <div className={cn("h-full rounded-full", tone)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ActiveJobs({ jobs }: { jobs: Dashboard["active_jobs"] }) {
  // Client-side elapsed: remember when each job id was first seen (in state, not a ref),
  // and tick a clock every second so the timers update.
  const [firstSeen, setFirstSeen] = useState<Record<string, number>>({});
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFirstSeen((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const j of jobs) {
        if (!(j.id in next)) {
          next[j.id] = Date.now();
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [jobs]);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3.5">
        <h2 className="text-[14.5px] font-semibold text-fg">Active jobs</h2>
        <span className="flex items-center gap-1.5 text-[12px] text-success-text">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> live
        </span>
      </div>
      {jobs.length === 0 ? (
        <p className="px-4 pb-5 text-[13px] text-fg-muted">No jobs running right now.</p>
      ) : (
        <div className="divide-y divide-border border-t border-border">
          {jobs.map((j) => {
            const elapsed = Math.max(0, Math.round((nowTs - (firstSeen[j.id] ?? nowTs)) / 1000));
            return (
              <div key={j.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-accent-tint text-accent-text">
                  <Loader2 size={15} className="animate-spin" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold capitalize text-fg">{j.kind}</div>
                  <div className="truncate text-[12px] text-fg-muted">{j.subject ?? "—"}</div>
                </div>
                <span className="font-mono text-[12.5px] tabular-nums text-fg-muted">
                  {fmtElapsed(elapsed)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function ConnectorHealth({ connectors }: { connectors: Dashboard["connectors"] }) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14.5px] font-semibold text-fg">Connector health</h2>
        <span className="text-[12px] text-fg-faint">across the workspace</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {connectors.map((c) => (
          <ConnectorCard
            key={c.type}
            type={c.type}
            status={c.status}
            footer={
              c.last_synced_at
                ? `synced ${fmtDate(c.last_synced_at)}`
                : `${c.employee_count} connected`
            }
          />
        ))}
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-12" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Skeleton className="h-56 rounded-card" />
        <Skeleton className="h-56 rounded-card" />
      </div>
    </div>
  );
}

function countBy(xs: string[]): Record<string, number> {
  return xs.reduce<Record<string, number>>((acc, x) => ({ ...acc, [x]: (acc[x] ?? 0) + 1 }), {});
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
function fmtElapsed(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
