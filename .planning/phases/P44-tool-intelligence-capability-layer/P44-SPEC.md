# Phase P44: Tool Intelligence & Capability Layer — Specification

**Phase:** P44
**Status:** LOCKED (updated)
**Created:** 2026-05-31
**Updated:** 2026-06-01
**Ambiguity score:** 0.10 (gate: ≤ 0.20)
**Requirements:** 6 locked
**Research:** `.planning/research/tool-intelligence-patterns-research-2026-05-31.md`
**Audit:** `.hivemind/audits/tool-lifecycle-wiring-audit-2026-05-31.md`

---

## Problem Statement

The Hivemind harness registers 31 tools via `TOOL_CAPABILITY_MAP` in `src/features/capability-gate/`, but the spawner (`spawn-request-builder.ts`) still only recognizes the 7-item hardcoded `WRITE_CAPABLE_TOOLS` set. 30 of 31 `hm-*` agents declare zero tool permissions in frontmatter. When an agent's profile is compacted (context pruning), tool intelligence evaporates entirely, causing silent permission escalation or denial at runtime.

The tool-guard-hooks (`src/hooks/guards/tool-guard-hooks.ts`) already call `evaluateGovernance` on `tool.execute.before`, but the governance engine has no capability context — it cannot make informed allow/deny decisions based on per-agent tool allowlists.

**Implementation status (2026-06-01):** REQ-P44-01 is ~70% complete — `CapabilityGate` class and `TOOL_CAPABILITY_MAP` exist (139 LOC, 31 tools classified into 6 categories). However, the module is NOT yet wired into `spawn-request-builder.ts`, `tool-guard-hooks.ts`, or `session-tracker`. The remaining 5 requirements are NOT started.

**Impact:** Delegation safety is illusory. The spawner cannot enforce the principle of least privilege because the capability gate is not wired into any enforcement point.

---

## Goal

Wire the existing **CapabilityGate** module into the spawner, tool guard hooks, and session-tracker — completing the capability enforcement pipeline from classification to runtime denial. Standardize all 31 `hm-*` agent frontmatter with explicit `tools:` declarations.

---

## Scope

### In Scope
1. **Capability gate module completion** (`src/features/capability-gate/`) — fix failing test, add bootstrap seeding
2. **spawn-request-builder enhancement** — JIT tool injection from CapabilityGate
3. **tool-guard-hooks integration** — capability-aware governance evaluation
4. **session-tracker extension** — capability mutation event type
5. **Agent frontmatter standardization** — tool declarations for 30 hm-* agents
6. **Orphaned tool assignment** — verify all 31 tools in TOOL_CAPABILITY_MAP are covered

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
| Must not exceed 300 LOC new (remaining ~160 LOC) | Project target ~5000 LOC | 139 LOC already in capability-gate; ~160 LOC remaining for wiring |
| Must survive compaction | Research finding | Agent profile compaction strips frontmatter; capability must persist outside it |
| Must use existing hooks | `tool-guard-hooks.ts` | No new hook registration — extend existing `tool.execute.before` path |
| Must not add npm dependencies | Package philosophy | Pure TypeScript, zero external deps |
| Must not break existing tests | 3,032 tests passing (1 failing test file in capability-map.test.ts to fix) | Regression gate is mandatory |
| `.opencode/` for primitives only | AGENTS.md Q6 | Capability state lives in `.hivemind/`, never `.opencode/` |

---

## Requirements

### REQ-P44-01: Capability Gate Module (PARTIAL — 70% complete)

**What:** A feature module that maintains an in-memory capability ledger, seeded from agent frontmatter at bootstrap and updated via hook events at runtime.

**Current (2026-06-01):** `src/features/capability-gate/index.ts` (111 LOC) + `types.ts` (28 LOC) exist. `CapabilityGate` class has `resolveToolsForAgent()`, `grantCapability()`, `revokeCapability()`, `getCapabilitySnapshot()`. `TOOL_CAPABILITY_MAP` has 31 tools classified into 6 categories (Read, Write, Delegate, Govern, Config, Session). `ToolCategory` enum defined. **Gaps:** (1) Failing test file `tests/features/capability-gate/capability-map.test.ts` with import path error, (2) No bootstrap seeding mechanism, (3) Not wired into any enforcement point.

**Target:** Fix the failing test. CapabilityGate resolves all 31 registered tools correctly. Module is self-contained with zero external deps.

**Acceptance Criteria:**
- [x] AC-01a: `CapabilityGate` resolves all 31 registered tools (not just 7 built-ins)
- [x] AC-01b: Resolution falls back to category-based defaults when agent has no frontmatter declarations
- [ ] AC-01c: Failing test `capability-map.test.ts` fixed and passing
- [x] AC-01d: Module has zero external dependencies
- [x] AC-01e: Module is ≤ 150 LOC (actual: 139 LOC)
- [ ] AC-01f: `CapabilityGate` is exported from `src/features/capability-gate/index.ts` and importable by other modules

---

### REQ-P44-02: Static Baseline — Agent Frontmatter Declarations (NOT STARTED)

**What:** All 31 `hm-*` agents declare their required tool set in frontmatter `tools:` field.

**Current:** 30/31 `hm-*` agents have empty or missing `tools:` declarations. `hm-l0-orchestrator` has a markdown bullet "- **Runtime tools:** ..." but not a proper YAML frontmatter `tools:` field. Audit confirms this in Section 3 (Agent Permission Coverage).

**Target:** Every `hm-*` agent `.md` file has an explicit YAML `tools:` list in frontmatter matching the tools its implementation actually uses (verified against CapabilityGate category routing).

**Acceptance Criteria:**
- [ ] AC-02a: All 31 `hm-*` agents have non-empty `tools:` frontmatter field
- [ ] AC-02b: No agent declares a tool not present in `TOOL_CAPABILITY_MAP`
- [ ] AC-02c: Every tool in `TOOL_CAPABILITY_MAP` appears in at least one agent's `tools:` list
- [ ] AC-02d: Changes are made in `.hivefiver-meta-builder/agents-lab/active/refactoring/` (source of truth), then reflected to `.opencode/agents/`

---

### REQ-P44-03: Orphaned Tool Assignment Verification (NOT STARTED)

**What:** Verify all 31 tools in `TOOL_CAPABILITY_MAP` are covered by at least one agent's frontmatter declaration.

**Current:** `TOOL_CAPABILITY_MAP` has 31 tools classified into 6 categories. The original audit identified 11 orphaned tools. Some are now categorized in `TOOL_CAPABILITY_MAP` but none are referenced from any agent frontmatter.

**Target:** Each tool in `TOOL_CAPABILITY_MAP` appears in at least one agent's declared tool set, with documented rationale.

**Acceptance Criteria:**
- [ ] AC-03a: Zero orphaned tools remain (all 31 `TOOL_CAPABILITY_MAP` tools appear in ≥1 agent's tool set)
- [ ] AC-03b: Assignment rationale documented in SPEC appendix
- [ ] AC-03c: No tool is assigned to an agent that cannot meaningfully use it

---

### REQ-P44-04: JIT Tool Injection at Delegation Boundary (NOT STARTED)

**What:** `spawn-request-builder.ts` resolves effective tool set from `CapabilityGate` instead of hardcoded `WRITE_CAPABLE_TOOLS`.

**Current:** `resolveDelegationPermissionProfile` constructs permission profile from `WRITE_CAPABLE_TOOLS` constant (7 items) only. Zero references to `CapabilityGate` or `TOOL_CAPABILITY_MAP` in `spawn-request-builder.ts` (verified by grep).

**Target:** `resolveDelegationPermissionProfile` calls `capabilityGate.resolveToolsForAgent(agentName)` to build the `allowedTools` set. Falls back to category-based defaults if capability gate returns empty. `WRITE_CAPABLE_TOOLS` constant retained as the ultimate fallback.

**Acceptance Criteria:**
- [ ] AC-04a: Delegation to an agent with declared tools produces exactly those tools (no more, no less)
- [ ] AC-04b: Delegation to an agent without declared tools produces category-based defaults
- [ ] AC-04c: `WRITE_CAPABLE_TOOLS` constant is last-resort fallback, not primary source
- [ ] AC-04d: Change is ≤ 80 LOC in `spawn-request-builder.ts`
- [ ] AC-04e: All existing delegation tests pass unmodified

---

### REQ-P44-05: Hook-Based Capability Enforcement (NOT STARTED)

**What:** `tool-guard-hooks.ts` consults `CapabilityGate` before allowing tool execution.

**Current:** `tool.execute.before` hook calls `evaluateGovernance()` which checks session circuit breaker and tool budget, but has zero capability context (verified by grep — no `CapabilityGate` or `capability` references in `tool-guard-hooks.ts`).

**Target:** The `tool.execute.before` handler queries `CapabilityGate.resolveToolsForAgent(currentAgent)` and adds the result to the governance context passed to `evaluateGovernance()`. If the tool is not in the resolved set, governance evaluation returns DENY.

**Acceptance Criteria:**
- [ ] AC-05a: Tool execution by an agent not authorized for that tool returns structured denial (not exception)
- [ ] AC-05b: Denial message includes agent name, tool name, and reason ("not in capability set")
- [ ] AC-05c: Governance evaluation receives capability context as additional input
- [ ] AC-05d: Existing governance checks (circuit breaker, tool budget) continue to function
- [ ] AC-05e: Hook changes are ≤ 40 LOC

---

### REQ-P44-06: Capability Mutation Event Tracking (PARTIAL — types exist)

**What:** Grant/revoke operations emit events to session-tracker for persistence and audit.

**Current:** `CapabilityMutationEvent` type exists in `src/features/capability-gate/types.ts`. `grantCapability` and `revokeCapability` accept an `emitCapabilityEvent` callback. BUT: No `capability_mutation` event type in `src/features/session-tracker/types.ts` (verified by grep). The callback is optional and nothing provides it at runtime.

**Target:** A new event type `capability_mutation` is added to the session event stream in session-tracker. The `CapabilityGate` constructor receives an emitter wired to session-tracker at plugin initialization.

**Acceptance Criteria:**
- [ ] AC-06a: Every grant/revoke produces a session-tracker event
- [ ] AC-06b: Events are queryable via existing session-tracker APIs
- [ ] AC-06c: On harness restart, capability state is re-seeded from frontmatter + replayed mutation events
- [ ] AC-06d: Event type extension is ≤ 30 LOC across types.ts and relevant hooks
- [ ] AC-06e: Existing session-tracker tests pass unmodified

---

## Requirement Traceability

| Req ID | Research Section | Audit Section | Source Files | Status | LOC Budget |
|--------|-----------------|---------------|--------------|--------|------------|
| REQ-P44-01 | §4 Event-Sourced Capability Model | §1 Tool Registry | `src/features/capability-gate/` (EXISTS) | 70% done | ~139 (done) |
| REQ-P44-02 | §3 Frontmatter as Static Baseline | §3 Agent Permission Coverage | `.hivefiver-meta-builder/agents-lab/active/refactoring/hm-*/*.md` | NOT started | ~30 files |
| REQ-P44-03 | §3 Orphaned Tool Analysis | §2 Tool Coverage Matrix | Same as REQ-02 | NOT started | ~0 (config only) |
| REQ-P44-04 | §5 JIT Injection Pattern | §4 Spawner Enforcement | `src/coordination/spawner/spawn-request-builder.ts` | NOT started | ~80 |
| REQ-P44-05 | §5 Hook-Based Enforcement | §5 Hook Coverage | `src/hooks/guards/tool-guard-hooks.ts` | NOT started | ~40 |
| REQ-P44-06 | §4 Mutation Event Tracking | §6 Session Tracker | `src/features/session-tracker/types.ts` + wiring | Types only | ~30 |

**Total LOC remaining:** ~160 new + test fixes (within project target)

---

## Dependency Map

```
REQ-P44-01 (capability gate module — fix test + ensure exportable)
├── REQ-P44-04 (spawn-request-builder JIT injection) — depends on 01
├── REQ-P44-05 (hook enforcement) — depends on 01
└── REQ-P44-06 (mutation events) — depends on 01
REQ-P44-02 (agent frontmatter) — independent, parallel
REQ-P44-03 (orphaned tools) — depends on 02 completion for full coverage
```

**Execution order:** 01 (fix) → {04, 05, 06} in parallel → 02 → 03

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Over-tightening causes false denials | MEDIUM | HIGH | Fallback to category defaults; deny logs but doesn't crash |
| Frontmatter drift after agent edits | HIGH | LOW | Capability gate re-seeds on bootstrap; frontmatter is baseline only |
| Performance impact of per-tool lookups | LOW | MEDIUM | In-memory Map — O(1) resolution, no I/O |
| 30 agent files touched simultaneously | MEDIUM | LOW | Atomic commit per agent; test gate after batch |
| Existing failing test masks regression | LOW | HIGH | Fix capability-map.test.ts first before any other changes |

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
- All 3,032+ existing tests pass (1 currently failing test in `capability-map.test.ts` must be fixed)
- `npm run typecheck` clean
- `npm run build` clean

### Gate 4: Audit Re-Run
- Re-run tool lifecycle wiring audit
- Verify: 0 orphaned tools, 31/31 agents with tool declarations, 31/31 tools at delegation boundary

---

## Appendix: Orphaned Tool Assignment Plan

| Tool | TOOL_CAPABILITY_MAP Category | Proposed Agent Assignment | Rationale |
|------|------------------------------|--------------------------|-----------|
| `hivemind_sdk_supervisor` | Session | all hm-* (l0, l1, l2) | SDK health checks are universal |
| `hivemind_session_view` | Govern | hm-l0-orchestrator, hm-l1-coordinator | Session visibility for orchestrators |
| `hivemind_trajectory` | Govern | hm-l0-orchestrator, hm-verifier | Trajectory tracking for orchestration + verification |
| `hivemind_pressure` | Govern | hm-l0-orchestrator | Pressure classification is orchestration concern |
| `hivemind_doc` | Read | hm-doc-writer, hm-verifier, hm-phase-researcher | Document intelligence for doc-oriented agents |
| `hivemind_command_engine` | Govern | hm-l0-orchestrator, hm-l1-coordinator | Command discovery/routing for coordinators |
| `hivemind_agent_work_create` | Session | hm-l0-orchestrator, hm-planner | Work contracts for planning agents |
| `hivemind_agent_work_export` | Session | hm-verifier, hm-shipper | Work export for verification/shipping |
| `session-patch` | Session | hm-l0-orchestrator | Session context patching is orchestration concern |
| `prompt-analyze` | Read | hm-l0-orchestrator, hm-phase-researcher | Prompt analysis for research/orchestration |
| `prompt-skim` | Read | hm-l0-orchestrator, hm-phase-researcher | Prompt skimming for research/orchestration |

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

| Dimension | Weight | Score (0–1) | Weighted | Status | Notes |
|-----------|--------|-------------|----------|--------|-------|
| Goal Clarity | 0.35 | 0.92 | 0.322 | ✓ | Updated with current implementation state; delta between existing code and target is concrete |
| Boundary Clarity | 0.25 | 0.92 | 0.230 | ✓ | Explicit in/out of scope; 6 out-of-scope items with reasoning |
| Constraint Clarity | 0.20 | 0.88 | 0.176 | ✓ | 7 constraints updated with current test counts and LOC; CQRS alignment verified |
| Acceptance Criteria | 0.20 | 0.86 | 0.172 | ✓ | 28+ ACs updated; 4 already met (checked); remaining items are falsifiable |

**Composite clarity:** 0.900
**Ambiguity score:** 0.10 (= 1.0 − 0.900)
**Gate result:** PASS (0.10 ≤ 0.20 threshold, all dimensions meet minimums)

### Dimension-by-dimension assessment

**Goal Clarity (0.92):** The goal is unambiguous — wire the existing CapabilityGate into 3 enforcement points. The implementation delta is concrete: 139 LOC exist, ~160 LOC remain. Problem is quantified: 31 tools in TOOL_CAPABILITY_MAP, 0 wired into spawner/hooks/tracker. The target state is measurable: all 3 enforcement points active, all 31 agents with declarations.

**Boundary Clarity (0.92):** Six items in scope, six items out of scope with explicit rationale. The boundary between "capability gate module completion" (in scope) and "new policy engine" (out of scope) is clear. AC-02d covers source-of-truth path (.hivefiver-meta-builder/ → .opencode/agents/).

**Constraint Clarity (0.88):** Seven constraints updated with current test counts (3,032 passing, 1 failing). LOC budget revised: 139 done + ~160 remaining = ~300 total. CQRS alignment verified: write-side = grant/revoke events, read-side = resolveToolsForAgent().

**Acceptance Criteria (0.86):** 28+ ACs, all falsifiable. 4 ACs already checked as met (AC-01a, AC-01b, AC-01d, AC-01e). New AC-01f added for exportability. Remaining 24 ACs are pass/fail with clear verification methods.

---

## Interview Log

**Mode:** `--auto` — interview skipped (ambiguity 0.10 ≤ 0.20 gate)

| # | Standard Question | Auto-Answered | Rationale |
|---|-------------------|---------------|-----------|
| 1 | Is the goal precise enough for a developer to implement without asking questions? | YES | 6 requirements with 28+ ACs; 70% of REQ-01 already implemented |
| 2 | Are boundaries clear — what is explicitly NOT in this phase? | YES | 6 out-of-scope items with rationale |
| 3 | Are constraints documented with their source authority? | YES | 7 constraints sourced from ARCHITECTURE.md, AGENTS.md, current test results |
| 4 | Are acceptance criteria falsifiable (pass/fail, not subjective)? | YES | 28+ ACs all measurable; LOC budgets are guardrails |
| 5 | Is the dependency/ordering between requirements clear? | YES | Dependency map with explicit execution order |
| 6 | Does the SPEC reflect current codebase state? | YES | Updated 2026-06-01 with verified implementation status |

**Skipped questions:** None — all dimensions meet their minimum thresholds.

---

## Errata

### 2026-05-31 (original)

| Location | Original | Corrected | Reason |
|----------|----------|-----------|--------|
| REQ-P44-04 traceability | `src/coordination/delegation/spawn-request-builder.ts` | `src/coordination/spawner/spawn-request-builder.ts` | Path verified against codebase |
| Constraint #6 | "2,963 tests passing" | "3,034 tests passing (4 pre-existing failures)" | Current test suite count |
| Gate 3 | "All 2,963 existing tests pass" | "All 3,034 existing tests pass (4 pre-existing failures must not worsen)" | Current test suite count |
| Header | Author/Confidence fields | Phase status/metadata fields | Align with spec template format |

### 2026-06-01 (update)

| Location | Original | Corrected | Reason |
|----------|----------|-----------|--------|
| Problem Statement | "25 tools registered" | "31 tools in TOOL_CAPABILITY_MAP" | Codebase now has 31 classified tools |
| REQ-P44-01 Status | "NOT STARTED" | "70% complete" | CapabilityGate module exists (139 LOC) |
| REQ-P44-06 Status | "NOT STARTED" | "Types only" | CapabilityMutationEvent type exists but not wired |
| AC-01a | "resolves all 25 registered tools" | "resolves all 31 registered tools" | TOOL_CAPABILITY_MAP has 31 entries |
| AC-03a | "all 25 registered tools" | "all 31 TOOL_CAPABILITY_MAP tools" | Tool count updated |
| Gate 3 | "3,034 tests passing (4 pre-existing failures)" | "3,032 tests passing (1 failing test file in capability-map.test.ts)" | Current test suite state |
| Constraint #6 | "3,034 tests passing" | "3,032 tests passing (1 failing test file to fix)" | Current test suite state |
| Scope item 6 | "11 unassigned tools mapped" | "verify all 31 tools in TOOL_CAPABILITY_MAP are covered" | TOOL_CAPABILITY_MAP already classifies 31 tools |
| Gate 4 | "25/25 tools at delegation boundary" | "31/31 tools at delegation boundary" | Tool count updated |

---

*Phase: P44-tool-intelligence-capability-layer*
*Spec created: 2026-05-31*
*Spec updated: 2026-06-01*
*Next step: /gsd-discuss-phase 44 — implementation decisions (how to wire capability gate into enforcement points)*
