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
| WS1-06 | Configs Schema + Runtime Binding | 🔵 PLANNING | WS1-01, WS1-03 |

## WS1-06 Plans

**Plans:** 2 plans in 2 waves

Plans:
- [ ] WS1-06-01-PLAN.md — Expand Zod schema to full skeleton v2 §9.1 (TDD)
- [ ] WS1-06-02-PLAN.md — Wire readConfigs() into plugin.ts + session.created hook

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
