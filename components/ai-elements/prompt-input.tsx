"use client";

import { InputGroup } from "@/components/ui/input-group";
import { useReferencedSources } from "@/hooks/use-referenced-sources";
import { cn } from "@/lib/utils";
import type { FormEventHandler } from "react";
import { useCallback, useRef } from "react";
import {
  LocalReferencedSourcesContext,
  useOptionalPromptInputController,
  type PromptInputProps,
} from "./prompt-input-context";

export const PromptInput = ({
  className,
  onSubmit,
  children,
  ...props
}: PromptInputProps) => {
  const controller = useOptionalPromptInputController();
  const formRef = useRef<HTMLFormElement | null>(null);
  const { refsCtx, clearReferencedSources } = useReferencedSources();
  const clear = useCallback(() => {
    clearReferencedSources();
  }, [clearReferencedSources]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = useCallback(
    async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const text = controller
        ? controller.textInput.value
        : (new FormData(form).get("message") as string) || "";
      if (!controller) {
        form.reset();
      }

      try {
        const result = onSubmit({ text }, event);
        if (result instanceof Promise) {
          try {
            await result;
            clear();
            controller?.textInput.clear();
          } catch {
            // Don't clear on error - user may want to retry
          }
        } else {
          clear();
          controller?.textInput.clear();
        }
      } catch {
        // Don't clear on error - user may want to retry
      }
    },
    [controller, onSubmit, clear]
  );

  return (
    <LocalReferencedSourcesContext.Provider value={refsCtx}>
      <form
        className={cn("w-full", className)}
        onSubmit={handleSubmit}
        ref={formRef}
        {...props}
      >
        <InputGroup className="overflow-hidden">{children}</InputGroup>
      </form>
    </LocalReferencedSourcesContext.Provider>
  );
};

// Re-exports — single import point for all PromptInput API
export * from "./prompt-input-context";
export * from "./prompt-input-textarea";
export * from "./prompt-input-primitives";
