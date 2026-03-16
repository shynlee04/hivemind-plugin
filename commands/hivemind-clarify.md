---
description: "Use when intent is unclear or context is incomplete. Gather current runtime and project evidence before proceeding."
agent: hiveminder
---

# HiveMind Clarify

Use this helper when the request is underspecified.

## Current Runtime-Safe Flow

1. Inspect runtime readiness with:

```ts
hivemind_runtime_status({})
```

2. Read the nearest planning and authority files.

3. Search the codebase directly for the most likely target files or patterns.

4. Ask the smallest clarifying question only if direct exploration still leaves multiple materially different interpretations.

## Output Contract

Return:
- what was checked
- what remains ambiguous
- the simplest current interpretation
- the exact clarification still needed, if any
