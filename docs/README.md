# Jazzbot Docs

This folder is a lightweight map of the codebase for humans and AI agents. Start here, then follow links into smaller docs or source files instead of reading the whole repo at once.

## What This Project Is

Jazzbot is a Next.js chat app for jazz-focused conversations. It combines:

- Claude-based reasoning and tool use
- Last.fm tools for artist/discography discovery
- Firecrawl web search for current information
- Local chat persistence in SQLite/libSQL via Drizzle

Canonical high-level context still lives in [README.md](../README.md) and workflow constraints live in [AGENTS.md](../AGENTS.md).

## Implementation Start Here

For implementation work, start in this order:

1. Open [agent-workflows.md](./agent-workflows.md).
2. Open [engineering-standards.md](./engineering-standards.md).
3. Open the matching repo-local skill:
   - [`.codex/skills/feature-rpi/SKILL.md`](../.codex/skills/feature-rpi/SKILL.md) for new features, architecture changes, or multi-file work
   - [`.codex/skills/mini-rpi/SKILL.md`](../.codex/skills/mini-rpi/SKILL.md) for small tweaks and low-blast-radius changes
4. Open only one focused subsystem doc after that.

## Suggested Reading Order

1. Read [agent-workflows.md](./agent-workflows.md) for full RPI vs mini-RPI.
2. Read [engineering-standards.md](./engineering-standards.md) for code placement and guardrails.
3. Read [architecture.md](./architecture.md) for the end-to-end request flow.
4. Read one focused doc based on the task:
   - UI or interaction work: [frontend.md](./frontend.md)
   - API, persistence, or validation work: [backend.md](./backend.md)
   - Tooling or external data work: [tools.md](./tools.md)
5. Open the linked source files only for the area you are changing.

## Task-Based Navigation

| If you need to... | Start here | Then open |
| --- | --- | --- |
| Add a new feature or medium/large change | [agent-workflows.md](./agent-workflows.md) + [`.codex/skills/feature-rpi/SKILL.md`](../.codex/skills/feature-rpi/SKILL.md) | [architecture.md](./architecture.md) and the matching subsystem doc |
| Make a small tweak or isolated bugfix | [agent-workflows.md](./agent-workflows.md) + [`.codex/skills/mini-rpi/SKILL.md`](../.codex/skills/mini-rpi/SKILL.md) | the most relevant focused doc and 1-3 execution-path files |
| Change the main chat screen | [frontend.md](./frontend.md) | [components/chat-page.tsx](../components/chat-page.tsx) |
| Change the sidebar or chat list | [frontend.md](./frontend.md) | [components/chat-sidebar.tsx](../components/chat-sidebar.tsx), [components/chat-history-provider.tsx](../components/chat-history-provider.tsx) |
| Change streaming/chat request behavior | [backend.md](./backend.md) | [app/api/chat/route.ts](../app/api/chat/route.ts) |
| Change chat CRUD APIs | [backend.md](./backend.md) | [app/api/chats/route.ts](../app/api/chats/route.ts), [app/api/chats/[chatId]/route.ts](../app/api/chats/%5BchatId%5D/route.ts) |
| Change persistence or schema | [backend.md](./backend.md) | [lib/db/index.ts](../lib/db/index.ts), [lib/db/schema.ts](../lib/db/schema.ts), [lib/db/queries.ts](../lib/db/queries.ts) |
| Add or edit a music/web tool | [tools.md](./tools.md) | [lib/tools/index.ts](../lib/tools/index.ts) and the specific tool file |
| Change session or rate limits | [backend.md](./backend.md) | [lib/session.ts](../lib/session.ts), [lib/request-guards.ts](../lib/request-guards.ts), [lib/rate-limit.ts](../lib/rate-limit.ts) |
| Change prompt behavior | [tools.md](./tools.md) | [lib/system-prompt.ts](../lib/system-prompt.ts) |

## Repo Landmarks

- [app/](../app/) contains route entry points and API handlers.
- [components/](../components/) contains client UI and chat presentation.
- [components/ai-elements/](../components/ai-elements/) contains reusable message, prompt, conversation, and tool UI primitives.
- [hooks/](../hooks/) contains small client-side state helpers.
- [lib/](../lib/) contains business logic, request guards, prompt text, and utilities.
- [lib/db/](../lib/db/) contains database initialization, schema, and queries.
- [lib/tools/](../lib/tools/) contains AI-callable tools and external service adapters.

## Runtime Prerequisites

The main environment variables are defined in [env.example](../env.example) and parsed in [lib/env.ts](../lib/env.ts):

- `ANTHROPIC_API_KEY`
- `LASTFM_API_KEY`
- `FIRECRAWL_API_KEY`
- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN`

If `DATABASE_URL` is omitted, the app uses `.data/jazz-bot.db` when the app directory is writable. In read-only deployments, it falls back to a temp SQLite file under the OS temp directory. For persistent production storage, set `DATABASE_URL`.

## Practical Notes For Agents

- Prefer linked source files over re-explaining behavior that already exists in code.
- Prefer the workflow docs and skills over loading many source files up front.
- The most important runtime path is: page -> client chat state -> `/api/chat` -> tools/model -> DB save.
- Session ownership matters: chats are scoped by the `jazzbot_session` cookie, so chat IDs are not globally shareable across sessions.
