"use client";

import type { SourceDocumentUIPart } from "ai";
import { nanoid } from "nanoid";
import { useCallback, useMemo, useState } from "react";
import type { ReferencedSourcesContext } from "@/components/ai-elements/prompt-input-context";

export function useReferencedSources() {
  const [referencedSources, setReferencedSources] = useState<
    (SourceDocumentUIPart & { id: string })[]
  >([]);

  const clearReferencedSources = useCallback(
    () => setReferencedSources([]),
    []
  );

  const refsCtx = useMemo<ReferencedSourcesContext>(
    () => ({
      add: (incoming: SourceDocumentUIPart[] | SourceDocumentUIPart) => {
        const array = Array.isArray(incoming) ? incoming : [incoming];
        setReferencedSources((prev) => [
          ...prev,
          ...array.map((s) => ({ ...s, id: nanoid() })),
        ]);
      },
      clear: clearReferencedSources,
      remove: (id: string) => {
        setReferencedSources((prev) => prev.filter((s) => s.id !== id));
      },
      sources: referencedSources,
    }),
    [referencedSources, clearReferencedSources]
  );

  return { refsCtx, clearReferencedSources };
}
