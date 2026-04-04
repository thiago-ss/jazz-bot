# Engineering Standards

Use this doc to decide where code belongs and what constraints must hold while implementing changes in this repo.

## Core Rules

### 200-line limit

- Keep every component, hook, and module under 200 lines.
- Split before or during implementation, never after the change lands.
- If a file is already near the limit, extract first and then continue the feature.

### Separation of concerns

- Keep rendering in `components/`.
- Keep stateful reusable client logic in `hooks/`.
- Keep business logic and pure helpers in `lib/`.
- Keep browser APIs in `lib/browser/`.
- Keep server data access in `lib/db/`.
- Keep presentational wrappers thin and group them in `*-primitives.tsx` files when they belong together.

Do not mix UI rendering with:

- data fetching
- keyboard shortcuts
- persistence logic
- browser API handling
- cross-cutting state orchestration

### SOLID in this repo

- Prefer single-purpose files with one reason to change.
- Prefer registries and composition over long conditional chains.
- Prefer narrow interfaces over broad context objects.
- Prefer injected dependencies over hardcoded clients inside components.

### No duplication

- Extract shared helpers to `lib/`.
- Extract reused stateful logic to `hooks/`.
- Extract repeated UI wrappers into presentational primitives.

## Where Code Belongs

| Concern | Default home | Notes |
| --- | --- | --- |
| Route entrypoints and API handlers | `app/` | Keep them thin; push logic down |
| Page and chat presentation | `components/` | Prefer composition over monoliths |
| Reusable state/effects | `hooks/` | Move repeated client logic here |
| Pure business logic and formatting | `lib/` | Keep framework-light where possible |
| Browser-only helpers | `lib/browser/` | Isolate clipboard, media, blob, DOM-style APIs |
| DB schema and queries | `lib/db/` | Keep all direct persistence logic here |
| AI-callable tools | `lib/tools/` | Register centrally, implement in focused files |

## Performance Checklist

- Avoid repeated fetches when data can be reused or refreshed deliberately.
- Avoid avoidable rerenders in chat-heavy or list-heavy components.
- Avoid heavy effects inside components that already render often.
- Avoid memoization by default; add it only when the current code path justifies it.
- Avoid broad shared state when local state or narrower context will do.
- Prefer moving repeated computation out of render paths.

## Implementation Guardrails

- Start from [README.md](./README.md), then use [agent-workflows.md](./agent-workflows.md) and one focused subsystem doc.
- Keep context lean by opening only the files on the execution path.
- If a change pushes a file across concern boundaries, split it instead of adding another layer.
- If a tweak stops being local, switch from mini-RPI to full RPI.

## Done Criteria

- The touched files stay within the 200-line limit.
- The final shape respects the repo's layering.
- Shared logic is extracted instead of copied.
- Any performance-related change has a concrete reason.
- Verification matches the size and risk of the change.
