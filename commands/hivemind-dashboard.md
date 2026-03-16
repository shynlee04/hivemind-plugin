---
description: "Explain that the legacy HiveMind dashboard is not a live revamp CLI surface and route users to the current runtime inspection path."
agent: hiveminder
subtask: false
---

# HiveMind Dashboard

The legacy HiveMind dashboard is not a live public CLI or TUI surface in the current `ecosystem-revamp` runtime.

## Current Runtime Path

- Inspect runtime attachment and health with `hm-harness`.
- Inspect runtime context inside OpenCode with `hivemind_runtime_status`.
- Read project and roadmap artifacts with `hivemind_doc` before choosing a workflow lane.

## Why This Command Is Blocked

- `package.json` does not ship a `dashboard` binary.
- `src/cli.ts` only routes `init`, `doctor`, `settings`, `harness`, and `help`.
- `README.md` documents the revamp runtime through those live control-plane commands and in-OpenCode runtime tools.

## Recommended Next Step

If the user asks for dashboard-like visibility, route them to the current inspection flow instead of implying a non-existent executable:

```text
hm-harness -> hivemind_runtime_status -> hivemind_doc -> hm-plan / hm-research / hm-verify
```

## Migration Note

Older dashboard ideas may still exist in historical planning or archived surfaces, but they are not part of the current shipped revamp runtime.
