# Backend And Data Flow

This doc covers the server-side request pipeline, chat CRUD APIs, sessions, validation, and persistence.

## Core Server Files

- [app/api/chat/route.ts](../app/api/chat/route.ts): streaming chat endpoint
- [app/api/chats/route.ts](../app/api/chats/route.ts): list and create chats
- [app/api/chats/[chatId]/route.ts](../app/api/chats/%5BchatId%5D/route.ts): fetch and delete one chat
- [lib/db/queries.ts](../lib/db/queries.ts): application-level DB operations
- [lib/db/index.ts](../lib/db/index.ts): DB client and runtime table initialization
- [lib/db/schema.ts](../lib/db/schema.ts): Drizzle schema

## `/api/chat`

[app/api/chat/route.ts](../app/api/chat/route.ts) is the highest-value backend file in the repo.

It is responsible for:

- checking `ANTHROPIC_API_KEY`
- validating JSON request shape and request size
- rate limiting chat requests
- resolving the session via [lib/session.ts](../lib/session.ts)
- validating UI messages with the AI SDK and tool definitions
- applying message-count and character-count limits
- ensuring the chat exists and belongs to the current session
- streaming the model response with tools
- saving the final message list after streaming completes
- generating or refreshing the chat title

### Request Contract

Expected JSON body:

- `chatId: string`
- `messages: unknown` that must validate as AI SDK UI messages

Important constraints enforced in the route:

- max request size: `50_000` bytes
- max messages per request: `24`
- max chars per user message: `4_000`
- max total user chars per request: `12_000`
- text-only user input; attachments are rejected

## Chat CRUD Endpoints

### `GET /api/chats`

- Lists chats for the current session
- Uses [lib/db/queries.ts](../lib/db/queries.ts) `listChats(sessionId)`

### `POST /api/chats`

- Creates a new chat with optional `id` and `title`
- Defaults to a generated `nanoid()` and `"New chat"`
- Used by the client before the first streamed message is sent

### `GET /api/chats/:chatId`

- Returns the owned chat plus ordered messages
- Returns `404` if the chat is missing or belongs to another session

### `DELETE /api/chats/:chatId`

- Deletes the chat and its messages
- Also enforces session ownership

## Session Ownership

[lib/session.ts](../lib/session.ts) sets or reads the `jazzbot_session` cookie.

Important implications:

- chats are private to a browser session
- chat IDs are not enough on their own; the session must also match
- [lib/db/queries.ts](../lib/db/queries.ts) raises `ChatOwnershipError` if a chat ID exists but belongs to another session

## Database Model

[lib/db/schema.ts](../lib/db/schema.ts) defines two tables:

- `chats`
  - `id`
  - `session_id`
  - `title`
  - `created_at`
  - `updated_at`
- `messages`
  - `id`
  - `chat_id`
  - `role`
  - `parts`
  - `created_at`

`parts` stores the AI SDK UI message parts as JSON.

## Persistence Behavior

[lib/db/index.ts](../lib/db/index.ts) initializes the database lazily on first access and creates tables/indexes if they do not exist.

[lib/db/queries.ts](../lib/db/queries.ts) contains the higher-level behavior:

- `createChat(...)`: inserts a chat
- `getChat(...)`: session-scoped lookup
- `ensureChatExists(...)`: creates or rejects based on ownership
- `getChatWithMessages(...)`: loads a chat plus ordered messages
- `saveMessages(...)`: deletes existing stored messages for the chat, inserts the new final list, and updates `updatedAt`
- `updateChatTitle(...)`: updates title and timestamp
- `deleteChat(...)`: deletes messages and chat in one transaction

`saveMessages(...)` replacing the full message list is an important design choice. If you are changing persistence, keep the AI SDK message model in mind.

## Validation And Rate Limiting

- [lib/request-guards.ts](../lib/request-guards.ts) enforces JSON-only requests, max body size checks via `content-length`, and rate limiting.
- [lib/rate-limit.ts](../lib/rate-limit.ts) uses an in-memory `Map`, keyed by `bucket:ip`.

This means rate limiting is:

- simple
- process-local
- reset on restart
- not shared across instances

## Environment And Storage Defaults

[lib/env.ts](../lib/env.ts) parses runtime env vars and computes DB config.

If `DATABASE_URL` is missing, the app uses:

- `file:${process.cwd()}/.data/jazz-bot.db`

If the DB is file-based, [lib/db/index.ts](../lib/db/index.ts) creates the parent directory automatically.
