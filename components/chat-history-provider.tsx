"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  type ChatSummary,
  normalizeChatListPayload,
  normalizeChatSummary,
} from "@/components/chat-api";
import { safeJson } from "@/lib/safe-json";

interface ChatHistoryContextValue {
  activeChatId?: string;
  chats: ChatSummary[];
  currentChat: ChatSummary | null;
  createChat: (title?: string) => Promise<ChatSummary>;
  deleteChat: (chatId: string) => Promise<void>;
  isLoading: boolean;
  refreshChats: () => Promise<void>;
}

const ChatHistoryContext = createContext<ChatHistoryContextValue | null>(null);

const parseActiveChatId = (pathname: string): string | undefined => {
  const match = pathname.match(/^\/chat\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
};

export function ChatHistoryProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeChatId = useMemo(() => parseActiveChatId(pathname), [pathname]);

  const refreshChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/chats", {
        cache: "no-store",
        headers: { accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Unable to load chats.");
      }

      const payload = await safeJson(response);
      setChats(normalizeChatListPayload(payload));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createChat = useCallback(async (title?: string) => {
    const response = await fetch("/api/chats", {
      body: JSON.stringify(title ? { title } : {}),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Unable to create a new chat.");
    }

    const payload = await safeJson(response);
    const nestedChat =
      typeof payload === "object" && payload !== null && "chat" in payload
        ? payload.chat
        : null;
    const createdChat =
      normalizeChatSummary(payload) ?? normalizeChatSummary(nestedChat);

    if (!createdChat) {
      throw new Error("The chat API did not return a valid chat.");
    }

    setChats((currentChats) =>
      normalizeChatListPayload([createdChat, ...currentChats])
    );

    return createdChat;
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    const response = await fetch(`/api/chats/${chatId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Unable to delete the chat.");
    }

    setChats((currentChats) =>
      currentChats.filter((chat) => chat.id !== chatId)
    );
  }, []);

  useEffect(() => {
    void refreshChats();
  }, [pathname, refreshChats]);

  const currentChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) ?? null,
    [activeChatId, chats]
  );

  const value = useMemo<ChatHistoryContextValue>(
    () => ({
      activeChatId,
      chats,
      createChat,
      currentChat,
      deleteChat,
      isLoading,
      refreshChats,
    }),
    [
      activeChatId,
      chats,
      createChat,
      currentChat,
      deleteChat,
      isLoading,
      refreshChats,
    ]
  );

  return (
    <ChatHistoryContext.Provider value={value}>
      {children}
    </ChatHistoryContext.Provider>
  );
}

export const useChatHistory = () => {
  const context = useContext(ChatHistoryContext);

  if (!context) {
    throw new Error("useChatHistory must be used inside ChatHistoryProvider.");
  }

  return context;
};
