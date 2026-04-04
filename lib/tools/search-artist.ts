import { tool } from "ai";
import { z } from "zod";
import { lastfmRequest, normalizeList } from "./lastfm-client";

type SearchArtistResponse = {
  results?: {
    "opensearch:totalResults"?: string;
    artistmatches?: {
      artist?:
        | {
            image?: Array<{ "#text"?: string; size?: string }>;
            listeners?: string;
            mbid?: string;
            name?: string;
            streamable?: string;
            url?: string;
          }
        | Array<{
            image?: Array<{ "#text"?: string; size?: string }>;
            listeners?: string;
            mbid?: string;
            name?: string;
            streamable?: string;
            url?: string;
          }>;
    };
  };
};

export const searchArtistTool = tool({
  description:
    "Find jazz artists by name, including Last.fm listener stats and canonical profile URLs.",
  inputSchema: z.object({
    artist: z.string().min(1).describe("Artist name to search for"),
    limit: z.number().int().min(1).max(10).default(5),
  }),
  execute: async ({ artist, limit }) => {
    const result = await lastfmRequest<SearchArtistResponse>("artist.search", {
      artist,
      limit,
    });

    if (!result.ok) {
      return result;
    }

    const artists = normalizeList(result.data.results?.artistmatches?.artist)
      .filter((item) => item.name)
      .slice(0, limit)
      .map((item) => ({
        imageUrl:
          item.image?.find((image) => image.size === "large")?.["#text"] ??
          item.image?.at(-1)?.["#text"] ??
          null,
        listeners: item.listeners ? Number(item.listeners) : null,
        mbid: item.mbid || null,
        name: item.name ?? "",
        streamable: item.streamable === "1",
        url: item.url ?? null,
      }));

    return {
      artists,
      ok: true as const,
      totalResults: Number(result.data.results?.["opensearch:totalResults"] ?? artists.length),
    };
  },
});
