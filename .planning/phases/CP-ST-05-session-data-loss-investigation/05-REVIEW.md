---
status: findings
phase: CP-ST-05
depth: standard
files_reviewed: 11
critical: 4
warning: 6
info: 5
total: 15
---

# CP-ST-05 Code Review Report

**Phase:** CP-ST-05 — Session Data Loss Prevention
**Depth:** Standard (per-file analysis with TypeScript checks)
**Files Reviewed:** 11 source files
**Date:** 2026-05-16

---

## Critical Findings (4)

### CR-01: index.ts exceeds 500 LOC cap

- **File:** `src/features/session-tracker/index.ts:1`
- **Severity:** Critical
- **Description:** `index.ts` is 985 LOC — nearly double the 500 LOC project cap defined in `.planning/codebase/CONVENTIONS.md`. While 3 modules were extracted (bootstrap.ts, classification.ts, orphan-cleanup.ts), the main orchestrator still exceeds the limit.
- **Impact:** Violates architecture convention, reduces maintainability, increases cognitive load for future changes.
- **Remediation:** Extract hook handlers (`handleSessionCreated`, `handleToolExecuteBefore`, `handleToolExecuteAfter`, `handleChatMessage`) into `src/features/session-tracker/handlers/` subdirectory. Target: index.ts < 400 LOC after extraction.

### CR-02: PendingDispatchRegistry.has() false-positive bug

- **File:** `src/features/session-tracker/classification.ts:81`
- **Severity:** Critical
- **Description:** `SessionClassifier.classify()` calls `this.pendingRegistry?.has(sessionID)` at Gate 3. If `PendingDispatchRegistry.has()` returns `true` for ANY session when `byParent` has entries (not checking the specific sessionID), this causes false-positive child classification globally. Every session would be classified as child once any Task tool fires.
- **Impact:** All sessions misclassified as children → directory creation skipped → session data loss (the exact bug this phase was meant to fix).
- **Remediation:** Verify `PendingDispatchRegistry.has()` implementation checks the specific sessionID, not just whether the registry has any entries. Add unit test: `has()` returns false for unregistered sessionID when other sessions are registered.

### CR-03: event-capture.ts exceeds 500 LOC cap

- **File:** `src/features/session-tracker/capture/event-capture.ts:1`
- **Severity:** Critical
- **Description:** At 579 LOC, this module also violates the 500 LOC cap.
- **Impact:** Same as CR-01 — convention violation, harder to maintain.
- **Remediation:** Split into `event-capture/session.ts`, `event-capture/tool.ts`, `event-capture/chat.ts` following the single-responsibility principle.

### CR-04: Uncaught rm() error in orphan-quarantine.ts cleanupOld()

- **File:** `src/features/session-tracker/persistence/orphan-quarantine.ts`
- **Severity:** Critical
- **Description:** `cleanupOld()` calls `rm()` on quarantine entries without try-catch. Permission errors or EBUSY (file in use) will throw uncaught exceptions.
- **Impact:** Runtime crash during cleanup cycle, orphaned quarantine entries accumulate.
- **Remediation:** Wrap `rm()` in try-catch, log failures, continue processing remaining entries.

---

## Warning Findings (6)

### WR-01: Duplicated child-handling logic in status handlers

- **File:** `src/features/session-tracker/index.ts`
- **Severity:** Warning
- **Description:** Three status handlers (`idle`, `deleted`, `error`) contain duplicated child-handling logic (~80 lines each). Same pattern: poll children, update hierarchy, write continuity.
- **Impact:** DRY violation, bug fixes must be applied 3x, drift risk.
- **Remediation:** Extract `handleChildStatusUpdate()` helper function, call from each handler.

### WR-02: getSession calls lack try-catch in status handlers

- **File:** `src/features/session-tracker/index.ts`
- **Severity:** Warning
- **Description:** `getSession` calls inside status handlers are not wrapped in try-catch. SDK errors will prevent all status updates for that session.
- **Impact:** Session state becomes stale/untracked after transient SDK failure.
- **Remediation:** Wrap each `getSession` call in try-catch, log error, continue with fallback behavior.

### WR-03: initializeSessionFile appends instead of overwrites

- **File:** `src/features/session-tracker/persistence/session-writer.ts`
- **Severity:** Warning
- **Description:** `initializeSessionFile` uses append mode instead of overwrite. If the file already exists from a previous run, content will be corrupted (duplicated headers/metadata).
- **Impact:** Corrupted session files after restart/recovery scenarios.
- **Remediation:** Use `writeFile` (overwrite) instead of `appendFile`, or check existence first and truncate.

### WR-04: Unsafe `as` type assertions on parsed JSON

- **File:** `src/features/session-tracker/persistence/child-writer.ts`
- **Severity:** Warning
- **Description:** `copyForkedChildren` uses `as` type assertions on parsed JSON without validation. If the JSON structure doesn't match the expected type, runtime errors occur.
- **Impact:** Silent data corruption or runtime crashes.
- **Remediation:** Use Zod schema validation or runtime type guards before casting.

### WR-05: Untyped SDK method cast bypasses type checking

- **File:** `src/features/session-tracker/index.ts` — `pollForChildSessions`
- **Severity:** Warning
- **Description:** SDK method is cast with `as` to bypass TypeScript checking. If the SDK changes its API, this won't be caught at compile time.
- **Impact:** Silent runtime failures after SDK upgrade.
- **Remediation:** Define proper type for the SDK method in `shared/session-api.ts` or use a typed wrapper.

### WR-06: Retry loop insufficient for SDK race conditions

- **File:** `src/features/session-tracker/bootstrap.ts`
- **Severity:** Warning
- **Description:** Retry loop uses 2 attempts at 100ms intervals. Given that the root cause of this phase was race conditions with SDK `parentID` not being ready, 200ms total may still be insufficient under load.
- **Impact:** Classification may still fall through to slower gates under high concurrency.
- **Remediation:** Consider exponential backoff (100ms, 250ms, 500ms) or increase max attempts to 5. Document the trade-off between latency and accuracy.

---

## Info Findings (5)

### IN-01: Unused `client` parameter in SessionClassifier

- **File:** `src/features/session-tracker/classification.ts:35`
- **Severity:** Info
- **Description:** `OpenCodeClient` is accepted in the constructor but never used. The classifier only needs `hierarchyIndex` and `pendingRegistry`.
- **Remediation:** Remove unused `client` parameter from constructor.

### IN-02: Magic number 200 for content truncation

- **File:** `src/features/session-tracker/capture/event-capture.ts`
- **Severity:** Info
- **Description:** Hardcoded `200` character limit for content truncation with no explanation.
- **Remediation:** Extract as named constant `MAX_CONTENT_PREVIEW_LENGTH = 200` with JSDoc explaining the rationale.

### IN-03: Empty cleanup() method

- **File:** `src/features/session-tracker/index.ts`
- **Severity:** Info
- **Description:** `cleanup()` method exists but has no implementation. Dead code.
- **Remediation:** Remove or implement. If planned for future, add `// TODO: implement cleanup` comment.

### IN-04: Double-logging for unrecognized event types

- **File:** `src/features/session-tracker/capture/event-capture.ts`
- **Severity:** Info
- **Description:** Unrecognized event types are logged twice — once at debug level, once at warn level.
- **Remediation:** Single log at appropriate level (warn for truly unexpected, debug for known-but-unhandled).

### IN-05: Non-deterministic callID generation

- **File:** `src/features/session-tracker/persistence/pending-dispatch-registry.ts`
- **Severity:** Info
- **Description:** `Math.random()` used for callID generation. Not collision-resistant under high concurrency.
- **Remediation:** Use `crypto.randomUUID()` or a monotonic counter for deterministic, collision-free IDs.

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 4 |
| Warning | 6 |
| Info | 5 |
| **Total** | **15** |

**Top priority:** CR-02 (PendingDispatchRegistry false-positive) must be verified and fixed immediately — it could reintroduce the exact data loss bug this phase was designed to prevent.
