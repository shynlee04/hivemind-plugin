---
phase: CP-ST-06-session-tracker-root-cause-rewrite
plan: 03
type: execute
wave: 2
depends_on:
  - CP-ST-06-01
files_modified:
  - src/features/session-tracker/persistence/hierarchy-index.ts
  - src/features/session-tracker/persistence/session-index-writer.ts
  - tests/features/session-tracker/persistence/hierarchy-index.test.ts
  - tests/features/session-tracker/persistence/session-index-writer.test.ts
autonomous: true
requirements:
  - RC-1
  - RC-2
  - GA-2
must_haves:
  truths:
    - "Reverse-order L2 registration resolves the true L0 root."
    - "Nested L2 child status updates preserve tree structure under the root-owned continuity index."
    - "Max depth remains L2 per locked GA-2."
  artifacts:
    - path: "src/features/session-tracker/persistence/hierarchy-index.ts"
      provides: "Root/depth lookup authority"
      max_lines: 500
    - path: "src/features/session-tracker/persistence/session-index-writer.ts"
      provides: "Root-owned recursive hierarchy persistence"
      max_lines: 500
  key_links:
    - from: "HierarchyIndex.registerChild"
      to: "HierarchyIndex.getRootMain"
      via: "late parent/root repair or chain walk"
      pattern: "getRootMain"
    - from: "SessionIndexWriter.updateChildStatus"
      to: "ChildHierarchyEntry.children"
      via: "recursive lookup/update"
      pattern: "children"
---

<objective>
Fix hierarchy root resolution and nested status persistence without expanding beyond L2.

Purpose: RC-1 and RC-2 are pure hierarchy/persistence root causes. They can run in parallel with router extraction because they touch disjoint files.

Output: `HierarchyIndex` resolves reverse-order root main correctly; `SessionIndexWriter` updates nested child status recursively under the root-owned tree.
</objective>

<execution_context>
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/hivemind-plugin-private/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/SPEC.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-RESEARCH.md
@.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-PATTERNS.md
@src/features/session-tracker/persistence/hierarchy-index.ts
@src/features/session-tracker/persistence/session-index-writer.ts
@src/features/session-tracker/types.ts
@tests/features/session-tracker/persistence/hierarchy-index.test.ts
@tests/features/session-tracker/persistence/session-index-writer.test.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Fix reverse-order root main resolution with L2 cap preserved</name>
  <files>src/features/session-tracker/persistence/hierarchy-index.ts, tests/features/session-tracker/persistence/hierarchy-index.test.ts</files>
  <read_first>
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-CONTEXT.md
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/SPEC.md
    - src/features/session-tracker/persistence/hierarchy-index.ts
    - tests/features/session-tracker/persistence/hierarchy-index.test.ts
  </read_first>
  <behavior>
    - Registering L2 before L1 before L0 still yields `getRootMain(L2) === L0` after all relationships are known.
    - Depth support remains L0/L1/L2 only per GA-2; do not implement L3 support from stale SPEC line.
  </behavior>
  <action>Update `HierarchyIndex` so late parent/root registration repairs descendant root mappings or computes root by walking known parent links. Keep depth semantics locked to L2. Add/repair tests to assert GA-2 explicitly so future implementers cannot expand to L3 by mistake.</action>
  <acceptance_criteria>
    - `npx vitest run tests/features/session-tracker/persistence/hierarchy-index.test.ts` passes.
    - Test expectations mention L2 max or equivalent GA-2 wording.
    - `grep -n 'max depth\|L2\|depth' tests/features/session-tracker/persistence/hierarchy-index.test.ts` returns the locked depth assertion.
  </acceptance_criteria>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/persistence/hierarchy-index.test.ts</automated>
  </verify>
  <done>Reverse-order registration resolves root main and depth behavior honors GA-2.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Make child status update recursive and root-owned</name>
  <files>src/features/session-tracker/persistence/session-index-writer.ts, tests/features/session-tracker/persistence/session-index-writer.test.ts</files>
  <read_first>
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/SPEC.md
    - .planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-PATTERNS.md
    - src/features/session-tracker/persistence/session-index-writer.ts
    - src/features/session-tracker/types.ts
    - tests/features/session-tracker/persistence/session-index-writer.test.ts
  </read_first>
  <behavior>
    - `updateChildStatus(rootMain, l2Child, status)` finds `l2Child` inside `l1.children` and updates in place.
    - The full `session-continuity.json` tree remains nested after status update.
  </behavior>
  <action>Replace top-level-only child status lookup with a recursive helper over `ChildHierarchyEntry.children`. If a child is not found, surface/log a `[Harness]` warning or error according to existing writer conventions; do not silently flatten or create a top-level child.</action>
  <acceptance_criteria>
    - `npx vitest run tests/features/session-tracker/persistence/session-index-writer.test.ts` passes.
    - `grep -n 'function .*recursive\|updateNested\|find.*Child' src/features/session-tracker/persistence/session-index-writer.ts` returns the recursive helper or equivalent.
    - No code path writes `index.hierarchy.children[childSessionID] =` during status update for nested lookup.
  </acceptance_criteria>
  <verify>
    <automated>npx vitest run tests/features/session-tracker/persistence/session-index-writer.test.ts</automated>
  </verify>
  <done>Nested status updates preserve root-owned hierarchy tree.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| in-memory hierarchy → persisted continuity | Inconsistent root/depth mapping can write status to wrong place. |
| stale SPEC L3 wording → implementation | CONTEXT GA-2 supersedes SPEC L3 wording. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-CP-ST-06-05 | Tampering | HierarchyIndex | mitigate | Repair/walk parent links so L2 records cannot be orphaned under wrong root. |
| T-CP-ST-06-06 | Tampering | SessionIndexWriter | mitigate | Recursive nested update; no top-level flattening for L2. |
</threat_model>

<verification>
`npx vitest run tests/features/session-tracker/persistence/hierarchy-index.test.ts tests/features/session-tracker/persistence/session-index-writer.test.ts` and `npm run typecheck`.
</verification>

<success_criteria>
- RC-1 and RC-2 tests pass.
- GA-2 max depth remains L2.
- No module exceeds 500 LOC.
</success_criteria>

<source_audit>
GOAL: covers root cause 3-tier hierarchy and upper-level idle nested status preservation.
REQ: RC-1, RC-2, GA-2 covered.
RESEARCH: recursive tree and reverse-order root repair guidance covered.
CONTEXT: GA-2 honored; no L3 expansion planned.
</source_audit>

<output>
After completion, create `.planning/phases/CP-ST-06-session-tracker-root-cause-rewrite/CP-ST-06-03-SUMMARY.md`.
</output>
