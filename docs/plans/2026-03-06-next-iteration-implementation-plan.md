# Next Iteration Architecture Consolidation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate the next live HiveMind architecture issues without re-opening already-fixed budget and flush work.

**Architecture:** This wave is a narrow refactor program, not a rewrite. It starts by turning prompt-surface duplication and delegation continuity gaps into explicit contracts and tests, then incrementally migrates ownership toward one prompt-construction model and one continuity model.

**Tech Stack:** TypeScript, OpenCode plugin hooks, Zod schemas, existing HiveMind tools/hooks/tests.

---

## Preconditions

- Treat the current repository as the only source of truth.
- Use these documents together:
  - `docs/plans/2026-03-06-external-findings-truth-matrix.md`
  - `docs/plans/2026-03-06-live-architecture-themes.md`
  - `docs/plans/2026-03-06-deepwiki-unresolved-query-packet.md`
  - `docs/plans/2026-03-06-devin-repo-mapping-query-packet.md`
- Do not reopen already-fixed budget hardening or compaction-budget work as unresolved.
- Do not implement broad architecture replacement.

## Phase 0: Freeze the Reconciled Baseline

### Task 0.1: Lock the current truth matrix into planning assumptions

**Files:**
- Read: `docs/plans/2026-03-06-external-findings-truth-matrix.md`
- Read: `docs/plans/2026-03-06-live-architecture-themes.md`

**Step 1: Re-read the matrix before touching code**

Confirm the implementation session is using only:
- `confirmed-current`
- `needs-research`
- `needs-design-decision`

Ignore:
- `confirmed-stale`

**Step 2: Build a working checklist from the live themes**

Checklist:
- injection ownership
- state authority
- traversal contract
- delegation continuity
- research/clarification workflow
- child-session minimization

**Step 3: Verify baseline**

Run:
```bash
npx tsc --noEmit
npm test
```

Expected:
- both pass before runtime changes begin

---

## Phase 1: Convert Prompt Ownership Into Testable Contracts

### Task 1.1: Add a prompt-surface ownership contract test

**Files:**
- Create: `tests/prompt-surface-ownership.test.ts`
- Read: `src/hooks/session-lifecycle.ts`
- Read: `src/hooks/messages-transform.ts`
- Read: `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- Read: `src/lib/cognitive-packer.ts`

**Step 1: Write failing tests for current ownership assumptions**

Cover:
- status lines appear in `system[]`
- cognitive packer output appears in message prepend
- anchor header appears separately from cognitive packer output
- plugin fallback behavior is not treated as the main canonical surface

**Step 2: Run targeted test and verify red**

Run:
```bash
npx tsx --test tests/prompt-surface-ownership.test.ts
```

Expected:
- initial failures capture duplicate-surface behavior clearly

**Step 3: Define desired ownership in the test file**

Desired target assertions:
- `system[]` owns governance and stable next-step state only
- `messages[] prepend` owns canonical structured context
- `messages[] append` owns checklist and short end-of-turn guidance

### Task 1.2: Add child-session injection minimization tests

**Files:**
- Create: `tests/child-session-injection-minimization.test.ts`
- Read: `src/lib/session-role.ts`
- Read: `src/lib/session-split.ts`
- Read: `src/hooks/session-lifecycle.ts`
- Read: `src/hooks/messages-transform.ts`

**Step 1: Write tests for child-session behavior**

Cover:
- child session can be detected from lineage or role context
- child session should not receive the same full prompt payload as a main session
- compaction continuation does not lose the minimum required context

**Step 2: Run the test and verify red**

Run:
```bash
npx tsx --test tests/child-session-injection-minimization.test.ts
```

Expected:
- failures show where current injection is still too broad

---

## Phase 2: Normalize Delegation Continuity

### Task 2.1: Extend cycle-log continuity to retain resume identifiers

**Files:**
- Modify: `src/schemas/brain-state.ts`
- Modify: `src/hooks/soft-governance.ts`
- Test: `tests/delegation-continuity-envelope.test.ts`

**Step 1: Write the failing continuity test**

Test should assert:
- task tool output containing `task_id` results in persisted structured continuity metadata
- stored continuity data survives subsequent tool calls
- existing cycle-log behavior remains compatible

**Step 2: Run test and verify red**

Run:
```bash
npx tsx --test tests/delegation-continuity-envelope.test.ts
```

Expected:
- fails because current `CycleLogEntry` lacks `task_id`

**Step 3: Add minimal schema support**

Add to `CycleLogEntry`:
- `task_id?: string`
- optional normalized continuity envelope fields only if the test needs them

Do not add speculative fields yet.

**Step 4: Capture `task_id` in `soft-governance.ts`**

Implement minimal parsing from task output to cycle-log entry.

**Step 5: Re-run targeted test**

Run:
```bash
npx tsx --test tests/delegation-continuity-envelope.test.ts
```

Expected:
- pass

### Task 2.2: Define a normalized delegation result envelope

**Files:**
- Create: `src/schemas/delegation-envelope.ts`
- Modify: `src/tools/hivemind-cycle.ts`
- Test: `tests/delegation-envelope-schema.test.ts`

**Step 1: Write failing schema tests**

Cover:
- accepted statuses
- required workflow fields
- hierarchy refs shape
- empty arrays default safely

**Step 2: Implement the schema**

Create only the schema and type in this phase.

**Step 3: Use it in cycle exports where practical**

Do not force all tools to emit the envelope yet. Limit this phase to:
- schema definition
- export/capture readiness

---

## Phase 3: Add `hivemind_inspect.traverse`

### Task 3.1: Create the traversal contract tests

**Files:**
- Create: `tests/inspect-traverse.test.ts`
- Read: `src/tools/hivemind-inspect.ts`
- Read: `src/lib/inspect-engine.ts`
- Read: `src/lib/hierarchy-tree.ts`
- Read: `src/schemas/graph-nodes.ts`

**Step 1: Write failing tests**

Cover:
- `direction: "up"` returns ancestor chain
- `direction: "down"` returns children
- `direction: "related"` can include mems/anchors when requested
- invalid node ids fail predictably
- depth limits are respected

**Step 2: Run test and verify red**

Run:
```bash
npx tsx --test tests/inspect-traverse.test.ts
```

Expected:
- fails because `traverse` action is not implemented

### Task 3.2: Implement the minimal first version

**Files:**
- Modify: `src/tools/hivemind-inspect.ts`
- Modify: `src/lib/inspect-engine.ts`

**Step 1: Add the new tool action**

Add:
- `traverse` to the action enum
- params:
  - `node_id`
  - `direction`
  - `depth`
  - `include_mems`
  - `include_anchors`

**Step 2: Implement only the narrow first version**

Support:
- tree-based ancestor and child traversal first
- related mems/anchors only when explicitly requested

Do not generalize beyond current tests.

**Step 3: Re-run targeted tests**

Run:
```bash
npx tsx --test tests/inspect-traverse.test.ts
```

Expected:
- pass

---

## Phase 4: De-duplicate Injection Surfaces

### Task 4.1: Remove redundant anchor header ownership

**Files:**
- Modify: `src/hooks/messages-transform.ts`
- Test: `tests/messages-transform.test.ts`
- Test: `tests/prompt-surface-ownership.test.ts`

**Step 1: Write or update tests**

Desired behavior:
- structured cognitive packer output remains
- separate anchor header is removed if its data is already covered by canonical structured context

**Step 2: Run targeted tests and verify red**

Run:
```bash
npx tsx --test tests/messages-transform.test.ts
npx tsx --test tests/prompt-surface-ownership.test.ts
```

**Step 3: Remove `buildAnchorContext()` usage if tests justify it**

Prefer removing the call site before deleting helper code.

**Step 4: Re-run targeted tests**

Expected:
- pass with no regression in cognitive context coverage

### Task 4.2: Reduce duplicated status ownership in `session-lifecycle.ts`

**Files:**
- Modify: `src/hooks/session-lifecycle.ts`
- Test: `tests/session-lifecycle-boundary.test.ts`
- Test: `tests/prompt-surface-ownership.test.ts`

**Step 1: Write or update tests**

Desired behavior:
- `system[]` retains governance mode, warnings, and stable next-step guidance
- duplicated hierarchy/status phrasing is reduced where cognitive packer already provides the richer form

**Step 2: Run targeted tests and verify red**

Run:
```bash
npx tsx --test tests/session-lifecycle-boundary.test.ts
npx tsx --test tests/prompt-surface-ownership.test.ts
```

**Step 3: Narrow `buildStatusBlock()` if tests support it**

Keep:
- stable session mode line if still needed
- next-step hint if still the best compact summary

Remove only what the tests prove is redundant.

---

## Phase 5: Role-Aware Injection Policy

### Task 5.1: Introduce a turn injection ownership helper

**Files:**
- Create: `src/lib/turn-injection.ts`
- Modify: `src/hooks/session-lifecycle.ts`
- Modify: `src/hooks/messages-transform.ts`
- Test: `tests/prompt-surface-ownership.test.ts`
- Test: `tests/child-session-injection-minimization.test.ts`

**Step 1: Write a failing integration test for the new helper contract**

Target shape:
```ts
interface TurnInjectionBundle {
  system: string[]
  messagePrepend: string[]
  messageAppend: string[]
  compactionOnly?: string[]
}
```

**Step 2: Implement the helper with current behavior first**

Do not change semantics yet. Only centralize ownership.

**Step 3: Refactor both hooks to call the helper**

Keep the hooks thin and compatibility-safe.

**Step 4: Add child-session minimization branch**

Use the least risky role/lineage signal available from current repo context.

---

## Phase 6: Clarification and Research Workflow Scaffolding

### Task 6.1: Add clarification packet schema and tests

**Files:**
- Create: `src/schemas/clarification-packet.ts`
- Test: `tests/clarification-packet-schema.test.ts`

**Step 1: Write failing schema tests**

Cover:
- goal
- uncertainty_reason
- best option fields
- options array
- follow-up field

**Step 2: Implement minimal schema**

Do not wire it into hooks yet.

### Task 6.2: Define research artifact frontmatter contract

**Files:**
- Create: `docs/plans/2026-03-06-research-artifact-contract.md`
- Optionally create: `src/schemas/research-artifact-frontmatter.ts`

**Step 1: Document the frontmatter contract**

Fields:
- `id`
- `title`
- `status`
- `workflow_stage`
- `tags`
- `terms`
- `hierarchy_ref`
- `session_ref`
- `parent`
- `related`
- `source_type`

**Step 2: If schema is added, keep it validation-only**

Do not introduce a storage subsystem in this phase.

---

## Phase 7: Verification and Closeout

### Task 7.1: Run targeted suites

Run:
```bash
npx tsx --test tests/prompt-surface-ownership.test.ts
npx tsx --test tests/child-session-injection-minimization.test.ts
npx tsx --test tests/delegation-continuity-envelope.test.ts
npx tsx --test tests/delegation-envelope-schema.test.ts
npx tsx --test tests/inspect-traverse.test.ts
npx tsx --test tests/messages-transform.test.ts
npx tsx --test tests/session-lifecycle-boundary.test.ts
```

Expected:
- all targeted tests pass

### Task 7.2: Run full verification

Run:
```bash
npx tsc --noEmit
npm run lint:boundary
npm test
```

Expected:
- all pass

### Task 7.3: Update planning artifacts

**Files:**
- Update: `docs/plans/2026-03-06-external-findings-truth-matrix.md`
- Update: `docs/plans/2026-03-06-live-architecture-themes.md`

Record:
- which live themes were closed
- which were deferred
- any remaining external questions

---

## Rollback Notes

- If prompt de-duplication causes regressions, restore ownership one surface at a time:
  - anchor header first
  - status block second
  - helper extraction last
- If delegation continuity schema causes output compatibility issues, keep schema optional and preserve legacy output fields.
- If `traverse` grows too wide too early, cut back to tree traversal only and defer related mem/anchor lookup.

## Out Of Scope For This Wave

- Reworking budget hardening already shipped
- Reworking compaction budget already shipped
- Reworking mutation flush in `soft-governance.ts`
- Full replacement of `brain.json`, `graph/*.json`, or `hierarchy.json`
- Building a brand new research subsystem

