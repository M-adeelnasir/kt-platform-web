import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-12 px-6 py-24">
      <div className="flex max-w-2xl flex-col items-center gap-6 text-center">
        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
          Continuity · MVP
        </span>
        <h1 className="bg-gradient-to-b from-[var(--foreground)] to-[var(--muted)] bg-clip-text text-5xl font-semibold leading-tight tracking-tight text-transparent">
          Knowledge that doesn&apos;t leave when people do.
        </h1>
        <p className="text-lg leading-8 text-[var(--muted)]">
          When someone goes on notice, Continuity captures what they know — from their tools and
          their own head — and turns it into a queryable knowledge asset their team can ask
          questions of for months.
        </p>
        <div className="flex gap-3">
          <Link
            href="/employees"
            className="btn-primary px-5 py-2.5 text-sm"
          >
            View employees
          </Link>
          <Link href="/knowledge-bases" className="btn-secondary px-5 py-2.5 text-sm">
            Knowledge bases
          </Link>
        </div>
      </div>

      <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { step: "1", title: "Connect", body: "Link the employee's Google Workspace & GitHub." },
          { step: "2", title: "Sync", body: "Pull docs, emails, repos — chunked & embedded." },
          { step: "3", title: "Ask", body: "Get grounded, cited answers. It abstains if unsure." },
        ].map((c) => (
          <div key={c.step} className="card p-5">
            <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white">
              {c.step}
            </div>
            <h3 className="font-medium">{c.title}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">{c.body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
