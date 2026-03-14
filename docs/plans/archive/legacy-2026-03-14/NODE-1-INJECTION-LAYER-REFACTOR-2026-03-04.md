---
id: NODE-1-INJECTION-LAYER
type: execution-plan
status: APPROVED-WITH-AMENDMENTS
version: 2.1
date: 2026-03-04
author: hivefiver
approver: human-architect
scope: ".opencode/**, .hivemind/**, src/hooks/**, src/lib/**, src/schemas/**"
---

# NODE 1: INJECTION LAYER REFACTOR — Approved Execution Plan

**Blueprint Version**: v2.1 (v2 + Hardness Amendments)  
**Approval Date**: 2026-03-04  
**Status**: APPROVED — Execution authorized with amendments  

---

## ROOT CAUSE

Two independent auto-injection systems fire on every LLM turn, unaware of each other:

| System | File | Channel |
|--------|------|---------|
| System 1 (Meta/Plugin) | `context-injection.ts` | `output.messages[]` prepend |
| System 2a (Product/Engine) | `session-lifecycle.ts` | `output.system[]` append |
| System 2b (Product/Engine) | `messages-transform.ts` | `output.messages[].parts[]` synthetic |

Both read `hierarchy.json`. Both inject hierarchy data. Different formats. LLM sees contradictory views.

---

## EXECUTION ORDER (Corrected)

```
Fix 3  (Session Isolation)      ← FOUNDATION
  ↓
Fix 1.5 (Schema Detox)          ← CLEAN THE DATA
  ↓
Fix 1  (Dual-Injection Decouple) ← ROUTE THE HOOKS
  ↓
Fix 2  (Relational Staleness)   ← FIX THE SCORING
```

---

## FIX 3: SESSION-SCOPED STATE ISOLATION

### Phase A: Add `getSessionPaths()` to `src/lib/paths.ts`
- **Type**: Additive (no existing code changes)
- **Target**: `src/lib/paths.ts`
- **Action**: Add `SessionScopedPaths` interface and `getSessionPaths(projectRoot, sessionId)` function
- **Gate**: `npx tsc --noEmit` passes

### Phase B: Create Session Directory on `session.created`
- **Target**: `src/hooks/event-handler.ts` (line 180-182)
- **Action**: Create `sessions/active/<session-id>/` directory, write `profile.json`
- **Agent Identity**: Initialize as `agent: "unresolved"` (SDK event payload not trusted)
- **Turn 1 Resolution**: `hivemind_declare` writes true agent identity to profile
- **Gate**: Directory created, profile.json written on session start

### Phase C: Clean-Slate Session State (AMENDED — NO GLOBAL COPY)
- **VETOED**: Do NOT copy global `brain.json` into session directory
- **Action**: Initialize fresh, empty BrainState for each new session
- **Rationale**: Global state is toxic. Isolation must mean clean slate.
- **Gate**: New session starts with zero-state brain, no inherited poison

### Phase D: Switch Hooks to Session-Scoped Reads with Fallback
- **Target**: All hooks reading `brain.json`
- **Action**: Prefer `sessions/active/<id>/brain.json`, fallback to global only if no sessionId
- **Gate**: No cross-session contamination

**PLATFORM RESTART REQUIRED after Fix 3**

---

## FIX 1.5: SCHEMA DETOX

### Step A: Prune Orphan Fields
- **Target**: `src/schemas/brain-state.ts`, mutation methods
- **Kill**: `metrics.ratings`, `memory_governance.classified_counts`, `memory_governance.temporary_exports_*`, `complexity_nudge_shown`, `last_commit_suggestion_turn`
- **Evidence**: All are WRITE-ONLY (never READ by any hook)
- **Gate**: `npx tsc --noEmit` passes

### Step B: Kill Voodoo Metrics
- **Target**: `src/lib/detection.ts` (GovernanceCounters)
- **Kill**: `evidence_pressure`, `ignored`, `out_of_order`, `acknowledged`, `prerequisites_completed`
- **Keep**: `compaction` (deterministic), `drift` (derived from git/hierarchy)
- **Target**: `src/hooks/soft-governance.ts` — stop incrementing dead counters
- **Gate**: `npm test` passes

### Step C: Lobotomize cycle_log (AMENDED)
- **Target**: `src/schemas/brain-state.ts` (CycleLogEntry)
- **VETOED**: Do NOT just cap to 5 entries
- **Action**: Remove `output_excerpt` field entirely
- **Keep**: `{ timestamp, tool, failure_detected, failure_keywords }`
- **Rationale**: Boundary detection needs signals, not stdout text
- **Gate**: `npx tsc --noEmit` passes

### Step D: Enforce Lineage IDs (AMENDED)
- **Target**: `src/schemas/hierarchy.ts`
- **VETOED**: Do NOT use `/^[A-Z]+-\d+$/` regex
- **Action**: Validate "under 64 chars, no spaces, no newlines"
- **Gap Registration**: Missing links → `"GAP:unlinked"` (explicit returning point)
- **Rationale**: Actual IDs include `traj/gx-pack`, `META01-SUB01-ATOMIC01` — rigid regex breaks them
- **Gate**: `npx tsc --noEmit` passes

**PLATFORM RESTART REQUIRED after Fix 1.5**

---

## FIX 1: DUAL-INJECTION DECOUPLING

### Agent Resolution: Session-Scoped Profile (NOT brain.json)
- **Source**: `sessions/active/<session-id>/profile.json`
- **Written**: Once at session creation (deterministic, not LLM-mutable)
- **Agent Field**: Starts as `"unresolved"`, set by `hivemind_declare` on Turn 1

### Guard Logic
- **System 1** (`context-injection.ts`): ONLY fires for `META_BUILDER_AGENTS` (hivefiver)
- **System 2** (`session-lifecycle.ts`, `messages-transform.ts`): ONLY fires for non-meta-builder agents
- **Fail-Open**: If agent is `"unresolved"` or profile missing, BOTH systems fire (backward compat)

### Files Modified
1. `.opencode/plugins/hiveops-governance/hooks/context-injection.ts` — Add agent guard
2. `src/hooks/session-lifecycle.ts` — Add inverse agent guard
3. `src/hooks/messages-transform.ts` — Add inverse agent guard

**PLATFORM RESTART REQUIRED after Fix 1**

---

## FIX 2: RELATIONAL STALENESS

### Target
- `.opencode/skills/gx-context-engine/scripts/signals/gx-signal-hierarchy-freshness.sh`

### Kill Wall-Clock Decay
- **Remove**: `score = 100 - (age_minutes * decay_rate)`
- **Replace with 3 relational signals**:
  - Git Drift (0-40 pts): Commits since cursor's SOT artifact last synced (AMENDED: per-cursor, not global mtime)
  - Row-Chain Continuity (0-35 pts): Are hierarchy IDs valid (under 64 chars, no spaces)
  - Session Continuity (0-25 pts): Does session profile match active hierarchy

### Cross-Platform (AMENDED)
- Do NOT use `stat -f %m` (macOS-only)
- Use existing cross-platform stat wrappers from codebase

---

## HARDNESS AMENDMENTS APPLIED

| # | Original | Amendment | Rationale |
|---|----------|-----------|-----------|
| 1 | Copy global brain.json → session | Clean-slate initialization | Global state is toxic |
| 2 | Cap cycle_log to 5 | Kill output_excerpt, keep telemetry | Text blobs poison context |
| 3 | Global mtime for git drift | Per-cursor-artifact drift | Shared file mtime blinds sessions |
| 4 | Regex /^[A-Z]+-\d+$/ | Under 64 chars, no whitespace | Actual IDs don't match rigid regex |

## ARCHITECTURAL DECISIONS

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Execution: Fix 3→1.5→1→2 | Can't route without isolation, can't isolate with poison |
| D2 | Agent resolution: session-scoped profile.json | Deterministic, not LLM-mutable, session-isolated |
| D3 | Concurrency: Phase A-D with clean slate | No breaking changes, no global copy |
| D4 | Agent identity: "unresolved" until hivemind_declare | Don't trust SDK event payload |
| D5 | runtime-profile.json: migrate to session-scoped | Global profile is architectural paradox |

---

## RISK MATRIX

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Legacy scripts expect global brain.json | Medium | Scripts fail silently | Fix in Node 2; clean slate is correct |
| Agent identity "unresolved" on Turn 1 | Expected | Both systems fire for 1 turn | Acceptable — hivemind_declare resolves on Turn 1 |
| Session directory not created before hooks fire | Low | FileNotFound errors | Create dir synchronously in session.created event |
| Detoxed schema breaks existing tests | Medium | Test failures | Fix tests — they tested toxic behavior |

---

## DEFERRED (Future Nodes)

| Item | Node |
|------|------|
| hivefiver-prime SKILL.md content fix | Node 2 |
| 10 conflict surfaces resolution | Node 2-3 |
| Skills/commands/workflows restructuring | Node 3-4 |
| Stub script completion | Node 5 |
| runtime-profile.json full migration | Node 1 (Fix 3B) |
