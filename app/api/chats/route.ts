import { nanoid } from "nanoid";
import { z } from "zod";
import { createChat, listChats } from "@/lib/db/queries";
import { enforceRateLimit, validateJsonRequest } from "@/lib/request-guards";
import { getOrCreateSessionId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createChatSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().trim().min(1).max(120).optional(),
});

export async function GET() {
  try {
    const rateLimited = await enforceRateLimit({
      bucket: "chats:list",
      intervalMs: 60_000,
      limit: 60,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const sessionId = await getOrCreateSessionId();
    const chats = await listChats(sessionId);
    return Response.json({ chats });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list chats";

    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const invalidRequest = validateJsonRequest(request, 5_000);
    if (invalidRequest) {
      return invalidRequest;
    }

    const rateLimited = await enforceRateLimit({
      bucket: "chats:create",
      intervalMs: 60_000,
      limit: 20,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const sessionId = await getOrCreateSessionId();
    const payload = createChatSchema.parse(await request.json().catch(() => ({})));
    const chat = await createChat(
      sessionId,
      payload.id ?? nanoid(),
      payload.title ?? "New chat"
    );

    return Response.json({ chat }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create chat";

    return Response.json({ error: message }, { status: 500 });
  }
}
