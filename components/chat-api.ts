import type { UIMessage } from "ai";

export interface ChatSummary {
  id: string;
  title: string;
  createdAt: number | null;
  updatedAt: number | null;
}

export interface ChatDetails {
  chat: ChatSummary | null;
  messages: UIMessage[];
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const readTimestamp = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric;
    }

    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

const normalizeMessage = (value: unknown): UIMessage | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const role = readString(value.role);
  const parts = value.parts;

  if (!id || !role || !Array.isArray(parts)) {
    return null;
  }

  return {
    id,
    parts,
    role: role as UIMessage["role"],
  } as unknown as UIMessage;
};

export const normalizeChatSummary = (value: unknown): ChatSummary | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  if (!id) {
    return null;
  }

  return {
    id,
    title: readString(value.title) ?? "Untitled session",
    createdAt: readTimestamp(value.createdAt),
    updatedAt: readTimestamp(value.updatedAt),
  };
};

export const normalizeChatListPayload = (payload: unknown): ChatSummary[] => {
  const source = Array.isArray(payload)
    ? payload
    : isRecord(payload) && Array.isArray(payload.chats)
      ? payload.chats
      : isRecord(payload) && Array.isArray(payload.data)
        ? payload.data
        : [];

  return source
    .map(normalizeChatSummary)
    .filter((chat): chat is ChatSummary => chat !== null)
    .sort(
      (left, right) =>
        (right.updatedAt ?? right.createdAt ?? 0) -
        (left.updatedAt ?? left.createdAt ?? 0)
    );
};

export const normalizeChatDetailsPayload = (payload: unknown): ChatDetails => {
  if (Array.isArray(payload)) {
    return {
      chat: null,
      messages: payload
        .map(normalizeMessage)
        .filter((message): message is UIMessage => message !== null),
    };
  }

  if (!isRecord(payload)) {
    return { chat: null, messages: [] };
  }

  const nestedChat = isRecord(payload.chat) ? payload.chat : null;
  const messagesSource = Array.isArray(payload.messages)
    ? payload.messages
    : nestedChat && Array.isArray(nestedChat.messages)
      ? nestedChat.messages
      : [];

  return {
    chat: normalizeChatSummary((nestedChat ?? payload) as unknown),
    messages: messagesSource
      .map(normalizeMessage)
      .filter((message): message is UIMessage => message !== null),
  };
};
