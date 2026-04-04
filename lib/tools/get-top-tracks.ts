import { tool } from "ai";
import { z } from "zod";
import { lastfmRequest, normalizeList } from "./lastfm-client";

type TopTracksResponse = {
  toptracks?: {
    "@attr"?: {
      artist?: string;
    };
    track?:
      | {
          image?: Array<{ "#text"?: string; size?: string }>;
          listeners?: string;
          name?: string;
          playcount?: string;
          url?: string;
        }
      | Array<{
          image?: Array<{ "#text"?: string; size?: string }>;
          listeners?: string;
          name?: string;
          playcount?: string;
          url?: string;
        }>;
  };
};

export const getTopTracksTool = tool({
  description:
    "Get a jazz artist's top tracks from Last.fm, including play counts and listener counts.",
  inputSchema: z.object({
    artist: z.string().min(1).describe("Exact artist name"),
    limit: z.number().int().min(1).max(20).default(10),
  }),
  execute: async ({ artist, limit }) => {
    const result = await lastfmRequest<TopTracksResponse>("artist.gettoptracks", {
      artist,
      autocorrect: 1,
      limit,
    });

    if (!result.ok) {
      return result;
    }

    const tracks = normalizeList(result.data.toptracks?.track)
      .filter((item) => item.name)
      .slice(0, limit)
      .map((item) => ({
        imageUrl:
          item.image?.find((image) => image.size === "large")?.["#text"] ??
          item.image?.at(-1)?.["#text"] ??
          null,
        listeners: item.listeners ? Number(item.listeners) : null,
        name: item.name ?? "",
        playcount: item.playcount ? Number(item.playcount) : null,
        url: item.url ?? null,
      }));

    return {
      artist: result.data.toptracks?.["@attr"]?.artist ?? artist,
      ok: true as const,
      tracks,
    };
  },
});
