# Agent Workflows

Use this doc to choose the right workflow before implementation. Start here for code changes, then continue to [engineering-standards.md](./engineering-standards.md) and one focused subsystem doc from [README.md](./README.md).

## Workflow Choice

Use full RPI when the task:

- adds a feature
- changes architecture or data flow
- touches multiple subsystems
- changes behavior with unclear blast radius
- starts as a tweak but uncovers deeper coupling

Use mini-RPI when the task:

- is a small bugfix
- is isolated UI polish or copy work
- changes one small behavior in one subsystem
- can be understood from 1-3 directly relevant files

Use the matching repo-local skill:

- [`.codex/skills/feature-rpi/SKILL.md`](../.codex/skills/feature-rpi/SKILL.md)
- [`.codex/skills/mini-rpi/SKILL.md`](../.codex/skills/mini-rpi/SKILL.md)

## Progressive Disclosure Order

1. Open [README.md](./README.md).
2. Open this workflow doc and [engineering-standards.md](./engineering-standards.md).
3. Open only one subsystem doc at first:
   - [architecture.md](./architecture.md)
   - [frontend.md](./frontend.md)
   - [backend.md](./backend.md)
   - [tools.md](./tools.md)
4. Open only the source files on the execution path.
5. Expand outward only if the current files do not answer the next question.

## Full RPI

### 1. Research

- Find the real entrypoints with targeted search.
- Inspect current behavior, nearby interfaces, and affected boundaries.
- Identify constraints from docs, prompts, schemas, and existing abstractions.
- Capture the likely verification path before editing.

Research output:

- touched subsystems
- entrypoint files
- relevant constraints and invariants
- expected tests or checks

### 2. Plan

- State the user-visible goal.
- Define the smallest coherent change set.
- Call out affected interfaces, data flow, and validation.
- Decide where code belongs before editing.

Plan output:

- target behavior
- touched areas
- acceptance criteria
- verification steps

### 3. Implement

- Edit only after research and plan are clear.
- Keep files under the 200-line limit while changing them.
- Split mixed concerns instead of layering more logic into one file.
- Verify the change with the smallest meaningful checks.

## Mini-RPI

### 1. Research

- Inspect 1-3 directly relevant files.
- Confirm the tweak stays inside one subsystem and does not change shared data flow.

### 2. Plan

- State the intended change in one short paragraph or checklist.
- Name the impact surface and quick verification.

### 3. Implement

- Patch the smallest affected slice.
- Stop and escalate if the change spreads beyond the expected files or boundaries.

## Escalate From Mini-RPI To Full RPI When

- the tweak touches more than one subsystem
- the tweak changes data contracts, API shape, persistence, or tool behavior
- the tweak risks regressions outside the original area
- the current file is already overgrown and needs structural work
- the change requires non-obvious performance or architecture decisions

## Verification Expectations

- Run targeted checks that match the change size.
- Prefer focused verification over broad command runs when the task is small.
- For feature work, verify the main path plus at least one edge or failure path.
- If a check cannot be run, say so clearly and state the remaining risk.
