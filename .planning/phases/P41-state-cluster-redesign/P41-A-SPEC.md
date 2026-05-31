# SPEC: P41-A — Investigate Field Mapping + Affected Tools for State Cluster Consolidation

> **Date:** 2026-05-31
> **Status:** Draft (spec-phase output)
> **Mode:** `--auto` (interactive skipped — defaults selected)
> **Type:** Investigation-only — no file modifications
> **Ambiguity Target:** ≤ 0.20

---

## 1. Executive Summary

Two standalone state files under `.hivemind/state/` — `delegations.json` (35 records, all test artifacts) and `session-continuity.json` (18 records, all test artifacts) — store data that the user has decided to MERGE into session-tracker's per-session file schema under `.hivemind/session-tracker/`. Both files contain **zero real production data** and **zero session ID overlap** with the 121 live sessions in session-tracker.

This investigation phase determines: (1) the exact field-level schema of both files, (2) which fields have equivalents in the session-tracker schema, (3) which fields are unique and need new session-tracker schema extensions, (4) every tool/hook/agent that reads or writes each field, and (5) the full breakage surface if both files are deleted.

**Primary output:** A field-mapping matrix that the subsequent merge phase can directly consume as a migration specification.

---

## 2. Requirements

### REQ-P41A-01: Delegations.json Field Inventory
**Statement:** The investigation MUST produce a complete inventory of every field in the `Delegation` interface (file: `src/coordination/delegation/types.ts:26-73`), annotated with:
- Field name and TypeScript type
- Whether it currently persists through `delegations.json`
- Whether an equivalent field exists in session-tracker's per-session schema (child `.json` files, `session-continuity.json`, `hierarchy-manifest.json`)
- The exact session-tracker equivalent field path (e.g., `ChildSessionRecord.delegatedBy.agentName`) — or "NO EQUIVALENT" if none exists
- The persistence redaction policy applied by `persistDelegations()` (from `delegation-persistence.ts:129-131`)
- Which normalization defaults apply on read via `normalizePersistedDelegation()`

**Falsifiable check:** An auditor can verify every field of the `Delegation` interface appears exactly once in the inventory table with all annotations filled.

**Evidence source:** `src/coordination/delegation/types.ts`, `src/task-management/continuity/delegation-persistence.ts`, `src/features/session-tracker/types.ts`

---

### REQ-P41A-02: State/Session-Continuity.json Field Inventory
**Statement:** The investigation MUST produce a complete inventory of every field in the `ContinuityStoreFile` → `SessionContinuityRecord` → `SessionContinuityMetadata` → `GovernancePersistenceState` schemas (files: `src/shared/types.ts`, `src/task-management/continuity/index.ts`), annotated with:
- Field name and TypeScript type
- Whether it currently persists through `.hivemind/state/session-continuity.json`
- Whether an equivalent field exists in session-tracker's schema (any file type)
- The exact session-tracker equivalent field path — or "NO EQUIVALENT" if none exists
- Which actor sets the field (from `continuity/index.ts`, `plugin.ts`, `lifecycle/index.ts`, hooks)

**Falsifiable check:** An auditor can trace every field in the `SessionContinuityMetadata` interface and `GovernancePersistenceState` to its inventory entry and verify the equivalent or "NO EQUIVALENT" annotation.

**Evidence source:** `src/shared/types.ts`, `src/task-management/continuity/index.ts`, `src/features/session-tracker/types.ts`

---

### REQ-P41A-03: Unique-Field Gap Report
**Statement:** From the two inventories above, the investigation MUST produce a consolidated "gap report" listing every field found in either `delegations.json` or `state/session-continuity.json` that has **NO EQUIVALENT** in the current session-tracker schema. For each gap field, the report MUST recommend:
- Whether the field CAN be added to the session-tracker per-session schema (as a new field in `ChildSessionRecord`, `SessionContinuityIndex`, or `HierarchyManifestChild`)
- What schema changes would be required (which interface(s) to extend, with proposed field name and type)
- The migration risk: HIGH (data loss if not migrated), MEDIUM (functional degradation), or LOW (cosmetic/test-only data)

**Falsifiable check:** The gap report must enumerate every field tagged "NO EQUIVALENT" from REQ-P41A-01 and REQ-P41A-02, and each entry must have a recommendation and risk rating.

---

### REQ-P41A-04: Full Actor/Consumer Map
**Statement:** The investigation MUST produce a complete map of every code location (file:line) that reads or writes each of the two standalone files. The map must include:
- For `delegations.json`:
  - `persistDelegations()` in `src/task-management/continuity/delegation-persistence.ts` (WRITER)
  - `readPersistedDelegations()` in same file (READER)
  - All callers of those two functions (with file:line references)
  - `LegacyPersistenceStatusReader` in `src/tools/delegation/readers/legacy-reader.ts` (READER — reads from `.hivemind/state/delegations.json`)
  - `hivemind-session-view.ts` line 71 (READER — hardcoded path to `.hivemind/state/delegations.json`)
  - `sidecar/readonly-state.ts` line 83 (READER — referenced path)
  - `gate-decision.ts` line 120 (PATH VALIDATOR — checks for `delegations.json` in path)
  - `path-scope.ts` line 39 (PATH VALIDATOR — example assertion path)
- For `state/session-continuity.json`:
  - `getContinuityFile()` / `resolveContinuityFilePath()` in `continuity/index.ts` (PATH RESOLVER)
  - `recordSessionContinuity()`, `patchSessionContinuity()`, `deleteSessionContinuity()` in same file (WRITERS)
  - `listSessionContinuity()`, `getSessionContinuity()` in same file (READERS)
  - All callers across `plugin.ts`, `lifecycle/index.ts`, hooks, tools
  - `gate-decision.ts` line 119 (PATH VALIDATOR — checks for `session-continuity.json` in path)

**Falsifiable check:** An auditor can search the codebase for `delegations.json` and `session-continuity.json` strings and verify every match maps to a row in the actor/consumer map.

---

### REQ-P41A-05: Breakage Impact Analysis
**Statement:** The investigation MUST produce a "what breaks if we delete?" analysis for each of the two standalone files. The analysis must categorize each identified consumer as:

| Category | Meaning |
|----------|---------|
| **BLOCKING** | File deletion causes runtime crash (throws, returns corrupted state, fails to start) |
| **DEGRADED** | File deletion causes functional degradation (returns empty result, loses capability, falls back to in-memory-only) |
| **SILENT** | File deletion has no observable effect (path checked but missing file treated as empty) |
| **TEST-ONLY** | Only test code references this file; no production impact |

For each consumer, the analysis must state:
- The exact error mode if the file is missing (e.g., `ENOENT` thrown at startup, empty array returned, graceful fallback)
- Whether the consumer has an alternative data source (e.g., session-tracker files, in-memory state)
- The effort to modify the consumer to read from session-tracker instead (SMALL: < 5 lines, MEDIUM: < 20 lines, LARGE: > 20 lines or structural refactor)

**Falsifiable check:** Each consumer from REQ-P41A-04 must have one of the four category labels and the supporting analysis. An auditor can verify each by temporarily removing the file and running the code path.

---

## 3. Boundaries

### IN Scope (this investigation only)

| # | Item | Rationale |
|---|------|-----------|
| 1 | Reading `delegations.json` from `.hivemind/state/` (exists on disk, 23 KB) | Primary target file |
| 2 | Reading `session-continuity.json` from `.hivemind/state/` (exists on disk, 14 KB) | Primary target file |
| 3 | Reading all session-tracker file types under `.hivemind/session-tracker/` | Target destination schema |
| 4 | All source files in `src/` that reference either file | Required for actor/consumer map |
| 5 | Old P41 research artifacts (`.planning/phases/P41-state-cluster-hardening/`) | Prior analysis context |
| 6 | `src/shared/types.ts` — `Delegation`, `SessionContinuityRecord`, `SessionContinuityMetadata`, `ContinuityStoreFile`, `GovernancePersistenceState`, `PendingNotification`, `DelegationPacket`, `CapturedResult`, `CompactionCheckpointData` | Schema authority |
| 7 | `src/coordination/delegation/types.ts` — `Delegation` interface | Schema authority for delegations |
| 8 | `src/features/session-tracker/types.ts` — `ChildSessionRecord`, `SessionContinuityIndex`, `HierarchyManifestChild`, `ProjectSessionEntry` | Schema authority for session-tracker |
| 9 | Session-tracker files: `project-continuity.json` (121 entries), per-session `session-continuity.json`, `hierarchy-manifest.json`, child `ses_*.json` files | Live data reference |

### OUT of Scope (not this investigation)

| # | Item | Rationale |
|---|------|-----------|
| 1 | Writing code — no file modifications, no refactoring | This is investigation-only |
| 2 | Deleting or moving any files | Phase P41-B handles execution |
| 3 | `.hivemind/state/agent-work-contracts.json` | Not part of the merge decision |
| 4 | `.hivemind/state/config-workflows.json` | Not part of the merge decision |
| 5 | `.hivemind/state/trajectory-ledger.json` | Not part of the merge decision |
| 6 | `.hivemind/state/version.json` | Not part of the merge decision |
| 7 | `.opencode/state/` legacy paths | Pre-Q6 migration concern only |
| 8 | Third-party state stores (n8n, Datadog, etc.) | No cross-system state for these files |
| 9 | Test file modifications | Tests are updated during P41-B execution |

---

## 4. Actors

### Primary Investigation Actors (this phase uses these)

| Actor | Role | Action |
|-------|------|--------|
| **Phase Researcher** (gsd-phase-researcher) | Executes this investigation | Reads all source files, reads on-disk state files, produces field inventories, actor maps, breakage analysis |
| **Planner** (gsd-planner) | Consumes SPEC.md to plan P41-B | Uses field-mapping matrix and breakage analysis to define migration tasks |

### Actors Found in Target Files (to be documented in REQ-P41A-04)

| Actor | Type | File Accessed | Current Role |
|-------|------|---------------|--------------|
| `DelegationStateMachine` | Programmatic (in-memory → file) | `.hivemind/state/delegations.json` | Writes delegation state transitions |
| `DelegationManager.recoverPending()` | Programmatic (startup) | `.hivemind/state/delegations.json` | Rehydrates in-memory state on restart |
| `delegation-status` tool | Tool (agent-facing) | `.hivemind/state/delegations.json` | Reads delegation history for agent queries |
| `delegate-task` tool | Tool (indirect) | `.hivemind/state/delegations.json` | Records delegations after dispatch |
| `session-journal-export` tool | Tool (indirect) | `.hivemind/state/delegations.json` | Reads delegation data for journal export |
| `retry-handler` | Programmatic | `.hivemind/state/delegations.json` | Reads delegation records for retry |
| `LegacyPersistenceStatusReader` | Programmatic (reader) | `.hivemind/state/delegations.json` | Reads legacy format for delegation-status tool |
| `hivemind-session-view` tool | Tool (agent-facing) | `.hivemind/state/delegations.json` | Reads delegations for unified session view |
| `sidecar/readonly-state` | Programmatic (reader) | `.hivemind/state/delegations.json` | References path for sidecar state access |
| `gate-decision` | Programmatic (path guard) | Both files | Validates path scope for bootstrap gates |
| `continuity/index.ts` | Programmatic CRUD | `.hivemind/state/session-continuity.json` | Full CRUD: record/patch/delete/list/get |
| `plugin.ts` | Startup + runtime | `.hivemind/state/session-continuity.json` | Notification replay on init, notification persistence |
| `lifecycle/index.ts` | Programmatic | `.hivemind/state/session-continuity.json` | Reads/writes lifecycle state, compaction checkpoints |
| Session lifecycle hooks | Hooks | `.hivemind/state/session-continuity.json` | Reads for auto-loop decisions, compaction context |
| Tool guard hooks | Hooks | `.hivemind/state/session-continuity.json` | Reads for metadata injection into tool output |
| Governance evaluator | Programmatic | `.hivemind/state/session-continuity.json` | Writes governance violations to `.governance` section |
| Session-tracker `hierarchy-index` | Programmatic | Per-session `session-continuity.json` | Reads per-session files (NOT the state/ file) |
| Session-tracker `project-continuity` | Programmatic | Per-session files | Skips `session-continuity.json` in child scans |

---

## 5. Acceptance Criteria

### AC-1: Complete Field Inventory Tables
- [ ] Two inventory tables exist (one per file) in the research output
- [ ] Every field from the `Delegation` interface (28+ fields) is accounted for
- [ ] Every field from `ContinuityStoreFile` + `SessionContinuityRecord` + `SessionContinuityMetadata` + `GovernancePersistenceState` is accounted for
- [ ] Each entry has a session-tracker equivalent field path (or "NO EQUIVALENT")
- [ ] Each entry has redaction policy annotation (where applicable)

### AC-2: Gap Report with Recommendations
- [ ] All "NO EQUIVALENT" entries from both inventories are consolidated into a gap report
- [ ] Each gap entry has a proposed session-tracker schema extension (field name + type + target interface)
- [ ] Each gap entry has a risk rating (HIGH/MEDIUM/LOW)
- [ ] The gap report is ordered by risk (HIGH first)

### AC-3: Complete Actor Map
- [ ] Every `grep` match for `delegations.json` in `src/` has a row in the actor map
- [ ] Every `grep` match for `session-continuity.json` in `src/` has a row in the actor map
- [ ] Each row indicates READ, WRITE, or PATH-VALIDATOR role
- [ ] File:line references are precise for each entry

### AC-4: Breakage Analysis Complete
- [ ] Each actor from AC-3 has a BLOCKING/DEGRADED/SILENT/TEST-ONLY category
- [ ] Each actor's error mode on file deletion is documented
- [ ] Each actor's alternative data source is identified (or "none" noted)
- [ ] Migration effort estimated per actor (SMALL/MEDIUM/LARGE)

### AC-5: Research Artifact Written
- [ ] `.planning/phases/P41-state-cluster-redesign/P41-A-RESEARCH.md` is written
- [ ] All acceptance criteria are verified by the researcher before marking phase complete
- [ ] The research artifact is committed to git

---

## 6. Ambiguity Scoring

### Pre-Investigation Ambiguity

| Dimension | Weight | Score (0-1) | Weighted | Notes |
|-----------|--------|-------------|----------|-------|
| **Scope Clarity** | 0.30 | 0.10 | 0.030 | User decision is locked: MERGE + DELETE. Investigation scope is well-bounded. Minor ambiguity about whether `session-tracker` schema extension recommendations are IN scope for investigation (they are — see REQ-P41A-03). |
| **Technical Feasibility** | 0.25 | 0.15 | 0.038 | Codebase scouting already confirms both files are readable and have known schemas. The 35 delegations and 18 state sessions are accessible. Some ambiguity about edge cases in the session-tracker schema compatibility. |
| **Stakeholder Alignment** | 0.25 | 0.05 | 0.013 | User explicitly confirmed "this phase is INVESTIGATION only — no file modifications" and "MERGE into session-tracker, DELETE both files." Zero ambiguity. |
| **Dependency Readiness** | 0.20 | 0.15 | 0.030 | Old P41 research provides 428 LOC of prior analysis. However, that research concluded "KEEP all three" (counter to user decision), so it must be re-evaluated from the merge perspective. Some findings will carry over, but the recommendation frame is inverted. |

**Total Pre-Investigation Ambiguity:** 0.111 (BELOW 0.20 threshold) ✅

### Post-Investigation Target

After the investigation produces the field-mapping matrix, gap report, actor map, and breakage analysis, the ambiguity for the subsequent P41-B merge phase should be:
- **Target:** ≤ 0.10 (all technical questions resolved by investigation artifacts)
- **Remaining ambiguity:** Merge execution strategy choices (e.g., batch migration vs. incremental, rollback plan)

---

## 7. Investigation Methodology

### Step 1: Source Schema Extraction (REQ-P41A-01, REQ-P41A-02)
1. Read `Delegation` interface from `src/coordination/delegation/types.ts`
2. Read `ContinuityStoreFile`, `SessionContinuityRecord`, `SessionContinuityMetadata`, `GovernancePersistenceState` from `src/shared/types.ts`
3. Read session-tracker interfaces from `src/features/session-tracker/types.ts`
4. Read `normalizePersistedDelegation()` from `src/task-management/continuity/delegation-persistence.ts`
5. Read `LegacyDelegationRecordSchema` from `src/tools/delegation/readers/types.ts`

### Step 2: Schema Comparison (REQ-P41A-03)
1. For each field in `Delegation`, search session-tracker types for equivalent
2. For each field in `SessionContinuityMetadata`, search session-tracker types for equivalent
3. Tag each as "EQUIVALENT" or "NO EQUIVALENT"
4. For "EQUIVALENT" fields, document exact path difference and any type mismatch

### Step 3: Code Search for File References (REQ-P41A-04)
1. `grep` for `delegations.json` across all `src/` files
2. `grep` for `session-continuity.json` across all `src/` files
3. Categorize each match as READ, WRITE, or PATH-VALIDATOR
4. Trace callers of each identified function

### Step 4: Breakage Analysis (REQ-P41A-05)
1. For each consumer, trace the code path when file is missing
2. Determine if `try/catch` handles `ENOENT`, or if the path is expected to exist
3. Check for alternative data sources (in-memory, session-tracker, environment variables)
4. Classify as BLOCKING / DEGRADED / SILENT / TEST-ONLY

### Step 5: Write Research Artifact
1. Produce `P41-A-RESEARCH.md` in the phase directory
2. Include all four tables (2 field inventories, 1 gap report, 1 actor map)
3. Include breakage analysis with per-consumer classification
4. Verify acceptance criteria before committing

---

## 8. Open Questions

1. **What is the exact session-tracker schema extension design?**
   - The investigation should RECOMMEND extensions but NOT implement them
   - The gap report (REQ-P41A-03) should propose field name + type + target interface for each gap
   - Final schema design is decided during P41-B (plan phase)

2. **Should the `ContinuityStoreFile.governance` section be merged into session-tracker?**
   - Currently holds rules and violations with zero real data
   - Governance may belong in a separate store, not session-tracker
   - The investigation should flag this as a design decision for the planner

3. **What is the proper disposal plan for the 35 test-artifact delegation records?**
   - They use fake session IDs (`child-*`, `parent-*`) not matching `ses_*` format
   - Option A: Delete on first write of new delegations.json equivalent in session-tracker
   - Option B: Manual cleanup script as part of P41-B
   - The investigation should recommend one approach

4. **How should the two identical filenames `session-continuity.json` be handled?**
   - `.hivemind/state/session-continuity.json` (the standalone file being deleted)
   - `.hivemind/session-tracker/{id}/session-continuity.json` (the per-session file being kept)
   - Post-deletion, no naming collision remains, but the investigation should confirm this

---

## 9. Key Decision Log

| Decision | Source | Status |
|----------|--------|--------|
| MERGE `delegations.json` data into session-tracker | User (pre-spec) | LOCKED |
| MERGE `state/session-continuity.json` data into session-tracker | User (pre-spec) | LOCKED |
| DELETE both files after merge | User (pre-spec) | LOCKED |
| This phase is INVESTIGATION only — no file modifications | User (pre-spec) | LOCKED |
| Session-tracker schema extensions may be needed for unique fields | Derived | DEFERRED to gap report |
| Prior P41.01 research "KEEP all three" conclusion is overruled | User (pre-spec) | SUPERSEDED |

---

## 10. Ambiguity Score (Final)

| Dimension | Weight | Score | Weighted | Rationale |
|-----------|--------|-------|----------|-----------|
| Scope Clarity | 0.30 | 0.10 | 0.030 | Clearly bounded to investigation. No ambiguity on what to produce. |
| Technical Feasibility | 0.25 | 0.15 | 0.038 | Schemas are known and accessible. Some uncertainty about exact equivalency of polling/timer fields. |
| Stakeholder Alignment | 0.25 | 0.05 | 0.013 | User decision is explicit and locked. |
| Dependency Readiness | 0.20 | 0.15 | 0.030 | Prior P41.01 research exists but recommendation differs. Investigation must re-evaluate from merge perspective. |

**Final Ambiguity Score:** 0.111 ✅ (Below 0.20 threshold. Ready for research phase.)
