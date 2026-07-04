"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BadgeCheck,
  BookOpen,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { getAnalytics, type Analytics } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setData(await getAnalytics());
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 md:px-10">
      <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-fg">Analytics &amp; insights</h1>
      <p className="mt-1 text-[13px] text-fg-muted">
        How the oracle is used across the workspace — questions answered, abstention discipline,
        and knowledge coverage.
      </p>

      {error && <p className="mt-4 text-sm text-danger-text">{error}</p>}

      {!data ? (
        <Skeletons />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Kpi
              icon={<MessageSquare size={15} />}
              label="Questions asked"
              value={data.total_questions}
              sub={`${data.answered} answered · ${data.abstained} abstained`}
            />
            <Kpi
              icon={<BadgeCheck size={15} />}
              label="Grounded answer rate"
              value={`${100 - data.abstention_rate}%`}
              sub={`${data.abstention_rate}% correctly abstained`}
              tone="success"
            />
            <Kpi
              icon={<BookOpen size={15} />}
              label="Knowledge coverage"
              value={`${data.coverage}%`}
              sub={`${data.kbs_ready} of ${data.kbs_total} KBs synthesized`}
              tone="accent"
            />
            <Kpi
              icon={<TrendingUp size={15} />}
              label="Artifacts captured"
              value={data.artifacts_total}
              sub={`${data.interviews_total} interviews conducted`}
            />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
            <ActivityChart data={data} />
            <TopKbs data={data} />
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
  tone?: "neutral" | "success" | "accent";
}) {
  const dot =
    tone === "success" ? "text-success" : tone === "accent" ? "text-accent" : "text-fg-muted";
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[12.5px] text-fg-muted">
        <span className={dot}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-[28px] font-semibold tabular-nums text-fg">{value}</div>
      <div className="mt-0.5 text-[11.5px] text-fg-faint">{sub}</div>
    </Card>
  );
}

function ActivityChart({ data }: { data: Analytics }) {
  const max = Math.max(1, ...data.timeseries.map((d) => d.questions));
  const total = data.timeseries.reduce((a, d) => a + d.questions, 0);
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <Activity size={15} className="text-accent" />
        <h2 className="text-[14.5px] font-semibold text-fg">Question activity</h2>
        <span className="text-[12px] text-fg-faint">last 30 days · {total} total</span>
      </div>
      <div className="mt-5 flex h-[150px] items-end gap-[3px]">
        {data.timeseries.map((d) => {
          const grounded = d.questions - d.abstained;
          const groundedH = (grounded / max) * 100;
          const absH = (d.abstained / max) * 100;
          return (
            <div
              key={d.date}
              className="group flex h-full flex-1 flex-col justify-end"
              title={`${fmtDay(d.date)}: ${d.questions} asked · ${d.abstained} abstained`}
            >
              {d.abstained > 0 && (
                <div
                  className="w-full rounded-t-[2px] bg-warning"
                  style={{ height: `${absH}%`, minHeight: 2 }}
                />
              )}
              {grounded > 0 && (
                <div
                  className={cn(
                    "w-full bg-accent transition-colors group-hover:opacity-80",
                    d.abstained === 0 && "rounded-t-[2px]",
                  )}
                  style={{ height: `${groundedH}%`, minHeight: 2 }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-4 text-[11.5px] text-fg-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-accent" /> Grounded
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-warning" /> Abstained
        </span>
      </div>
    </Card>
  );
}

function TopKbs({ data }: { data: Analytics }) {
  const max = Math.max(1, ...data.top_kbs.map((k) => k.questions));
  return (
    <Card className="p-4">
      <h2 className="text-[14.5px] font-semibold text-fg">Most-queried knowledge bases</h2>
      <div className="mt-4 flex flex-col gap-3">
        {data.top_kbs.length === 0 ? (
          <p className="text-[13px] text-fg-muted">No questions asked yet.</p>
        ) : (
          data.top_kbs.map((k) => (
            <div key={k.knowledge_base_id}>
              <div className="mb-1 flex items-center justify-between text-[12.5px]">
                <span className="font-medium text-fg">{k.subject}</span>
                <span className="tabular-nums text-fg-muted">{k.questions}</span>
              </div>
              <div className="h-[6px] overflow-hidden rounded-full bg-bg-muted">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(k.questions / max) * 100}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function fmtDay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function Skeletons() {
  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-7 w-16" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-56 rounded-card" />
        <Skeleton className="h-56 rounded-card" />
      </div>
    </div>
  );
}
