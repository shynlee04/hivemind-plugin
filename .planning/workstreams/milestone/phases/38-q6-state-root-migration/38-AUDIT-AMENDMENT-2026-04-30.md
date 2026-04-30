---
phase: 38
amendment_source: delegation-async-pty-lifecycle-audit-2026-04-30.md
severity: high_override
author: hm-l1-coordinator
---

# Phase 38: AUDIT AMENDMENT — No Runtime State Files Exist on Disk

**Audit Date:** 2026-04-30
**Previous Status:** PENDING (depends on Phase 35)
**Amended Status:** **BLOCKED — STATE PERSISTENCE NEVER INITIALIZED**

---

## ⚠ POST-VALIDATION OVERRIDE (2026-04-30)

This amendment's central claim — *"no runtime state files exist on disk"* — is **REFUTED** by the validation pass documented in `../../AUDIT-VALIDATION-2026-04-30.md`. Evidence on disk at the head of `feature/harness-implementation`:

- `.hivemind/state/session-continuity.json` — **EXISTS**, valid JSON, contains real recovered session data (`ses-parent-session` with `pendingNotifications`, `recoveryGuarantee`, `terminalState`, `delegationId`).
- `.hivemind/state/delegations.json` — **EXISTS**, valid JSON array with real delegation records including `gracePeriodExpiresAt`, `executionMode: "sdk"`, `queueKey`, `nestingDepth`, and the worktree path itself (`/Users/apple/hivemind-plugin/.worktrees/harness-experiment`) recorded as `workingDirectory`.
- `.hivemind/state/` also contains `progress.md`, `task_plan.md`, `config-workflows.json`, `.patches/`, planning subfolders.

**Effective status:** DOWNGRADED from BLOCKED → **PARTIAL**.

**Replacement work item:** Phase **38.1** (`../../phases/38.1-state-persistence-final-sweep/`) closes the narrow residual gap — `brain.json` populate-vs-delete (HIVEMIND-ROOT-08) plus a fresh-install regression test. HIVEMIND-ROOT-04, -05, -06, -07 from the amendment below describe behaviors that are already implemented; verify but do NOT re-implement.

The original amendment text is retained below for historical/audit-trail purposes only.

---

## Audit Override

The 2026-04-30 comprehensive audit reveals that **no runtime state files exist on disk**:

- `find` for `session-continuity.json` — 0 results
- `find` for `delegations.json` — 0 results
- `.hivemind/state/brain.json` — all fields `null`, `[]`, or `false`
- `.hivemind/delegation/` — empty directory
- `.hivemind/state/` — exists but contains only empty `brain.json`

**The continuity store code exists but has never been exercised with real persisted state.** Recovery is theoretical — the code paths exist but have never run with actual files on disk.

This means:
- Session recovery on restart is **untested in practice**
- Delegation persistence is **write-only-if-file-exists** (which it doesn't)
- The `.hivemind/` state root migration (Q6) is incomplete — files aren't being created

---

## Amended Requirements

### HIVEMIND-ROOT-04: Fix continuity file path creation

**New Requirement:** Ensure `mkdirSync(dirname(continuityFile), { recursive: true })` runs before first write.

**Details:**
- `continuity.ts:90-96` (main repo) and worktree equivalent must create parent directories
- Default path: `.hivemind/state/opencode-harness/session-continuity.json` (per Q6)
- If `OPENCODE_HARNESS_CONTINUITY_FILE` env var is set, create its parent directories too

**Acceptance Criterion:** After first harness startup (or first `delegate-task`), the continuity file exists on disk with valid JSON content.

**Priority:** P0 CRITICAL

**Affected Files:** `src/lib/continuity.ts:90-96`

---

### HIVEMIND-ROOT-05: Add startup file existence check

**New Requirement:** If continuity file is missing on startup, create it with empty valid JSON.

**Details:**
- On plugin load or first store access, check if file exists
- If missing, create with `{ sessions: [], stats: {}, rootBudgets: {}, version: 1 }`
- Do not throw `ENOENT` errors

**Acceptance Criterion:**
- Clean `.hivemind/` directory → first `delegate-task` creates all state files
- No `ENOENT` errors on fresh install

**Priority:** P0 CRITICAL

**Affected Files:** `src/lib/continuity.ts`

---

### HIVEMIND-ROOT-06: Verify `delegations.json` file creation

**New Requirement:** The `getDelegationsFilePath()` in `delegation-persistence.ts:53` must create its parent directory before writing.

**Details:**
- Path should be `.hivemind/state/delegations.json` (per Q6)
- `writeFileSync` must be preceded by `mkdirSync(dirname(path), { recursive: true })`
- File must be created on first delegation, not fail silently

**Acceptance Criterion:** `.hivemind/state/delegations.json` exists after first `delegate-task` call.

**Priority:** P0 CRITICAL

**Affected Files:** `src/lib/delegation-persistence.ts:37-55`

---

### HIVEMIND-ROOT-07: Add recovery test simulating process restart

**New Requirement:** Add a test that simulates process restart and verifies state restoration.

**Details:**
- Test creates a delegation, persists state
- Test destroys in-memory state (simulating process restart)
- Test reloads state from disk
- Test verifies delegation is recoverable with correct status

**Acceptance Criterion:** `tests/lib/continuity.test.ts` or similar contains a restart-recovery test.

**Priority:** P1 HIGH

**Affected Files:** `tests/lib/continuity.test.ts` (new file)

---

### HIVEMIND-ROOT-08: Populate `brain.json` or delete it

**New Requirement:** `.hivemind/state/brain.json` is empty and misleading. Either populate it or remove it.

**Details:**
- If `brain.json` is a legacy artifact from an earlier architecture, delete it
- If it serves a purpose, document that purpose and populate it
- Empty files confuse debugging and suggest broken state

**Acceptance Criterion:** `.hivemind/state/brain.json` either contains real data or does not exist.

**Priority:** P2 MEDIUM

**Affected Files:** `.hivemind/state/brain.json`

---

## Verification Criteria (Added)

- [ ] `.hivemind/state/session-continuity.json` exists after first harness startup
- [ ] `.hivemind/state/delegations.json` exists after first delegation
- [ ] No `ENOENT` errors on fresh install
- [ ] Recovery test simulates restart and verifies state restoration
- [ ] `.hivemind/state/brain.json` is either populated or deleted
- [ ] All state paths use `.hivemind/` (not `.opencode/state/`) per Q6

---

## Cross-Phase Impact

| Phase | Impact |
|-------|--------|
| Phase 25 (Session Journal) | Must verify continuity writes to correct path |
| Phase 66 (Recovery Engine) | Needs files to exist before recovery can work |
| Phase 48.1 (Runtime Correctness) | File existence is prerequisite for correctness tests |
| Phase 53 (Release Readiness) | State persistence is a release blocker |

---

_Amended: 2026-04-30_
_Priority: P0 CRITICAL — recovery is theoretical without files on disk_
