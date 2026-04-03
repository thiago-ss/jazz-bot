# Jazz Chatbot - Implementation Plan

## Context
Building a jazz-focused chatbot as a technical test submission. The goal is to demonstrate clean architecture, good UX, and smart engineering decisions. The chatbot answers jazz questions using Claude Sonnet 4.5's built-in knowledge, augmented with live data from Last.fm API when needed (play counts, similar artists, trending).

## Tech Stack
- **Next.js** (App Router) + TypeScript
- **Vercel AI SDK** (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`) with Claude Sonnet 4.5
- **Last.fm API** as tool calls (6 tools) for live music data
- **Firecrawl** as web search tool for questions beyond Last.fm's scope
- **SQLite + Drizzle ORM** for chat persistence (zero infrastructure, reviewer can run locally instantly)
- **TailwindCSS + shadcn/ui + AI SDK Elements** (from elements.ai-sdk.dev)
- **Paper design** theme: warm off-white, soft shadows, serif headings, generous whitespace

## Project Structure

```
jazz-chatbot/
├── app/
│   ├── globals.css                    # Paper theme CSS variables
│   ├── layout.tsx                     # Root layout, fonts, metadata
│   ├── page.tsx                       # Redirect to /chat
│   ├── chat/
│   │   ├── layout.tsx                 # Chat layout with sidebar (server component)
│   │   ├── page.tsx                   # New chat (empty state)
│   │   └── [chatId]/
│   │       └── page.tsx               # Existing chat (loads from DB)
│   └── api/
│       ├── chat/route.ts              # POST: streamText handler
│       └── chats/
│           ├── route.ts               # GET: list chats, POST: create chat
│           └── [chatId]/route.ts      # GET: chat + messages, DELETE
├── components/
│   ├── ai-elements/                   # From npx ai-elements (Conversation, Message, PromptInput, Suggestion, Tool)
│   ├── ui/                            # shadcn components
│   ├── chat-page.tsx                  # Main client component (useChat + AI Elements)
│   ├── chat-sidebar.tsx               # Chat history sidebar
│   ├── chat-header.tsx                # Top bar
│   ├── jazz-empty-state.tsx           # Welcome screen with suggestions
│   └── tool-result-card.tsx           # Styled Last.fm result rendering
├── lib/
│   ├── db/
│   │   ├── index.ts                   # Drizzle client
│   │   ├── schema.ts                  # chats + messages tables
│   │   └── queries.ts                 # Query helpers
│   ├── tools/
│   │   ├── index.ts                   # Export all tools
│   │   ├── lastfm-client.ts           # Shared Last.fm fetch wrapper
│   │   ├── search-artist.ts
│   │   ├── get-artist-info.ts
│   │   ├── get-top-tracks.ts
│   │   ├── get-top-albums.ts
│   │   ├── get-similar-artists.ts
│   │   ├── get-tag-top-artists.ts
│   │   └── web-search.ts             # Firecrawl web search
│   ├── system-prompt.ts               # Jazz expert persona
│   └── utils.ts                       # cn() helper
├── drizzle.config.ts
├── .env.local.example
└── .env.local                         # ANTHROPIC_API_KEY, LASTFM_API_KEY, FIRECRAWL_API_KEY
```

## Implementation Steps

### Step 1: Project Scaffold
- `npx create-next-app@latest jazz-chatbot` (TS, Tailwind, App Router)
- Install deps: `ai @ai-sdk/react @ai-sdk/anthropic zod drizzle-orm @libsql/client nanoid @mendable/firecrawl-js`
- Dev deps: `drizzle-kit`
- Init shadcn: `npx shadcn@latest init`
- Add shadcn components: `button scroll-area sheet badge separator`
- Add AI Elements: `npx ai-elements@latest add conversation message prompt-input suggestion tool`
- Create `.env.local` with `ANTHROPIC_API_KEY`, `LASTFM_API_KEY`, `FIRECRAWL_API_KEY`

### Step 2: Database Layer
**Schema** (`lib/db/schema.ts`):
- `chats`: id (text PK), title (text), createdAt (integer), updatedAt (integer)
- `messages`: id (text PK), chatId (text FK), role (text), parts (text - JSON), createdAt (integer)

**Queries** (`lib/db/queries.ts`):
- `createChat(id, title)`, `listChats()`, `getChatWithMessages(chatId)`
- `saveMessages(chatId, messages)`, `updateChatTitle(chatId, title)`, `deleteChat(chatId)`

Store message `parts` as JSON to enable lossless round-trip with `useChat({ initialMessages })`.

### Step 3: Last.fm Tools
**Shared client** (`lib/tools/lastfm-client.ts`): fetch wrapper for `ws.audioscrobbler.com/2.0/`

**6 tools** using `tool()` from `ai` + Zod schemas:
1. `searchArtist` - `artist.search` - find artists by name
2. `getArtistInfo` - `artist.getinfo` - bio, tags, listener stats
3. `getTopTracks` - `artist.gettoptracks` - top tracks with play counts
4. `getTopAlbums` - `artist.gettopalbums` - top albums
5. `getSimilarArtists` - `artist.getsimilar` - discovery recommendations
6. `getTagTopArtists` - `tag.gettopartists` - top artists in a genre/subgenre

Each tool gracefully handles Last.fm errors so the LLM can fall back to its own knowledge.

### Step 3b: Firecrawl Web Search Tool
**Package**: `@mendable/firecrawl-js`

`webSearch` tool (`lib/tools/web-search.ts`):
- Input: `{ query: z.string() }` 
- Uses Firecrawl's `/search` endpoint to search the web
- Returns relevant snippets and URLs
- Useful for: current events, festival dates, new album releases, articles, anything Last.fm doesn't cover

### Step 3c: Tool Orchestration Strategy
The LLM decides which tool(s) to call — no hardcoded chaining. The system prompt guides tool selection:

**Tool selection guidance in system prompt:**
- **Last.fm tools**: Use when the user asks about specific artists, tracks, albums, or genre rankings. These give you real listener data, play counts, and discovery features.
  - `searchArtist` → when you need to verify an artist exists or find their exact name
  - `getArtistInfo` → for bio, tags, and stats about a specific artist
  - `getTopTracks` / `getTopAlbums` → when recommending what to listen to
  - `getSimilarArtists` → for "who sounds like X?" or discovery
  - `getTagTopArtists` → for genre/subgenre rankings ("best bebop artists")
- **webSearch** → Use for questions about current events, news, festival schedules, new releases, or anything that requires up-to-date information beyond your training data and Last.fm's scope.
- **No tools** → For general jazz history, theory, comparisons, and opinions — use your own knowledge. Don't call tools when you already know the answer.

The `maxSteps: 5` setting allows the LLM to call multiple tools in sequence if needed (e.g., search for an artist, then get their top tracks), but each step is the LLM's decision.

### Step 4: System Prompt
Jazz expert persona ("JazzBot"): warm, articulate, opinionated but respectful. Deep knowledge of all jazz eras. Includes tool selection guidance (see Step 3c). Formats responses with markdown. Weaves tool results into natural prose.

### Step 5: API Routes
**`POST /api/chat`**: Core streaming handler
- Extract `{ messages, chatId }` from request body
- `streamText()` with Anthropic model, system prompt, jazz tools, `maxSteps: 5`
- `onFinish` callback saves messages to DB and auto-generates title from first user message

**`GET /api/chats`**: List all chats for sidebar
**`POST /api/chats`**: Create new chat record
**`DELETE /api/chats/[chatId]`**: Delete chat + messages

### Step 6: Routing & Layouts
- `app/page.tsx` redirects to `/chat`
- `app/chat/layout.tsx` (server): fetches chat list, renders sidebar + children
- `app/chat/page.tsx` (server): renders `<ChatPage />` with empty state
- `app/chat/[chatId]/page.tsx` (server): fetches chat from DB, passes `initialMessages` to `<ChatPage>`

### Step 7: Client Components
**`chat-page.tsx`** - Main orchestrator:
```
useChat({ id: chatId, initialMessages, body: { chatId } })
```
- Empty state: jazz welcome + suggestion pills
- Messages: AI Elements `<Conversation>` > `<Message>` > `<MessageContent>` > `<MessageResponse>`
- Tool calls: AI Elements `<Tool>` with custom `<ToolResultCard>` for Last.fm data
- Input: AI Elements `<PromptInput>` with textarea + submit
- New chat flow: create chat via API -> router.replace to `/chat/[newId]` -> send message

**`chat-sidebar.tsx`**: Chat list with active state, new chat button, delete
**`chat-header.tsx`**: Mobile sidebar toggle (Sheet), new chat button
**`jazz-empty-state.tsx`**: Welcome message + 4 jazz-themed suggestion prompts

### Step 8: Paper Design Theme
**Colors** (CSS variables in globals.css):
- Background: warm cream/off-white
- Foreground: dark warm brown-black
- Primary: deep ink blue-black (jazz feel)
- Accent: warm amber (aged paper, brass)
- Borders: very subtle warm gray

**Shadows** (custom utilities):
- `.paper-shadow`: subtle layered shadow for messages
- `.paper-elevated`: deeper shadow for sidebar/cards
- `.paper-inset`: inner shadow for inputs

**Typography** (via next/font/google):
- Headings: serif font (Playfair Display or Libre Baskerville)
- Body: clean sans (Inter or DM Sans)

**Design rules**:
- No hard-colored message backgrounds. User = subtle warm tint, assistant = white with thin border
- Generous whitespace: `max-w-2xl` message area, `py-6` between messages
- Suggestion pills: outlined, no fill, subtle hover lift
- Sidebar: off-white with paper-elevated shadow

### Step 9: Polish
- Responsive: sidebar as Sheet on mobile
- Streaming shimmer/loading states
- Auto-title from first user message (truncation, no extra API call)
- Keyboard shortcuts: Cmd+K new chat
- Env validation with Zod at startup
- Clean README with setup instructions and architecture decisions

## Verification
1. `npm run dev` - app starts without errors
2. Create a new chat, send "Recommend me 5 jazz artists to start with" - get streaming response
3. Ask "What are Miles Davis's most played tracks?" - should trigger Last.fm `getTopTracks` tool
4. Ask "Who sounds like John Coltrane?" - should trigger `getSimilarArtists` tool
5. Refresh the page - chat history persists, messages reload
6. Check sidebar - chat appears with auto-generated title
7. Create multiple chats, switch between them
8. Test on mobile viewport - sidebar collapses to Sheet
9. Delete a chat - removed from sidebar and DB
10. Ask "What jazz festivals are happening this summer?" - should trigger Firecrawl `webSearch` tool
11. Ask "Tell me about the history of bebop" - should NOT trigger any tools (LLM knowledge is sufficient)
