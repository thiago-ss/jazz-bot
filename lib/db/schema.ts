import type { UIMessage } from "ai";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const chats = sqliteTable("chats", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  title: text("title").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  chatId: text("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: text("role", {
    enum: ["system", "user", "assistant"],
  }).notNull(),
  parts: text("parts", { mode: "json" }).$type<UIMessage["parts"]>().notNull(),
  createdAt: integer("created_at").notNull(),
});

export type ChatRecord = typeof chats.$inferSelect;
export type NewChatRecord = typeof chats.$inferInsert;
export type MessageRecord = typeof messages.$inferSelect;
export type NewMessageRecord = typeof messages.$inferInsert;
