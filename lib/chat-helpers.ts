import type { UIMessage } from "ai";

export function getTextContent(message: Pick<UIMessage, "parts">) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function generateTitle(messages: UIMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  const text = firstUserMessage ? getTextContent(firstUserMessage) : "";

  if (!text) {
    return "New chat";
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 60 ? `${normalized.slice(0, 57)}...` : normalized;
}

export function stripMessageIds(messages: UIMessage[]) {
  return messages.map(({ id, ...message }) => {
    void id;
    return message;
  });
}
