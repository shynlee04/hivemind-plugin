---
phase: P41-A
type: summary
produced_by: investigation
downstream_phases:
  - P41-B
  - P41-C
  - P41-D
  - P41-E
gap_fields_high: 1
gap_fields_medium: 6
gap_fields_low: 20
delegation_records: 35
delegation_unique_ids: 46
continuity_records: 18
live_sessions: 126
production_data: false
---

# Phase P41-A: Summary — Investigate Field Mapping for State Cluster Consolidation

**One-liner:** Verified zero production data in `delegations.json` (35 test records) and `session-continuity.json` (18 test records), mapped all fields to session-tracker equivalents, identified 1 HIGH + 6 MEDIUM gap fields needing schema extension, documented 14 actors per file with BLOCKING/DEGRADED/SILENT/TEST-ONLY breakage analysis, and produced migration plan skeleton for P41-B/C/D/E.

---

## 1. Key Findings

1. **Both files contain ZERO production data** — 35 delegation records (46 unique session IDs) + 18 continuity records, all with test session IDs (`child-*`, `parent-*`, `ses-parent-*`, `ses_parent*`). None match the 126 live `ses_*` session-tracker sessions.
2. **Zero session ID overlap** — confirmed by cross-reference of all unique IDs from both files against live session-tracker. No production data would be lost on deletion.
3. **No BLOCKING breakage** — every reader handles missing files gracefully (`readPersistedDelegations()` returns `[]`, `loadStoreFromDisk()` returns `emptyStore()`, all try/catch protected).
4. **Writer code WILL recreate files unless redirected** — `persistDelegations()` in `state-machine.ts`, `persistStore()` in `continuity/index.ts`, and 3+ other write paths continue to write to old file paths after deletion. This is the primary operational risk (Pitfall 1).
5. **~60% delegation fields and ~40% continuity fields already exist in session-tracker** — only 1 HIGH and 6 MEDIUM gap fields need schema extension.

---

## 2. Gap Fields Requiring Schema Extension (P41-B Input)

### HIGH Risk

| Gap Field | Source File | Proposed Extension | Target Interface | Action |
|-----------|-------------|-------------------|-----------------|--------|
| `pendingNotifications` | session-continuity.json | `pendingNotifications?: PendingNotification[]` | `ChildSessionRecord` | P41-B add optional array field |

### MEDIUM Risk

| Gap Field | Source File | Proposed Extension | Target Interface | Action |
|-----------|-------------|-------------------|-----------------|--------|
| `queueKey` | delegations.json | `queueKey?: string` | `ChildSessionRecord.delegatedBy` | P41-B add field |
| `terminalKind` | delegations.json | `terminalKind?: string` | `ChildSessionRecord` | P41-B add field |
| `recoveryGuarantee` | delegations.json | `recoveryGuarantee?: string` | `ChildSessionRecord` | P41-B add field |
| `executionMode` | delegations.json | `executionMode?: "sdk" \| "pty" \| "headless"` | `ChildSessionRecord.delegatedBy` | P41-B add field |
| `compactionCheckpoint` | session-continuity.json | `compactionCheckpoint?: CompactionCheckpointData` | `ChildSessionRecord` | P41-B add optional (low priority — never populated on disk) |
| `lifecycle` | session-continuity.json | `lifecycle?: SessionLifecycleState` | `ChildSessionRecord` | P41-B add optional (low priority — never populated on disk) |
| `governance` (rules + violations) | session-continuity.json | Create `.hivemind/state/governance-state.json` | Separate file | P41-B create standalone governance store |

### LOW Risk (no action needed — ~20 fields)

All remaining gap fields are either: never persisted (`resultTruncated`, `terminationSignal`, `redirectedFrom`, `restartedFrom`, `resumedFrom`, `chainedFrom`, `executionState`, `signalSource`, `evidenceLevel`, `v2`); redacted before persist (`result`, `error`, `fallbackReason`); always zero/empty/default (`stablePollCount`, `gracePeriodExpiresAt`, `lastMessageCountChangeAt`, `surface`, `ptySessionId`, `explicitCancellation`, `promptParams`, `constraints`, `category`, `route`, `lastToolActivityAt`, `title`, `toolProfile`); always null on disk (`delegation`, `delegationPacket`, `resultCapture`); or derivable from other fields (`workingDirectory`, `firstActionAt`, `actionCount`, `messageCount`, `toolCallCount`, `finalMessageExcerpt`).

---

## 3. Actor/Consumer Map with Redirect Targets (P41-C Input)

### Writers to Redirect (P41-B)

| Actor | File:Line | Current Destination | New Destination |
|-------|-----------|-------------------|-----------------|
| `DelegationStateMachine` | `state-machine.ts:218,394` | `persistDelegations()` → `delegations.json` | `ChildWriter.createChildFile()` + `HierarchyManifestWriter.addChild()` |
| `notification-handler.ts` | `notification-handler.ts:219-229` | `patchSessionContinuity()` → `session-continuity.json` | Write to `ChildSessionRecord.pendingNotifications` |
| `plugin.ts` (notification persistence) | `plugin.ts:232-237` | `getSessionContinuity` + `patchSessionContinuity` | Write to `ChildSessionRecord.pendingNotifications` |
| `plugin.ts` (notification replay) | `plugin.ts:630-645` | `listSessionContinuity()` for replay | Read from `ChildSessionRecord.pendingNotifications` at startup |
| `lifecycle/index.ts` | `lifecycle/index.ts:108-217` | `patchSessionContinuity()` for phase transitions | Write to session-tracker `ChildSessionRecord` |
| `governance-engine/evaluator.ts` | `evaluator.ts:97-99` | `recordGovernancePersistenceState()` | Write to `.hivemind/state/governance-state.json` |

### Readers to Update (P41-C)

| Actor | File:Line | Current Source | New Source |
|-------|-----------|----------------|------------|
| `delegation-status.ts` | `delegation-status.ts:429,464-468` | `readPersistedDelegations()` + session-tracker fallback | Session-tracker exclusively (fallback already exists) |
| `hivemind-session-view.ts` | `hivemind-session-view.ts:68-78` | Hardcoded path to `delegations.json` | Read from hierarchy-manifest + child files |
| `session-journal-export.ts` | `session-journal-export.ts:80-84` | `listSessionContinuity()` + `readPersistedDelegations()` | Build execution lineage from session-tracker |
| `LegacyPersistenceStatusReader` | `legacy-reader.ts:41` | Hardcoded `delegations.json` path | Deprecated — `SessionTrackerStatusReader` already primary |
| `getSessionContinuity()` | `continuity/index.ts:350-353` | Returns from in-memory continuity store | Backed by session-tracker (keep signature) |
| `listSessionContinuity()` | `continuity/index.ts:346-348` | Returns from in-memory continuity store | Backed by session-tracker (keep signature) |

### Path Validators (P41-C Cleanup)

| Actor | File:Line | Current Behavior | Action |
|-------|-----------|-----------------|--------|
| `gate-decision.ts` | `gate-decision.ts:119-120` | Checks path endings for both files | Remove dead path checks (`.hivemind/state/` prefix still blocks dir writes) |
| `path-scope.ts` | `path-scope.ts:27-28,39` | JSDoc examples reference old paths | Update examples |

---

## 4. Status Type Mapping Required (P41-B/P41-C Cross-Cutting)

### Three Status Systems

| System | Values | Use |
|--------|--------|-----|
| `Delegation.status` | `"dispatched" \| "running" \| "completed" \| "error" \| "timeout"` | Delegation interface (legacy) |
| `ChildSessionRecord.status` | `"active" \| "completed" \| "error"` | Session-tracker child records |
| `HierarchyManifestChild.status` | `"active" \| "idle" \| "completed" \| "error"` | Hierarchy manifest |

### Recommendation: Normalize at Read Boundary

The `delegation-status.ts:218-219` already performs a lossy cast:
- `"dispatched"` → `"active"`, `"running"` → `"active"`, `"timeout"` → `"error"`
- `"idle"` → falls back to `"running"` (via `validateDelegationStatus()`)

Keep this mapping at the read boundary. Session-tracker stores its own status values. Do NOT change session-tracker status values to match `DelegationStatus`.

---

## 5. Timestamp Format Mismatch

| Source | Format | Example |
|--------|--------|---------|
| `Delegation.createdAt` / `completedAt` | Unix ms epoch (number) | `1717056000000` |
| `ChildSessionRecord.created` / `updated` | ISO 8601 string | `"2026-05-31T10:00:00.000Z"` |

**Conversion needed on write:** `new Date(delegation.createdAt).toISOString()`
**Conversion needed on read:** `new Date(childRecord.created).getTime()`

---

## 6. Migration Plan Skeleton

```
P41-B: Add gap fields to session-tracker types, redirect writers
  - Add 1 HIGH + 6 MEDIUM optional fields to ChildSessionRecord
  - Create separate .hivemind/state/governance-state.json
  - Redirect state-machine.ts, notification-handler.ts, plugin.ts,
    lifecycle/index.ts writers to session-tracker
  - Effort: MEDIUM (5-8 files modified)

P41-C: Update readers, add redirect from old paths
  - Update delegation-status.ts, hivemind-session-view.ts,
    session-journal-export.ts to read from session-tracker
  - Keep continuity CRUD function signatures, change backing store
  - Remove/deprecate LegacyPersistenceStatusReader
  - Update gate-decision.ts path validators
  - Effort: MEDIUM (8-12 files modified)

P41-D: Delete old files + tools cleanup
  - Delete .hivemind/state/delegations.json and session-continuity.json
  - Remove/redirect persistDelegations() and persistStore()
  - Clean up P41 research artifacts
  - Effort: SMALL (2-3 files)

P41-E: Progressive disclosure tool / deprecation warnings
  - Add startup check: warn if old state files still exist
  - Optional: auto-migration tool for any production data
  - Effort: SMALL (1 file)
```

### Dependency Order

```
P41-A (investigation) ──► P41-B (add fields + redirect writers)
                                │
                                ▼
                            P41-C (update readers + cleanup paths)
                                │
                                ▼
                            P41-D (delete files)
                                │
                                ▼
                            P41-E (progressive disclosure)
```

**Critical:** P41-B (redirect writers) MUST run before P41-D (delete files) — otherwise writer code recreates the deleted files (Pitfall 1).

---

## 7. Risks Requiring User Decisions

### U1: Governance State Destination
**Question:** Should `governance.rules` and `governance.violations` merge into session-tracker or stay as a separate file?
**Evidence:** 0 rules, 1 test violation currently on disk. Governance is logically distinct from session tracking.
**RECOMMENDATION:** Create separate `.hivemind/state/governance-state.json`. Governance is a cross-cutting concern applying to all sessions, not a per-session concern.

### U2: PendingNotifications Storage
**Question:** Should `PendingNotification[]` go into `ChildSessionRecord` as an optional field, or a new per-session `notifications.json` file?
**Evidence:** 7 of 18 test records have notification data (all test `fake-ses-*` child IDs). Zero production notification data exists.
**RECOMMENDATION:** Add as optional `pendingNotifications?: PendingNotification[]` to `ChildSessionRecord`. Graceful if undefined. No separate I/O needed.

### U3: 35 Test Artifact Disposal
**Question:** Should test delegation records be silently dropped or require a cleanup script?
**Evidence:** Fake session IDs (`child-*`, `parent-*`) cannot be mapped to any real session-tracker entry.
**RECOMMENDATION:** Silently drop during merge. No session-tracker entries match these IDs.

### U4: persistDelegations() — Remove or Keep as No-Op?
**Question:** Should `persistDelegations()` be removed entirely or kept as a no-op with a deprecation warning?
**Evidence:** 25+ imports reference `persistDelegations` and `readPersistedDelegations`.
**RECOMMENDATION:** Keep as deprecated no-op that logs a warning. Remove in a later cleanup phase after all callers have been migrated.

### U5: Continuity CRUD Functions — Remove or Keep Signatures?
**Question:** Should `getSessionContinuity()`, `listSessionContinuity()`, etc. (10+ functions, 39+ call sites) be removed or kept with changed backing store?
**Evidence:** Changing 39 call sites would be LARGE effort. Functions are exported and used across 10+ files.
**RECOMMENDATION:** Keep function signatures, change backing store to session-tracker. Minimizes change impact.

### U6: Status Type Mapping — Normalize on Read or Write?
**Question:** Should the status mapping between `DelegationStatus` (5 values) and session-tracker status (3 values) happen on read or write?
**Evidence:** `delegation-status.ts:218-219` already does lossy read-side mapping.
**RECOMMENDATION:** Normalize at the read boundary (status quo). Session-tracker stores its own values; `delegation-status` tool maps on read.

---

## 8. Verification Evidence

### Task 1: Research Completeness — PASSED
- REQ-P41A-01: 39 Delegation field entries (✓), persistence flags ✓, redaction policy ✓, normalize defaults ✓
- REQ-P41A-02: All 4 schemas inventoried (✓): ContinuityStoreFile, SessionContinuityRecord, SessionContinuityMetadata, GovernancePersistenceState
- REQ-P41A-03: Gap report ordered HIGH→MEDIUM→LOW (✓): 1 HIGH, 6 MEDIUM, ~20 LOW
- REQ-P41A-04: 14 delegations.json actors + 21 session-continuity.json actors with file:line references (✓)
- REQ-P41A-05: 0 BLOCKING, 6 DEGRADED, ~15 SILENT, ~10 TEST-ONLY (✓)
- ASSUMPTIONS.md: 25 assumptions with evidence, confidence levels, risk-if-wrong statements (✓)

### Task 2: Zero Production Data Loss — PASSED
- 126 live session-tracker sessions (`ses_*` format)
- 46 unique delegation IDs (all test: `child-*`, `parent-*`, `ses-parent-*`)
- 18 continuity IDs (all test: `ses_parent*`, `parent-*`, `ses-parent-*`)
- **Zero overlap** between either file and live sessions

### Downstream Readiness
**P41-B input:** Gap fields table (8 actionable fields with proposed schema extensions), writer redirect targets, governance state recommendation.
**P41-C input:** Full actor map with redirect targets, reader update requirements, path cleanup targets, 39+ call site migration strategy.
**P41-D input:** File deletion is safe (zero production data), but MUST run after P41-B/C to prevent writer recreation.
**P41-E input:** Deprecation warning pattern, auto-migration tool option for edge case production data.

---

## Self-Check: PASSED
- [x] SUMMARY.md exists at expected path
- [x] All 5 SPEC requirements verified complete in RESEARCH.md
- [x] Zero production data confirmed (126 live sessions, 0 overlap)
- [x] Gap fields table present (1 HIGH, 6 MEDIUM actionable)
- [x] Actor map with redirect targets present
- [x] Migration plan skeleton present for P41-B/C/D/E
- [x] 6 risks requiring user decisions documented
