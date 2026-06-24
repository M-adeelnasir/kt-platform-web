"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookText, Plus, Search, X } from "lucide-react";
import { createKnowledgeBase, listKnowledgeBases, type KnowledgeBase } from "@/lib/api/client";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/states";
import { cn } from "@/lib/cn";

export default function KnowledgeBasesPage() {
  const router = useRouter();
  const [items, setItems] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function refresh() {
    try {
      setItems(await listKnowledgeBases());
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

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const kb = await createKnowledgeBase(name.trim());
      setName("");
      setShowForm(false);
      router.push(`/knowledge-bases/${kb.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((k) => k.subject_person_name.toLowerCase().includes(q)) : items;
  }, [items, query]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 md:px-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-fg">Knowledge bases</h1>
          <p className="mt-1 text-[13px] text-fg-muted">
            One per departing person — usually created automatically when someone goes on notice.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? "Cancel" : "New knowledge base"}
        </Button>
      </div>

      {showForm && (
        <Card className="mt-5 p-4">
          <form onSubmit={onCreate} className="flex flex-col gap-2 sm:flex-row">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Subject person's name (e.g. Dana — billing)"
              className="h-10 flex-1 rounded-ctl border border-border bg-panel px-3 text-sm text-fg outline-none focus:border-accent placeholder:text-fg-faint"
            />
            <Button type="submit" disabled={creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </form>
        </Card>
      )}

      {items.length > 0 && (
        <div className="mt-5 flex h-10 max-w-[360px] items-center gap-2 rounded-ctl border border-border-strong bg-panel px-3 focus-within:border-accent">
          <Search size={16} className="text-fg-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search knowledge bases…"
            className="h-full flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-faint"
          />
        </div>
      )}

      {error && <p className="mt-4 text-sm text-danger-text">{error}</p>}

      <div className="mt-5">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-24 rounded-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BookText size={20} />}
            title={items.length === 0 ? "No knowledge bases yet" : "No matches"}
            body={
              items.length === 0
                ? "Set an employee to on notice to open one automatically, or create one here."
                : "Try a different search."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((kb) => (
              <button
                key={kb.id}
                onClick={() => router.push(`/knowledge-bases/${kb.id}`)}
                className={cn(
                  "group flex items-center gap-3 rounded-card border border-border bg-panel p-4 text-left transition-colors hover:border-border-strong hover:bg-bg-subtle",
                )}
              >
                <Avatar name={kb.subject_person_name} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold text-fg">
                    {kb.subject_person_name}
                  </div>
                  <div className="mt-1">
                    <StatusPill status={kb.status} />
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="text-fg-faint transition-transform group-hover:translate-x-0.5"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
