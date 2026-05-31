# Phase P44: Tool Intelligence Capability Layer — Specification

**Created:** 2026-05-31
**Ambiguity score:** 0.14
**Requirements:** 7 locked

## Goal

The harness resolves agent tool capabilities from static frontmatter declarations AND runtime context (delegation depth, session phase, governance rules), making all 25 harness tools visible at the delegation boundary and enforcing capability-grant/revoke through the existing hooks middleware — so that every delegated child session receives exactly the tools its agent is authorized to use, no more and no less.

## Background

### Current state (verified by audit)

The harness registers 25 tools via 4 domain functions in `plugin.ts:128-198`. All 25 are available to the root session through OpenCode's `tool` object. However:

1. **Spawner blind spot:** `spawn-request-builder.ts:29` defines `WRITE_CAPABLE_TOOLS` as only 7 OpenCode built-in tools (`read`, `edit`, `write`, `bash`, `glob`, `grep`, `execute-slash-command`). The 24 harness-specific tools (`delegate-task`, `hivemind-doc`, `configure-primitive`, etc.) are invisible at the delegation boundary. Source: audit Section 4.2.

2. **Agent frontmatter gap:** 30 of 31 `hm-*` agents have ZERO `permission:` declarations in their frontmatter. Only `hm-l0-orchestrator` has explicit permissions. All 11 `hf-*` agents have proper permissions. Source: audit Section 5.

3. **No runtime grant/revoke:** The `tool-guard-hooks.ts` (`tool.execute.before`) enforces circuit breakers, tool budgets, and governance blocks — but cannot conditionally GRANT tools based on session state. It can only block or allow what the spawner already injected. Source: `tool-guard-hooks.ts:73-183`.

4. **Orphaned tools:** 11 of 25 registered tools are never referenced in any agent `.md` file (audit Section 5.3). These include `prompt-skim`, `prompt-analyze`, `bootstrap-init`, `bootstrap-recover`, `validate-restart`, `configure-primitive`, `session-journal-export`, `session-context`, `session-delegation-query`, `hivemind-agent-work-create`, `hivemind-agent-work-export`.

5. **Compaction fragility:** Agent context is subject to LLM compaction. If tool intelligence lives only in the agent's loaded prompt context, compaction prunes it, leaving delegated sessions with degraded tool access. Source: research artifact Section 5 (Pitfall 3).

### Why this matters now

Phase 39.8 introduced `execute-slash-command` in child sessions. As delegation depth increases (L0→L1→L2→L3), the gap between "tools the agent knows about" and "tools the spawner injects" widens. Without a capability layer, every new tool added to the harness must be manually wired into `WRITE_CAPABLE_TOOLS` and every agent that needs it must have its frontmatter updated — a scaling failure.

## Requirements

1. **Capability type system**: A shared type system defines capability sets, policy rules, and mutation events that all capability-aware modules consume.
   - Current: No capability types exist — `spawn-request-builder.ts` uses ad-hoc string arrays (`WRITE_CAPABLE_TOOLS`, review/read-only tool lists)
   - Target: `src/shared/capability-types.ts` exports `CapabilitySet`, `CapabilityPolicyRule`, `CapabilityMutationEvent`, and `ResolvedCapabilityProfile` types; consumed by `spawn-request-builder.ts`, `tool-guard-hooks.ts`, and agent-primitive-policy
   - Acceptance: Typecheck passes; `CapabilitySet` type is importable from `src/shared/capability-types.ts`; `ResolvedCapabilityProfile` includes `tools: readonly string[]`, `mode: DelegationPermissionProfile["mode"]`, `source: "frontmatter" | "runtime" | "default"`

2. **Spawner capability resolution**: The spawner resolves the full set of tools an agent may access by merging frontmatter declarations with harness tool registry, instead of using a hardcoded 7-tool list.
   - Current: `spawn-request-builder.ts:29` has `WRITE_CAPABLE_TOOLS` = 7 built-in strings; `resolveDelegationPermissionProfile()` never consults the harness tool registry; 24 harness tools are invisible
   - Target: `resolveDelegationPermissionProfile()` accepts a `harnessTools: readonly string[]` parameter and merges frontmatter-declared tools with available harness tools; `WRITE_CAPABLE_TOOLS` becomes `DEFAULT_WRITE_TOOLS` (fallback only, not the ceiling)
   - Acceptance: Test case: agent with `permission: { "delegate-task": "allow" }` receives `delegate-task` in its resolved tool list (currently impossible); all 25 registered tool names are resolvable when included in agent frontmatter

3. **Capability-gate hook middleware**: A new hook module evaluates capability policies at `tool.execute.before` time, granting or revoking tool access based on runtime session state.
   - Current: `tool-guard-hooks.ts` enforces budget/circuit-breaker/governance but has no concept of capability grant/revoke; it can only block what the spawner already denied
   - Target: `src/hooks/guards/capability-gate.ts` exports `createCapabilityGateHooks()` that produces `tool.execute.before` middleware; evaluates `CapabilityPolicyRule[]` against session context (delegation depth, lifecycle phase, parent trajectory); can throw `[Harness] Tool not granted for this session` to revoke mid-session
   - Acceptance: Test case: a policy rule `{ tool: "delegate-task", maxDepth: 1, grant: false }` causes a depth-2 delegation to be blocked when calling `delegate-task`; test case: no policy rules → all spawner-injected tools pass through (zero overhead for unpolicy'd agents)

4. **Agent frontmatter capability baseline**: All 31 `hm-*` agents declare their required tools in frontmatter `permission:` blocks, establishing the static capability baseline.
   - Current: 30/31 `hm-*` agents have no `permission:` declarations; spawner falls back to read-only for all of them
   - Target: Each `hm-*` agent `.md` has a `permission:` block listing at minimum the tools it uses; agents that need write access (e.g., `hm-l2-executor`, `hm-l2-code-fixer`) declare write-capable tools; read-only agents (e.g., `hm-l2-auditor`, `hm-l2-verifier`) declare read tools only
   - Acceptance: `grep -c "^permission:" .opencode/agents/hm-*.md` returns ≥ 31 (one per agent); no `hm-*` agent falls back to the read-only default when it needs write tools

5. **Capability mutation events**: Every capability grant or revocation is recorded as a `CapabilityMutationEvent` in the session tracker, enabling audit and recovery.
   - Current: Session tracker records tool call counts but not capability changes; no event type for "tool X was granted" or "tool Y was revoked"
   - Target: `tool.execute.before` capability gate emits `CapabilityMutationEvent { type: "grant" | "revoke", tool, sessionID, reason, timestamp }` to the session tracker; events are queryable via `session-tracker` tool
   - Acceptance: After a capability-gate revocation, querying session tracker for the session returns a mutation event with `type: "revoke"`, the tool name, and a reason string

6. **Compaction-safe capability persistence**: The resolved capability set for a session is persisted in the continuity store so that agent context compaction does not lose tool intelligence.
   - Current: Continuity store has `toolProfile` field but it is populated from delegation metadata only at creation time; it is not refreshed when capabilities change mid-session
   - Target: `resolvedCapabilities` field added to continuity `toolProfile`; updated on every capability mutation event; on session recovery, `resolvedCapabilities` is re-read from continuity store rather than re-resolved from scratch (which would lose runtime grants/revokes)
   - Acceptance: Test: session created → capability granted → context compaction simulated (continuity re-read) → granted tool is still in `resolvedCapabilities` without re-resolution

7. **Harness tool registry**: A canonical list of all harness-registered tools is available at runtime, replacing the need to hardcode tool names in the spawner.
   - Current: No registry exists — `plugin.ts` registers 25 tools via spread but does not export their names; spawner cannot discover what tools exist
   - Target: `plugin.ts` (or a dedicated `src/shared/harness-tools.ts`) exports `HARNESS_TOOL_NAMES: readonly string[]` containing all 25 registered tool names; spawner and capability gate consume this list
   - Acceptance: `HARNESS_TOOL_NAMES.length === 25`; every tool name in `HARNESS_TOOL_NAMES` matches a tool registered in `plugin.ts`; adding a new tool to `plugin.ts` registration requires updating `HARNESS_TOOL_NAMES` (type-level enforcement or test-level enforcement)

## Boundaries

**In scope:**
- Capability type system (`capability-types.ts`) — shared types for all capability modules
- Spawner capability resolution extension (`spawn-request-builder.ts`) — merge frontmatter + harness tools
- Capability-gate hook middleware (`capability-gate.ts`) — runtime grant/revoke evaluation
- Agent frontmatter updates — add `permission:` blocks to all 31 `hm-*` agents
- Capability mutation events — extend session tracker event schema
- Compaction-safe persistence — extend continuity `toolProfile` with `resolvedCapabilities`
- Harness tool registry — export canonical list from `plugin.ts` or new module
- Unit tests for all new modules
- Integration test: full delegation chain with capability enforcement

**Out of scope:**
- **Policy engine / Cedar / OPA integration** — future enhancement; this phase uses simple rule evaluation in TypeScript. Reason: YAGNI; the capability-gate hook is the extension point for future engines.
- **Chain validation (R6 from research)** — validating multi-step tool chains before execution. Reason: requires tool-call DAG modeling; deferred to a future phase.
- **Hot-reload of policy rules (R8 from research)** — dynamic policy update without harness restart. Reason: config recompile already provides this indirectly; not needed for MVP.
- **Governance rule migration** — existing `hivemindConfig.governance.rules` in `tool-guard-hooks.ts` stays as-is; capability gate is additive, not a replacement. Reason: backward compatibility; governance rules and capability policies serve different purposes.
- **`hf-*` agent frontmatter changes** — all 11 `hf-*` agents already have proper permissions. Reason: no gap to close.
- **Sidecar/dashboard UI** — capability visualization in the Q2 sidecar. Reason: sidecar is a separate deliverable (Q2).

## Constraints

- **New code footprint:** ≤ 400 LOC across all new files (target ~300). The research artifact estimates ~200-300 LOC for core logic. Agent frontmatter updates are non-code (YAML headers).
- **No external dependencies:** Capability evaluation is pure TypeScript — no Cedar, OPA, or external policy engine. Reason: the harness npm package must remain zero-runtime-dependency.
- **Backward compatibility:** Existing tests in `tests/lib/spawner/spawn-request-builder.test.ts` must continue to pass without modification to their assertions. The new `harnessTools` parameter in `resolveDelegationPermissionProfile()` is optional with a default that preserves current behavior.
- **Hook ordering:** The capability-gate hook runs AFTER the existing tool-guard hooks (budget/circuit-breaker/governance) — it is additive, not a replacement. Both hooks are registered in `plugin.ts` and execute in registration order.
- **Agent frontmatter convention:** `permission:` blocks use the existing OpenCode convention: `{ toolName: "allow" | "ask" | false }`. No new permission syntax is introduced.
- **CQRS compliance:** Capability mutation events are write-side (hooks produce them); capability queries are read-side (spawner/continuity reads them). No hook directly reads capability state from `.hivemind/` — it reads from the in-memory `TaskStateManager`.

## Acceptance Criteria

- [ ] `src/shared/capability-types.ts` exists and exports `CapabilitySet`, `CapabilityPolicyRule`, `CapabilityMutationEvent`, `ResolvedCapabilityProfile` types
- [ ] `HARNESS_TOOL_NAMES` exported with exactly 25 tool names matching `plugin.ts` registration
- [ ] `resolveDelegationPermissionProfile()` accepts optional `harnessTools` parameter; when agent frontmatter includes `"delegate-task": "allow"`, the resolved profile contains `"delegate-task"`
- [ ] `capability-gate.ts` hook blocks a tool call when a policy rule denies it for the current session depth
- [ ] `capability-gate.ts` hook passes through all tools when no policy rules are configured (zero overhead)
- [ ] All 31 `hm-*` agents have `permission:` blocks in their frontmatter (grep verification)
- [ ] Capability mutation events appear in session tracker output after grant/revoke
- [ ] `resolvedCapabilities` persists in continuity store and survives a simulated re-read
- [ ] All existing tests in `tests/lib/spawner/spawn-request-builder.test.ts` pass without modification
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (all 2,900+ tests green)
- [ ] New module LOC ≤ 400 (excluding agent frontmatter and tests)

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                              |
|--------------------|-------|------|--------|----------------------------------------------------|
| Goal Clarity       | 0.90  | 0.75 | ✓      | Specific: 25 tools visible, frontmatter-enforced   |
| Boundary Clarity   | 0.92  | 0.70 | ✓      | 6 explicit out-of-scope items with reasons          |
| Constraint Clarity | 0.82  | 0.65 | ✓      | LOC budget, CQRS compliance, backward compat        |
| Acceptance Criteria| 0.88  | 0.70 | ✓      | 12 pass/fail checkboxes, all falsifiable            |
| **Ambiguity**      | 0.14  | ≤0.20| ✓      |                                                    |

## Interview Log

| Round | Perspective     | Question summary                                    | Decision locked                                                       |
|-------|-----------------|-----------------------------------------------------|-----------------------------------------------------------------------|
| 1     | Researcher      | What tool intelligence exists today?                | 25 registered, 7 visible to spawner, 30/31 hm-* agents have no perms |
| 2     | Simplifier      | Minimum viable capability layer?                    | Types + spawner fix + gate hook + frontmatter = MVP (R1,R2,R3,R5)    |
| 3     | Boundary Keeper | What's NOT this phase?                              | Policy engine, chain validation, hot-reload, sidecar UI excluded      |
| 4     | Failure Analyst | What breaks on compaction?                          | Tool intelligence lost → persist in continuity store (R9 partial)     |
| auto  | Auto-selected   | Architecture choice?                                | Event-Sourced Capability Ledger (research recommendation, confidence HIGH) |
| auto  | Auto-selected   | Policy rule format?                                 | TypeScript rules in `CapabilityPolicyRule` type — no external engine  |
| auto  | Auto-selected   | Which agents get frontmatter updates?               | 31 hm-* only (hf-* already complete)                                 |

---

*Phase: P44-tool-intelligence-capability-layer*
*Spec created: 2026-05-31*
*Next step: /gsd-discuss-phase P44 — implementation decisions (file layout, hook registration order, policy rule schema, agent frontmatter content)*
