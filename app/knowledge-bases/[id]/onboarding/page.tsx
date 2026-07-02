"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  GraduationCap,
  Loader2,
  Search,
  Sparkles,
  Type as TypeIcon,
} from "lucide-react";
import {
  askQuestion,
  getOnboarding,
  type GroundedAnswer,
  type OnboardingView,
} from "@/lib/api/client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/states";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/cn";

const KIND_META: Record<string, { icon: typeof BookOpen; tint: string }> = {
  welcome: { icon: GraduationCap, tint: "bg-accent-tint text-accent-text" },
  overview: { icon: BookOpen, tint: "bg-accent-tint text-accent-text" },
  glossary: { icon: TypeIcon, tint: "bg-bg-muted text-fg-muted" },
  gotcha: { icon: AlertTriangle, tint: "bg-warning-tint text-warning-text" },
  gap: { icon: AlertCircle, tint: "bg-danger-tint text-danger-text" },
  oracle: { icon: Sparkles, tint: "bg-accent-tint text-accent-text" },
};

type Step = {
  key: string;
  kind: string;
  title: string;
  intro?: string;
  body?: string;
  readMinutes?: number;
};

export default function OnboardingPage() {
  const { id } = useParams<{ id: string }>();

  const [view, setView] = useState<OnboardingView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [current, setCurrent] = useState(0);
  const [read, setRead] = useState<Set<string>>(new Set());

  const storageKey = `continuity:onboarding-read:${id}`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const v = await getOnboarding(id);
        if (!cancelled) setView(v);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Restore read-progress from the browser (no successor auth in the MVP).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setRead(new Set(JSON.parse(raw) as string[]));
      }
    } catch {
      /* ignore corrupt/unavailable storage */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const steps = useMemo<Step[]>(() => {
    if (!view) return [];
    const arr: Step[] = [{ key: "welcome", kind: "welcome", title: "Start here" }];
    for (const s of view.steps) {
      arr.push({
        key: s.kind,
        kind: s.kind,
        title: s.title,
        intro: s.intro,
        body: s.body,
        readMinutes: s.read_minutes,
      });
    }
    arr.push({ key: "oracle", kind: "oracle", title: "Ask the oracle" });
    return arr;
  }, [view]);

  const markRead = useCallback(
    (key: string) => {
      setRead((prev) => {
        if (prev.has(key)) return prev;
        const next = new Set(prev);
        next.add(key);
        try {
          localStorage.setItem(storageKey, JSON.stringify([...next]));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [storageKey],
  );

  // Visiting a step counts as reading it.
  useEffect(() => {
    const step = steps[current];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (step) markRead(step.key);
  }, [current, steps, markRead]);

  if (loading) return <OnboardingSkeleton />;

  if (loadError) {
    return (
      <Shell kbId={id}>
        <EmptyState
          icon={<AlertCircle size={20} />}
          title="Couldn't load this onboarding path"
          body={loadError}
          actions={
            <Link href={`/knowledge-bases/${id}`}>
              <Button variant="secondary">Back to knowledge base</Button>
            </Link>
          }
        />
      </Shell>
    );
  }

  if (!view || !view.ready) {
    return (
      <Shell kbId={id}>
        <EmptyState
          icon={<Sparkles size={20} />}
          title="Nothing to onboard with yet"
          body={`${view?.subject_person_name ?? "This knowledge base"} hasn't been synthesized yet. Run synthesis on the knowledge base to generate the reading path.`}
          actions={
            <Link href={`/knowledge-bases/${id}`}>
              <Button>Go to knowledge base</Button>
            </Link>
          }
        />
      </Shell>
    );
  }

  const total = steps.length;
  const readableSteps = steps.filter((s) => s.kind !== "oracle");
  const readCount = readableSteps.filter((s) => read.has(s.key)).length;
  const pct = readableSteps.length
    ? Math.round((readCount / readableSteps.length) * 100)
    : 0;
  const step = steps[current];

  return (
    <Shell kbId={id}>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[248px_1fr]">
        {/* TOC rail */}
        <aside className="md:sticky md:top-6 md:self-start">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <Avatar name={view.subject_person_name} size={40} />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold text-fg">
                {view.subject_person_name}
              </div>
              <div className="truncate text-[12px] text-fg-faint">
                {view.subject_title ?? "Knowledge handover"}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <ProgressRing pct={pct} />
            <div className="leading-tight">
              <div className="text-[13px] font-semibold text-fg">{pct}% read</div>
              <div className="text-[11.5px] text-fg-faint">
                {readCount} of {readableSteps.length} sections
              </div>
            </div>
          </div>

          <ol className="mt-5 flex flex-col gap-0.5">
            {steps.map((s, i) => {
              const meta = KIND_META[s.kind] ?? { icon: BookOpen, tint: "" };
              const Icon = meta.icon;
              const active = i === current;
              const done = read.has(s.key) && s.kind !== "oracle";
              return (
                <li key={s.key}>
                  <button
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors",
                      active
                        ? "border border-accent-tint-b bg-accent-tint font-semibold text-accent-text"
                        : "border border-transparent text-fg-muted hover:bg-bg-muted hover:text-fg",
                    )}
                    aria-current={active ? "step" : undefined}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px]",
                        done
                          ? "bg-success-tint text-success-text"
                          : "bg-bg-muted text-fg-faint",
                      )}
                    >
                      {done ? <Check size={12} /> : <Icon size={12} />}
                    </span>
                    <span className="flex-1 truncate">{s.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Reading pane */}
        <div className="min-w-0">
          {step.kind === "welcome" ? (
            <WelcomeStep view={view} onStart={() => setCurrent(1)} />
          ) : step.kind === "oracle" ? (
            <OracleStep kbId={id} subject={view.subject_person_name} />
          ) : (
            <ReadingStep step={step} />
          )}

          {/* Pager */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button
              variant="secondary"
              disabled={current === 0}
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            >
              <ArrowLeft size={15} /> Previous
            </Button>
            <span className="text-[12px] text-fg-faint">
              {current + 1} / {total}
            </span>
            {current < total - 1 ? (
              <Button onClick={() => setCurrent((c) => Math.min(total - 1, c + 1))}>
                Next <ArrowRight size={15} />
              </Button>
            ) : (
              <Link href={`/knowledge-bases/${id}`}>
                <Button variant="secondary">Done</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ kbId, children }: { kbId: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1040px] px-6 py-8 md:px-10">
      <div className="mb-6 flex items-center gap-2 text-[12.5px] text-fg-faint">
        <GraduationCap size={14} className="text-accent" />
        <span>Successor onboarding</span>
        <span className="text-border-strong">/</span>
        <Link href={`/knowledge-bases/${kbId}`} className="hover:text-fg">
          Knowledge base
        </Link>
      </div>
      {children}
    </div>
  );
}

function WelcomeStep({ view, onStart }: { view: OnboardingView; onStart: () => void }) {
  const sources = view.source_count;
  const interviews = view.interview_count;
  return (
    <div className="animate-fade-up">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-2.5 py-1 text-[11.5px] font-medium text-accent-text">
        <GraduationCap size={13} /> Start here
      </span>
      <h1 className="mt-4 text-[26px] font-semibold tracking-[-0.02em] text-fg">
        Getting up to speed on {view.subject_person_name}&apos;s work
      </h1>
      <p className="mt-3 text-[15px] leading-[1.7] text-fg-body">
        This is a guided reading path built from everything {view.subject_person_name} left
        behind. Work through each section in order — the overview first, then the vocabulary,
        the landmines to avoid, and the open questions. When you&apos;re done, the oracle can
        answer anything the reading didn&apos;t cover, grounded in their real sources.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard icon={<BookOpen size={16} />} value={sources} label="source documents" />
        <StatCard icon={<Sparkles size={16} />} value={interviews} label="interviews" />
        <StatCard
          icon={<Clock size={16} />}
          value={`~${view.total_read_minutes}`}
          label="min to read"
        />
      </div>

      <div className="mt-7">
        <Button onClick={onStart}>
          Begin reading <ArrowRight size={15} />
        </Button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <Card className="flex items-center gap-3 p-3.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-tint text-accent-text">
        {icon}
      </span>
      <div className="leading-tight">
        <div className="text-[18px] font-semibold tabular-nums text-fg">{value}</div>
        <div className="text-[11.5px] text-fg-faint">{label}</div>
      </div>
    </Card>
  );
}

function ReadingStep({ step }: { step: Step }) {
  const meta = KIND_META[step.kind] ?? { icon: BookOpen, tint: "bg-bg-muted text-fg-muted" };
  const Icon = meta.icon;
  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-[38px] w-[38px] items-center justify-center rounded-[11px]",
            meta.tint,
          )}
        >
          <Icon size={19} />
        </span>
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">{step.title}</h1>
          {step.readMinutes != null && (
            <div className="flex items-center gap-1 text-[12px] text-fg-faint">
              <Clock size={12} /> ~{step.readMinutes} min read
            </div>
          )}
        </div>
      </div>
      {step.intro && (
        <p className="mt-4 border-l-2 border-accent-tint-b pl-3 text-[13.5px] italic text-fg-muted">
          {step.intro}
        </p>
      )}
      <Markdown text={step.body ?? ""} className="mt-5 text-[15px]" />
    </div>
  );
}

function OracleStep({ kbId, subject }: { kbId: string; subject: string }) {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<GroundedAnswer | null>(null);

  async function onAsk() {
    const q = question.trim();
    if (!q) return;
    setAsking(true);
    setAnswer(null);
    try {
      setAnswer(await askQuestion(kbId, q));
    } catch (e) {
      setAnswer({
        answer: e instanceof Error ? e.message : String(e),
        citations: [],
        abstained: true,
      });
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-3">
        <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-accent-tint text-accent-text">
          <Sparkles size={19} />
        </span>
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-fg">Ask the oracle</h1>
          <div className="text-[12px] text-fg-faint">
            Anything the reading didn&apos;t cover — grounded in {subject}&apos;s sources
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onAsk();
        }}
        className="mt-5 flex items-center gap-2 rounded-[12px] border border-border-strong bg-panel px-3 shadow-sm focus-within:border-accent"
      >
        <Search size={16} className="text-fg-faint" />
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about their work…"
          className="h-11 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint"
        />
        <Button type="submit" disabled={asking}>
          {asking ? "Asking…" : "Ask"}
        </Button>
      </form>

      {asking && (
        <Card className="mt-4 p-5">
          <div className="flex items-center gap-2 text-[13px] text-fg-muted">
            <Loader2 size={15} className="animate-spin text-accent" />
            Searching sources &amp; grounding the answer…
          </div>
        </Card>
      )}
      {!asking && answer && <AnswerView answer={answer} />}
    </div>
  );
}

function AnswerView({ answer }: { answer: GroundedAnswer }) {
  const citations = answer.citations ?? [];
  if (answer.abstained) {
    return (
      <Card className="mt-4 animate-fade-up border-warning-b bg-warning-tint p-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-tint px-2.5 py-1 text-[11.5px] font-medium text-warning-text ring-1 ring-warning-b">
          <AlertTriangle size={13} /> Abstained · not in sources
        </span>
        <p className="mt-3 text-[15px] leading-[1.65] text-fg-body">{answer.answer}</p>
      </Card>
    );
  }
  return (
    <Card className="mt-4 animate-fade-up overflow-hidden">
      <div className="p-5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-tint px-2.5 py-1 text-[11.5px] font-medium text-success-text">
          <Check size={13} /> Grounded · {citations.length} source
          {citations.length === 1 ? "" : "s"}
        </span>
        <p className="mt-3 text-[15px] leading-[1.65] text-fg-body">{answer.answer}</p>
      </div>
      {citations.length > 0 && (
        <div className="border-t border-border bg-bg-subtle px-5 py-3.5">
          <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.04em] text-fg-faint">
            Citations
          </div>
          <ul className="flex flex-col gap-1.5">
            {citations.map((c, i) => (
              <li key={c.chunk_id ?? i} className="flex gap-2.5 rounded-md p-2 hover:bg-accent-tint">
                <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded bg-accent-tint px-1 font-mono text-[11px] text-accent-text">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-fg">{c.title ?? "source"}</div>
                  {c.snippet && <p className="text-[12.5px] text-fg-muted">{c.snippet}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0 -rotate-90">
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--bg-muted)" strokeWidth="4" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}

function OnboardingSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1040px] px-6 py-8 md:px-10">
      <Skeleton className="mb-6 h-4 w-48" />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[248px_1fr]">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[92%]" />
          <Skeleton className="h-4 w-[80%]" />
        </div>
      </div>
    </div>
  );
}
