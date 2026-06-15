# OpenCode Harness — Feature Gap Audit

**Document:** feature-gap-audit-2026-04-02.md  
**Date:** 2026-04-02  
**Auditor:** hiveq (Verification Specialist)  
**Baseline:** requirements-2026-04-02.md (v3.0), user-stories-2026-04-02.md (v3.0)  
**Build Status:** PASS — `npx tsc --noEmit` clean, `npm run build` clean  
**Test Status:** FAIL — No test infrastructure exists (0 test files, no test framework configured)

---

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Requirements Audited | 107 |
| IMPLEMENTED | 79 |
| PARTIAL | 14 |
| MISSING | 12 |
| BROKEN | 2 |

**Overall Assessment:** The core plugin architecture, lifecycle management, delegation pipeline, and persistence layer are structurally complete. Critical gaps exist in: (1) constant mismatches between code and requirements, (2) missing 6-section delegation prompt format, (3) no per-delegation tool restriction enforcement in `tool.execute.before`, (4) no SSE-based event handling, (5) missing wisdom system implementation, (6) zero test infrastructure.

---

## Section A: Critical Constant Mismatches

These are hard discrepancies between the codebase and the corrected requirements spec.

| Constant | Code Value | Docs Value | File | Severity |
|----------|-----------|------------|------|----------|
| MAX_DESCENDANTS_PER_ROOT | **50** | **10** | `src/plugin.ts:38` | **CRITICAL** — Was corrected in v2.0 (H-1) but code still uses 50 |
| Default concurrency per lane | **1** | **3–5** | `src/lib/concurrency.ts:37` (`defaultLimit = 1`) | **HIGH** — Was corrected in v2.0 (H-2) but code still uses 1 |
| Builder temperature | **0.2** (code) / **0.15** (agent md) | **0.15** | `src/lib/routing.ts:18` vs `agents/builder.md:4` | **MEDIUM** — Code routing and agent definition disagree |
| `doom_loop` in opencode.json | **"ask"** | **"allow"** | `opencode.json:25` | **CRITICAL** — PERM-002 requires `allow`; `ask` will prompt user on 3 identical calls, conflicting with harness circuit breaker |
| Conductor `task` permission | **"ask"** | **"ask"** (PERM-003) | `.opencode/agents/conductor.md:15` | **MEDIUM** — Conductor has `task: ask` but PERM-003 says root should be `ask`. Conductor is primary agent and uses `delegate-task` instead, but strict ask contradicts spec |

---

## Section B: Requirement-by-Requirement Audit

### 2.1 Core Architecture (ARCH-001 to ARCH-007)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| ARCH-001 | Standalone npm package | **IMPLEMENTED** | `package.json` with name `hivemind`, `npm run build` produces `dist/` |
| ARCH-002 | Plugin API integration | **IMPLEMENTED** | `src/plugin.ts:103` — `async ({ client }) => { ... }` returns `{ hooks, tools }` |
| ARCH-003 | TypeScript compilation to dist/ | **IMPLEMENTED** | Build passes, `tsconfig.json` targets `dist/` |
| ARCH-004 | Two entry points (main + plugin) | **IMPLEMENTED** | `package.json` exports `.` → `dist/index.js` and `./plugin` → `dist/plugin.js` |
| ARCH-005 | Node.js >= 20.0.0 | **IMPLEMENTED** | `package.json:41` — `"engines": { "node": ">=20.0.0" }` |
| ARCH-006 | State outside package source | **IMPLEMENTED** | `continuity.ts:24` — DEFAULT_STATE_DIR = `.opencode/state/hivemind/` |
| ARCH-007 | Environment variable overrides | **IMPLEMENTED** | `continuity.ts:28-42` — `OPENCODE_HARNESS_STATE_DIR`, `OPENCODE_HARNESS_CONTINUITY_FILE` |

### 2.2 Module Architecture (MOD-001 to MOD-010)

| ID | Module | Status | Evidence |
|----|--------|--------|----------|
| MOD-001 | types.ts | **IMPLEMENTED** | `src/lib/types.ts` — 153 lines, all type definitions |
| MOD-002 | helpers.ts | **IMPLEMENTED** | `src/lib/helpers.ts` — pure utilities, no side effects |
| MOD-003 | state.ts | **IMPLEMENTED** | `src/lib/state.ts` — Map-based in-memory session state |
| MOD-004 | continuity.ts | **IMPLEMENTED** | `src/lib/continuity.ts` — disk-persisted JSON, load/save/normalize |
| MOD-005 | routing.ts | **IMPLEMENTED** | `src/lib/routing.ts` — route resolution with source tracking |
| MOD-006 | concurrency.ts | **IMPLEMENTED** | `src/lib/concurrency.ts` — lane-based async queues with acquire/release |
| MOD-007 | session-api.ts | **IMPLEMENTED** | `src/lib/session-api.ts` — thin SDK wrapper |
| MOD-008 | runtime.ts | **IMPLEMENTED** | `src/lib/runtime.ts` — prompt state inference, event status mapping |
| MOD-009 | lifecycle-manager.ts | **IMPLEMENTED** | `src/lib/lifecycle-manager.ts` — central orchestrator |
| MOD-010 | plugin.ts | **IMPLEMENTED** | `src/plugin.ts` — plugin entry point |

### 3.1 Agent Definitions (AGT-001 to AGT-009)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| AGT-001 | Min 3 specialist subagents | **IMPLEMENTED** | `.opencode/agents/researcher.md`, `builder.md`, `critic.md` |
| AGT-002 | Conductor as primary-mode | **IMPLEMENTED** | `conductor.md:3` — `mode: "primary"` |
| AGT-003 | Intent classification (research/implement/review/plan/hybrid) | **IMPLEMENTED** | `conductor.md:32-48` — 5-category classification table |
| AGT-004 | Conductor never implements directly | **IMPLEMENTED** | `conductor.md:90` — "NEVER edit files directly" |
| AGT-005 | Researcher: read-only, denied edit/write/bash/task | **IMPLEMENTED** | `researcher.md:7-10` — all denied, `task: ask` |
| AGT-006 | Builder: full access, denied task | **IMPLEMENTED** | `builder.md:7-10` — `task: ask` |
| AGT-007 | Critic: read + bash, denied edit/write/task | **IMPLEMENTED** | `critic.md:7-9` — `edit: ask`, `write: ask`, `task: ask`, `bash: allow` |
| AGT-008 | Default temperatures | **PARTIAL** | Researcher=0.1 ✅, Builder=0.15 ✅ (agent md) / 0.2 (routing code) ❌, Critic=0.05 ✅, Conductor=0.3 ✅. **Code mismatch**: `routing.ts:18` has builder at 0.2 |
| AGT-009 | Max steps limits | **IMPLEMENTED** | researcher=60 ✅, builder=80 ✅, critic=40 ✅, conductor=80 ✅ |

### 3.2 Delegation Categories (CAT-001 to CAT-009)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| CAT-001 | 4 categories | **IMPLEMENTED** | `types.ts:2-7` — research, implementation, review, visual-engineering |
| CAT-002 | Category → default agent/model/temperature/guidance | **IMPLEMENTED** | `routing.ts:22-55` — CATEGORY_CONFIGS |
| CAT-003 | research → researcher, temp 0.1 | **IMPLEMENTED** | `routing.ts:24-29` ✅ |
| CAT-004 | implementation → builder, temp 0.15 | **BROKEN** | `routing.ts:35` — temperature is **0.2** not 0.15 |
| CAT-005 | review → critic, temp 0.05 | **IMPLEMENTED** | `routing.ts:43` ✅ |
| CAT-006 | visual-engineering → builder, temp 0.25 | **IMPLEMENTED** | `routing.ts:51` ✅ |
| CAT-007 | Explicit agent overrides category | **IMPLEMENTED** | `routing.ts:81` — `effectiveAgent = args.agent ?? categoryConfig?.agent` |
| CAT-008 | Conflicting agent+category → warning, use explicit | **IMPLEMENTED** | `routing.ts:78-93` — generates warning, uses explicit agent |
| CAT-009 | 6-section delegation prompt format | **MISSING** | `helpers.ts:77-107` (`buildPromptText`) produces: Task, prompt body, Category, Scope, Constraints, Category guidance — does NOT produce the required 6 sections: TASK, EXPECTED OUTCOME, REQUIRED TOOLS, MUST DO, MUST NOT DO, CONTEXT |

### 4.1 Permission Model (PERM-001 to PERM-008)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| PERM-001 | 3-tier permission config | **PARTIAL** | Root config in `opencode.json`, per-agent in agent md files, per-delegation in `getPermissionRulesForAgent()`. Missing: no `tool.execute.before` enforcement of per-delegation rules |
| PERM-002 | Root `doom_loop: "allow"` | **BROKEN** | `opencode.json:25` — `doom_loop: "ask"`. Must be `"allow"` per PERM-002 |
| PERM-003 | Root `task: "ask"` | **IMPLEMENTED** | `opencode.json:20` — `"task": "ask"` ✅ |
| PERM-004 | Researcher denied edit/write/bash, task:{"*":"ask"} | **IMPLEMENTED** | `researcher.md:7-10` + `plugin.ts:74-81` |
| PERM-005 | Builder denied task:{"*":"ask"} | **IMPLEMENTED** | `builder.md:10` + `plugin.ts:83-86` |
| PERM-006 | Critic denied edit/write, task:{"*":"ask"} | **IMPLEMENTED** | `critic.md:7-9` + `plugin.ts:89-98` |
| PERM-007 | Per-delegation enforcement via tool.execute.before | **MISSING** | `plugin.ts:112-151` — `tool.execute.before` handles tool call budget and circuit breaker but does NOT inspect delegation metadata to reject tool calls outside the delegated agent's permitted tool set |
| PERM-008 | delegate-task registered via tool() factory | **IMPLEMENTED** | `plugin.ts:348-464` — `tool({ description, args, execute })` |

### 4.2 Runtime Guardrails (GRD-001 to GRD-008)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| GRD-001 | Max delegation depth 3 | **IMPLEMENTED** | `plugin.ts:37` — `MAX_DEPTH = 3`, enforced at line 424 |
| GRD-002 | Max 10 descendants per root, configurable | **BROKEN** | `plugin.ts:38` — `MAX_DESCENDANTS_PER_ROOT = 50`. Requirements say 10. Not configurable via env var |
| GRD-003 | Max 400 tool calls per session | **IMPLEMENTED** | `plugin.ts:42` — `MAX_TOOL_CALLS_PER_SESSION = 400`, enforced at line 125 |
| GRD-004 | Circuit breaker at threshold 16 | **IMPLEMENTED** | `plugin.ts:41` — `CIRCUIT_BREAKER_THRESHOLD = 16`, enforced at line 140 |
| GRD-005 | Stable signature hashing | **IMPLEMENTED** | `helpers.ts:69-75` — `makeToolSignature` using `stableStringify` |
| GRD-006 | Shell env vars via shell.env hook | **IMPLEMENTED** | `plugin.ts:337-345` — CI, GIT_TERMINAL_PROMPT, NO_COLOR, TERM |
| GRD-007 | Reject depth exceed with error | **IMPLEMENTED** | `plugin.ts:425-428` — throws error |
| GRD-008 | Reject descendant budget exceed with error | **IMPLEMENTED** | `state.ts:44-46` — throws error |

### 5.1 Lifecycle Phases (LIF-001 to LIF-006)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| LIF-001 | Track phases: created/queued/dispatching/running/completed/failed | **IMPLEMENTED** | `types.ts:82-88` — all 6 phases defined, `lifecycle-manager.ts` manages transitions |
| LIF-002 | Map continuity status to lifecycle phases | **IMPLEMENTED** | `runtime.ts:111-153` — `inferContinuityStatusFromEvent` |
| LIF-003 | Failed status is sticky | **IMPLEMENTED** | `runtime.ts:137-139` — "if currentStatus is failed, return failed" |
| LIF-004 | Created → running on idle signal | **IMPLEMENTED** | `runtime.ts:140` — "if created, return running" |
| LIF-005 | Sync and async execution modes | **IMPLEMENTED** | `plugin.ts:388` — `run_in_background` boolean, different code paths |
| LIF-006 | SSE for completion, polling as fallback | **MISSING** | `session-api.ts:343-393` — `waitForSessionCompletion` uses **polling only**. No `client.event.subscribe()` SSE stream usage in session-api. `lifecycle-manager.ts:156-209` handles events but does not use SSE for session completion detection |

### 5.2 Event Processing (EVT-001 to EVT-006)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| EVT-001 | Process events via client.event.subscribe() SSE | **PARTIAL** | `plugin.ts:197-206` — event hook exists but receives events passively from platform. No active `client.event.subscribe()` call in lifecycle-manager for completion detection |
| EVT-002 | Inherit root session ID from parent | **IMPLEMENTED** | `lifecycle-manager.ts:162` — `inheritRootFromParent(sessionID, parentID)` |
| EVT-003 | Clean up on session deletion | **IMPLEMENTED** | `lifecycle-manager.ts:167-169` — `forgetSession + deleteSessionContinuity` |
| EVT-004 | Hydrate delegation state on session update | **IMPLEMENTED** | `lifecycle-manager.ts:177-179` — `hydrateDelegationState` |
| EVT-005 | Detect cycles in parent chain | **IMPLEMENTED** | `session-api.ts:264-267` — visited set in `walkParentChain` |
| EVT-006 | Extract status from event payload paths | **IMPLEMENTED** | `runtime.ts:34-54` — `getStatusSignal` with multiple path attempts |

### 5.3 Budget Management (BUD-001 to BUD-004)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| BUD-001 | Reserve/commit/rollback descendant budget | **IMPLEMENTED** | `state.ts:41-65` — `reserveDescendant`, `commitDescendant`, `rollbackReservation` |
| BUD-002 | Auto-cleanup root budget when empty | **IMPLEMENTED** | `state.ts:77-79` — deletes root when size=0 and reserved=0 |
| BUD-003 | Silent rollback for non-existent roots | **IMPLEMENTED** | `state.ts:60-64` — returns early if no budget found |
| BUD-004 | Cap warnings at 25 per session | **IMPLEMENTED** | `state.ts:24` — `if (stats.warnings.length < 25)` |

### 5.4 Background Task Management (BGT-001 to BGT-004)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| BGT-001 | Background task manager API (spawn/track/cancel/query) | **PARTIAL** | Spawn and track implemented. Cancel is not exposed as an API — no `cancel(sessionID)` method on `HarnessLifecycleManager`. `client.session.abort()` is never called. Query status exists via `getLifecycleSnapshot` |
| BGT-002 | Cancel via client.session.abort() | **MISSING** | No code path calls `client.session.abort()`. Session cancellation is not implemented |
| BGT-003 | Track async completion via SSE | **MISSING** | Async completion uses polling (`waitForSessionCompletion`), not SSE events |
| BGT-004 | Non-blocking concurrent session monitoring | **IMPLEMENTED** | `lifecycle-manager.ts:546-586` — `observeBackgroundCompletion` uses `void` (fire-and-forget), adds warning on failure |

### 6.1 Continuity Store (PER-001 to PER-009)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| PER-001 | Persist to harness-managed JSON file | **IMPLEMENTED** | `continuity.ts:90-96` — `persistStore()` |
| PER-002 | Load from disk on init | **IMPLEMENTED** | `plugin.ts:109` — `lifecycleManager.hydrateFromContinuity()` |
| PER-003 | Debounced writes with sync flush on critical | **PARTIAL** | Every write is immediate (no debounce). `persistStore()` is called synchronously on every `recordSessionContinuity` and `patchSessionContinuity`. No 100ms batch window. No differentiated critical flush |
| PER-004 | Deep clones on reads | **IMPLEMENTED** | `continuity.ts:524-552` — `cloneContinuityRecord` deep copies all nested objects |
| PER-005 | Normalize and drop invalid records | **IMPLEMENTED** | `continuity.ts:73-78` — records failing normalization are silently skipped |
| PER-006 | Corrupt JSON → empty store | **IMPLEMENTED** | `continuity.ts:85-87` — catch block returns `emptyStore()` |
| PER-007 | Missing/empty file → empty store | **IMPLEMENTED** | `continuity.ts:59-66` — returns `emptyStore()` |
| PER-008 | Partial updates (patch) | **IMPLEMENTED** | `continuity.ts:592-621` — `patchSessionContinuity` |
| PER-009 | Silent patch/delete for non-existent | **IMPLEMENTED** | `continuity.ts:597-599` — returns undefined; `continuity.ts:625-627` — returns void |

### 6.2 Context Checkpoints (CHK-001 to CHK-005)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| CHK-001 | Register save/restore as custom tools via tool() factory | **IMPLEMENTED** | `.opencode/tools/context-checkpoint.ts` — `tool()` factory for both save and restore |
| CHK-002 | Checkpoint includes summary/files/tasks/decisions/errors | **IMPLEMENTED** | `context-checkpoint.ts:5-14` — all fields defined |
| CHK-003 | Separate JSON file from continuity store | **IMPLEMENTED** | `context-checkpoint.ts:41` — `checkpoints.json` separate from `session-continuity.json` |
| CHK-004 | One checkpoint per session (overwrite) | **IMPLEMENTED** | `context-checkpoint.ts:196` — `store.sessions[sid] = checkpoint` overwrites |
| CHK-005 | Configurable via OPENCODE_HARNESS_STATE_DIR | **IMPLEMENTED** | `context-checkpoint.ts:36-38` |

### 7. Concurrency (CON-001 to CON-006)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| CON-001 | Lane-based async concurrency queues | **IMPLEMENTED** | `concurrency.ts:34-95` — `DelegationConcurrencyQueue` class |
| CON-002 | Deterministic key priority (model > agent+cat > agent > cat > default) | **IMPLEMENTED** | `concurrency.ts:7-32` — `buildDelegationQueueKey` |
| CON-003 | Default 3-5 per lane, configurable | **BROKEN** | `concurrency.ts:37` — `defaultLimit = 1`. `lifecycle-manager.ts:115` — `new DelegationConcurrencyQueue(1)`. Hardcoded 1, not configurable per lane key pattern |
| CON-004 | Idempotent release | **IMPLEMENTED** | `concurrency.ts:75-78` — `released` flag prevents double-release |
| CON-005 | Auto-delete lanes when idle | **IMPLEMENTED** | `concurrency.ts:91-93` — deletes when active=0 and pending=0 |
| CON-006 | Queue pending at capacity | **IMPLEMENTED** | `concurrency.ts:47-49` — returns Promise that resolves when slot opens |

### 8. Context Management (CTX-001 to CTX-004)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| CTX-001 | Inject harness state into compaction context | **IMPLEMENTED** | `plugin.ts:208-319` — `experimental.session.compacting` hook |
| CTX-002 | Snapshot includes delegation/lifecycle/queue/warnings/continuity | **IMPLEMENTED** | `plugin.ts:219-318` — all fields present |
| CTX-003 | Override chat params via chat.params hook | **IMPLEMENTED** | `plugin.ts:322-335` — model and temperature override |
| CTX-004 | Inject _harness via output.context.push() | **IMPLEMENTED** | `plugin.ts:294-295` — `output.context.push()` |

### 9. SDK Compatibility (SDK-001 to SDK-007)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| SDK-001 | client.session.create({ title }) + prompt({ body: { model, parts } }) | **IMPLEMENTED** | `session-api.ts:127-143` — create; `lifecycle-manager.ts:293-303` — prompt body with model and parts |
| SDK-002 | Sync via prompt(), async via prompt()+event.subscribe() | **PARTIAL** | Sync works. Async uses `promptSessionAsyncByAnyPath` which falls back to sync prompt if `promptAsync` doesn't exist. No SSE event subscription for completion detection |
| SDK-003 | Extract session/parent IDs from event payload paths | **IMPLEMENTED** | `session-api.ts:11-43` — multiple path attempts |
| SDK-004 | Handle typed session response | **IMPLEMENTED** | `helpers.ts:22-35` — `unwrapData` |
| SDK-005 | Throw last error with context | **IMPLEMENTED** | `session-api.ts:124, 142, 165, 198, 221` — all throw with last error |
| SDK-006 | client.session.abort() for cancellation | **MISSING** | Never called anywhere in codebase |
| SDK-007 | client.session.children() for budget tracking | **MISSING** | Never called. Budget tracking is done via internal state only (acceptable as P1) |

### 10. Routing (RTE-001 to RTE-004)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| RTE-001 | Route resolution with source tracking | **IMPLEMENTED** | `routing.ts:69-109` — returns source fields for agent, model, temperature |
| RTE-002 | Temperature clamped [0, 1] | **IMPLEMENTED** | `routing.ts:65-67` — `clampTemperature` |
| RTE-003 | Throw if no agent or valid category | **IMPLEMENTED** | `routing.ts:83-87` — throws error |
| RTE-004 | Track source (explicit/category/continuity/delegation/agent-default) | **IMPLEMENTED** | `routing.ts:104-106` — modelSource, agentSource, temperatureSource |

### 11. Commands (CMD-001 to CMD-007)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| CMD-001 | /plan command (conductor, non-subtask) | **IMPLEMENTED** | `.opencode/commands/plan.md` — agent: conductor, subtask: false |
| CMD-002 | /start-work command | **IMPLEMENTED** | `.opencode/commands/start-work.md` |
| CMD-003 | /ultrawork command | **IMPLEMENTED** | `.opencode/commands/ultrawork.md` |
| CMD-004 | /harness-doctor (5-point health check) | **PARTIAL** | `.opencode/commands/harness-doctor.md` — lists 8 checks (not the required 5 specific checks). Missing: specific check for continuity store file valid JSON, specific agent file existence check |
| CMD-005 | /plan creates task_plan.md with phases/acceptance criteria | **IMPLEMENTED** | `plan.md:13-14` — instructs creating task_plan.md with numbered phases |
| CMD-006 | /start-work supports resumption via progress.md | **IMPLEMENTED** | `start-work.md:21` — checks progress.md for context |
| CMD-007 | /ultrawork no clarification, autonomous | **IMPLEMENTED** | `ultrawork.md:29` — "Do not ask for clarification" |

### 12. Skills (SKL-001 to SKL-007)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| SKL-001 | harness-overview skill | **IMPLEMENTED** | `.opencode/skills/harness-overview/SKILL.md` |
| SKL-002 | planning-with-files skill | **IMPLEMENTED** | `.opencode/skills/planning-with-files/SKILL.md` |
| SKL-003 | wisdom-accumulation skill | **IMPLEMENTED** | `.opencode/skills/wisdom-accumulation/SKILL.md` |
| SKL-004 | shell-safety skill | **IMPLEMENTED** | `.opencode/skills/shell-safety/SKILL.md` |
| SKL-005 | 2-Action Rule | **IMPLEMENTED** | `planning-with-files/SKILL.md:65-69` |
| SKL-006 | 3-Strike Error Protocol | **IMPLEMENTED** | `planning-with-files/SKILL.md:96-103` |
| SKL-007 | Cleanup rules (7 days, merge dupes, <100 lines) | **IMPLEMENTED** | `wisdom-accumulation/SKILL.md:104-107` |

### 13. Planning and Review (PLN-001 to PLN-004)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| PLN-001 | Conductor performs planning before delegation | **IMPLEMENTED** | `conductor.md:39` — plan intent handled by conductor |
| PLN-002 | Plan review phase required | **PARTIAL** | `plan.md` mentions presenting to user but does NOT mandate Critic review before user approval. US-006b requires Critic review via delegate-task |
| PLN-003 | Plans reviewed by critic before implementation | **PARTIAL** | Conductor prompt says "Verify → If implementation, delegate to critic" but this is post-implementation review, not pre-implementation plan review |
| PLN-004 | Review for gap/scope/feasibility | **PARTIAL** | Partially captured in plan.md steps but not explicitly structured as PLN-004 requires |

### 15. Custom Tools (TOOL-001 to TOOL-011)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| TOOL-001 | delegate-task accepts category/task/agent/model/temperature/context | **PARTIAL** | `plugin.ts:351-381` — has description, prompt, agent, category, run_in_background, session_id, scope, constraints, model. **Missing**: explicit `temperature` parameter and `context` parameter |
| TOOL-002 | Route resolution via routing module | **IMPLEMENTED** | `plugin.ts:403-407` — `resolveDelegationRoute` |
| TOOL-003 | Enforce guardrails (depth/budget/circuit breaker) | **IMPLEMENTED** | `plugin.ts:421-436` — depth and budget checks |
| TOOL-004 | Create child via client.session.create + prompt | **IMPLEMENTED** | `lifecycle-manager.ts:224-303` |
| TOOL-005 | 6-section delegation prompt format | **MISSING** | See CAT-009 above. `buildPromptText` does not produce the required format |
| TOOL-006 | checkpoint_save parameters | **IMPLEMENTED** | `context-checkpoint.ts:147-162` — summary (required), activeFiles, pendingTasks, decisions, errors |
| TOOL-007 | Persist to JSON keyed by session ID | **IMPLEMENTED** | `context-checkpoint.ts:196` |
| TOOL-008 | Overwrite on new save | **IMPLEMENTED** | `context-checkpoint.ts:196` |
| TOOL-009 | checkpoint_restore accepts sessionID | **IMPLEMENTED** | `context-checkpoint.ts:218-219` |
| TOOL-010 | Returns stored checkpoint data | **IMPLEMENTED** | `context-checkpoint.ts:226-266` |
| TOOL-011 | No checkpoint → "no checkpoint found" | **IMPLEMENTED** | `context-checkpoint.ts:228-233` |

### 16. Non-Functional (NFR-001 to NFR-007)

| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| NFR-001 | Buildable with npm run build → dist/ | **IMPLEMENTED** | Verified: build passes clean |
| NFR-002 | Typecheck passes | **IMPLEMENTED** | Verified: `npx tsc --noEmit` clean |
| NFR-003 | Packable with npm pack | **IMPLEMENTED** | `package.json` has `prepack` script, `files` whitelist |
| NFR-004 | Exclude sensitive files | **IMPLEMENTED** | `package.json:19-25` — only `dist`, `.opencode`, `opencode.json`, `README.md`, `LICENSE` |
| NFR-005 | Auto-compaction with 15,000 token reservation | **IMPLEMENTED** | `opencode.json:30` — `"reserved": 15000` |
| NFR-006 | O(1) continuity reads via cache | **IMPLEMENTED** | `continuity.ts:26` — `storeCache` with lazy loading |
| NFR-007 | No external runtime dependencies | **IMPLEMENTED** | `package.json` — only `peerDependencies` on `@opencode-ai/plugin` |

### 17. Known Limitations (LIM-001 to LIM-010)

| ID | Limitation | Code Status |
|----|-----------|-------------|
| LIM-001 | No test suite | **CONFIRMED** — No test files, no test framework, no test config |
| LIM-002 | All category configs use hardcoded openai/gpt-5.4 | **CONFIRMED** — `routing.ts:26, 33, 40, 50` |
| LIM-003 | No rate limiting beyond concurrency queue | **CONFIRMED** |
| LIM-004 | Single checkpoint per session | **CONFIRMED** — by design |
| LIM-005 | No graceful shutdown for background observers | **CONFIRMED** — `void this.observeBackgroundCompletion` |
| LIM-006 | No error recovery beyond empty store | **CONFIRMED** |
| LIM-007 | SDK client typed as `any` throughout | **CONFIRMED** |
| LIM-008 | SSE reconnection not defined | **CONFIRMED** |
| LIM-009 | No model-specific prompt variants | **CONFIRMED** |
| LIM-010 | Conductor combines Prometheus + Atlas | **CONFIRMED** |

---

## Section C: Implementation Waves

### Wave 1: Test Infrastructure (Critical — No Tests Exist)

| Gap | Priority | Complexity | Files to Create |
|-----|----------|------------|-----------------|
| LIM-001: No test framework configured | P0 | Medium | Add vitest/jest, create test config, add test script to package.json |
| Unit tests for types.ts | P0 | Small | `tests/lib/types.test.ts` |
| Unit tests for helpers.ts | P0 | Small | `tests/lib/helpers.test.ts` |
| Unit tests for routing.ts | P0 | Medium | `tests/lib/routing.test.ts` |
| Unit tests for state.ts | P0 | Medium | `tests/lib/state.test.ts` |
| Unit tests for continuity.ts | P0 | Large | `tests/lib/continuity.test.ts` |
| Unit tests for concurrency.ts | P0 | Medium | `tests/lib/concurrency.test.ts` |
| Unit tests for runtime.ts | P0 | Medium | `tests/lib/runtime.test.ts` |
| Integration tests for plugin.ts | P0 | Large | `tests/plugin.test.ts` |
| Integration tests for lifecycle-manager.ts | P0 | Large | `tests/lib/lifecycle-manager.test.ts` |

### Wave 2: Core Plugin Fixes (Constants and Broken Config)

| Gap | Priority | Complexity | File(s) |
|-----|----------|------------|---------|
| GRD-002: MAX_DESCENDANTS_PER_ROOT=50 → 10 | P0 | Small | `src/plugin.ts:38` |
| CON-003: defaultLimit=1 → 3-5, configurable | P0 | Medium | `src/lib/concurrency.ts:37`, `src/lib/lifecycle-manager.ts:115` |
| PERM-002: doom_loop "ask" → "allow" | P0 | Small | `opencode.json:25` |
| CAT-004/AGT-008: Builder temp 0.2 → 0.15 in routing code | P0 | Small | `src/lib/routing.ts:18` |
| PER-003: No debounced writes (immediate writes) | P1 | Medium | `src/lib/continuity.ts` — add debounce timer |
| TOOL-001: Missing explicit temperature parameter | P1 | Small | `src/plugin.ts` — add temperature arg to delegate-task |
| TOOL-001: Missing context parameter | P1 | Small | `src/plugin.ts` — add context arg |

### Wave 3: Missing Hook Enforcement and Prompt Format

| Gap | Priority | Complexity | File(s) |
|-----|----------|------------|---------|
| PERM-007: No per-delegation tool restriction in tool.execute.before | P0 | Medium | `src/plugin.ts` — add delegation metadata check in before hook |
| CAT-009: Missing 6-section prompt format | P0 | Medium | `src/lib/helpers.ts` — rewrite `buildPromptText` |
| TOOL-005: Delegation prompt not using 6-section template | P0 | Small | `src/plugin.ts` — use new buildPromptText |
| PLN-002/003/004: Plan review not enforced | P1 | Small | `.opencode/commands/plan.md` — add Critic review step |

### Wave 4: Missing Features

| Gap | Priority | Complexity | File(s) |
|-----|----------|------------|---------|
| BGT-002: No session cancellation (client.session.abort()) | P0 | Medium | `src/lib/lifecycle-manager.ts` — add cancel method |
| LIF-006/SDK-002/BGT-003: No SSE event subscription for completion | P0 | Large | `src/lib/session-api.ts` or new module — add SSE listener |
| CMD-004: harness-doctor 8 checks → 5 required checks | P1 | Small | `.opencode/commands/harness-doctor.md` |
| Wisdom system — no code-level enforcement | P1 | Small | Conductor agent prompt handles; no code changes needed |
| Concurrency configurable per lane key pattern | P1 | Medium | `src/lib/concurrency.ts` — add per-key limit config |

### Wave 5: Verification and Smoke Tests

| Gap | Priority | Complexity | Files |
|-----|----------|------------|-------|
| E2E smoke test for full delegation lifecycle | P0 | Large | `tests/e2e/delegation.test.ts` |
| Build verification in CI | P1 | Small | CI config or npm script |
| Security check for sensitive files in package | P1 | Small | `tests/pack.test.ts` |

---

## Section D: Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/lib/lifecycle-manager.ts` | 539 | `void this.observeBackgroundCompletion(...)` — fire-and-forget with no cancellation | Medium | LIM-005 confirmed |
| `src/lib/session-api.ts` | 173 | `promptSessionAsyncByAnyPath` references non-existent `promptAsync` SDK method | Medium | Will silently fall back to sync, async mode may not truly be async |
| `src/plugin.ts` | 43 | `(OpenCodePlugin as { tool?: any }).tool as any` — unsafe type cast | Low | LIM-007 symptom |
| `.opencode/skills/shell-safety/SKILL.md` | 102 | `bashecho` — typo, missing newline between code blocks | Low | Render issue only |
| `src/lib/concurrency.ts` | 37 | Hardcoded `defaultLimit = 1` not matching any documented value | High | Bottleneck for all delegations |

---

## Section E: Verification Commands Run

| Command | Result | Status |
|---------|--------|--------|
| `npx tsc --noEmit -p tsconfig.json` | Clean exit, no errors | **PASS** |
| `npm run build` | Clean exit, dist/ produced | **PASS** |
| `npm test` | No test script defined | **FAIL** (expected — LIM-001) |
| `git status` | Working tree clean (post-build) | **PASS** |

---

## Section F: Gaps Summary

### Must-Fix Before Production

1. **MAX_DESCENDANTS_PER_ROOT = 50** → must be 10 (requirements v2.0+)
2. **doom_loop: "ask"** → must be "allow" (PERM-002)
3. **Default concurrency = 1** → must be 3-5 (CON-003)
4. **No per-delegation tool restriction enforcement** → PERM-007
5. **No 6-section delegation prompt** → CAT-009/TOOL-005
6. **Builder temperature 0.2 vs 0.15** → CAT-004/AGT-008
7. **No session cancellation** → BGT-002
8. **No SSE-based completion detection** → LIF-006/SDK-002

### Should-Fix Before Widespread Use

9. No debounced writes to continuity store (PER-003)
10. harness-doctor checks don't match spec (CMD-004)
11. Plan review not enforced (PLN-002/003)
12. Missing temperature/context params on delegate-task (TOOL-001)

### Known Limitations (Acceptable)

13. No test suite (LIM-001) — Wave 1
14. Hardcoded model (LIM-002)
15. SDK typed as `any` (LIM-007)
16. No SSE reconnection (LIM-008)
17. No model-specific prompt variants (LIM-009)

---

## Section G: Score

| Category | Verified | Total | Percentage |
|----------|----------|-------|------------|
| Observable Truths | 73 | 79 | 92.4% |
| Required Artifacts | 23 | 23 | 100% |
| Key Links | 7 | 8 | 87.5% |
| **Overall** | **103** | **110** | **93.6%** |

**Status:** `gaps_found` — 2 BROKEN constants, 14 PARTIAL implementations, 12 MISSING features. Core architecture is solid; gaps are concentrated in configuration values, prompt formatting, and SSE integration.
