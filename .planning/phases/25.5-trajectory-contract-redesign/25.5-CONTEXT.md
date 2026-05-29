# Phase 25: Trajectory + Agent-Work-Contract Redesign — Context

**Gathered:** 2026-05-29
**Status:** Ready for spec
**Source:** Deep architecture research + assumptions analysis + user decisions

<domain>
## Phase Boundary

Redesign trajectory as a per-PHASE orchestrator mindmap (not per-delegation) and redesign agent-work-contracts as active governance tools with runtime enforcement (not passive records). The orchestrator uses trajectory CRUD operations to manage the high-level view of an entire phase lifecycle across all sessions, and contracts enforce tool restrictions at runtime via the tool.execute.before hook.

**Critical constraint:** "The harness can only OBSERVE and INJECT, not CONTROL." Trajectory and contracts must work through hooks and system prompt injection, not by forcing agents to call tools.

**Pressure system removed:** All pressure integration is removed from trajectory/contracts. The pressure module (runtime-pressure) exists independently but is NOT integrated with trajectory or contracts.
</domain>

<canonical_refs>
## Canonical References

### Architecture research
- `.planning/research/deep-architecture-research-2026-05-29.md` — Deep architecture research (OpenCode SDK hooks, delegation, session, routing)
- `.planning/research/P25-assumptions-analysis-2026-05-29.md` — Assumptions analysis (13 Confident, 6 Likely, 6 Unknowns)

### OpenCode SDK
- `node_modules/@opencode-ai/plugin/` — Plugin SDK types (hooks, tools, permissions)
- `src/plugin.ts` — Plugin composition root (tool/hook registration)
- `src/shared/session-api.ts` — OpenCode client API

### Session-tracker
- `src/features/session-tracker/tool-delegation.ts` — Hook point for delegation lifecycle
- `src/features/session-tracker/index.ts` — Session-tracker entry point

### Trajectory module (current — needs redesign)
- `src/task-management/trajectory/types.ts` — Current types (per-delegation, 2 statuses)
- `src/task-management/trajectory/store-operations.ts` — Current operations
- `src/task-management/trajectory/ledger.ts` — Append-only ledger

### Contract module (current — needs redesign)
- `src/features/agent-work-contracts/types.ts` — Current types
- `src/features/agent-work-contracts/operations.ts` — Current operations (pressure-gated creation)
- `src/features/agent-work-contracts/lifecycle.ts` — Current lifecycle (5 statuses)
- `src/features/agent-work-contracts/bounds.ts` — Unified bounds constants
- `src/schema-kernel/agent-work-contract.schema.ts` — Zod schema

### Delegation persistence
- `src/task-management/continuity/delegation-persistence.ts` — Delegation records (delegations.json)
- `src/task-management/continuity/index.ts` — Session continuity

### Agent definitions
- `.opencode/agents/hm-l0-orchestrator.md` — L0 orchestrator (806 lines)
- `.opencode/agents/` — 76 agent definitions total

### External learning
- `repo-for-learning-and-synthesis.md` — External repos for synthesis (OMO, opencode-pty, background-agents)
</canonical_refs>

<decisions>
## Implementation Decisions

### U1: Trajectory Scope — Both Layered
- **D-01:** Trajectory is PER-PHASE (not per-delegation). One trajectory per phase.
- **D-02:** Phase-level trajectory aggregates delegation-level records.
- **D-03:** Delegation-level records linked to session-tracker via jump links (not data duplication).
- **D-04:** Phase trajectory ID format: `traj-phase-{N}`.
- **D-05:** Delegation trajectory ID format: `traj-{childSessionID}` (linked to phase trajectory via `parentTrajectoryId`).

### U2: Contract Enforcement — Enforce + Document
- **D-06:** Contracts enforce tool restrictions at runtime via `tool.execute.before` hook.
- **D-07:** `scope.allowedSurfaces` is checked before tool execution — agents violating scope are blocked.
- **D-08:** Contracts also document scope for humans (export as Markdown).

### U3: Pressure Removal — Remove Everything
- **D-09:** Remove pressure check from `createAgentWorkContract()` in `operations.ts`.
- **D-10:** Remove pressure integration from contract lifecycle transitions.
- **D-11:** Remove `pressureScore`, `pressureTier`, `pressureApproved` from contract creation input.
- **D-12:** Remove `detectRuntimePressure()` call from contract operations.
- **D-13:** Keep `runtime-pressure` module as independent module (not integrated with contracts).

### U4: CQRS — Acceptable (Pragmatic)
- **D-14:** Hooks writing to trajectory/contracts is acceptable. CQRS boundary is a guideline, not hard rule.

### U5: Trajectory Creation — Hook on Phase Spawn, Event-Based Updates
- **D-15:** Trajectory is created by a hook when a new phase spawns.
- **D-16:** After creation, events trigger agents to use trajectory tools for updates, queries, reads, modifications.
- **D-17:** The trajectory tool is specifically designed for CRUD operations on the phase mindmap.
- **D-18:** Agents are instructed (via system prompt injection) to call trajectory tools when phase-relevant events occur.

### U6: Trajectory vs Delegation Persistence — Link via Jump Links
- **D-19:** Trajectory links TO delegation-persistence via jump links.
- **D-20:** No data duplication between trajectory and delegation-persistence.
- **D-21:** Jump links are string references (e.g., `delegation:{childSessionID}`) that point to delegation records.

### Agent's Discretion
- Exact jump link format and storage location
- System prompt injection strategy for trajectory tool guidance
- Enforcement mechanism details (tool.execute.before check logic)
- Phase spawn detection mechanism (which hook triggers trajectory creation)

</decisions>

<specifics>
## Specific Ideas

- Trajectory is the orchestrator's mindmap — high-level view of phase lifecycle
- Progressive disclosure: summary → detailed → full depth levels
- Contracts enforce boundaries: allowedSurfaces checked at runtime
- Pressure is completely removed from trajectory/contracts
- Jump links connect trajectory events to delegation records without duplication
- Session-tracker is the primary data source for delegation-level details
</specifics>

<deferred>
## Deferred Ideas

### Pressure System
- Pressure module exists independently but is NOT integrated with trajectory/contracts
- If pressure integration is needed in the future, it can be re-added as a separate phase
- User explicitly requested removal: "complete product of hallucination, get them out of the system"

### P25.1 Rework
- Current P25.1 implementation (per-delegation trajectories) needs to be reverted or replaced
- The hook-based creation pattern is correct but the scope (per-delegation vs per-phase) is wrong
- Contract auto-creation with empty scope is wrong — contracts should be created with meaningful scope
</deferred>

---

*Phase: 25-trajectory-agent-work-contract-redesign*
*Context gathered: 2026-05-29*
*Source: Deep architecture research + assumptions analysis + user decisions*
