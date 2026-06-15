# Background Failure Family Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the four validated background execution failures so async delegated work reports accurate status, preserves parent visibility, and no longer misstates which runtime path actually executed.

**Architecture:** Keep the existing lifecycle model, but stop rewriting `builtin-process` into `builtin-subsession`. Route real process work through `runLifecycleProcessTask`, harden observer completion criteria for async child sessions, ensure parent continuity exists before offline notifications are persisted, and clarify the terminology boundary between delegated background sessions and OS background processes.

**Tech Stack:** TypeScript, Vitest, OpenCode plugin tools/hooks, harness continuity store.

---

### Task 1: Observer Completion Guard

**Files:**
- Modify: `src/lib/lifecycle-background-observer.ts`
- Test: `tests/lib/lifecycle-background-observer.test.ts`

- [ ] Add failing tests that prove a first `idle` poll does not immediately complete a child that has not shown work yet, while a later `idle` after startup delay does complete normally.
- [ ] Run: `npx vitest run tests/lib/lifecycle-background-observer.test.ts`
- [ ] Update observer polling to track whether busy work was ever seen and to respect startup timing before treating `idle` as terminal.
- [ ] Re-run: `npx vitest run tests/lib/lifecycle-background-observer.test.ts`

### Task 2: Builtin-Process Runtime Truthfulness

**Files:**
- Modify: `src/lib/lifecycle-manager.ts`
- Modify: `src/lib/lifecycle-process-runner.ts`
- Test: `tests/lib/background-manager-harden.test.ts`
- Test: `tests/tools/delegate-task.test.ts`

- [ ] Add failing tests that prove `builtin-process` work uses the process runner rather than silent fallback-to-subsession behavior.
- [ ] Run: `npx vitest run tests/lib/background-manager-harden.test.ts tests/tools/delegate-task.test.ts`
- [ ] Remove the execution-mode rewrite in `lifecycle-manager.ts` and branch to `runLifecycleProcessTask` when `execution.submode === "builtin-process"`.
- [ ] Re-run: `npx vitest run tests/lib/background-manager-harden.test.ts tests/tools/delegate-task.test.ts`

### Task 3: Parent Observability and Offline Delivery

**Files:**
- Modify: `src/lib/lifecycle-manager.ts`
- Modify: `src/hooks/create-core-hooks.ts`
- Test: `tests/hooks/create-core-hooks.test.ts`

- [ ] Add failing tests that prove a parent session with pending notifications receives them on session start and that a parent continuity record exists for persistence.
- [ ] Run: `npx vitest run tests/hooks/create-core-hooks.test.ts tests/lib/lifecycle-background-observer.test.ts`
- [ ] Ensure parent continuity exists before child launch persists background notifications, and inject formatted pending notifications into the parent session-start system context.
- [ ] Re-run: `npx vitest run tests/hooks/create-core-hooks.test.ts tests/lib/lifecycle-background-observer.test.ts`

### Task 4: Terminology Split Between Sessions and Processes

**Files:**
- Modify: `src/tools/delegate-task.ts`
- Modify: `src/tools/background/index.ts`
- Test: `tests/tools/background.test.ts`
- Test: `tests/tools/delegate-task.test.ts`

- [ ] Add failing assertions for tool descriptions/messages that distinguish async delegated child sessions from OS process management.
- [ ] Run: `npx vitest run tests/tools/background.test.ts tests/tools/delegate-task.test.ts`
- [ ] Update tool copy and result wording so `run_in_background` means async delegated session work and the `background` tool explicitly manages OS child processes.
- [ ] Re-run: `npx vitest run tests/tools/background.test.ts tests/tools/delegate-task.test.ts`

### Task 5: Integrated Verification

**Files:**
- Verify only: `tests/lib/lifecycle-background-observer.test.ts`
- Verify only: `tests/lib/background-manager-harden.test.ts`
- Verify only: `tests/hooks/create-core-hooks.test.ts`
- Verify only: `tests/tools/delegate-task.test.ts`
- Verify only: `tests/tools/background.test.ts`

- [ ] Run the targeted regression suite: `npx vitest run tests/lib/lifecycle-background-observer.test.ts tests/lib/background-manager-harden.test.ts tests/hooks/create-core-hooks.test.ts tests/tools/delegate-task.test.ts tests/tools/background.test.ts`
- [ ] Run typecheck: `npm run typecheck`
- [ ] Summarize any remaining gaps or follow-up cleanup that is now optional rather than required for correctness.
