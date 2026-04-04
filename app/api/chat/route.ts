import { createAnthropic } from "@ai-sdk/anthropic";
import {
  convertToModelMessages,
  safeValidateUIMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";
import {
  ChatOwnershipError,
  ensureChatExists,
  getChat,
  saveMessages,
  updateChatTitle,
} from "@/lib/db/queries";
import { generateTitle, stripMessageIds } from "@/lib/chat-helpers";
import { getOrCreateSessionId } from "@/lib/session";
import { JAZZ_SYSTEM_PROMPT } from "@/lib/system-prompt";
import { getOptionalEnv } from "@/lib/env";
import { enforceRateLimit, validateJsonRequest } from "@/lib/request-guards";
import { jazzTools } from "@/lib/tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CHAT_REQUEST_BYTES = 50_000;
const MAX_MESSAGES_PER_REQUEST = 24;
const MAX_USER_MESSAGE_CHARS = 4_000;
const MAX_TOTAL_USER_CHARS = 12_000;

const requestSchema = z.object({
  chatId: z.string().min(1),
  messages: z.unknown(),
});

function extractTextParts(message: {
  parts: Array<{ type: string; text?: string }>;
}) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text?.trim() ?? "")
    .filter(Boolean);
}

function validateChatMessages(messages: UIMessage[]) {
  if (messages.length === 0) {
    return "At least one message is required.";
  }

  if (messages.length > MAX_MESSAGES_PER_REQUEST) {
    return "This conversation is too large for the demo deployment.";
  }

  let totalUserChars = 0;

  for (const message of messages) {
    if (message.role === "user") {
      if (message.parts.some((part) => part.type !== "text")) {
        return "Attachments are not supported in this demo.";
      }

      const text = extractTextParts(message).join(" ");
      totalUserChars += text.length;

      if (text.length > MAX_USER_MESSAGE_CHARS) {
        return "Each message must stay under 4000 characters.";
      }
    }
  }

  if (totalUserChars > MAX_TOTAL_USER_CHARS) {
    return "This conversation is too long for the demo deployment.";
  }

  return null;
}

export async function POST(request: Request) {
  try {
    if (!getOptionalEnv("ANTHROPIC_API_KEY")) {
      return Response.json(
        { error: "ANTHROPIC_API_KEY is not configured." },
        { status: 503 }
      );
    }

    const invalidRequest = validateJsonRequest(request, MAX_CHAT_REQUEST_BYTES);
    if (invalidRequest) {
      return invalidRequest;
    }

    const rateLimited = await enforceRateLimit({
      bucket: "chat",
      intervalMs: 60_000,
      limit: 20,
    });
    if (rateLimited) {
      return rateLimited;
    }

    const sessionId = await getOrCreateSessionId();
    const { chatId, messages } = requestSchema.parse(await request.json());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolset = jazzTools as any;

    const validation = await safeValidateUIMessages({
      messages,
      tools: toolset,
    });

    if (!validation.success) {
      return Response.json(
        {
          error: "Invalid chat messages payload",
          details: validation.error.message,
        },
        { status: 400 }
      );
    }

    const validatedMessages = validation.data;
    const messageValidationError = validateChatMessages(validatedMessages);
    if (messageValidationError) {
      return Response.json({ error: messageValidationError }, { status: 400 });
    }

    const initialTitle = generateTitle(validatedMessages);
    const existingChat = await getChat(sessionId, chatId);

    await ensureChatExists(sessionId, chatId, initialTitle);

    const anthropic = createAnthropic();

    const result = streamText({
      messages: await convertToModelMessages(stripMessageIds(validatedMessages), {
        tools: toolset,
      }),
      model: anthropic("claude-sonnet-4-5"),
      stopWhen: stepCountIs(5),
      system: JAZZ_SYSTEM_PROMPT,
      tools: toolset,
    });

    return result.toUIMessageStreamResponse({
      onFinish: async ({ messages: finalMessages }) => {
        await saveMessages(sessionId, chatId, finalMessages);

        if (!existingChat || existingChat.title === "New chat") {
          await updateChatTitle(
            sessionId,
            chatId,
            generateTitle(finalMessages)
          );
        }
      },
      originalMessages: validatedMessages,
      sendSources: true,
    });
  } catch (error) {
    if (error instanceof ChatOwnershipError) {
      return Response.json({ error: "Chat not found" }, { status: 404 });
    }

    const message =
      error instanceof Error ? error.message : "Unexpected chat request failure";

    return Response.json({ error: message }, { status: 500 });
  }
}
