import { tool } from "ai";
import { z } from "zod";
import { lastfmRequest, normalizeList } from "./lastfm-client";

type TagTopArtistsResponse = {
  topartists?: {
    "@attr"?: {
      tag?: string;
    };
    artist?:
      | {
          image?: Array<{ "#text"?: string; size?: string }>;
          listeners?: string;
          name?: string;
          streamable?: string;
          url?: string;
        }
      | Array<{
          image?: Array<{ "#text"?: string; size?: string }>;
          listeners?: string;
          name?: string;
          streamable?: string;
          url?: string;
        }>;
  };
};

export const getTagTopArtistsTool = tool({
  description:
    "Get the top artists for a jazz genre or subgenre tag from Last.fm.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(20).default(10),
    tag: z.string().min(1).describe("Genre or subgenre tag, e.g. bebop or modal jazz"),
  }),
  execute: async ({ tag, limit }) => {
    const result = await lastfmRequest<TagTopArtistsResponse>("tag.gettopartists", {
      limit,
      tag,
    });

    if (!result.ok) {
      return result;
    }

    const artists = normalizeList(result.data.topartists?.artist)
      .filter((item) => item.name)
      .slice(0, limit)
      .map((item) => ({
        imageUrl:
          item.image?.find((image) => image.size === "large")?.["#text"] ??
          item.image?.at(-1)?.["#text"] ??
          null,
        listeners: item.listeners ? Number(item.listeners) : null,
        name: item.name ?? "",
        streamable: item.streamable === "1",
        url: item.url ?? null,
      }));

    return {
      artists,
      ok: true as const,
      tag: result.data.topartists?.["@attr"]?.tag ?? tag,
    };
  },
});
