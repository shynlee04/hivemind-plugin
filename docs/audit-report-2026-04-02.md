# Harness Framework — Expert Audit Report

**Date:** 2026-04-02
**Auditor:** Senior Software Architect / Technical Auditor
**Scope:** Full codebase audit of `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/`
**Session Context:** Continuing from `session-ses_2b27.md` (harness audit) and `session-ses_2b67.md` (product-detox build)

---

## Executive Summary

**Verdict: The harness plugin code is architecturally sound BUT is NOT DEPLOYED.** The entire control plane is inert because the plugin is not loaded by OpenCode. This explains the user's experience: the conductor agent is "dumber than without anything" and "can't use any tools" — because `delegate-task` doesn't exist at runtime, and the conductor's permissions are configured around a tool that was never registered.

The source code in `src/` is genuinely well-engineered (~2,300 LOC across 11 modules). It implements real runtime capabilities that cannot be replicated with `.md` files alone. But the deployment gap renders it useless.

---

## Phase 1: Skills Discovery

Loaded skills informing this audit:
- **validate-implementation-plan** — Requirements traceability methodology
- **harness-overview** — Harness architecture reference (loaded from `.opencode/skills/`)
- **opencode-platform-reference** — OpenCode SDK/plugin capabilities

---

## Phase 2: Document Analysis

### Requirements (requirements-2026-04-02.md)

**Core Promised Features:**
1. Multi-agent orchestration with 3 specialists (researcher, builder, critic) + conductor
2. Custom `delegate-task` tool for controlled session spawning
3. Runtime guardrails: circuit breaker (threshold 16), tool call budget (400), depth limit (3), descendant budget (10)
4. Session lifecycle tracking: created → queued → dispatching → running → completed/failed
5. Continuity persistence to JSON file with deep-clone-on-read
6. Concurrency control with keyed semaphore (per model/agent/category)
7. Context injection during compaction via `experimental.session.compacting`
8. Shell safety via `shell.env` hook
9. Commands: `/plan`, `/start-work`, `/ultrawork`, `/harness-doctor`
10. Context checkpoint save/restore tools
11. Wisdom accumulation system

### User Stories (user-stories-2026-04-02.md)

**Key User Workflows:**
- US-001: User submits task → Conductor classifies intent → delegates via `delegate-task`
- US-002/003/004: Specialist agents operate with restricted permissions
- US-006/007/008: Command workflows for planning, execution, autonomous mode
- US-010/011: Session creation with guardrails, completion detection
- US-013: Context checkpoint save/restore

**Competitive Differentiators Claimed:**
- OMO pattern alignment (3-agent planning pipeline, 6-section delegation prompts, category routing)
- Harness-internal abstractions (concurrency queues, budget tracking, circuit breaker)
- Dual-layer state (durable JSON + in-memory Maps)

---

## Phase 3: Implementation Audit

### 3.1 Architectural Soundness

**Module Structure: GOOD**
- Clean separation of concerns across 11 modules
- `types.ts` as shared leaf node (imported by 8/11 modules)
- `concurrency.ts` fully self-contained
- `helpers.ts` pure utilities only
- Dependency graph max depth: 2 levels

**Concern Separation: GOOD**
- `continuity.ts`: persistence + normalization + cloning
- `lifecycle-manager.ts`: session orchestration
- `session-api.ts`: typed SDK wrappers
- `state.ts`: in-memory Maps
- `runtime.ts`: event-to-status mapping

**Abstraction Layers: MIXED**
- ✅ Good: `createHarnessLifecycleManager()` factory pattern
- ✅ Good: `DelegationConcurrencyQueue` class with clean API
- ⚠️ Weak: `plugin.ts` uses `as any` casts for `tool` extraction (line 52)
- ⚠️ Weak: `client` flows as untyped throughout (known tech debt)

### 3.2 Feature Parity — Requirements vs Code

| Requirement ID | Requirement | Status | Evidence |
|---|---|---|---|
| ARCH-002 | Plugin entry point | ✅ IMPLEMENTED | `plugin.ts:110` — `HarnessControlPlane` async function |
| MOD-001 | types.ts | ✅ IMPLEMENTED | `types.ts` — 157 LOC, all types defined |
| MOD-002 | helpers.ts | ✅ IMPLEMENTED | `helpers.ts` — 116 LOC, pure utilities |
| MOD-003 | state.ts | ✅ IMPLEMENTED | `state.ts` — 106 LOC, Map-based storage |
| MOD-004 | continuity.ts | ✅ IMPLEMENTED | `continuity.ts` — 638 LOC, JSON persistence |
| MOD-005 | routing.ts | ❌ DELETED | File does not exist. AGENTS.md confirms "routing.ts was DELETED" |
| MOD-006 | concurrency.ts | ✅ IMPLEMENTED | `concurrency.ts` — 98 LOC, keyed semaphore |
| MOD-007 | session-api.ts | ✅ IMPLEMENTED | `session-api.ts` — 120 LOC, typed SDK wrappers |
| MOD-008 | runtime.ts | ✅ IMPLEMENTED | `runtime.ts` — 69 LOC, event inference |
| MOD-009 | lifecycle-manager.ts | ✅ IMPLEMENTED | `lifecycle-manager.ts` — 705 LOC, central orchestrator |
| MOD-010 | plugin.ts | ✅ IMPLEMENTED | `plugin.ts` — 447 LOC, hooks + custom tool |
| AGT-001 | 3 specialist agents | ✅ IMPLEMENTED | `types.ts:5` — VALID_AGENTS |
| AGT-002 | Conductor agent | ✅ DEFINED (MD) | `.opencode/agents/conductor.md` — 98 lines |
| AGT-005-007 | Agent permissions | ✅ DEFINED (MD) | Agent .md files + `plugin.ts:73-108` |
| AGT-008 | Temperatures | ✅ IMPLEMENTED | `plugin.ts:40-44` — AGENT_DEFAULTS |
| CAT-001 | 4 categories | ✅ IMPLEMENTED | `types.ts:6-11` |
| CAT-009 | 6-section prompts | ✅ IMPLEMENTED | `helpers.ts:73-116` — buildPromptText |
| PERM-008 | delegate-task tool | ✅ IMPLEMENTED | `plugin.ts:309-443` |
| GRD-001 | Max depth 3 | ✅ IMPLEMENTED | `plugin.ts:35` — MAX_DEPTH = 3 |
| GRD-002 | Max 10 descendants | ✅ IMPLEMENTED | `types.ts:3` — MAX_DESCENDANTS_PER_ROOT |
| GRD-003 | Max 400 tool calls | ✅ IMPLEMENTED | `plugin.ts:38` — MAX_TOOL_CALLS_PER_SESSION |
| GRD-004 | Circuit breaker (16) | ✅ IMPLEMENTED | `plugin.ts:37` — CIRCUIT_BREAKER_THRESHOLD |
| GRD-006 | Shell env vars | ✅ IMPLEMENTED | `plugin.ts:299-307` |
| LIF-001 | Lifecycle phases | ✅ IMPLEMENTED | `types.ts:86-93` + lifecycle-manager |
| LIF-005 | Sync/async modes | ✅ IMPLEMENTED | `lifecycle-manager.ts:266-461` |
| LIF-006 | SSE completion | ⚠️ PARTIAL | Uses `CompletionDetector` with event feeding, but no `client.event.subscribe()` SSE stream |
| PER-001 to PER-009 | Continuity persistence | ✅ IMPLEMENTED | `continuity.ts` — full CRUD + normalization |
| CON-001 to CON-006 | Concurrency queues | ✅ IMPLEMENTED | `concurrency.ts` — acquire/release/snapshot |
| CTX-001/002/004 | Compaction context | ✅ IMPLEMENTED | `plugin.ts:211-297` |
| CTX-003 | chat.params hook | ❌ NOT IMPLEMENTED | No `chat.params` hook registered in plugin |
| CHK-001 to CHK-005 | Context checkpoints | ❌ NOT IMPLEMENTED | No `context-checkpoint_save` or `context-checkpoint_restore` tools |
| CMD-001 to CMD-004 | Commands | ⚠️ MD FILES ONLY | `.opencode/commands/` has .md files but no plugin integration |
| SKL-001 to SKL-004 | Skills | ✅ IMPLEMENTED | `.opencode/skills/` has 4 skill files |
| TOOL-006 to TOOL-011 | Checkpoint tools | ❌ NOT IMPLEMENTED | Missing entirely |
| PERM-002 | doom_loop: allow | ❌ NOT CONFIGURED | No root permission config sets this |
| PERM-003 | task: ask | ❌ NOT CONFIGURED | Root permissions not set in opencode.json |
| EVT-001 | Event hook | ✅ IMPLEMENTED | `plugin.ts:200-209` |
| EVT-002 | Root inheritance | ✅ IMPLEMENTED | `lifecycle-manager.ts:189-194` |
| EVT-003 | Session deletion cleanup | ✅ IMPLEMENTED | `lifecycle-manager.ts:196-199` |
| SDK-001 | Session create/prompt | ✅ IMPLEMENTED | `session-api.ts:23-67` |
| SDK-006 | Session abort | ✅ IMPLEMENTED | `lifecycle-manager.ts:242-263` |
| SDK-007 | session.children() | ❌ NOT USED | Not called anywhere in codebase |

### 3.3 Harness Superiority Assessment

**Does it go beyond `.md` files? YES — but with caveats.**

**What .md files CANNOT do (and this harness DOES):**

1. **Runtime tool interception** (`tool.execute.before` hook) — Circuit breaker and budget enforcement happen at execution time. No `.md` file can intercept tool calls mid-execution.

2. **Programmatic session creation** (`delegate-task` custom tool) — Creates child sessions via `client.session.create()` with permission rulesets, walks parent chains for depth tracking, manages concurrency queues. This is real orchestration.

3. **Cross-session state persistence** (`continuity.ts`) — JSON file survives process restarts. `.md` files are static; this is dynamic state.

4. **Concurrency control** (`concurrency.ts`) — Keyed semaphore with FIFO queuing. No `.md` file can block and queue async operations.

5. **Event-driven lifecycle** (`event` hook + `CompletionDetector`) — Reacts to `session.idle`, `session.error`, `session.deleted` events in real-time.

6. **Context compaction injection** (`experimental.session.compacting`) — Injects structured harness state before context pruning.

**What .md files COULD do (redundant with this harness):**

1. Agent definitions — The conductor/researcher/builder/critic .md files in `.opencode/agents/` could exist without the plugin. The plugin adds permission enforcement but the agent personalities are just markdown.

2. Commands — The `/plan`, `/start-work`, `/ultrawork` .md files are just instructions. They work (or don't) based on the LLM following them, not on any harness enforcement.

3. Skills — The `.opencode/skills/` files are independent of the plugin.

4. Wisdom files — `.harness/wisdom/` is just markdown files the agent reads/writes.

**The critical differentiator:** The `delegate-task` tool is the linchpin. Without it, the harness is just a collection of .md files. With it, you get real session orchestration. The tool IS properly implemented in the code.

### 3.4 Code Quality

**Type Safety: GOOD (with known debt)**
- No `any` type aliases in new code
- Known debt: `client` flows as `any` (SDK lacks types)
- `tool` extraction uses `as any` cast (`plugin.ts:52`) — should use proper type guard
- All shared types in `types.ts` are well-defined

**Error Handling: GOOD**
- All errors prefixed with `[Harness]` — flow control mechanism
- Graceful handling in `notifyParentSession` (notification failure doesn't propagate)
- Continuity handles corrupt JSON → empty store
- Rollback on session creation failure (`lifecycle-manager.ts:461-466`)

**Edge Case Coverage: MIXED**
- ✅ Cycle detection in parent chain walk (`session-api.ts:109-111`)
- ✅ Double-release protection (`concurrency.ts:77-82`)
- ✅ Unserializable args fallback (`helpers.ts:68-69`)
- ✅ Warning cap at 25 (`state.ts:24`)
- ⚠️ No graceful shutdown for background observers (LIM-005)
- ⚠️ No SSE reconnection logic (LIM-008)

**Performance: ACCEPTABLE**
- O(1) continuity reads via in-memory cache
- Debounced writes (synchronous on critical changes)
- Semaphore acquire O(1) amortized
- Parent chain walk O(d) where d ≤ 3

---

## Phase 4: Competitive Analysis

### 4.1 What would a user need to build manually without this framework?

1. **Session orchestration** — Manually call `client.session.create()`, `client.session.prompt()`, track parent chains, manage depth limits
2. **Permission enforcement** — Manually configure agent .md files with permission blocks (no runtime interception)
3. **Concurrency control** — No built-in semaphore; would need external state management
4. **Circuit breaker** — No built-in loop detection beyond platform's `doom_loop` at threshold 3
5. **Continuity** — No cross-session persistence; state lost on restart
6. **Completion detection** — No built-in idle detection for async sessions
7. **Context preservation** — No automated state injection during compaction

**Complexity eliminated:** Significant. The harness consolidates ~2,300 LOC of orchestration logic that would otherwise be scattered across agent prompts, custom tools, and manual SDK calls.

### 4.2 Feature Cohesion

**Cohesive and synergistic:** Yes. The features form a coherent control plane:
- `delegate-task` creates sessions → lifecycle-manager tracks them → continuity persists state → concurrency controls throughput → circuit breaker prevents runaway → compaction hook preserves context

**Not arbitrary:** Each feature serves the multi-agent orchestration goal. No feature exists in isolation.

### 4.3 What the harness does NOT provide (gaps)

1. **Intent classification** — The conductor agent is supposed to classify intent, but this is LLM-dependent, not code-enforced
2. **Plan generation** — `/plan` command is just an .md file, no code enforcement
3. **Gap analysis** — No automated gap analysis tool
4. **Doctor command** — `/harness-doctor` .md file exists but no implementation
5. **Checkpoint tools** — `context-checkpoint_save/restore` not implemented
6. **chat.params hook** — Not registered, so temperature/model overrides per delegation don't happen at the LLM level

---

## Phase 5: Critical Assessment

### 5.1 Is this a legitimate, feature-complete product?

**No. It is a legitimate but INCOMPLETE product.**

The core plugin code is well-engineered and implements real runtime capabilities. But:

- **~30% of requirements are unimplemented** (checkpoint tools, chat.params hook, doctor command, routing module)
- **Commands are .md files only** — no plugin integration for enforcement
- **No root permission configuration** — `doom_loop: allow` and `task: ask` not set

### 5.2 Are the features architecturally sound?

**Yes, for what is implemented.** The code that exists follows sound patterns:
- Factory functions for complex objects
- Deep-clone-on-read prevents mutation leaks
- Reserve/commit/rollback for budget management
- Idempotent release for concurrency
- Normalization on load for data integrity

### 5.3 Does it deliver genuine harness value beyond documentation files?

**Yes, absolutely — when deployed.** The plugin hooks provide:
- Real-time tool call interception (circuit breaker, budget enforcement)
- Programmatic session creation with permission rulesets
- Cross-session state persistence
- Concurrency control with queuing
- Event-driven lifecycle management
- Context preservation during compaction

These cannot be replicated with `.md` files.

### 5.4 Critical Gaps, Bugs, and Architectural Problems

#### CRITICAL — Deployment Gap

**The `.opencode/plugins/` directory is EMPTY.** The plugin code exists in `src/` but is not deployed to `.opencode/plugins/`. This means:

1. **`delegate-task` tool does not exist at runtime** — The conductor agent references it but it's never registered
2. **No hooks fire** — Circuit breaker, budget enforcement, metadata injection, compaction context, shell env — all inert
3. **Conductor is broken by design** — It has `task: ask` and depends on `delegate-task: allow`, but `delegate-task` doesn't exist. The conductor has no delegation mechanism.

This explains the user's experience: "dumber than without anything, nor can it use any tools."

#### CRITICAL — Missing Root Permissions

No `opencode.json` at the project root configures:
- `doom_loop: "allow"` — Platform will block at 3 identical calls, conflicting with harness circuit breaker at 16
- `task: "ask"` — Built-in task tool not gated
- Plugin path — Plugin not loaded

#### HIGH — Missing Checkpoint Tools

`context-checkpoint_save` and `context-checkpoint_restore` (TOOL-006 through TOOL-011) are not implemented. This breaks US-013 and CHK-001 through CHK-005.

#### HIGH — Missing `chat.params` Hook

CTX-003 requires overriding chat parameters (model, temperature) per delegation. The hook is not registered. Temperature defaults exist in code but are never applied at the LLM level.

#### HIGH — `routing.ts` Deleted But Referenced

The AGENTS.md notes "routing.ts was DELETED" but:
- Requirements MOD-005 require it
- User stories reference "routing module" (TOOL-002, RTE-001)
- Category-to-agent/model/temperature mapping is now scattered (partly in `plugin.ts`, partly expected from agent .md files)

#### MEDIUM — `agent-registry.ts` Orphaned

`src/lib/agent-registry.ts` exists but is not imported by any module. Dead code.

#### MEDIUM — `index.ts` References Non-Existent Modules

`index.ts:12-13` exports from `./lib/task-status.js` and `./lib/completion-detector.js` — these files exist but `index.ts` also references modules that may not exist in all builds.

#### MEDIUM — No SSE Stream for Completion Detection

LIF-006 requires SSE as primary completion detection with polling as fallback. The current implementation uses `CompletionDetector` fed by the `event` hook, but never calls `client.event.subscribe()`. If the event hook doesn't fire, there's no fallback.

#### LOW — Duplicate `asString` Function

`helpers.ts:33-35` and `continuity.ts:110-112` both define `asString`. Consolidation pending.

#### LOW — Module-Level Singleton

`continuity.ts:26` — `storeCache` singleton prevents isolated unit testing.

### 5.5 Production Recommendation

**NOT READY for production use.** Reasons:

1. **Plugin not deployed** — The entire control plane is inert. This is the single biggest blocker.
2. **Conductor agent is broken** — Without `delegate-task`, the conductor has no way to delegate. Its permissions (`task: ask`) actively prevent it from using the platform's built-in task tool.
3. **Missing critical tools** — Checkpoint save/restore not implemented.
4. **Missing hooks** — `chat.params` not registered, so model/temperature overrides don't work.
5. **No root permission config** — Platform doom_loop will conflict with harness circuit breaker.

**What's needed to be production-ready:**

1. Deploy `src/plugin.ts` to `.opencode/plugins/harness-control-plane.ts`
2. Add `opencode.json` with plugin path, root permissions (`doom_loop: allow`, `task: ask`)
3. Implement `context-checkpoint_save` and `context-checkpoint_restore` tools
4. Register `chat.params` hook for temperature/model overrides
5. Either restore `routing.ts` or formally remove the requirement
6. Remove orphaned `agent-registry.ts`
7. Add SSE fallback for completion detection
8. Write comprehensive tests (currently only 6 test files, missing tests for plugin, continuity, lifecycle-manager, concurrency, state, routing)

---

## Appendix: Session Analysis

### session-ses_2b27.md (Harness Audit)

The previous audit session correctly identified the architecture but was analyzing the code at rest. It did not identify the deployment gap (empty `.opencode/plugins/` directory).

### session-ses_2b67.md (Product Detox Build)

The orchestrator in this session correctly identified the fundamental architectural issue in an earlier iteration: "I used hooks when I should have used custom tools that REPLACE built-in tools." The current codebase reflects this correction — `delegate-task` IS registered as a custom tool via the plugin's `tool` key with `client` access. The code architecture is correct.

The orchestrator's frustration about dependencies was valid — the code depends on `@opencode-ai/plugin` and `@opencode-ai/sdk` which are provided by OpenCode's runtime, not by a project `package.json`. This is by design and correct.

---

## File-by-File Summary

| File | LOC | Quality | Issues |
|---|---|---|---|
| `src/plugin.ts` | 447 | Good | `as any` cast, no chat.params hook |
| `src/index.ts` | 13 | Good | Barrel exports only |
| `src/lib/types.ts` | 157 | Good | Clean, well-organized |
| `src/lib/continuity.ts` | 638 | Good | Singleton, duplicated asString, large |
| `src/lib/lifecycle-manager.ts` | 705 | Good | Large but well-structured |
| `src/lib/session-api.ts` | 120 | Good | Clean SDK wrappers |
| `src/lib/runtime.ts` | 69 | Good | Focused, single responsibility |
| `src/lib/helpers.ts` | 116 | Good | Pure utilities |
| `src/lib/concurrency.ts` | 98 | Excellent | Self-contained, clean API |
| `src/lib/state.ts` | 106 | Good | Clean Map management |
| `src/lib/completion-detector.ts` | 123 | Good | Two-signal detection, clean |
| `src/lib/notification-handler.ts` | 85 | Good | Best-effort pattern |
| `src/lib/task-status.ts` | 21 | Excellent | Minimal, correct |
| `src/lib/agent-registry.ts` | ? | Dead code | Not imported anywhere |
| `.opencode/agents/conductor.md` | 98 | Good | Well-structured prompt |
| `.opencode/agents/builder.md` | ? | Unknown | Not read |
| `.opencode/agents/researcher.md` | ? | Unknown | Not read |
| `.opencode/agents/critic.md` | ? | Unknown | Not read |
| `.opencode/commands/*.md` | 5 files | MD only | No plugin integration |
| `.opencode/skills/*.md` | 4 files | Good | Properly structured |
| `.opencode/plugins/` | 0 files | CRITICAL | Empty — plugin not deployed |
| `.opencode/tools/` | 0 files | Expected | All tools from plugin |

---

**Total source LOC: ~2,300**
**Test coverage: Partial (6 test files for 11 source modules)**
**Requirements met: ~70%**
**Production readiness: NOT READY**
