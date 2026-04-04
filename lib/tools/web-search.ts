import Firecrawl from "@mendable/firecrawl-js";
import { tool } from "ai";
import { z } from "zod";
import { getOptionalEnv } from "@/lib/env";
import { createUnavailableToolResult } from "./lastfm-client";

type SearchResultItem = {
  description?: string;
  markdown?: string;
  metadata?: {
    title?: string;
  };
  snippet?: string;
  title?: string;
  url?: string;
};

function normalizeSearchResult(result: SearchResultItem) {
  return {
    snippet:
      result.description ??
      result.snippet ??
      result.markdown?.slice(0, 280) ??
      null,
    title: result.title ?? result.metadata?.title ?? null,
    url: result.url ?? null,
  };
}

export const webSearchTool = tool({
  description:
    "Search the live web for current jazz news, festival dates, releases, or other time-sensitive information.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(10).default(5),
    query: z.string().min(1).describe("Current-events or web research query"),
  }),
  execute: async ({ query, limit }) => {
    const apiKey = getOptionalEnv("FIRECRAWL_API_KEY");

    if (!apiKey) {
      return createUnavailableToolResult(
        "Firecrawl",
        "FIRECRAWL_API_KEY is not configured"
      );
    }

    const firecrawl = new Firecrawl({ apiKey });

    try {
      const results = await firecrawl.search(query, {
        limit,
        sources: ["web", "news"],
      });

      return {
        newsResults: (results.news ?? [])
          .slice(0, limit)
          .map((item) => normalizeSearchResult(item as SearchResultItem)),
        ok: true as const,
        query,
        webResults: (results.web ?? [])
          .slice(0, limit)
          .map((item) => normalizeSearchResult(item as SearchResultItem)),
      };
    } catch (error) {
      return createUnavailableToolResult(
        "Firecrawl",
        error instanceof Error ? error.message : "Unknown request failure"
      );
    }
  },
});
