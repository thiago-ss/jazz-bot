"use client";

import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo } from "react";
import { LoaderCircleIcon } from "lucide-react";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { ChatHeader } from "@/components/chat-header";
import { useChatHistory } from "@/components/chat-history-provider";
import { ChatMessageList } from "@/components/chat-message-list";
import { JazzEmptyState } from "@/components/jazz-empty-state";
import {
  clearPendingDraft,
  readPendingDraft,
  writePendingDraft,
} from "@/hooks/use-chat-draft";
import { useToolOpenState } from "@/hooks/use-tool-open-state";

const isMeaningfulInput = (message: PromptInputMessage) =>
  message.text.trim().length > 0;

export function ChatPage({
  chatId,
  initialMessages = [],
}: {
  chatId?: string;
  initialMessages?: UIMessage[];
}) {
  const router = useRouter();
  const { createChat, refreshChats } = useChatHistory();
  const { isToolOpen, handleToolOpenChange } = useToolOpenState();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: chatId ? { chatId } : undefined,
      }),
    [chatId],
  );

  const { error, messages, sendMessage, status, stop } = useChat({
    id: chatId,
    messages: initialMessages,
    onFinish: () => {
      void refreshChats();
    },
    transport,
  });

  useEffect(() => {
    if (!chatId || status !== "ready" || messages.length > 0) {
      return;
    }

    const pendingDraft = readPendingDraft();
    if (!pendingDraft || pendingDraft.chatId !== chatId) {
      return;
    }

    clearPendingDraft();

    void sendMessage({ text: pendingDraft.text }, { body: { chatId } });
  }, [chatId, messages.length, sendMessage, status]);

  const statusLabel = useMemo(() => {
    if (status === "submitted") return "Calling the band";
    if (status === "streaming") return "Writing the next chorus";
    if (status === "error") return "Something went off-key";
    return "Shift+Enter for a new line";
  }, [status]);

  const handleSubmit = async (message: PromptInputMessage) => {
    if (!isMeaningfulInput(message)) {
      return;
    }

    const trimmedText = message.text.trim();

    if (!chatId) {
      const createdChat = await createChat(trimmedText || "Untitled session");
      writePendingDraft({
        chatId: createdChat.id,
        text: trimmedText,
      });

      startTransition(() => {
        router.replace(`/chat/${createdChat.id}`);
      });

      return;
    }

    await sendMessage({ text: trimmedText }, { body: { chatId } });
  };

  const handleSuggestion = (prompt: string) => {
    void handleSubmit({ text: prompt });
  };

  return (
    <div className="flex min-h-dvh flex-1 flex-col">
      <ChatHeader />

      <main className="relative flex min-h-0 flex-1 flex-col">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(185,131,58,0.1),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(37,52,67,0.08),transparent_22%)]" />

        <div className="relative flex min-h-0 flex-1 flex-col px-4 pb-4 sm:px-6 lg:px-10">
          <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
            <Conversation className="min-h-0 flex-1">
              <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-0 pb-28 pt-8 sm:pt-10">
                {messages.length === 0 ? (
                  <JazzEmptyState
                    disabled={status !== "ready"}
                    onSelectAction={handleSuggestion}
                  />
                ) : (
                  <ChatMessageList
                    isToolOpen={isToolOpen}
                    messages={messages}
                    onToolOpenChange={handleToolOpenChange}
                  />
                )}
              </ConversationContent>
              <ConversationScrollButton className="paper-shadow border-border/60 bg-background/95" />
            </Conversation>

            <div className="sticky bottom-0 z-10">
              <div className="from-background/0 to-background/95 pointer-events-none absolute inset-x-0 -top-10 h-10 bg-linear-to-b" />
              <div className="pointer-events-none absolute inset-0 bg-background/80 backdrop-blur-sm" />
              <div className="relative pb-3 pt-2">
                <div className="mx-auto w-full max-w-4xl">
                  {error ? (
                    <div className="mb-3 rounded-[22px] border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm leading-7 text-destructive">
                      {error.message}
                    </div>
                  ) : null}

                  <PromptInput
                    className="paper-shadow w-full bg-(--paper-panel) mb-3 border-border/60 shadow-lg"
                    onSubmit={handleSubmit}
                  >
                    <PromptInputBody>
                      <PromptInputTextarea
                        className="px-4 pt-4 text-[15px] leading-7"
                        placeholder="Ask about artists, albums, eras, theory, or what's happening in jazz right now..."
                      />
                    </PromptInputBody>
                    <PromptInputFooter className="border-t border-border/50 px-3 pt-3">
                      <PromptInputTools>
                        <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {statusLabel}
                        </div>
                      </PromptInputTools>
                      <div className="flex items-center gap-2">
                        {status === "submitted" || status === "streaming" ? (
                          <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
                        ) : null}
                        <PromptInputSubmit
                          className="rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
                          onStop={() => {
                            void stop();
                          }}
                          status={status}
                        />
                      </div>
                    </PromptInputFooter>
                  </PromptInput>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
