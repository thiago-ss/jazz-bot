"use client";

import { ExternalLinkIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isUrl = (value: string) => /^https?:\/\//.test(value);

function ResultValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">Not available</span>;
  }

  if (typeof value === "string") {
    if (isUrl(value)) {
      return (
        <a
          className="inline-flex items-center gap-1 text-accent-foreground underline-offset-4 hover:underline"
          href={value}
          rel="noreferrer"
          target="_blank"
        >
          Open source
          <ExternalLinkIcon className="size-3.5" />
        </a>
      );
    }

    return <span>{value}</span>;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return <span>{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-muted-foreground">None</span>;
    }

    return (
      <ul className="space-y-2">
        {value.slice(0, 8).map((item, index) => (
          <li className="leading-6" key={index}>
            <ResultValue value={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);

    return (
      <div className="space-y-3">
        {entries.slice(0, 8).map(([key, nestedValue]) => (
          <div key={key}>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {key.replaceAll(/([A-Z])/g, " $1")}
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/70 p-3">
              <ResultValue value={nestedValue} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <pre className="overflow-x-auto whitespace-pre-wrap text-xs leading-6">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function ToolResultCard({
  className,
  output,
  result,
  title,
  toolName,
}: {
  className?: string;
  output?: unknown;
  result?: unknown;
  title?: string;
  toolName?: string;
}) {
  const resolvedOutput = output ?? result;
  const resolvedTitle = title ?? toolName ?? "Result";

  return (
    <div
      className={cn(
        "rounded-[24px] border border-border/60 bg-(--paper-panel)/90 p-4",
        className,
      )}
    >
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {resolvedTitle}
      </div>
      <div className="text-sm leading-7 text-foreground">
        <ResultValue value={resolvedOutput} />
      </div>
    </div>
  );
}
