"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  getEmployee,
  getJob,
  setEmployeeStatus,
  startConnector,
  syncSource,
  updateEmployee,
  type EmployeeDetail,
} from "@/lib/api/client";
import { StatusBadge } from "@/components/status-badge";
import { BrandIcon } from "@/components/ui/brand-icon";

const STATUSES = ["active", "on_notice", "departed"];

const CONNECTORS = [
  { type: "google", title: "Google Workspace", subtitle: "Drive · Docs · Gmail" },
  { type: "github", title: "GitHub", subtitle: "repos · PRs · commits" },
  { type: "atlassian", title: "Atlassian", subtitle: "Jira issues · Confluence pages" },
  { type: "microsoft", title: "Microsoft 365", subtitle: "Outlook · OneDrive/SharePoint · Teams" },
];

export default function EmployeeDetailPage() {
  return (
    <Suspense fallback={<Shell><p className="text-sm text-[var(--muted)]">Loading…</p></Shell>}>
      <EmployeeDetailInner />
    </Suspense>
  );
}

function EmployeeDetailInner() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const search = useSearchParams();
  const connectResult = search.get("connect");

  const [detail, setDetail] = useState<EmployeeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", title: "" });

  const refresh = useCallback(async () => {
    try {
      setDetail(await getEmployee(id));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  function startEdit() {
    if (!detail) return;
    setEditForm({
      name: detail.employee.name,
      email: detail.employee.email,
      title: detail.employee.title ?? "",
    });
    setEditing(true);
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      setDetail(
        await updateEmployee(id, {
          name: editForm.name,
          email: editForm.email,
          title: editForm.title || undefined,
        }),
      );
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onStatus(status: string) {
    setBusy(true);
    try {
      setDetail(await setEmployeeStatus(id, status));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onConnect(sourceType: string) {
    setBusy(true);
    try {
      const { auth_url } = await startConnector(sourceType, id);
      window.location.assign(auth_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  async function onSync(sourceId: string) {
    setSyncMsg("Starting sync…");
    try {
      const { task_id } = await syncSource(sourceId);
      setSyncMsg("Syncing (fetch → embed → index)…");
      for (let i = 0; i < 120; i++) {
        const job = await getJob(task_id);
        if (job.ready) {
          setSyncMsg(
            job.failed
              ? `Sync failed: ${job.result} (try restarting the Celery worker)`
              : `Sync done: ${job.result ?? "ok"}`,
          );
          await refresh();
          return;
        }
        await new Promise((r) => setTimeout(r, 1500));
      }
      setSyncMsg("Still syncing — check back shortly.");
    } catch (e) {
      setSyncMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (error) return <Shell><p className="text-sm text-red-600">{error}</p></Shell>;
  if (!detail) return <Shell><p className="text-sm text-[var(--muted)]">Loading…</p></Shell>;

  const emp = detail.employee;
  const sources = detail.sources ?? [];
  // Show only the connectors this employee uses; fall back to all if none were selected.
  const selected = (emp.connectors ?? []).filter((t) => CONNECTORS.some((c) => c.type === t));
  const shownConnectors = selected.length
    ? CONNECTORS.filter((c) => selected.includes(c.type))
    : CONNECTORS;

  return (
    <Shell>
      {connectResult === "success" && (
        <Banner tone="ok">Source connected. Click <strong>Sync now</strong> to pull content.</Banner>
      )}
      {connectResult === "error" && (
        <Banner tone="err">Connection failed or was cancelled. Try again.</Banner>
      )}

      {/* Header */}
      <div className="card flex items-start justify-between gap-4 p-5">
        {editing ? (
          <form onSubmit={onSaveEdit} className="flex w-full flex-col gap-2">
            <input
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              placeholder="Name"
              className="input px-3 py-2 text-sm"
            />
            <input
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              placeholder="Email"
              className="input px-3 py-2 text-sm"
            />
            <input
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              placeholder="Title"
              className="input px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={busy} className="btn-primary px-3 py-1.5 text-sm">
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn-secondary px-3 py-1.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-base font-semibold text-white">
                {emp.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
              </span>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold tracking-tight">{emp.name}</h1>
                  <button
                    onClick={startEdit}
                    className="text-xs text-[var(--muted)] underline hover:text-[var(--foreground)]"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {emp.title ? `${emp.title} · ` : ""}
                  {emp.email}
                </p>
              </div>
            </div>
            <StatusBadge status={emp.status} />
          </>
        )}
      </div>

      {/* Status */}
      <Section title="Status">
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              disabled={busy || s === emp.status}
              onClick={() => onStatus(s)}
              className="btn-secondary px-3 py-1.5 text-sm capitalize disabled:opacity-40"
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </Section>

      {/* Knowledge base */}
      <Section title="Knowledge base">
        {detail.knowledge_base_id ? (
          <Link
            href={`/knowledge-bases/${detail.knowledge_base_id}`}
            className="btn-primary inline-block px-4 py-2 text-sm"
          >
            Open knowledge base (ask questions) →
          </Link>
        ) : (
          <p className="text-sm text-[var(--muted)]">
            No knowledge base yet. Set status to <strong>on notice</strong> to open one.
          </p>
        )}
      </Section>

      {/* Sources */}
      <Section title="Sources">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {shownConnectors.map((c) => {
            const src = sources.find((s) => s.type === c.type);
            return (
              <ConnectorCard
                key={c.type}
                type={c.type}
                title={c.title}
                subtitle={c.subtitle}
                connected={src?.status === "connected"}
                hasSource={!!src}
                lastSynced={src?.last_synced_at ?? null}
                onConnect={() => onConnect(c.type)}
                onSync={src ? () => onSync(src.id) : undefined}
                busy={busy}
              />
            );
          })}
        </div>
        {syncMsg && <p className="text-xs text-[var(--muted)]">{syncMsg}</p>}
      </Section>
    </Shell>
  );
}

function ConnectorCard(props: {
  type: string;
  title: string;
  subtitle: string;
  connected: boolean;
  hasSource: boolean;
  lastSynced: string | null;
  onConnect: () => void;
  onSync?: () => void;
  busy: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandIcon type={props.type} size={38} icon={18} />
          <div>
            <span className="font-medium">{props.title}</span>
            <span className="ml-2 text-xs text-[var(--muted)]">{props.subtitle}</span>
          </div>
        </div>
        {props.connected ? (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-400/20">
            Connected
          </span>
        ) : (
          <button
            disabled={props.busy}
            onClick={props.onConnect}
            className="btn-primary px-3 py-1.5 text-sm"
          >
            {props.hasSource ? `Finish connecting ${props.title}` : `Connect ${props.title}`}
          </button>
        )}
      </div>
      {props.connected && props.onSync && (
        <div className="mt-3 flex items-center gap-3">
          <button onClick={props.onSync} className="btn-secondary px-3 py-1.5 text-sm">
            Sync now
          </button>
          <span className="text-xs text-[var(--muted)]">
            {props.lastSynced
              ? `Last synced: ${new Date(props.lastSynced).toLocaleString()}`
              : "Never synced"}
          </span>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{title}</h2>
      {children}
    </section>
  );
}

function Banner({ tone, children }: { tone: "ok" | "err"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
      : "border-red-300 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
  return <div className={`rounded-lg border p-3 text-sm ${cls}`}>{children}</div>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col gap-6 px-6 py-10 md:px-10">
      <Link href="/employees" className="text-sm text-[var(--muted)] hover:underline">
        ← All employees
      </Link>
      {children}
    </main>
  );
}
