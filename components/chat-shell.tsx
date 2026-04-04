"use client";

import { ChatHistoryProvider } from "@/components/chat-history-provider";
import { ChatSidebar } from "@/components/chat-sidebar";
import { Sidebar, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, type ReactNode } from "react";

function NewChatShortcut() {
  const router = useRouter();

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target;
      const isEditable =
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement);

      if (isEditable) {
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        startTransition(() => {
          router.push("/chat");
        });
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [router]);

  return null;
}

export function ChatShell({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ChatHistoryProvider>
      <SidebarProvider defaultOpen={true}>
        <NewChatShortcut />
        <Sidebar collapsible="icon" side="left">
          <ChatSidebar />
        </Sidebar>
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </ChatHistoryProvider>
  );
}
