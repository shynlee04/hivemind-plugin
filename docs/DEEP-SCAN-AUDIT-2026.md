# Deep-Scan Audit: Data Pipelines, Hooks, and Injections (2026)

## Executive Summary
This end-to-end audit reveals a critical architectural schism: **The existence of dual, overlapping orchestrator lineages**. The system is simultaneously governed by a TypeScript-based SDK hook architecture (`src/hooks/*`) and a Shell-script-based plugin architecture (`.opencode/plugins/hiveops-governance/*`). These dual lineages cause severe schema conflicts, non-deterministic hook ordering, and race conditions leading to context pollution.

---

## A) System Map (Depth + Width)

### 1. Entry-Points Inventory
- **CLI Ingress**: `src/cli.ts` (commands: `init`, `scan`, `doctor`, `compact`, `dashboard`). Exclusively handles programmatic invocation and interactive setups.
- **Session Lifecycle Events**: `session.created`, `session.idle`, `session.compacted`, `session.diff`.
- **File System Events**: `file.edited`, `file.created`.
- **Tool Triggers**: `tool.execute.before`, `tool.execute.after`.
- **LLM/Chat Triggers**: `experimental.chat.messages.transform`, `experimental.chat.system.transform`, `experimental.session.compacting`.

### 2. Lifecycle + Flow Diagrams (Normal Flow)
```text
Ingress (User Msg) → [experimental.chat.messages.transform]
   ├─ Plugin Hook (gx-context-retrieve.sh) -> Reads state
   └─ TS Hook (messages-transform.ts) -> Prepends synthetic anchors, parses intent
→ Routing & Context Assembly
   ├─ session-lifecycle.ts -> System prompt injection (<hivemind> tags)
   └─ soft-governance.ts -> Check drift, check state
→ Tool Execution (tool.execute.before)
   └─ Plugin Hook (gx-enforce.sh) -> Validates delegation & scope
→ Execution
→ Tool Execution (tool.execute.after)
   ├─ TS Hook (soft-governance.ts) -> CQRS queueStateMutation (metrics)
   └─ Plugin Hook (gx-health-compute.sh, gx-auto-purge.sh)
→ Persistence
   └─ TS State-Mutation-Queue flushes to disk -> Triggers `file.edited`
→ File Event Loop (file.edited)
   └─ Plugin Hook (gx-schema-sync.sh) -> Validates written state
```

### 3. Hook/Injection Matrix

| Trigger | TS Implementation (`src/hooks`) | Plugin Implementation (`.opencode/plugins`) | Scope / Conflict |
|---------|--------------------------------|---------------------------------------------|------------------|
| `session.created` | `event-handler.ts` (mkdir, init profile) | `events.ts` (`gx-entry-guard.sh`, `gx-first-turn-refresh.sh`) | **CONFLICT:** Duplicate initializations. |
| `session.idle` | `event-handler.ts` (Drift checks, queue metrics) | `events.ts` (`gx-handoff-purify.sh`, `gx-sot-register.sh`) | **CONFLICT:** Purify runs before TS flushes queue. |
| `tool.execute.before`| `tool-gate.ts` (Gate enforcement) | `delegation.ts` (`gx-enforce.sh`, `gx-trace-check.sh`) | Overlap in scope checking. |
| `tool.execute.after` | `soft-governance.ts` (CQRS mutation, drift, chain break) | `delegation.ts` (`gx-health-compute.sh`, `gx-mid-guard.sh`) | **RACE CONDITION:** Both compute health metrics. |
| `experimental.compacting` | `compaction.ts` | `compaction.ts` (`gx-handoff-purify.sh`, `gx-schema-sync.sh`) | **CONFLICT:** Duplicate compaction routines. |
| `messages.transform` | `messages-transform.ts` (Synthetic parts prepended) | `context-injection.ts` (Reads JSON state directly) | **NOISE RISK:** Double injection of state. |

### 4. Schema/Contract Map
- **Source of Truth Conflict**: The TS implementation uses contract-first interfaces (e.g., `BrainState` in `src/schemas/brain-state.ts`, `GraphTasks`). However, the shell scripts (`gx-*.sh`) implicitly parse and expect certain JSON structures.
- **Drift Points**: 
  - `tasks.json` vs `trajectory.json`: Migrating from legacy task manifests to `graph-nodes.ts` (GraphTasks). The function `mergeLegacyManifestIntoGraphTasks` tries to bridge this, but shell scripts still read legacy JSON.
  - State mutations are queued via `state-mutation-queue.ts` but `gx-schema-sync.sh` intercepts file writes to validate schemas.

### 5. Context Assembly Map (Pollution Risk)
- **Sources**: `brain.json`, `graph/tasks.json`, `.opencode/plugins/hiveops-governance/hooks`.
- **Shaping**: `messages-transform.ts` appends checklists (Pre-Stop Conditional) and prepends Anchor context to the `message.parts` as synthetic text. 
- **Sinks**: Sent to LLM.
- **Pollution**: If `pending_failure_ack` is set, or if an off-track intent is misclassified, synthetic checklist items accumulate at the end of messages, consuming budget and polluting the context window. 

### 6. Orchestrator Lineage Map
- **Lineage A (TypeScript Orchestrator)**: `session-engine.ts`, `state-mutation-queue.ts`. Uses CQRS. Delays file writes. Pure, typed, asynchronous.
- **Lineage B (Shell/Plugin Orchestrator)**: `.opencode/plugins/hiveops-governance`. Synchronous, bash-script heavy. Triggers side effects immediately on file changes.
**Conclusion**: Lineage B reads state files while Lineage A is still queuing mutations, leading to stale reads and deterministic misconfiguration.

---

## B) Risk Register + Edge Cases Coverage

| ID | Issue | Severity | Likelihood | Root Cause | Fix Strategy |
|---|---|---|---|---|---|
| 1 | **Dual Orchestrator Race Condition** | CRITICAL | HIGH | TS CQRS defers writes (`queueStateMutation`), but Plugin bash scripts read JSON files immediately on hook trigger. | Deprecate `.opencode/plugins/hiveops-governance` entirely. Migrate all logic to TS. |
| 2 | **Infinite Loop on `file.edited`** | HIGH | MED | `state-mutation-queue` flushes state -> emits `file.edited` -> triggers `gx-schema-sync.sh` -> modifies file -> emits `file.edited`. | Isolate file watchers. Ensure TS orchestrator holds exclusive lock on state. |
| 3 | **Context Rot via Synthetic Accumulation** | HIGH | HIGH | `messages-transform.ts` appends checklists to message parts. Over many turns, if not pruned, context fills with repeated checklists. | Use metadata flags instead of appending raw strings, or ensure synthetic parts are strictly ephemeral. |
| 4 | **Schema Drift in Bash Scripts** | MED | HIGH | Graph migration (`mergeLegacyManifestIntoGraphTasks`) changes schema, but `gx-todo-sync.sh` expects legacy structure. | Standardize strictly on `graph-nodes.ts` and eliminate shell scripts parsing JSON. |

### Edge Cases
1. **Wall of Text Prompt Injection**: User sends a massive prompt containing "off-track" keywords. `messages-transform.ts` flags it as `detectOffTrackIntent` and routes the whole block to `TODO-Pending`, effectively ignoring the user's valid instructions.
2. **Streaming Partial Outputs**: `tool.execute.after` triggers before all output is captured, causing `scanForKeywords` to miss critical failure markers.
3. **Backward Compatibility**: Existing sessions formatted with flat `tasks.json` crash when `gx-semantic-validate.sh` looks for graph nodes.

---

## C) Refactor Blueprint (Best Practices for 2026 Agent Systems)

### Phase 1: Stop the Bleeding (Hardening)
1. **Disable the Shell Orchestrator**: Immediately disable `.opencode/plugins/hiveops-governance/index.ts`. The TS hooks (`src/hooks/index.ts`) already mirror all critical governance checks safely via CQRS.
2. **Enforce `queueStateMutation` Exclusivity**: Ensure NO hook calls `stateManager.save()` directly. Everything must route through the mutation queue.
3. **Cap Synthetic Appendages**: Limit the `MAX_CHECKLIST_CHARS` and ensure synthetic message parts are transient (not saved to session history if they are just UI reminders).

### Phase 2: Schema & Boundary Unification
1. **Contract-First Schemas**: Solidify `src/schemas/` as the single source of truth (Zod/Typebox validation).
2. **Directory Restructure**:
   - `src/hooks/`: Strict event interceptors (Read-only, queues mutations).
   - `src/lib/`: Core orchestrator logic, pure functions.
   - `src/tools/`: Actionable capabilities.
   - `src/plugins/`: TS-based plugins (Move away from `.opencode/plugins/` bash scripts).

### Phase 3: Deterministic Workflow Routing
1. **State Machine Enforcement**: Implement an explicit Finite State Machine (FSM) for session lifecycle (`BOOTSTRAP` -> `PLAN` -> `ACT` -> `COMPACT`).
2. **Safe Tool Execution**: Sandbox tool outputs. If a tool fails, increment the `consecutive_failures` counter in the state, but do not let it pollute the LLM context with raw stack traces unless specifically queried via `hivemind_inspect`.
3. **Observability**: Implement structured JSON logging via `src/lib/logging.js` with correlation IDs matching the `sessionID` for traceability across the graph nodes.

### Migration Strategy
- Step 1: Redirect `event.type` listeners in `plugins/` to no-op.
- Step 2: Validate `GraphTasks` migration handles all legacy `tasks.json` edge cases.
- Step 3: Delete `.opencode/plugins/hiveops-governance` scripts.
- Step 4: Run comprehensive test suite (`scripts/validate-framework.sh`) to ensure TS hooks successfully trap all edge cases.
