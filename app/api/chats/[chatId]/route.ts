import {
  ChatOwnershipError,
  deleteChat,
  getChatWithMessages,
} from "@/lib/db/queries";
import { enforceRateLimit } from "@/lib/request-guards";
import { getOrCreateSessionId } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/chats/[chatId]">
) {
  try {
    const rateLimited = await enforceRateLimit({
      bucket: "chats:get",
      intervalMs: 60_000,
      limit: 60,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const sessionId = await getOrCreateSessionId();
    const { chatId } = await context.params;
    const chat = await getChatWithMessages(sessionId, chatId);

    if (!chat) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    return Response.json(chat);
  } catch (error) {
    if (error instanceof ChatOwnershipError) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to load chat";

    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/chats/[chatId]">
) {
  try {
    const rateLimited = await enforceRateLimit({
      bucket: "chats:delete",
      intervalMs: 60_000,
      limit: 20,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const sessionId = await getOrCreateSessionId();
    const { chatId } = await context.params;
    await deleteChat(sessionId, chatId);

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof ChatOwnershipError) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    const message =
      error instanceof Error ? error.message : "Failed to delete chat";

    return Response.json({ error: message }, { status: 500 });
  }
}
