import "server-only";

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client/node";
import { drizzle } from "drizzle-orm/libsql";
import { getDatabaseConfig } from "@/lib/env";
import * as schema from "./schema";

const databaseConfig = getDatabaseConfig();

if (databaseConfig.url.startsWith("file:")) {
  const filePath = databaseConfig.url.slice("file:".length);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

const client = createClient(databaseConfig);

export const db = drizzle({
  client,
  schema,
});

let initializationPromise: Promise<void> | null = null;

async function initializeDatabase() {
  await client.execute("PRAGMA foreign_keys = ON");

  await client.execute(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY NOT NULL,
      session_id TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY NOT NULL,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      parts TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS messages_chat_id_created_at_idx
    ON messages(chat_id, created_at)
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS chats_session_id_updated_at_idx
    ON chats(session_id, updated_at)
  `);
}

export async function ensureDatabase() {
  if (!initializationPromise) {
    initializationPromise = initializeDatabase();
  }

  await initializationPromise;
}
