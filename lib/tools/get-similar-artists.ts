import { tool } from "ai";
import { z } from "zod";
import { enrichArtistImageList } from "./artist-image-service";
import { lastfmRequest, normalizeList } from "./lastfm-client";

type SimilarArtistsResponse = {
  similarartists?: {
    "@attr"?: {
      artist?: string;
    };
    artist?:
      | {
          image?: Array<{ "#text"?: string; size?: string }>;
          match?: string;
          name?: string;
          url?: string;
        }
      | Array<{
          image?: Array<{ "#text"?: string; size?: string }>;
          match?: string;
          name?: string;
          url?: string;
        }>;
  };
};

export const getSimilarArtistsTool = tool({
  description:
    "Find artists similar to a given jazz artist using Last.fm similarity data.",
  inputSchema: z.object({
    artist: z.string().min(1).describe("Reference artist"),
    limit: z.number().int().min(1).max(20).default(10),
  }),
  execute: async ({ artist, limit }) => {
    const result = await lastfmRequest<SimilarArtistsResponse>("artist.getsimilar", {
      artist,
      autocorrect: 1,
      limit,
    });

    if (!result.ok) {
      return result;
    }

    const artists = await enrichArtistImageList(
      normalizeList(result.data.similarartists?.artist)
      .filter((item) => item.name)
      .slice(0, limit)
      .map((item) => ({
        lastfmImages: item.image,
        match: item.match ? Number(item.match) : null,
        name: item.name ?? "",
        url: item.url ?? null,
      })),
    );

    return {
      artist: result.data.similarartists?.["@attr"]?.artist ?? artist,
      artists,
      ok: true as const,
    };
  },
});
