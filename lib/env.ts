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

export function getDatabaseConfig() {
  const databaseUrl =
    getOptionalEnv("DATABASE_URL") ??
    `file:${path.join(process.cwd(), ".data", "jazz-bot.db")}`;

  return {
    authToken: getOptionalEnv("DATABASE_AUTH_TOKEN"),
    url: databaseUrl,
  };
}
