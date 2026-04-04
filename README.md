# Jazzbot

A jazz-focused chat app built for exploratory music conversations. It combines model reasoning with live Last.fm lookups, current web search, and local chat memory so the experience feels less like a generic assistant and more like a knowledgeable guide for discovering artists, understanding scenes, and following threads across jazz history.

The core idea is simple: jazz questions often span different kinds of knowledge at once. A good answer might need music discovery, artist relationships, discography context, popularity signals, and sometimes current information from the web. JazzBot is designed around that workflow.

With Jazzbot, you can:

- discover artists, albums, and tracks worth exploring next
- trace stylistic connections between players, scenes, and eras
- ask about jazz history, movements, and musical ideas in natural language
- pull in live popularity and catalog context from Last.fm
- use web search when a question needs up-to-date information

## How it works

- The chat experience is built with Next.js App Router and the AI SDK.
- Claude Sonnet 4.5 handles the conversational reasoning and tool use.
- Last.fm tools provide artist info, similar artists, top tracks, top albums, and tag-based discovery.
- Web search fills in live or current details when the answer should go beyond the music catalog.
- Chat history is stored locally in SQLite via Drizzle, so conversations persist between sessions on the same app instance.

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp env.example .env.local
```

3. Add the required API keys:

- `ANTHROPIC_API_KEY`
- `LASTFM_API_KEY`
- `FIRECRAWL_API_KEY`

Optional database settings:

- `DATABASE_URL`
- `DATABASE_AUTH_TOKEN`

If `DATABASE_URL` is omitted, the app uses `file:./.data/jazz-bot.db`.

4. Run the app:

```bash
npm run dev
```

## Scripts

- `npm run dev` starts the Next.js development server.
- `npm run build` creates a production build.
- `npm run start` runs the production server.
- `npm run lint` checks the codebase with ESLint.

## Architecture notes

- Chat history is stored in SQLite via Drizzle.
- The chat stream uses the AI SDK with Anthropic and tool calling.
- Last.fm powers artist, album, track, and similarity lookups.
- Firecrawl is used for current web search when the question needs live information.
- The UI is text-only.
