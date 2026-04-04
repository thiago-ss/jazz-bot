"use client";

import {
  isReasoningUIPart,
  isTextUIPart,
  isToolOrDynamicToolUIPart,
  type UIMessage,
} from "ai";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { ToolResultCard } from "@/components/tool-result-card";

type ToolMessagePart = Extract<
  UIMessage["parts"][number],
  { type: "dynamic-tool" | `tool-${string}` }
>;

const getToolTitle = (part: UIMessage["parts"][number]) => {
  if ("toolName" in part && typeof part.toolName === "string") {
    return part.toolName.replace(/^tool-/, "");
  }
  return "";
};

const getMessageText = (message: UIMessage) =>
  message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("\n\n");

const renderToolHeader = (part: ToolMessagePart) => {
  if ("toolName" in part && part.type === "dynamic-tool") {
    return (
      <ToolHeader
        state={part.state}
        title={getToolTitle(part)}
        toolName={part.toolName}
        type={part.type}
      />
    );
  }

  return (
    <ToolHeader
      state={part.state}
      title={getToolTitle(part)}
      type={part.type}
    />
  );
};

interface ChatMessageListProps {
  messages: UIMessage[];
  isToolOpen: (toolCallId: string) => boolean;
  onToolOpenChange: (toolCallId: string, open: boolean) => void;
}

export function ChatMessageList({
  messages,
  isToolOpen,
  onToolOpenChange,
}: ChatMessageListProps) {
  return (
    <>
      {messages.map((message) => {
        if (message.role === "user") {
          const text = getMessageText(message);

          return (
            <Message from={message.role} key={message.id}>
              {text && (
                <MessageContent className="max-w-[75%] rounded-[28px] border px-5 py-4 text-[15px] leading-7 group-[.is-user]:border-border/60 group-[.is-user]:bg-(--paper-user) group-[.is-user]:px-5 group-[.is-user]:py-4 group-[.is-user]:shadow-[0_16px_40px_-28px_rgba(79,59,34,0.45)]">
                  <MessageResponse>{text}</MessageResponse>
                </MessageContent>
              )}
            </Message>
          );
        }

        return (
          <Message from={message.role} key={message.id}>
            {message.parts.map((part, index) => {
              if (isReasoningUIPart(part)) {
                return (
                  <div
                    className="rounded-[24px] border border-dashed border-border/70 bg-background/65 px-4 py-3 text-sm leading-7 text-muted-foreground"
                    key={`${message.id}-part-${index}`}
                  >
                    {part.text}
                  </div>
                );
              }

              if (isToolOrDynamicToolUIPart(part)) {
                return (
                  <Tool
                    className="paper-shadow w-fit rounded-[26px] border-border/60 bg-card/95 data-[state=open]:w-full"
                    key={`${message.id}-part-${index}`}
                    onOpenChange={(open) =>
                      onToolOpenChange(part.toolCallId, open)
                    }
                    open={isToolOpen(part.toolCallId)}
                  >
                    {renderToolHeader(part)}
                    <ToolContent className="space-y-3 pt-0">
                      <ToolInput input={part.input} />
                      {part.state === "output-available" ? (
                        <ToolResultCard
                          output={part.output}
                          title={getToolTitle(part)}
                        />
                      ) : null}
                      {part.state === "output-error" ||
                      part.state === "output-denied" ? (
                        <ToolOutput
                          errorText={part.errorText}
                          output={part.output}
                        />
                      ) : null}
                    </ToolContent>
                  </Tool>
                );
              }

              if (isTextUIPart(part) && part.text) {
                return (
                  <MessageContent
                    className="w-full rounded-[28px] border px-5 py-4 text-[15px] leading-7 group-[.is-assistant]:paper-shadow group-[.is-assistant]:rounded-[30px] group-[.is-assistant]:border-border/60 group-[.is-assistant]:bg-card group-[.is-assistant]:px-6 group-[.is-assistant]:py-5"
                    key={`${message.id}-part-${index}`}
                  >
                    <MessageResponse>{part.text}</MessageResponse>
                  </MessageContent>
                );
              }

              return null;
            })}
          </Message>
        );
      })}
    </>
  );
}
