import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  LASTFM_API_KEY: z.string().min(1).optional(),
  FIRECRAWL_API_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).optional(),
  DATABASE_AUTH_TOKEN: z.string().min(1).optional(),
});

type ParsedEnv = z.infer<typeof envSchema>;

let cachedEnv: ParsedEnv | null = null;

function getParsedEnv(): ParsedEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
}

export function getOptionalEnv(name: keyof ParsedEnv): string | undefined {
  return getParsedEnv()[name];
}

function canWriteToPath(targetPath: string) {
  try {
    fs.accessSync(targetPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function getDefaultDatabaseUrl() {
  const baseDirectory = canWriteToPath(process.cwd())
    ? path.join(process.cwd(), ".data")
    : path.join(os.tmpdir(), "jazz-bot");

  return `file:${path.join(baseDirectory, "jazz-bot.db")}`;
}

export function getDatabaseConfig() {
  const databaseUrl = getOptionalEnv("DATABASE_URL") ?? getDefaultDatabaseUrl();

  return {
    authToken: getOptionalEnv("DATABASE_AUTH_TOKEN"),
    url: databaseUrl,
  };
}
