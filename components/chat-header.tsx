"use client";

import { useChatHistory } from "@/components/chat-history-provider";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { NewSessionButton } from "@/components/new-session-button";

export function ChatHeader() {
  const { activeChatId, currentChat } = useChatHistory();

  const chatTitle = activeChatId
    ? (currentChat?.title ?? "Jazz conversation")
    : null;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center border-b border-border/50 bg-card">
      <div className="flex w-full items-center gap-0 px-2">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <SidebarTrigger
            className={cn(
              "h-9 w-9 shrink-0 rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground",
            )}
          />

          <div className="mx-1 h-5 w-px shrink-0 bg-border/60" />

          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "min-w-0 truncate text-sm",
                chatTitle
                  ? "font-medium text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {chatTitle ?? "New session"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pr-1">
          {activeChatId && (
            <NewSessionButton className="w-auto" />
          )}
        </div>
      </div>
    </header>
  );
}
