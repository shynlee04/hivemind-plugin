# Phase 09: Sticky Delegation Corrective - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-10
**Phase:** 09-sticky-delegation-corrective
**Areas discussed:** Module Boundaries & Structure, Configurability Surface, Completion Detection Logic, Test Strategy & TDD Rules

---

## Module Boundaries & Structure

### Structure Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Feature module | `src/lib/tasking/` as coordination-tasking domain. Other domains stay in `src/lib/`. | ✓ |
| Full domain decomposition | Restructure ALL of src/ into tasking/, persistence/, governance/, routing/, sdk/ | |
| Flat split only | Keep flat src/lib/ but split lifecycle-manager.ts into 3-4 focused files | |

**User's choice:** Feature module (Recommended)
**Notes:** Fastest to implement, clear module boundary, minimal file moves.

### Lifecycle-Manager Decomposition

| Option | Description | Selected |
|--------|-------------|----------|
| 3-way split | tasking-coordinator (dispatch+events), tasking-observer (observation+notification), tasking-dispatcher (prompt+runner selection) | ✓ |
| Fine-grained (5+) | coordinator, observer, dispatcher, queue-manager, runner-factory | |
| Minimal extraction | Extract only most tangled parts (dispatch + event routing) | |

**User's choice:** 3-way split (Recommended)
**Notes:** Each <300 LOC with clear single responsibility.

### Runner Organization

| Option | Description | Selected |
|--------|-------------|----------|
| Shared interface | `runners/` with common `TaskRunner` interface + per-runner implementations | ✓ |
| Loose grouping | Keep runners as-is but extract shared types. No common interface | |
| Strategy pattern | Single file with multiple strategies switching on execution mode | |

**User's choice:** Shared interface (Recommended)
**Notes:** Good for testing — inject mock runners via the shared interface.

---

## Configurability Surface (JSON)

### Config Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Single config file | One `harness.json` with all sections | |
| Split by concern | Separate configs: runtime-policy.json, delegation-policy.json, agent-config.json | |
| Hybrid | Single `harness.json` entry with optional concern-specific file references | ✓ |

**User's choice:** Hybrid (single entry, split files)

### Skill Injection Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Config-driven | Config maps { agent: { category: [skills] } } | |
| Agent-driven with defaults | Agent passes skills as argument; config provides defaults | |

**User's choice:** Custom response — "if not config then agents are freely to call if being configed the skills are stick to"
**Notes:** Config as guardrails, not cage. Absence = freedom, presence = constraint. This applies to ALL configurable aspects (skills, tools, delegation, permissions, hooks injection, routing).

### Config Scope for Phase 09

| Option | Description | Selected |
|--------|-------------|----------|
| Schema + tasking only | Implement config SCHEMA + tasking wiring. Future phases extend. | ✓ |
| Full config surface | Wire config to ALL domains (tasking + governance + hooks + routing + permissions) | |

**User's choice:** Schema + tasking only (Recommended)

---

## Completion Detection Logic

### Module Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Sub-module | `src/lib/tasking/completion/` with start-gate, poll-strategy, completion-verifier, failure-handler | ✓ |
| Single file expansion | Keep completion-detector.ts, add all new logic there | |

**User's choice:** Sub-module (Recommended)
**Notes:** Each phase of completion detection gets its own focused file.

### Session Reuse on Retry

| Option | Description | Selected |
|--------|-------------|----------|
| Resume-first | Same session ID, only create new if deleted/errored | ✓ |
| Fresh session always | Always create new session on retry | |
| Smart recovery | Resume or fresh based on session state | |

**User's choice:** Resume-first (Recommended)

---

## Test Strategy & TDD Rules

### Test Approach

| Option | Description | Selected |
|--------|-------------|----------|
| In-memory adapters | Clean Architecture pattern — in-memory implementations of runner interface | ✓ |
| Full integration tests | Actually create child sessions through SDK | |
| Transport-mock only | Mock only SDK transport, test real business logic | |

**User's choice:** In-memory adapters (Recommended)
**Notes:** Test real coordination logic without needing live OpenCode.

### Anti-Mock Boundary

| Option | Description | Selected |
|--------|-------------|----------|
| Transport + time only | Mock SDK transport + fake timers. Never mock internals. | ✓ |
| Zero mocking | Every test must exercise real code with real time | |
| External boundaries only | Mock all external (SDK, filesystem, time). Don't mock internal modules. | |

**User's choice:** Transport + time only (Recommended)
**Notes:** NEVER mock internal business logic, runner interfaces, state machines, or concurrency.

---

## the agent's Discretion

- Exact file naming within tasking module
- Import ordering and code style
- Which oh-my-openagent patterns to adapt vs. skip
- Test file organization
- Zod schema structure for config types

## Deferred Ideas

- Governance rules configurable via JSON (future phase)
- Hooks injection configurable via JSON (future phase)
- Routing configurable via JSON (future phase)
- Permissions configurable via JSON (future phase)
- UI/UX for configuration (near future)
- Full domain decomposition of non-tasking modules (Phase 11)
- CQRS separation across all modules (Phase 11)
