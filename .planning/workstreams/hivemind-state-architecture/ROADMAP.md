---
id: WS-1
type: roadmap
created: 2026-05-06
updated: 2026-05-06
status: active
lineage: shared
---

# WS-1: Hivemind State Architecture — Roadmap

## Phase Overview

| Phase | Title | Status | Dependencies |
|-------|-------|--------|-------------|
| WS1-01 | State Architecture Spec | ✅ COMPLETE | HER-0 |
| WS1-02 | Directory Scaffolding | ✅ COMPLETE | WS1-01 |
| WS1-03 | configs.json Schema + Default | ✅ COMPLETE | WS1-01 |
| WS1-04 | .gitignore Policy Update | ✅ COMPLETE | WS1-02 |
| WS1-05 | Governance Documents | ✅ COMPLETE | WS1-01 |

## Checkpoint

- **CP-1:** State architecture locked — directory spec + schema specs defined ✅
- **CP-2:** Migration path designed — one-way `.opencode/state/` → `.hivemind/state/` (already implemented in `continuity.ts`)
- **CP-3:** Test coverage — 28 new tests for configs schema, all passing

## Downstream Unblocks

Once WS-1 is complete:
- **WS-3 (Primitive Registry)** → can write to `.hivemind/registries/`
- **WS-2 (Bootstrap CLI)** → can generate `configs.json` during `npx init`
- **HER-3 (Context & Compaction)** → can follow state architecture patterns
- **WS-6 (Trajectory)** → can write to `.hivemind/hm-brain/`
- **WS-7 (Context Engine)** → can write to `.hivemind/` with known frontmatter schema
