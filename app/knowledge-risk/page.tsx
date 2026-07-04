"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react";
import { getKnowledgeRisk, type KnowledgeRisk } from "@/lib/api/client";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

type Level = "critical" | "high" | "medium" | "low";

const RISK_TONE: Record<Level, { text: string; bg: string; ring: string; bar: string; label: string }> = {
  critical: { text: "text-danger-text", bg: "bg-danger-tint", ring: "ring-danger-b", bar: "bg-danger", label: "Critical" },
  high: { text: "text-warning-text", bg: "bg-warning-tint", ring: "ring-warning-b", bar: "bg-warning", label: "High" },
  medium: { text: "text-accent-text", bg: "bg-accent-tint", ring: "ring-accent-tint-b", bar: "bg-accent", label: "Medium" },
  low: { text: "text-success-text", bg: "bg-success-tint", ring: "ring-success-b", bar: "bg-success", label: "Low" },
};

function tone(level: string) {
  return RISK_TONE[(level as Level) in RISK_TONE ? (level as Level) : "low"];
}

export default function KnowledgeRiskPage() {
  const [data, setData] = useState<KnowledgeRisk | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setData(await getKnowledgeRisk());
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 md:px-10">
      <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-fg">Knowledge risk</h1>
      <p className="mt-1 text-[13px] text-fg-muted">
        Bus-factor across the org — who is a single point of failure, and how much of their
        knowledge is captured before they leave.
      </p>

      {error && <p className="mt-4 text-sm text-danger-text">{error}</p>}

      {!data ? (
        <Skeletons />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
            <RiskGauge score={data.org_risk_score} />
            <div className="grid grid-cols-3 gap-4">
              <MiniKpi label="Critical" value={data.critical} level="critical" />
              <MiniKpi label="High risk" value={data.high} level="high" />
              <MiniKpi label="People leaving" value={data.people_at_risk} level="medium" />
            </div>
          </div>

          {data.spofs.length > 0 && (
            <section className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle size={15} className="text-warning" />
                <h2 className="text-[14.5px] font-semibold text-fg">Single points of failure</h2>
                <span className="text-[12px] text-fg-faint">
                  leaving soon with under-captured knowledge
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {data.spofs.map((p) => (
                  <PersonRow key={p.employee_id} p={p} highlight />
                ))}
              </div>
            </section>
          )}

          <section className="mt-7">
            <h2 className="mb-3 text-[14.5px] font-semibold text-fg">Risk by department</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {data.departments.map((d) => {
                const t = tone(d.risk);
                return (
                  <Card key={d.department} className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[13.5px] font-semibold text-fg">{d.department}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10.5px] font-medium ring-1",
                          t.bg,
                          t.text,
                          t.ring,
                        )}
                      >
                        {t.label}
                      </span>
                    </div>
                    <div className="mt-2 text-[11.5px] text-fg-faint">
                      {d.at_risk} of {d.people} leaving
                    </div>
                    <div className="mt-2.5">
                      <div className="mb-1 flex justify-between text-[11px] text-fg-muted">
                        <span>Captured</span>
                        <span className="tabular-nums">{d.avg_capture}%</span>
                      </div>
                      <div className="h-[5px] overflow-hidden rounded-full bg-bg-muted">
                        <div
                          className={cn("h-full rounded-full", t.bar)}
                          style={{ width: `${d.avg_capture}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="mt-7">
            <h2 className="mb-3 text-[14.5px] font-semibold text-fg">All people</h2>
            <Card className="divide-y divide-border overflow-hidden">
              {data.people.map((p) => (
                <PersonRow key={p.employee_id} p={p} />
              ))}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function RiskGauge({ score }: { score: number }) {
  const level: Level = score >= 70 ? "critical" : score >= 45 ? "high" : score >= 20 ? "medium" : "low";
  const t = RISK_TONE[level];
  const r = 52;
  const circ = 2 * Math.PI * r;
  return (
    <Card className="flex flex-col items-center justify-center p-5">
      <div className="relative h-[132px] w-[132px]">
        <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
          <circle cx="66" cy="66" r={r} fill="none" stroke="var(--bg-muted)" strokeWidth="10" />
          <circle
            cx="66"
            cy="66"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ - (score / 100) * circ}
            className={cn("transition-all duration-700", t.text)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[32px] font-semibold tabular-nums text-fg">{score}</span>
          <span className="text-[11px] text-fg-faint">/ 100</span>
        </div>
      </div>
      <div className={cn("mt-2 flex items-center gap-1.5 text-[13px] font-semibold", t.text)}>
        {level === "low" ? <ShieldCheck size={15} /> : <ShieldAlert size={15} />}
        {t.label} risk
      </div>
      <p className="mt-1 text-center text-[11.5px] text-fg-faint">Org-wide knowledge risk</p>
    </Card>
  );
}

function MiniKpi({ label, value, level }: { label: string; value: number; level: Level }) {
  const t = RISK_TONE[level];
  return (
    <Card className="flex flex-col justify-center p-4">
      <div className={cn("text-[30px] font-semibold tabular-nums", value > 0 ? t.text : "text-fg")}>
        {value}
      </div>
      <div className="mt-0.5 text-[12px] text-fg-muted">{label}</div>
    </Card>
  );
}

function PersonRow({ p, highlight }: { p: KnowledgeRisk["people"][number]; highlight?: boolean }) {
  const t = tone(p.risk);
  const body = (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        highlight && cn("rounded-card ring-1", t.bg, t.ring),
      )}
    >
      <Avatar name={p.name} size={38} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13.5px] font-semibold text-fg">{p.name}</span>
          <span className={cn("rounded-full px-2 py-0.5 text-[10.5px] font-medium ring-1", t.bg, t.text, t.ring)}>
            {t.label}
          </span>
        </div>
        <div className="truncate text-[12px] text-fg-muted">
          {[p.title, p.department, statusLabel(p.status)].filter(Boolean).join(" · ")}
        </div>
      </div>
      <div className="w-[120px]">
        <div className="mb-1 flex justify-between text-[11px] text-fg-muted">
          <span>Captured</span>
          <span className="tabular-nums">{p.capture}%</span>
        </div>
        <div className="h-[5px] overflow-hidden rounded-full bg-bg-muted">
          <div className={cn("h-full rounded-full", t.bar)} style={{ width: `${p.capture}%` }} />
        </div>
      </div>
    </div>
  );
  return p.knowledge_base_id && !highlight ? (
    <Link href={`/knowledge-bases/${p.knowledge_base_id}`} className="block hover:bg-bg-subtle">
      {body}
    </Link>
  ) : (
    body
  );
}

function statusLabel(s: string): string {
  return s === "on_notice" ? "On notice" : s === "departed" ? "Departed" : "Active";
}

function Skeletons() {
  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <Skeleton className="h-52 rounded-card" />
        <Skeleton className="h-52 rounded-card" />
      </div>
      <Skeleton className="h-40 rounded-card" />
    </div>
  );
}
