"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { DynamicToolUIPart, ToolUIPart } from "ai";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  LoaderCircleIcon,
  XCircleIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { isValidElement } from "react";

import { CodeBlock } from "./code-block";

const stringifyToolValue = (value: unknown) => {
  if (value === undefined) return null;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn("group not-prose rounded-[inherit] border", className)}
    {...props}
  />
);

export type ToolPart = ToolUIPart | DynamicToolUIPart;

export type ToolHeaderProps = {
  title?: string;
  className?: string;
} & (
  | { type: ToolUIPart["type"]; state: ToolUIPart["state"]; toolName?: never }
  | {
      type: DynamicToolUIPart["type"];
      state: DynamicToolUIPart["state"];
      toolName: string;
    }
);

const statusConfig: Record<
  ToolPart["state"],
  { icon: ReactNode; label: string }
> = {
  "approval-requested": {
    icon: <LoaderCircleIcon className="size-3.5 text-amber-500" />,
    label: "Awaiting approval",
  },
  "approval-responded": {
    icon: <CheckCircleIcon className="size-3.5 text-primary" />,
    label: "Responded",
  },
  "input-available": {
    icon: <LoaderCircleIcon className="size-3.5 animate-spin text-muted-foreground" />,
    label: "Running",
  },
  "input-streaming": {
    icon: <LoaderCircleIcon className="size-3.5 animate-spin text-muted-foreground" />,
    label: "Pending",
  },
  "output-available": {
    icon: <CheckCircleIcon className="size-3.5 text-primary" />,
    label: "Done",
  },
  "output-denied": {
    icon: <XCircleIcon className="size-3.5 text-destructive" />,
    label: "Denied",
  },
  "output-error": {
    icon: <XCircleIcon className="size-3.5 text-destructive" />,
    label: "Error",
  },
};

export const ToolHeader = ({
  className,
  title,
  type,
  state,
  toolName,
  ...props
}: ToolHeaderProps) => {
  const derivedName =
    type === "dynamic-tool" ? toolName : type.split("-").slice(1).join("-");
  const { icon, label } = statusConfig[state];

  return (
    <CollapsibleTrigger
      className={cn(
        "flex w-full items-center justify-between gap-3 px-4 py-3",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        {icon}
        <span className="truncate text-sm font-medium">
          {title ?? derivedName}
        </span>
        <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      </div>
      <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  );
};

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 space-y-3 px-4 pb-4 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className,
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolPart["input"];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => {
  const serializedInput = stringifyToolValue(input);

  if (!serializedInput) {
    return (
      <div className="text-xs italic text-muted-foreground">
        Waiting for parameters...
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden rounded-lg bg-muted/50", className)} {...props}>
      <CodeBlock code={serializedInput} language="json" />
    </div>
  );
};

export type ToolOutputProps = ComponentProps<"div"> & {
  output: ToolPart["output"];
  errorText: ToolPart["errorText"];
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) return null;

  let Output = <div>{output as ReactNode}</div>;

  if (typeof output === "object" && !isValidElement(output)) {
    const serializedOutput = stringifyToolValue(output);
    Output = serializedOutput ? (
      <CodeBlock code={serializedOutput} language="json" />
    ) : (
      <div className="px-4 py-3 text-xs italic text-muted-foreground">
        No structured output available.
      </div>
    );
  } else if (typeof output === "string") {
    Output = <CodeBlock code={output} language="json" />;
  }

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {errorText ? "Error" : "Result"}
      </h4>
      <div
        className={cn(
          "overflow-x-auto rounded-lg text-xs [&_table]:w-full",
          errorText
            ? "bg-destructive/10 text-destructive"
            : "bg-muted/50 text-foreground",
        )}
      >
        {errorText && <div className="px-4 py-3">{errorText}</div>}
        {Output}
      </div>
    </div>
  );
};
