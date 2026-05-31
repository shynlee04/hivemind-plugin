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

The Hivemind harness registers 31 tools via `TOOL_CAPABILITY_MAP` in `src/features/capability-gate/`, but the spawner (`spawn-request-builder.ts`) still only recognizes the 7-item hardcoded `WRITE_CAPABLE_TOOLS` set. The primary OpenCode delegation method, native `task`, is not represented as a first-class capability. Native OpenCode `permission:` rules only express `allow`, `ask`, or `deny`; they do not encode Hivemind's conditional tool-use intelligence: whether a tool is correct for this agent, at this point in the workflow, with this session hierarchy, after this sequence of events. When an agent's profile is compacted (context pruning), tool intelligence evaporates entirely, causing silent permission escalation, denial, or wrong-tool usage at runtime.

The tool-guard-hooks (`src/hooks/guards/tool-guard-hooks.ts`) already run on `tool.execute.before`, but the governance engine has no capability context — it cannot make informed allow/block decisions based on agent role, native `task` usage, parent/child session depth, stacking state, recent tool sequence, active work contract, or trajectory.

**Implementation status (2026-06-01):** REQ-P44-01 is ~70% complete — `CapabilityGate` class and `TOOL_CAPABILITY_MAP` exist (139 LOC, 31 tools classified into 6 categories). However, the module is NOT yet wired into `spawn-request-builder.ts`, `tool-guard-hooks.ts`, or `session-tracker`. The remaining 5 requirements are NOT started.

**Impact:** Delegation safety is illusory. The spawner cannot enforce least privilege, and the hook layer cannot explain or correct wrong tool choices because Hivemind has no event-based tool intelligence plane.

---

## Goal

Wire the existing **CapabilityGate** module into the spawner and add a Hivemind-owned **Tool Intelligence Engine** on the `tool.execute.before` event path. Native OpenCode `task` must be a first-class delegation capability. Static agent metadata is only a bootstrap hint; runtime tool decisions must be conditional, just-in-time, event-based, and independent of OpenCode's native `permission:` plane.

---

## Scope

### In Scope
1. **Capability gate module completion** (`src/features/capability-gate/`) — fix failing test, add bootstrap seeding
2. **spawn-request-builder enhancement** — SDK child-session prompt tool injection from CapabilityGate
3. **native `task` intelligence** — first-class capability and event-based guard coverage for OpenCode's primary subagent dispatch path
4. **tool-guard-hooks integration** — ToolIntelligenceEngine evaluates each tool call before execution
5. **session-tracker extension** — capability decision and mutation event types
6. **Static Hivemind seed profiles** — programmatic agent/tool baseline outside OpenCode `permission:` and deprecated `tools:` authority

### Out of Scope
- External policy engine (OPA, Casbin) integration
- Capability revocation UI or dashboard
- Cross-session capability inheritance between independent delegation trees
- Broad runtime capability marketplace or UI-driven negotiation flow
- Dependency on OpenCode native `permission:` as the intelligence authority
- Mechanical migration to deprecated agent frontmatter `tools:` fields
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

### REQ-P44-02: Static Baseline — Hivemind Capability Seed Profiles (NOT STARTED)

**What:** Hivemind owns a programmatic static baseline that maps agent roles and tool categories to capability hints. This baseline is not OpenCode `permission:` and is not deprecated `tools:` frontmatter. It is a bootstrap seed for CapabilityGate and ToolIntelligenceEngine, not the final runtime authority.

**Current:** `CapabilityGate.resolveToolsForAgent()` uses name heuristics for `l0-orchestrator`, `l1-coordinator`, `l2`, and `hf-*`. Native `task` is not represented. Agent primitive `permission:` blocks exist in some files but are only OpenCode substrate rules and must not drive Hivemind intelligence.

**Target:** A source-backed Hivemind seed profile maps each supported agent tier/role to baseline tool categories and required delegation capabilities, including native `task`. CapabilityGate can resolve from this seed without reading OpenCode-native permission state.

**Acceptance Criteria:**
- [ ] AC-02a: Native `task` exists in `TOOL_CAPABILITY_MAP` with category `Delegate` and source `built-in`
- [ ] AC-02b: Hivemind seed profiles cover all 31 current capability-map tools plus native `task`
- [ ] AC-02c: Seed profiles do not use `permission: deny` or deprecated `tools:` as the authority
- [ ] AC-02d: Unknown agents fall back to read-only baseline plus contextual guidance, not silent broad access
- [ ] AC-02e: Tests prove every mapped tool name exists in `TOOL_CAPABILITY_MAP`

---

### REQ-P44-03: Tool Coverage and Native Delegation Assignment Verification (NOT STARTED)

**What:** Verify all capability-map tools, including native `task`, are assigned to at least one Hivemind seed profile and that each assignment has a role-based rationale.

**Current:** `TOOL_CAPABILITY_MAP` has 31 tools classified into 6 categories. The original audit identified 11 orphaned tools. Some are now categorized in `TOOL_CAPABILITY_MAP` but none are referenced from any agent frontmatter.

**Target:** Each tool in `TOOL_CAPABILITY_MAP` appears in at least one Hivemind-owned seed profile, with documented rationale. Native `task` must be assigned to front-facing or explicitly delegated governance roles only; child recursion requires JIT grant logic.

**Acceptance Criteria:**
- [ ] AC-03a: Zero orphaned tools remain (all capability-map tools, including native `task`, appear in >=1 seed profile)
- [ ] AC-03b: Assignment rationale documented in SPEC appendix
- [ ] AC-03c: No tool is assigned to an agent that cannot meaningfully use it
- [ ] AC-03d: Native `task` assignment is not treated as equivalent to wrapper `delegate-task` or `execute-slash-command`

---

### REQ-P44-04: SDK Child-Session Tool Injection at Delegation Boundary (NOT STARTED)

**What:** `spawn-request-builder.ts` resolves effective tool set from `CapabilityGate` instead of hardcoded `WRITE_CAPABLE_TOOLS`.

**Current:** `resolveDelegationPermissionProfile` constructs permission profile from `WRITE_CAPABLE_TOOLS` constant (7 items) only. Zero references to `CapabilityGate` or `TOOL_CAPABILITY_MAP` in `spawn-request-builder.ts` (verified by grep).

**Target:** `resolveDelegationPermissionProfile` calls `capabilityGate.resolveToolsForAgent(agentName)` to build the SDK child-session `allowedTools` set. Falls back to category-based defaults if capability gate returns empty. `WRITE_CAPABLE_TOOLS` constant retained as the ultimate fallback. This requirement covers SDK child-session prompt-time tools only and does not claim native OpenCode `task` enforcement.

**Acceptance Criteria:**
- [ ] AC-04a: Delegation to an agent with explicit Hivemind seed profile produces profile tools merged with safe SDK baseline
- [ ] AC-04b: Delegation to an agent without declared tools produces category-based defaults
- [ ] AC-04c: `WRITE_CAPABLE_TOOLS` constant is last-resort fallback, not primary source
- [ ] AC-04d: Change is ≤ 80 LOC in `spawn-request-builder.ts`
- [ ] AC-04e: All existing delegation tests pass unmodified
- [ ] AC-04f: SDK child sessions continue to disable recursive native `task` and `delegate-task` unless a later ToolIntelligenceEngine JIT grant explicitly permits it

---

### REQ-P44-05: Event-Based Tool Intelligence Enforcement (NOT STARTED)

**What:** `tool-guard-hooks.ts` calls a Hivemind ToolIntelligenceEngine before allowing tool execution. The engine evaluates the current tool call using CapabilityGate baseline, session hierarchy, parent/child depth, pending dispatch registry, recent tool sequence, active contract/trajectory when available, and tool arguments.

**Current:** `tool.execute.before` hook calls `evaluateGovernance()` which checks session circuit breaker and tool budget, but has zero capability context (verified by grep — no `CapabilityGate` or `capability` references in `tool-guard-hooks.ts`).

**Target:** The `tool.execute.before` handler builds a bounded ToolIntelligenceEvent and asks ToolIntelligenceEngine for an `allow`, `warn`, `block`, or `needs_jit_grant` decision. Blocking must return meaningful context: agent/session, tool, reason, correct tool to use, whether stacking is required, and next action. Native `task` must be handled as the primary delegation path, not as an ordinary custom tool.

**Acceptance Criteria:**
- [ ] AC-05a: Tool execution by an agent using the wrong tool returns a structured contextual block
- [ ] AC-05b: Block message includes agent name, session ID, tool name, reason, correct tool, stacking guidance when relevant, and next action
- [ ] AC-05c: Native `task` is allowed for front-facing orchestration when dispatch context is valid
- [ ] AC-05d: Existing governance checks (circuit breaker, tool budget) continue to function
- [ ] AC-05e: Child sessions are blocked from recursive native `task` unless a JIT grant exists
- [ ] AC-05f: `delegate-task` is blocked for code/artifact edits with guidance to use native `task`
- [ ] AC-05g: Hook changes stay small by delegating decision logic to a feature module

---

### REQ-P44-06: Capability Mutation Event Tracking (PARTIAL — types exist)

**What:** Grant/revoke operations emit events to session-tracker for persistence and audit.

**Current:** `CapabilityMutationEvent` type exists in `src/features/capability-gate/types.ts`. `grantCapability` and `revokeCapability` accept an `emitCapabilityEvent` callback. BUT: No `capability_mutation` event type in `src/features/session-tracker/types.ts` (verified by grep). The callback is optional and nothing provides it at runtime.

**Target:** New event types record capability mutations and tool intelligence decisions in session-tracker. The `CapabilityGate` constructor receives an emitter wired to session-tracker at plugin initialization. ToolIntelligenceEngine emits decision events for allow/warn/block/needs_jit_grant, including native `task` dispatch attempts.

**Acceptance Criteria:**
- [ ] AC-06a: Every grant/revoke produces a session-tracker event
- [ ] AC-06b: Every ToolIntelligenceEngine block/warn decision produces a queryable event
- [ ] AC-06c: Events are queryable via existing session-tracker APIs
- [ ] AC-06d: On harness restart, capability state is re-seeded from Hivemind seed profiles + replayed mutation events
- [ ] AC-06e: Event type extension is scoped and tested without broad lifecycle rewrites
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
