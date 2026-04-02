# src/lib — Core Library

Business logic layer for the harness control plane. All modules are imported by `src/plugin.ts` (composition root above).

## MODULE RESPONSIBILITIES

| Module | LOC | Role | Key Exports |
|--------|-----|------|-------------|
| `continuity.ts` | 635 ⚠️ | Durable JSON persistence + normalization + deep-clone | `getSessionContinuity`, `recordSessionContinuity`, `patchSessionContinuity`, `hydrateFromContinuity` |
| `lifecycle-manager.ts` | 628 ⚠️ | Session state machine: created→queued→dispatching→running→completed/failed | `createHarnessLifecycleManager`, `launchDelegatedSession`, `handleEvent` |
| `session-api.ts` | 473 ⚠️ | OpenCode SDK adapter with 5x multi-path fallback | `createSessionByAnyPath`, `promptSessionByAnyPath`, `waitForAssistantText`, `walkParentChain` |
| `runtime.ts` | 154 | Merges continuity + route + delegation + chat input → single `EffectivePromptState` | `getEffectivePromptState`, `inferContinuityStatusFromEvent` |
| `helpers.ts` | 141 ⚠️ | Generic utils (`isObject`, `asString`, `stableStringify`) + agent tool restriction tables | `isObject`, `asString`, `buildPromptText`, `isToolRestrictedForAgent` |
| `routing.ts` | 113 | Static routing: category→agent/model/temperature/guidance | `resolveDelegationRoute`, `listDelegationCategories`, `isDelegationCategory` |
| `state.ts` | 106 | In-memory Maps: sessionStats, rootBudgets, sessionToRoot, sessionDelegationMeta | `ensureSessionStats`, `reserveDescendant`, `getDelegationMeta` |
| `concurrency.ts` | 98 | Keyed semaphore (FIFO queue per concurrency key) | `DelegationConcurrencyQueue` |
| `types.ts` | 155 | Shared types + constants — leaf node, imported by 8/10 modules | `VALID_AGENTS`, `VALID_DELEGATION_CATEGORIES`, all type definitions |

## DEPENDENCY GRAPH

```
types.ts (leaf — no imports)
├── state.ts → types.ts
├── routing.ts → types.ts
├── helpers.ts → types.ts
├── concurrency.ts (self-contained — no imports)
├── continuity.ts → types.ts
├── session-api.ts → helpers.ts + types.ts
├── runtime.ts → continuity.ts + helpers.ts + routing.ts + state.ts + types.ts
└── lifecycle-manager.ts → concurrency.ts + continuity.ts + state.ts + runtime.ts + session-api.ts + types.ts
```

**Max chain:** 4 levels. `types.ts` changes ripple everywhere.

## WHERE TO LOOK

| Task | Location |
|------|----------|
| Change session persistence format | `continuity.ts` — `loadStoreFromDisk()`, `persistStore()`, `normalize*()` functions |
| Add a session lifecycle phase | `types.ts:84-91` (SessionLifecyclePhase) + `lifecycle-manager.ts` state machine |
| Change SDK call fallback order | `session-api.ts` — each `*ByAnyPath` function tries 3-5 call variants |
| Change concurrency model | `concurrency.ts` — `DelegationConcurrencyQueue.acquire()/release()` |
| Add agent temperature config | `routing.ts:16-20` (AGENT_TEMPERATURES) |
| Add category routing config | `routing.ts:22-55` (CATEGORY_CONFIGS) |
| Change tool restriction for an agent | `helpers.ts:3-6` (RESTRICTED_TOOLS_PER_AGENT) + `plugin.ts:67-102` (getPermissionRulesForAgent) — **must update both** |
| Change how effective prompt state is resolved | `runtime.ts:8` — `getEffectivePromptState()` priority chain |

## CONVENTIONS

- **Deep-clone-on-read** in continuity store — all `clone*()` functions prevent mutation aliasing
- **`asRecord()`/`asString()`** in `continuity.ts` are file-private — use shared `isObject()`/`asString()` from `helpers.ts` instead
- **Multi-path SDK fallback** pattern: try path-param variant → body-param variant → throw last error
- **Warning cap**: `addWarning()` in `state.ts` caps at 25 per session
- **Semaphore keys** built from `buildDelegationQueueKey()` — combines model + agent + category

## CODE SMELLS — PRIORITIZED SPLIT PLAN

1. **`continuity.ts` (635 LOC)** — Split into `continuity-normalizer.ts` (~300 LOC of `normalize*` functions) + `continuity-clone.ts` (~70 LOC) + `continuity.ts` (CRUD only)
2. **`lifecycle-manager.ts` (628 LOC)** — Extract `launchDelegatedSession` (~210 LOC) into `session-launcher.ts`
3. **`session-api.ts` (473 LOC)** — Extract polling/SSE waiters (~180 LOC) into `session-waiter.ts`
4. **`helpers.ts` (141 LOC, mixed)** — Extract `RESTRICTED_TOOLS_PER_AGENT`, `AGENT_REQUIRED_TOOLS`, `AGENT_MUST_NOT`, `buildPromptText` into `tool-restrictions.ts`

## NOTES

- `continuity.ts:26` module-level `storeCache` singleton prevents isolated unit testing
- `asString` duplicated in `helpers.ts:48` and `continuity.ts:110` — consolidation pending
- `session-api.ts` multi-path fallback is copy-pasted 5x with slight variations — DRY candidate
- Tool restriction tables in `helpers.ts` overlap with permission rules in `plugin.ts` — should consolidate into single source of truth



ALL AGENTS MUST USE SKILLS, VERY ITERATIVELY, EACH TURN, TDD, VALIDATION, GRANULAR TASKS INCREMENTAL CHECKS

## Mandate non-negotiable development workflow

USING THESE SKILLS TO ACTIVATE

1. **brainstorming** - Activates before writing code. Refines rough ideas through questions, explores alternatives, presents design in sections for validation. Saves design document.

2. **using-git-worktrees** - Activates after design approval. Creates isolated workspace on new branch, runs project setup, verifies clean test baseline.

3. **writing-plans** - Activates with approved design. Breaks work into bite-sized tasks (2-5 minutes each). Every task has exact file paths, complete code, verification steps.

4. **subagent-driven-development** or **executing-plans** - Activates with plan. Dispatches fresh subagent per task with two-stage review (spec compliance, then code quality), or executes in batches with human checkpoints.

5. **test-driven-development** - Activates during implementation. Enforces RED-GREEN-REFACTOR: write failing test, watch it fail, write minimal code, watch it pass, commit. Deletes code written before tests.

6. **requesting-code-review** - Activates between tasks. Reviews against plan, reports issues by severity. Critical issues block progress.

7. **finishing-a-development-branch** - Activates when tasks complete. Verifies tests, presents options (merge/PR/keep/discard), cleans up worktree.

**The agent checks for relevant skills before any task.** Mandatory workflows, not suggestions.
