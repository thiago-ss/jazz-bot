"use client";

import { useCallback, useState } from "react";

export function useToolOpenState() {
  const [openToolCalls, setOpenToolCalls] = useState<Record<string, boolean>>(
    {}
  );

  const isToolOpen = useCallback(
    (toolCallId: string) => openToolCalls[toolCallId] ?? false,
    [openToolCalls]
  );

  const handleToolOpenChange = useCallback(
    (toolCallId: string, open: boolean) => {
      setOpenToolCalls((current) => {
        if (current[toolCallId] === open) {
          return current;
        }

        return {
          ...current,
          [toolCallId]: open,
        };
      });
    },
    []
  );

  return { isToolOpen, handleToolOpenChange };
}
