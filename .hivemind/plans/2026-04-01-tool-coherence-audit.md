# ADR: Tool Coherence Audit — 12 Tools vs Hierarchy, Relationships, Context-Engineering, Mid-Run Usability

**Date:** 2026-04-01
**Status:** accepted
**Auditor:** architect (design authority)
**Evidence sources:** 4 parallel hivexplorer investigations across 60+ source files

---

## Executive Summary

**5 of 12 tools FAIL on hierarchy coherence. 3 of 12 tools FAIL on context-engineering. All write-side tools lack concurrent safety. No tool validates agent role. Tool results are NOT injected back into agent context — a systemic architectural gap.**

The tools work individually but the connecting tissue — ID typing, role enforcement, context injection, atomic writes — is missing or advisory only. Agents can call any tool from any role at any time, and tool results vanish after compaction.

---

## Per-Tool Verdict Matrix

### Tool 1: `hivemind_runtime_status`

| Dimension | Verdict | Notes |
|-----------|---------|-------|
| **hierarchy_coherence** | PASS | Read-only. No mutation surface. Cannot bypass hierarchy. |
| **relationship_coherence** | PASS | Uses `renderToolResult`. Read-only so no state conflict. |
| **context_coherence** | WARN | Result NOT injected into next-turn context. Survives compaction as metadata only. |
| **mid_run_usability** | ALWAYS | Callable at any lifecycle phase. No prerequisites. |

**Issues:** None critical. Context injection gap is systemic (see cross-cutting findings).

---

### Tool 2: `hivemind_runtime_command`

| Dimension | Verdict | Notes |
|-----------|---------|-------|
| **hierarchy_coherence** | PASS | Routes to slash command bundles. Partial GATE check for `hm-init`. |
| **relationship_coherence** | PASS | Dispatch routing. Uses IDs from context correctly. |
| **context_coherence** | WARN | Same systemic gap — results not preserved through compaction. |
| **mid_run_usability** | ALWAYS | Routing layer. Actual phase limits inherited from routed commands. |

**Issues:** GATE enforcement for hm-init checks `runtimeAuthority` but not full profile completion. Command bundles have `agent` field but no enforcement.

---

### Tool 3: `hivemind_doc`

| Dimension | Verdict | Notes |
|-----------|---------|-------|
| **hierarchy_coherence** | WARN | No role check, but read-only so bypass risk is LOW. |
| **relationship_coherence** | PASS | Read-only. Uses `ToolResponse` and `renderToolResult`. |
| **context_coherence** | **FAIL** | **Unbounded search results** — no pagination, no max_tokens. Can return 300KB+. |
| **mid_run_usability** | ALWAYS | Callable at any phase. No prerequisites. |

**Issues:**
- `src/intelligence/doc/read-ops.ts:108-151` — `searchDocuments` returns ALL matches with no limit
- **Bloat risk: HIGH.** Single search can consume the context window.
- **Fix:** Add `maxResults` parameter (default 50). Add pagination with `start_cursor`.

---

### Tool 4: `hivemind_task`

| Dimension | Verdict | Notes |
|-----------|---------|-------|
| **hierarchy_coherence** | **FAIL** | No agent role validation. Any agent can mutate any workflow's tasks. |
| **relationship_coherence** | WARN | Tasks link to `workflowId` but NOT to `contractId`. Dual writes without locking. |
| **context_coherence** | WARN | Result NOT injected. Survives compaction as task IDs only (not state). |
| **mid_run_usability** | PHASE-LIMITED | `list`/`get` work anytime. Mutations require `workflowId`. |

**Issues:**
- `src/tools/task/tools.ts:26-40` — receives `context.agent` but never validates it
- `src/core/workflow-management/task-lifecycle.ts:127-128` — synchronous `writeFileSync` with no locking
- `src/features/workflow/task.ts:96-102` — auto-bootstraps workflow if unhealthy, masking errors
- Task status schema duplicated between `agent-work-contract/schema/contract.ts:47` and `task-lifecycle.ts:8` with INCOMPATIBLE values
- **Fix:** Add role validation. Add file locking. Link tasks to contracts. Unify status schema.

---

### Tool 5: `hivemind_trajectory`

| Dimension | Verdict | Notes |
|-----------|---------|-------|
| **hierarchy_coherence** | **FAIL** | No agent role validation. Any agent can attach to any trajectory. |
| **relationship_coherence** | PASS | attach→checkpoint→event→close chains correctly. Ledger auto-resolves active trajectory. |
| **context_coherence** | WARN | `traverse` can return full state tree. Survives compaction as trajectory ID only. |
| **mid_run_usability** | PHASE-LIMITED | `inspect`/`traverse` work anytime. `attach` requires trajectoryId+workflowId. |

**Issues:**
- `src/tools/trajectory/tools.ts:33-47` — no agent validation
- `src/core/trajectory/trajectory-store.ledger.ts:72-79` — async `writeFile` with no locking
- `src/features/trajectory/trajectory.ts:83-86` — attach requires IDs but no ownership check
- **Fix:** Add role validation for lineage (hivefiver vs hiveminder). Add file locking.

---

### Tool 6: `hivemind_handoff`

| Dimension | Verdict | Notes |
|-----------|---------|-------|
| **hierarchy_coherence** | **FAIL** | No validation that sourceAgent is authorized to delegate. |
| **relationship_coherence** | PASS | create→validate→close chains correctly. Handoff ID propagated properly. |
| **context_coherence** | PASS | Structured small payload. Survives compaction via handoff records. |
| **mid_run_usability** | PHASE-LIMITED | `list`/`read` work anytime. `create` requires targetAgent+workflowId+scope+summary. |

**Issues:**
- `src/features/handoff/handoff.ts:210-212` — requires targetAgent but never validates sourceAgent authority
- `src/delegation/delegation-store.ts:124` — direct `writeFile` with no locking
- **Fix:** Validate `context.agent` matches sourceAgent or is orchestrator. Add file locking.

---

### Tool 7: `hivemind_agent_work_create_contract`

| Dimension | Verdict | Notes |
|-----------|---------|-------|
| **hierarchy_coherence** | **FAIL** | Creates contracts without requiring workflowId. Breaks hierarchy graph. |
| **relationship_coherence** | WARN | Contract has no link to workflow tasks. Contract store has locking but task store doesn't. |
| **context_coherence** | PASS | Contract fields survive compaction via `resolveAgentWorkContextFields`. |
| **mid_run_usability** | ALWAYS | No phase check. Only requires `rawIntent`. |

**Issues:**
- `src/features/agent-work-contract/tools/create-contract-tool.ts:96-98` — workflowId NOT required
- `src/features/agent-work-contract/tools/create-contract-tool.operations.ts:70-82` — contract created with empty workflow if not provided
- Contracts without workflow bindings break downstream task/handoff tooling
- **Fix:** Make workflowId required OR validate agent has active workflow before creating contracts.

---

### Tool 8: `hivemind_agent_work_export_contract`

| Dimension | Verdict | Notes |
|-----------|---------|-------|
| **hierarchy_coherence** | WARN | Any agent can export any contract by ID. No ownership validation. |
| **relationship_coherence** | PASS | Read-only export. Uses contractId correctly. |
| **context_coherence** | PASS | Contract fields survive compaction. |
| **mid_run_usability** | ALWAYS | Callable anytime. Requires existing contractId. |

**Issues:**
- `src/features/agent-work-contract/tools/export-contract-tool.ts:40-41` — loads contract by ID with no ownership check
- **Fix:** Validate `context.agent` or `context.sessionID` owns the contract.

---

### Tool 9: `hivemind_journal`

| Dimension | Verdict | Notes |
|-----------|---------|-------|
| **hierarchy_coherence** | WARN | Requires sessionId but no phase validation. Write-only, low bypass risk. |
| **relationship_coherence** | PASS | Uses sessionId consistently. Append-only writes. |
| **context_coherence** | PASS | Write-only journal. Metadata preserved. |
| **mid_run_usability** | ALWAYS | Callable at any phase. Requires valid sessionId. |

**Issues:**
- `src/tools/hivemind-journal.ts:128-131` — `appendFile` not atomic; concurrent writes may interleave
- **Fix:** Implement atomic append pattern (temp + rename).

---

### Tool 10: `hivemind_hm_init`

| Dimension | Verdict | Notes |
|-----------|---------|-------|
| **hierarchy_coherence** | PASS | Bootstrap tool. GATE checked via runtime_command. |
| **relationship_coherence** | PASS | Detection only. No writes (placeholder). |
| **context_coherence** | PASS | Returns proposedChanges only. Small payload. |
| **mid_run_usability** | PHASE-LIMITED | Intended for bootstrap. Redundant after init. |

**Issues:**
- **PLACEHOLDER IMPLEMENTATION** — `src/tools/hivefiver-init/tools.ts:49-70` returns proposed changes but does NOT execute them
- When implemented, must require `context.ask()` authorization for writes

---

### Tool 11: `hivemind_hm_doctor`

| Dimension | Verdict | Notes |
|-----------|---------|-------|
| **hierarchy_coherence** | PASS | Read-only diagnostics. No bypass risk. |
| **relationship_coherence** | PASS | Read-only. Uses `renderToolResult`. |
| **context_coherence** | PASS | Returns findings. Small payload. |
| **mid_run_usability** | ALWAYS | Callable at any phase for diagnostics. |

**Issues:**
- **PLACEHOLDER IMPLEMENTATION** — `src/tools/hivefiver-doctor/tools.ts:35-82` only checks file existence
- When implementing real diagnostics, add severity-based filtering by caller role

---

### Tool 12: `hivemind_hm_setting`

| Dimension | Verdict | Notes |
|-----------|---------|-------|
| **hierarchy_coherence** | WARN | Intake gate is advisory only. Returns proposedChange even when `authorizationRequired: true`. |
| **relationship_coherence** | PASS | Reads config via resolved paths. |
| **context_coherence** | PASS | Returns config data. Small payload. |
| **mid_run_usability** | ALWAYS | Callable at any phase. |

**Issues:**
- `src/tools/hivefiver-setting/tools.ts:109-118` — calls `resolveControlPlaneIntakeGate` but only for dashboard display, not enforcement
- `src/tools/hivefiver-setting/tools.ts:214-217` — returns proposedChange even when authorization required
- **Fix:** When `authorizationRequired: true`, return error instead of proposedChange.

---

## Cross-Cutting Findings

### Finding 1: NO Agent Role Validation Anywhere (CRITICAL)

**12/12 tools** receive `context.agent` but **0/12** validate it.

- `opencode-agent-registry.ts` defines 9 agent IDs
- No tool checks which agent is calling
- Any agent (hivefiver, hiveminder, hiveq, etc.) can call any tool
- **This violates the constitution's delegation hierarchy principle**

**Evidence:** Every tool's `execute` function at:
- `src/tools/task/tools.ts:27-29`
- `src/tools/trajectory/tools.ts:33-36`
- `src/tools/handoff/tools.ts:37-41`
- `src/tools/runtime/tools.ts:26-29, 74-77`

---

### Finding 2: Tool Results NOT Injected Into Agent Context (CRITICAL)

The `tool.execute.after` hook writes tool results to session journal markdown files but does NOT inject them back into the agent's context for subsequent turns.

**Impact:**
- Tool outputs are ephemeral — visible in response but lost after compaction
- Agents must re-query state through tools rather than having results in working context
- Compaction preserves only IDs and metadata, not tool outputs

**Evidence:**
- `src/hooks/tool-execution-handler.ts:31-84` — writes to journal, no context return
- `src/plugin/messages-transform-adapter.ts:126-139` — injects metadata packets only, not tool results
- `src/plugin/compaction-adapter.ts:43-44` — injects context packet (IDs only), not tool outputs

---

### Finding 3: All IDs Are Plain `string` — No Branded Types (HIGH)

All IDs (`workflowId`, `taskId`, `trajectoryId`, `contractId`, `sessionId`) are typed as `string`. TypeScript cannot prevent passing a trajectoryId where a workflowId is expected.

**Evidence:**
- `src/core/workflow-management/workflow-types.ts:2` — `id: string`
- `src/core/trajectory/trajectory-types.ts:23` — `id: string`
- `src/tools/task/types.ts:15-16` — `workflowId?: string`, `taskId?: string`

---

### Finding 4: No Concurrent Write Protection (HIGH)

**Only the contract store** (`src/features/agent-work-contract/engine/contract-store.ts`) uses `proper-lockfile`. All other write-side stores use bare `writeFile`:

| Store | File | Locking |
|-------|------|---------|
| Workflow tasks | `src/core/workflow-management/task-lifecycle.ts:127` | NONE |
| Trajectory ledger | `src/core/trajectory/trajectory-store.ledger.ts:72` | NONE |
| Delegation handoffs | `src/delegation/delegation-store.ts:124` | NONE |
| Session journal | `src/tools/hivemind-journal.ts:128` | NONE |
| Event tracker | `src/features/event-tracker/consolidated-writer.ts:95-99` | Atomic (temp+rename) |
| Contract store | `src/features/agent-work-contract/engine/contract-store.ts` | `proper-lockfile` |

---

### Finding 5: Schema Kernel Has Incompatible Duplicates (MEDIUM)

| Concept | Location A | Location B | Conflict |
|---------|-----------|-----------|----------|
| Task status | `contract.ts:47` — `pending/active/delegated/verifying/complete` | `task-lifecycle.ts:8` — `pending/in_progress/blocked/invalidated/verifying/complete` | **INCOMPATIBLE** |
| Purpose class | `trajectory-types.ts:25` — 8 values | `contract.ts:17` — `quick-action/research-brainstorm/project-driven` | **INCOMPATIBLE** |

---

### Finding 6: AGENTS.md Documents 7 Tools, Codebase Has 12 (MEDIUM)

The constitution (`AGENTS.md`) lists 7 custom tools. The actual `agentToolCatalog` in `src/tools/index.ts` registers 12. Missing from docs:
- `hivemind_agent_work_create_contract`
- `hivemind_agent_work_export_contract`
- `hivemind_journal`
- `hivemind_hm_init`
- `hivemind_hm_doctor`

---

### Finding 7: Contract-Task-Workflow Chain Has A Broken Link (HIGH)

Contracts can be created without `workflowId`. Tasks have no `contractId` field. The three concepts are meant to form a chain but:

```
create_contract → [NO contractId field in task] → create_task → complete_task
```

The chain from contract to task is broken. Agents cannot trace tasks back to their originating contract.

---

## Summary Verdict Table

| Tool | hierarchy | relationship | context | mid_run | Overall |
|------|-----------|-------------|---------|---------|---------|
| `hivemind_runtime_status` | PASS | PASS | WARN | ALWAYS | **GOOD** |
| `hivemind_runtime_command` | PASS | PASS | WARN | ALWAYS | **GOOD** |
| `hivemind_doc` | WARN | PASS | **FAIL** | ALWAYS | **BLOATED** |
| `hivemind_task` | **FAIL** | WARN | WARN | PHASE-LIMITED | **BROKEN** |
| `hivemind_trajectory` | **FAIL** | PASS | WARN | PHASE-LIMITED | **FRAGILE** |
| `hivemind_handoff` | **FAIL** | PASS | PASS | PHASE-LIMITED | **FRAGILE** |
| `hivemind_agent_work_create_contract` | **FAIL** | WARN | PASS | ALWAYS | **BROKEN** |
| `hivemind_agent_work_export_contract` | WARN | PASS | PASS | ALWAYS | **ADEQUATE** |
| `hivemind_journal` | WARN | PASS | PASS | ALWAYS | **ADEQUATE** |
| `hivemind_hm_init` | PASS | PASS | PASS | PHASE-LIMITED | **PLACEHOLDER** |
| `hivemind_hm_doctor` | PASS | PASS | PASS | ALWAYS | **PLACEHOLDER** |
| `hivemind_hm_setting` | WARN | PASS | PASS | ALWAYS | **ADEQUATE** |

---

## Recommended Fix Priority

### P0 — Must Fix Before Next Release

1. **Add `maxResults` pagination to `hivemind_doc` search** — prevents context window exhaustion
2. **Add file locking to workflow task store** — prevents state corruption from concurrent agents
3. **Make `workflowId` required in `create_contract`** — prevents orphaned contracts

### P1 — Fix Before Multi-Agent Delegation

4. **Add agent role validation to task, trajectory, handoff tools** — enforces delegation hierarchy
5. **Add file locking to trajectory ledger and delegation store** — prevents concurrent write corruption
6. **Unify task status schema** — eliminate incompatible duplicates

### P2 — Fix For Production Robustness

7. **Add branded types for all IDs** — prevents TypeScript-level ID confusion
8. **Add `contractId` field to task records** — completes the contract-task-workflow chain
9. **Standardize `ToolResponse` wrapper** — ensure all 12 tools use it consistently
10. **Update AGENTS.md tool count** — sync documentation with code

### P3 — Architectural Improvement

11. **Design tool result injection pipeline** — make tool outputs survive across turns
12. **Add compaction survival for tool state** — agents should recover state without re-querying
13. **Implement session resumability** — change `resumable: false` to `true` with replay

---

## Decision

**Status: ACCEPTED** — These findings represent the current state. The P0 items must be addressed before the next release. The P1 items must be addressed before multi-agent delegation is enabled.

### Consequences

- **What becomes easier:** After fixes, agents will have consistent tool behavior regardless of calling context
- **What becomes harder:** Adding role validation may require some tools to handle rejection gracefully
- **Risk of not fixing:** Multi-agent sessions will experience state corruption, context bloat, and hierarchy violations

### Alternatives Considered

1. **Full rewrite of tool layer** — too expensive, current tools work individually
2. **Advisory-only role system** — current state, proven insufficient
3. **Middleware layer for all tools** — adds latency but enforces cross-cutting concerns uniformly
