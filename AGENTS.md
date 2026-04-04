<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:clean-code-rules -->
# Clean Code, SOLID, Separation of Concerns, and Performance

## File size limit
No component, hook, or module file may exceed **200 lines**.
Split before or during implementation, never after the fact.
If a change would push a file past the limit, extract sub-components, hooks, or helpers first.

## Separation of concerns
- **Browser API utilities** (blob, clipboard, media capture) → `lib/browser/`
- **Business logic** (grouping, formatting, title generation) → `lib/`
- **Custom hooks** (stateful logic, effects) → `hooks/`
- **Server data access** → `lib/db/`
- **Presentational sub-components** — group related thin wrappers in a `*-primitives.tsx` file
- **Do not mix** UI rendering with data fetching, state management, or keyboard shortcuts in the same component
- Keep rendering, state, effects, data access, and browser APIs in their dedicated layers
- If one file starts owning multiple concerns, split it before adding more behavior

## SOLID principles
- **SRP**: Each file has exactly one reason to change
- **OCP**: For extensible part-type rendering, prefer a map/registry over long `if/else if` type chains
- **ISP**: Define narrow context interfaces; expose only what consumers need
- **DIP**: Inject dependencies (transports, API clients) rather than hardcoding concrete implementations inline
- Prefer registries and composition over broad shared state or condition-heavy components

## No duplication
- If a helper function appears in more than one file, extract it to `lib/`
- If a hook's logic is reused, extract it to `hooks/`

## Performance
- Optimize only where the code path justifies it
- Avoid unnecessary client work, repeated fetches, avoidable rerenders, and heavy effects in render-heavy components
- Do not add memoization or abstraction churn without a concrete reason in the current code path
- Prefer server-side or cached work over repeated client recomputation when the architecture allows it
<!-- END:clean-code-rules -->

<!-- BEGIN:agent-workflow-rules -->
# Progressive Disclosure, Context Debloating, and RPI

## Start here
- Start implementation tasks at `docs/README.md`
- Open the matching repo-local skill before implementation work:
  - New features, architecture changes, multi-file work, or unclear impact → `.codex/skills/feature-rpi/SKILL.md`
  - Small tweaks, isolated bugfixes, copy edits, or low-blast-radius polish → `.codex/skills/mini-rpi/SKILL.md`
- Read only the most relevant focused doc after the docs index:
  - `docs/agent-workflows.md`
  - `docs/engineering-standards.md`
  - then one of `docs/architecture.md`, `docs/frontend.md`, `docs/backend.md`, or `docs/tools.md`

## Progressive disclosure
- Start from `docs/README.md`, then open only the most relevant focused doc, then only the source files on the execution path
- Prefer targeted `rg` searches over broad file reads
- Do not read whole directories or large files unless the current task requires them
- When adding docs, keep them hub-and-spoke: one index page plus focused linked pages

## Context debloating
- Summarize findings before opening more files
- Avoid restating code that already exists; link to files instead
- Load only the minimum files needed to answer or implement
- If a task touches one subsystem, do not preload unrelated subsystems
- Prefer adding references over expanding instruction files

## RPI workflow
- Use full `Research -> Plan -> Implement` for any new feature or medium/large change
- `Research`: inspect current flow, constraints, affected interfaces, and neighboring files before editing
- `Plan`: define behavior, touched areas, tests, and acceptance criteria before editing
- `Implement`: make the smallest coherent change set, then verify it
- Do not begin implementation until research has identified the real entrypoints and constraints

## Mini-RPI
- Use `Research -> Plan -> Implement` in a reduced form for small tweaks, bugfixes, copy edits, or isolated UI polish
- `Research`: inspect 1-3 directly relevant files
- `Plan`: state the intended change, impact surface, and quick verification
- `Implement`: patch only the minimal affected slice
- Escalate from mini-RPI to full RPI whenever the tweak crosses subsystem boundaries, changes data flow, or risks regressions
<!-- END:agent-workflow-rules -->
