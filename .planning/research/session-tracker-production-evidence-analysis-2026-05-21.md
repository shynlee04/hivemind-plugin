# Session-Tracker: Production Evidence Analysis

**Date:** 2026-05-21
**Sources:** 3 session export files (ses_1baf, ses_1bb1, ses_1bda), .hivemind/session-tracker/ (37 session dirs), 6 CP-ST phase artifacts, 3 research artifacts
**Analyst:** gsd-advisor-researcher (subagent)
**Evidence Level:** L2-L3 (filesystem + production session evidence)

---

## Executive Summary

**18 distinct design flaws identified** across 5 categories (hierarchy, writer_logic, status, continuity_context, persistence_mapping). Top severity: **3 CRITICAL**, **7 HIGH**, **6 MEDIUM**, **2 LOW**.

This analysis extends the previous F-01-through-F-16 register with **4 new flaws (F-17 through F-20)** discovered through cross-referencing 3 production session exports against the live `.hivemind/session-tracker/` filesystem:

### Critical New Discoveries

1. **F-02's root cause claim is partially WRONG** — `hierarchy-manifest.json` IS being written (all 3 sessions have populated manifests). The earlier analysis misidentified the root cause: the manifest is written via `child-recorder.ts` / `tool-delegation.ts` but NOT via `event-capture.ts` / `tool-capture.ts`. The manifest has data, but the data has FLATTENED depth and diverges from `session-continuity.json`. The real F-02 bug is: **asymmetric manifest wiring** — some capture paths write, others don't, causing drift.

2. **33 sessions in quarantine** — The orphan quarantine at `.hivemind/session-tracker/quarantine/` holds 33 child session directories that were quarantined from 8 different root sessions. Many of these are legitimate children that belong to active root sessions, indicating the quarantine algorithm is **too aggressive**, misclassifying valid children as orphans.

3. **Zero `childCount` or `totalDelegationDepth` in project-continuity.json** — Every single session entry in the 37-session index shows `childCount: 0` and `totalDelegationDepth: 0`, even for the 3 audited sessions that have 8-49 children each. The fields exist in the schema but are NEVER populated.

---

## All Session-Tracker Related Phases (Index)

| Phase / Artifact | What It Changed | Relevance to Phase 21 |
|---|---|---|
| **CP-ST-01** session-tracker-revamp | Introduced write path, file model, event/message capture. NEVER worked from the start — `.hivemind/session-tracker/` was empty with orphaned tmp files | Foundation: Phase 21 inherits file-format decisions |
| **CP-ST-02** deep-fix-remaining | Deeper classification, pending-dispatch, child journey recording | Phase 21 inherits classification coupling |
| **CP-ST-03** architecture-detox | Removed legacy event-tracker runtime path, purified plugin assembly | Confirms Phase 21 should not re-open plugin decomposition |
| **CP-ST-04** architecture-fix | Hierarchy manifest design, root-main routing, directory architecture decisions | **CRITICAL**: Manifest IS written (contradicts earlier analysis) but wiring is asymmetric between capture paths |
| **CP-ST-05** data-loss-investigation | Exposed disk-truth failures, cross-contamination evidence report | Proved runtime evidence must outrank source-level optimism |
| **CP-ST-06** root-cause-rewrite | Session router, retry queue, root-main preservation, child capture, test rewrite | **CRITICAL**: 30 test failures → 0, but production flaws remain after rewrite |
| **Phase 13** defect-remediation | Prior fix pass, disk-truth-first correction | Over-trusted code/tests |
| **Phase 16** tool-intelligence | Read-side tools (session-tracker, session-hierarchy, session-context, hivemind-session-view) | These tools now depend on tracker persistence — Phase 21 affects read-side trustworthiness |
| **Phase 19-20** non-destructive sweep | Dead code deletion, dependency cleanup | Prerequisite for Phase 21 |
| **P00.5** (proposed) | Delete remaining dead schema files, rebuild dist | Prerequisite for Phase 21 |
| **Phase 21 (ROADMAP current)** | Session-Tracker Design Fix: fix 16 flaws | **THIS phase** |
| **Phase 22-25** (Group 1) | Status/error, dispatch, trajectory/contract, pressure | All blocked by Phase 21 |
| **Phase 34** module-splits | Structural splitting | Explicitly delayed until after Phase 21 |

---

## Session Export Analysis

### ses_1bafdc626ffeJtA6rWs1bDsI12 (10,015 LOC)

**Session ID:** `ses_1bafdc626ffeJtA6rWs1bDsI12`
**Created:** 2026-05-20T10:50:34Z
**Updated:** 2026-05-21T12:19:33Z
**Total turns:** ~45 turns (user + assistant blocks)
**Agent type:** Human user with "Build · CrofAI: mimo-v2.5-pro-precision"
**Primary activity:** Phase directory creation/deletion, ROADMAP.md restructuring, session-tracker flaws research

#### .hivemind/session-tracker/ presence:
- **Directory:** ✅ Exists at `ses_1bafdc626ffeJtA6rWs1bDsI12/`
- **session-continuity.json:** ✅ 460 LOC, populated hierarchy tree with L1 and L2 children
- **hierarchy-manifest.json:** ✅ 191 LOC, 13 flattened children listed
- **Main .md file:** ✅ `ses_1bafdc626ffeJtA6rWs1bDsI12.md` (exists)
- **Child .json files:** 17 JSON files present

#### Hierarchy structure (from session-continuity.json lines 6-100):
- Root: `ses_1bafdc626ffeJtA6rWs1bDsI12`
- L1 children: `ses_1bafc53ceffeiytsZeOGWOIcpJ` (gsd-codebase-mapper), `ses_1bafc5363ffe4yTDZFU7ImTVuZ` (gsd-codebase-mapper), etc.
- L2 children: Multiple children under L1, notably `ses_1bafc53ceffeiytsZeOGWOIcpJ` appears as child of MULTIPLE parents (correct per DAG hierarchy)
- **Hierarchy inconsistency found:** Child `ses_1bafc53ceffeiytsZeOGWOIcpJ` appears under 3 different parents in continuity tree but is listed once at depth 2 in manifest. Which parent is canonical?

#### Key findings:
1. **Temp file evidence (F-01):** Git status blocks show `project-continuity.json.tmp.1779307372108` appearing in 3 separate snapshots (session file lines ~901, 1284, 1423). Same timestamp across all 3 — the temp file persists, is cleaned at startup, then re-created.
2. **Manifest IS populated (F-02 correction):** hierarchy-manifest.json has 13 children with correct metadata (subagentType, delegatedBy, depth). BUT the manifest shows ALL children at depth 2 (parentSessionID: `ses_1b57e0294...`), while continuity tree shows them at depth 1 under root.
3. **Missing child from manifest (F-02b):** `ses_1b59c269affeyfaR0ObMeG3zaq` appears in continuity tree with nested descendants but is **missing from hierarchy-manifest.json**. This is a manifest hole.
4. **Duplicate children in continuity tree:** `ses_1bafc53ceffeiytsZeOGWOIcpJ` (L2) appears under 4 different L1 parents simultaneously, suggesting the DAG write path does not de-duplicate.

---

### ses_1bb1cf1e0ffe478KZ4HwJgUCN6 (10,513 LOC)

**Session ID:** `ses_1bb1cf1e0ffe478KZ4HwJgUCN6`
**Created:** 2026-05-20T10:16:31Z
**Updated:** 2026-05-21T03:07:29Z
**Agent type:** Human user with "Build · CrofAI: mimo-v2.5-pro-precision"
**Primary activity:** Phase 19-20 directory creation, ROADMAP.md restructuring

#### .hivemind/session-tracker/ presence:
- **Directory:** ✅ `ses_1bb1cf1e0ffe478KZ4HwJgUCN6/`
- **session-continuity.json:** ✅ 3,952 LOC (largest of the 3)
- **hierarchy-manifest.json:** ✅ 646 LOC, 49 children
- **Child .json files:** 51 JSON files (49 children + 2 additional records)
- **Main .md file:** ✅ `ses_1bb1cf1e0ffe478KZ4HwJgUCN6.md`

#### Key findings:
1. **Manifest holes:** `ses_1b90978a3ffeL0CQ237aUWVYgr` appears in session export (task_id found in transcript) and continuity tree but is **missing from hierarchy-manifest.json**.
2. **Child metadata quality:** Most children have proper `delegatedBy` and `subagentType` fields, but some show `"gsd-codebase-mapper"` which is a development/debugging agent, not user-intended.
3. **turnCount = 0 in manifest:** All 49 manifest children show `"turnCount": 0` despite clearly having executed turns. The turn count field is never updated.
4. **project-continuity diverges:** This session's entry in `project-continuity.json` shows `childCount: 0` despite having 49 children.

---

### ses_1bda22cc3ffebCEHYfj5Djbuyc (10,716 LOC)

**Session ID:** `ses_1bda22cc3ffebCEHYfj5Djbuyc`
**Created:** 2026-05-19T22:31:45Z
**Updated:** 2026-05-20T06:31:33Z
**Agent type:** Human user with "Build · CrofAI: mimo-v2.5-pro-precision"
**Primary activity:** Phase 16 UAT testing — delegation, session tools, hierarchy exploration

#### .hivemind/session-tracker/ presence:
- **Directory:** ✅ `ses_1bda22cc3ffebCEHYfj5Djbuyc/`
- **session-continuity.json:** ✅ 101 LOC
- **hierarchy-manifest.json:** ✅ 113 LOC, 8 children
- **Child .json files:** 11 JSON files
- **Main .md file:** ✅ `ses_1bda22cc3ffebCEHYfj5Djbuyc.md`

#### Hierarchy structure (from session-continuity.json):
- Root: `ses_1bda22cc3ffebCEHYfj5Djbuyc`
- L1 children: 8 total
- **L2 delegates exist:** `ses_1c56bddc2ffe3DEHK2jkYCGQAz` (hm-l2-build) under `ses_1c571efb0ffeIloZPzsnqS0P0y` (hm-l2-researcher)
- **Full 3-level chain observed:** L0 (root) → L1 (hm-l2-researcher) → L2 (hm-l2-build)

#### Key findings: **CRITICAL data quality issues**

1. **4 of 8 children have `delegatedBy: "unknown"`** — The session export shows clear agent identity (e.g., `ses_1bda03a34ffek7NUrdj7Rv6V0Y` was dispatched as `hm-l2-researcher`), but the persisted child JSON and manifest both record `agentName: "unknown"`, `subagentType: "unknown"`, `mainAgent.name: "pending"`.

2. **Verified using direct file inspection:**
   - Session export line 265: `"agent": "hm-l2-researcher"` for `ses_1bda03a34ffek7NUrdj7Rv6V0Y`
   - Persisted child.json line 6: `"agentName": "unknown"` for the same session
   - **Data loss severity: HIGH** — agent identity is available at runtime but never captured to disk

3. **Status divergence:** session-continuity.json shows `"status": "idle"` for 5 of 8 children, while children in session export had `"status": "running"` and `"executionState": "confirmed"`. The tracker status field is stale/incorrect.

4. **L2 children missing from exported root transcript:** `ses_1c56bddc2ffe3DEHK2jkYCGQAz` and `ses_1c5660edcffeEBRK8DMQIl5VNp` are persisted in `.json` files but have **NO corresponding entries in the root session export** — they exist only in persistence.

---

## .hivemind/session-tracker Reality Check

### Directory Structure Summary

| Item | Count | Notes |
|------|-------|-------|
| Root session directories | 37 | Each has session-continuity.json + child .json files |
| Hierarchy manifests populated | 37/37 | All manifests written (contradicts F-02 partial claim) |
| Orphan quarantine directories | 33 | Legitimate children misclassified as orphans |
| project-continuity.json entries | 122 sessions | But ALL show childCount: 0, depth: 0 |
| Temp files | 0 | Currently clean (post-startup cleanup ran) |

### Critical Findings

1. **Manifest IS written but asymmetric:** Every session directory has a populated `hierarchy-manifest.json`. The earlier F-02 root cause ("manifest writer never called") was based on git status analysis of `ses_1baf.md` which didn't see manifest changes because the manifest writes happen via `child-recorder.ts` path, not the `event-capture.ts` path that the session export captured.

2. **Manifest holes exist:** `ses_1b59c269...` missing from `ses_1baf` manifest, `ses_1b90978a...` missing from `ses_1bb1` manifest. These are children that only appear in continuity trees, not manifests.

3. **project-continuity.json is systematically wrong:**
   - `childCount: 0` for ALL 122 entries despite children existing
   - `totalDelegationDepth: 0` for ALL entries
   - The schema supports these fields but they are NEVER populated
   - This is the root cause of `hivemind-session-view` showing `childCount: 0` and `status: "unknown"`

4. **Quarantine is too aggressive:** 33 quarantined directories, including sessions that have valid continuity tree entries and should be active children (e.g., `ses_1c571efb0ffeIloZPzsnqS0P0y` which has 2 L2 children).

5. **No temp files currently:** The startup cleanup (`.tmp.*` sweep) has run, so no leaked tmp files exist at rest. But during the production session (ses_1baf), 3 separate git status snapshots captured the same stale `.tmp.1779307372108` file — confirming the F-01 leak happens during active sessions.

---

## Edge Case Analysis

### A: Multi-compact session rebuild

**Scenario:** A session runs through many compacts with many sub-sessions. User rebuilds dist/ and returns to the old session to continue.

**Current system behavior:**

1. **Compaction events ARE captured** — `event-capture.ts:handleSessionCompacted()` writes a compaction block to the root `.md` file. This data survives restarts because it's in the durable `.md` file.

2. **BUT: in-memory state is LOST** — After rebuild: `hierarchyIndex.childToParent` is empty, `PendingDispatchRegistry` is empty. The system must rebuild from disk via `buildFromDisk()`.

3. **buildFromDisk risks:**
   - Reads `session-continuity.json` files — if ONE is corrupt, ALL children for that session are silently lost (F-04)
   - `project-continuity.json` may be stale from a crash during write (F-08)
   - `childToRootMain` mapping is reconstructed from continuity tree, but if `resolveWriteParent()` used fallback-to-immediate-parent during the session (F-03), some children were written to the WRONG directory and are invisible to rebuild

4. **What breaks:**
   - **Classification fails:** Previously registered children are classified as `"unknownSub"` instead of `"child"`, causing the `handleChatMessage` guard to **silently drop child messages** (F-07)
   - **Turn counts reset:** `seedTurnCounters()` parses existing `.md` files, but if any `.md` file was corrupted during crash, turn counts start from zero
   - **Retry queue lost:** `PendingDispatchRegistry` entries for in-flight writes disappear — pending dispatches are never retried

5. **Data loss severity: HIGH** — Children exist on disk but the system cannot find them. After a multi-compact session with 50+ delegates, most of the delegation history becomes invisible after rebuild.

**Verdict:** NOT restart-safe. The system can partially recover (durable files exist) but children classification and status management break silently.

---

### B: Deleted .hivemind/session-tracker rebuild

**Scenario:** User deletes `.hivemind/session-tracker/` entirely, rebuilds dist/, then resumes an old session.

**Current system behavior:**

1. **Session data is UNRECOVERABLE** — `.hivemind/session-tracker/` is the sole durable persistence root (per Q6). There is no secondary copy, no backup, no WAL.

2. **What still works:**
   - OpenCode's own session transcripts (in OpenCode's internal storage) still exist — the agent can still load the session
   - The harness does NOT block resumption — it simply starts fresh with empty tracker state

3. **What is lost forever:**
   - All delegation hierarchy (parent-child relationships)
   - All child session data (child .json files, journey records, turn history)
   - project-continuity.json (session index, status, timestamps)
   - All hierarchy manifests
   - All continuity trees

4. **Downstream impact:**
   - `hivemind-power-on` skill reads session-tracker data — returns empty
   - `session-tracker` tool returns empty results
   - `session-hierarchy` tool returns empty manifests
   - `session-context` aggregation returns nothing
   - `hivemind-session-view` shows empty state

5. **Active delegation recovery:** Delegations that were in-flight at time of deletion have records in `.opencode/state/delegations.json` (if `commit_docs` config is enabled — which it's NOT by default per F-21). So even delegation records may be lost.

**Verdict:** CATASTROPHIC data loss. The system has no backup, no replication, no recovery path. This is a known risk per Q6 but the single-point-of-failure is unmitigated.

---

### C: Fork/Redo/Undo

**Scenario:** Fork sessions, redo, undo operations create complex write patterns.

**Current system behavior:**

1. **No fork awareness** — The session-tracker has zero concepts of forks, branches, or parallel timelines. All sessions are written to flat `.hivemind/session-tracker/{sessionId}/` directories.

2. **Rewriting a session that already exists:**
   - The system uses `atomicWriteJson` (write-to-tmp → rename) which is NOT atomic on macOS APFS when `TMPDIR` is on a different volume (F-01 root cause).
   - If a fork creates multiple sessions with overlapping child IDs, the second write will **silently overwrite** the first — no collision detection, no merge strategy.

3. **Orphan cleanup on undo:**
   - When a session is undone, the `delete` lifecycle event fires, which calls `session.deleted` → writes `status: "deleted"` to continuity
   - BUT: child `.json` files are NOT cleaned up — they remain in the root main's directory with `status: "active"` 
   - The orphan quarantine (`cleanupOrphanDirectories()`) scans for directories with no parent reference — but if the parent exists (just marked deleted), the orphan stays
   - **Result:** Undone sessions leave ghost children with "active" status

4. **Hierarchy consistency across undo:**
   - `hierarchy-manifest.json` is append-only — children are added but never removed. Undoing a delegation does NOT remove the child from the manifest.
   - The continuity tree status changes to "deleted" but the entry remains in the tree
   - **Result:** The manifest consistently over-reports active children

**Verdict:** MODERATE risk. No active fork support, children ghosted after undo. The current design assumes a single linear timeline.

---

### D: 3-level-depth delegation naming

**Scenario:** L0→L1→L2→L3 delegation chain with complex naming.

**Current system behavior:**

1. **Depth cap at 2 (F-12):** `types.ts:61` defines `delegationDepth: 0 = root, 1 = child, 2 = grandchild`. At `hierarchy-index.ts:299`, depth is capped with `Math.min(depth, 2)`. This means L3 is silently collapsed into L2.

2. **Production evidence shows L2 exists:**
   - `ses_1bda` continuity tree shows `ses_1c571efb0ffeIloZPzsnqS0P0y` (L1, hm-l2-researcher) with children `ses_1c56bddc2ffe3DEHK2jkYCGQAz` (L2, hm-l2-build) and `ses_1c5660edcffeEBRK8DMQIl5VNp` (L2, hm-l2-scout)
   - This is a genuine 3-level chain: L0 (root) → L1 (researcher) → L2 (build/scout)
   - Depth=2 is correctly recorded in persistence

3. **manifest vs continuity tree naming:**
   - Continuity tree: nested structure with `children: {}` at each level. L2 appears under L1's children block.
   - Manifest: FLATTENED. All children listed at top level with their `delegationDepth` numeric field. `ses_1c56bddc2ffe3DEHK2jkYCGQAz` appears at depth 2, directly under root, losing the L1→L2 parent relationship.

4. **Session ID naming convention:**
   - `ses_` prefix + hex suffix (e.g., `ses_1bda22cc3ffebCEHYfj5Djbuyc`)
   - No encoding of depth, parent, or agent type in the ID
   - No consistent short-name convention for cross-referencing

5. **What breaks at 3-level depth:**
   - `getRootMain()` for L3 returns wrong result if children are registered before parents (reverse order — RC-1 from CP-ST-06)
   - L3 child writes target L2's directory instead of root main directory (F-03)
   - After restart, L3 children may be classified as `"unknownSub"` and dropped (F-07)
   - Manifest shows L3 at depth 2 (wrong depth), losing the distinction

**Verdict:** 3-level chain works for simple cases but breaks under reverse-order registration, restart, and deep hierarchies. The depth=2 cap is actively harmful for real production patterns.

---

## Extended Flaw Register (F-17 onward)

| ID | Type | Severity | File Reference | Description | Impact | Edge Cases |
|----|------|----------|---------------|-------------|--------|------------|
| **F-17** | persistence_mapping | HIGH | `event-capture.ts`, `tool-capture.ts` vs `tool-delegation.ts`, `child-recorder.ts` | **Asymmetric manifest wiring**: `hierarchy-manifest.json` IS written (contradicting F-02's root cause), but only by the `child-recorder.ts`/`tool-delegation.ts` path, NOT by `event-capture.ts`/`tool-capture.ts`. This means root session event-capture NEVER updates the manifest. Manifest contains only delegate-task children, not tool-call or event-based children. Some children (e.g., `ses_1b59c269...`, `ses_1b90978a...`) appear in continuity trees but are MISSING from manifests. | Manifest is a partial view. Tools reading manifest miss children that only exist in continuity trees. Read-side tools (`session-hierarchy`, `hivemind-session-view`) using manifest for "complete" delegation list return incomplete results. | A, B, C |
| **F-18** | persistence_mapping | CRITICAL | `event-capture.ts:428-467`, `tool-capture.ts:125-137` | **Delegate-task children captured as anonymous placeholders**: When `delegate-task` is dispatched, `event-capture.ts` creates immediate child files with fallback `subagentType: "unknown"` and `mainAgent.name: "pending"`. The real agent identity (`hm-l2-researcher`, `hm-l2-auditor`) is available at runtime in `delegation-status` output but is NEVER backfilled into the child file. Evidence: session export shows `agent: "hm-l2-researcher"` (L265) but persisted child JSON shows `agentName: "unknown"` (ses_1bda03a34ffek7NUrdj7Rv6V0Y.json:6). | 4 of 8 children in ses_1bda have unknown agent type. Audits cannot reliably reconstruct who created a child or why. Session recovery cannot determine which agent handled each child. After restart, children are unidentifiable. | A, B, D |
| **F-19** | status | HIGH | `project-index-writer.ts:168-225`, `project-continuity.json` | **`childCount` and `totalDelegationDepth` NEVER populated**: The project-continuity.json schema has fields for `childCount` and `totalDelegationDepth` but they are constantly written as `0` for ALL 122 session entries. The `updateSession()` method never computes these values — it just spreads `...existing, ...updates` and neither field is included in any caller's update payload. | `hivemind-session-view` reports `childCount: 0` for ALL sessions. The unified session view is useless for understanding hierarchy size. Any tool depending on these fields for filtering or display is broken by design. | A, B, C |
| **F-20** | hierarchy | MEDIUM | `orphan-cleanup.ts`, `.hivemind/session-tracker/quarantine/` | **Orphan quarantine is too aggressive — quarantines legitimate children**: The quarantine/ directory contains 33 subdirectories, many of which are VALID children of active root sessions. Example: `ses_1c571efb0ffeIloZPzsnqS0P0y` is quarantined but exists in `ses_1bda`'s continuity tree with 2 L2 children. The quarantine algorithm misclassifies any session whose parent directory doesn't match the root main's expected structure. | Legitimate delegation history is hidden in quarantine. Recovery paths don't check quarantine. Children are effectively lost from the active hierarchy even though they contain valid data. | B, C |
| **F-21** | continuity_context | MEDIUM | `delegation-persistence.ts:58-64` | **Delegation persistence gated by `commit_docs` config flag**: `persistDelegations()` returns early when `config.commit_docs` is false. The audited sessions have ZERO entries in `.hivemind/state/delegations.json` despite having 10+ delegate-task dispatches. The delegation store is effectively disabled by default. | The primary delegation record store is empty. `hivemind-session-view` cannot find delegation records. Recovery has no delegation reference to rebuild parent-child relationships. | A, B |
| **F-22** | writer_logic | MEDIUM | `project-continuity.json` (all 122 entries) | **ALL 122 session entries share a single lastUpdated timestamp**: Every entry in project-continuity.json shows `"updated": "2026-05-21T12:35:17.XXXZ"` — the same second for all sessions. The per-entry `updated` timestamp is not actually per-session; it's the global last-write time of the project-continuity.json file itself. Individual session staleness is invisible. | Cannot determine which sessions are truly current vs stale. If a session was last active 24 hours ago, its `updated` timestamp falsely shows it was active 1 second ago. | A, C |

---

## Phase 21 Context Report

### What MUST be fixed in Phase 21 (P0-P1)

| Priority | Flaw | Fix Description | Effort | Approach |
|----------|------|----------------|--------|----------|
| **P0** | F-01 temp leak | Fix atomic write: clean up tmp file AFTER successful rename (not at next startup). Add TMPDIR validation to ensure rename is truly atomic (same volume). | 1 file, ~20 LOC | **Surgical** — fix `atomicWriteJson()` post-rename cleanup |
| **P0** | F-18 anonymous children | Wire `delegate-task` metadata capture: capture agent name, model, description in event-capture BEFORE creating child file. Backfill `pending` → real agent identity when delegation completes. | 2 files, ~50 LOC | **Surgical** — fix `event-capture.ts` writeImmediateChildFile to accept real metadata, add backfill hook in delegation completion |
| **P0** | F-19 childCount not populated | Add child-count computation to `updateSession()` in project-index-writer. Walk hierarchy tree to count children and max depth before writing project-continuity.json. | 1 file, ~30 LOC | **Surgical** — fix the update payload |
| **P1** | F-02 (corrected) manifest asymmetry | Wire hierarchy manifest writer into `event-capture.ts` and `tool-capture.ts` paths (currently only `tool-delegation.ts` writes it). Add manifest update on session.created from event-capture. | 2 files, ~30 LOC | **Surgical** — add `manifestWriter.addChild()` calls in missing paths |
| **P1** | F-07 recovery blindness | Persist `childToRootMain` mapping to disk so it survives restart. Add fallback in `buildFromDisk()` to reconstruct from `session-continuity.json` hierarchy tree. | 3 files, ~100 LOC | **Redesign** — add durable childToRootMain index file, modify rebuild sequence |
| **P1** | F-17 manifest holes | Add continuous reconciliation: after each manifest write, cross-check against continuity tree and insert missing children. OR make continuity tree the single source of truth and deprecate flattened manifest. | 2 files, ~60 LOC | **Surgical** — add reconciliation loop or deprecate manifest |

### What should be deferred to Phase 22-25

| Flaw | Defer To | Rationale |
|------|----------|-----------|
| F-03 fragmented writes | Phase 22 | Requires status unification — P21 can add guardrails but final fix depends on single status authority |
| F-05 status divergence | Phase 22 | Status unification is Phase 22's explicit purpose |
| F-04 buildFromDisk silent skip | Phase 24 | Trajectory redesign will change recovery semantics |
| F-10 queue deadlock | Phase 25 | Pressure/notification redesign changes write queue strategy |
| F-12 depth cap | Phase 23 | Dispatch redesign will define new depth semantics |
| F-20 quarantine aggressiveness | Phase 24 | Depends on recovery/rebuild changes |
| F-21 delegation persistence gate | Phase 23 | Part of delegate-task fix |
| F-22 timestamp issue | Phase 22 | Part of status unification |

### Recommended approach (surgical vs redesign per flaw)

| Approach | Flaws | Count | Rationale |
|----------|-------|-------|-----------|
| **Surgical** | F-01, F-02, F-17, F-18, F-19 | 5 | All are isolated write-path bugs with clear fix scope. No new abstractions needed. |
| **Redesign** | F-07, F-08 | 2 | Both require durable persistence of in-memory state — new file format or index schema needed. |
| **Defer** | F-03, F-04, F-05, F-10, F-12, F-20, F-21, F-22 | 8 | Each requires a redesign in a later phase that has explicit scope for it. |

### Phase 21 Exit Gates

| Gate | Evidence Required |
|------|------------------|
| **F-01** | After 100 atomic writes in a test loop, 0 `.tmp.*` files remain on disk. Verify with `glob *.tmp.*` in session-tracker directory. |
| **F-02** | New session.create in a test harness: verify `hierarchy-manifest.json` is updated via `event-capture.ts` path (not just `tool-delegation.ts`). |
| **F-17** | Verify all children in continuity tree exist in manifest (or document manifest deprecation path). |
| **F-18** | delegate-task child: verify persisted JSON has correct `agentName`, `subagentType`, `model`, not `"unknown"`. |
| **F-19** | project-continuity.json entry for a session with 5 children shows `childCount: 5`, not `0`. |
| **F-07** | Restart scenario: verify previously registered children are classified as `"child"` not `"unknownSub"`. |
| **Regression** | All 2,382+ tests pass. Typecheck clean. No new test failures in session-tracker suite. |

---

## References

1. `.planning/research/session-tracker-flaws-analysis-2026-05-21.md` — Original 16-flaw register (F-01 through F-16)
2. `.planning/research/session-tracker-evidence-audit-2026-05-21.md` — Evidence audit with 6 additional findings
3. `.planning/research/session-tracker-phase-implementation-map-2026-05-21.md` — Phase map and downstream impacts
4. `.planning/research/phase-reordering-final-recommendation-2026-05-21.md` — Phase reordering with P21 context
5. `.planning/research/deep-analysis-features-2026-05-21.md` — Feature assessment (7,745 LOC session-tracker deep dive)
6. `/Users/apple/hivemind-plugin-private/session-ses_1baf.md` — Production session 1 (10,015 LOC)
7. `/Users/apple/hivemind-plugin-private/session-ses_1bb1.md` — Production session 2 (10,513 LOC)
8. `/Users/apple/hivemind-plugin-private/session-ses_1bda.md` — Production session 3 (10,716 LOC)
9. `.hivemind/session-tracker/` — Live filesystem (37 session dirs, 33 quarantined entries)
10. `.planning/phases/CP-ST-01/` through `.planning/phases/CP-ST-06/` — All session-tracker phase specs
11. `.planning/debug/cp-st-01-session-tracker-failure.md` — CP-ST-01 root cause analysis
