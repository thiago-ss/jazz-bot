import "server-only";

import { headers } from "next/headers";
import { takeRateLimit } from "@/lib/rate-limit";

const JSON_CONTENT_TYPE = "application/json";
const BODY_TOO_LARGE_STATUS = 413;
const UNSUPPORTED_MEDIA_TYPE_STATUS = 415;
const TOO_MANY_REQUESTS_STATUS = 429;

function getForwardedIp(value: string | null) {
  if (!value) {
    return null;
  }

  const first = value.split(",")[0]?.trim();
  return first || null;
}

export async function getRequestClientKey() {
  const requestHeaders = await headers();

  return (
    getForwardedIp(requestHeaders.get("x-forwarded-for")) ??
    requestHeaders.get("x-real-ip") ??
    "anonymous"
  );
}

export function validateJsonRequest(request: Request, maxBytes: number) {
  const contentType = request.headers.get("content-type");

  if (!contentType?.includes(JSON_CONTENT_TYPE)) {
    return Response.json(
      { error: "Requests must use application/json." },
      { status: UNSUPPORTED_MEDIA_TYPE_STATUS }
    );
  }

  const contentLength = request.headers.get("content-length");
  const parsedLength = contentLength ? Number(contentLength) : null;

  if (
    parsedLength !== null &&
    Number.isFinite(parsedLength) &&
    parsedLength > maxBytes
  ) {
    return Response.json(
      { error: "Request body is too large." },
      { status: BODY_TOO_LARGE_STATUS }
    );
  }

  return null;
}

export async function enforceRateLimit(options: {
  bucket: string;
  intervalMs: number;
  limit: number;
}) {
  const clientKey = await getRequestClientKey();
  const result = takeRateLimit({
    intervalMs: options.intervalMs,
    key: `${options.bucket}:${clientKey}`,
    limit: options.limit,
  });

  if (result.success) {
    return null;
  }

  return Response.json(
    { error: "Too many requests. Please try again shortly." },
    {
      headers: {
        "Retry-After": String(
          Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000))
        ),
      },
      status: TOO_MANY_REQUESTS_STATUS,
    }
  );
}
