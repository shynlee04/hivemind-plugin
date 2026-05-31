# Phase P44: Tool Intelligence & Capability Layer — Specification

**Phase:** P44
**Status:** LOCKED
**Created:** 2026-05-31
**Updated:** 2026-05-31
**Ambiguity score:** 0.11 (gate: ≤ 0.20)
**Requirements:** 6 locked
**Research:** `.planning/research/tool-intelligence-patterns-research-2026-05-31.md`
**Audit:** `.hivemind/audits/tool-lifecycle-wiring-audit-2026-05-31.md`

---

## Problem Statement

The Hivemind harness registers 25 tools via `src/plugin.ts`, but only 7 are recognized at the delegation boundary (`WRITE_CAPABLE_TOOLS` in `spawn-request-builder.ts`). 30 of 31 `hm-*` agents declare zero tool permissions in frontmatter. 11 tools are orphaned — never referenced by any agent or enforcement point. When an agent's profile is compacted (context pruning), tool intelligence evaporates entirely, causing silent permission escalation or denial at runtime.

The tool-guard-hooks (`src/hooks/guards/tool-guard-hooks.ts`) already call `evaluateGovernance` on `tool.execute.before`, but the governance engine has incomplete data — it cannot make informed allow/deny decisions for 18 of 25 registered tools.

**Impact:** Delegation safety is illusory. The spawner cannot enforce the principle of least privilege because it lacks a capability ledger that survives compaction.

---

## Goal

Introduce a **compaction-safe capability gate** that provides the governance engine and spawner with accurate, real-time tool intelligence at every enforcement point — without requiring external policy engines or runtime dependencies beyond existing harness infrastructure.

---

## Scope

### In Scope
1. **Capability gate module** (`src/features/capability-gate/`) — event-sourced capability ledger
2. **spawn-request-builder enhancement** — JIT tool injection from capability state
3. **tool-guard-hooks integration** — capability-aware governance evaluation
4. **session-tracker extension** — capability mutation event type
5. **Agent frontmatter standardization** — tool declarations for 30 hm-* agents
6. **Orphaned tool assignment** — 11 unassigned tools mapped to agent categories

### Out of Scope
- External policy engine (OPA, Casbin) integration
- Capability revocation UI or dashboard
- Cross-session capability inheritance between independent delegation trees
- Runtime capability negotiation protocol (future: agent requests tool, governor approves)
- `hf-*` agent frontmatter changes (already have proper permissions per audit)
- GSD agent/skill/command changes (developer tooling, not shipped)

---

## Architectural Constraints

| Constraint | Source | Rationale |
|------------|--------|-----------|
| Must fit CQRS model | `ARCHITECTURE.md` 9-surface | Write-side: tool registration hooks; Read-side: capability queries |
| Must not exceed 300 LOC new | Project target ~5000 LOC | Capability gate is a leaf feature, not a framework |
| Must survive compaction | Research finding | Agent profile compaction strips frontmatter; capability must persist outside it |
| Must use existing hooks | `tool-guard-hooks.ts` | No new hook registration — extend existing `tool.execute.before` path |
| Must not add npm dependencies | Package philosophy | Pure TypeScript, zero external deps |
| Must not break existing tests | 3,034 tests passing (3,028 pass, 4 pre-existing failures in delegation-status/session-journal-export) | Regression gate is mandatory |
| `.opencode/` for primitives only | AGENTS.md Q6 | Capability state lives in `.hivemind/`, never `.opencode/` |

---

## Requirements

### REQ-P44-01: Capability Gate Module

**What:** A new feature module that maintains an in-memory capability ledger, seeded from agent frontmatter at bootstrap and updated via hook events at runtime.

**Current:** No capability ledger exists. `spawn-request-builder.ts` hardcodes `WRITE_CAPABLE_TOOLS` (7 tools) and `resolveDelegationPermissionProfile` resolves against only that set.

**Target:** `src/features/capability-gate/index.ts` (~120 LOC) exports `CapabilityGate` class with:
- `resolveToolsForAgent(agentName: string): string[]` — returns effective tool set
- `grantCapability(sessionId: string, agentName: string, toolName: string): void`
- `revokeCapability(sessionId: string, agentName: string, toolName: string): void`
- `getCapabilitySnapshot(): CapabilitySnapshot` — for session-tracker persistence

**Acceptance Criteria:**
- AC-01a: `CapabilityGate` resolves all 25 registered tools (not just 7 built-ins)
- AC-01b: Resolution falls back to category-based defaults when agent has no frontmatter declarations
- AC-01c: In-memory state is re-derivable from frontmatter + event log (survives process restart via session-tracker)
- AC-01d: Module has zero external dependencies
- AC-01e: Module is ≤ 150 LOC

---

### REQ-P44-02: Static Baseline — Agent Frontmatter Declarations

**What:** All 31 `hm-*` agents declare their required tool set in frontmatter `tools:` field. Today only `hm-l0-orchestrator` declares tools.

**Current:** 30/31 `hm-*` agents have empty or missing `tools:` declarations. Audit confirms this in Section 3 (Agent Permission Coverage).

**Target:** Every `hm-*` agent `.md` file has an explicit `tools:` list matching the tools its implementation actually uses (verified against tool-guard-hooks call patterns).

**Acceptance Criteria:**
- AC-02a: All 31 `hm-*` agents have non-empty `tools:` frontmatter field
- AC-02b: No agent declares a tool not registered in `src/plugin.ts`
- AC-02c: Every tool referenced in agent category routing appears in at least one agent's `tools:` list
- AC-02d: Changes are made in `.hivefiver-meta-builder/agents-lab/active/refactoring/` (source of truth), then reflected to `.opencode/agents/`

---

### REQ-P44-03: Orphaned Tool Assignment

**What:** 11 registered tools currently unassigned to any agent category get mapped.

**Current:** Audit Section 2 identifies 11 orphaned tools: `hivemind_sdk_supervisor`, `hivemind_session_view`, `hivemind_trajectory`, `hivemind_pressure`, `hivemind_doc`, `hivemind_command_engine`, `hivemind_agent_work_create`, `hivemind_agent_work_export`, `repomix_*` (3 tools). These are registered in `plugin.ts` but never appear in any agent frontmatter or category routing.

**Target:** Each orphaned tool is assigned to one or more agent categories with documented rationale.

**Acceptance Criteria:**
- AC-03a: Zero orphaned tools remain (all 25 registered tools appear in ≥1 agent's tool set)
- AC-03b: Assignment rationale documented in SPEC appendix
- AC-03c: No tool is assigned to an agent that cannot meaningfully use it

---

### REQ-P44-04: JIT Tool Injection at Delegation Boundary

**What:** `spawn-request-builder.ts` resolves effective tool set from `CapabilityGate` instead of hardcoded `WRITE_CAPABLE_TOOLS`.

**Current:** `resolveDelegationPermissionProfile` at line ~67 constructs permission profile from `WRITE_CAPABLE_TOOLS` constant (7 items). It never consults capability state.

**Target:** `resolveDelegationPermissionProfile` calls `capabilityGate.resolveToolsForAgent(agentName)` to build the `allowedTools` set. Falls back to category-based defaults if capability gate returns empty. `WRITE_CAPABLE_TOOLS` constant retained as the ultimate fallback.

**Acceptance Criteria:**
- AC-04a: Delegation to an agent with declared tools produces exactly those tools (no more, no less)
- AC-04b: Delegation to an agent without declared tools produces category-based defaults
- AC-04c: `WRITE_CAPABLE_TOOLS` constant is last-resort fallback, not primary source
- AC-04d: Change is ≤ 80 LOC in `spawn-request-builder.ts`
- AC-04e: All existing delegation tests pass unmodified

---

### REQ-P44-05: Hook-Based Capability Enforcement

**What:** `tool-guard-hooks.ts` consults `CapabilityGate` before allowing tool execution.

**Current:** `tool.execute.before` hook calls `evaluateGovernance()` which checks session circuit breaker and tool budget, but has no concept of per-agent tool allowlists.

**Target:** The `tool.execute.before` handler queries `CapabilityGate.resolveToolsForAgent(currentAgent)` and adds the result to the governance context passed to `evaluateGovernance()`. If the tool is not in the resolved set, governance evaluation returns DENY.

**Acceptance Criteria:**
- AC-05a: Tool execution by an agent not authorized for that tool returns structured denial (not exception)
- AC-05b: Denial message includes agent name, tool name, and reason ("not in capability set")
- AC-05c: Governance evaluation receives capability context as additional input
- AC-05d: Existing governance checks (circuit breaker, tool budget) continue to function
- AC-05e: Hook changes are ≤ 40 LOC

---

### REQ-P44-06: Capability Mutation Event Tracking

**What:** Grant/revoke operations emit events to session-tracker for persistence and audit.

**Current:** `SessionRecord` in `src/features/session-tracker/types.ts` has no capability mutation fields.

**Target:** A new event type `capability_mutation` is added to the session event stream. Fields: `{ agentName, toolName, action: "grant" | "revoke", sessionId, timestamp }`. The `CapabilityGate.grantCapability` and `revokeCapability` methods emit this event.

**Acceptance Criteria:**
- AC-06a: Every grant/revoke produces a session-tracker event
- AC-06b: Events are queryable via existing session-tracker APIs
- AC-06c: On harness restart, capability state is re-seeded from frontmatter + replayed mutation events
- AC-06d: Event type extension is ≤ 30 LOC across types.ts and relevant hooks
- AC-06e: Existing session-tracker tests pass unmodified

---

## Requirement Traceability

| Req ID | Research Section | Audit Section | Source Files | LOC Budget |
|--------|-----------------|---------------|--------------|------------|
| REQ-P44-01 | §4 Event-Sourced Capability Model | §1 Tool Registry | NEW: `src/features/capability-gate/` | ~120 |
| REQ-P44-02 | §3 Frontmatter as Static Baseline | §3 Agent Permission Coverage | `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-*/*.md` | ~30 files |
| REQ-P44-03 | §3 Orphaned Tool Analysis | §2 Tool Coverage Matrix | Same as REQ-02 + routing config | ~0 (config only) |
| REQ-P44-04 | §5 JIT Injection Pattern | §4 Spawner Enforcement | `src/coordination/spawner/spawn-request-builder.ts` | ~80 |
| REQ-P44-05 | §5 Hook-Based Enforcement | §5 Hook Coverage | `src/hooks/guards/tool-guard-hooks.ts` | ~40 |
| REQ-P44-06 | §4 Mutation Event Tracking | §6 Session Tracker | `src/features/session-tracker/types.ts` + hooks | ~30 |

**Total estimated new LOC:** ~300 (within project target)

---

## Dependency Map

```
REQ-P44-01 (capability gate module)
├── REQ-P44-04 (spawn-request-builder JIT injection) — depends on 01
├── REQ-P44-05 (hook enforcement) — depends on 01
└── REQ-P44-06 (mutation events) — depends on 01
REQ-P44-02 (agent frontmatter) — independent, parallel
REQ-P44-03 (orphaned tools) — depends on 02 completion for full coverage
```

**Execution order:** 01 → {04, 05, 06} in parallel → 02 → 03

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Over-tightening causes false denials | MEDIUM | HIGH | Fallback to category defaults; deny logs but doesn't crash |
| Frontmatter drift after agent edits | HIGH | LOW | Capability gate re-seeds on bootstrap; frontmatter is baseline only |
| Performance impact of per-tool lookups | LOW | MEDIUM | In-memory Map — O(1) resolution, no I/O |
| 30 agent files touched simultaneously | MEDIUM | LOW | Atomic commit per agent; test gate after batch |

---

## Validation Gates

### Gate 1: Unit Tests (per requirement)
- Each AC has a corresponding test case
- All tests run via `npx vitest run tests/`
- Target: ≥ 95% line coverage for `capability-gate/`

### Gate 2: Integration Test
- End-to-end delegation with capability check: spawn agent → verify tool set → attempt unauthorized tool → verify denial
- Test file: `tests/features/capability-gate.integration.test.ts`

### Gate 3: Regression
- All 3,034 existing tests pass (4 pre-existing failures in delegation-status/session-journal-export must not worsen)
- `npm run typecheck` clean
- `npm run build` clean

### Gate 4: Audit Re-Run
- Re-run tool lifecycle wiring audit
- Verify: 0 orphaned tools, 31/31 agents with tool declarations, 25/25 tools at delegation boundary

---

## Appendix: Orphaned Tool Assignment Plan

| Tool | Proposed Agent Category | Rationale |
|------|------------------------|-----------|
| `hivemind_sdk_supervisor` | all hm-* (l0, l1, l2) | SDK health checks are universal |
| `hivemind_session_view` | hm-l0-orchestrator, hm-l1-coordinator | Session visibility for orchestrators |
| `hivemind_trajectory` | hm-l0-orchestrator, hm-verifier | Trajectory tracking for orchestration + verification |
| `hivemind_pressure` | hm-l0-orchestrator | Pressure classification is orchestration concern |
| `hivemind_doc` | hm-doc-writer, hm-verifier, hm-phase-researcher | Document intelligence for doc-oriented agents |
| `hivemind_command_engine` | hm-l0-orchestrator, hm-l1-coordinator | Command discovery/routing for coordinators |
| `hivemind_agent_work_create` | hm-l0-orchestrator, hm-planner | Work contracts for planning agents |
| `hivemind_agent_work_export` | hm-verifier, hm-shipper | Work export for verification/shipping |
| `repomix_*` (3 tools) | hm-codebase-mapper, hm-phase-researcher | Codebase analysis agents |

---

## Downstream Consumers

| Consumer | How They Use This SPEC |
|----------|----------------------|
| `gsd-plan-phase` | Generates PLAN.md with tasks mapped to REQ-P44-* |
| `gsd-execute-phase` | Waves derived from dependency map |
| `gate-l3-spec-compliance` | Bidirectional traceability REQ ↔ code |
| `gate-l3-evidence-truth` | AC verification at phase gate |
| `hm-code-reviewer` | Checks code against AC acceptance criteria |

---

## Ambiguity Report

**Mode:** `--auto` (non-interactive, agent selects recommended defaults)

| Dimension | Weight | Score (0–1) | Weighted | Notes |
|-----------|--------|-------------|----------|-------|
| Goal Clarity | 0.35 | 0.90 | 0.315 | SPEC has precise measurable goal with quantified problem (25 tools, 7 recognized, 11 orphaned) |
| Boundary Clarity | 0.25 | 0.92 | 0.230 | Explicit in/out of scope with reasoning; 5 out-of-scope items documented |
| Constraint Clarity | 0.20 | 0.85 | 0.170 | 7 architectural constraints with sources; LOC budget per requirement |
| Acceptance Criteria | 0.20 | 0.88 | 0.176 | 28 pass/fail ACs across 6 requirements; all falsifiable |

**Composite clarity:** 0.891
**Ambiguity score:** 0.11 (= 1.0 − 0.891)
**Gate result:** PASS (0.11 ≤ 0.20 threshold)

### Dimension-by-dimension assessment

**Goal Clarity (0.90):** The goal — compaction-safe capability gate — is unambiguous. The problem is quantified (25 tools registered, 7 recognized, 11 orphaned, 30/31 agents without declarations). The target state is measurable (all 25 tools classified, all 31 agents with declarations, capability survives compaction). Minor gap: "compaction" is not formally defined in terms of which compaction mechanism strips frontmatter — the research doc fills this gap.

**Boundary Clarity (0.92):** Six items in scope, six items out of scope with explicit rationale. The boundary between "agent frontmatter standardization" (in scope for hm-*) and "hf-* agent frontmatter changes" (out of scope) is clear. The "no external policy engine" boundary is well-stated. Minor gap: the relationship between `.hivefiver-meta-builder/` (source of truth) and `.opencode/agents/` (deployment copy) could be more explicit in the boundary — AC-02d covers it but the scope section does not.

**Constraint Clarity (0.85):** Seven constraints with authoritative sources (ARCHITECTURE.md, AGENTS.md, existing test count). LOC budgets per requirement sum to ~300. The CQRS alignment is stated but the specific write-side/read-side surface mapping is in RESEARCH.md, not directly in the constraint table. This means a planner must cross-reference RESEARCH to fully understand the CQRS constraint.

**Acceptance Criteria (0.88):** 28 ACs, all falsifiable. Each requirement has 3–5 ACs with measurable outcomes. Strong coverage of the "what" (behavior). Minor gap: some ACs measure LOC budget (AC-01e: ≤150 LOC, AC-04d: ≤80 LOC) which is a planning constraint rather than a behavioral requirement — these are fine as guardrails but should not be confused with functional correctness criteria.

---

## Interview Log

**Mode:** `--auto` — interview skipped (ambiguity 0.11 ≤ 0.20 gate)

| # | Standard Question | Auto-Answered | Rationale |
|---|-------------------|---------------|-----------|
| 1 | Is the goal precise enough for a developer to implement without asking questions? | YES | 6 requirements with 28 ACs; problem is quantified |
| 2 | Are boundaries clear — what is explicitly NOT in this phase? | YES | 6 out-of-scope items with rationale |
| 3 | Are constraints documented with their source authority? | YES | 7 constraints sourced from ARCHITECTURE.md, AGENTS.md |
| 4 | Are acceptance criteria falsifiable (pass/fail, not subjective)? | YES | 28 ACs all measurable; LOC budgets are guardrails |
| 5 | Is the dependency/ordering between requirements clear? | YES | Dependency map with explicit execution order |

**Skipped questions:** None — all dimensions meet their minimum thresholds.

---

## Errata (2026-05-31 update)

| Location | Original | Corrected | Reason |
|----------|----------|-----------|--------|
| REQ-P44-04 traceability | `src/coordination/delegation/spawn-request-builder.ts` | `src/coordination/spawner/spawn-request-builder.ts` | Path verified against codebase |
| Constraint #6 | "2,963 tests passing" | "3,034 tests passing (4 pre-existing failures)" | Current test suite count |
| Gate 3 | "All 2,963 existing tests pass" | "All 3,034 existing tests pass (4 pre-existing failures must not worsen)" | Current test suite count |
| Header | Author/Confidence fields | Phase status/metadata fields | Align with spec template format |
