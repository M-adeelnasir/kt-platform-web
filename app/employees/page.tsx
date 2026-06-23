"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus, Search, UserPlus, X } from "lucide-react";
import { createEmployee, listEmployees, type Employee } from "@/lib/api/client";
import { Avatar } from "@/components/ui/avatar";
import { BrandIcon } from "@/components/ui/brand-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/cn";

const CONNECTABLE = [
  { type: "google", name: "Google Workspace" },
  { type: "github", name: "GitHub" },
  { type: "atlassian", name: "Atlassian" },
  { type: "microsoft", name: "Microsoft 365" },
];

const STATUS_TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "on_notice", label: "On notice" },
  { key: "departed", label: "Departed" },
];

const STATUS_META: Record<string, { label: string; tone: "neutral" | "warning" | "success" }> = {
  active: { label: "Active", tone: "neutral" },
  on_notice: { label: "On notice", tone: "warning" },
  departed: { label: "Departed", tone: "success" },
};

const PAGE_SIZE = 8;

export default function EmployeesPage() {
  const router = useRouter();
  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [showForm, setShowForm] = useState(false);

  async function refresh() {
    try {
      setItems(await listEmployees());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (!q) return true;
      return [e.name, e.title, e.email].filter(Boolean).some((f) => f!.toLowerCase().includes(q));
    });
  }, [items, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const shown = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    for (const e of items) c[e.status] = (c[e.status] ?? 0) + 1;
    return c;
  }, [items]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-fg">Employees</h1>
          <p className="mt-1 text-[13px] text-fg-muted">
            Set someone to <span className="font-medium text-fg">on notice</span> to open their
            knowledge base and start capturing.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add employee
        </Button>
      </div>

      {/* Toolbar: search + status tabs */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex h-10 min-w-[240px] flex-1 items-center gap-2 rounded-ctl border border-border-strong bg-panel px-3 focus-within:border-accent">
          <Search size={16} className="text-fg-faint" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder="Search by name, title, or email…"
            className="h-full flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear">
              <X size={15} className="text-fg-faint hover:text-fg" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 rounded-ctl border border-border bg-bg-subtle p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setStatusFilter(t.key);
                setPage(0);
              }}
              className={cn(
                "h-8 rounded-[7px] px-3 text-[12.5px] font-medium transition-colors",
                statusFilter === t.key
                  ? "bg-panel text-fg shadow-sm"
                  : "text-fg-muted hover:text-fg",
              )}
            >
              {t.label}
              <span className="ml-1.5 text-fg-faint">{counts[t.key] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-danger-text">{error}</p>}

      {/* List */}
      <div className="mt-4">
        {loading ? (
          <ListSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<UserPlus size={20} />}
            title={items.length === 0 ? "No employees yet" : "No matches"}
            body={
              items.length === 0
                ? "Add an employee to start capturing their knowledge."
                : "Try a different search or filter."
            }
            actions={
              items.length === 0 ? (
                <Button onClick={() => setShowForm(true)}>
                  <Plus size={15} /> Add employee
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((emp) => {
              const meta = STATUS_META[emp.status] ?? { label: emp.status, tone: "neutral" };
              const conns = (emp.connectors ?? []).filter((c) =>
                CONNECTABLE.some((k) => k.type === c),
              );
              return (
                <button
                  key={emp.id}
                  onClick={() => router.push(`/employees/${emp.id}`)}
                  className="group flex flex-col gap-3 rounded-card border border-border bg-panel p-4 text-left transition-colors hover:border-border-strong hover:bg-bg-subtle"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.name} size={42} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14.5px] font-semibold text-fg">{emp.name}</div>
                      <div className="truncate text-[12.5px] text-fg-muted">
                        {emp.title ?? emp.email}
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-fg-faint transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <StatusPill label={meta.label} tone={meta.tone} />
                    {conns.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        {conns.map((c) => (
                          <BrandIcon key={c} type={c} size={26} icon={13} />
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[12.5px] text-fg-faint">
              Showing {current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, filtered.length)}{" "}
              of {filtered.length}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={current === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <span className="text-[12.5px] text-fg-muted">
                {current + 1} / {pageCount}
              </span>
              <Button
                variant="secondary"
                disabled={current >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <AddEmployeeModal
          onClose={() => setShowForm(false)}
          onCreated={async () => {
            setShowForm(false);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function AddEmployeeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    title: "",
    status: "active",
  });
  const [connectors, setConnectors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggle(type: string) {
    setConnectors((c) => (c.includes(type) ? c.filter((x) => x !== type) : [...c, type]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setErr("Name and email are required.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await createEmployee({
        name: form.name.trim(),
        email: form.email.trim(),
        title: form.title.trim() || undefined,
        status: form.status,
        connectors,
      });
      await onCreated();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  const field = "h-10 rounded-ctl border border-border bg-panel px-3 text-sm text-fg outline-none focus:border-accent placeholder:text-fg-faint";

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-[520px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-fg">Add employee</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={18} className="text-fg-faint hover:text-fg" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Labeled label="Full name" required>
              <input
                autoFocus
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Jane Doe"
                className={field}
              />
            </Labeled>
            <Labeled label="Email" required>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@company.com"
                className={field}
              />
            </Labeled>
            <div className="sm:col-span-2">
              <Labeled label="Title / role">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Senior Backend Engineer"
                  className={cn(field, "w-full")}
                />
              </Labeled>
            </div>
          </div>

          <Labeled label="Status">
            <div className="flex gap-2">
              {["active", "on_notice", "departed"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, status: s })}
                  className={cn(
                    "h-9 flex-1 rounded-ctl border text-[12.5px] font-medium capitalize transition-colors",
                    form.status === s
                      ? "border-accent-tint-b bg-accent-tint text-accent-text"
                      : "border-border text-fg-muted hover:bg-bg-muted",
                  )}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </Labeled>

          <Labeled label="Tools this person uses">
            <p className="-mt-1 mb-1 text-[12px] text-fg-faint">
              Pick the services to capture from. You&apos;ll connect each one on their page.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CONNECTABLE.map((c) => {
                const on = connectors.includes(c.type);
                return (
                  <button
                    key={c.type}
                    type="button"
                    onClick={() => toggle(c.type)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-ctl border px-3 py-2 text-left text-[13px] transition-colors",
                      on
                        ? "border-accent-tint-b bg-accent-tint text-accent-text"
                        : "border-border text-fg-muted hover:bg-bg-muted",
                    )}
                  >
                    <BrandIcon type={c.type} size={28} icon={15} />
                    <span className="flex-1 font-medium">{c.name}</span>
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-[5px] border",
                        on ? "border-accent bg-accent text-white" : "border-border-strong",
                      )}
                    >
                      {on && "✓"}
                    </span>
                  </button>
                );
              })}
            </div>
          </Labeled>

          {err && <p className="text-[13px] text-danger-text">{err}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Adding…" : "Add employee"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function Labeled({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-fg-muted">
        {label}
        {required && <span className="text-danger-text"> *</span>}
      </span>
      {children}
    </label>
  );
}

function ListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-[104px] rounded-card" />
      ))}
    </div>
  );
}
