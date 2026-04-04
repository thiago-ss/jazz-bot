"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  LoaderCircleIcon,
  MessageSquareIcon,
  MessagesSquareIcon,
  Trash2Icon,
} from "lucide-react";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { groupChatsByDate } from "@/lib/group-chats-by-date";
import { ChatSidebarHeader } from "./chat-sidebar-header";
import { ChatSidebarFooter } from "./chat-sidebar-footer";
import { useChatHistory } from "./chat-history-provider";

export function ChatSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const { chats, deleteChat, isLoading } = useChatHistory();
  const { isMobile, toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const groups = useMemo(() => groupChatsByDate(chats), [chats]);

  const closeMobileOnly = () => {
    if (isMobile) toggleSidebar();
  };

  const handleDelete = async (chatId: string) => {
    try {
      setPendingDeleteId(chatId);
      await deleteChat(chatId);
      if (pathname === `/chat/${chatId}`) {
        startTransition(() => router.replace("/chat"));
      }
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <>
      <ChatSidebarHeader
        isCollapsed={isCollapsed}
      />

      <SidebarContent className={cn("px-1.5 py-2", isCollapsed && "px-0")}>
        {isLoading ? (
          <SidebarGroup>
            <SidebarMenu>
              {Array.from({ length: 5 }).map((_, i) => (
                <SidebarMenuSkeleton key={i} showIcon />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ) : chats.length === 0 ? (
          <div
            className={cn(
              "flex flex-col items-center gap-3 px-3 py-12 text-center",
              isCollapsed && "py-6"
            )}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-border bg-background/60 text-muted-foreground">
              <MessagesSquareIcon className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  No sessions yet
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Start a conversation and it&apos;ll appear here.
                </p>
              </div>
            )}
          </div>
        ) : (
          groups.map((group) => (
            <SidebarGroup key={group.label} className="p-0 py-1">
              {!isCollapsed && (
                <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarMenu>
                {group.chats.map((chat) => {
                  const isActive = pathname === `/chat/${chat.id}`;
                  const isDeleting = pendingDeleteId === chat.id;

                  return (
                    <SidebarMenuItem key={chat.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={chat.title}
                        className={cn(
                          "h-auto rounded-lg py-2 pl-2 pr-2 transition-all duration-150",
                          isActive && "bg-primary/8! text-primary!",
                          "group-data-[collapsible=icon]:mx-auto"
                        )}
                      >
                        <Link
                          href={`/chat/${chat.id}`}
                          onClick={closeMobileOnly}
                        >
                          <MessageSquareIcon
                            className={cn(
                              "h-4 w-4 shrink-0 transition-colors",
                              isActive
                                ? "text-primary"
                                : "text-muted-foreground/70"
                            )}
                          />
                          <span className="flex min-w-0 flex-col items-start">
                            <span
                              className={cn(
                                "w-full truncate text-[13px] font-medium leading-5",
                                isActive ? "text-primary" : "text-foreground/85"
                              )}
                            >
                              {chat.title}
                            </span>
                          </span>
                        </Link>
                      </SidebarMenuButton>

                      <SidebarMenuAction
                        aria-label={`Delete "${chat.title}"`}
                        disabled={isDeleting}
                        onClick={() => void handleDelete(chat.id)}
                        showOnHover
                        className="rounded-md hover:bg-destructive/10 hover:text-destructive"
                      >
                        {isDeleting ? (
                          <LoaderCircleIcon className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2Icon className="h-3.5 w-3.5" />
                        )}
                      </SidebarMenuAction>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroup>
          ))
        )}
      </SidebarContent>

      <ChatSidebarFooter chatCount={chats.length} isCollapsed={isCollapsed} />
    </>
  );
}
