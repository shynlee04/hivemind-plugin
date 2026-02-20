# Domain Pitfalls - Phase 2 Cognitive Packer

**Domain:** Context Compilation / State Management
**Researched:** 2026-02-18

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Missing FK Validation
**What goes wrong:** Loading tasks/mems without checking parent references exist
**Why it happens:** Direct file reads bypass validation
**Consequences:** Orphan nodes corrupt XML, crash agent
**Prevention:** Always use `loadGraphTasks()` / `loadGraphMems()` which validate FKs
**Detection:** Check for `orphans.json` file - if growing rapidly, FK validation may be broken

### Pitfall 2: Stale Active Task Mem
**What goes wrong:** Marking mem as stale when it's linked to active task
**Why it happens:** Forgetting to check `origin_task_id` against `activeTaskIds`
**Consequences:** Agent loses critical context mid-task
**Prevention:** `isMemStale()` must check active task linkage FIRST
**Detection:** If mems disappear mid-task, check staleness_stamp vs origin_task_id

### Pitfall 3: Budget Overflow
**What goes wrong:** XML exceeds context window budget
**Why it happens:** Not calculating base XML size before mems
**Consequences:** Context truncated by LLM, losing structure
**Prevention:** Calculate base size, then fit mems in remaining budget
**Detection:** Log final XML size vs budget

## Moderate Pitfalls

### Pitfall 1: Non-Atomic Writes
**What goes wrong:** Process crashes mid-write, corrupting file
**Prevention:** Use temp file + rename pattern from graph-io.ts

### Pitfall 2: XML Injection
**What goes wrong:** Mem content contains `<script>` or similar
**Prevention:** Always escape XML special chars via `escapeXml()`

### Pitfall 3: Staleness Stamp Ignored
**What goes wrong:** Invalid staleness_stamp silently defaults to TTL
**Prevention:** Log warning when staleness_stamp is unparseable

## Minor Pitfalls

### Pitfall 1: Budget Percentage Too High
**What goes wrong:** 15%+ of context window crowds out other context
**Prevention:** Keep budget at 10-12%, make configurable

### Pitfall 2: Missing Debug Logging
**What goes wrong:** Hard to diagnose why mems are filtered
**Prevention:** `pruneContaminated()` logs counts, add similar to other functions

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Adding new mem types | Forgetting to add to Zod enum | Update MemNodeSchema.type |
| Changing FK structure | Orphan detection breaks | Test with orphan-quarantine.test.ts |
| Adjusting budget | Context truncation | Test with full mem load |
| Adding staleness logic | Active task mems filtered | Test isMemStale with active task |

## Test Gaps

| Function | Has Tests | Risk |
|----------|-----------|------|
| packCognitiveState | Partial (integration) | Medium |
| pruneContaminated | No dedicated tests | Medium |
| isMemStale | No dedicated tests | **High** |
| calculateRelevanceScore | No dedicated tests | Medium |
| Graph I/O functions | Yes (orphan-quarantine.test.ts) | Low |
| loadGraphWithFullFKValidation | Partial | Medium |

## Sources

- Code review: src/lib/cognitive-packer.ts (lines 405-444), staleness.ts (lines 61-128)
- Test analysis: tests/auto-hooks-pure.test.ts, tests/orphan-quarantine.test.ts
- PRD review: US-010 to US-014 acceptance criteria
