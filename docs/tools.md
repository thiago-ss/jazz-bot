# Tools And External Services

This doc covers the AI-callable tool layer, external dependencies, and where to extend them.

## Tool Registry

[lib/tools/index.ts](../lib/tools/index.ts) is the single registry used by the chat route.

Current exported tools:

- `searchArtist`
- `getArtistInfo`
- `getSimilarArtists`
- `getTagTopArtists`
- `getTopAlbums`
- `getTopTracks`
- `webSearch`

If a tool is not exported here, the model cannot call it.

## Tool Categories

### Last.fm-backed tools

Shared client/helpers live in [lib/tools/lastfm-client.ts](../lib/tools/lastfm-client.ts).

That file is responsible for:

- reading `LASTFM_API_KEY`
- building requests to the Last.fm API
- normalizing array-like responses
- stripping HTML from bios/content
- returning a consistent unavailable-result shape when the service is missing or failing

Tool files built on top of it include:

- [lib/tools/search-artist.ts](../lib/tools/search-artist.ts): search and disambiguation
- [lib/tools/get-artist-info.ts](../lib/tools/get-artist-info.ts): bio, stats, tags, related artists
- [lib/tools/get-similar-artists.ts](../lib/tools/get-similar-artists.ts): discovery based on artist similarity
- [lib/tools/get-top-albums.ts](../lib/tools/get-top-albums.ts): top albums for an artist
- [lib/tools/get-top-tracks.ts](../lib/tools/get-top-tracks.ts): top tracks for an artist
- [lib/tools/get-tag-top-artists.ts](../lib/tools/get-tag-top-artists.ts): artist discovery by tag/subgenre

### Live web search

[lib/tools/web-search.ts](../lib/tools/web-search.ts) wraps Firecrawl and is intended only for current or time-sensitive information.

It:

- reads `FIRECRAWL_API_KEY`
- runs `firecrawl.search(...)`
- returns separate normalized `newsResults` and `webResults`
- trims long descriptions down to concise snippets

## Prompt-Level Tool Policy

[lib/system-prompt.ts](../lib/system-prompt.ts) tells the model when to use each tool.

Current policy in plain language:

- use Last.fm tools for artist/discography/discovery tasks
- use `searchArtist` for name confirmation or disambiguation
- use `webSearch` only for current information
- rely on built-in knowledge for general jazz history/theory when tools are unnecessary

If tool behavior seems wrong, inspect both the tool file and the system prompt before changing only one side.

## How Tools Reach The UI

1. The model calls a tool exposed through [lib/tools/index.ts](../lib/tools/index.ts).
2. The AI SDK includes tool parts in the streamed UI message payload from [app/api/chat/route.ts](../app/api/chat/route.ts).
3. [components/chat-message-list.tsx](../components/chat-message-list.tsx) detects tool parts and renders them.
4. [components/tool-result-card.tsx](../components/tool-result-card.tsx) formats successful tool output for display.

## Adding A New Tool

1. Create a focused file under [lib/tools/](../lib/tools/).
2. Define input with Zod and expose the tool via `tool({...})`.
3. Reuse shared helpers if the tool talks to Last.fm or another existing service.
4. Export the tool from [lib/tools/index.ts](../lib/tools/index.ts).
5. Update [lib/system-prompt.ts](../lib/system-prompt.ts) if the model needs guidance on when to call it.
6. Verify the output shape is readable in the existing tool-result UI.

## External Service Summary

- Anthropic: model inference, configured via `ANTHROPIC_API_KEY`
- Last.fm: artist/discography/discovery data, configured via `LASTFM_API_KEY`
- Firecrawl: live web/news search, configured via `FIRECRAWL_API_KEY`

Env parsing for all of these lives in [lib/env.ts](../lib/env.ts).
