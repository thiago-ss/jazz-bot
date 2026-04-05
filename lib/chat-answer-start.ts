import {
  isReasoningUIPart,
  isTextUIPart,
  isToolOrDynamicToolUIPart,
  type UIMessage,
} from "ai";

export type AssistantAnswerStart = {
  messageId: string;
  partIndex: number;
  hasLeadingReasoning: boolean;
};

const isRenderableAssistantPart = (part: UIMessage["parts"][number]) =>
  isToolOrDynamicToolUIPart(part) || (isTextUIPart(part) && part.text.length > 0);

export const getLatestAssistantMessage = (messages: UIMessage[]) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === "assistant") {
      return message;
    }
  }

  return null;
};

export const getAssistantAnswerStart = (
  message: UIMessage,
): AssistantAnswerStart | null => {
  if (message.role !== "assistant") {
    return null;
  }

  let hasLeadingReasoning = false;

  for (const [partIndex, part] of message.parts.entries()) {
    if (isReasoningUIPart(part)) {
      hasLeadingReasoning = true;
      continue;
    }

    if (isRenderableAssistantPart(part)) {
      return {
        hasLeadingReasoning,
        messageId: message.id,
        partIndex,
      };
    }
  }

  return null;
};
