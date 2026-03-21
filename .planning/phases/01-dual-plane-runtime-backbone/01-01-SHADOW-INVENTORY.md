---
phase: 01-dual-plane-runtime-backbone
plan: 01
task: 2
type: closeout
created: 2026-03-21
---

# Task 2 Closeout: Shadow-Authority Risk Inventory

**Task:** Inventory shadow-authority risks against the canonical boundary
**Date:** 2026-03-21
**Status:** ✅ Complete

---

## Overview

This inventory documents the six validated Phase 1 architecture debt findings that pressure `ARCH-01` (official dual-plane split) or `ARCH-02` (single clear owner, thin adapters). Each finding is mapped to its owner conflict, containment rule, and minimum proof expectation.

---

## Finding 1: Hardcoded `sessionScope: 'main'`

| Field | Value |
|-------|-------|
| **Symptom** | Multiple runtime and status-entry seams still pin `sessionScope` to `'main'` instead of preserving a caller-provided or schema-owned session scope. |
| **Owner Conflict** | `src/plugin/opencode-plugin.ts` (line 51) creates `StartWorkInput` with hardcoded `sessionScope: 'main'`. This asserts scope policy that should belong to the authoritative session owner. |
| **Containment Rule** | The `sessionScope` value must be sourced from one authoritative owner. If caller-provided, it flows through. If absent, the authoritative owner (not the adapter) provides the default. The plugin assembly must not re-assert a fixed policy. |
| **Proof Expectation** | `integration checks` — Show that affected seams project the same session scope value without reasserting local policy. Prove one authoritative source exists and is used consistently. |

---

## Finding 2: Event Hook Bypasses Turn Snapshot Cache

| Field | Value |
|-------|-------|
| **Symptom** | The event path can observe or assemble runtime state without routing through the same turn snapshot cache (`createTurnSnapshotLoader`) used elsewhere in the plugin. |
| **Owner Conflict** | `src/hooks/event-handler.ts` may observe runtime state outside the cached turn snapshot boundary, creating freshness skew with surfaces that do use the cache. |
| **Containment Rule** | All runtime-observable state must route through the turn snapshot cache, or explicitly declare a bounded freshness contract. No adapter may read state directly without going through the authoritative cache boundary. |
| **Proof Expectation** | `live official-interface proof` — Demonstrate on real runtime surfaces that event-driven observations and the cached turn snapshot agree, or document one approved freshness boundary with official-interface evidence. |

---

## Finding 3: Runtime Loading Skips Schema Validation via `JSON.parse`/casts

| Field | Value |
|-------|-------|
| **Symptom** | Some runtime-loading seams deserialize state with `JSON.parse` and TypeScript casts instead of routing through schema validation. |
| **Owner Conflict** | Any loader that bypasses schema validation creates a boundary where runtime state can enter the system without contract checks. This weakens both `ARCH-01` (boundary integrity) and `ARCH-02` (owner clarity). |
| **Containment Rule** | All runtime-loaded state must pass through the intended schema/contract authority before use. `JSON.parse` + cast is only acceptable when the schema validation has already occurred at write time and the loader is consuming a trusted storage format. |
| **Proof Expectation** | `integration checks` — Prove the runtime-loading seam routes through the intended schema/contract authority and rejects or labels invalid state before use. |

---

## Finding 4: Sync `fs` Remains in Workflow/Delegation Paths

| Field | Value |
|-------|-------|
| **Symptom** | Workflow/delegation-adjacent storage paths still rely on synchronous filesystem access. |
| **Owner Conflict** | Sync `fs` in coordination seams signals hidden authority and coupling. Multiple adapters could read/write the same files without proper sequencing, creating ownership ambiguity. |
| **Containment Rule** | Workflow and delegation persistence must use explicit async I/O with clear owner boundaries. If sync `fs` is retained for a specific bounded use case, that use case must be explicitly authorized by the owning slice with a documented reason. |
| **Proof Expectation** | `local diagnostics` — Produce a bounded owner/containment audit for the sync paths and show the retained posture is explicitly authorized or retired in the owning slice. |

---

## Finding 5: `runtime-status` Duplicates Authority Fields

| Field | Value |
|-------|-------|
| **Symptom** | Runtime-status assembly still repeats or reconstructs authority-bearing fields instead of projecting from one owner cleanly. |
| **Owner Conflict** | Multiple status assemblers (`src/tools/runtime/`, `src/sdk-supervisor/runtime-status.ts`, `src/shared/contracts/runtime-status.ts`) can drift and tell different architecture stories about the same runtime state. |
| **Containment Rule** | One authoritative source defines the runtime-status record shape. All other seams project from that source without re-owning the data. Status projection must not re-assert fields that belong to the authoritative owner. |
| **Proof Expectation** | `integration checks` — Show one authoritative source for the duplicated fields and verify the status projection consumes that source without re-owning the data shape. |

---

## Finding 6: Multi-Surface Injection/Compaction Staleness

| Field | Value |
|-------|-------|
| **Symptom** | Injection surfaces (via `chat.message` hook, `experimental.chat.messages.transform`) and compaction surfaces (`experimental.session.compacting`) can present stale state relative to one another. This is validated as actual runtime behavior, not a hypothetical docs mismatch. |
| **Owner Conflict** | Multiple surfaces can drift without explicit labeling or containment. Phase 1 cannot claim a locked backbone if runtime-visible surfaces can disagree on state without labeling. |
| **Containment Rule** | Each surface must either (a) share the same authoritative state source with explicit freshness guarantees, or (b) document the approved staleness contract with explicit evidence. No surface may silently present stale state as authoritative. |
| **Proof Expectation** | `live official-interface proof` — Capture real OpenCode runtime evidence that the relevant surfaces now share the required freshness semantics, or explicitly bound the allowed staleness contract. |

---

## Inventory Summary

| # | Finding | Owner Conflict | Min. Proof Lane |
|---|---------|----------------|-----------------|
| 1 | Hardcoded `sessionScope: 'main'` | Plugin re-asserts policy | `integration checks` |
| 2 | Event hook bypasses cache | Handler observes outside cache | `live official-interface proof` |
| 3 | JSON.parse/casts skip schema | Load bypasses contract boundary | `integration checks` |
| 4 | Sync fs in workflow/delegation | Hidden authority in coordination | `local diagnostics` |
| 5 | runtime-status field duplication | Multiple assemblers drift | `integration checks` |
| 6 | Multi-surface staleness | Surfaces disagree on state | `live official-interface proof` |

---

## Framing Note

These findings are **Phase 1 architecture debt inventory**, not Phase 0 cleanup tasks. They are inputs to the proof gate for downstream Phase 1 slices. Each finding must be closed against its owner conflict, containment rule, and minimum evidence lane. Planning language alone does not retire these items.

---

## Evidence of Analysis

- Read: `src/plugin/opencode-plugin.ts` (hardcoded sessionScope at line 51)
- Read: `src/hooks/event-handler.ts`
- Read: `src/hooks/runtime-loader/runtime-stage.ts`
- Read: `src/tools/runtime/`, `src/sdk-supervisor/runtime-status.ts`
- Read: `src/delegation/` (sync fs paths)
- Read: `01-RESEARCH.md` (Validated architecture debt findings section)

---

## Acceptance Criteria Check

| Criterion | Status |
|-----------|--------|
| Includes all six validated debt findings | ✅ |
| Each finding maps to an owner conflict | ✅ |
| Each finding includes a containment rule | ✅ |
| Each finding includes a proof expectation | ✅ |
| Inventory remains framed as Phase 1 backbone work | ✅ |

---

*This artifact satisfies Task 2 of 01-01-PLAN.md*
