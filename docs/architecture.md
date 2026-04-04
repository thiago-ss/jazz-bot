# Architecture

This doc explains the minimum you need to understand before changing behavior. For UI details, continue to [frontend.md](./frontend.md). For server and persistence details, continue to [backend.md](./backend.md).

## System In One Pass

1. The root route redirects from [app/page.tsx](../app/page.tsx) to `/chat`.
2. Chat pages are wrapped by [app/chat/layout.tsx](../app/chat/layout.tsx), which mounts [components/chat-shell.tsx](../components/chat-shell.tsx).
3. `ChatShell` provides sidebar state and chat history context to the whole chat experience.
4. New chats render [components/chat-page.tsx](../components/chat-page.tsx). Existing chats load data through [components/chat-page-loader.tsx](../components/chat-page-loader.tsx) first.
5. The client uses `useChat` with `DefaultChatTransport` to post message state to [app/api/chat/route.ts](../app/api/chat/route.ts).
6. The server validates the payload, restores or creates the session-scoped chat, runs the model with tools from [lib/tools/index.ts](../lib/tools/index.ts), and streams the response back.
7. When streaming finishes, final messages are persisted through [lib/db/queries.ts](../lib/db/queries.ts).
8. Sidebar data is refreshed from the chat CRUD endpoints under [app/api/chats/](../app/api/chats/).

## Main Execution Paths

### 1. New Chat

- [components/chat-page.tsx](../components/chat-page.tsx) creates a chat via `POST /api/chats`.
- The initial prompt is temporarily stored in [hooks/use-chat-draft.ts](../hooks/use-chat-draft.ts).
- The client navigates to `/chat/:id`.
- After navigation, the saved draft is replayed into the newly created chat.

### 2. Existing Chat

- [app/chat/[chatId]/page.tsx](../app/chat/%5BchatId%5D/page.tsx) renders [components/chat-page-loader.tsx](../components/chat-page-loader.tsx).
- The loader fetches `GET /api/chats/:chatId`.
- Normalized message data is passed into [components/chat-page.tsx](../components/chat-page.tsx) as `initialMessages`.

### 3. Streaming Response

- [app/api/chat/route.ts](../app/api/chat/route.ts) validates the request body and message structure.
- The handler runs `streamText(...)` with:
  - system prompt from [lib/system-prompt.ts](../lib/system-prompt.ts)
  - Claude model via `createAnthropic()`
  - tool registry from [lib/tools/index.ts](../lib/tools/index.ts)
- The AI SDK returns a UI message stream response.
- `onFinish` saves the final message list and updates the title if the chat still has the default title.

## Key Boundaries

### UI vs state vs server

- Visual composition lives mostly in [components/](../components/).
- Small client-only state helpers live in [hooks/](../hooks/).
- Server request validation and persistence live in [lib/](../lib/) and [app/api/](../app/api/).

### Persistence boundary

- Only the server talks to the database.
- DB access flows through [lib/db/index.ts](../lib/db/index.ts) and [lib/db/queries.ts](../lib/db/queries.ts).
- Chat ownership is enforced by session ID, not just chat ID.

### Tool boundary

- Tool registration is centralized in [lib/tools/index.ts](../lib/tools/index.ts).
- Tool implementations are isolated by concern in separate files under [lib/tools/](../lib/tools/).

## Route Map

- [app/page.tsx](../app/page.tsx): redirect to `/chat`
- [app/chat/page.tsx](../app/chat/page.tsx): blank/new chat page
- [app/chat/[chatId]/page.tsx](../app/chat/%5BchatId%5D/page.tsx): existing chat page
- [app/api/chat/route.ts](../app/api/chat/route.ts): streaming chat endpoint
- [app/api/chats/route.ts](../app/api/chats/route.ts): list/create chats
- [app/api/chats/[chatId]/route.ts](../app/api/chats/%5BchatId%5D/route.ts): fetch/delete a single chat

## Important Invariants

- A chat belongs to the browser session identified by the `jazzbot_session` cookie in [lib/session.ts](../lib/session.ts).
- `saveMessages(...)` replaces the full stored message list for a chat rather than appending partial deltas.
- Rate limiting is in-memory per server instance via [lib/rate-limit.ts](../lib/rate-limit.ts), so it is best-effort and not distributed.
- The tool registry is explicit. Adding a tool file does nothing until it is exported from [lib/tools/index.ts](../lib/tools/index.ts).
- The server only supports JSON requests for the REST endpoints guarded by [lib/request-guards.ts](../lib/request-guards.ts).
