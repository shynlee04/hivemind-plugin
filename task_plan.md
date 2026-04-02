# Phase 12: Harness Rebuild — TDD Execution Plan

**Goal:** Rebuild harness plugin with oh-my-openagent patterns (task lifecycle, stability detection, notification, task status types) + delete platform-duplicated code. Everything with tests.

**Architecture:** Factory + Composition + Handler patterns. Agent configs from .md files, not hardcoded TypeScript.

**Tech Stack:** TypeScript 5.3+ strict ESM, `@opencode-ai/plugin` SDK ≥1.1.0, Vitest, Node ≥20. Zero runtime deps.

---

## Verified SDK Facts

| Fact | Impact |
|---|---|
| `session.prompt()` blocks — returns AssistantMessage | Sync: just call sendPrompt, get result directly |
| `session.promptAsync()` returns void (204) | Async: fire and forget |
| `session.idle` event emitted on completion | CompletionDetector uses this as primary signal |
| `noReply: true` still triggers AI | Cannot inject messages into parent safely |
| Agent `.md` sets SELF permissions | `getPermissionRulesForAgent()` still needed for CHILD session permissions |

---

## What We Keep

| What | Why |
|---|---|
| `getPermissionRulesForAgent()` in plugin.ts | Agent .md defines SELF permissions; child sessions need explicit permission rules |
| `buildPromptText()` in helpers.ts | Structured delegation prompt format (TASK/EXPECTED_OUTCOME/MUST_DO/MUST_NOT_DO/CONTEXT) |
| `normalizeCategory()` | Input validation for category parameter |
| `inferContinuityStatusFromEvent()` | Event→status mapping for handleEvent |
| `concurrency.ts` | Keyed semaphore — genuine value |
| `continuity.ts` | Durable JSON persistence — genuine value |
| `state.ts` | In-memory budget tracking — genuine value |

## What We Delete

| File | Reason |
|---|---|
| `routing.ts` | Agent .md files define temperature/model — no need for CATEGORY_CONFIGS |
| `session-completion-tracker.ts` | Replace with CompletionDetector (has stability) |
| `session-completion-tracker.test.ts` | Module deleted |

## What We Rewrite

| File | Change |
|---|---|
| `session-api.ts` | Remove: sendPromptAsync, extractAssistantText, waitForAssistantText. Keep: 10 typed wrappers |
| `helpers.ts` | Remove: RESTRICTED_TOOLS_PER_AGENT, AGENT_REQUIRED_TOOLS, AGENT_MUST_NOT, sleep(). Keep: pure utilities + buildPromptText + getPromptToolCompatibility |
| `lifecycle-manager.ts` | Add: CompletionDetector integration. Simplify: launchDelegatedSession. Remove: tracker, lifecycle state machine bloat |
| `plugin.ts` | Remove: routing imports, POLL_INTERVAL_MS. Keep: all hooks, delegate-task tool |
| `runtime.ts` | Remove: getEffectivePromptState (platform handles). Keep: inferContinuityStatusFromEvent |
| `types.ts` | Add: TaskStatus 7-value system replacing 4-value SessionContinuityMetadata.status |

## What We Create

| File | Purpose | LOC |
|---|---|---|
| `task-status.ts` | TaskStatus type + transition guards | ~100 |
| `completion-detector.ts` | Two-signal completion detection with stability | ~120 |

## Execution Order

### Wave 1: Delete routing.ts, session-completion-tracker.ts, update imports
- Delete routing.ts
- Delete session-completion-tracker.ts + test
- Remove all routing imports from plugin.ts, lifecycle-manager.ts
- Verify typecheck

### Wave 2: Create task-status.ts (TDD RED-GREEN)
- Write tests for TaskStatus type and canTransition
- Implement task-status.ts
- Verify tests pass, commit

### Wave 3: Rewrite helpers.ts (TDD)
- Write tests for kept functions
- Remove agent config maps + sleep()
- Verify tests pass, commit

### Wave 4: Rewrite session-api.ts (TDD)
- Write tests for kept typed wrappers
- Remove completion detection functions
- Verify tests pass, commit

### Wave 5: Create completion-detector.ts (TDD RED-GREEN)
- Write tests for feed/watch/cancel + stability
- Implement CompletionDetector
- Verify tests pass, commit

### Wave 6: Rewrite runtime.ts
- Keep: inferContinuityStatusFromEvent
- Delete: getEffectivePromptState
- Verify typecheck, commit

### Wave 7: Rewrite lifecycle-manager.ts
- Use CompletionDetector instead of old tracker
- Simplify launchDelegatedSession
- Add completion notification to continuity store
- Verify typecheck, commit

### Wave 8: Rewrite plugin.ts
- Remove routing imports, POLL_INTERVAL_MS
- Keep: all hooks, delegate-task, getPermissionRulesForAgent
- Verify typecheck, commit

### Wave 9: Update types.ts
- Change SessionContinuityMetadata.status to TaskStatus (7-value)
- Verify typecheck, commit

### Wave 10: Verification Gate
- typecheck + all tests + build + pack
- Code review via critic
- Update AGENTS.md
- Commit
