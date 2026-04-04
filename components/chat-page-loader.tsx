"use client";

import type { UIMessage } from "ai";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  ChatDetails,
  normalizeChatDetailsPayload,
} from "@/components/chat-api";
import { ChatHeader } from "@/components/chat-header";
import { ChatPage } from "@/components/chat-page";
import { Button } from "@/components/ui/button";
import { safeJson } from "@/lib/safe-json";

export function ChatPageLoader({ chatId }: { chatId: string }) {
  const [details, setDetails] = useState<ChatDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadChat = async () => {
      try {
        setError(null);
        const response = await fetch(`/api/chats/${chatId}`, {
          cache: "no-store",
          headers: { accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error("We couldn't find that conversation.");
        }

        const payload = await safeJson(response);
        if (!isMounted) {
          return;
        }

        setDetails(normalizeChatDetailsPayload(payload));
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "We couldn't load this conversation.",
        );
      }
    };

    void loadChat();

    return () => {
      isMounted = false;
    };
  }, [chatId]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-1 flex-col">
        <ChatHeader />
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
          <div className="paper-elevated w-full rounded-[30px] border border-border/70 bg-(--paper-panel)/95 p-8">
            <h2 className="font-heading text-4xl text-foreground">
              Missing chat
            </h2>
            <p className="mt-3 text-base leading-8 text-muted-foreground">
              {error}
            </p>
            <Button asChild className="mt-6 rounded-full px-5">
              <Link href="/chat">Start a new chat</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex min-h-dvh flex-1 flex-col">
        <ChatHeader />
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-8 sm:px-6 lg:px-10">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="animate-pulse rounded-[28px] border border-border/60 bg-(--paper-panel)/85 px-6 py-6"
              key={index}
            >
              <div className="h-4 w-3/4 rounded-full bg-muted" />
              <div className="mt-4 h-3 w-full rounded-full bg-muted/80" />
              <div className="mt-2 h-3 w-2/3 rounded-full bg-muted/70" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <ChatPage
      chatId={chatId}
      initialMessages={details.messages as UIMessage[]}
    />
  );
}
