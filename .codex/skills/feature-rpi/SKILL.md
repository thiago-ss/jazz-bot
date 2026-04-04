---
name: feature-rpi
description: Research-plan-implement workflow for new features, architecture changes, multi-file work, and any repo task with unclear impact. Use when adding functionality, changing data flow, touching multiple subsystems, or when a small tweak escalates beyond a local change.
---

# Feature RPI

Use this skill to keep feature work deliberate, context-light, and aligned with the repo's layering rules.

## Start

- Open [`docs/README.md`](../../../docs/README.md).
- Open [`docs/agent-workflows.md`](../../../docs/agent-workflows.md).
- Open [`docs/engineering-standards.md`](../../../docs/engineering-standards.md).
- Open only one relevant subsystem doc next:
  - [`docs/architecture.md`](../../../docs/architecture.md)
  - [`docs/frontend.md`](../../../docs/frontend.md)
  - [`docs/backend.md`](../../../docs/backend.md)
  - [`docs/tools.md`](../../../docs/tools.md)

## Research

- Find the real entrypoints with targeted search.
- Inspect the current flow, constraints, interfaces, and neighboring files before editing.
- Record the touched boundaries, likely risks, and verification path.
- Expand outward only when the current files do not answer the next question.

## Plan

- State the user-visible goal before editing.
- Define the smallest coherent change set.
- Decide where code belongs before writing it.
- Name the acceptance criteria and targeted verification.

## Implement

- Change the smallest coherent slice that satisfies the plan.
- Keep files under the 200-line limit while changing them.
- Split mixed concerns instead of layering more logic into one file.
- Verify the main path plus at least one relevant edge or failure path when the change is non-trivial.

## Keep Context Lean

- Read only the execution path first.
- Summarize findings before opening more files.
- Link to existing files instead of restating their contents.
- Prefer focused docs over scanning whole directories.
