"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  FileText,
  GraduationCap,
  HelpCircle,
  Loader2,
  Mic,
  Plus,
  Search,
  Sparkles,
  Type as TypeIcon,
} from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/env";
import {
  askQuestion,
  getJob,
  getKnowledgeBase,
  getKnowledgeItems,
  getUnanswered,
  ingestText,
  startInterview,
  synthesizeKb,
  type GroundedAnswer,
  type KnowledgeBaseDetail,
  type KnowledgeItem,
  type UnansweredQuestion,
} from "@/lib/api/client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/states";
import { Markdown } from "@/components/ui/markdown";
import { cn } from "@/lib/cn";

const ARTIFACT_META: Record<
  string,
  { label: string; icon: typeof BookOpen; tint: string }
> = {
  overview: { label: "Overview", icon: BookOpen, tint: "bg-accent-tint text-accent-text" },
  gotcha: { label: "Gotchas", icon: AlertTriangle, tint: "bg-warning-tint text-warning-text" },
  glossary: { label: "Glossary", icon: TypeIcon, tint: "bg-bg-muted text-fg-muted" },
  gap: { label: "Open gaps", icon: AlertCircle, tint: "bg-danger-tint text-danger-text" },
};
const ARTIFACT_ORDER = ["overview", "gotcha", "glossary", "gap"];

const SUGGESTIONS = [
  { q: "What are the biggest gotchas in this system?", dashed: false },
  { q: "Why were the key technical decisions made?", dashed: false },
  { q: "Who owns the on-call rotation?", dashed: true }, // likely to abstain
];

export default function KnowledgeBaseWorkspace() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [kb, setKb] = useState<KnowledgeBaseDetail | null>(null);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [unanswered, setUnanswered] = useState<UnansweredQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<GroundedAnswer | null>(null);

  const [open, setOpen] = useState<Record<string, boolean>>({ overview: true });
  const [synthBusy, setSynthBusy] = useState(false);
  const [synthElapsed, setSynthElapsed] = useState(0);

  const [showIngest, setShowIngest] = useState(false);

  const loadItems = useCallback(async () => {
    setItems(await getKnowledgeItems(id));
    // Best-effort: don't let the gap feed break the page if the endpoint is unavailable.
    try {
      setUnanswered(await getUnanswered(id));
    } catch {
      setUnanswered([]);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [detail] = await Promise.all([getKnowledgeBase(id), loadItems()]);
        if (!cancelled) setKb(detail);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onAsk(q?: string) {
    const query = (q ?? question).trim();
    if (!query) return;
    setQuestion(query);
    setAsking(true);
    setAnswer(null);
    try {
      setAnswer(await askQuestion(id, query));
    } catch (e) {
      setAnswer({ answer: e instanceof Error ? e.message : String(e), citations: [], abstained: true });
    } finally {
      setAsking(false);
    }
  }

  async function onSynthesize() {
    setSynthBusy(true);
    setSynthElapsed(0);
    const started = Date.now();
    const tick = setInterval(() => setSynthElapsed(Math.round((Date.now() - started) / 1000)), 1000);
    try {
      const { task_id } = await synthesizeKb(id);
      for (let i = 0; i < 320; i++) {
        const job = await getJob(task_id);
        if (job.ready) {
          if (!job.failed) await loadItems();
          break;
        }
        await new Promise((r) => setTimeout(r, 2500));
      }
    } finally {
      clearInterval(tick);
      setSynthBusy(false);
    }
  }

  async function onStartInterview() {
    try {
      const { interview_id } = await startInterview(id);
      router.push(`/interviews/${interview_id}`);
    } catch {
      /* ignore */
    }
  }

  const subjectName = kb?.subject_person_name ?? "Knowledge base";
  const emp = kb?.employee;
  const subtitle =
    emp?.title || emp?.notice_end_date
      ? [emp?.title, emp?.notice_end_date ? `Departing ${fmtDate(emp.notice_end_date)}` : null]
          .filter(Boolean)
          .join(" · ")
      : "Knowledge base";

  return (
    <div className="mx-auto w-full max-w-[920px] px-6 py-8 md:px-10">
      {/* Subject header */}
      <div className="flex flex-wrap items-center gap-4 border-b border-border pb-6">
        <Avatar name={subjectName} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="truncate text-[21px] font-semibold tracking-[-0.02em] text-fg">
              {subjectName}
            </h1>
            <StatusPill status={emp?.status ?? kb?.status} />
          </div>
          <p className="text-[13px] text-fg-muted">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onSynthesize} disabled={synthBusy}>
            <Sparkles size={15} /> Synthesize
          </Button>
          <Button variant="secondary" onClick={onStartInterview}>
            <Mic size={15} /> Interview
          </Button>
          {items.length > 0 && (
            <Link href={`/knowledge-bases/${id}/onboarding`}>
              <Button variant="secondary">
                <GraduationCap size={15} /> Successor view
              </Button>
            </Link>
          )}
          <DownloadMenu kbId={id} />
          <Button variant="ghost" aria-label="Add document" onClick={() => setShowIngest((s) => !s)}>
            <Plus size={16} />
          </Button>
        </div>
      </div>

      {showIngest && <IngestPanel kbId={id} onDone={loadItems} />}

      {/* Ask the oracle */}
      <section className="mt-8">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-accent" />
          <h2 className="text-[15px] font-semibold text-fg">Ask the oracle</h2>
          <span className="text-[12.5px] text-fg-faint">
            grounded in {subjectName}&apos;s sources — it cites, or abstains
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onAsk();
          }}
          className="mt-3 flex items-center gap-2 rounded-[12px] border border-border-strong bg-panel px-3 shadow-sm focus-within:border-accent"
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

        <div className="mt-2.5 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.q}
              onClick={() => void onAsk(s.q)}
              className={cn(
                "h-7 rounded-full px-3 text-[12.5px] text-fg-muted transition-colors hover:text-fg",
                s.dashed
                  ? "border border-dashed border-border-strong"
                  : "border border-border bg-panel hover:bg-bg-muted",
              )}
            >
              {s.q}
            </button>
          ))}
        </div>

        {asking && <ThinkingCard />}
        {!asking && answer && <AnswerView answer={answer} />}
      </section>

      {/* Unanswered questions — the abstention→gap loop */}
      {unanswered.length > 0 && (
        <section className="mt-9">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HelpCircle size={15} className="text-warning" />
              <h2 className="text-[15px] font-semibold text-fg">Unanswered questions</h2>
              <span className="text-[12.5px] text-fg-faint">
                the oracle abstained on these — capture them before {subjectName.split(" ")[0]} leaves
              </span>
            </div>
            <Button variant="secondary" onClick={onStartInterview}>
              <Mic size={15} /> Capture in interview
            </Button>
          </div>
          <Card className="divide-y divide-border overflow-hidden">
            {unanswered.slice(0, 6).map((u, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex h-6 min-w-[26px] items-center justify-center rounded-full bg-warning-tint px-1.5 text-[11px] font-semibold text-warning-text">
                  {u.count}×
                </span>
                <span className="flex-1 text-[13.5px] text-fg-body">{u.question}</span>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* Synthesized knowledge */}
      <section className="mt-9">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-fg">Synthesized knowledge</h2>
          {items.length > 0 && (
            <span className="text-[12px] text-fg-faint">{items.length} artifacts</span>
          )}
        </div>

        {synthBusy && <SynthBanner elapsed={synthElapsed} />}

        {loadError ? (
          <Card className="border-[color:var(--danger-tint)] bg-danger-tint p-5 text-sm text-danger-text">
            Couldn&apos;t load this knowledge base. <code className="font-mono">{loadError}</code>
          </Card>
        ) : loading || (synthBusy && items.length === 0) ? (
          <ArtifactSkeletons />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Sparkles size={20} />}
            title="No knowledge synthesized yet"
            body="Run synthesis to turn the ingested sources into an overview, gotchas, glossary, and gaps — or start an interview to capture more."
            actions={
              <>
                <Button onClick={onSynthesize} disabled={synthBusy}>
                  <Sparkles size={15} /> Run synthesis
                </Button>
                <Button variant="secondary" onClick={onStartInterview}>
                  <Mic size={15} /> Start interview
                </Button>
              </>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {[...items]
              .sort(
                (a, b) => ARTIFACT_ORDER.indexOf(a.kind) - ARTIFACT_ORDER.indexOf(b.kind),
              )
              .map((it) => (
                <ArtifactCard
                  key={it.id}
                  item={it}
                  open={!!open[it.kind]}
                  onToggle={() => setOpen((o) => ({ ...o, [it.kind]: !o[it.kind] }))}
                />
              ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DownloadMenu({ kbId }: { kbId: string }) {
  const [open, setOpen] = useState(false);
  const base = `${API_BASE_URL}/knowledge-bases/${kbId}/export`;
  const linkCls =
    "flex items-center gap-2 rounded-md px-3 py-2 text-[13px] text-fg hover:bg-bg-muted";
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <Button variant="secondary" onClick={() => setOpen((o) => !o)}>
        <Download size={15} /> Report
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-64 rounded-ctl border border-border bg-panel p-1 shadow-md">
          <a
            href={`${base}?format=html`}
            target="_blank"
            rel="noreferrer"
            className={linkCls}
            onClick={() => setOpen(false)}
          >
            <FileText size={15} className="text-accent" />
            Printable report (PDF via print)
          </a>
          <a href={`${base}?format=md`} className={linkCls} onClick={() => setOpen(false)}>
            <Download size={15} className="text-fg-muted" />
            Markdown (.md)
          </a>
        </div>
      )}
    </div>
  );
}

function ArtifactCard({
  item,
  open,
  onToggle,
}: {
  item: KnowledgeItem;
  open: boolean;
  onToggle: () => void;
}) {
  const meta = ARTIFACT_META[item.kind] ?? {
    label: item.title,
    icon: BookOpen,
    tint: "bg-bg-muted text-fg-muted",
  };
  const Icon = meta.icon;
  return (
    <Card className="overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className={cn("flex h-[34px] w-[34px] items-center justify-center rounded-[10px]", meta.tint)}>
          <Icon size={17} />
        </span>
        <span className="flex-1 text-[14.5px] font-semibold text-fg">{item.title}</span>
        <ChevronDown
          size={18}
          className={cn("text-fg-faint transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="animate-fade-up px-4 pb-5 pl-[64px]">
          <Markdown text={item.body} className="text-[14px]" />
        </div>
      )}
    </Card>
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
          <Check size={13} /> Grounded · {citations.length} source{citations.length === 1 ? "" : "s"}
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

function ThinkingCard() {
  return (
    <Card className="mt-4 p-5">
      <div className="flex items-center gap-2 text-[13px] text-fg-muted">
        <Loader2 size={15} className="animate-spin text-accent" />
        Searching sources &amp; grounding the answer…
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-[92%]" />
        <Skeleton className="h-3.5 w-[70%]" />
      </div>
    </Card>
  );
}

function SynthBanner({ elapsed }: { elapsed: number }) {
  const m = Math.floor(elapsed / 60);
  const s = String(elapsed % 60).padStart(2, "0");
  return (
    <Card className="mb-3 border-accent-tint-b bg-accent-tint p-4">
      <div className="flex items-center gap-3">
        <Loader2 size={16} className="animate-spin text-accent" />
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold text-accent-text">
            Synthesizing knowledge base
          </div>
          <div className="text-[12px] text-fg-muted">
            Reading the sources & interview · updates live
          </div>
        </div>
        <span className="font-mono text-[13px] tabular-nums text-accent-text">
          {m}:{s}
        </span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-accent-tint-b">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
      </div>
    </Card>
  );
}

function ArtifactSkeletons() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="h-[34px] w-[34px] rounded-[10px]" />
          <Skeleton className="h-4 w-40" />
        </Card>
      ))}
    </div>
  );
}

function IngestPanel({ kbId, onDone }: { kbId: string; onDone: () => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    setStatus("Processing…");
    try {
      const { task_id } = await ingestText(kbId, { title: title.trim(), text: text.trim() });
      for (let i = 0; i < 60; i++) {
        const job = await getJob(task_id);
        if (job.ready) {
          setStatus(job.failed ? `Failed: ${job.result}` : "Added.");
          if (!job.failed) {
            setTitle("");
            setText("");
            await onDone();
          }
          return;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <Card className="mt-4 p-4">
      <form onSubmit={submit} className="flex flex-col gap-2">
        <div className="text-[12px] font-medium uppercase tracking-[0.04em] text-fg-faint">
          Add a document
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="h-9 rounded-ctl border border-border bg-panel px-3 text-sm text-fg outline-none focus:border-accent"
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="Paste notes, docs, runbooks…"
          className="rounded-ctl border border-border bg-panel px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
        <div className="flex items-center gap-3">
          <Button type="submit">Ingest</Button>
          {status && <span className="text-[12.5px] text-fg-muted">{status}</span>}
        </div>
      </form>
    </Card>
  );
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
