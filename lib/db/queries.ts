import "server-only";

import type { UIMessage } from "ai";
import { and, asc, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db, ensureDatabase } from "./index";
import { chats, messages, type ChatRecord } from "./schema";

export type StoredChat = ChatRecord;

export type ChatWithMessages = {
  chat: StoredChat;
  messages: UIMessage[];
};

export class ChatOwnershipError extends Error {
  constructor(chatId: string) {
    super(`Chat ${chatId} was not found for this session`);
    this.name = "ChatOwnershipError";
  }
}

async function getChatById(chatId: string) {
  await ensureDatabase();

  const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1);
  return chat ?? null;
}

export async function createChat(
  sessionId: string,
  id = nanoid(),
  title = "New chat"
) {
  await ensureDatabase();

  const now = Date.now();

  await db.insert(chats).values({
    createdAt: now,
    id,
    sessionId,
    title,
    updatedAt: now,
  });

  return getChat(sessionId, id);
}

export async function getChat(sessionId: string, chatId: string) {
  await ensureDatabase();

  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.sessionId, sessionId)))
    .limit(1);

  return chat ?? null;
}

export async function ensureChatExists(
  sessionId: string,
  chatId: string,
  title = "New chat"
) {
  const existing = await getChat(sessionId, chatId);

  if (existing) {
    return existing;
  }

  if (await getChatById(chatId)) {
    throw new ChatOwnershipError(chatId);
  }

  const created = await createChat(sessionId, chatId, title);
  if (!created) {
    throw new Error(`Failed to create chat ${chatId}`);
  }

  return created;
}

export async function listChats(sessionId: string) {
  await ensureDatabase();

  return db
    .select()
    .from(chats)
    .where(eq(chats.sessionId, sessionId))
    .orderBy(desc(chats.updatedAt));
}

export async function getChatWithMessages(
  sessionId: string,
  chatId: string
): Promise<ChatWithMessages | null> {
  await ensureDatabase();

  const chat = await getChat(sessionId, chatId);
  if (!chat) {
    return null;
  }

  const chatMessages = await db
    .select({
      id: messages.id,
      parts: messages.parts,
      role: messages.role,
    })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));

  return {
    chat,
    messages: chatMessages.map((message) => ({
      id: message.id,
      parts: message.parts,
      role: message.role,
    })),
  };
}

async function requireOwnedChat(sessionId: string, chatId: string) {
  const chat = await getChat(sessionId, chatId);

  if (!chat) {
    throw new ChatOwnershipError(chatId);
  }

  return chat;
}

export async function saveMessages(
  sessionId: string,
  chatId: string,
  uiMessages: UIMessage[]
) {
  await ensureDatabase();
  await requireOwnedChat(sessionId, chatId);

  const now = Date.now();

  await db.transaction(async (tx) => {
    await tx.delete(messages).where(eq(messages.chatId, chatId));

    if (uiMessages.length > 0) {
      await tx.insert(messages).values(
        uiMessages.map((message, index) => ({
          chatId,
          createdAt: now + index,
          id: message.id || nanoid(),
          parts: message.parts,
          role: message.role,
        }))
      );
    }

    await tx
      .update(chats)
      .set({ updatedAt: now })
      .where(and(eq(chats.id, chatId), eq(chats.sessionId, sessionId)));
  });
}

export async function updateChatTitle(
  sessionId: string,
  chatId: string,
  title: string
) {
  await ensureDatabase();
  await requireOwnedChat(sessionId, chatId);

  await db
    .update(chats)
    .set({
      title,
      updatedAt: Date.now(),
    })
    .where(and(eq(chats.id, chatId), eq(chats.sessionId, sessionId)));
}

export async function deleteChat(sessionId: string, chatId: string) {
  await ensureDatabase();
  await requireOwnedChat(sessionId, chatId);

  await db.transaction(async (tx) => {
    await tx.delete(messages).where(eq(messages.chatId, chatId));
    await tx
      .delete(chats)
      .where(and(eq(chats.id, chatId), eq(chats.sessionId, sessionId)));
  });
}
