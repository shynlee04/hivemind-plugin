# Runtime Sync Detachment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Detach runtime markdown sync from normal bootstrap and repair flows so only the local plugin stub is auto-created during `hm-init` and healthy `hm-doctor` runs.

**Architecture:** Isolate plugin stub attachment from the broader mirror/deletion logic in the runtime sync seam, then update entry handlers and reports to consume the narrower contract. After code truth is locked, update tests and documentation so runtime behavior, evidence output, and guidance all describe plugin-only sync.

**Tech Stack:** TypeScript, Node built-in test runner, OpenCode runtime entry handlers, markdown docs.

---

## File Structure Map

### Code Changes

| File | Responsibility | Planned Change |
|------|----------------|----------------|
| `src/features/runtime-observability/sync.ts` | runtime surface sync implementation | split plugin stub sync from mirrored content sync; make default path plugin-only |
| `src/features/runtime-entry/init.handler.ts` | init runtime entry report | consume plugin-only sync result; remove mirrored command/agent fields and artifact refs |
| `src/features/runtime-entry/doctor.ts` | doctor runtime entry report | same as init handler |

### Tests

| File | Responsibility | Planned Change |
|------|----------------|----------------|
| `tests/runtime-surface-sync.test.ts` | default runtime sync behavior | rewrite around plugin-only sync contract |
| `tests/sync-dry-run.test.ts` | dry-run and deletion behavior | remove default mirrored deletion expectations; keep only behavior still intentionally supported |
| `tests/runtime-entry-contract.test.ts` | init/doctor contract truth | assert plugin-only report/artifact behavior |

### Documentation Truth Updates

| File | Responsibility | Planned Change |
|------|----------------|----------------|
| `AGENTS.md` | root runtime authority guidance | align runtime projection claims with plugin-only auto-attach |
| `README.md` | user-facing bootstrap/runtime docs | replace mirror claims with plugin-stub-only language |
| `docs/guide/installation.md` | install/bootstrap guide | describe plugin-only auto-creation and non-mutating harness |
| `src/shared/AGENTS.md` | projection governance note | clarify registries are not part of normal init/doctor runtime writes |
| `src/commands/slash-command/AGENTS.md` | bundle authority note | remove implication that bundle registry guarantees runtime-mirrored commands |

### Dependencies To Watch

| File | Relationship |
|------|--------------|
| `src/commands/slash-command/command-bundles.ts` | remains command authority even when runtime mirroring is detached |
| `src/shared/opencode-agent-registry.ts` | may still be used by tests or future/manual projection paths |
| `src/shared/opencode-skill-registry.ts` | same as above for skills |

---

### Task 1: Freeze The Runtime Contract Before Editing

**Files:**
- Read: `docs/superpowers/specs/runtime-sync-detachment-spec-2026-03-21.md`
- Read: `src/features/runtime-observability/sync.ts`
- Read: `src/features/runtime-entry/init.handler.ts`
- Read: `src/features/runtime-entry/doctor.ts`
- Read: `tests/runtime-surface-sync.test.ts`
- Read: `tests/sync-dry-run.test.ts`
- Read: `tests/runtime-entry-contract.test.ts`

- [ ] **Step 1: Confirm the approved behavior envelope**

Verify the implementation target matches the spec:
- default sync writes only `.opencode/plugins/hivemind-context-governance.ts`
- `init` and healthy `doctor` report plugin sync only
- no normal-flow deletion of `.opencode/commands`, `.opencode/agents`, `.opencode/skills`

- [ ] **Step 2: Record any hidden callers of mirrored sync helpers**

Search for direct usage of:
- `mirroredCommandFiles`
- `mirroredAgentFiles`
- `mirroredSkillFiles`
- `wouldDelete`
- `protected`

Expected: only runtime sync tests and entry handlers require coordinated edits. If other product code depends on these fields, pause and extend the plan before changing the contract.

- [ ] **Step 3: Confirm there is no required public/manual sync command in scope**

Review `src/cli/runtime-assets.ts` and any immediate callers so the executor does not accidentally remove a still-needed explicit projection path.

Run: `npx tsc --noEmit`
Expected: PASS before edits begin.

---

### Task 2: Refactor Runtime Sync To Plugin-Only Default Behavior

**Files:**
- Modify: `src/features/runtime-observability/sync.ts`

- [ ] **Step 1: Write or update the failing unit coverage first**

Before changing implementation, update `tests/runtime-surface-sync.test.ts` and any relevant dry-run coverage so the current code fails against the new plugin-only expectation.

Suggested assertions:
- plugin stub file exists and is stable across repeated sync runs
- `.opencode/commands` and `.opencode/agents` are not created by default sync
- result payload no longer promises mirrored command/agent/skill arrays in the default path

- [ ] **Step 2: Run the targeted failing test**

Run: `npx tsx --test tests/runtime-surface-sync.test.ts`
Expected: FAIL because current sync still mirrors commands/agents.

- [ ] **Step 3: Implement the minimal sync split**

Refactor `sync.ts` so:
- plugin stub write is preserved
- command/agent/skill registry loading is removed from the default sync path
- destructive cleanup for those detached surfaces is no longer reachable from default sync
- result type reflects the narrower plugin-focused contract

Keep the module focused; if helper extraction is needed, prefer small local helpers over growing a new monolith.

- [ ] **Step 4: Re-run the targeted test**

Run: `npx tsx --test tests/runtime-surface-sync.test.ts`
Expected: PASS.

- [ ] **Step 5: Validate type safety for the refactor slice**

Run: `npx tsc --noEmit`
Expected: PASS.

---

### Task 3: Update Init And Doctor To The Narrower Sync Contract

**Files:**
- Modify: `src/features/runtime-entry/init.handler.ts`
- Modify: `src/features/runtime-entry/doctor.ts`
- Test: `tests/runtime-entry-contract.test.ts`

- [ ] **Step 1: Write the failing contract assertions**

Update `tests/runtime-entry-contract.test.ts` so init/doctor now assert:
- `runtime_surface_sync.plugin_file` exists when sync runs
- no mirrored command or mirrored agent arrays are expected in report payloads
- artifact refs include the plugin stub only, not mirrored command/agent assets
- tests no longer require `.opencode/commands/hm-plan.md` to exist after init/doctor

- [ ] **Step 2: Run the targeted contract test to verify failure**

Run: `npx tsx --test tests/runtime-entry-contract.test.ts`
Expected: FAIL on old report/artifact assumptions.

- [ ] **Step 3: Update init handler**

Change `src/features/runtime-entry/init.handler.ts` so:
- report payload for `runtime_surface_sync` is plugin-only
- `artifactRefs` includes only the plugin stub from sync evidence
- comments and local variable naming no longer claim command-file sync

- [ ] **Step 4: Update doctor handler**

Change `src/features/runtime-entry/doctor.ts` with the same contract rules as init.

- [ ] **Step 5: Re-run the targeted contract test**

Run: `npx tsx --test tests/runtime-entry-contract.test.ts`
Expected: PASS.

- [ ] **Step 6: Re-run typecheck after both handlers change**

Run: `npx tsc --noEmit`
Expected: PASS.

---

### Task 4: Remove Or Re-scope Dry-Run And Deletion Expectations

**Files:**
- Modify: `tests/sync-dry-run.test.ts`
- Read/Modify if needed: `src/features/runtime-observability/sync.ts`

- [ ] **Step 1: Decide the post-detachment testing shape**

Use verified code reality from Tasks 2-3:
- if dry-run remains meaningful for plugin-only sync, keep only the plugin-safe assertions
- if dry-run exists solely for detached mirror deletion, remove or narrow that API and its tests accordingly

Do not preserve deletion behavior merely because a test already exists.

- [ ] **Step 2: Write the failing dry-run/deletion test adjustments**

Update the test file so it no longer expects default sync to report or delete stale `.opencode/commands/**` or `.opencode/agents/**` content.

- [ ] **Step 3: Run the targeted test to verify failure**

Run: `npx tsx --test tests/sync-dry-run.test.ts`
Expected: FAIL until implementation and/or API cleanup matches the new contract.

- [ ] **Step 4: Finalize implementation cleanup if still needed**

Remove dead dry-run/deletion branches from `sync.ts` only if they are no longer part of any supported path.

- [ ] **Step 5: Re-run the targeted test**

Run: `npx tsx --test tests/sync-dry-run.test.ts`
Expected: PASS.

- [ ] **Step 6: Re-run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS.

---

### Task 5: Update Documentation Truth After Code Truth Is Stable

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/guide/installation.md`
- Modify: `src/shared/AGENTS.md`
- Modify: `src/commands/slash-command/AGENTS.md`

- [ ] **Step 1: Rewrite root runtime-entry claims**

Update root docs to say:
- runtime entry auto-creates the plugin stub
- normal `init`/`doctor` do not mirror command/agent/skill markdown into `.opencode/**`
- users should not treat `.opencode/commands`, `.opencode/agents`, or `.opencode/skills` as maintained runtime projections

- [ ] **Step 2: Update installation instructions**

Revise `docs/guide/installation.md` to describe plugin-only auto-attachment and non-mutating `harness` verification.

- [ ] **Step 3: Update internal AGENTS guidance**

Revise `src/shared/AGENTS.md` and `src/commands/slash-command/AGENTS.md` so they describe projection helpers and bundle authority without claiming live runtime mirroring.

- [ ] **Step 4: Proofread for truth drift**

Search for stale phrases such as:
- `mirrors shipped command and agent assets`
- `user-local .opencode/** projection`
- `mirrored command`
- `mirrored agent`
- `mirrored skill`

Expected: remaining references are either historical/advisory or explicitly marked dev/manual-only.

---

### Task 6: Run Verification Gates And Capture Evidence

**Files:**
- Read: modified code and docs above

- [ ] **Step 1: Run focused tests together**

Run: `npx tsx --test tests/runtime-surface-sync.test.ts tests/sync-dry-run.test.ts tests/runtime-entry-contract.test.ts`
Expected: PASS.

- [ ] **Step 2: Run the required typecheck gate**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Run the broader test suite if the focused slice passes cleanly**

Run: `npm test`
Expected: PASS, or document unrelated pre-existing failures with evidence.

- [ ] **Step 4: Prepare final evidence summary**

Capture:
- exact files changed
- tests run and their outcomes
- final runtime contract in one paragraph
- any residual follow-up items, especially dead registries or future manual projection surfaces

---

## Execution Notes For Subagent-Driven Development

- Keep code-contract changes separate from doc-truth updates until tests pass.
- Prefer one commit after code/tests are green and a second commit for docs if the executor is asked to commit.
- Do not reintroduce markdown projection to satisfy stale documentation or legacy tests.
- If hidden callers depend on mirrored fields, stop after Task 1 and escalate with evidence rather than guessing.

## Success Criteria

- `syncRuntimeSurface` default behavior is plugin-only.
- `init` and healthy `doctor` expose plugin-only sync evidence.
- No default entry flow deletes unmanaged `.opencode/commands`, `.opencode/agents`, or `.opencode/skills` content.
- Focused tests and `npx tsc --noEmit` pass.
- Runtime docs and AGENTS surfaces match verified code truth.
