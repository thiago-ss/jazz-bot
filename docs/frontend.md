# Frontend

This doc is for client-side behavior, page composition, and where UI state lives. For end-to-end flow, read [architecture.md](./architecture.md) first.

## Page Composition

- [app/chat/layout.tsx](../app/chat/layout.tsx) wraps all chat pages in [components/chat-shell.tsx](../components/chat-shell.tsx).
- [components/chat-shell.tsx](../components/chat-shell.tsx) provides:
  - `ChatHistoryProvider`
  - sidebar layout state
  - the global keyboard shortcut for jumping to `/chat`
- [components/chat-header.tsx](../components/chat-header.tsx) renders the top bar and active chat title.
- [components/chat-sidebar.tsx](../components/chat-sidebar.tsx) renders chat history groups and delete actions.

## Main Chat Screen

[components/chat-page.tsx](../components/chat-page.tsx) is the main client orchestrator. It owns:

- AI SDK `useChat`
- transport configuration for `/api/chat`
- pending-draft replay for new chats
- optimistic navigation from `/chat` to `/chat/:id`
- submission and stop behavior
- layout of the conversation area and prompt input

If a task changes chat transport, submit behavior, or high-level screen layout, this is usually the first file to open.

## Loading Existing Chats

- [app/chat/[chatId]/page.tsx](../app/chat/%5BchatId%5D/page.tsx) passes the route param to [components/chat-page-loader.tsx](../components/chat-page-loader.tsx).
- `ChatPageLoader` fetches `GET /api/chats/:chatId`, normalizes the payload with [components/chat-api.ts](../components/chat-api.ts), and passes the loaded messages into `ChatPage`.
- If the chat fetch fails, the loader renders the not-found style state instead of the full shell content.

## Message Rendering

- [components/chat-message-list.tsx](../components/chat-message-list.tsx) renders message parts by type.
- Assistant tool calls are shown through [components/ai-elements/tool.tsx](../components/ai-elements/tool.tsx) plus [components/tool-result-card.tsx](../components/tool-result-card.tsx).
- Conversation containers and scroll behavior live in [components/ai-elements/conversation.tsx](../components/ai-elements/conversation.tsx).
- Prompt input primitives live under [components/ai-elements/prompt-input*.tsx](../components/ai-elements/).

When changing visual treatment of chat bubbles, tool cards, or prompt UX, stay in `components/` and avoid mixing that work into server files.

## Client State Map

- [components/chat-history-provider.tsx](../components/chat-history-provider.tsx): sidebar chat list, active chat lookup, create/delete/refresh actions
- [hooks/use-chat-draft.ts](../hooks/use-chat-draft.ts): stores the first message temporarily in `sessionStorage` while a new chat route is created
- [hooks/use-tool-open-state.ts](../hooks/use-tool-open-state.ts): remembers which tool result cards are expanded
- [hooks/use-referenced-sources.ts](../hooks/use-referenced-sources.ts): source reference state for prompt input context

## API Normalization

[components/chat-api.ts](../components/chat-api.ts) is the client-side normalization layer for chat list/detail payloads. If server payloads change, update this file before touching many UI components.

## Common Changes

### Change the chat list or title behavior

Start with:

- [components/chat-history-provider.tsx](../components/chat-history-provider.tsx)
- [components/chat-sidebar.tsx](../components/chat-sidebar.tsx)
- [components/chat-header.tsx](../components/chat-header.tsx)

### Change submit behavior or initial chat creation

Start with:

- [components/chat-page.tsx](../components/chat-page.tsx)
- [hooks/use-chat-draft.ts](../hooks/use-chat-draft.ts)

### Change how assistant text or tool results render

Start with:

- [components/chat-message-list.tsx](../components/chat-message-list.tsx)
- [components/tool-result-card.tsx](../components/tool-result-card.tsx)
- [components/ai-elements/](../components/ai-elements/)

## Frontend Gotchas

- `ChatPage` uses `useMemo` to rebuild the chat transport when `chatId` changes.
- New chat creation is a two-step flow: create record first, then replay the draft after route transition.
- The sidebar refreshes on pathname changes, so route transitions can trigger list reloads.
- Existing chat pages are client-loaded after route entry, not preloaded on the server.
