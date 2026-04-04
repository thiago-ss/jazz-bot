"use client";

import { SidebarFooter } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface ChatSidebarFooterProps {
  chatCount: number;
  isCollapsed: boolean;
}

export function ChatSidebarFooter({
  chatCount,
  isCollapsed,
}: ChatSidebarFooterProps) {
  return (
    <SidebarFooter
      className={cn(
        "border-t border-sidebar-border px-4 py-3",
        isCollapsed && "px-2 py-3"
      )}
    >
      {isCollapsed ? (
        <div className="flex justify-center">
          <kbd className="flex h-6 w-6 items-center justify-center rounded border border-border bg-background text-[10px] text-muted-foreground shadow-sm">
            K
          </kbd>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{chatCount}</span>{" "}
            {chatCount === 1 ? "session" : "sessions"}
          </p>
          <div className="flex items-center gap-1">
            <kbd className="flex h-5 items-center rounded border border-border bg-background px-1.5 text-[10px] text-muted-foreground shadow-sm">
              ⌘K
            </kbd>
            <span className="text-[10px] text-muted-foreground">new</span>
          </div>
        </div>
      )}
    </SidebarFooter>
  );
}
