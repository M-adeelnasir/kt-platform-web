import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Minimal, dependency-free Markdown renderer for synthesized artifact bodies + oracle answers.
 * The local LLM emits simple Markdown (headings, bold, inline code, bullet/numbered lists,
 * paragraphs) — we render just that, safely building React nodes (no dangerouslySetInnerHTML).
 */

const HEADING_SIZE: Record<number, string> = {
  1: "text-[18px]",
  2: "text-[16px]",
  3: "text-[15px]",
  4: "text-[14px]",
  5: "text-[13.5px]",
  6: "text-[13px]",
};

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // **bold** or `code`
  const re = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      parts.push(
        <strong key={key++} className="font-semibold text-fg">
          {m[2]}
        </strong>,
      );
    } else if (m[3] !== undefined) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-bg-muted px-1 py-0.5 font-mono text-[0.86em] text-fg"
        >
          {m[3]}
        </code>,
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const lines = (text ?? "").replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  const isBlockStart = (l: string) => /^(#{1,6})\s|^\s*[-*]\s|^\s*\d+\.\s/.test(l);

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      blocks.push(
        <p
          key={key++}
          className={cn(
            "font-semibold tracking-[-0.01em] text-fg",
            level <= 2 ? "mt-5 first:mt-0" : "mt-4 first:mt-0",
            HEADING_SIZE[level] ?? "text-[14px]",
          )}
        >
          {renderInline(h[2])}
        </p>,
      );
      i++;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="mt-2.5 flex flex-col gap-1.5 first:mt-0">
          {items.map((it, idx) => (
            <li key={idx} className="flex gap-2.5 leading-[1.65] text-fg-body">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-accent" />
              <span className="min-w-0">{renderInline(it)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="mt-2.5 flex flex-col gap-1.5 first:mt-0">
          {items.map((it, idx) => (
            <li key={idx} className="flex gap-2.5 leading-[1.65] text-fg-body">
              <span className="shrink-0 font-mono text-[12.5px] text-accent-text">{idx + 1}.</span>
              <span className="min-w-0">{renderInline(it)}</span>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // paragraph: gather consecutive non-blank, non-block lines
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      para.push(lines[i].trim());
      i++;
    }
    blocks.push(
      <p key={key++} className="mt-2.5 leading-[1.7] text-fg-body first:mt-0">
        {renderInline(para.join(" "))}
      </p>,
    );
  }

  return <div className={className}>{blocks}</div>;
}
