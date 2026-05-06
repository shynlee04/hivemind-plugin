---
phase: 46
amendment_source: delegation-async-pty-lifecycle-audit-2026-04-30.md
severity: critical_override
author: hm-l1-coordinator
---

# Phase 46: AUDIT AMENDMENT — "Always-Background" is Conditional; Policy Gate Blocks Async

**Audit Date:** 2026-04-30
**Previous Status:** COMPLETE (REM-HIGH-02, REM-HIGH-03, REM-HIGH-04)
**Amended Status:** **PARTIAL — NEW CRITICAL GAP: REM-HIGH-05**

---

## Audit Override

The 2026-04-30 comprehensive audit reveals that **the "always-background" claim is false**:

- `delegation-manager.ts:208-211`: Uses `sendPromptAsync` **only** if `runtimePolicy.trustedRuntime.builtinAsyncBackgroundChildSessions` is `true`
- Otherwise uses **blocking** `sendPrompt`
- Tool description says "always-background WaiterModel" (`delegate-task.ts:35`) but implementation is gated by policy flag
- The policy flag is NOT documented to end users and defaults may be `false`

**This means `run_in_background: true` does NOT guarantee async execution.** The user-requested background mode can be silently downgraded to blocking mode without warning.

Additionally, the audit found:
- `buildDelegationPromptTools` (`delegation-manager.ts:90-95`) sets `"task": false`, `"delegate-task": false` for all delegated sessions
- Native OpenCode `task` tool is completely disabled with no fallback
- If harness delegation breaks, there is NO alternative delegation path

---

## Amended Requirements

### REM-HIGH-05: Remove `builtinAsyncBackgroundChildSessions` policy gate

**New Requirement:** When `run_in_background: true` is passed to `delegate-task`, ALWAYS use `sendPromptAsync` (or equivalent non-blocking dispatch). Remove the policy flag dependency for background mode.

**Details:**
- Delete the `if (this.runtimePolicy.trustedRuntime.builtinAsyncBackgroundChildSessions)` check at `delegation-manager.ts:208-211`
- Always use `sendPromptAsync` when `run_in_background: true`
- If the runtime truly cannot support async (e.g., old SDK version), throw an explicit error: `"[Harness] Async background execution not supported by current runtime. Use run_in_background: false for synchronous execution."`
- Do NOT silently downgrade to blocking mode

**Acceptance Criterion:**
- Given `run_in_background: true`, `sendPromptAsync` is ALWAYS called
- Given `run_in_background: false`, `sendPrompt` is called (sync mode)
- No policy flag gates this behavior
- Explicit error if runtime lacks async support

**Priority:** P0 CRITICAL

**Affected Files:** `src/lib/delegation-manager.ts:208-211`, `src/tools/delegate-task.ts:35` (update description)

---

### REM-HIGH-06: Document or enable native `task` tool fallback

**New Requirement:** The harness currently replaces OpenCode's native `task` tool with its own custom `delegate-task` tool. If the harness breaks, delegation is completely unavailable. Document this risk or provide a fallback.

**Options:**
- Option A: Allow delegated sessions to use native `task` for nested delegation (one level only)
- Option B: Document in AGENTS.md that harness delegation is the ONLY supported path and failures are terminal
- Option C: Add a `fallback-to-native-task` parameter that uses OpenCode's built-in `task` when harness is unavailable

**Acceptance Criterion:**
- AGENTS.md explicitly documents that `task` is disabled and why
- If Option A: delegated sessions can use `task` for nested delegation; tests verify this works
- If Option B: documentation includes failure mode guidance (what to do when `delegate-task` fails)

**Priority:** P1 HIGH

**Affected Files:** `src/plugin.ts:50-54`, `src/lib/delegation-manager.ts:90-95`, `AGENTS.md`

---

### REM-HIGH-07: Fix `delegate-task` tool description

**New Requirement:** Update the tool description to truthfully describe behavior.

**Current (False):** `[REQUIRES OpenCode RUNTIME] Always-background WaiterModel...`

**Required:**
- Remove "Always-background" if background is conditional
- Or make it actually always-background (see REM-HIGH-05)
- Document that async execution requires runtime support
- Document the fallback to sync mode (if any)

**Acceptance Criterion:** Tool description matches actual implementation. No false claims.

**Priority:** P1 HIGH

**Affected Files:** `src/tools/delegate-task.ts:35`, `src/tools/delegate-task.ts:46-52`

---

## Verification Criteria (Added)

- [ ] `run_in_background: true` always calls `sendPromptAsync` — verify with test
- [ ] `run_in_background: false` always calls `sendPrompt` — verify with test
- [ ] No `runtimePolicy.trustedRuntime.builtinAsyncBackgroundChildSessions` check exists in dispatch path
- [ ] `delegate-task` tool description does not claim "always-background" unless true
- [ ] AGENTS.md documents `task` disablement and implications
- [ ] If native `task` fallback enabled, test verifies nested delegation works

---

## Cross-Phase Impact

| Phase | Impact |
|-------|--------|
| Phase 16 (Background Delegation) | Must update to remove policy gate |
| Phase 36 (Lifecycle State Machine) | Background dispatch path simplified |
| Phase 45 (SDK Permission Boundary) | May need to allow `task` in child sessions |
| Phase 52 (End-User Acceptance) | E2E tests must verify true async behavior |

---

_Amended: 2026-04-30_
_Priority: P0 CRITICAL — silent downgrade of background to sync is a broken contract_
