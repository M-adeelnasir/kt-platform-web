# Continuity — Frontend (kt-platform-web)

> **AI-powered knowledge transfer.** When an employee leaves, most of what they know leaves with
> them. Continuity captures that knowledge — from the tools they used **and** from their own words
> — and turns it into a **queryable, cited knowledge asset** their successor and team can keep
> asking questions of for months after they're gone.

This repository is the **Next.js web app** — the interface admins and successors use to connect
sources, run AI interviews, browse synthesized knowledge, ask the oracle, and see knowledge-risk
across the org. It talks to the [**kt-platform-api** backend](https://github.com/M-adeelnasir/kt-platform-api)
through a fully typed API client generated from the backend's OpenAPI schema.

---

## What is this app for?

It's the admin + successor experience for the Continuity knowledge-transfer platform. From here you:

- **Manage people** — add employees, choose which tools each one uses, and mark someone
  *on notice* to open their knowledge base.
- **Connect their world** — connect GitHub, Google Workspace, Atlassian, and Microsoft 365 on an
  employee's behalf, then sync their real work in.
- **Ask the oracle** — a grounded Q&A that answers in plain language, **cites its sources**, and
  says "not covered" instead of guessing.
- **Run AI interviews** — capture the tacit knowledge that was never written down, by **text,
  voice, or on camera**.
- **Onboard the successor** — a guided reading path through everything their predecessor knew.
- **See the risk** — an org-wide **knowledge-risk (bus-factor)** dashboard and usage analytics for
  leadership.

## Screens

- **Dashboard** — who's on notice, capture progress, connector health, live jobs.
- **Employees** — searchable, filterable card grid; add-employee modal with per-person connector
  selection; per-employee detail with sources.
- **Knowledge base** — synthesized artifacts (overview, gotchas, glossary, gaps), the grounded
  oracle with citations/abstention, and an "unanswered questions" gap loop.
- **Successor onboarding** — table-of-contents reading path with progress tracking.
- **Interview** — chat UI with text / voice / video modes.
- **Analytics** — questions answered, abstention rate, coverage, 30-day activity.
- **Knowledge risk** — org risk score, single points of failure, per-department breakdown.
- **Integrations** — a marketplace-style gallery of all connectors (live + coming soon).

## Tech stack

Next.js (App Router) · TypeScript (strict) · Tailwind CSS v4 · `next-themes` (light/dark) ·
`lucide-react` + `react-icons` (brand logos) · a typed API client generated from the FastAPI
OpenAPI schema (`openapi-typescript`).

## Project layout

```
app/                    App Router routes (dashboard, employees, knowledge-bases, interviews,
                        analytics, knowledge-risk, integrations) + global styles
components/
  app-shell/            sidebar, top bar, theme toggle
  ui/                   design-system primitives (button, card, avatar, status pill, brand-icon,
                        markdown renderer, connector card, …)
lib/
  api/                  typed API client + generated OpenAPI types
  integrations.ts       connector catalog for the gallery
```

## Getting started

Requires the [backend](https://github.com/M-adeelnasir/kt-platform-api) running (default
`http://localhost:8000`).

```bash
npm install
npm run dev          # http://localhost:3001
```

Point the app at a different API with `NEXT_PUBLIC_API_BASE_URL` (defaults to
`http://localhost:8000`).

### Regenerate the typed API client (after backend schema changes)

```bash
npm run gen:api      # backend must be running; writes lib/api/generated.ts
```

## Quality gates

```bash
npm run typecheck && npm run lint
```

> The generated `lib/api/generated.ts` **is** committed on purpose, so the app typechecks in CI
> without booting the backend.
