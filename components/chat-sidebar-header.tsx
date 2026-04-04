"use client";

import { SidebarHeader } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { NewSessionButton } from "@/components/new-session-button";

interface ChatSidebarHeaderProps {
  isCollapsed: boolean;
}

export function ChatSidebarHeader({ isCollapsed }: ChatSidebarHeaderProps) {
  return (
    <SidebarHeader className="p-0">
      <div
        className={cn(
          "flex items-center gap-3 px-4 pt-5 pb-3",
          isCollapsed && "justify-center px-0 py-3",
        )}
      >
        <div className="relative flex h-8 w-8 items-center justify-center">
          <span className="text-2xl">🎵</span>
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <p className="font-heading text-base font-bold leading-none tracking-tight text-foreground">
              Jazzbot
            </p>
            <p className="mt-1.5 text-[11px] leading-none text-muted-foreground/60 tracking-wide">
              AI music assistant
            </p>
          </div>
        )}
      </div>

      <div
        className={cn("px-3 pb-3", isCollapsed && "flex justify-center px-0")}
      >
        <NewSessionButton compact={isCollapsed} />
      </div>

      <div className="mx-3 h-px bg-sidebar-border" />
    </SidebarHeader>
  );
}
