import "server-only";

import Firecrawl from "@mendable/firecrawl-js";
import { getOptionalEnv } from "@/lib/env";
import {
  pickBestLastfmImage,
  type LastfmImage,
} from "./lastfm-client";

const IMAGE_SEARCH_LIMIT = 5;
const LIST_WEB_FALLBACK_LIMIT = 3;

type FirecrawlImageResult = {
  imageHeight?: number;
  imageUrl?: string;
  imageWidth?: number;
  position?: number;
  url?: string;
};

export type ArtistImageFields = {
  imageSource: "lastfm" | "web" | null;
  imageSourceUrl: string | null;
  imageUrl: string | null;
};

type ArtistImageResolution = ArtistImageFields & {
  fallbackError?: {
    reason: string;
    service: "Firecrawl";
  } | null;
};

type ArtistImageCandidate = {
  lastfmImages?: LastfmImage[] | null;
  name: string;
  url?: string | null;
};

const EMPTY_IMAGE_RESULT: ArtistImageFields = {
  imageSource: null,
  imageSourceUrl: null,
  imageUrl: null,
};

const isHttpUrl = (value?: string | null): value is string =>
  Boolean(value && /^https?:\/\//.test(value));

const getLargestDimension = (image: FirecrawlImageResult) =>
  Math.max(image.imageWidth ?? 0, image.imageHeight ?? 0);

function pickBestWebImage(images: FirecrawlImageResult[]) {
  return images
    .filter(
      (image): image is FirecrawlImageResult & { imageUrl: string } =>
        isHttpUrl(image.imageUrl),
    )
    .map((image, index) => {
      const dimension = getLargestDimension(image);
      const hasDimension = dimension > 0;
      const inPreferredBand = dimension >= 300 && dimension <= 900;

      return {
        image,
        position: image.position ?? index,
        score: hasDimension
          ? Math.abs(dimension - 600) + (inPreferredBand ? 0 : 1000)
          : 3000 + (image.position ?? index),
      };
    })
    .sort((left, right) => left.score - right.score || left.position - right.position)[0]
    ?.image;
}

async function searchArtistImageOnWeb(artist: string): Promise<ArtistImageResolution> {
  const apiKey = getOptionalEnv("FIRECRAWL_API_KEY");

  if (!apiKey) {
    return {
      ...EMPTY_IMAGE_RESULT,
      fallbackError: {
        reason: "FIRECRAWL_API_KEY is not configured",
        service: "Firecrawl",
      },
    };
  }

  const firecrawl = new Firecrawl({ apiKey });

  try {
    const results = await firecrawl.search(artist, {
      limit: IMAGE_SEARCH_LIMIT,
      sources: ["images"],
    });
    const image = pickBestWebImage(
      (results.images ?? []) as FirecrawlImageResult[],
    );

    if (!image) {
      return EMPTY_IMAGE_RESULT;
    }

    return {
      imageSource: "web",
      imageSourceUrl: isHttpUrl(image.url) ? image.url : null,
      imageUrl: image.imageUrl,
    };
  } catch (error) {
    return {
      ...EMPTY_IMAGE_RESULT,
      fallbackError: {
        reason: error instanceof Error ? error.message : "Unknown request failure",
        service: "Firecrawl",
      },
    };
  }
}

export async function resolveArtistImage({
  artist,
  artistUrl,
  lastfmImages,
}: {
  artist: string;
  artistUrl?: string | null;
  lastfmImages?: LastfmImage[] | null;
}): Promise<ArtistImageResolution> {
  const lastfmImage = pickBestLastfmImage(lastfmImages);

  if (lastfmImage) {
    return {
      imageSource: "lastfm" as const,
      imageSourceUrl: isHttpUrl(artistUrl) ? artistUrl : null,
      imageUrl: lastfmImage,
    };
  }

  return searchArtistImageOnWeb(artist);
}

export async function enrichArtistImageList<T extends ArtistImageCandidate>(
  artists: T[],
): Promise<Array<Omit<T, "lastfmImages"> & ArtistImageFields>> {
  const enrichedArtists = artists.map(({ lastfmImages, ...artist }) => {
    const imageUrl = pickBestLastfmImage(lastfmImages);

    return {
      ...(artist as Omit<T, "lastfmImages">),
      imageSource: imageUrl ? ("lastfm" as const) : null,
      imageSourceUrl: imageUrl && isHttpUrl(artist.url) ? artist.url : null,
      imageUrl,
    };
  });

  const indexesNeedingFallback = enrichedArtists
    .map((artist, index) => (artist.imageUrl ? null : index))
    .filter((index): index is number => index !== null)
    .slice(0, LIST_WEB_FALLBACK_LIMIT);

  if (!indexesNeedingFallback.length) {
    return enrichedArtists;
  }

  const fallbackResults = new Map(
    await Promise.all(
      indexesNeedingFallback.map(
        async (index): Promise<readonly [number, ArtistImageResolution]> => [
          index,
          await searchArtistImageOnWeb(enrichedArtists[index].name),
        ],
      ),
    ),
  );

  return enrichedArtists.map((artist, index) => {
    const fallback = fallbackResults.get(index);

    if (!fallback?.imageUrl) {
      return artist;
    }

    return {
      ...artist,
      imageSource: fallback.imageSource,
      imageSourceUrl: fallback.imageSourceUrl,
      imageUrl: fallback.imageUrl,
    };
  });
}
