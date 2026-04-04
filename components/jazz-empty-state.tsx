"use client";

import {
  BookOpenIcon,
  GitBranchIcon,
  MicVocalIcon,
  TrendingUpIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface FeatureCard {
  icon: React.ElementType;
  label: string;
  description: string;
  prompt: string;
  accent: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: MicVocalIcon,
    label: "Discover artists",
    description: "Find new voices and legends to explore",
    prompt: "Recommend me 5 jazz artists to start with",
    accent:
      "from-amber-500/12 to-amber-500/4 border-amber-500/20 hover:border-amber-500/40",
  },
  {
    icon: BookOpenIcon,
    label: "History & theory",
    description: "Eras, movements, and musical ideas",
    prompt: "Tell me about the history of bebop",
    accent:
      "from-blue-500/12 to-blue-500/4 border-blue-500/20 hover:border-blue-500/40",
  },
  {
    icon: GitBranchIcon,
    label: "Find similar",
    description: "If you like X, you'll love…",
    prompt: "Who sounds like John Coltrane?",
    accent:
      "from-violet-500/12 to-violet-500/4 border-violet-500/20 hover:border-violet-500/40",
  },
  {
    icon: TrendingUpIcon,
    label: "Live stats",
    description: "Play counts, top tracks & albums",
    prompt: "What are Miles Davis's most played tracks?",
    accent:
      "from-emerald-500/12 to-emerald-500/4 border-emerald-500/20 hover:border-emerald-500/40",
  },
];

const QUICK_PROMPTS = [
  "What jazz festivals are happening this summer?",
  "Best albums to understand modal jazz",
  "Who were the pioneers of cool jazz?",
];

export function JazzEmptyState({
  disabled,
  onSelectAction,
}: {
  disabled?: boolean;
  onSelectAction: (prompt: string) => void;
}) {
  return (
    <section className="fade-slide-in flex min-h-[72vh] flex-col justify-center gap-10 py-10">
      <div className="space-y-4">
        <div className="space-y-2.5">
          <h1 className="text-balance font-heading text-[clamp(2.2rem,5vw,3.6rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
            Cue up a conversation.
          </h1>
          <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Deep knowledge across every jazz era — augmented with live data from
            Last.fm and the web when you need it.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FEATURE_CARDS.map((card) => (
          <button
            key={card.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelectAction(card.prompt)}
            className={cn(
              "group flex flex-col gap-3 rounded-2xl border bg-linear-to-b p-4 text-left transition-all duration-200",
              "hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(63,44,20,0.18)]",
              "active:translate-y-0 active:scale-[0.99]",
              "disabled:pointer-events-none disabled:opacity-60",
              card.accent,
            )}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-current/10 bg-background/60 text-foreground/70 transition-colors group-hover:text-foreground">
              <card.icon className="h-4 w-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[13px] font-semibold leading-5 text-foreground">
                {card.label}
              </p>
              <p className="text-[12px] leading-normal text-muted-foreground">
                {card.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
          Try
        </span>
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            disabled={disabled}
            onClick={() => onSelectAction(prompt)}
            className={cn(
              "rounded-full border border-border/60 bg-card/60 px-3.5 py-1.5 text-[12px] text-muted-foreground transition-all",
              "hover:border-border hover:bg-background hover:text-foreground hover:-translate-y-px",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {prompt}
          </button>
        ))}
      </div>
    </section>
  );
}
