[LANGUAGE: Write this file in vi per Language Governance.]
# CP-ST-02: Session-Tracker Deep Fix — Remaining Issues — CONTEXT

**Gathered:** 2026-05-13
**Status:** Ready for spec-phase
**Source:** `.hivemind/planning/session-tracker-deep-fix-2026-05-13/` + live code audit + gsd-phase-researcher findings

<domain>
## Phase Boundary

CP-ST-02 fixes the orphan directory bug in session-tracker where child sessions (L1/L2) incorrectly get their own subdirectories. Current behavior: both the main L0 session AND its L1 child have separate directories. Correct behavior: ONLY the main L0 session gets a directory; all children exist as `.json` files under the parent directory.

### Bug Evidence (live state 2026-05-13)

```
.hivemind/session-tracker/
├── project-continuity.json
├── ses_1ded410beffe5nabRgB0H1m4ft/                ← L0 main ✅
│   ├── ses_1ded410beffe5nabRgB0H1m4ft.md
│   ├── session-continuity.json
│   └── ses_1dec9ffe2ffe93W0qHqu8ywDEQ.json        ← L1 child JSON ✅
└── ses_1dec9ffe2ffe93W0qHqu8ywDEQ/                ← L1 child DIR ❌ ORPHAN!
    ├── ses_1dec9ffe2ffe93W0qHqu8ywDEQ.md           ← messages captured WRONG place
    └── session-continuity.json                      ← turnCount: 0, toolSummary filled
```

### Target Structure

```
.hivemind/session-tracker/
├── project-continuity.json                          ← ALL sessions registered
└── ses_XXXXXXXXX/                                   ← ONLY L0 main session dir
    ├── ses_XXXXXXXXX.md                             ← main session messages
    ├── session-continuity.json                      ← hierarchy: L1+L2 children
    ├── ses_childL1_1.json                           ← L1 child as JSON (messages + tools)
    ├── ses_childL1_2.json                           ← L1 child as JSON
    └── ses_grandchildL2.json                        ← L2 grandchild as JSON
```

### Three Root Causes

1. **Race condition:** `session.created` fires for child DURING `TaskTool.execute()`, BEFORE `tool.execute.after` populates HierarchyIndex. Both classification gates fail → child treated as main → orphan directory.

2. **Missing PreToolUse gate:** No `tool.execute.before` hook wired for session-tracker. At PreToolUse time, we know task dispatch is happening but don't register child proactively.

3. **Child session ID unavailable at PreToolUse:** Child session is created DURING execution, NOT before. Must poll `client.session.children()` after dispatch to discover child before `session.created` arrives.
</domain>

<decisions>
## Implementation Decisions

### D-01: Three-Gate Classification (NEW — supersedes dual-gate)

Gate order:
1. **Gate 1 (SDK):** `client.session.get(id)` → check `parentID`
2. **Gate 2 (HierarchyIndex):** in-memory `childToParent` map
3. **Gate 3 (PendingDispatchRegistry):** NEW — tracks sessions that had `tool.execute.before` with `tool === "task"`. Populated at PreToolUse time, consumed by `ensureSessionReady`. If a session ID has a pending dispatch entry, treat as child.

### D-02: PreToolUse Hook → PendingDispatchRegistry

- Wire `tool.execute.before` in `src/plugin.ts` for session-tracker
- When `input.tool === "task"`, record `{ parentSessionID, callID, subagentType, timestamp }` in PendingDispatchRegistry
- Fire-and-forget: `client.session.children(parentID)` polling loop (~200ms retry, max 5 attempts)
- On child discovery: register in HierarchyIndex, remove from pending registry
- If PostToolUse fires first with `output.metadata.sessionId` → register directly

### D-03: Server API as Primary Hierarchy Source

- `client.session.children({ path: { id } })` → authoritative child list
- `client.session.get({ path: { id } })` → returns `parentID`
- Hook events are SECONDARY triggers; Server API is PRIMARY

### D-04: Delegator Attribution

- Capture `args.subagent_type` from `tool.execute.before` output
- Store in PendingDispatchRegistry
- Flow into child session record's `delegatedBy.agentName`
- Fallback to `"unknown"` only when truly unavailable

### D-05: Child Session Structure

- L1/L2 children are `.json` files ONLY — NEVER directories
- Child `.json` captures: delegation metadata, chat messages (via childWriter), tool calls
- Child registered in both `session-continuity.json` (hierarchy.children) and `project-continuity.json`
- ALL child sessions in `project-continuity.json` — no orphans

### D-06: Existing State Cleanup

- Remove orphan child directories from `.hivemind/session-tracker/`
- Run recovery script to ensure `project-continuity.json` completeness
- Preserve existing child `.json` files under parent directories

### D-07: Test Requirements

- Unit tests for PendingDispatchRegistry
- Unit tests for `tool.execute.before` hook wiring
- Unit tests for three-gate classification
- Unit tests for delegator attribution from subagent_type
- Integration test: task dispatch → child JSON created → no orphan directory
- Verify existing 256 tests continue to pass
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Spec & Design
- `.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-SPEC.md` — Formal spec with AC-01 to AC-12
- `.planning/phases/CP-ST-02-session-tracker-deep-fix-remaining/CP-ST-02-RESEARCH.md` — SDK lifecycle, hook timing, polling strategy, Server API

### Architecture
- `.planning/codebase/ARCHITECTURE.md` — CQRS model, 9-surface authority, hook boundary rules (§3: hooks SHALL NOT directly write durable state)
- `.planning/codebase/STRUCTURE.md` — File placement conventions

### Source Code (current state)
- `src/plugin.ts:162-180` — consumeSessionTrackerFact (GAP #1 FIXED)
- `src/plugin.ts:236-253` — tool.execute.after hook wiring (GAP #2 FIXED)
- `src/features/session-tracker/index.ts` — SessionTracker class (dual-gate → upgrade to three-gate)
- `src/features/session-tracker/capture/tool-capture.ts` — ToolCapture.handleTask()
- `src/features/session-tracker/persistence/hierarchy-index.ts` — HierarchyIndex
- `src/features/session-tracker/persistence/child-writer.ts` — child JSON persistence
- `src/shared/session-api.ts` — getSession(), getEventSessionID, walkParentChain()
- `src/hooks/guards/tool-guard-hooks.ts` — existing tool.execute.before pattern

### Live Bug Evidence
- `.hivemind/session-tracker/` — 2 directories, 1 should exist
- `ses_1dec9ffe2ffe93W0qHqu8ywDEQ/` — orphan L1 child directory
- `ses_1ded410beffe5nabRgB0H1m4ft/ses_1dec9ffe2ffe93W0qHqu8ywDEQ.json` — correct child JSON
</canonical_refs>

<specifics>
## Specific Constraints

### Directory Structure Constraint (NON-NEGOTIABLE)
- **Chỉ 1 subdirectory** cho L0 main session
- **Tất cả L1/L2 children** là `.json` files, không bao giờ là directories
- Child `.json` files nằm dưới parent session directory
- Đăng ký vào `session-continuity.json` (hierarchy.children) + `project-continuity.json`
- Child `.json` phải capture: delegation_spawn, chat messages, tool calls

### Timing Constraint
- PreToolUse fires → child chưa tồn tại → phải poll Server API
- `session.created` fires DURING TaskTool.execute → phải có gate trước event này
- PostToolUse fires SAU → dùng để update metadata (không phải primary registration)

### Hook Boundary Constraint
- Hooks SHALL NOT directly write durable state (CQRS per ARCHITECTURE.md §3)
- All writes route through SessionTracker module
- Best-effort: failures in session-tracker never block tool execution
</specifics>

<deferred>
## Deferred Ideas

- Full PreToolUse capture for all tool types (only task tool is critical)
- Non-task tool abort handling
- Real-time Server API polling for session discovery
- WebSocket-based session event streaming
</deferred>

---

*Phase: CP-ST-02-session-tracker-deep-fix-remaining*
*Context gathered: 2026-05-13 via live code audit + gsd-phase-researcher findings*
