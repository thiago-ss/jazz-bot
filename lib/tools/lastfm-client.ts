import "server-only";

import { getOptionalEnv } from "@/lib/env";

const LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0/";

type LastfmQueryValue = string | number | undefined;

type LastfmResponse = {
  error?: number;
  message?: string;
};

export function stripHtml(input?: string | null) {
  if (!input) {
    return "";
  }

  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function normalizeList<T>(value: T | T[] | undefined | null): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function createUnavailableToolResult(service: string, reason: string) {
  return {
    error: `${service} is unavailable: ${reason}`,
    ok: false as const,
  };
}

export async function lastfmRequest<T>(
  method: string,
  params: Record<string, LastfmQueryValue>
) {
  const apiKey = getOptionalEnv("LASTFM_API_KEY");

  if (!apiKey) {
    return createUnavailableToolResult(
      "Last.fm",
      "LASTFM_API_KEY is not configured"
    );
  }

  const searchParams = new URLSearchParams({
    api_key: apiKey,
    format: "json",
    method,
  });

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) {
      searchParams.set(key, String(value));
    }
  }

  try {
    const response = await fetch(`${LASTFM_BASE_URL}?${searchParams.toString()}`, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return createUnavailableToolResult(
        "Last.fm",
        `request failed with status ${response.status}`
      );
    }

    const json = (await response.json()) as T;
    const maybeError = json as LastfmResponse;

    if (maybeError.error) {
      return createUnavailableToolResult(
        "Last.fm",
        maybeError.message ?? `error code ${maybeError.error}`
      );
    }

    return {
      data: json,
      ok: true as const,
    };
  } catch (error) {
    return createUnavailableToolResult(
      "Last.fm",
      error instanceof Error ? error.message : "Unknown request failure"
    );
  }
}
