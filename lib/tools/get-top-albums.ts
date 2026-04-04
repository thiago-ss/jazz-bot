import { tool } from "ai";
import { z } from "zod";
import { lastfmRequest, normalizeList } from "./lastfm-client";

type TopAlbumsResponse = {
  topalbums?: {
    "@attr"?: {
      artist?: string;
    };
    album?:
      | {
          image?: Array<{ "#text"?: string; size?: string }>;
          name?: string;
          playcount?: string;
          url?: string;
        }
      | Array<{
          image?: Array<{ "#text"?: string; size?: string }>;
          name?: string;
          playcount?: string;
          url?: string;
        }>;
  };
};

export const getTopAlbumsTool = tool({
  description:
    "Get a jazz artist's top albums from Last.fm, including play counts and album URLs.",
  inputSchema: z.object({
    artist: z.string().min(1).describe("Exact artist name"),
    limit: z.number().int().min(1).max(20).default(10),
  }),
  execute: async ({ artist, limit }) => {
    const result = await lastfmRequest<TopAlbumsResponse>("artist.gettopalbums", {
      artist,
      autocorrect: 1,
      limit,
    });

    if (!result.ok) {
      return result;
    }

    const albums = normalizeList(result.data.topalbums?.album)
      .filter((item) => item.name)
      .slice(0, limit)
      .map((item) => ({
        imageUrl:
          item.image?.find((image) => image.size === "large")?.["#text"] ??
          item.image?.at(-1)?.["#text"] ??
          null,
        name: item.name ?? "",
        playcount: item.playcount ? Number(item.playcount) : null,
        url: item.url ?? null,
      }));

    return {
      albums,
      artist: result.data.topalbums?.["@attr"]?.artist ?? artist,
      ok: true as const,
    };
  },
});
