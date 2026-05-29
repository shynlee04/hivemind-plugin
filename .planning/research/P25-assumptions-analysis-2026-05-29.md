# Phase 25 Assumptions Analysis

**Date:** 2026-05-29
**Source:** Deep architecture research (`deep-architecture-research-2026-05-29.md`) + codebase analysis
**Status:** ANALYSIS — for user review before Phase 25.1 planning
**Prior context:** `P25-CONTEXT.md` (2026-05-29), `P25-GRAY-AREAS.md` (2026-05-29)

---

## CRITICAL FINDING FROM RESEARCH

> "The harness can only OBSERVE and INJECT, not CONTROL."
> — deep-architecture-research-2026-05-29.md, §3

This means:
- Trajectory and contracts must be tools that agents CHOOSE to call
- The harness can make tools available, inject instructions, guard execution, and capture when agents do/don't call
- The harness CANNOT force agents to call trajectory or contracts
- The current P25.1 approach (auto-create at delegation time via session-tracker hooks) is the correct pattern — it uses hooks to automatically create records, not agent opt-in

---

## 1. Trajectory Assumptions

### A1: Trajectory is a per-delegation evidence record, not a per-phase mindmap

**What we assume:** Each trajectory record corresponds to a single delegation (child session), not to a phase or workflow. The `TrajectoryRecord` type has `rootSessionId`, `sessionId`, `parentTrajectoryId` — all session-scoped.

**Why this way:** Code at `src/task-management/trajectory/types.ts:53-76` shows `TrajectoryRecord` with session IDs, not phase/workflow IDs. The P25.1 integration (`tool-delegation.ts:384-470`) creates trajectories per delegation with `traj-${childSessionID}` as the ID.

**What we DON'T know:** Whether trajectory should ALSO track phase-level progress (e.g., "Phase 25 is 60% complete"). Currently it only tracks delegation-level evidence.

**If wrong:** If trajectory should be phase-scoped, the entire data model needs restructuring. The current `rootSessionId` grouping allows querying all delegations under a root session, which approximates phase-level aggregation.

**Confidence:** Confident — code and P25.1 implementation both confirm delegation-scoped design.

### A2: Trajectory is created automatically at delegation time, not by agent opt-in

**What we assume:** When `task` or `delegate-task` fires, session-tracker automatically creates a trajectory record via `createDelegationTrajectoryAndContract()` at `tool-delegation.ts:384-470`.

**Why this way:** P25.1 SUMMARY confirms: "Trajectory records automatically created when `task` or `delegate-task` tool fires delegation." This uses the `tool.execute.after` hook — the harness observes the delegation and creates the record.

**What we DON'T know:** Whether agents should ALSO be able to create trajectory records manually (e.g., for non-delegation work). Currently the `hivemind-trajectory` tool exists for manual operations.

**If wrong:** If only automatic creation is needed, the manual `hivemind-trajectory` tool may be unnecessary. If both are needed, the tool provides richer data (checkpoints, events, evidence refs) while hooks provide baseline lifecycle tracking.

**Confidence:** Confident — P25.1 implementation proves the automatic pattern works.

### A3: Trajectory↔session-tracker integration is via dynamic import, not direct dependency

**What we assume:** `tool-delegation.ts` uses `await import("../../task-management/trajectory/index.js")` to avoid circular dependencies. This is a deliberate architectural choice.

**Why this way:** P25.1 SUMMARY: "Dynamic `await import()` for trajectory/contract modules to avoid circular dependency concerns."

**What we DON'T know:** Whether this pattern is sustainable at scale. Dynamic imports add latency and bypass static analysis.

**If wrong:** If circular deps can be resolved differently (e.g., extracting a shared interface), the dynamic import could be replaced with a static import.

**Confidence:** Confident — code at `tool-delegation.ts:397-399` shows the dynamic import pattern.

---

## 2. Contract Assumptions

### B1: Contracts are active governance, not passive records

**What we assume:** Agent-work-contracts enforce boundaries through the lifecycle state machine (`lifecycle.ts:19-25`). Transitions are validated: `created→running→blocked→completed→cancelled`. Invalid transitions throw errors.

**Why this way:** `lifecycle.ts:99-114` implements `transitionContract()` which validates against `ALLOWED_TRANSITIONS` matrix. This is active governance — the contract enforces valid state transitions.

**What we DON'T know:** Whether contracts should ALSO enforce tool restrictions (e.g., "this agent can only call these tools"). Currently `scope.allowedSurfaces` exists but is empty in auto-created contracts.

**If wrong:** If contracts should enforce tool restrictions, the `tool.execute.before` hook would need to check contract state before allowing tool calls. This would be a significant addition.

**Confidence:** Confident — lifecycle state machine is implemented and tested (15 tests).

### B2: Contracts auto-create at delegation time with minimal data

**What we assume:** P25.1 creates contracts with `L4_IMPLEMENTATION_TRACE` as minimum evidence level, empty `allowedSurfaces`, `dependencies`, `nonGoals`, and minimal `compaction` data. The agent is expected to enrich the contract later.

**Why this way:** `tool-delegation.ts:431-459` shows the auto-created contract with placeholder data. P25.1 SUMMARY: "L4_IMPLEMENTATION_TRACE as minimum evidence level for auto-created contracts."

**What we DON'T know:** Whether agents actually enrich contracts after creation. No mechanism forces or encourages this.

**If wrong:** If contracts remain at minimal data, they're essentially delegation metadata — not the rich governance documents the schema was designed for.

**Confidence:** Confident — code shows the minimal creation pattern.

### B3: Contracts are pressure-aware at creation time

**What we assume:** `createAgentWorkContract()` in `operations.ts:22-63` calls `detectRuntimePressure()` and blocks creation if pressure is high. This is the only pressure integration point.

**Why this way:** Code at `operations.ts:23-34` shows the pressure check before contract creation. If pressure blocks, no contract is created and no trajectory evidence is recorded.

**What we DON'T know:** Whether pressure should also affect contract lifecycle transitions (e.g., blocking `startContract()` when pressure is high).

**If wrong:** If pressure should gate lifecycle transitions, `lifecycle.ts` would need to import and call `detectRuntimePressure()`.

**Confidence:** Confident — code shows pressure check at creation only.

---

## 3. Orchestrator Assumptions

### C1: The "orchestrator" is an L0 agent defined in `.opencode/agents/hm-l0-orchestrator.md`

**What we assume:** The orchestrator is a markdown-defined agent with YAML frontmatter specifying permissions, skills, delegation routing, and behavioral contracts. It's NOT plugin logic or hook handlers.

**Why this way:** `.opencode/agents/hm-l0-orchestrator.md` (806 lines) defines the L0 orchestrator with full agent definition including delegation routing, landscape protocol, artifact contract, iron laws, etc.

**What we DON'T know:** Whether the orchestrator should ALSO be implemented as programmatic logic in `src/` (not just agent instructions). The ROADMAP Reflection 2 says: "The L0 orchestrator's coordination logic must use programmatic tools, not agent instruction bloat."

**If wrong:** If the orchestrator is only agent instructions, it relies on the LLM following complex instructions. If it's programmatic, it would be a new module in `src/`.

**Confidence:** Confident — the agent definition exists and is comprehensive.

### C2: The orchestrator CANNOT force agents to call specific tools

**What we assume:** The orchestrator can only instruct agents (via system prompt injection) and observe their behavior (via hooks). It cannot block tool calls or force tool calls.

**Why this way:** Deep architecture research §3: "The harness cannot programmatically control agent behavior." The `tool.execute.before` hook can inspect/modify args but cannot force a different tool to be called.

**What we DON'T know:** Whether the `permission.ask` hook could be used to deny permission for certain actions unless trajectory/contract tools are called first. This would be an indirect enforcement mechanism.

**If wrong:** If permission gating is possible, the orchestrator could require trajectory/contract calls before allowing other tool calls.

**Confidence:** Confident — the hook model is observation-first.

---

## 4. Hook/Event Assumptions

### D1: The `event` hook receives ALL OpenCode runtime events

**What we assume:** The `event` hook in the Plugin return object receives events including `session.created`, `session.idle`, `session.error`, `session.deleted`, `session.updated`, `message.updated`, `message.part.updated`.

**Why this way:** Deep architecture research §1: "PRIMARY EVENT BUS. Receives ALL OpenCode events." Plugin SDK type at `index.d.ts:174-176` shows `event?: (input: { event: Event }) => Promise<void>`.

**What we DON'T know:** The exact shape of the `Event` type — it's imported from `@opencode-ai/sdk` but not fully typed in the plugin SDK. The codebase uses `getNestedValue` and `asString` helpers to extract fields defensively.

**If wrong:** If certain events are not delivered to the `event` hook, session-tracker would miss lifecycle transitions.

**Confidence:** Confident — session-tracker already uses this hook extensively.

### D2: `tool.execute.before` can inspect and modify tool args

**What we assume:** The `tool.execute.before` hook receives `{ tool, sessionID, callID }` as input and `{ args: any }` as output. The output's `args` can be modified before the tool executes.

**Why this way:** Plugin SDK type at `index.d.ts:234-240` shows the hook signature. Hivemind uses this for circuit breaker and budget guard.

**What we DON'T know:** Whether modifying `args` in `tool.execute.before` actually changes what the tool receives. The SDK documentation doesn't explicitly confirm this.

**If wrong:** If args modification doesn't propagate, the guard pattern would only work for blocking (by throwing), not for modifying.

**Confidence:** Likely — the pattern is used in production but not explicitly documented.

### D3: `experimental.chat.system.transform` injects into the system prompt

**What we assume:** This hook receives `{ sessionID?, model }` as input and `{ system: string[] }` as output. The output's `system` array is appended to the system prompt.

**Why this way:** Plugin SDK type at `index.d.ts:264-269`. Hivemind uses this for behavioral profile injection.

**What we DON'T know:** Whether the injected strings are APPENDED to the system prompt or REPLACE it. The hook name says "transform" which could mean either.

**If wrong:** If injected strings replace the system prompt, the behavioral profile injection would break the agent's base instructions.

**Confidence:** Likely — the name "transform" suggests modification, not replacement.

### D4: We CANNOT create custom hooks

**What we assume:** The Plugin SDK only supports the hooks defined in the `Hooks` interface. We cannot register custom hook points.

**Why this way:** The `Hooks` interface at `index.d.ts:173-316` is a fixed set of properties. There's no `registerHook()` or `addHook()` method.

**What we DON'T know:** Whether the SDK has extension points not visible in the type definitions.

**If wrong:** If custom hooks are possible, we could create trajectory/contract-specific hook points.

**Confidence:** Confident — the SDK interface is fixed.

---

## 5. Agent Hierarchy Assumptions

### E1: There are 76 agent definitions in `.opencode/agents/`

**What we assume:** The directory listing shows 76 `.md` files in `.opencode/agents/`.

**Why this way:** Glob of `.opencode/agents/*.md` returns 76 files.

**What we DON'T know:** How many are actually loaded by OpenCode at runtime. Some may be inactive or filtered by config.

**If wrong:** If fewer agents are loaded, the hierarchy may be simpler than assumed.

**Confidence:** Confident — file count verified.

### E2: Agents have 4 hierarchy levels (L0/L1/L2/L3)

**What we assume:** L0 = orchestrator (front-facing strategist), L1 = coordinator (wave dispatch), L2 = domain specialists, L3 = deep specialists/quality gates.

**Why this way:** Deep architecture research §6: "Hierarchy Levels" table shows L0/L1/L2/L3 with specific agent names per level.

**What we DON'T know:** Whether L1 actually exists in practice. The ROADMAP says "Remove L1, restructure L2/L3 by domain" (P24.1). L1 may be removed.

**If wrong:** If L1 is removed, the hierarchy becomes L0→L2/L3 (flat dispatch). This changes coordination patterns.

**Confidence:** Likely — P24.1 is listed as "PENDING" so L1 still exists.

### E3: Agent tool access is controlled by YAML frontmatter `permission` field

**What we assume:** Each agent's `.md` file has a `permission` field in YAML frontmatter that specifies which tools the agent can call (allow/deny/ask).

**Why this way:** `hm-l0-orchestrator.md` shows `permission: { read: deny, edit: deny, task: { "*": ask, hm-l1-*: allow } }` etc.

**What we DON'T know:** Whether OpenCode actually enforces these permissions at runtime, or if they're just documentation.

**If wrong:** If permissions are not enforced, agents could call any tool regardless of their frontmatter.

**Confidence:** Likely — OpenCode's permission system is referenced in the SDK.

---

## 6. Runtime Assumptions

### F1: OpenCode executes agents in child sessions via the `task` tool

**What we assume:** When an agent calls `task(description, subagent_type, prompt)`, OpenCode creates a new child session with the specified agent type and sends the prompt. The parent session continues.

**Why this way:** Deep architecture research §3: "The native `task` tool is OpenCode's built-in subagent dispatch mechanism."

**What we DON'T know:** Whether the child session shares the parent's context window or has its own. The research says it "creates a child session" which implies separate context.

**If wrong:** If context is shared, the child session would have access to parent conversation history.

**Confidence:** Confident — the research confirms child session creation.

### F2: Session state persists in `.hivemind/state/session-continuity.json`

**What we assume:** The continuity store at `src/task-management/continuity/index.ts` persists to `.hivemind/state/session-continuity.json` with atomic writes (temp file + rename).

**Why this way:** Code at `continuity/index.ts:303-325` shows the atomic write pattern. The canonical path is `.hivemind/state/` per Q6.

**What we DON'T know:** Whether this file is also read/written by OpenCode itself, or only by the Hivemind plugin.

**If wrong:** If OpenCode also writes to this file, there could be race conditions.

**Confidence:** Confident — the code shows the full read/write cycle.

### F3: Delegation lifecycle is tracked by `DelegationManager` → `DelegationCoordinator`

**What we assume:** When `task` or `delegate-task` fires, the `DelegationManager` tracks the delegation through states: `dispatched → running → completed/error/timeout`. The `DelegationCoordinator` handles the actual dispatch and completion detection.

**Why this way:** Deep architecture research §3: "Delegation Lifecycle States" and code at `src/coordination/delegation/`.

**What we DON'T know:** Whether the delegation lifecycle is the SAME as the trajectory lifecycle. Currently they're separate: delegation has 5 states, trajectory has 2 (active/closed).

**If wrong:** If they should be unified, the trajectory would need more states to match delegation.

**Confidence:** Confident — both systems exist and are separate.

### F4: The CQRS boundary is: hooks = read-side, tools = write-side

**What we assume:** Hooks (`event`, `tool.execute.before/after`, `chat.message`) are observation-only (read-side). Tools (`hivemind-trajectory`, `hivemind-agent-work-create`) are mutation (write-side).

**Why this way:** AGENTS.md: "CQRS compliance: hooks must NEVER write files directly (REQ-ST-11)." Session-tracker is described as "Read-side observer (hooks) → SessionTracker → persistence layer."

**What we DON'T know:** Whether the P25.1 integration violates this by having hooks call trajectory/contract write functions. `tool-delegation.ts:397-469` calls `attachTrajectoryEvidence()` and `createAgentWorkContract()` from within a hook handler.

**If wrong:** If CQRS is strictly enforced, the P25.1 approach would be a violation. The trajectory/contract writes should go through a separate write path.

**Confidence:** Unclear — the P25.1 implementation does write from hooks, which may violate the CQRS principle.

---

## 7. Unknowns (Need User Input)

### U1: Should trajectory track phase-level progress or only delegation-level?

**Status:** Currently delegation-scoped only. No phase/workflow tracking.

**Impact:** If phase-level tracking is needed, trajectory needs a new record type or aggregation layer.

**Action needed:** Clarify whether trajectory should answer "How is Phase 25 progressing?" or only "What evidence exists for this delegation?"

### U2: Should contracts enforce tool restrictions?

**Status:** `scope.allowedSurfaces` exists but is empty in auto-created contracts. No enforcement mechanism.

**Impact:** If yes, `tool.execute.before` would need to check contract state. Significant addition.

**Action needed:** Clarify whether contracts are governance documents (for humans) or enforcement mechanisms (for runtime).

### U3: Should pressure gate lifecycle transitions, not just creation?

**Status:** Pressure only gates contract creation (`operations.ts:23-34`). Lifecycle transitions (`lifecycle.ts`) have no pressure check.

**Impact:** If yes, `lifecycle.ts` would need to import `detectRuntimePressure()`.

**Action needed:** Clarify whether pressure should block `startContract()`, `completeContract()`, etc.

### U4: Does the P25.1 hook-based write pattern violate CQRS?

**Status:** `tool-delegation.ts` calls `attachTrajectoryEvidence()` and `createAgentWorkContract()` from within hook handlers. This writes to `.hivemind/state/` from the read-side.

**Impact:** If CQRS is strictly enforced, this needs to be refactored to use a write queue or separate write path.

**Action needed:** Clarify whether the CQRS boundary is a hard rule or a guideline.

### U5: Should agents be able to manually create trajectory records?

**Status:** The `hivemind-trajectory` tool exists for manual operations. P25.1 adds automatic creation. Both can coexist.

**Impact:** If manual creation is unnecessary, the tool could be simplified or removed.

**Action needed:** Clarify whether the manual tool is still needed given automatic creation.

### U6: What is the relationship between trajectory and the delegation persistence (`delegations.json`)?

**Status:** `src/task-management/continuity/delegation-persistence.ts` manages delegation records. Trajectory tracks evidence. They're separate.

**Impact:** If they should be merged, the state model simplifies. If separate, they need clear boundaries.

**Action needed:** Map the data overlap: what's in trajectory that's also in delegation persistence?

---

## 8. Known Facts (Code-Verified)

| Fact | Evidence | Confidence |
|------|----------|------------|
| Trajectory stores at `.hivemind/state/trajectory-ledger.json` | `ledger.ts:19-22` | Confident |
| Contracts store at `.hivemind/state/agent-work-contracts.json` | `store.ts:16-18` | Confident |
| Trajectory has 2 statuses: `active`, `closed` | `types.ts:9` | Confident |
| Contracts have 5 statuses: `created`, `running`, `blocked`, `completed`, `cancelled` | `lifecycle.ts:19-25` | Confident |
| P25.1 creates trajectories at delegation time via `tool-delegation.ts:384-470` | Code verified | Confident |
| P25.1 creates contracts at delegation time via `tool-delegation.ts:426-469` | Code verified | Confident |
| Dynamic imports used to avoid circular deps | `tool-delegation.ts:397-399` | Confident |
| Pressure gates contract creation only, not lifecycle | `operations.ts:23-34` | Confident |
| `findContractsByTrajectory()` exists for cross-linking | `operations.ts:168-170` | Confident |
| Bounds constants in `bounds.ts`: 1200/1200/2400/20 | `bounds.ts:12-21` | Confident |
| 34 trajectory tests + 20 contract tests exist | `25-SUMMARY.md` | Confident |
| Session-tracker uses `event`, `chat.message`, `tool.execute.before/after` hooks | `plugin.ts:520-612` | Confident |
| OpenCode SDK exposes 15+ hooks | `index.d.ts:173-316` | Confident |
| Tools registered via `tool()` factory with Zod schemas | `tool.d.ts:47-55` | Confident |
| `experimental.chat.system.transform` injects into system prompt | `index.d.ts:264-269` | Confident |
| 76 agent definitions in `.opencode/agents/` | Directory listing | Confident |
| L0 orchestrator defined at `.opencode/agents/hm-l0-orchestrator.md` (806 lines) | File verified | Confident |

---

## 9. Hallucination Risk Areas

### H1: "The orchestrator can force agents to call trajectory tools"

**Risk:** HIGH. The research clearly states the harness can only OBSERVE and INJECT, not CONTROL. The orchestrator (an agent) cannot force other agents to call specific tools.

**Mitigation:** P25.1's automatic creation via hooks is the correct approach — it doesn't rely on agent compliance.

### H2: "Contracts enforce tool restrictions at runtime"

**Risk:** MEDIUM. The schema has `scope.allowedSurfaces` but no enforcement mechanism exists. Auto-created contracts have empty `allowedSurfaces`.

**Mitigation:** Don't assume enforcement exists. If needed, it must be built.

### H3: "Trajectory and delegation lifecycle are unified"

**Risk:** MEDIUM. They're separate systems with different status models. Delegation has 5 states, trajectory has 2.

**Mitigation:** Don't assume unification. If needed, it must be designed.

### H4: "The CQRS boundary is strictly enforced"

**Risk:** MEDIUM. P25.1 writes to trajectory/contracts from hook handlers, which may violate CQRS. The AGENTS.md says "hooks must NEVER write files directly" but the implementation does.

**Mitigation:** Clarify whether this is acceptable or needs refactoring.

### H5: "Agents will enrich auto-created contracts with rich data"

**Risk:** LOW-MEDIUM. Auto-created contracts have minimal data. No mechanism encourages enrichment.

**Mitigation:** If enrichment is needed, system prompt injection should instruct agents to call `hivemind-agent-work-create` with full data.

### H6: "The `event` hook receives all events reliably"

**Risk:** LOW. Session-tracker already depends on this and has 362/364 tests passing.

**Mitigation:** The pattern is proven in production.

---

## Summary

| Category | Confident | Likely | Unclear | Unknown |
|----------|-----------|--------|---------|---------|
| Trajectory (A) | 3 | 0 | 0 | 0 |
| Contracts (B) | 2 | 1 | 0 | 0 |
| Orchestrator (C) | 1 | 1 | 0 | 0 |
| Hooks/Events (D) | 2 | 2 | 0 | 0 |
| Agent Hierarchy (E) | 1 | 2 | 0 | 0 |
| Runtime (F) | 3 | 0 | 1 | 0 |
| Unknowns (U) | — | — | — | 6 |
| Hallucination Risk (H) | — | — | — | 6 |

**Key finding:** The codebase is well-understood (13 Confident, 6 Likely). The main unknowns are design decisions (U1-U6) that need user input, not code gaps. The hallucination risks are manageable with the P25.1 automatic creation pattern.

**Critical insight:** The deep architecture research confirms that P25.1's hook-based automatic creation is the correct approach. The harness cannot force agents to call tools, but it CAN automatically create records when delegations happen via hooks. This is the foundation for trajectory and contract integration.

---

*Analysis date: 2026-05-29*
*Analyzer: gsd-assumptions-analyzer*
*Source: deep-architecture-research-2026-05-29.md + codebase inspection*
