# Phase 16: Background Delegation Revamp + PTY Integration - Research

**Researched:** 2026-04-21  
**Domain:** OpenCode background delegation, write-capable child sessions, PTY process integration  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Write-Capable Background Sessions
- **D-01:** Background delegations MUST support write-capable agents (edit, write, bash allowed), not just read-only. The current read-only restriction makes delegate-task nearly useless for real work.
- **D-02:** The specific approach to achieving undo/branching parity is at the planner/researcher's discretion — options include session-tree child sessions (oh-my-openagent's approach), git-tracked write sessions, or a hybrid. The researcher MUST analyze oh-my-openagent's spawner and opencode-background-agents' limitations to recommend the best approach.
- **D-03:** Any write-capable solution MUST preserve the WaiterModel execution pattern (always-background, foreground continues, wait on demand) — this is locked from Phase 14.

#### PTY Interactive Integration
- **D-04:** PTY interactive processes are the DEFAULT execution mode for ALL delegations. Every delegated task runs in a PTY unless PTY is unavailable (then falls back to headless).
- **D-05:** The PTY integration MUST come from studying opencode-pty's architecture (`https://github.com/shekohex/opencode-pty`). The researcher must analyze how opencode-pty enables interactive input to background processes and design an integration that fits the harness plugin architecture.

#### Spawner Architecture
- **D-06:** Full spawner extraction — create a dedicated `src/lib/spawner/` directory with separate modules following oh-my-openagent's proven pattern:
  - Session creator (spawns OpenCode sessions for background tasks)
  - Concurrency-key resolver (derives concurrency limits per model/provider)
  - Parent-directory resolver (resolves working directory for child sessions)
  - PTY session setup (configures PTY for interactive delegation)
- **D-07:** DelegationManager remains as the orchestration layer but delegates spawning concerns to the spawner modules. Target: DelegationManager drops below 350 LOC.

#### Tmux Scope
- **D-08:** tmux/OpenClaw integration is explicitly OUT OF SCOPE for Phase 16. Deferred to a future phase. The researcher should note oh-my-openagent's tmux architecture for future reference but NOT design or implement it now.

#### Codebase Cleanup (Targeted)
- **D-09:** Resolve the dual-lifecycle confusion: either remove the stub `HarnessLifecycleManager` and route everything through `DelegationManager`, or make `HarnessLifecycleManager` a thin facade that delegates to `DelegationManager`. Current state (both instantiated, one stub, one functional) is transitional and confusing.
- **D-10:** Consolidate duplicate `extractAssistantText` implementations (in `delegation-manager.ts` and `create-session-hooks.ts`) into a single shared function in `src/lib/helpers.ts`.
- **D-11:** DelegationManager decomposition: with spawner extraction + targeted cleanup, DelegationManager should drop below 350 LOC. Persistence logic may also be extractable.

#### Carried Forward from Phase 14 (LOCKED)
- **D-12:** WaiterModel execution — always-background dispatch, foreground continues, wait when result needed
- **D-13:** Dual-signal completion detection — session.idle + message count stability, NO fixed timeouts
- **D-14:** Hybrid persistence — oh-my-openagent dual-signal + disk persistence model
- **D-15:** Dedicated poll/status tool (separate from delegate-task)
- **D-16:** Runtime-truthful tests only — no mock-heavy tests that don't reflect real behavior
- **D-17:** No fixed timeouts — delegations run until completion confirmed by dual-signal

### the agent's Discretion
- Write-capable implementation approach (session-tree children vs git-tracked vs hybrid)
- SDK `parentID` semantics and how delegate-task relates to builtin `task` tool
- Safety limits (max runtime ceiling), zombie session handling, abort mechanisms
- Exact spawner module names, interfaces, and internal structure
- PTY integration API shape (how agents specify interactive needs)
- Test file organization and naming conventions
- Exact lifecycle resolution strategy (remove stub vs thin facade)

### Deferred Ideas (OUT OF SCOPE)
- **tmux/OpenClaw integration** — oh-my-openagent has full tmux support (tmux-utils, OpenClaw edition, tmux-subagent). This is explicitly out of scope for Phase 16 but should be researched for reference and noted for a future phase.
- **Continuity.ts module split** — Extract clone helpers, normalizers, and CRUD into separate files. Belongs in Phase 11 (clean architecture restructuring).
- **State.ts singleton cleanup** — Remove wrapper functions, fix testing isolation. Belongs in Phase 11.
- **Session-API double cast fix** — Replace unsafe type assertions with Zod validation. Belongs in Phase 11 or a targeted fix phase.
</user_constraints>

## Summary

Phase 16 should **keep the current WaiterModel and dual-signal completion core, but replace the current spawn path with a dedicated spawner subsystem and a PTY-backed execution path by default**. The strongest external evidence is that oh-my-openagent succeeds because background work stays inside the OpenCode session tree, while opencode-background-agents explicitly documents failure modes caused by running outside that tree. [CITED: https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent] [CITED: https://github.com/kdcokenny/opencode-background-agents] [VERIFIED: .planning/phases/16-background-delegation-revamp-pty-integration-rebuild-backgro/16-CONTEXT.md]

The harness already has the right foundations: WaiterModel semantics, dual-signal completion detection, keyed concurrency, durable continuity, and parent-session notification hooks. The missing pieces are architectural separation and PTY-backed child execution. Specifically, `DelegationManager` is overloaded, PTY support is absent, lifecycle ownership is split between a real manager and a stub, and helper extraction is incomplete. [VERIFIED: src/lib/delegation-manager.ts] [VERIFIED: src/lib/completion-detector.ts] [VERIFIED: src/lib/concurrency.ts] [VERIFIED: src/plugin.ts]

**Primary recommendation:** Use **session-tree child sessions + PTY-by-default + extracted spawner modules + existing dual-signal completion detector**. Do **not** adopt opencode-background-agents' isolated-session model or its fixed timeout posture. [CITED: https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent] [CITED: https://github.com/shekohex/opencode-pty] [CITED: https://github.com/kdcokenny/opencode-background-agents]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Delegation dispatch API | Plugin tool layer | Delegation orchestration | `delegate-task` remains the write-side entrypoint; orchestration should stay behind it. [VERIFIED: src/tools/delegate-task.ts] |
| Child session creation | Spawner | Session API wrapper | Session creation must be isolated from orchestration so write-capable/session-tree logic is testable and reusable. [CITED: https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent/spawner] |
| PTY process lifecycle | PTY manager | Spawner | PTY setup, I/O buffering, and termination are process concerns, not tool concerns. [CITED: https://github.com/shekohex/opencode-pty] |
| Completion detection | Completion detector | Delegation orchestration | Phase 14 locked dual-signal completion already belongs in shared runtime logic. [VERIFIED: src/lib/completion-detector.ts] |
| Persistence and recovery | Continuity store | In-memory task state | Durable state must remain separate from orchestration; in-memory state accelerates polling and routing. [VERIFIED: src/lib/continuity.ts] [VERIFIED: src/lib/state.ts] |
| Parent notification | Notification handler | Hook layer | Completion reporting belongs in async notification logic, not in PTY or spawn code. [VERIFIED: src/lib/notification-handler.ts] |
| Concurrency limiting | Concurrency module | Spawner key resolver | Queue semantics already exist; Phase 16 should only improve key derivation and usage. [VERIFIED: src/lib/concurrency.ts] |
| Lifecycle ownership | DelegationManager | Thin facade only if needed | Current dual ownership is transitional and should collapse to one source of truth. [VERIFIED: src/plugin.ts] |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@opencode-ai/sdk` | project uses `^1.4.2` | Session creation, session prompting, runtime integration | This is the existing OpenCode integration surface and should remain the only session-control API. [VERIFIED: package.json] |
| `@opencode-ai/plugin` | `1.14.19` current registry | Plugin host contract | The harness is a plugin; Phase 16 should stay within plugin boundaries instead of inventing a sidecar service. [VERIFIED: npm registry] [VERIFIED: package.json] |
| `node-pty` | `1.1.0` current registry | PTY child process management for Node runtime | The project is Node-based, so PTY integration should use a Node PTY library rather than Bun-specific infrastructure. [VERIFIED: npm registry] [VERIFIED: package.json] |
| `zod` | `4.3.6` current registry | Tool input/output validation | Existing validation stack; keep it for PTY tool payloads and spawner config schemas. [VERIFIED: npm registry] [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vitest` | `4.1.4` current registry | Runtime-truthful unit/integration testing | Keep for fast test loops around concurrency, PTY state, and spawner branching. [VERIFIED: npm registry] [VERIFIED: package.json] |
| `typescript` | `6.0.3` current registry | Strict typing and module boundaries | Required for the spawner split and interface-driven PTY integration. [VERIFIED: npm registry] [VERIFIED: package.json] |
| existing `completion-detector` | local module | Dual-signal completion | Reuse rather than rewriting timeout logic. [VERIFIED: src/lib/completion-detector.ts] |
| existing `concurrency` | local module | FIFO keyed concurrency | Reuse and extend for provider/model keys. [VERIFIED: src/lib/concurrency.ts] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `node-pty` | `bun-pty` | `opencode-pty` proves the PTY pattern, but this project targets Node `>=20`, not Bun-first runtime semantics. Use Bun-specific implementation details only as architecture inspiration. [CITED: https://github.com/shekohex/opencode-pty] [VERIFIED: package.json] |
| session-tree child sessions | isolated background sessions | Isolated sessions are simpler, but opencode-background-agents documents loss of undo/branching parity; this directly violates Phase 16 goals. [CITED: https://github.com/kdcokenny/opencode-background-agents] |
| existing completion-detector | fixed timeout watchdog | Fixed timeouts are explicitly locked out by D-13 and D-17. [VERIFIED: .planning/phases/16-background-delegation-revamp-pty-integration-rebuild-backgro/16-CONTEXT.md] |

**Installation:**
```bash
npm install node-pty zod
```

**Version verification:** `@opencode-ai/plugin 1.14.19`, `node-pty 1.1.0`, `zod 4.3.6`, `vitest 4.1.4`, and `typescript 6.0.3` were verified against the npm registry during this research session. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
caller/tool invocation
    |
    v
delegate-task tool
    |
    v
DelegationManager (orchestrator only)
    |-------------------------------> continuity/state lookup
    |
    +--> spawner/session-creator ----> OpenCode child session (parent-linked)
    |
    +--> spawner/pty-setup ----------> PTY process + buffer + input channel
    |
    +--> concurrency reservation ----> per provider/model queue
    |
    v
background execution
    |
    +--> session.idle events
    +--> message-stability polling
    |
    v
completion-detector
    |
    v
notification-handler + persistence
    |
    v
delegation-status tool / parent session system message
```

### Recommended Project Structure
```text
src/
├── lib/
│   ├── delegation-manager.ts      # orchestration only (<350 LOC target)
│   ├── completion-detector.ts     # reuse Phase 14 dual-signal logic
│   ├── concurrency.ts             # reuse keyed FIFO reservation logic
│   ├── pty/
│   │   ├── pty-manager.ts         # PTY lifecycle + session registry
│   │   ├── pty-buffer.ts          # output buffering / offsets
│   │   └── pty-types.ts           # PTY-specific contracts
│   └── spawner/
│       ├── session-creator.ts     # create parent-linked child sessions
│       ├── concurrency-key.ts     # provider/model key resolution
│       ├── parent-directory.ts    # child working directory resolution
│       ├── pty-setup.ts           # PTY bootstrap for delegated work
│       └── spawner-types.ts       # config/result interfaces
├── tools/
│   ├── delegate-task.ts           # dispatch only
│   ├── delegation-status.ts       # poll/retrieve only
│   └── delegation-pty-write.ts    # optional follow-up PTY input tool if needed
└── hooks/
    └── create-core-hooks.ts       # idle/deleted event integration stays here
```

### Pattern 1: Session-tree child sessions for write-capable delegation
**What:** Spawn background work as a child session linked to the parent session, not as an isolated out-of-tree process.

**When to use:** For every background delegation that must preserve undo/branching parity or mutate files. This is the default for Phase 16. [CITED: https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent] [CITED: https://github.com/kdcokenny/opencode-background-agents]

**Example:**
```typescript
// Shape synthesized from oh-my-openagent background-agent + current harness session-api.
// Source: https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent
const child = await sessionApi.createSession({
  parentID: parentSessionId,
  model: waiterModel,
  permission: writeCapablePermissionSet,
  cwd: resolvedWorkingDirectory,
})
```

### Pattern 2: PTY-by-default execution with headless fallback
**What:** Every delegation gets a PTY session unless PTY setup fails or is unsupported.

**When to use:** Always, per D-04. Fallback to headless only after PTY initialization failure is detected and recorded. [VERIFIED: .planning/phases/16-background-delegation-revamp-pty-integration-rebuild-backgro/16-CONTEXT.md] [CITED: https://github.com/shekohex/opencode-pty]

**Example:**
```typescript
// Shape synthesized from opencode-pty manager/plugin split.
// Source: https://github.com/shekohex/opencode-pty
const executionMode = ptyManager.isSupported() ? 'pty' : 'headless'
const runtime = executionMode === 'pty'
  ? await ptyManager.spawnForDelegation(config)
  : await sessionSpawner.spawnHeadless(config)
```

### Pattern 3: Orchestrator/spawner separation
**What:** Keep `DelegationManager` responsible for lifecycle coordination, not session construction, directory heuristics, PTY bootstrapping, or queue-key derivation.

**When to use:** Immediately. This is the main structural change that makes the Phase 16 rebuild feasible within the 500 LOC/module rules. [VERIFIED: AGENTS.md] [CITED: https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent/spawner]

**Example:**
```typescript
// Source: current harness structure + oh-my-openagent spawner pattern
const reservation = await concurrency.reserve(resolveConcurrencyKey(request))
const spawnResult = await spawner.start(request)
await orchestration.track(reservation, spawnResult)
```

### Anti-Patterns to Avoid
- **Isolated background sessions:** They break the parity goal that Phase 16 exists to restore. [CITED: https://github.com/kdcokenny/opencode-background-agents]
- **Fixed timeout completion:** Phase 14 already replaced this with dual-signal completion; do not regress. [VERIFIED: src/lib/completion-detector.ts]
- **DelegationManager as a god object:** Current 450 LOC density is already identified as a concern. [VERIFIED: .planning/codebase/CONCERNS.md] [VERIFIED: src/lib/delegation-manager.ts]
- **PTY logic in tool wrappers:** Tool handlers should validate inputs and call orchestrators, not manage terminals.
- **Second lifecycle source of truth:** Remove the stub or make it a facade; do not keep two independent lifecycle managers. [VERIFIED: src/plugin.ts]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| PTY transport | Custom pseudo-terminal wrapper | `node-pty`-based PTY manager | PTY edge cases (signals, exit handling, buffering) are already hard; use a battle-tested PTY library. [VERIFIED: npm registry] |
| Completion heuristics | Timeout-only completion logic | Existing dual-signal completion detector | Phase 14 already solved the correctness problem more safely. [VERIFIED: src/lib/completion-detector.ts] |
| Queue scheduler | New concurrency queue | Existing keyed semaphore in `concurrency.ts` | FIFO reservations and queue release semantics already exist locally. [VERIFIED: src/lib/concurrency.ts] |
| Background result storage | Ad hoc markdown dump logic | Existing continuity + task state layers | The project already has a dual-layer persistence model; keep it coherent. [VERIFIED: src/lib/continuity.ts] [VERIFIED: src/lib/state.ts] |
| Parent notification channel | Custom out-of-band notifier | Existing notification handler + system message path | The harness already notifies parent sessions asynchronously. [VERIFIED: src/lib/notification-handler.ts] |
| Helper duplication | Per-file text extraction helper | One shared `extractAssistantText` in `helpers.ts` | Duplicate parsing logic will drift and cause inconsistent results. [VERIFIED: src/lib/helpers.ts] [VERIFIED: src/lib/delegation-manager.ts] |

**Key insight:** Phase 16 is an **architecture extraction** phase, not a greenfield invention phase. The safest path is to reuse the local correctness-critical modules and import only the missing PTY/session-tree patterns from external references. [VERIFIED: .planning/codebase/ARCHITECTURE.md] [CITED: https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent] [CITED: https://github.com/shekohex/opencode-pty]

## Common Pitfalls

### Pitfall 1: Mistaking write-capable for “just allow bash/edit/write”
**What goes wrong:** The child can mutate files, but the parent cannot reason about those changes because the session is not linked into the session tree.

**Why it happens:** Teams focus on permission flags and ignore session lineage.

**How to avoid:** Make `parentID`/child-session lineage the primary design decision. Permission widening is secondary. [CITED: https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent] [CITED: https://github.com/kdcokenny/opencode-background-agents]

**Warning signs:** Undo/branching behaves differently for delegated work than foreground work.

### Pitfall 2: Treating PTY as an optional add-on instead of the primary runtime
**What goes wrong:** The design still optimizes for headless delegation and PTY becomes an afterthought.

**Why it happens:** Existing code has no PTY layer, so teams bolt it on near the tool wrapper.

**How to avoid:** Put PTY setup into the spawner path and record the chosen runtime mode on every delegation record. [VERIFIED: .planning/phases/16-background-delegation-revamp-pty-integration-rebuild-backgro/16-CONTEXT.md] [CITED: https://github.com/shekohex/opencode-pty]

**Warning signs:** No PTY-specific state object exists; PTY write/read hooks require ad hoc lookups.

### Pitfall 3: Leaving lifecycle ownership ambiguous
**What goes wrong:** Completion, cleanup, and recovery logic split between two managers.

**Why it happens:** Transitional code is allowed to persist after the initial rebuild.

**How to avoid:** Make `DelegationManager` the sole orchestration owner. If `HarnessLifecycleManager` remains, it must become a strict facade with zero independent state. [VERIFIED: src/plugin.ts]

**Warning signs:** Both managers register hooks or mutate task status.

### Pitfall 4: Replacing dual-signal completion with PTY exit-only completion
**What goes wrong:** A PTY process exits, but the OpenCode session has not stabilized, or vice versa.

**Why it happens:** PTY integration tempts the implementation to treat shell exit as task completion.

**How to avoid:** PTY exit is an input signal, not the final truth. Keep Phase 14 dual-signal completion as the terminal gate. [VERIFIED: src/lib/completion-detector.ts] [VERIFIED: .planning/phases/16-background-delegation-revamp-pty-integration-rebuild-backgro/16-CONTEXT.md]

**Warning signs:** Completion code no longer references both idle and message stability.

## Code Examples

Verified implementation shapes from cited sources and existing local modules:

### Spawn path split
```typescript
// Source: https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent/spawner
// Adaptation target: src/lib/spawner/
type SpawnRequest = {
  parentSessionId: string
  workingDirectory: string
  model: string
  permissions: string[]
  executionMode: 'pty' | 'headless'
}

type SpawnResult = {
  childSessionId: string
  executionMode: 'pty' | 'headless'
  ptySessionId?: string
}
```

### Completion remains dual-signal
```typescript
// Source: src/lib/completion-detector.ts
const completed = await completionDetector.isComplete({
  sessionIdle: idleSeen,
  messageCountStable: stablePollCount >= 3,
})
```

### PTY fallback policy
```typescript
// Source inspiration: https://github.com/shekohex/opencode-pty
let mode: 'pty' | 'headless' = 'pty'
try {
  ptySession = await ptyManager.spawnForDelegation(request)
} catch {
  mode = 'headless'
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Isolated background sessions | Parent-linked child sessions | Current background-agent patterns in oh-my-openagent | Restores lineage, recovery, and parity with foreground workflows. [CITED: https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent] |
| Fixed timeout task expiry | Dual-signal completion without fixed timeout | Phase 14 local baseline | Reduces false completion and respects long-running delegations. [VERIFIED: src/lib/completion-detector.ts] |
| Headless-only background tools | PTY-capable delegated execution | Current opencode-pty pattern | Enables interactive commands, stdin, and better parity with real shells. [CITED: https://github.com/shekohex/opencode-pty] |
| Monolithic orchestrator | Orchestrator + spawner + PTY manager split | Current best fit for this codebase | Keeps modules inside the project's 500 LOC architectural rule. [VERIFIED: AGENTS.md] |

**Deprecated/outdated:**
- Fixed 15-minute timeout ceilings for delegation lifecycle. Phase 16 should not implement them. [CITED: https://github.com/kdcokenny/opencode-background-agents] [VERIFIED: .planning/phases/16-background-delegation-revamp-pty-integration-rebuild-backgro/16-CONTEXT.md]
- Read-only background delegation as the default design target. It does not meet this phase's purpose. [VERIFIED: .planning/phases/16-background-delegation-revamp-pty-integration-rebuild-backgro/16-CONTEXT.md]

## Feasibility Assessment

| Area | Verdict | Notes |
|------|---------|-------|
| Write-capable child sessions | Feasible now | Current harness already uses OpenCode session APIs and can extend child-session spawning without leaving plugin boundaries. [VERIFIED: src/lib/session-api.ts] [VERIFIED: package.json] |
| PTY-by-default runtime | Feasible now | Node runtime is available locally and supports adding a PTY dependency. [VERIFIED: package.json] [VERIFIED: npm registry] [VERIFIED: environment] |
| DelegationManager reduction below 350 LOC | Feasible now | The main removals are spawn logic, helper duplication, and lifecycle ambiguity. [VERIFIED: src/lib/delegation-manager.ts] |
| Full parity with builtin `task` tool | Feasible enough for Phase 16 target | Matching every builtin behavior is not required; meeting the locked parity goals plus PTY-by-default is sufficient. [VERIFIED: 16-CONTEXT.md] |

## Recommended Architecture

1. **Keep `delegate-task` and `delegation-status` as the public API.** Do not expand Phase 16 into a task-tool replacement effort. [VERIFIED: src/tools/delegate-task.ts] [VERIFIED: src/tools/delegation-status.ts]
2. **Make `DelegationManager` orchestration-only.** It should own: dispatch coordination, task-state transitions, completion finalization, persistence calls, and parent notification.
3. **Create `src/lib/spawner/`.** Minimum modules: `session-creator.ts`, `concurrency-key.ts`, `parent-directory.ts`, `pty-setup.ts`, `spawner-types.ts`. [CITED: https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent/spawner]
4. **Create `src/lib/pty/`.** Minimum modules: `pty-manager.ts`, `pty-buffer.ts`, `pty-types.ts`. Use `node-pty`, not `bun-pty`, because this project is a Node package. [VERIFIED: package.json] [CITED: https://github.com/shekohex/opencode-pty]
5. **Preserve Phase 14 completion semantics.** PTY exit, session idle, and message stability are all signals, but terminal truth remains dual-signal completion. [VERIFIED: src/lib/completion-detector.ts]
6. **Collapse lifecycle ownership.** Prefer removing the stub `HarnessLifecycleManager`; second choice is a facade that forwards directly to `DelegationManager` with no independent status logic. [VERIFIED: src/plugin.ts]
7. **Unify text extraction now.** Move `extractAssistantText` to `helpers.ts` during the same phase because it reduces drift risk and directly supports status/report parity. [VERIFIED: src/lib/helpers.ts]

## Open Questions

1. **Should PTY input be exposed through a new tool in Phase 16?**
   - What we know: `opencode-pty` exposes explicit write/read tools; Phase 16 requires PTY-by-default, not necessarily a full PTY control plane. [CITED: https://github.com/shekohex/opencode-pty]
   - What's unclear: Whether delegated agents need mid-flight interactive input from the foreground in this phase.
   - Recommendation: Keep Phase 16 scope to PTY runtime + status visibility. Add a dedicated PTY write/read tool only if a concrete use case appears during planning.

2. **What safety ceiling should replace fixed timeouts?**
   - What we know: Fixed completion timeouts are explicitly disallowed.
   - What's unclear: Whether a separate zombie-session cleanup threshold should exist.
   - Recommendation: Use non-terminal watchdogs (warning/cleanup candidates) rather than timeout-based forced completion.

3. **Should PTY mode be persisted on every task record?**
   - What we know: This will simplify debugging and fallback analysis.
   - What's unclear: Exact persistence schema shape.
   - Recommendation: Yes — persist `executionMode`, `ptySessionId?`, and fallback reason if headless is used.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Plugin runtime, PTY integration | ✓ | `v25.9.0` | — |
| npm | Dependency install / scripts | ✓ | `11.12.1` | — |
| npx | Tooling / verification | ✓ | `11.12.1` | — |
| Bun | Optional reference parity with `opencode-pty` | ✓ | `1.3.13` | Not required |
| `node-pty` package | PTY runtime implementation | ✗ installed / ✓ available on npm | `1.1.0` current registry | Headless fallback until installed |

**Missing dependencies with no fallback:**
- None.

**Missing dependencies with fallback:**
- `node-pty` is not currently installed; use headless delegation temporarily if implementation begins before installation. [VERIFIED: package.json] [VERIFIED: npm registry]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `vitest` (`4.1.4` current registry; project configured locally) |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/lib/delegation-manager.test.ts -x` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01 | Write-capable child sessions can be spawned | integration | `npx vitest run tests/lib/spawner/session-creator.test.ts -x` | ❌ Wave 0 |
| D-04 | Delegation chooses PTY by default and records fallback | integration | `npx vitest run tests/lib/pty/pty-manager.test.ts -x` | ❌ Wave 0 |
| D-09 | Single lifecycle owner after cleanup | unit | `npx vitest run tests/plugins/plugin-lifecycle.test.ts -x` | ❌ Wave 0 |
| D-10 | Shared text extraction used across code paths | unit | `npx vitest run tests/lib/helpers.test.ts -t extractAssistantText` | ⚠ existing file likely reusable |
| D-13 / D-17 | Dual-signal completion stays authoritative | unit/integration | `npx vitest run tests/lib/completion-detector.test.ts -x` | ⚠ extend existing/nearby coverage |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/lib/spawner/**/*.test.ts tests/lib/pty/**/*.test.ts -x`
- **Per wave merge:** `npm test`
- **Phase gate:** `npm test && npm run typecheck && npm run build`

### Wave 0 Gaps
- [ ] `tests/lib/spawner/session-creator.test.ts` — child session lineage + permissions
- [ ] `tests/lib/spawner/parent-directory.test.ts` — working directory resolution
- [ ] `tests/lib/pty/pty-manager.test.ts` — spawn, exit, fallback, cleanup
- [ ] `tests/lib/pty/pty-buffer.test.ts` — buffer offset and truncation behavior
- [ ] `tests/plugins/plugin-lifecycle.test.ts` — verify only one lifecycle owner is wired

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no [ASSUMED] | Existing OpenCode host/session model; no new auth surface planned [ASSUMED] |
| V3 Session Management | yes | Parent-linked child session creation and explicit lifecycle ownership. [CITED: https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent] |
| V4 Access Control | yes | Permission sets for child sessions; avoid default-wide escalation. [ASSUMED] |
| V5 Input Validation | yes | `zod` schemas for tool inputs and PTY request payloads. [VERIFIED: package.json] |
| V6 Cryptography | no [ASSUMED] | No new crypto should be introduced in this phase. [ASSUMED] |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Over-privileged delegated session | Elevation of Privilege | Restrict write-capable permissions to the exact tool set required by delegation. [ASSUMED] |
| PTY command injection via unchecked input | Tampering | Validate PTY request payloads with `zod`; do not concatenate untrusted shell fragments. [VERIFIED: package.json] [ASSUMED] |
| Zombie PTY/session leakage | Denial of Service | Persist execution mode and clean up orphaned PTY sessions during lifecycle shutdown/recovery. [CITED: https://github.com/shekohex/opencode-pty] |
| False completion causing premature parent actions | Integrity | Keep dual-signal completion as the terminal condition. [VERIFIED: src/lib/completion-detector.ts] |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | OpenCode permission sets can be widened safely for write-capable child sessions without host-side policy blockers | Security Domain / Recommended Architecture | Medium — planner may need an additional compatibility task |
| A2 | No new authentication or cryptography surface is introduced by PTY-backed delegation in this phase | Security Domain | Low — could add unexpected security review work |
| A3 | A separate PTY write/read tool can be deferred unless planning finds a concrete interactive foreground use case | Open Questions | Medium — user workflow may require extra scope |

## Sources

### Primary (HIGH confidence)
- `src/lib/delegation-manager.ts` — current orchestration density and responsibilities
- `src/lib/completion-detector.ts` — locked dual-signal completion baseline
- `src/lib/concurrency.ts` — existing keyed FIFO concurrency
- `src/plugin.ts` — dual lifecycle wiring evidence
- `package.json` — runtime, dependency, and Node target facts
- `vitest.config.ts` — current test framework configuration
- `https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent` — background-agent architecture, session-tree approach
- `https://github.com/code-yeongyu/oh-my-openagent/tree/dev/src/features/background-agent/spawner` — spawner decomposition pattern
- `https://github.com/shekohex/opencode-pty` — PTY manager/tool/plugin architecture
- `https://github.com/kdcokenny/opencode-background-agents` — limitations to avoid (read-only, timeout, parity issues)
- npm registry checks for `@opencode-ai/plugin`, `node-pty`, `zod`, `vitest`, `typescript`

### Secondary (MEDIUM confidence)
- `.planning/codebase/ARCHITECTURE.md` — current codebase architectural summary
- `.planning/codebase/CONCERNS.md` — documented structural pain points
- `.planning/phases/16-background-delegation-revamp-pty-integration-rebuild-backgro/16-CONTEXT.md` — locked decisions and scope boundaries

### Tertiary (LOW confidence)
- None beyond the explicit `[ASSUMED]` items listed above.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - local runtime facts and npm registry versions were verified directly.
- Architecture: HIGH - recommendation aligns with locked local decisions plus two contrasting external architectures.
- Pitfalls: HIGH - all major pitfalls are grounded in either current local concerns or documented external failure modes.

**Research date:** 2026-04-21  
**Valid until:** 2026-05-21
