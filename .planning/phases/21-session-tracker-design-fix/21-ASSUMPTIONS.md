# Phase 21 Assumptions Analysis: Session-Tracker Design Fix

**Date:** 2026-05-21
**Sources:** 4 cross-referenced discovery documents + `src/features/session-tracker/` source code
**Calibration Tier:** full_maturity (phase reordering prio #1)

---

## False Assumptions from Prior Analyses (History of Being Wrong)

The session-tracker has a documented history of planners making incorrect assumptions that led to 6 dedicated phases (CP-ST-01 through CP-ST-06) with repeated "completed" claims that still left 22 flaws open. These are the assumptions that were wrong before — and must not be repeated.

### False Assumption 1: "The hierarchy manifest is never called / dead code"

**The claim:** F-02 analysis in `.planning/research/session-tracker-flaws-analysis-2026-05-21.md` stated: "no caller ever invokes `manifestWriter.addChild()` on any observed code path" — based on git status analysis of `ses_1baf.md`.

**Why it was wrong:** The git status analysis was an L3 inference (no manifest changes visible in `ses_1baf` session export's git blocks), but direct L2 filesystem inspection of all 37 session directories showed EVERY session has a populated manifest. Source code inspection (`event-capture.ts:490`, `tool-delegation.ts:288`) confirms `addChild()` IS called. The manifest is written — just not by ALL paths. The real bug is **asymmetric wiring** (F-17): `tool-capture.ts` never calls `manifestWriter.addChild()`.

**How to avoid:** Do NOT infer runtime behavior from git status snapshots of a single export. Always verify with L2 filesystem inspection across ALL session directories. The git status in `ses_1baf` only showed changes for `session-continuity.json` and `project-continuity.json` because those are the files written by the observed tool calls — the manifest writes via `tool-delegation.ts` path happened in different turn blocks that the snapshot didn't capture.

### False Assumption 2: "The manifest is the authoritative hierarchy source"

**The claim:** The `HierarchyManifestWriter` class JSDoc at `hierarchy-manifest.ts:4-6` states: "This is the AUTHORITATIVE source for the session delegation tree."

**Why it was wrong:** Production evidence shows the manifest has holes. `ses_1b59c269...` and `ses_1b90978a...` are present in continuity trees but MISSING from manifests. The continuity tree in `session-continuity.json` is the ONLY store that preserves nested depth, parent-child topology, and de-duplication across multiple parents. The manifest is a flattened view with no nested depth and at least 2 known missing children. Declaring it "authoritative" in documentation does not make it so.

**How to avoid:** Treat claims in JSDoc comments and spec documents as aspirational, not factual. The canonical source of truth is whichever store has the most complete data — in this case, the continuity tree. Plan the manifest fix as "generate from continuity tree" (derivative cache) rather than "fix all write paths to populate it" (authoritative source).

### False Assumption 3: "childCount is being populated"

**The claim:** `project-index-writer.ts` has an `incrementChildCount()` method (line 239) that is called from `event-capture.ts:484`. The schema supports `childCount` and `totalDelegationDepth` fields.

**Why it was wrong:** ALL 122 entries in `project-continuity.json` show `childCount: 0` and `totalDelegationDepth: 0`. The `incrementChildCount()` call at `event-capture.ts:484` only fires inside the `if (this.hierarchyIndex && this.manifestWriter)` guard (line 471). If either dependency is null — or if `writeImmediateChildFile()` is called from a path that reaches line 434's `if (!this.childWriter) return;` — the increment never happens. Additionally, `addSession()` at line 179 initializes `childCount: 0` but is called AFTER `incrementChildCount(type...)` at line 484, so there IS a code path that creates entries with zero counts before children are registered.

**How to avoid:** Never assume that:
- A method existing in the codebase means it's called on all paths
- Schema fields being defined means they're populated
- `incrementX()` calls are ordered correctly relative to initialization

### False Assumption 4: "Multiple CP-ST phases = the design is stable"

**The claim:** Because 6 consecutive phases (CP-ST-01 through CP-ST-06) were dedicated to the session-tracker, with explicit "completion" claims, the design must be stable and the remaining work is incremental.

**Why it was wrong:** CP-ST-06's "30 test failures → 0" report created false confidence. The production evidence shows that passing tests do not equal production correctness. The test suite had high coverage for normal paths but ZERO tests for restart scenarios, cross-volume temp files, or concurrent session creation. The fixes were validated against unit tests, not against production data.

**How to avoid:** Phase 21 must explicitly gate its fixes with **production scenario tests**, not just existing unit tests. Each fix (F-01 through F-19) needs a scenario-based integration test that reproduces the exact failure mode observed in production: restart simulation, temp file accumulation loop, concurrent session rehydration, etc.

### False Assumption 5: "commit_docs is used for its named purpose"

**The claim:** The config field `commit_docs` controls whether documentation files are committed to git (as its name implies).

**Why it was wrong:** `src/task-management/continuity/delegation-persistence.ts:62` gates `persistDelegations()` on `config.commit_docs` — the sole runtime consumer. The field name correctly describes what GSD framework workflows use it for (git committing `.planning/` docs), but within the Hivemind harness it controls delegation persistence. This is a **category error** from CA-03 design phase: D-16's design assumption conflated "persist delegation records to disk" with "commit documentation to git."

**How to avoid:** Never assume that a config field's name describes its actual runtime behavior. Always trace all consumers via grep before making assumptions. The `commit_docs` field has 23 matches across src/ and tests/, but only ONE runtime consumer in the harness (the delegation-persistence gate).

---

## Per-Fix Assumptions

### F-01 Temp Leak

**Fix scope:** Add `unlink(tmpPath)` after `rename()` in `atomicWriteJson()`. Add same-volume `TMPDIR` validation.

#### Assumption 1: The fix is a one-line `unlink()` addition
- **Why this way:** `atomic-write.ts:33-42` is 9 lines — writeFile, then rename. Adding `unlink(tmpPath)` after line 41 seems trivial.
- **If wrong:** The temp file also leaks from `hierarchy-manifest.ts:201-204` which has its OWN temp-write-rename pattern (`writeManifest()` at line 192). And `atomicAppendMarkdown()` at line 60-77 has the same pattern. A planner who only fixes `atomicWriteJson` misses 2 additional leak sites in the same file and in `hierarchy-manifest.ts`. **Consequence:** 3 of 4 write paths still leak temp files.
- **Confidence:** Confident (the `writeManifest()` private method at line 192 uses `tmp.${Date.now().toString(36)}` with no cleanup — confirmed by reading `hierarchy-manifest.ts:201-204`)

#### Assumption 2: `unlink()` after `rename()` is always safe
- **Why this way:** After `rename()` succeeds, the temp file is no longer needed. A best-effort `unlink()` in a try/catch should be harmless.
- **If wrong:** On Windows (future platform), `rename()` to an existing target deletes the target first, then renames. If `rename()` and `unlink()` are parallelized by the kernel, there could be a brief window with NO file at `filePath`. **Consequence:** A concurrent reader gets ENOENT. **Mitigation:** Wrap unlink in try/catch and document the platform assumption (POSIX/macOS).
- **Confidence:** Likely (safe on POSIX and macOS APFS; Windows behavior would need verification)

#### Assumption 3: Cross-volume TMPDIR detection requires `stat()` on both paths
- **Why this way:** `atomicWriteJson()` receives `filePath` and computes `tmpPath` as `filePath.tmp.${Date.now()}`. Both are on the same volume by construction unless OpenCode sets `TMPDIR` to a different filesystem.
- **If wrong:** The tmp file path is constructed by appending `.tmp.${timestamp}` to `filePath`, which means it's always on the same filesystem as the target. The cross-volume issue from the session evidence (`tmp.1779307372108` persisting) might be caused by a different mechanism — perhaps the `rename()` on macOS APFS is not truly atomic even on the same volume, or there's a third temp path. **Consequence:** Adding volume validation that always passes (because paths are same-volume) would miss the real root cause.
- **Confidence:** Unclear (the APFS cross-volume claim needs experimental verification — no document confirmed TMPDIR was actually on a different volume)

---

### F-17/F-02 Manifest Wiring

**Fix scope:** Add `manifestWriter.addChild()` calls to `tool-capture.ts` paths. Optionally deprecate manifest as authoritative source in favor of continuity tree generation.

#### Assumption 4: `tool-capture.ts` is the ONLY missing path
- **Why this way:** All 4 analysis documents agree: `tool-capture.ts` has 0 grep matches for `manifestWriter.addChild()`, while `event-capture.ts:490` and `tool-delegation.ts:288` both call it.
- **If wrong:** There may be other undocumented write paths (plugin-registered custom tools, hook-based captures) that also bypass manifest writes. The grep only covers `src/features/session-tracker/` — external tool hooks registered in `src/plugin.ts` or `src/hooks/` might also create children without manifest updates. **Consequence:** Fixing only `tool-capture.ts` still leaves holes.
- **Confidence:** Confident (grep of the entire `src/` directory for `manifestWriter.addChild` returns only the 2 known call sites)

#### Assumption 5: Manifest fixes are independent of the G-1 decision
- **Why this way:** The "manifest as derivative cache" option (G-1b) eliminates the entire manifest write path by generating from continuity tree on read. Adding more write paths to `tool-capture.ts` would be wasted effort if G-1b is chosen.
- **If wrong:** If the planner wires `tool-capture.ts` with `manifestWriter.addChild()` calls AND later the G-1 decision removes all manifest write paths, that effort is reverted. **Consequence:** Double work if G-1 decision is deferred. **Mitigation:** Decide G-1 FIRST before any manifest write-path changes. Or implement G-1b directly (remove all writes, add r-t generation) and skip the `tool-capture.ts` wiring entirely.
- **Confidence:** Likely (the unified register recommends G-1b, which makes additional write-path wiring counterproductive)

#### Assumption 6: Historical manifest holes are ignorable
- **Why this way:** `ses_1b59c269...` and `ses_1b90978a...` missing from manifests are "historical artifacts" from before manifest wiring was added.
- **If wrong:** These missing entries corrupt any tool that treats the manifest as authoritative. `session-hierarchy.ts` and `session-context.ts` read from continuity trees and manifests — the divergence means they can disagree. **Consequence:** Phase 21's exit gate ("manifest contains ALL children visible in continuity tree") would fail unless existing manifests are repaired. Repair requires either: (a) rewriting all 37 manifests, or (b) implementing G-1b (generate from tree).
- **Confidence:** Likely (need to decide whether P21 includes historical manifest repair or just fixes future writes)

---

### F-18 Anonymous Children

**Fix scope:** Capture real agent name/model/description in `event-capture.ts` BEFORE creating the child file. Add backfill hook when delegation completes.

#### Assumption 7: The real agent name IS available at the time of child file creation
- **Why this way:** Session export `ses_1bda.md:265` shows `"agent": "hm-l2-researcher"` in the delegation status output. The `PendingDispatchRegistry` has the subagent type. `event-capture.ts:198-200` reads from `anyPending.subagentType` and passes it to `writeImmediateChildFile`.
- **If wrong:** At line 438, `explicitSubagentType` may arrive as `undefined` for some code paths. The fallback chain `explicitSubagentType ?? pendingEntry?.subagentType ?? "unknown"` means `"unknown"` appears when BOTH `explicitSubagentType` is undefined AND `pendingEntry` is null. The critical question: which callers pass `undefined`? Lines 200, 235, 248, 263 each pass different combinations — line 235 passes NO subagent type, relying entirely on the fallback. **Consequence:** Some paths will still produce `"unknown"` children even after the "fix" if the fix only targets the delegation completion backfill rather than the initial capture.
- **Confidence:** Unclear (need to trace ALL 4 call sites of `writeImmediateChildFile()` to determine which ones lack the agent name)

#### Assumption 8: Backfilling on delegation completion is safe
- **Why this way:** When a delegation completes, both the child file and the manifest need to be updated. `event-capture.ts:323-357` already updates status on delegation idle/completed/error. Adding a metadata update here is "natural."
- **If wrong:** The backfill overwrites the child file. If a concurrent read (e.g., `hivemind-session-view`) reads the file BETWEEN initial creation (unknown metadata) and backfill (real metadata), it gets stale data. The write queue serialization protects against concurrent writes but NOT against concurrent reads that bypass the queue. **Consequence:** Brief window where session-view shows "unknown" for a child that just completed.
- **Confidence:** Likely (the race window is small and the stale data is temporary — but worth documenting as a known limitation)

---

### F-19 childCount Zero

**Fix scope:** Ensure `incrementChildCount()` fires on every child creation path. Add `childCount` computation in `updateSession()`.

#### Assumption 9: `incrementChildCount()` IS the right mechanism
- **Why this way:** `project-index-writer.ts:239-254` has `incrementChildCount()` that atomically increments and updates `totalDelegationDepth`. It's already called from `event-capture.ts:484`.
- **If wrong:** The function is only called inside the `if (this.hierarchyIndex && this.manifestWriter)` guard at line 471. If this guard fails, neither `incrementChildCount()` NOR `addSession()` fire. For root sessions created via `handleSessionCreated` (which calls `addSession()` directly via different path), `incrementChildCount()` is never called because there's no parent to trigger the child-registration path. **Consequence:** Root session entries in project-continuity.json still show childCount: 0 even after the fix.
- **Confidence:** Confident (the guard condition is visible at `event-capture.ts:471` and the root session path is verified at `event-capture.ts:156-170` which calls `handleSessionCreated` → different code path)

#### Assumption 10: The `addSession()` initialization doesn't overwrite `incrementChildCount()`
- **Why this way:** `addSession()` at line 168-170 only overwrites `status`, not `childCount` or `totalDelegationDepth`. `existing.status = "active"` is the sole write. The `...existing` spread in `updateSession()` preserves all existing fields including childCount.
- **If wrong:** If `addSession()` is called AFTER `incrementChildCount()` with a different sessionID (the child session itself rather than the root), the child entry is created fresh with `childCount: 0`. This is correct behavior (child sessions don't need childCount). **Consequence:** No data loss — the root's childCount is correct because `addSession()` targets a different entry than `incrementChildCount()`.
- **Confidence:** Confident (line 484 calls `incrementChildCount(rootMain)` and line 485 calls `addSession(sessionID)` — different keys in the `sessions` map)

#### Assumption 11: ALL 122 zero-entry records are fixable
- **Why this way:** The fix adds correct computation. P21 doesn't need to backfill historical records.
- **If wrong:** The 122 zero-entry records are HISTORICAL — they existed before `incrementChildCount()` was wired. After P21, new sessions get correct counts. But old sessions remain broken. If Phase 22's status unification depends on correct historical childCount data, P21 must include a one-time backfill/repair pass. **Consequence:** Blocked downstream if Phase 22 needs historical correctness.
- **Confidence:** Likely (unified register recommends no historical repair — "surgical fix, future writes only")

---

### F-07 Recovery Blindness

**Fix scope:** Persist `childToRootMain` mapping to durable storage. Add `rebuildChildToRootMain()` function from continuity tree.

#### Assumption 12: `buildFromDisk()` can reconstruct `childToRootMain` deterministically
- **Why this way:** `hierarchy-index.ts:127-136` already has a second pass that walks `childToParent` to compute `childToRootMain`. Extending this with a `rebuildChildToRootMain()` function is "natural."
- **If wrong:** The continuity tree structure at `types.ts:270-288` stores `hierarchy.children` as a flat `Record<string, ChildHierarchyEntry>` with `depth` fields — NOT as a nested tree. Children with multiple parents (DAG topology, like `ses_1bafc53c...` appearing under 4 parents) create ambiguity: which parent determines rootMain? The current algorithm uses the FIRST registered parent, but recovery might visit children in arbitrary filesystem order. **Consequence:** Non-deterministic rootMain assignment after restart.
- **Confidence:** Unclear (production evidence SHOWS children under multiple parents — the current code picks the first parent, which is filesystem-order dependent)

#### Assumption 13: Restart-without-crash is the only scenario
- **Why this way:** The F-07 analysis focuses on process restart (rebuild, clean shutdown). Session export `ses_1baf` shows clean start behavior.
- **If wrong:** The REAL danger is crash-during-write restart (F-01 + F-07 combined). If `session-continuity.json` was being written when the crash occurred, `buildFromDisk()` reads a stale file. Children created during the last N minutes are invisible to the rebuild. The `childToRootMain` mapping is reconstructed from STALE data. After restart, recoverable children are classified as `"unknownSub"` and their messages are dropped. **Consequence:** Data loss is amplified, not eliminated, by the "fix" if it trusts stale continuity data.
- **Confidence:** Likely (F-01 analysis confirms temp file exists during writes; crash during write window leaves stale data)

#### Assumption 14: The `rebuildChildToRootMain()` function needs no new file format
- **Why this way:** Gray area analysis G-2 recommends option (b): reconstruct from continuity tree, no new file format.
- **If wrong:** If the continuity-tree-to-rootMain reconstruction is non-deterministic (DAG ambiguity per Assumption 12), the only safe approach IS a new durable index file (G-2a). **Consequence:** 100 LOC becomes 200+ LOC; new file format introduces new drift surface.
- **Confidence:** Unclear (depends on whether DAG topology in production causes non-deterministic resolution)

---

### F-13 MAX_DEPTH

**Fix scope:** Add `MAX_DEPTH = 20` guard to `ensureAncestorRoute()` at `session-tracker/index.ts:375-388`.

#### Assumption 15: `ensureAncestorRoute()` recursion depth is bounded by SDK session chain length
- **Why this way:** The function walks up the parent chain via SDK. In normal operation, session depth is < 5 (root → L1 → L2 → L3). Production evidence shows at most 3-level chains.
- **If wrong:** An SDK bug could return a circular parent reference (A→B→C→A). The `seen` Set at line 376 catches this for direct cycles, but if the SDK returns `parentID` pointing to a session that doesn't exist in the hierarchy, `getSessionSafely()` returns `undefined` → `parentID` is undefined → recursion stops. The real risk is a DEEP linear chain (A→B→C→...→Z, 26 levels). SDK returning a buggy deep chain would recurse 26 times before hitting the actual root. **Consequence:** Stack overflow before MAX_DEPTH is reached only with 1000+ levels — unlikely in practice, but the guard protects against pathological SDK data.
- **Confidence:** Likely (MAX_DEPTH=20 is defensive; even without it, the function needs ~1000 SDK calls to overflow the stack)

#### Assumption 16: MAX_DEPTH=20 is the right value
- **Why this way:** No production evidence of chains > 3 levels. 20 allows huge headroom.
- **If wrong:** Setting MAX_DEPTH too high (20) doesn't hurt — it just sets an upper bound that will never trigger in practice. Setting it too LOW (e.g., 5) would break legitimate deep delegations in future. **Consequence:** Minimal risk as long as 20 is documented as a safety bound, not a hard architectural limit.
- **Confidence:** Confident (value chosen is conservative and harmlessly large)

---

### G-3 Precondition Fixes

**Fix scope:** Fix `addSession()` status overwrite. Add reconciliation logging for status divergence. These are preconditions for P22 status unification.

#### Assumption 17: `addSession()` status overwrite is the main status divergence cause
- **Why this way:** `project-index-writer.ts:168-169` resets `existing.status = "active"` on every `addSession()` call, even for sessions that are "idle" or "completed."
- **If wrong:** The evidence from `ses_1bda` shows that `session-continuity.json` reports "idle" for 5 of 8 children while the session export shows "running" and "executionState: confirmed". This divergence comes from a DIFFERENT cause — the `updateSession()` call at line 213-217 which merges partial updates. The `...existing, ...updates` spread preserves the EXISTING status if `updates.status` is undefined. So the "idle" status in continuity is STALE from the last explicit status write, not overwritten. **Consequence:** Fixing `addSession()` alone doesn't address the continuity-tree status divergence — that requires P22's full status unification.
- **Confidence:** Confident (the gap between fix scope and problem scope is clear — the P21 guardrail fixes project-continuity status, but continuity-tree status must wait for P22)

#### Assumption 18: The reconciliation log is additive-only, no active repair
- **Why this way:** The unified register explicitly says "add status divergence WARNING log when child.json status ≠ manifest status ≠ project-index status" — logging only, no active repair in P21.
- **If wrong:** If status divergence is detected during P21 fix validation, the planner might be tempted to add active repair ("while we're here, let's fix it"). This would grow P21 scope into P22 territory. **Consequence:** Scope creep into status unification, delaying other P21 fixes.
- **Confidence:** Confident (unified register is explicit about logging-only status guardrails)

---

### G-4 Gate Removal

**Fix scope:** Add `persist_delegations` config flag (or remove the gate entirely). Separate delegation persistence from `commit_docs`.

#### Assumption 19: The `commit_docs` gate is the ONLY thing blocking delegation persistence
- **Why this way:** `delegation-persistence.ts:58-64` shows the early return on `!config.commit_docs`. Removing this check always writes delegations.
- **If wrong:** `persistDelegations()` is called from `state-machine.ts:218,394` and `retry-handler.ts:23`. Even if the gate is removed, these callers must actually BE invoked for delegations to be persisted. If the delegation state machine has bugs that prevent `persistDelegations()` from ever being called, removing the gate has no effect. **Consequence:** Still no delegation records despite the fix.
- **Confidence:** Likely (need to verify that `state-machine.ts` actually calls `persistDelegations()` on delegation completion — the call sites exist but may not fire on all paths)

#### Assumption 20: Adding a new config key is trivially safe
- **Why this way:** `src/schema-kernel/hivemind-configs.schema.ts:282` is a single Zod entry. Adding `persist_delegations: z.boolean().default(true)` is one line.
- **If wrong:** The `getCachedConfig()` function reads from a cached config object. If the cache is stale (populated before the new key was added), `config.persist_delegations` returns `undefined`, which is falsy. The gate `if (!config.persist_delegations)` would block persistence for sessions that loaded config before the schema update. **Consequence:** New config key silently disabled until cache refresh. **Mitigation:** Add `?? true` default: `if (config.persist_delegations ?? true !== false)`.
- **Confidence:** Likely (risk is real but trivially mitigated with default value handling)

---

## Cross-Cutting Assumptions

### Assumption A: Test infrastructure exists for integration-level validation

The 6 P21 fixes all require type-level verification beyond unit tests:
- F-01: Need a test that calls `atomicWriteJson` 100 times and asserts 0 temp files remain
- F-07: Need an integration test that simulates restart and verifies child classification
- F-18: Need a test that creates a delegation and checks child JSON metadata

**If wrong:** Existing tests may only cover unit-level (mock SDK, mock filesystem). The `tool-delegation.ts` tests may use mocked `childWriter` that doesn't actually write files. An integration test that verifies real file contents might need new test infrastructure (temp directories, controlled teardown, filesystem assertions).

**Mitigation:** Verify existing test patterns before assuming integration tests are feasible. Check `tests/tools/delegation/` for filesystem assertion patterns. The F-07 restart simulation may need a `beforeAll`/`afterAll` lifecycle that creates then destroys session directories.

### Assumption B: Fixes can be validated independently

The 6 fixes are sequenced as independent surgical changes. However:
- F-17 (manifest wiring) affects the same files as G-1 (manifest role decision)
- F-07 (rebuild) depends on the continuity tree format staying stable — which F-19 (childCount) doesn't affect
- F-01 (temp leak) shares the same temp-write pattern as the manifest writer

**If wrong:** The fixes are NOT independent. Changing the manifest role from "authoritative source" to "derivative cache" (G-1b) fundamentally changes how F-17 is implemented — instead of adding write paths, you remove them. If G-1 is deferred, the planner wires F-17 as additional writes, then G-1b later removes them.

**Mitigation:** Lock the gray area decisions (G-1, G-3, G-4) BEFORE implementation. The implementation order should be: G-1 decision → F-17 fix → F-01/F-18/F-19 (independent) → F-07 → G-3/G-4 preconditions.

### Assumption C: The session-tracker module boundary doesn't change

The fixes are described as "surgical" — changing existing functions within `src/features/session-tracker/` and `src/task-management/continuity/delegation-persistence.ts` without restructuring module boundaries.

**If wrong:** Adding `unlink()` to `atomicWriteJson()` is contained. Adding the F-07 rebuild function touches 3 files. But if the G-1b decision removes manifest write paths, it needs to modify `event-capture.ts`, `tool-delegation.ts`, and potentially `tool-capture.ts` — and must NOT break `session-hierarchy.ts` which reads the manifest. The change surface crosses the session-tracker → tools boundary.

**Mitigation:** Map all callers of `HierarchyManifestWriter` before making any changes. The class is consumed by `event-capture.ts`, `tool-delegation.ts`, and potentially `session-hierarchy.ts`. Verify each consumer handles "manifest doesn't exist yet" gracefully.

### Assumption D: The `commit_docs` gate removal doesn't break GSD framework

**If wrong:** The GSD framework (outside Hivemind npm package) uses `commit_docs` to decide whether to git-commit `.planning/` documentation files. Removing the field from schema would break 20+ GSD workflows. Keeping the field in schema but removing its harness-side consumer is safe — the GSD workflows read it directly via `gsd-sdk query config-get commit_docs`, not through the harness consumer.

**Mitigation:** Verify that GSD doesn't transitively depend on the Hivemind harness consuming `commit_docs`. Check `.opencode/get-shit-done/workflows/` for any script that expects `commit_docs` to control delegation persistence (unlikely but must be confirmed before implementation).

### Assumption E: Backward compatibility with existing persisted data

P21 creates files with new field values (childCount, agentName) but doesn't change any existing file format or schema.  

**If wrong:** If P21 adds the `persist_delegations` config key and changes the schema, code reading delegation files that were written by older harness versions must handle the missing key gracefully. The `readPersistedDelegations()` function already does this via `normalizePersistedDelegation()` null-coalescing defaults — so schema additions are safe.

---

## Risk Matrix

| Fix | Assumption Risk | What Could Go Wrong | Mitigation |
|-----|-----------------|---------------------|------------|
| **F-01 Temp Leak** | **MEDIUM** | Planner only fixes `atomicWriteJson()` but misses the same temp leak pattern in `atomicAppendMarkdown()` (line 64) and `hierarchy-manifest.ts:writeManifest()` (line 201). Fix is incomplete — 2 of 3 leak paths remain open. | Audit ALL write-tmp-rename patterns in session-tracker before implementation. Add centralized `createTempFile()` with auto-cleanup. |
| **F-17/F-02 Manifest Wiring** | **HIGH** | Planner wires `tool-capture.ts` with `manifestWriter.addChild()` calls, then G-1b decision renders those changes obsolete (remove all write paths, generate manifest from continuity tree). Double work. | Decide G-1 FIRST. If G-1b (derivative cache) is chosen, SKIP additional wiring and implement generation function instead. |
| **F-18 Anonymous Children** | **HIGH** | Some `writeImmediateChildFile()` callers pass `undefined` subagentType (line 235), so "unknown" persists even after the "fix." The backfill hook for delegation completion only fires if `delegate-task` completion path is reached — tool-type dispatches bypass it. | Trace ALL 4 call sites of `writeImmediateChildFile()` and verify each one has agent name. Add backfill as SECONDARY defense, not primary fix. |
| **F-19 childCount Zero** | **LOW** | `incrementChildCount()` already exists and IS called from `writeImmediateChildFile()`. The 122 zero entries are historical (before CP-ST-06 wiring). P21 fix is "ensure it fires on ALL paths" — low risk because the mechanism already works for the primary path. | Add explicit test that verifies childCount increment for each child creation path. Backfill not required. |
| **F-07 Recovery Blindness** | **HIGH** | `rebuildChildToRootMain()` from continuity tree is non-deterministic when children have multiple parents (DAG topology confirmed in production). After restart, rootMain assignment depends on filesystem iteration order. | Implement G-2b (rebuild from tree) but add deterministic tiebreaker (e.g., prefer parent with longer known history). Verify against export ses_1baf which has multi-parent children. |
| **F-13 MAX_DEPTH** | **LOW** | Adding `MAX_DEPTH = 20` guard to `ensureAncestorRoute()` is a 5-LOC change. Stack overflow from SDK corruption is the theoretical risk, but production shows at most 3-level chains. | Trivial fix. Risk is only that the bound is unnecessary (but harmless). |
| **G-3 Precondition Fixes** | **MEDIUM** | Fixing `addSession()` status overwrite only addresses project-continuity status. Continuity-tree status divergence (5 of 8 children show "idle" when actually "running") is NOT fixed by this change — it needs P22. Planner may scope-creep into continuity-tree status fixes. | Document explicitly in the spec: "P21 fixes project-continuity status overwrite only. Continuity-tree status divergence is P22 scope." |
| **G-4 Gate Removal** | **MEDIUM** | Adding `persist_delegations` config key with `getCachedConfig()` returning stale cache (key missing → undefined → falsy → gate blocks). | Add `?? true` fallback: `if (config.persist_delegations ?? true !== false)`. Verify config cache refresh behavior. |

---

## Mitigation Strategies

### 1. Lock Gray Area Decisions Before Implementation

The G-1 (manifest role), G-3 (status authority), and G-4 (config key) decisions directly affect P21 implementation strategy. **Do not start coding until these are decided.** The implementation plan should sequence as:

1. Decide G-1, G-3, G-4 (human decisions needed)
2. Implement G-1 outcome (either wire manifest writes OR implement derivative cache generation)
3. Implement F-01, F-18, F-19, F-13 (independent surgical fixes)
4. Implement G-3 preconditions (status overwrite fix, logging-only reconciliation)
5. Implement G-4 gate removal (config key + test update)
6. Implement F-07 (depends on understanding continuity tree topology)

### 2. Audit ALL Copy-Paste Temp-Write Patterns

The `atomicWriteJson` → `writeFile` → `rename` pattern is copied in:
- `atomic-write.ts:40-41` (main)
- `atomic-write.ts:75-76` (appendMarkdown)
- `hierarchy-manifest.ts:203-204` (writeManifest)

ALL THREE need the `unlink(tmpPath)` fix. Do not fix only the first one.

### 3. Production Scenario Test Fixtures for F-07

The F-07 restart simulation needs real session data. Create test fixtures from the existing 37 session directories:
- Copy a representative session directory with known children
- Initialize `SessionTracker` with the fixture path
- Call `buildFromDisk()`
- Assert `childToRootMain` is correctly reconstructed

This catches the DAG non-determinism issue (multi-parent children).

### 4. Config Cache Freshness for G-4

The `getCachedConfig()` refreshes on timer or explicit invalidation. Add a test that:
1. Sets `persist_delegations: true`
2. Caches config
3. Reads `config.persist_delegations` 
4. Asserts it's `true` (not `undefined`)

If the cached config object is a snapshot from schema-defined defaults, new keys NOT in the snapshot return `undefined`. Use `?? true` as described above.

### 5. Prevent F-18 Scope Creep

The "backfill on delegation completion" sounds like "while we're here, let's also backfill historical children." **Don't.** Backfilling requires walking ALL 37 session directories and updating child JSON files for every anonymous child. This is Phase 24 (recovery redesign) territory. P21 should:
- Fix FUTURE child captures to record real agent names
- Add the backfill hook (passive — fires only when delegation completes)
- NOT rewrite historical data

### 6. Include Hierarchical Verification Gates

Each fix must have a **type-level verification gate**, not just unit tests:

| Fix | Verification Method | Evidence Required |
|-----|---------------------|-------------------|
| F-01 | Script that calls atomicWriteJson 100x then globs `*.tmp.*` | 0 temp files |
| F-17 | Create session + child via delegate-task → check manifest | Manifest has child |
| F-18 | Delegate task → read child .json | `agentName !== "unknown"` |
| F-19 | Session with 5 children → read project-continuity.json | `childCount === 5` |
| F-07 | Init tracker → register child → reinit → query classification | route === "child" |
| F-13 | Call `ensureAncestorRoute` with deep chain | No stack overflow |
