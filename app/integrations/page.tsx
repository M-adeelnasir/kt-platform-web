"use client";

import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";
import { INTEGRATIONS, integrationCounts, type Integration } from "@/lib/integrations";
import { BrandIcon } from "@/components/ui/brand-icon";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export default function IntegrationsPage() {
  const counts = integrationCounts();
  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-8 md:px-10">
      <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-fg">Integrations</h1>
      <p className="mt-1 max-w-[640px] text-[13px] text-fg-muted">
        Connect the tools your people work in. Continuity pulls their artifacts, normalizes them,
        and turns them into a queryable knowledge asset. New sources plug into one connector
        framework — more are on the way.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-[12px]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-tint px-2.5 py-1 font-medium text-success-text">
          <Check size={13} /> {counts.available} available now
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-muted px-2.5 py-1 font-medium text-fg-muted">
          <Clock size={13} /> {counts.coming} coming soon
        </span>
      </div>

      {INTEGRATIONS.map((cat) => (
        <section key={cat.category} className="mt-8">
          <div className="mb-1 flex items-baseline gap-3">
            <h2 className="text-[15px] font-semibold text-fg">{cat.category}</h2>
            <span className="text-[12px] text-fg-faint">{cat.blurb}</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {cat.items.map((it) => (
              <IntegrationCard key={it.type + it.name} it={it} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function IntegrationCard({ it }: { it: Integration }) {
  const available = it.status === "available";
  return (
    <Card className={cn("flex flex-col gap-3 p-4", !available && "opacity-[0.82]")}>
      <div className="flex items-start gap-3">
        <BrandIcon type={it.type} size={42} icon={20} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[14px] font-semibold text-fg">{it.name}</span>
            {it.note && <span className="text-[11px] text-fg-faint">· {it.note}</span>}
          </div>
          <p className="mt-0.5 text-[12.5px] leading-snug text-fg-muted">{it.description}</p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between">
        {available ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-tint px-2.5 py-1 text-[11px] font-medium text-success-text">
            <Check size={12} /> Available
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-muted px-2.5 py-1 text-[11px] font-medium text-fg-muted">
            <Clock size={12} /> Coming soon
          </span>
        )}
        {available && (
          <Link
            href="/employees"
            className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent-text hover:underline"
          >
            Connect <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </Card>
  );
}
