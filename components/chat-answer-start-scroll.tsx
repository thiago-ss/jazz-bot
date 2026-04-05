"use client";

import type { ChatStatus, UIMessage } from "ai";
import { useEffect, useRef } from "react";

import { useConversationScroll } from "@/components/ai-elements/conversation";
import {
  getAssistantAnswerStart,
  getLatestAssistantMessage,
} from "@/lib/chat-answer-start";

const ANSWER_START_OFFSET_PX = 8;

const isLiveStatus = (status: ChatStatus) =>
  status === "submitted" || status === "streaming";

const findAnswerStartElement = (container: HTMLElement, messageId: string) =>
  container.querySelector<HTMLElement>(`[data-answer-start="${messageId}"]`);

const getAnswerStartTop = (
  scrollElement: HTMLElement,
  answerStartElement: HTMLElement,
) => {
  const scrollBox = scrollElement.getBoundingClientRect();
  const answerBox = answerStartElement.getBoundingClientRect();

  return scrollElement.scrollTop + answerBox.top - scrollBox.top;
};

export function ChatAnswerStartScroll({
  messages,
  status,
}: {
  messages: UIMessage[];
  status: ChatStatus;
}) {
  const { isAtBottom, scrollRef, stopScroll } = useConversationScroll();
  const activeMessageIdRef = useRef<string | null>(null);
  const jumpedMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const latestAssistantMessage = getLatestAssistantMessage(messages);
    const latestMessageId = latestAssistantMessage?.id ?? null;

    if (activeMessageIdRef.current !== latestMessageId) {
      activeMessageIdRef.current = latestMessageId;
      jumpedMessageIdRef.current = null;
    }

    if (!latestAssistantMessage || !isAtBottom || !isLiveStatus(status)) {
      return;
    }

    const answerStart = getAssistantAnswerStart(latestAssistantMessage);
    if (!answerStart?.hasLeadingReasoning) {
      return;
    }

    if (jumpedMessageIdRef.current === latestAssistantMessage.id) {
      return;
    }

    const scrollElement = scrollRef.current;
    if (!scrollElement) {
      return;
    }

    const answerStartElement = findAnswerStartElement(
      scrollElement,
      latestAssistantMessage.id,
    );
    if (!answerStartElement) {
      return;
    }

    jumpedMessageIdRef.current = latestAssistantMessage.id;

    stopScroll();

    scrollElement.scrollTo({
      behavior: "smooth",
      top: Math.max(
        0,
        getAnswerStartTop(scrollElement, answerStartElement) -
          ANSWER_START_OFFSET_PX,
      ),
    });
  }, [isAtBottom, messages, scrollRef, status, stopScroll]);

  return null;
}
