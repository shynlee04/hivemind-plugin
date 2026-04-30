# Phase 14: delegate-task truth-reset — Research

**Researched:** 2026-04-16
**Domain:** Session delegation, background task execution, OpenCode SDK session lifecycle
**Confidence:** HIGH

## Summary

This phase performs a hard reset on the delegate-task regression corridor (phases 09-13), deleting all broken code and rebuilding from the Phase 02 verified baseline (18/18 truths). The core deliverable is a working `delegate-task` tool that supports both synchronous dispatch with result return AND asynchronous durability.

Three reference implementations were analyzed in depth: **kdcokenny/opencode-background-agents** (DelegationManager with WaiterModel pattern, 15-min timeout, disk persistence), **code-yeongyu/oh-my-openagent** (BackgroundManager with dual-signal completion, FIFO concurrency queues, promptAsync notification), and **shekohex/opencode-pty** (PTYManager with RingBuffer output, session state machine, exit notifications). The OpenCode SDK v1.4.6 API was verified — `session.create()`, `session.prompt()`, `session.promptAsync()`, `session.status()`, `session.messages()`, `session.idle` events, and `session.deleted` events are the key primitives.

**Primary recommendation:** Rebuild delegate-task as a thin `DelegationManager` class modeled on the opencode-background-agents pattern. Use in-process background execution with SDK session lifecycle events (`session.idle` for completion, `session.deleted` for cleanup). For async durability, persist delegation state to the existing `continuity.ts` JSON store (already battle-tested) and recover on plugin load. Do NOT introduce tmux/PTY or out-of-process execution — the SDK provides sufficient primitives and the environment lacks tmux.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** NUKE all trash — delete `.planning/debug/` directory entirely, delete all diagnostic reports (`delegation-mechanism-diagnostic-report-2026-04-16.md`, `delegation-study-report-2026-04-15.md`, `DELEGATION-AUDIT-REPORT-2026-04-15.md`), delete stale session dump files (`session-ses_*.md` at project root).
- **D-02:** delegate-task MUST WORK — not be deleted, not be stubbed, not be disabled. The AGENTS.md line banning it gets removed once it works.
- **D-03:** Target behavior: full sync dispatch with result return AND async durability. Sync mode must successfully dispatch child session, detect completion, return result. Async mode must survive parent process exit and deliver results on recovery.
- **D-04:** Async durability architecture is NOT pre-decided — the researcher/planner must study the options and recommend based on what's achievable with the current OpenCode SDK.
- **D-05:** DELETE ALL CODE from phases 09-13. Start from the Phase 02 verified baseline.
- **D-06:** After deletion, the codebase should be back to approximately the Phase 02 state.
- **D-07:** DELETE ALL TESTS from phases 09-13. Write fresh tests from scratch.
- **D-08:** New tests must be runtime-truthful: they test real behavior patterns, not mock implementations.
- **D-09:** Move phase directories (09, 09.1, 09.2, 09.3, 12, 13) to `.archive/phases/`.
- **D-10:** Remove the "delegate-task is broken" line from AGENTS.md once the tool works.

### Agent's Discretion
- Exact async durability implementation approach (researcher decides)
- Test file organization and naming conventions
- Whether to keep or remove the `src/lib/tasking/` directory structure
- How to handle `runtime-policy.ts` (created during recent adapter work — evaluate if it belongs in Phase 02 baseline)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REQ-14-01 | Delete all trash artifacts (debug dir, diagnostic reports, session dumps) | N/A — filesystem operations |
| REQ-14-02 | Archive phase directories 09, 09.1, 09.2, 09.3, 12, 13 to `.archive/phases/` | N/A — filesystem operations |
| REQ-14-03 | Delete ALL source code from phases 09-13, return to Phase 02 baseline | Triage section identifies exact files to delete |
| REQ-14-04 | Evaluate recent adapter files (result-capture, runtime-policy, continuity-clone, continuity-normalizers, lifecycle-background-observer) | Triage section identifies each file with recommendation |
| REQ-14-05 | Rebuild delegate-task tool with sync dispatch + result return | DelegationManager pattern from opencode-background-agents; SDK API verified |
| REQ-14-06 | Implement async durability for delegate-task | Continuity-store persistence pattern recommended; alternatives compared in Architecture section |
| REQ-14-07 | Write fresh runtime-truthful tests | Test architecture section; pitfall on mock-heavy testing |
| REQ-14-08 | Update AGENTS.md to remove "delegate-task is broken" and reflect post-cleanup structure | N/A — documentation update |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@opencode-ai/plugin` | 1.4.6 | Plugin SDK — tools, hooks, plugin registration | Project's plugin framework [VERIFIED: package.json] |
| `@opencode-ai/sdk` | 1.4.6 | OpenCode client SDK — session CRUD, events, prompts | Official SDK for programmatic session management [VERIFIED: package.json] |
| `vitest` | 4.1.4 | Test framework | Project's established test runner, globals mode [VERIFIED: package.json] |
| `typescript` | 5.8.3 | Language | Strict mode, ES2022 target, NodeNext modules [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zod` | 3.24.2 | Schema validation for tool inputs | delegate-task input validation [VERIFIED: package.json] |
| `node:fs` / `node:path` | built-in | File persistence for delegation state | Async durability state persistence |
| `node:events` | built-in | Event emitter patterns | Session lifecycle event handling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-process delegation | tmux/PTY out-of-process | tmux not available in environment; SDK provides sufficient primitives; PTY adds complexity with no durability benefit |
| Custom disk persistence | SQLite via better-sqlite3 | Overkill for delegation state; continuity.ts JSON already works; adds native dependency |
| Polling-based completion | Event-driven (session.idle) | Polling is fallback only; session.idle is faster and more reliable per oh-my-openagent |

**Version verification:**
```
@opencode-ai/plugin: 1.4.6 [VERIFIED: package.json]
@opencode-ai/sdk: 1.4.6 [VERIFIED: package.json]
vitest: 4.1.4 [VERIFIED: package.json]
typescript: 5.8.3 [VERIFIED: package.json]
zod: 3.24.2 [VERIFIED: package.json]
```

## Architecture Patterns

### Recommended Project Structure (Post-Cleanup)
```
src/
├── plugin.ts                    # Composition root (trim back to Phase 02 state)
├── index.ts                     # Public API re-exports
├── lib/
│   ├── types.ts                 # Shared types + constants (leaf)
│   ├── task-status.ts           # Task status transitions + guards
│   ├── state.ts                 # In-memory Maps
│   ├── helpers.ts               # Pure utilities (with SDK error fix)
│   ├── concurrency.ts           # Keyed semaphore (FIFO)
│   ├── continuity.ts            # Durable JSON persistence
│   ├── session-api.ts           # SDK wrappers (with status fix)
│   ├── runtime.ts               # Event→status mapping
│   ├── completion-detector.ts   # Two-signal completion detection
│   ├── notification-handler.ts  # Async completion notification
│   ├── lifecycle-manager.ts     # Session lifecycle state machine
│   ├── agent-registry.ts        # Agent definitions
│   └── delegation-manager.ts    # NEW: Core delegation orchestrator
├── tools/
│   ├── delegate-task.ts         # REBUILT: Sync + async delegation tool
│   ├── prompt-skim/             # Phase 02 tool (keep)
│   ├── prompt-analyze/          # Phase 02 tool (keep)
│   └── session-patch/           # Phase 02 tool (keep)
└── hooks/
    ├── create-session-hooks.ts  # Phase 02 hooks (keep)
    ├── create-core-hooks.ts     # Phase 02 hooks (keep)
    ├── messages-transform.ts    # Phase 02 hooks (keep)
    └── create-tool-guard-hooks.ts # Phase 02 hooks (keep)
tests/
├── lib/                         # Unit tests mirroring src/lib/
│   ├── delegation-manager.test.ts  # NEW: Tests for delegation
│   └── ... (fresh tests for Phase 02 baseline)
└── tools/
    └── delegate-task.test.ts    # NEW: Tests for delegate-task tool
```

### Pattern 1: DelegationManager (from opencode-background-agents)
**What:** Central orchestrator that manages delegation lifecycle using in-memory Maps + disk persistence
**When to use:** This IS the recommended pattern for delegate-task rebuild
**Example:**
```typescript
// Source: kdcokenny/opencode-background-agents — DelegationManager pattern
// [VERIFIED: repomix grep of packed output, outputId: 6c95440b1def1080]

interface Delegation {
  id: string;
  parentSessionId: string;
  childSessionId: string;
  status: 'pending' | 'running' | 'completed' | 'error' | 'timeout';
  result?: string;
  createdAt: number;
  completedAt?: number;
}

class DelegationManager {
  private delegations = new Map<string, Delegation>();
  private delegationsBySession = new Map<string, string>(); // childSessionId -> delegationId
  private timeoutTimers = new Map<string, NodeJS.Timeout>();

  async delegate(params: {
    parentSessionId: string;
    agent: string;
    prompt: string;
    title?: string;
    async?: boolean;
    timeoutMs?: number;
  }): Promise<Delegation> {
    // 1. Validate agent exists via client.app.agents()
    // 2. Create child session via client.session.create({ body: { title, parentID } })
    // 3. Send prompt via client.session.prompt({ path: { id }, body: { parts } })
    // 4. Register delegation in Maps
    // 5. Schedule timeout (default 15 min)
    // 6. If async: return delegation ID immediately
    // 7. If sync: await completion, return result
  }

  async handleSessionIdle(sessionId: string): Promise<void> {
    // Called on session.idle event
    // 1. Look up delegation by childSessionId
    // 2. Retrieve messages via client.session.messages()
    // 3. Extract result from assistant messages
    // 4. Update delegation status to 'completed'
    // 5. Persist to disk via continuity store
    // 6. Clear timeout timer
  }

  async handleTimeout(delegationId: string): Promise<void> {
    // Mark as 'timeout', abort session, persist partial results
  }

  async recoverPending(): Promise<void> {
    // On plugin load: read persisted delegations with status 'running'
    // Re-register in Maps, check if sessions still alive
  }
}
```

### Pattern 2: Dual-Signal Completion (from oh-my-openagent)
**What:** Requires BOTH session.idle event AND stability check (message count unchanged for N polls)
**When to use:** When session.idle can fire prematurely or for intermediate states
**Example:**
```typescript
// Source: code-yeongyu/oh-my-openagent — BackgroundManager
// [VERIFIED: repomix grep of packed output, outputId: 7d7e492073b8e477]

const POLLING_INTERVAL_MS = 3000;
const STABILITY_THRESHOLD = 3; // 3 stable polls

async function pollRunningTasks() {
  for (const task of runningTasks) {
    const status = await client.session.status({ path: { id: task.childSessionId } });
    const messages = await client.session.messages({ path: { id: task.childSessionId } });
    
    if (status.type === 'idle') {
      const currentCount = messages.length;
      if (currentCount === task.lastMessageCount) {
        task.stablePolls++;
      } else {
        task.lastMessageCount = currentCount;
        task.stablePolls = 0;
      }
      
      if (task.stablePolls >= STABILITY_THRESHOLD) {
        await completeTask(task);
      }
    }
  }
}
```

### Pattern 3: Notification via promptAsync (from oh-my-openagent)
**What:** Inject notification into parent session context using `promptAsync` with `noReply` flag
**When to use:** When async delegation completes and parent needs to know
**Example:**
```typescript
// Source: code-yeongyu/oh-my-openagent — notifyParentSession
// [VERIFIED: repomix grep of packed output, outputId: 7d7e492073b8e477]

async function notifyParentSession(parentSessionId: string, result: string) {
  try {
    await client.session.prompt({
      path: { id: parentSessionId },
      body: {
        parts: [{ type: 'text', text: `[Delegation Complete] ${result}` }],
        noReply: true, // Don't expect response, just inject
      }
    });
  } catch (err) {
    // Parent session may have been aborted — queue for later
    queuePendingNotification(parentSessionId, result);
  }
}
```

### Anti-Patterns to Avoid
- **Phantom completion detection:** The current codebase fires completions at 21ms because it doesn't wait for real session.idle. ALWAYS require session.idle event + stability check. [CITED: diagnostic report findings]
- **Mock-verified claims:** Tests that mock SDK calls and assert on mock behavior prove nothing. Test real state transitions, real error shapes, real event sequences. [CITED: D-08 directive]
- **Over-engineered lifecycle machines:** Phases 09-13 created lifecycle-tmux-runner, lifecycle-patching, lifecycle-queue, lifecycle-dispatcher, lifecycle-process-runner, lifecycle-state, lifecycle-events — 7 files for what one DelegationManager handles. [VERIFIED: src/lib/ file listing]
- **Error unwrapping that breaks SDK errors:** helpers.ts had a bug where it checked `errors[]` instead of `error[]` — this was fixed but the pattern of aggressive error unwrapping is dangerous. Let SDK errors propagate naturally. [VERIFIED: src/lib/helpers.ts git history]

### Coexistence Architecture: THREE Delegation Mechanisms

**Context:** The user wants three distinct delegation paths to coexist:

| Mechanism | Purpose | Implementation | Owner |
|-----------|---------|----------------|-------|
| **OpenCode builtin `task` tool** | Native subagent dispatch (sync, result return) | Built into OpenCode, not our code | OpenCode platform |
| **`delegate-task` (rebuilt)** | Plugin-managed delegation (sync + async durability) | Our DelegationManager in plugin | This phase |
| **PTY-based execution** | Long-running shell commands, process management | opencode-pty pattern (separate concern) | Future phase |

**Coexistence rules:**
1. `delegate-task` creates child sessions with `parentID` — OpenCode tracks the parent-child relationship
2. `task` tool is OpenCode-native — it works independently of our plugin
3. PTY sessions are orthogonal — they manage OS processes, not agent sessions
4. No mechanism should interfere with another's session lifecycle
5. `session.deleted` cleanup in PTY manager uses `parentSessionId` — same pattern as delegation

**Recommendation:** delegate-task should NOT try to be a PTY manager or replace the builtin task tool. It fills the gap: durable async delegation with persistence across process restarts.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session creation + prompting | Custom fetch calls | `client.session.create()` + `client.session.prompt()` | SDK handles auth, retries, types [VERIFIED: Context7 opencode-ai/opencode] |
| Completion detection | Custom polling with arbitrary intervals | `session.idle` event + stability check | SDK provides lifecycle events; oh-my-openagent proved dual-signal works [CITED: oh-my-openagent BackgroundManager] |
| Concurrency control | Custom queue with ad-hoc limits | Existing `src/lib/concurrency.ts` keyed semaphore | Already built and tested in Phase 02 [VERIFIED: 02-VERIFICATION.md] |
| State persistence | Custom file format | `src/lib/continuity.ts` JSON store | Already handles atomic writes, deep-clone-on-read [VERIFIED: 02-VERIFICATION.md] |
| Error handling | Custom error classes + wrapping | Let SDK errors propagate, catch at boundary | SDK errors have structured shape; wrapping hides info [CITED: helpers.ts fix history] |
| Timeout management | Complex timer hierarchies | Simple `setTimeout` + `clearTimeout` per delegation | opencode-background-agents uses this pattern successfully [VERIFIED: repomix grep, outputId: 6c95440b1def1080] |

**Key insight:** The Phase 02 baseline already has 80% of the infrastructure needed. Don't rebuild concurrency, state, or persistence — compose them into the new DelegationManager.

## Current Codebase Triage

### Phase 02 Baseline Files (KEEP — 18/18 Verified)
| File | LOC | Status | Notes |
|------|-----|--------|-------|
| `src/plugin.ts` | 447 | KEEP + TRIM | Remove registrations for deleted modules |
| `src/lib/types.ts` | ~150 | KEEP | Leaf module, no dependencies |
| `src/lib/helpers.ts` | ~200 | KEEP | Has SDK error fix from adapter work |
| `src/lib/state.ts` | ~80 | KEEP | In-memory Maps, clean |
| `src/lib/concurrency.ts` | ~120 | KEEP | Keyed semaphore, FIFO |
| `src/lib/task-status.ts` | ~100 | KEEP | Status transitions |
| `src/lib/continuity.ts` | ~635 | KEEP | Violates 500 LOC but functional |
| `src/lib/session-api.ts` | ~250 | KEEP | SDK wrappers with status fix |
| `src/lib/runtime.ts` | ~150 | KEEP | Event→status mapping |
| `src/lib/completion-detector.ts` | ~200 | KEEP | Two-signal detection |
| `src/lib/notification-handler.ts` | ~200 | KEEP | Async notifications |
| `src/lib/lifecycle-manager.ts` | ~734 | KEEP | Violates 500 LOC but functional |
| `src/lib/agent-registry.ts` | ~150 | KEEP | Agent definitions |
| `src/tools/prompt-skim/` | — | KEEP | Phase 02 tool |
| `src/tools/prompt-analyze/` | — | KEEP | Phase 02 tool |
| `src/tools/session-patch/` | — | KEEP | Phase 02 tool |
| `src/hooks/` (4 files) | — | KEEP | Phase 02 hooks |

### 09-13 Regression Files (DELETE)
| File | Reason |
|------|--------|
| `src/lib/governance-engine.ts` | Dead/broken — governance was a 09-13 concept |
| `src/lib/injection-engine.ts` | Dead/broken — injection was a 09-13 concept |
| `src/lib/delegation-packet.ts` | Dead/broken — never worked correctly |
| `src/lib/delegation-export.ts` | Dead/broken — never worked correctly |
| `src/lib/lifecycle-tmux-runner.ts` | Dead/broken — tmux not available |
| `src/lib/lifecycle-patching.ts` | Dead/broken — patching approach failed |
| `src/lib/lifecycle-queue.ts` | Dead/broken — replaced by simple delegation |
| `src/lib/lifecycle-runner-shared.ts` | Dead/broken — shared runner for failed approach |
| `src/lib/lifecycle-dispatcher.ts` | Dead/broken — over-engineered dispatch |
| `src/lib/lifecycle-process-runner.ts` | Dead/broken — process-based approach failed |
| `src/lib/lifecycle-state.ts` | Dead/broken — redundant with types.ts |
| `src/lib/lifecycle-events.ts` | Dead/broken — redundant with runtime.ts |
| `src/lib/compaction-checkpoint.ts` | Dead/broken — compaction not needed |
| `src/lib/background-manager.ts` | Dead/broken — first attempt, never worked |
| `src/lib/categories.ts` | Dead/broken — categories system unused |
| `src/lib/execution-mode.ts` | Dead/broken — execution modes abandoned |
| `src/lib/pending-notifications.ts` | Dead/broken — notification queue never worked |
| `src/lib/session-recovery.ts` | Dead/broken — recovery approach abandoned |
| `src/lib/specialist-router.ts` | Dead/broken — routing never implemented |
| `src/lib/tasking/` (entire dir) | Dead/broken — completion infrastructure that failed |
| `src/tools/background/` | Dead/broken — background tool that failed |
| `src/tools/delegate-task.ts` | **DELETE AND REBUILD** — 344 LOC of broken code |

### Recent Adapter Files (EVALUATE)
| File | Recommendation | Reasoning |
|------|---------------|-----------|
| `src/lib/result-capture.ts` | **EVALUATE THEN DECIDE** | Has SDK tool-part shape fix which is correct, but depends on delegation-packet.ts which is deleted. If result extraction logic is self-contained, salvage the shape fix into DelegationManager. Otherwise delete. |
| `src/lib/runtime-policy.ts` | **EVALUATE THEN DECIDE** | Trusted runtime policy guard — may be useful for delegate-task authorization. If it has no deps on deleted modules, keep. |
| `src/lib/continuity-clone.ts` | **EVALUATE THEN DECIDE** | Clone with new tool-call fields — useful if continuity.ts needs to store delegation state. Check for broken deps. |
| `src/lib/continuity-normalizers.ts` | **EVALUATE THEN DECIDE** | Normalizers for new fields — same evaluation as continuity-clone. |
| `src/lib/lifecycle-background-observer.ts` | **DELETE** | Start evidence truth fix is specific to the failed background-manager approach. DelegationManager won't need it. |

### Tests (48 files)
**ALL tests from phases 09-13 must be deleted per D-07.** Fresh tests written for:
- DelegationManager (new)
- delegate-task tool (rebuilt)
- Any Phase 02 baseline modules that lost test coverage

## Sync vs Async Architecture Decision

### Option A: In-Process with Continuity Persistence (RECOMMENDED)
**How it works:**
1. `delegate-task` tool creates child session via SDK
2. DelegationManager tracks in-memory Map + persists to continuity.ts JSON
3. Session lifecycle hooks (`session.idle`, `session.deleted`) drive completion/cleanup
4. On plugin load, `recoverPending()` restores running delegations from JSON
5. Sync mode: `await` the completion promise
6. Async mode: return delegation ID, completion writes to persistence

**Pros:**
- Uses existing infrastructure (continuity.ts, session hooks)
- No external dependencies (no tmux, no PTY)
- SDK events are reliable (session.idle, session.deleted)
- oh-my-openagent proved this pattern works at scale
- Recovery on restart is straightforward (read JSON, re-register in Maps)

**Cons:**
- If OpenCode process crashes hard (SIGKILL), in-flight delegations may not be cleanly persisted
- Requires trust in SDK event delivery

**Confidence:** HIGH — opencode-background-agents and oh-my-openagent both use this pattern successfully

### Option B: tmux/PTY Out-of-Process
**How it works:** Spawn agent sessions in separate tmux/PTY processes

**Why NOT recommended:**
- tmux is not available in the target environment [VERIFIED: `which tmux` → not found]
- PTY adds significant complexity (RingBuffer, session state machine, cleanup)
- opencode-pty exists as a separate plugin — reimplementation is wasteful
- No durability benefit over in-process (PTY processes also die if parent dies)
- Violates the "use existing infrastructure" principle

### Option C: Hybrid (In-Process + Optional PTY)
**How it works:** Default to in-process, optionally delegate to PTY for long-running tasks

**Why NOT recommended:**
- Premature optimization — no current requirement for PTY delegation
- Adds complexity without clear benefit
- Can be added later if needed without architectural changes

**Recommendation:** **Option A** — in-process with continuity persistence. It's the simplest approach that meets all requirements, uses existing infrastructure, and matches proven patterns from reference implementations.

## OpenCode SDK Capabilities (v1.4.6)

### Session Lifecycle API
| API | Purpose | Async Support |
|-----|---------|---------------|
| `client.session.create({ body: { title?, parentID? } })` | Create child session | Returns Session object synchronously |
| `client.session.prompt({ path: { id }, body: { parts, noReply?, agent?, model? } })` | Send prompt to session | `noReply: true` for fire-and-forget |
| `client.session.promptAsync(...)` | Async prompt (POST, 204 response) | Non-blocking prompt injection |
| `client.session.status({ path: { id } })` | Get session status | Returns `SessionStatus` with `.type` field |
| `client.session.messages({ path: { id } })` | Get session messages | Returns message array with parts |
| `client.session.delete({ path: { id } })` | Delete/cancel session | Triggers `session.deleted` event |
| `client.session.abort({ path: { id } })` | Abort running session | Graceful termination |
| `client.app.agents()` | List available agents | For agent validation |

**Source:** [VERIFIED: Context7 opencode-ai/opencode + tavily search of docs.opencode.ai]

### Events (via plugin hooks)
| Event | Trigger | Use For |
|-------|---------|---------|
| `session.idle` | Session finishes processing | Completion detection — delegation is done |
| `session.deleted` | Session is deleted/aborted | Cleanup — remove delegation tracking |
| `session.error` | Session encounters error | Error delegation handling |
| `session.created` | New session created | Optional logging |
| `session.status` | Status change | Polling fallback |

### Key SDK Patterns for Delegation
```typescript
// 1. Create child session linked to parent
const child = await client.session.create({
  body: { title: 'Delegation: research', parentID: parentSessionId }
});

// 2. Send prompt to child
await client.session.prompt({
  path: { id: child.id },
  body: {
    parts: [{ type: 'text', text: prompt }],
    agent: agentName, // Route to specific agent
  }
});

// 3. Check completion (event-driven preferred, polling fallback)
const status = await client.session.status({ path: { id: child.id } });
// status.type: 'idle' means done

// 4. Get results
const messages = await client.session.messages({ path: { id: child.id } });
const assistantMsgs = messages.filter(m => m.role === 'assistant');

// 5. Notify parent (async completion)
await client.session.prompt({
  path: { id: parentSessionId },
  body: {
    parts: [{ type: 'text', text: `Delegation complete: ${result}` }],
    noReply: true,
  }
});
```

**Source:** [VERIFIED: Context7 opencode-ai/opencode + oh-my-openagent reference implementation]

## Common Pitfalls

### Pitfall 1: Phantom Completion Detection
**What goes wrong:** Completion detector fires at 21ms because it checks local state instead of waiting for `session.idle` event
**Why it happens:** The current completion-detector.ts was designed for a different lifecycle model and doesn't understand SDK session states
**How to avoid:** DelegationManager must ONLY mark delegation as completed when `session.idle` event fires for the child session. Use dual-signal pattern (idle + stability) for extra safety.
**Warning signs:** Delegations completing in <1 second with empty results

### Pitfall 2: Error Unwrapping That Hides SDK Errors
**What goes wrong:** helpers.ts checks `errors[]` (plural) but SDK returns `error[]` (singular), causing error information to be silently dropped
**Why it happens:** SDK error shape wasn't documented clearly when helpers were written
**How to avoid:** Don't aggressively unwrap SDK errors. Let them propagate naturally. If you must unwrap, check both `error` and `errors` fields.
**Warning signs:** "Unknown error" messages where SDK should provide details

### Pitfall 3: Session ID Validation Rejecting Valid IDs
**What goes wrong:** Custom session ID validation rejects IDs returned by `session.create()` because the validation format doesn't match what the SDK actually produces
**Why it happens:** Validation was written against assumed format, not actual SDK output
**How to avoid:** Don't validate session IDs at all — trust what the SDK returns. Only validate user-provided IDs with basic format checks.
**Warning signs:** "Invalid session ID" errors immediately after `session.create()` succeeds

### Pitfall 4: Timeout Without Cleanup
**What goes wrong:** 15-minute timeout fires, delegation is marked as timed out, but child session keeps running consuming resources
**Why it happens:** Timeout handler doesn't call `session.abort()` or `session.delete()`
**How to avoid:** Always abort/delete child session on timeout. opencode-background-agents calls `client.session.delete()` in its timeout handler. [VERIFIED: repomix grep, outputId: 6c95440b1def1080]
**Warning signs:** Accumulating zombie sessions in OpenCode session list

### Pitfall 5: Persistence Race Condition
**What goes wrong:** Delegation state is updated in memory but not persisted to disk before the process crashes, losing the state
**Why it happens:** Persistence happens after result extraction, not after state transition
**How to avoid:** Persist state BEFORE extracting results. Use the existing continuity.ts pattern of synchronous JSON write. [CITED: continuity.ts atomic write pattern]
**Warning signs:** Running delegations disappear after OpenCode restart

### Pitfall 6: Mock-Heavy Tests That Prove Nothing
**What goes wrong:** Tests mock `client.session.create()` to return a fake session, mock `client.session.prompt()` to succeed, then assert the mock was called. This tests nothing real.
**Why it happens:** SDK calls are hard to test without a running OpenCode instance
**How to avoid:** Test state transitions (Map updates, persistence writes, timer scheduling), error handling (real error shapes from SDK), and event routing. Don't mock SDK calls — mock only the transport layer if needed. [CITED: D-08 directive]
**Warning signs:** 100% test coverage but tool fails in production

### Pitfall 7: Over-Engineering the Delegation Lifecycle
**What goes wrong:** Creating 7+ lifecycle modules (tmux-runner, patching, queue, dispatcher, process-runner, state, events) for what is fundamentally a simple create→prompt→wait→result flow
**Why it happens:** Treating delegation as a complex distributed system instead of a simple request-response with persistence
**How to avoid:** One DelegationManager class. ~300-400 LOC. If it exceeds 500 LOC, you're over-engineering. [CITED: AGENTS.md max module size rule]
**Warning signs:** More than 3 files involved in a single delegation flow

## Code Examples

### DelegationManager Core (Sync Mode)
```typescript
// Pattern from: kdcokenny/opencode-background-agents DelegationManager
// [VERIFIED: repomix grep, outputId: 6c95440b1def1080]

async delegateSync(params: {
  parentSessionId: string;
  agent: string;
  prompt: string;
  title?: string;
  timeoutMs?: number;
}): Promise<DelegationResult> {
  const timeoutMs = params.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  
  // 1. Create child session
  const child = await this.client.session.create({
    body: {
      title: params.title ?? `Delegation: ${params.agent}`,
      parentID: params.parentSessionId,
    }
  });

  // 2. Register delegation
  const delegation: Delegation = {
    id: crypto.randomUUID(),
    parentSessionId: params.parentSessionId,
    childSessionId: child.id,
    status: 'running',
    createdAt: Date.now(),
  };
  this.delegations.set(delegation.id, delegation);
  this.delegationsBySession.set(child.id, delegation.id);

  // 3. Persist immediately (before prompt)
  await this.persistDelegation(delegation);

  // 4. Schedule timeout
  const timer = setTimeout(() => this.handleTimeout(delegation.id), timeoutMs);
  this.timeoutTimers.set(delegation.id, timer);

  // 5. Send prompt
  await this.client.session.prompt({
    path: { id: child.id },
    body: {
      parts: [{ type: 'text', text: params.prompt }],
      agent: params.agent,
    }
  });

  // 6. Await completion (Promise that resolves on session.idle)
  return new Promise((resolve, reject) => {
    this.completionCallbacks.set(delegation.id, { resolve, reject });
  });
}
```

### Session Idle Handler (Completion Detection)
```typescript
// Pattern from: oh-my-openagent dual-signal + opencode-background-agents handleSessionIdle
// [VERIFIED: repomix grep, outputIds: 6c95440b1def1080, 7d7e492073b8e477]

handleSessionIdle(sessionId: string): void {
  const delegationId = this.delegationsBySession.get(sessionId);
  if (!delegationId) return; // Not a delegation session
  
  const delegation = this.delegations.get(delegationId);
  if (!delegation || delegation.status !== 'running') return;

  // Clear timeout
  const timer = this.timeoutTimers.get(delegationId);
  if (timer) {
    clearTimeout(timer);
    this.timeoutTimers.delete(delegationId);
  }

  // Retrieve results asynchronously
  this.finalizeDelegation(delegationId);
}

private async finalizeDelegation(delegationId: string): Promise<void> {
  const delegation = this.delegations.get(delegationId)!;
  
  try {
    const messages = await this.client.session.messages({
      path: { id: delegation.childSessionId }
    });
    
    // Extract assistant response
    const assistantParts = messages
      .filter(m => m.role === 'assistant')
      .flatMap(m => m.parts ?? [])
      .filter(p => p.type === 'text')
      .map(p => p.text);
    
    delegation.status = 'completed';
    delegation.result = assistantParts.join('\n');
    delegation.completedAt = Date.now();
    
    await this.persistDelegation(delegation);
    
    // Resolve sync promise if waiting
    const callback = this.completionCallbacks.get(delegationId);
    if (callback) {
      callback.resolve({ status: 'completed', result: delegation.result });
      this.completionCallbacks.delete(delegationId);
    }
  } catch (err) {
    delegation.status = 'error';
    delegation.result = String(err);
    await this.persistDelegation(delegation);
    
    const callback = this.completionCallbacks.get(delegationId);
    if (callback) {
      callback.reject(err);
      this.completionCallbacks.delete(delegationId);
    }
  }
}
```

### Recovery on Plugin Load
```typescript
// Pattern from: opencode-background-agents disk persistence
// [VERIFIED: repomix grep, outputId: 6c95440b1def1080]

async recoverPending(): Promise<void> {
  const persisted = await this.continuityStore.readSection<Delegation[]>('delegations');
  if (!persisted) return;

  for (const delegation of persisted) {
    if (delegation.status !== 'running') continue;
    
    // Check if child session still exists
    try {
      const status = await this.client.session.status({
        path: { id: delegation.childSessionId }
      });
      
      if (status.type === 'idle') {
        // Session completed while we were down — finalize
        await this.finalizeDelegation(delegation.id);
      } else {
        // Still running — re-register in Maps
        this.delegations.set(delegation.id, delegation);
        this.delegationsBySession.set(delegation.childSessionId, delegation.id);
        // Re-schedule timeout with remaining time
        const remaining = (delegation.createdAt + DEFAULT_TIMEOUT_MS) - Date.now();
        if (remaining > 0) {
          const timer = setTimeout(() => this.handleTimeout(delegation.id), remaining);
          this.timeoutTimers.set(delegation.id, timer);
        } else {
          await this.handleTimeout(delegation.id);
        }
      }
    } catch (err) {
      // Session doesn't exist — mark as error
      delegation.status = 'error';
      delegation.result = 'Child session not found on recovery';
      await this.persistDelegation(delegation);
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tmux-based session management | SDK session.create() with parentID | 2026 (opencode v1.4+) | No external process dependencies needed |
| Polling-only completion | Event-driven (session.idle) + stability check | 2026 (oh-my-openagent) | Faster completion detection, fewer API calls |
| Custom file persistence | Continuity store with atomic writes | Phase 02 (verified) | Reliable persistence without SQLite |
| Multi-file lifecycle machines | Single DelegationManager class | This phase | Simpler, maintainable, testable |

**Deprecated/outdated:**
- `src/lib/lifecycle-tmux-runner.ts`: tmux is not available; SDK handles session management
- `src/lib/lifecycle-process-runner.ts`: Process-based approach doesn't work with SDK sessions
- `src/lib/lifecycle-queue.ts`: FIFO queue is already in concurrency.ts
- `src/lib/governance-engine.ts`: Governance system was never needed
- `src/lib/injection-engine.ts`: Context injection via SDK prompt is simpler

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `client.session.create({ body: { parentID } })` creates a child session linked to parent | SDK Capabilities | If parentID doesn't create actual parent-child link, cleanup logic breaks |
| A2 | `session.idle` event fires reliably when child session completes processing | SDK Capabilities | If idle fires intermittently, dual-signal pattern mitigates but adds latency |
| A3 | `client.session.prompt({ body: { noReply: true } })` injects message without waiting | SDK Capabilities | If noReply is not supported, async notification approach needs redesign |
| A4 | `client.session.messages()` returns all messages including assistant responses | SDK Capabilities | If messages are paginated, result extraction needs pagination handling |
| A5 | continuity.ts can store delegation state alongside existing state without conflicts | Architecture | If store has size limits or schema constraints, need separate storage |
| A6 | Plugin hooks receive `session.idle` events for child sessions created by the plugin | SDK Capabilities | If hooks only fire for user-initiated sessions, need polling fallback |

**Risk mitigation:** All assumptions can be validated with a single smoke test: create child session, prompt it, wait for idle, read messages. This should be the first test the user runs.

## Open Questions (RESOLVED)

1. **Does `parentID` in session.create() actually establish a parent-child relationship that survives process restart?**
   - What we know: SDK docs mention `parentID` parameter, oh-my-openagent uses it
   - What's unclear: Whether OpenCode tracks this server-side or just stores it as metadata
   - **Resolution (2026-04-18):** Deferred to planner's discretion per D-11. Plan 14-01 uses parentID in session.create() and will validate during TDD. If it fails, dispatch() works without parentID as fallback.

2. **Are plugin hooks scoped to all sessions or only the current user session?**
   - What we know: opencode-pty and opencode-background-agents both receive events for child sessions
   - What's unclear: Whether this works in all plugin hook configurations
   - **Resolution (2026-04-18):** Assumption A6 accepted. Plan 14-01 wires into hooks assuming child session events work. If not, dual-signal pattern provides polling fallback per oh-my-openagent reference.

3. **Should adapter files (result-capture, runtime-policy, continuity-clone, continuity-normalizers) be kept or deleted?**
   - What we know: They contain some correct fixes but depend on deleted modules
   - What's unclear: Exact dependency graph for each file
   - **Resolution (2026-04-18):** DONE in cleanup half (REQ-14-04). CONTEXT.md confirms evaluation completed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 25.9.0 | — |
| npm | Build | ✓ | 11.12.1 | — |
| git | Version control | ✓ | 2.53.0 | — |
| `@opencode-ai/plugin` | Plugin framework | ✓ | 1.4.6 | — |
| `@opencode-ai/sdk` | Session API | ✓ | 1.4.6 | — |
| `vitest` | Testing | ✓ | 4.1.4 | — |
| `typescript` | Build | ✓ | 5.8.3 | — |
| `zod` | Input validation | ✓ | 3.24.2 | — |
| tmux | PTY-based execution | ✗ | — | Not needed (in-process approach) |
| OpenCode runtime | Live testing | ✗ (manual) | — | User runs smoke tests manually |

**Missing dependencies with no fallback:**
- OpenCode runtime for live testing — user explicitly banned autonomous live testing. Smoke tests run manually by user only.

**Missing dependencies with fallback:**
- tmux — not needed because recommended approach is in-process. If PTY delegation needed later, user installs tmux.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest v4.1.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/lib/delegation-manager.test.ts -t "<test>"` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-14-03 | Delete 09-13 code returns to Phase 02 baseline | unit | `npx vitest run tests/ -t "baseline"` | ❌ Wave 0 |
| REQ-14-05 | Sync delegation creates session, returns result | unit | `npx vitest run tests/lib/delegation-manager.test.ts` | ❌ Wave 0 |
| REQ-14-05 | Sync delegation respects timeout | unit | `npx vitest run tests/lib/delegation-manager.test.ts -t "timeout"` | ❌ Wave 0 |
| REQ-14-05 | Delegation validates agent exists | unit | `npx vitest run tests/tools/delegate-task.test.ts` | ❌ Wave 0 |
| REQ-14-06 | Async delegation persists to continuity store | unit | `npx vitest run tests/lib/delegation-manager.test.ts -t "persist"` | ❌ Wave 0 |
| REQ-14-06 | Recovery restores running delegations | unit | `npx vitest run tests/lib/delegation-manager.test.ts -t "recover"` | ❌ Wave 0 |
| REQ-14-06 | Timeout aborts child session | unit | `npx vitest run tests/lib/delegation-manager.test.ts -t "abort"` | ❌ Wave 0 |
| REQ-14-07 | Tests are runtime-truthful | manual | Code review of test files | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/lib/delegation-manager.test.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + typecheck (`npm run typecheck`) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/delegation-manager.test.ts` — covers REQ-14-05, REQ-14-06
- [ ] `tests/tools/delegate-task.test.ts` — covers REQ-14-05 tool layer
- [ ] Review all existing test files — delete 09-13 tests, identify coverage gaps for Phase 02 baseline
- [ ] Framework is installed (vitest v4.1.4) — no install needed

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | OpenCode handles auth |
| V3 Session Management | yes | SDK session lifecycle, parent-child scoping |
| V4 Access Control | yes | Agent validation before delegation (prevent unauthorized agent use) |
| V5 Input Validation | yes | zod schema for delegate-task inputs |
| V6 Cryptography | no | No crypto in delegation |

### Known Threat Patterns for Session Delegation

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Arbitrary agent execution | Elevation of privilege | Validate agent name against `client.app.agents()` whitelist |
| Infinite delegation chains | Denial of service | Limit delegation depth (child cannot delegate) |
| Resource exhaustion via orphan sessions | Denial of service | 15-min timeout with forced abort |
| Prompt injection via delegation | Tampering | Input sanitization via zod schema |
| State file corruption | Tampering | Atomic writes in continuity.ts, JSON validation on read |

## Sources

### Primary (HIGH confidence)
- Context7 `opencode-ai/opencode` — SDK API (session.create, session.prompt, session.status, session.messages, events)
- Repomix packed: `kdcokenny/opencode-background-agents` (outputId: 6c95440b1def1080) — DelegationManager, WaiterModel, persistOutput, handleTimeout
- Repomix packed: `code-yeongyu/oh-my-openagent` (outputId: 7d7e492073b8e477) — BackgroundManager, dual-signal, promptAsync, ConcurrencyManager
- Repomix packed: `shekohex/opencode-pty` (outputId: `7c6fd0221dd2168e`) — PTYManager, RingBuffer, NotificationManager, session cleanup
- Phase 02 VERIFICATION.md — 18/18 verified truths

### Secondary (MEDIUM confidence)
- DeepWiki: kdcokenny/opencode-background-agents — architecture overview, delegation flow
- DeepWiki: shekohex/opencode-pty — PTY lifecycle, session states
- DeepWiki: code-yeongyu/oh-my-openagent — background management, FIFO queue
- tavily search: OpenCode SDK v1.4.6 API documentation — confirmed session CRUD, events, promptAsync

### Tertiary (LOW confidence)
- DeepWiki: opencode-ai/opencode — SDK internals, hook system (broad overview, not all APIs confirmed)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified from package.json
- Architecture: HIGH — three reference implementations analyzed, SDK API verified, patterns cross-referenced
- Pitfalls: HIGH — drawn from actual diagnostic findings and reference implementation issues
- Async durability recommendation: MEDIUM — in-process approach is proven but assumes SDK event reliability (assumption A2)
- Coexistence architecture: MEDIUM — three mechanisms are conceptually compatible but haven't been tested together

**Research date:** 2026-04-16
**Valid until:** 2026-05-16 (stable — SDK v1.4.6, no rapid changes expected)
