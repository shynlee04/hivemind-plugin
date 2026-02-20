# Phase 1 Validation Report: Graph Schemas & Dumb Tool Diet

**Validated:** 2026-02-18
**Status:** PARTIAL

---

## Executive Summary

Phase 1 claims "Graph Schemas & Dumb Tool Diet" are **partially implemented**. The graph schemas exist and are well-structured with Zod 4.x, but the FK constraint validation functions are **not wired up**. The "dumb tool diet" (≤100 lines) is **violated** by 5 of 6 tools. All 126 tests pass and TypeScript compiles clean.

---

## File Check

| File | Exists | Lines | Viable |
|------|--------|-------|--------|
| `src/schemas/graph-nodes.ts` | YES | 112 | YES |
| `src/schemas/graph-state.ts` | YES | 34 | YES |
| `src/lib/paths.ts` | YES | 466 | YES |
| `src/lib/compaction-engine.ts` | YES | 446 | YES |
| `src/lib/session-engine.ts` | YES | 579 | YES |
| `src/lib/inspect-engine.ts` | YES | 262 | YES |
| `src/lib/brownfield-scan.ts` | YES | 398 | YES |
| `src/lib/session-split.ts` | YES | 208 | YES |
| `src/lib/tool-response.ts` | YES | 37 | YES |

**All 9 files exist and are functional.**

---

## Implementation Quality

### Zod Schemas: ✅ WORKING
- Zod version: **4.1.8** (claimed 4.x)
- UUID validation: `z.string().uuid()` used throughout
- DateTime validation: `z.string().datetime()` used throughout
- Proper type inference: `z.infer<typeof Schema>` pattern used

### FK Constraints: ⚠️ DEFINED BUT NOT WIRED
```typescript
// Functions exist in graph-nodes.ts:
export function validateParentExists(childId, parentId, parentIds): boolean
export function validateOrphanFree(nodes, allParentIds): { valid, orphans }
```

**Problem:** These functions are **never called** anywhere in the codebase. grep shows zero usage outside their definition file.

**Impact:** Orphan nodes can be created. FK integrity is NOT enforced.

### Tool Diet: ❌ VIOLATED (5 of 6 tools exceed 100 lines)

| Tool | Lines | Status |
|------|-------|--------|
| hivemind-inspect.ts | 55 | ✅ PASS |
| hivemind-anchor.ts | 139 | ❌ FAIL (+39) |
| hivemind-hierarchy.ts | 204 | ❌ FAIL (+104) |
| hivemind-session.ts | 232 | ❌ FAIL (+132) |
| hivemind-cycle.ts | 210 | ❌ FAIL (+110) |
| hivemind-memory.ts | 368 | ❌ FAIL (+268) |

**Root Cause:** Tools contain business logic that should be in libraries:
- `hivemind-session.ts`: Contains 82-line `syncTrajectoryToGraph()` helper (lines 19-101)
- `hivemind-memory.ts`: Contains inline shelf validation and deduplication logic

### Tool Response Helper: ✅ IMPLEMENTED
- `toSuccessOutput()` and `toErrorOutput()` used consistently
- All tools return JSON with `status` field
- Entity-creating tools include `entity_id` for FK chaining

---

## Critical Issues

### 1. FK Validation Not Enforced (HIGH)
The `validateParentExists` and `validateOrphanFree` functions exist but are never called. This means:
- Orphan nodes can be silently created
- Graph integrity cannot be guaranteed
- Phase 2 (Graph Write Layer) will need to wire these up

**Fix Required:** Wire FK validation into graph-io.ts write operations.

### 2. Tool Diet Violation (MEDIUM)
5 of 6 tools exceed 100 lines. This violates the architectural principle of "tools as thin wrappers."

**Fix Required:** Extract business logic from tools into libraries:
- `syncTrajectoryToGraph` → `src/lib/graph-sync.ts`
- Memory deduplication → already in `src/lib/mems.ts` (refactor tools to use it)

---

## 2026 Viability

### Zod 4.x: ✅ VIABLE
- Zod 4.1.8 is current (as of Feb 2026)
- Schema patterns used are stable and well-documented
- UUID and datetime validators work as expected

### Graph Schema Design: ✅ VIABLE
- Hierarchical node structure (Trajectory → Plan → Phase → Task) is sound
- UUID-based FKs are standard practice
- Zod validation is performant for file-based storage

### Tool Architecture: ⚠️ NEEDS REFINEMENT
- OpenCode plugin SDK pattern is viable
- Tool definitions are clean (schema + execute)
- Business logic leakage is addressable

---

## Test Results

```
✅ All 126 tests pass
✅ TypeScript compiles clean (npx tsc --noEmit)
✅ Architecture boundary clean (src/lib/ has zero @opencode-ai imports)
```

---

## User Story Status

| User Story | Status | Evidence |
|------------|--------|----------|
| US-001: Graph node Zod schemas | ✅ DONE | 5 node schemas defined with UUID FKs |
| US-002: Graph state aggregates | ✅ DONE | 4 state schemas defined |
| US-003: Paths for graph directory | ✅ DONE | graphDir, graphTrajectory, etc. in paths.ts |
| US-004: Compaction engine extraction | ✅ DONE | 446-line library, clean separation |
| US-005: Session engine extraction | ✅ DONE | 579-line library, clean separation |
| US-006: Inspect engine extraction | ✅ DONE | 262-line library, clean separation |
| US-007: Brownfield scan extraction | ✅ DONE | 398-line library, clean separation |
| US-008: Session split extraction | ✅ DONE | 208-line library, clean separation |
| US-009: Tool response helper | ✅ DONE | 37-line helper, used in all tools |

---

## Recommendation

**KEEP with fixes:**

1. **Wire FK validation** (Phase 2 prerequisite)
   - Add `validateParentExists` call in graph-io.ts write operations
   - Add `validateOrphanFree` check on graph state load

2. **Refactor tool diet** (Technical debt)
   - Move `syncTrajectoryToGraph` to `src/lib/graph-sync.ts`
   - Refactor hivemind-memory.ts to use library functions

3. **Add tests for FK validation**
   - Test orphan detection
   - Test parent existence validation
   - Test FK constraint enforcement on write

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Stack | HIGH | Zod 4.1.8 verified, schemas tested |
| FK Schemas | HIGH | Schemas defined correctly |
| FK Enforcement | LOW | Functions exist but not wired |
| Tool Diet | LOW | 5/6 tools violate 100-line limit |
| Tests | HIGH | 126/126 passing |

---

## Files Analyzed

- `src/schemas/graph-nodes.ts` (112 lines)
- `src/schemas/graph-state.ts` (34 lines)
- `src/lib/paths.ts` (466 lines)
- `src/lib/compaction-engine.ts` (446 lines)
- `src/lib/session-engine.ts` (579 lines)
- `src/lib/inspect-engine.ts` (262 lines)
- `src/lib/brownfield-scan.ts` (398 lines)
- `src/lib/session-split.ts` (208 lines)
- `src/lib/tool-response.ts` (37 lines)
- `src/tools/hivemind-session.ts` (232 lines)
- `src/tools/hivemind-inspect.ts` (55 lines)
- `src/tools/hivemind-memory.ts` (368 lines)
- `src/tools/hivemind-anchor.ts` (139 lines)
- `src/tools/hivemind-hierarchy.ts` (204 lines)
- `src/tools/hivemind-cycle.ts` (210 lines)
