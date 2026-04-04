import "server-only";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "jazzbot_session";

const buildSessionCookieOptions = () => ({
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
});

export async function getOrCreateSessionId() {
  const cookieStore = await cookies();
  const existingSessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = randomUUID();

  cookieStore.set(
    SESSION_COOKIE_NAME,
    sessionId,
    buildSessionCookieOptions()
  );

  return sessionId;
}
