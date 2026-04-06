import { tool } from "ai";
import { z } from "zod";
import { resolveArtistImage } from "./artist-image-service";
import { lastfmRequest } from "./lastfm-client";

type ArtistImageResponse = {
  artist?: {
    image?: Array<{ "#text"?: string; size?: string }>;
    name?: string;
    url?: string;
  };
};

export const getArtistImageTool = tool({
  description:
    "Get a display image for a jazz artist, using Last.fm first and web fallback when needed.",
  inputSchema: z.object({
    artist: z.string().min(1).describe("Exact artist name"),
  }),
  execute: async ({ artist }) => {
    const result = await lastfmRequest<ArtistImageResponse>("artist.getinfo", {
      artist,
      autocorrect: 1,
    });

    if (!result.ok) {
      const fallback = await resolveArtistImage({ artist });

      if (fallback.imageUrl) {
        return {
          artist,
          imageSource: fallback.imageSource,
          imageSourceUrl: fallback.imageSourceUrl,
          imageUrl: fallback.imageUrl,
          ok: true as const,
        };
      }

      return result;
    }

    const artistInfo = result.data.artist;
    if (!artistInfo?.name) {
      const fallback = await resolveArtistImage({ artist });

      return fallback.imageUrl
        ? {
            artist,
            imageSource: fallback.imageSource,
            imageSourceUrl: fallback.imageSourceUrl,
            imageUrl: fallback.imageUrl,
            ok: true as const,
          }
        : {
            error: `No Last.fm artist info found for "${artist}"`,
            ok: false as const,
          };
    }

    const image = await resolveArtistImage({
      artist: artistInfo.name,
      artistUrl: artistInfo.url,
      lastfmImages: artistInfo.image,
    });

    if (image.imageUrl) {
      return {
        artist: artistInfo.name,
        imageSource: image.imageSource,
        imageSourceUrl: image.imageSourceUrl,
        imageUrl: image.imageUrl,
        ok: true as const,
      };
    }

    if (image.fallbackError) {
      return {
        error: `${image.fallbackError.service} is unavailable: ${image.fallbackError.reason}`,
        ok: false as const,
      };
    }

    return {
      error: `No usable artist image found for "${artistInfo.name}"`,
      ok: false as const,
    };
  },
});
