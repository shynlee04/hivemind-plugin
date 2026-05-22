# Session-Tracker: Unified Flaw Register and Phase 21 Context

**Date:** 2026-05-21
**Sources:** 4 cross-referenced discovery documents
**Analyst:** gsd-advisor-researcher

## Executive Summary

The 4 session-tracker discovery documents collectively identify **22 distinct design flaws (F-01 through F-22)** across 6 categories. After cross-referencing and resolving contradictions, the unified severity distribution is: **3 CRITICAL, 8 HIGH, 9 MEDIUM, 2 LOW**.

**Critical unified finding:** The session-tracker persistence system has no single authoritative truth source. Hierarchy data is written to 4 separate stores (child JSON, session-continuity.json, hierarchy-manifest.json, project-continuity.json) by 4 different code paths, with zero cross-validation. This structural problem — not any individual bug — is the root cause that Phase 21 must address.

**Most urgent fix (P0):** F-01 temp leak + F-18 anonymous children + F-19 childCount zero — three surgical fixes that directly unblock Phase 22-28 downstream phases.

## Conflicts Resolved

### Conflict 1: F-02 Root Cause — "Manifest never written" vs "Manifest written but asymmetric"

| Document | Claim | Evidence Basis |
|----------|-------|---------------|
| Doc 2 (Flaws Analysis) | `hierarchy-manifest.json` changes NEVER appear in git status. Writer is dead code / never called. | Git status analysis of `ses_1baf.md` session export — only saw `project-continuity.json` and `session-continuity.json` changes. |
| Doc 4 (Production Evidence) | ALL 37 session directories have populated manifests. Manifest IS written, but only by `tool-delegation.ts`/`child-recorder.ts` path, NOT by `event-capture.ts`/`tool-capture.ts`. | Direct `.hivemind/session-tracker/` filesystem inspection. Source code path analysis. |
| Doc 1 (Evidence Audit) | Manifest has holes — `ses_1b59c269...` and `ses_1b90978a...` missing from manifests but present in continuity trees. | Exported session transcripts vs persisted files comparison. |

**Resolution:** Doc 4's filesystem evidence (L2) outranks Doc 2's git-inference evidence (L3). The manifest IS being written. The real bug is **asymmetric wiring**: the `event-capture.ts` and `tool-capture.ts` paths (which handle root session events and tool calls) NEVER update the manifest. Only `tool-delegation.ts` (which handles `delegate-task` dispatches) writes to it. This means:
- All root session tool-call and event-based children are missing from manifests.
- The manifest is a partial, biased view — only shows delegate-targeted children.
- Children visible in continuity trees (which ARE written by event-capture) may be absent from manifests.

**Reclassified as:** F-17 for the asymmetric wiring (HIGH), with the original F-02 redefined as "hierarchy-manifest has holes" (MEDIUM — symptom, not root cause).

### Conflict 2: F-21 Severity — "Critical" vs "Medium"

| Document | Severity | Rationale |
|----------|----------|-----------|
| Doc 1 (Evidence Audit) | CRITICAL | "Delegations.json is not a usable source of live delegation truth" — no live rows for audited sessions. |
| Doc 4 (Production Evidence) | MEDIUM | Gated by `commit_docs` config flag; `persistDelegations()` returns early. |

**Resolution:** HIGH (compromise). The technical scope is MEDIUM (simple config gate), but the impact is CRITICAL (no delegation persistence by default). The severity = impact×fix_effort curve lands at HIGH because:
- The fix is trivial (remove the `commit_docs` gate or add a separate `persist_delegations` flag)
- But the consequence is severe (all delegation records silently lost by default)

### Conflict 3: F-03 Severity — "High" vs "Medium"

| Document | Severity | Rationale |
|----------|----------|-----------|
| Doc 2 (Flaws Analysis) | HIGH | Fragmented child writes lose data that recovery can't find. |
| Doc 4 (Production Evidence) | MEDIUM | Falls under "defer to later phase" — guardrails exist but final fix depends on status unification. |

**Resolution:** Keep HIGH. Doc 2 is correct that fragmented writes cause data invisible to recovery. The fragmented writes exist (session evidence in ses_1bda proves `resolveWriteParent` fallback fired). This should be fixed or at least guardrailed in P21 even if the architectural unification happens later.

## Gaps Found

### Gap 1: F-17 to F-22 Only in Doc 4
The production evidence analysis (doc 4) extends the register to F-22. These 6 flaws are completely absent from the original 16-flaw analysis (doc 2):
- F-17: Asymmetric manifest wiring
- F-18: Anonymous children (overlaps with doc 1 finding #3)
- F-19: childCount/delegationDepth never populated
- F-20: Quarantine too aggressive
- F-21: Delegation persistence gated by commit_docs
- F-22: Shared timestamp in project-continuity.json

**Implication:** The original 16-flaw analysis was incomplete. Phase 21 scope must be based on the full 22-flaw register.

### Gap 2: Doc 1's 6 Findings Not Mapped to F-IDs
The evidence audit (doc 1) uses descriptive findings rather than F-IDs. Mapping:
| Doc 1 Finding | Maps to | Notes |
|---------------|---------|-------|
| #1: Malformed child IDs | F-07 (partial) | get-children tool issue — depth=0, .json suffix |
| #2: Continuity/manifest drift | F-02 + F-17 | Overlapping with both |
| #3: Unknown delegate-task children | F-18 | Exact match |
| #4: Lossy .md files | F-09 | Not a separate flaw |
| #5: Session-view wrong metadata | F-19 | Exact match |
| #6: Delegations.json unusable | F-21 | Exact match |

### Gap 3: No Document Addresses Test Infrastructure Gaps
None of the 4 documents analyze whether existing tests cover the identified flaws. A test-gap analysis is needed but not present in any source document.

### Gap 4: Q6 Migration Status Unverified
Doc 2 identifies F-15 (Q6 migration incomplete) as MEDIUM, but no document has verified whether `.opencode/state/` → `.hivemind/state/` migration has actual data that would cause conflict. This is an unverified assumption.

## Corroborations Confirmed

| Flaw | Agreement Across Docs | Evidence Strength |
|------|----------------------|-------------------|
| **F-01 temp leak** | Docs 2, 4 (confirmed), Doc 1 (implied by startup cleanup), Doc 3 (acknowledged in flaw inventory) | **L2 filesystem** — same tmp.1779307372108 file captured in 3 git status snapshots |
| **F-07 recovery blindness** | Docs 2 (HIGH), 3 (mandatory exit gate), 4 (HIGH — restart scenario analysis) | **L2 session export + L3 code path** — consistent across 3 analyses |
| **F-18 anonymous children** | Doc 1 finding #3 (CRITICAL), Doc 4 F-18 (CRITICAL) | **L2 filesystem** — 4 of 8 children show `agentName: "unknown"` in persisted files |
| **F-19 childCount=0** | Doc 1 finding #5 (HIGH), Doc 4 F-19 (HIGH) | **L2 filesystem** — ALL 122 project-continuity.json entries show `childCount: 0` |
| **F-02 manifest holes** | Doc 1 finding #2 (HIGH), Doc 4 F-17 (HIGH) | **L2 filesystem** — `ses_1b59c269...` and `ses_1b90978a...` missing from manifests |
| **F-21 delegation persistence** | Doc 1 finding #6 (CRITICAL), Doc 4 F-21 (MEDIUM) | **L2 filesystem** — `.hivemind/state/delegations.json` has only 1 unrelated sample entry |

## Unified Flaw Register (F-01 to F-22)

### Legend
- **Severity:** CRITICAL, HIGH, MEDIUM, LOW
- **Evidence Level:** L2 (live filesystem proof), L3 (code inspection + session export), L4 (code inference only)
- **Fix Approach:** Surgical (isolated, <50 LOC), Redesign (new abstraction), Defer (explicitly to later phase)

| Flaw | Severity | Root Cause (Synthesized) | Impacted Path | Fix Approach | Evidence Level | Consensus Notes |
|------|----------|--------------------------|---------------|--------------|----------------|-----------------|
| **F-01** | CRITICAL | `atomicWriteJson()` creates temp file at same-path.tmp.${timestamp} but only cleans up via `orphanCleanup` at startup. During a live session, temp files ACCUMULATE. On macOS APFS, rename() is NOT atomic across volumes — if TMPDIR is on a different filesystem, the temp file persists after rename. | `persistence/atomic-write.ts:37`, `persistence/orphan-cleanup.ts` | **Surgical** — add `unlink(tmpPath)` after successful `rename()`; validate same-volume rename | L2 (filesystem) | Agreed CRITICAL across all 4 docs. Session evidence shows same temp file in 3 snapshots. |
| **F-02** | MEDIUM (reclassified) | `hierarchy-manifest.ts:58-90` contains `addChild()` method that requires explicit `rootMainSessionID`. The manifest IS written via `tool-delegation.ts` path, but `event-capture.ts`/`tool-capture.ts` paths NEVER call it, causing selective omission of children from the manifest. Individual children missing: `ses_1b59c269...`, `ses_1b90978a...`. | `persistence/hierarchy-manifest.ts`, `capture/event-capture.ts`, `capture/tool-capture.ts` | **Surgical** — add `manifestWriter.addChild()` calls in missing paths | L2 (filesystem) | **Root cause corrected from original analysis.** Manifest is not dead code; it's asymmetric. |
| **F-03** | HIGH | `child-writer.ts:106-113` `resolveWriteParent()` falls back to `immediateParentID` when `getRootMain()` returns undefined. During child-discovery-to-rootMain-resolution window, child .json files are written to the immediate parent's directory instead of the root main's directory. After rootMain resolves, writes go to the correct location, but earlier writes are stranded. Recovery reads only from root main directories. | `persistence/child-writer.ts:106-113`, `persistence/hierarchy-index.ts:71` | **Defer to P22** (guardrails in P21) | L3 (code path + session export) | Fragmented writes cause data invisible to recovery. |
| **F-04** | HIGH | `hierarchy-index.ts:94-137` `buildFromDisk()` catch block at L122-124 silently skips corrupt or unparseable `session-continuity.json` files. If one file in a multi-session directory is corrupt, ALL children for that session are lost — no warning, no quarantine, no recovery path. | `persistence/hierarchy-index.ts:94-137` | **Defer to P24** (trajectory redesign changes recovery) | L3 (code analysis) | Silent data loss on corruption. |
| **F-05** | HIGH | Status stored in 3 locations — child .json `status`, `hierarchy-manifest.json` `status`, `ProjectSessionEntry.status` — with ZERO reconciliation. A child can be "completed" in one store but "active" in another. No documented priority or consistency check. | `persistence/hierarchy-manifest.ts:103-117`, `persistence/child-writer.ts:290-307`, `types.ts:67,121,306` | **Defer to P22** (status unification) | L3 (code analysis) | Three-way status divergence across stores. |
| **F-06** | MEDIUM | `hierarchy-index.ts:182-201,213-221` `registerChild()` propagates rootMain to descendants before the full parent chain is known. If L1→L2 is registered before root→L1, some descendants get stale/wrong `rootMain` assignments for the rest of the session. | `persistence/hierarchy-index.ts:182-221` | **P3 surgical** — fix propagation order | L4 (code inference) | Reverse-order registration edge case. |
| **F-07** | HIGH | `childToRootMain` mapping and `PendingDispatchRegistry` are in-memory only — lost on restart. After restart, `buildFromDisk()` re-populates from `session-continuity.json`, but if the last write was missed (async best-effort), children are gone. Previously registered children classified as `unknownSub` → `handleChatMessage` guard **silently drops** child chat messages after restart. | `session-tracker/index.ts:359-366`, `classification.ts`, `session-router.ts` | **Redesign** — persist `childToRootMain` to disk | L2 (session export + code) | The "restart blindness" problem. Children exist on disk but classification fails. |
| **F-08** | HIGH | `SessionRecovery.initialize()` reads `project-continuity.json` ONCE at startup. If a crash occurred during a write (F-01 scenario), the file on disk is stale. One-shot read has no retry or validation. Sessions created in last N minutes before crash are absent from the recovery map. | `recovery/session-recovery.ts:320-324`, `session-tracker/index.ts:467-468` | **Redesign** — add retry/validation to project-continuity read | L3 (code + edge case analysis) | Recovery sees stale session list after crash. |
| **F-09** | MEDIUM | `persistence/` directory has 9 files, 2,271 LOC for simple JSON write operations. Multiple serial write queues (per-child, per-project, global retry), reverse indices, stale queue detection. Complexity hides bugs behind promise chains and catch-all error handlers that NEVER propagate. | `persistence/` (9 files) | **Defer to P34** (module splits) | L3 (code analysis) | Maintenance burden hides bugs. Over-engineering. |
| **F-10** | MEDIUM | Serial write queues use promise-chaining (`this.writeQueue = this.writeQueue.then(...)`) with error swallowing (`.catch(() => {})`). `detectStaleQueue()` resets after 5-min inactivity but only fires on NEW enqueue. If a promise hangs, no new writes arrive to trigger detection → permanent deadlock. | `persistence/child-writer.ts:48,147-176`, `persistence/project-index-writer.ts:57,331-352` | **Defer to P25** (pressure redesign) | L3 (code analysis) | Queue deadlock risk amplified by async conversion. |
| **F-11** | MEDIUM | `recovery/session-recovery.ts:241-251` `isSessionFileParseable()` checks for `---` or `## ` markers — extremely weak validation. A truncated file with valid markdown headers passes. Does NOT validate JSON, YAML frontmatter, or data integrity. | `recovery/session-recovery.ts:241-251` | **Defer to P24** (recovery redesign) | L3 (code analysis) | Accepts truncated/corrupt files as parseable. |
| **F-12** | MEDIUM | `types.ts:61` defines `delegationDepth: 0 = root, 1 = child, 2 = grandchild`. `hierarchy-index.ts:299` caps depth with `Math.min(depth, 2)`. Any 3+ level delegation silently collapses L3 into L2. Production evidence shows 3-level chains exist (L0→researcher→build/scout in ses_1bda). | `types.ts:61`, `hierarchy-index.ts:299` | **Defer to P23** (dispatch redesign) | L2 (filesystem — 3-level chain observed) | System lies about delegation depth. |
| **F-13** | MEDIUM | `ensureAncestorRoute()` recursively calls `this.getSessionSafely()` with a `seen` Set for cycle detection but NO `MAX_DEPTH` guard. SDK bug or corrupt session data causes infinite recursion → stack overflow → kills entire tool execution. | `session-tracker/index.ts:375-388` | **P3 surgical** — add MAX_DEPTH guard | L4 (code inference) | Stack overflow risk on corrupt SDK data. |
| **F-14** | MEDIUM | `project-index-writer.ts:168-225` `updateSession()` overwrites status via spread. `addSession()` only guards against "error" and "deleted" — "idle" gets overwritten to "active" on every hook callback. Session status constantly oscillates, never reflecting real state. | `persistence/project-index-writer.ts:168-225` | **Defer to P22** (status unification) | L3 (code analysis) | Status constantly reset to "active" by hooks. |
| **F-15** | LOW | Q6 migration (`.opencode/state/` → `.hivemind/state/`) locked 2026-04-25 but never executed. Session-tracker writes to `.hivemind/session-tracker/` correctly, but continuity store still uses legacy paths with stale fixture data. | `session-tracker/index.ts`, legacy paths | **Defer to P29** (legacy cleanup) | L3 (code + legacy flaw register) | Two state locations with different data. |
| **F-16** | LOW | `agent-transform.ts` imported and instantiated in DI but only used by `message-capture.ts`. `transform/` subdirectory (155 LOC) is dead code — consumes import slots, complicates initialization. | `initialization.ts:138`, `transform/agent-transform.ts` | **Defer to P34** (module splits) | L3 (code analysis) | Dead code, no runtime impact. |
| **F-17** | HIGH | **Asymmetric manifest wiring** — `hierarchy-manifest.json` IS written but only by `tool-delegation.ts`/`child-recorder.ts` path (delegate-task dispatches). `event-capture.ts` and `tool-capture.ts` (session events, tool calls) NEVER write to manifest. Children like `ses_1b59c269...`, `ses_1b90978a...` appear in continuity but are MISSING from manifest. | `capture/event-capture.ts`, `capture/tool-capture.ts` vs `tool-delegation.ts`, `child-recorder.ts` | **Surgical** — wire manifest writes in event-capture and tool-capture paths | L2 (filesystem — 37 manifests exist with holes) | Corrected from F-02. Asymmetric wiring causes manifest to be a partial view. |
| **F-18** | CRITICAL | `event-capture.ts:428-467` creates immediate child files with fallback `subagentType: "unknown"` and `mainAgent.name: "pending"`. Real agent identity (`hm-l2-researcher`) is available at runtime (session export L265) but NEVER backfilled. 4 of 8 children in ses_1bda have unknown agent type. | `capture/event-capture.ts:428-467`, `capture/tool-capture.ts:125-137` | **Surgical** — capture real metadata before creating child file; add backfill on delegation completion | L2 (filesystem — 4 child .json files show agentName: "unknown") | Critical: delegates are anonymous in persistence. |
| **F-19** | HIGH | `project-index-writer.ts:168-225` `updateSession()` spreads `...existing, ...updates` but NO caller ever populates `childCount` or `totalDelegationDepth`. ALL 122 session entries show `childCount: 0` and `totalDelegationDepth: 0` despite sessions having 8-49 children each. `hivemind-session-view` reports `childCount: 0` for all sessions. | `persistence/project-index-writer.ts:168-225`, `project-continuity.json` | **Surgical** — add childCount computation before write | L2 (filesystem — all 122 entries have childCount: 0) | Schema fields exist but are dead code. |
| **F-20** | MEDIUM | `orphan-cleanup.ts` misclassifies 33 valid children as orphans. Example: `ses_1c571efb0ffeIloZPzsnqS0P0y` is quarantined but exists in ses_1bda's continuity tree with 2 L2 children. Algorithm expects specific directory structure that doesn't match actual write patterns. | `persistence/orphan-cleanup.ts`, `.hivemind/session-tracker/quarantine/` | **Defer to P24** (recovery redesign) | L2 (filesystem — 33 quarantined dirs) | Legitimate delegation history hidden in quarantine. |
| **F-21** | HIGH | `delegation-persistence.ts:58-64` `persistDelegations()` returns early when `config.commit_docs` is false. Since `commit_docs` defaults to false, the delegation persistence store is effectively disabled by default. `.hivemind/state/delegations.json` has 0 entries for any audited session despite 10+ delegate dispatches. | `src/task-management/continuity/delegation-persistence.ts:58-64` | **Surgical** — remove `commit_docs` gate or add separate config | L2 (filesystem — delegations.json empty) | Severity resolved: MEDIUM scope × CRITICAL impact = HIGH. |
| **F-22** | MEDIUM | ALL 122 session entries in `project-continuity.json` share the same `updated` timestamp (`2026-05-21T12:35:17.XXXZ`). The per-entry timestamp is actually the file's global last-write time, not per-session staleness. Cannot determine which sessions are truly current vs stale. | `project-continuity.json` (all 122 entries) | **Defer to P22** (status unification includes timestamp fix) | L2 (filesystem — identical timestamps) | Individual session staleness is invisible. |

### Severity Distribution (Unified)

| Severity | Count | Flaw IDs |
|----------|-------|----------|
| **CRITICAL** | 3 | F-01, F-18, F-19 |
| **HIGH** | 8 | F-03, F-04, F-05, F-07, F-08, F-17, F-19, F-21 |
| **MEDIUM** | 9 | F-06, F-09, F-10, F-11, F-12, F-13, F-14, F-20, F-22 |
| **LOW** | 2 | F-15, F-16 |

## Phase 21 Context Packet

### In-Scope (Must Fix in P21)

**Surgical fixes (P0 — highest priority):**

| Fix | Flaws | Effort | Exit Gate |
|-----|-------|--------|-----------|
| Fix atomic write temp file cleanup | F-01 | 1 file, ~20 LOC | After 100 writes in a loop, 0 `.tmp.*` files remain |
| Wire delegate-task metadata capture (agent name, model) into event-capture BEFORE child file creation; add backfill hook | F-18 | 2 files, ~50 LOC | Persisted child JSON shows real `agentName`, not `"unknown"` |
| Add childCount/computeDepth to project-index-writer updateSession | F-19 | 1 file, ~30 LOC | Session with 5 children shows `childCount: 5` |

**Surgical fixes (P1 — must fix in same phase):**

| Fix | Flaws | Effort | Exit Gate |
|-----|-------|--------|-----------|
| Wire hierarchy manifest writer into event-capture.ts and tool-capture.ts | F-02 (reclassified), F-17 | 2 files, ~40 LOC | New session.create via event-capture triggers manifest update |
| Persist `childToRootMain` mapping to disk (new durable index file) | F-07 | 3 files, ~100 LOC | After restart, previously registered children classified as "child" not "unknownSub" |
| Add `MAX_DEPTH` guard to `ensureAncestorRoute()` | F-13 | 1 file, ~5 LOC | Code review |

### Guardrails (Must Add But Full Fix Deferred)

| Guardrail | For Flaw | What to Add | Deferred To |
|-----------|----------|-------------|-------------|
| Add `unlink(tmpPath)` after every successful `rename()` — this IS the F-01 fix but the cross-volume atomicity guardrail prevents re-introduction | F-01 (secondary) | Same-volume validation before write | P22 (if needed) |
| Add status divergence WARNING log when child.json status ≠ manifest status ≠ project-index status | F-05 | Cross-validation log in reconciliation | P22 |
| Add orphan quarantine boundary — check continuity tree existence before quarantining | F-20 | `isChildOrphan()` guard | P24 |
| TurnCount mandate in child-recorder — at minimum record initial turn | F-19 (turnCount=0) | Set `turnCount: 1` on creation | P24 |

### Deferred to Later Phases

| Flaw | Defer To | Rationale |
|------|----------|-----------|
| F-03 fragmented writes | P22 | Requires status unification as dependency |
| F-04 buildFromDisk silent skip | P24 | Trajectory redesign changes recovery semantics |
| F-05 status divergence | P22 | Status unification is Phase 22's explicit purpose |
| F-06 reverse-order propagation | P23 | Dispatch redesign will change registration order |
| F-08 project-continuity stale read | P24 | Depends on F-07 completion (rebuild path) |
| F-09 persistence over-engineering | P34 | Module splits — intentional deferral |
| F-10 queue deadlock | P25 | Pressure/notification redesign changes write strategy |
| F-11 weak parseability | P24 | Recovery redesign |
| F-12 depth cap | P23 | Dispatch redesign defines new depth semantics |
| F-14 status oscillation | P22 | Status unification fixes this naturally |
| F-15 Q6 migration | P29 | Legacy cleanup phase |
| F-16 dead transform code | P34 | Module splits — will be deleted then |
| F-20 quarantine aggressiveness | P24 | Depends on recovery/rebuild changes |
| F-21 delegation persistence gate | P23 | Part of delegate-task fix |
| F-22 shared timestamp | P22 | Part of status unification |

### Gray Areas (Unresolved Design Decisions)

| # | Question | Options | Recommended | Why It Matters |
|---|----------|---------|-------------|----------------|
| **G-1** | **What is the role of `hierarchy-manifest.json`?** | (a) Authoritative hierarchy source — fix ALL write paths to update it; (b) Derivative cache — generate from continuity tree on read; (c) Deprecated — remove and use continuity tree only | **(b) Derivative cache.** The continuity tree is the canonical hierarchy representation. The manifest is a flattened view — generate it from the tree at read time rather than maintaining a separate write path. This eliminates F-02/F-17 permanently. | Determines whether Phase 21 adds more write paths (option a) or removes them (option b/c). Affects 3-4 files. |
| **G-2** | **How should `childToRootMain` survive restart?** | (a) New durable file `childToRootMain-index.json`; (b) Reconstruct from `session-continuity.json` hierarchy tree at startup; (c) Extend `project-continuity.json` schema | **(b) Reconstruct from continuity tree.** The hierarchy tree in `session-continuity.json` already contains the parent-child graph. Add a deterministic rebuild function that walks the tree and computes `rootMain` for each child. No new file format needed. | Determines whether F-07 fix is 3 files/100 LOC (option b) or 5 files/200+ LOC (option a). |
| **G-3** | **Which store is the canonical source for session status?** | (a) child .json `status` field; (b) `hierarchy-manifest.json` `status` field; (c) `ProjectSessionEntry` in project-continuity.json; (d) A NEW single status authority | **(c) Project-continuity.json.** It's the project-global index. All other stores should DERIVE status from it, not WRITE to it independently. The child JSON and manifest should be read-only consumers of the project-index status. | Resolves F-05. If P22 status unification makes a different choice, P21 guardrails must not conflict. **Needs human decision.** |
| **G-4** | **Should the `commit_docs` gate on delegation persistence be removed or replaced?** | (a) Remove the gate entirely — always persist delegations; (b) Add a separate `persist_delegations` config flag; (c) Keep gated but change default to `true` | **(b) Add separate config flag `persist_delegations`.** Different concern from `commit_docs`. Default: `true`. This makes delegation persistence an explicit opt-out, not accidental opt-in. | Fixes F-21. Low effort (1 file, 5 LOC). **Needs human decision on the new config key name.** |
| **G-5** | **Should temp files be cleaned immediately after write or at startup only?** | (a) Clean after EVERY successful `rename()` — add `unlink(tmpPath)` in `atomicWriteJson`; (b) Keep startup-only cleanup but fix the volume-crossing rename issue; (c) Both (a) + (b) | **(c) Both.** Immediate cleanup prevents accumulation during live sessions. Volume validation prevents the APFS rename failure mode. This is defense-in-depth for F-01. | Most of F-01 fix is already option (a). Adding (b) prevents re-introduction on unusual filesystem configurations. Minimal effort. |
| **G-6** | **What defines a legitimate orphan?** | (a) Session has no parent reference in ANY continuity tree; (b) Session has no parent AND was created >5 minutes ago; (c) Session has no parent AND its parent session is marked "deleted"/"error" | **(a) No parent in ANY continuity tree.** The current algorithm is too aggressive because it checks directory structure rather than continuity tree references. Option (b) mitigates race conditions. | 33 children currently quarantined. Fixing this definition in P24 will recover legitimate delegation history. P21 should just add a warning log when quarantining. |
| **G-7** | **Should the depth cap of 2 be removed?** | (a) Remove entirely — support arbitrary depth; (b) Increase to 3; (c) Keep at 2 but add runtime warning when exceeded; (d) Keep at 2 — deeper hierarchies are discouraged architecturally | **(c) Keep at 2 but add runtime warning.** The architecture explicitly limits delegation depth (Q1 design decision). Removing the cap has cascading effects through routing, classification, and recovery. Add a warning when depth exceeds 2 so it's observable during Phase 23 dispatch redesign. | F-12 fixed by making the cap observable (logging), not by removing it. The dispatch redesign in P23 can then decide whether to increase it. |
| **G-8** | **Should per-session timestamps in project-continuity.json be fixed in P21?** | (a) Fix now — add per-entry `updated` tracking; (b) Defer to P22 — it's a status-staleness issue; (c) Document as known limitation | **(b) Defer to P22.** F-22 is a symptom of the same problem as F-14 (status being overwritten globally). Fixing the status authority (G-3) in P22 naturally fixes the timestamps. P21 should document this in the spec. | Prevents P21 scope creep into status unification territory. |

### Decision Table Summary (recommended choices)

| Gray Area | Recommended | Effort | Dependencies |
|-----------|-------------|--------|--------------|
| G-1 Manifest role | Derivative cache (b) | Minimal — read-side change | ✅ Independent of P21 surgical fixes |
| G-2 childToRootMain persistence | Reconstruct from continuity (b) | 3 files, ~100 LOC | ✅ Independent |
| **G-3 Status authority** | **NEEDS HUMAN DECISION** | Affects P22 planning | ⚠️ Blocks P22 spec |
| **G-4 Delegation persistence gate** | **NEEDS HUMAN DECISION** (on config key name) | 1 file, ~5 LOC | ⚠️ Blocks P23 |
| G-5 Temp cleanup | Clean after every write + volume validation (c) | 1 file, ~20 LOC | ✅ F-01 fix covers this |
| G-6 Orphan definition | No parent in continuity (a) + 5-min grace (b) | Logging only in P21 | ✅ Guardrail for P24 |
| G-7 Depth cap | Keep at 2 with warning (c) | 1 file, ~3 LOC | ✅ F-13 fix covers MAX_DEPTH |
| G-8 Per-session timestamps | Defer to P22 | 0 LOC in P21 | ✅ Documented deferral |

## Spec-Phase Structure (per flaw)

### F-01 Fix (temp leak)
- **Acceptance:** `atomic-write.ts` deletes temp file after successful rename. Cross-volume `TMPDIR` detected and logged as warning.
- **Verification:** Loop 100 atomic writes → glob `*.tmp.*` in session-tracker → assert 0 temp files. Unit test: mock `rename` failure → assert temp file cleaned up.
- **Evidence:** No `.tmp.*` files exist after write loop. TMPDIR same-volume check logged.

### F-02/F-17 Fix (manifest wiring)
- **Acceptance:** `event-capture.ts` calls `manifestWriter.addChild()` on `session.created`. `tool-capture.ts` calls `manifestWriter.addChild()` on tool-call detection.
- **Verification:** Create root session via event-capture → `hierarchy-manifest.json` has entry with correct metadata. Create children via tool-capture → entry appears.
- **Evidence:** Manifest contains ALL children visible in continuity tree (no holes).

### F-07 Fix (recovery blindness)
- **Acceptance:** After restart, children registered before restart are classified as "child" not "unknownSub". `buildFromDisk()` rebuilds `childToRootMain` from continuity tree.
- **Verification:** Integration test: register L1→L2 chain → simulate restart (reinitialize session-tracker) → query classification → assert "child".
- **Evidence:** `hierarchyIndex.getRootMain(childId)` returns correct root after rebuild.

### F-13 Fix (MAX_DEPTH guard)
- **Acceptance:** `ensureAncestorRoute()` has `MAX_DEPTH = 20` guard. Returns gracefully on exceeding limit.
- **Verification:** Unit test with deep/cyclical parent chain → no stack overflow → logged warning.
- **Evidence:** Code review + test assertion.

### F-18 Fix (anonymous children)
- **Acceptance:** `event-capture.ts:writeImmediateChildFile()` receives real agent name, model, description instead of `"unknown"`/`"pending"`. Backfill hook updates child file when delegation completes.
- **Verification:** `delegate-task` dispatch → inspect child .json → assert `agentName` matches assigned agent. After delegation completes → assert `agentName` is updated (if initially unknown).
- **Evidence:** Persisted child JSON shows real agent identity for all delegate dispatches.

### F-19 Fix (childCount computation)
- **Acceptance:** `project-index-writer.ts:updateSession()` computes `childCount` by walking the hierarchy tree before writing. `totalDelegationDepth` computed as max depth in hierarchy.
- **Verification:** Root session with 5 children → `project-continuity.json` entry shows `childCount: 5`. Root with L1→L2 chain → `totalDelegationDepth: 2`.
- **Evidence:** All session entries in project-continuity.json have non-zero `childCount` where children exist.

### Regression Gates (must pass before Phase 21 closure)
- All 2,382+ existing tests pass.
- Typecheck clean.
- No new session-tracker test failures.

## References

1. `.planning/research/session-tracker-evidence-audit-2026-05-21.md` — Evidence audit (6 findings)
2. `.planning/research/session-tracker-flaws-analysis-2026-05-21.md` — Original 16-flaw register (F-01 to F-16)
3. `.planning/research/session-tracker-phase-implementation-map-2026-05-21.md` — Phase map and remediation strategies
4. `.planning/research/session-tracker-production-evidence-analysis-2026-05-21.md` — Extended analysis with F-17 to F-22
5. `.planning/research/phase-reordering-final-recommendation-2026-05-21.md` — Phase reordering context
6. `.hivemind/session-tracker/` — Live filesystem evidence (37 session dirs, 33 quarantined)
7. `src/features/session-tracker/` — All source files referenced in flaw analysis
8. `src/task-management/continuity/delegation-persistence.ts` — F-21 root cause
