---
phase: 42-tmux-visual-orchestration-layer-fork-extension
plan: 01
subsystem: fork-extension
tags: [tmux, fork, opencode-tmux, hivemind]
depends_on: []
provides: [fork-config, metadata-titles, binaryPath-support]
affects: [opencode-tmux]
tech-stack:
  added: []
  patterns: [SpawnPaneOptions, EnrichedSessionEvent, config-controlled-guard]
key-files:
  created: []
  modified:
    - opencode-tmux/package.json
    - opencode-tmux/src/config.ts
    - opencode-tmux/src/session-manager.ts
    - opencode-tmux/src/tmux.ts
    - opencode-tmux/src/__tests__/config.test.ts
    - opencode-tmux/src/__tests__/session-manager.test.ts
    - opencode-tmux/src/__tests__/tmux.test.ts
    - opencode-tmux/src/__tests__/index.test.ts
decisions:
  - "Fork stays Bun-native with Node-compatible ESM build via --target node"
  - "spawnPane() migrated from positional params to SpawnPaneOptions object"
  - "Pane titles use [agentType] delegationId — format with 40-char tmux truncation"
  - "parentID guard controlled by copilot flag, not hardcoded"
metrics:
  duration: "~15 min"
  completed_date: "2026-05-31"
---

# Phase 42 Plan 01: Fork Extension Summary

Fork `shynlee04/opencode-tmux` renamed to `@hivemind/opencode-tmux` with Hivemind-specific config keys, config-controlled `parentID` guard, metadata-formatted pane titles, and explicit binary path support.

## Tasks Executed

| # | Task | Type | Commit | Key Files |
|---|------|------|--------|-----------|
| 1 | Rename package.json | auto | `fdffe43` | `opencode-tmux/package.json` |
| 2 | Extend config.ts with Hivemind config keys | auto | `9621951` | `opencode-tmux/src/config.ts`, `config.test.ts`, `session-manager.test.ts` |
| 3 | Modify session-manager.ts — config-controlled parentID guard + metadata | tdd | `8e03394` | `opencode-tmux/src/session-manager.ts`, `session-manager.test.ts` |
| 4 | Modify tmux.ts — SpawnPaneOptions with binaryPath and hivemindMeta | tdd | `8e03394` | `opencode-tmux/src/tmux.ts`, `tmux.test.ts`, `index.test.ts` |

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- ✅ `bun test` — 76 pass, 0 fail (97.08% line coverage)
- ✅ `bun run typecheck` — no errors
- ✅ `bun run build` — dist/ produced (15.53 KB)
- ✅ package.json renamed, peer dep pinned to `^1.15.13`, URLs updated
- ✅ Config `copilot: true` → SessionManager relaxes parentID guard (tested)
- ✅ Pane title `[gsd-phase-researcher] ses_abc1 — Research phase 42` (tested)
- ✅ `binaryPath` overrides "opencode" in spawn command (tested)
- ✅ `hivemindMeta` absent → original first-30-chars title behavior (tested)

## Self-Check: PASSED
