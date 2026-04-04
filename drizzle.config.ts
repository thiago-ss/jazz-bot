import type { Config } from "drizzle-kit";

export default {
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./.data/jazz-bot.db",
  },
  dialect: "sqlite",
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
} satisfies Config;
