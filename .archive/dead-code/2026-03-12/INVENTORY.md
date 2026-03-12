# Dead Code Archive Inventory — 2026-03-12

Archived from `src/lib/` during Tranche 1 of TypeScript refactor.

---

## ✅ Archived: `session-memory-classifier.ts` (104 lines)

**Status**: Truly dead — zero consumers across all `src/`, `tests/`, and runtime paths.

**Intended Feature**: Keyword-based classifier that categorizes session artifacts (messages, tool outputs) into 7 lifecycle categories:
- `discovery_brainstorming_discuss`, `research_synthesis`, `codebase_investigation`, `planning`, `implementing`, `debug`, `test_validation_gatekeeping`

Uses keyword matching with fallback to tool-type heuristics. Returns per-artifact classification with confidence scores and category distribution summaries.

**Key Exports**: `SESSION_MEMORY_CATEGORIES`, `SessionMemoryArtifact`, `ClassifiedSessionMemory`, `classifySessionMemoryArtifact()`, `summarizeMemoryCategories()`

**Feature-Superiority Note**: Overlaps with `session-intent-classifier.ts` (similar keyword → score → classify pattern), `hivemind_session_memory` tool, and `SessionMemoryCategory` type in `brain-state.ts`. If revived, merge into `session-intent-classifier.ts` as a sub-function.

---

## ⚠️ Corrected: `tool-activation.ts` & `project-snapshot.ts`

These were initially flagged as dead but have a **live consumer** in `session-governance.ts` (direct imports, not through barrel). Restored to `src/lib/`.

- `tool-activation.ts` → consumed by `session-governance.ts:132` (`getToolActivation()`)
- `project-snapshot.ts` → consumed by `session-governance.ts:31,62,68` (`collectProjectSnapshot()`, `localized()`, `generateProjectBackboneBlock()`)

Both were removed from the barrel (they were only imported directly), which is correct.

---

## Barrel Changes

Removed from `src/lib/index.ts` (Tranche 1):
- `tool-activation.js` — not needed in barrel (only direct-imported by `session-governance.ts`)
- `project-snapshot.js` — not needed in barrel (only direct-imported by `session-governance.ts`)
- `session-memory-classifier.js` — archived (dead code)
