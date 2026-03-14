# PRD v2: HiveMind v3.0 — Relational Cognitive Engine

## Document Metadata

**Version:** 2.0
**Date:** 2026-02-18
**Status:** AUDITED & CORRECTED
**Sources:**
- Original PRD-CONSOLIDATED-2026-02-18.md
- Architecture Audit (Tools, Libraries, Hooks, Schemas)
- Gemini Autonomous System Critique
- User Corrections (LOC limits, 80% split concept)

---

## Corrections Applied

### 1. LOC Limit (Corrected)
| Original | Corrected |
|----------|-----------|
| ≤100 lines HARD | ~300 lines STRATEGIC |

**Rationale:** 100 LOC was an artificial constraint. Real goal is "dumb wrapper" pattern - tools should delegate business logic to libs. Line count is secondary to architectural purity.

### 2. 80% Split Concept (Corrected)
| Original | Corrected |
|----------|-----------|
| Split AT 80% capacity | DON'T split WHEN >= 80% |

**Rationale:** 80% is a **DEFENSIVE GUARD** to avoid overlapping with innate compaction (crash avoidance). Splitting at 80% would create race conditions with the system's native compaction.

**Code Evidence:** `src/lib/session-boundary.ts:44`:
```typescript
// V3.0: context >= 80% is DEFENSIVE (don't split when near capacity)
```

---

## Overview

Transform HiveMind from a passive "Flat-File Markdown Logger" into an active **Relational Cognitive Engine** powered by CQRS, Graph-RAG, the Actor Model, and a strict architectural taxonomy.

## Goals

| Goal | Description | Status |
|------|-------------|--------|
| **G1** | Eliminate dead code by wiring hivemind-*.ts tools | ✅ DONE (6 canonical tools wired) |
| **G2** | Implement relational graph structure with UUID FKs | ✅ DONE (schemas implemented) |
| **G3** | Build cognitive-packer for deterministic XML | ✅ DONE (501 lines) |
| **G4** | Enforce CQRS: Tools = Write, Hooks = Read | ⚠️ PARTIAL (10 violations in hooks) |
| **G5** | Enable session swarms via Actor Model | ⚠️ PARTIAL (headless works, auto-context missing) |
| **G6** | All tests pass | 🔴 BLOCKED (needs npm test run) |

---

## Architecture Audit Summary

### Tools Layer (Compliance: 83% after correction)

| Tool | Lines | Strategic Limit | Pattern Compliance |
|------|-------|-----------------|-------------------|
| hivemind-session.ts | 232 | ~300 ✅ | ⚠️ Has sync logic to extract |
| hivemind-inspect.ts | 55 | ~300 ✅ | ✅ Pure dumb wrapper |
| hivemind-memory.ts | 369 | ~300 ⚠️ | ⚠️ Has search/filter logic |
| hivemind-anchor.ts | 140 | ~300 ✅ | ⚠️ Has handler logic |
| hivemind-hierarchy.ts | 205 | ~300 ✅ | ⚠️ Has tree traversal |
| hivemind-cycle.ts | 211 | ~300 ✅ | ⚠️ Has file operations |

**Refinement Needed:** Extract business logic to libs, not strict line reduction.

### Libraries Layer (Compliance: 95%)

| File | Lines | Purity | Issue |
|------|-------|--------|-------|
| cognitive-packer.ts | 501 | ✅ Pure | None |
| gatekeeper.ts | 147 | ✅ Pure | None |
| graph-io.ts | 651 | ✅ Pure | None |
| session-engine.ts | 578 | ✅ Pure | None |
| compaction-engine.ts | 445 | ✅ Pure | None |
| governance-instruction.ts | 89 | ❌ Prompt | Move to hooks/ |
| session_coherence.ts | 389 | ⚠️ Mixed | Prompt assembly in lib |

### Hooks Layer (Compliance: 42%)

**CRITICAL:** 10 CQRS violations found - hooks calling `stateManager.save()` directly.

| File | Violations | Severity |
|------|------------|----------|
| session-lifecycle.ts | 1 | 🔴 Write in hook |
| messages-transform.ts | 2 | 🔴 Write in hook |
| tool-gate.ts | 2 | 🔴 Write in hook |
| soft-governance.ts | 2 | 🔴 Write in hook |
| event-handler.ts | 2 | 🔴 Write in hook |
| compaction.ts | 1 | 🔴 Write in hook |

### Schemas Layer (Compliance: 100%)

| Schema | Status | FK Constraints |
|--------|--------|----------------|
| graph-nodes.ts | ✅ Complete | All 5 nodes with UUID + FKs |
| graph-state.ts | ✅ Complete | All 4 aggregates with version |
| brain-state.ts | ✅ Complete | - |
| hierarchy.ts | ✅ Complete | - |
| config.ts | ✅ Complete | - |
| events.ts | ✅ Complete | - |

**Minor Issue:** `src/schemas/index.ts` missing barrel export for `graph-nodes.js`.

---

## Gemini Autonomous Findings vs Implementation

| Finding | PRD | Code | Gap |
|---------|-----|------|-----|
| **US-016: Hard Gatekeeper** | ✅ Implemented | ✅ Implemented | Minor - needs blocking logic |
| **US-051: Auto-Context State** | 📋 Planned | ❌ Missing | **MAJOR** |
| **US-052: Linter Agent** | 📋 Planned | ❌ Missing | **MAJOR** |
| **Budget Issue** | ✅ Claimed fixed | ⚠️ Partial | Legacy 2000-char limits remain |
| **Concurrency/File Locking** | ✅ Implemented | ✅ Implemented | None |

---

## User Stories (Prioritized by Gap Impact)

### Priority 1: CQRS Enforcement (CRITICAL)

---

### US-053: Eliminate write operations from hooks [NEW]
**Description:** As an architect, I want all hooks to be read-only so CQRS is enforced.

**Current Violations:**
- `session-lifecycle.ts:75` - `stateManager.save(state)`
- `messages-transform.ts:286,345` - `stateManager.save(updatedState)`
- `tool-gate.ts:220,259` - `stateManager.save(state)`
- `soft-governance.ts:259,464` - `stateManager.save(state)`
- `event-handler.ts:83,97` - `stateManager.save(nextState)`
- `compaction.ts:73` - `stateManager.save(state)`

**Acceptance Criteria:**
- [ ] Create `src/lib/state-mutation-queue.ts` with pending mutations buffer
- [ ] Hooks push mutations to queue instead of writing directly
- [ ] Tools flush queue on write operations
- [ ] All `stateManager.save()` calls removed from hooks/
- [ ] Tests verify no write imports in hooks

---

### US-054: Extract business logic from tools [NEW]
**Description:** As an architect, I want tools to follow "dumb wrapper" pattern.

**Acceptance Criteria:**
- [ ] Extract `syncTrajectoryToGraph()` from hivemind-session.ts → `lib/trajectory-sync.ts`
- [ ] Extract `searchGraphMems()` from hivemind-memory.ts → `lib/mem-operations.ts`
- [ ] Extract tree traversal from hivemind-hierarchy.ts → `lib/hierarchy-tree.ts` (merge)
- [ ] Each tool imports and calls lib functions
- [ ] Tools contain only: Zod schema → lib call → output format

---

### Priority 2: Missing Features (HIGH)

---

### US-051: Auto-Context State [FROM PHASE 8 - PROMOTED]
**Description:** As the system, I want to automatically track session focus and auto-wire foreign keys.

**Why Promoted:** Gemini correctly identified "Hallucinated FK Risk" - agents WILL use wrong UUIDs without this.

**Acceptance Criteria:**
- [ ] Create `src/lib/auto-context.ts`
- [ ] `trackFocusState(sessionId, action)` function
- [ ] Auto-wire `origin_task_id` from active focus when creating mems
- [ ] Auto-wire `parent_phase_id` from active phase when creating tasks
- [ ] Focus drift detection: warn when file changes unrelated to active task
- [ ] Configurable via `config.json: autoContext.enabled`

---

### US-052: Linter Agent [FROM PHASE 8 - PROMOTED]
**Description:** As the system, I want scheduled graph integrity validation.

**Why Promoted:** Graph corruption risk grows with usage - need janitor ASAP.

**Acceptance Criteria:**
- [ ] Create `src/lib/linter-agent.ts`
- [ ] `runLinterCheck(directory)` function
- [ ] Validation checks:
  - Orphan detection (nodes with invalid FK references)
  - Staleness violations (mems past `staleness_stamp` not linked)
  - Duplicates (same content hash)
  - Schema violations
- [ ] Reports saved to `sessions/lint-YYYY-MM-DD-HHMMSS.json`
- [ ] Non-blocking: runs in background, never blocks user operations

---

### Priority 3: Budget Consistency (MEDIUM)

---

### US-055: Remove legacy 2000-char budget limits [NEW]
**Description:** As the system, I want consistent budget across all code paths.

**Current Legacy Limits:**
- `src/lib/session_coherence.ts:33` - `budget: 2000`
- `src/hooks/session_coherence/types.ts:98` - `budget: 2000`
- `src/lib/compaction-engine.ts:164` - `const budget = 1800`
- `src/schemas/config.ts:246` - `max_response_tokens: 2000`

**Acceptance Criteria:**
- [ ] All budget values use dynamic calculation (12% of 128k = 15,360 chars)
- [ ] Single source of truth in `config.ts` or cognitive-packer
- [ ] No hardcoded budget values in lib/ or hooks/

---

### US-056: Move governance prompts from lib to hooks [NEW]
**Description:** As an architect, I want LLM prompts out of the lib layer.

**Files to Move:**
- `src/lib/governance-instruction.ts` → `src/hooks/governance-instruction.ts`
- Extract prompt assembly from `src/lib/session_coherence.ts`

**Acceptance Criteria:**
- [ ] No `HIVE_MASTER_GOVERNANCE_INSTRUCTION` string in lib/
- [ ] Prompt assembly functions in hooks/ or dedicated prompts/ directory
- [ ] Lib layer contains only data transformation

---

### Priority 4: Schemas Cleanup (LOW)

---

### US-057: Fix schema barrel export [NEW]
**Description:** As a developer, I want all schemas exported from index.ts.

**Acceptance Criteria:**
- [ ] Add `export * from "./graph-nodes.js"` to `src/schemas/index.ts`
- [ ] Add `export * from "./manifest.js"` to `src/schemas/index.ts`

---

### US-020: Session Boundary Guard [CORRECTED]
**Description:** As the system, I want defensive guards to prevent session split during innate compaction.

**Acceptance Criteria:**
- [ ] Guard: DON'T split when context >= 80% (crash avoidance)
- [ ] Guard: DON'T split when active delegations exist
- [ ] Guard: DON'T split during low user turns (< 3 turns)
- [ ] Split triggered at appropriate boundary (NOT 80%)
- [ ] Tests verify defensive guards

---

## Functional Requirements (Updated)

| ID | Requirement | Status |
|----|-------------|--------|
| FR-1 | All graph nodes MUST have UUID `id` field | ✅ DONE |
| FR-2 | TaskNode MUST have `parent_phase_id` FK (non-nullable) | ✅ DONE |
| FR-3 | MemNode MUST have `origin_task_id` FK (nullable) | ✅ DONE |
| FR-4 | Tools MUST be "dumb wrappers" (delegate to libs) | ⚠️ PARTIAL |
| FR-5 | Hooks MUST be read-only (CQRS) | ❌ VIOLATED |
| FR-6 | Cognitive Packer MUST output dense XML with budget cap | ✅ DONE |
| FR-7 | Migration MUST be non-destructive | ✅ DONE |
| FR-8 | Session boundary MUST be defensive (not proactive) | ⚠️ NEEDS FIX |
| FR-9 | All 6 canonical tools MUST be wired | ✅ DONE |
| FR-10 | Auto-Context MUST be opt-in | ❌ NOT IMPLEMENTED |
| FR-11 | Linter Agent MUST be non-blocking | ❌ NOT IMPLEMENTED |
| FR-12 | File locking MUST be used for concurrent writes | ✅ DONE |

---

## Technical Considerations (Updated)

- **Performance:** Cognitive packer completes in <10ms ✅
- **Memory:** Graph files stay under 1MB each ✅
- **SDK Version:** Requires OpenCode SDK v2026.x for `noReply` support
- **Concurrency:** File locking via `proper-lockfile` ✅
- **Budget:** Dynamic 12% of context window (15,360 chars for 128k) ⚠️ legacy cleanup needed
- **Session Split:** Defensive guard at 80%, NOT trigger

---

## Success Metrics (Updated)

| Metric | Target | Current |
|--------|--------|---------|
| CQRS Compliance | 100% | 42% |
| Tools Pattern Compliance | 100% | 83% |
| Schemas Complete | 100% | 100% ✅ |
| Cognitive Packer Runtime | <10ms | ✅ Done |
| Auto-Context Accuracy | >80% | ❌ Not implemented |
| Linter False Positives | <5% | ❌ Not implemented |
| Budget Consistency | 100% | ⚠️ Legacy limits remain |

---

## Phase Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Graph Schemas | ✅ COMPLETE | US-001 to US-009 done |
| Phase 2: Cognitive Packer | ✅ COMPLETE | US-010 to US-014 done |
| Phase 3: SDK Hook Injection | ⚠️ PARTIAL | CQRS violations found |
| Phase 4: Graph Migration | ✅ COMPLETE | US-018, US-019 done |
| Phase 5: Tool Consolidation | ✅ COMPLETE | US-023 to US-025 done |
| Phase 6: Testing | 🔴 BLOCKED | Needs npm test run |
| Phase 7: OpenTUI Dashboard | 📋 PLANNED | US-032 to US-050 |
| Phase 8: Advanced Automation | 🔴 PRIORITY | US-051, US-052 promoted |

---

## Immediate Actions

1. **Run `npm test`** to verify current state
2. **US-053**: Eliminate CQRS violations in hooks (CRITICAL)
3. **US-051**: Implement Auto-Context State (HIGH)
4. **US-052**: Implement Linter Agent (HIGH)
5. **US-055**: Remove legacy budget limits (MEDIUM)

---

## Appendix: Deprecated/Stale Documents

The following documents should be archived (not deleted) as they contain outdated concepts:

| Document | Issue | Action |
|----------|-------|--------|
| `prd-hivemind-v3-relational-engine-2026-02-16.md` | Superseded by v2 | Archive |
| `prd-hivemind-v3-roadmap-2026-02-18.md` | Superseded by v2 | Archive |
| `file-level-execution-blueprint-2026-02-16.md` | Incorporated into v2 | Archive |
| `2026-02-17-phase-6-7-master-plan.md` | May be stale | Review |
| `PHASE-B-STATUS-2026-02-15.md` | Stale | Archive |
| `PHASE-A-B-AUDIT-2026-02-15.md` | Stale | Archive |
| `2026-02-15-phase-b-implementation-plan.md` | Stale | Archive |

---

*PRD v2 Generated: 2026-02-18*
*Architecture Audit Sources: Tools, Libraries, Hooks, Schemas, Gemini Findings*
