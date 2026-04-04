import { tool } from "ai";
import { z } from "zod";
import {
  lastfmRequest,
  normalizeList,
  stripHtml,
} from "./lastfm-client";

type ArtistInfoResponse = {
  artist?: {
    bio?: {
      content?: string;
      summary?: string;
    };
    image?: Array<{ "#text"?: string; size?: string }>;
    mbid?: string;
    name?: string;
    similar?: {
      artist?:
        | { name?: string; url?: string }
        | Array<{ name?: string; url?: string }>;
    };
    stats?: {
      listeners?: string;
      playcount?: string;
    };
    tags?: {
      tag?:
        | { name?: string; url?: string }
        | Array<{ name?: string; url?: string }>;
    };
    url?: string;
  };
};

export const getArtistInfoTool = tool({
  description:
    "Get a jazz artist's Last.fm biography, tags, listener counts, and related artists.",
  inputSchema: z.object({
    artist: z.string().min(1).describe("Exact artist name"),
  }),
  execute: async ({ artist }) => {
    const result = await lastfmRequest<ArtistInfoResponse>("artist.getinfo", {
      artist,
      autocorrect: 1,
    });

    if (!result.ok) {
      return result;
    }

    const artistInfo = result.data.artist;
    if (!artistInfo?.name) {
      return {
        error: `No Last.fm artist info found for "${artist}"`,
        ok: false as const,
      };
    }

    return {
      artist: {
        bio: stripHtml(artistInfo.bio?.content || artistInfo.bio?.summary),
        imageUrl:
          artistInfo.image?.find((image) => image.size === "extralarge")?.["#text"] ??
          artistInfo.image?.at(-1)?.["#text"] ??
          null,
        listeners: artistInfo.stats?.listeners
          ? Number(artistInfo.stats.listeners)
          : null,
        mbid: artistInfo.mbid || null,
        name: artistInfo.name,
        playcount: artistInfo.stats?.playcount
          ? Number(artistInfo.stats.playcount)
          : null,
        similarArtists: normalizeList(artistInfo.similar?.artist)
          .filter((item) => item.name)
          .map((item) => ({
            name: item.name ?? "",
            url: item.url ?? null,
          })),
        tags: normalizeList(artistInfo.tags?.tag)
          .filter((item) => item.name)
          .map((item) => ({
            name: item.name ?? "",
            url: item.url ?? null,
          })),
        url: artistInfo.url ?? null,
      },
      ok: true as const,
    };
  },
});
