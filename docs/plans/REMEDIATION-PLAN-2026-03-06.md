# Plan: Multi-Agent Architecture Conflict Remediation

**Generated**: 2026-03-06
**Context**: Post-7-phase implementation validation revealed 15 conflicts (6 CRITICAL, 5 HIGH, 4 MEDIUM)
**Goal**: Resolve conflicts systematically with guardrails, prevent regression

---

## Overview

Three-agent validation (hivexplorer + hiveq + hiverd) identified critical conflicts in:
1. **Dual injection systems** causing context pollution
2. **Agent tool access** denying hivefiver essential capabilities
3. **Registry duplication** creating ambiguous configuration sources
4. **Scope boundary collisions** in docs/** and .hivemind/state/

External research recommends three-layer validation approach:
- **Runtime**: LangGraph StateGraph for workflow enforcement
- **Static**: TypeScript ESLint + Semgrep for boundary enforcement
- **Testing**: CQRS harness + coordination metrics dashboard

---

## Prerequisites

- **Test baseline**: 230 passing, 0 failing ✓
- **Type safety**: PASS ✓
- **Guardrails**: AGENTS.md + CONTAMINATION-GUARDRAILS.md active ✓
- **External validation skills**: Identified (LangGraph, Semgrep, TypeScript ESLint)

---

## Dependency Graph

```
Phase 1 (Safety Foundation)
T1 ── T2 ── T3
        │
        └── T4

Phase 2 (Scope Clarity)
T5 ── T6 ── T7

Phase 3 (Enforcement Hardening)
T8 ── T9 ── T10

Phase 4 (Validation Infrastructure)
T11 ── T12 ── T13
```

---

## Phase 1: Safety Foundation (Critical Conflicts)

### T1: Fix Dual Injection Clash (HOOK-CLASH-001)
- **depends_on**: []
- **severity**: CRITICAL
- **location**: 
  - `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
  - `src/hooks/session-lifecycle.ts`
  - `src/hooks/messages-transform.ts`
- **description**: 
  1. Complete deduplication in context-injection.ts (expand marker detection)
  2. Define injection priority: plugin > core-system > core-message
  3. Consolidate to single orchestrator or clarify budget allocation
- **validation**: 
  - Run `npm test` (expect 230 passing)
  - Verify no duplicate governance markers in LLM context
  - Check injection budget < 16000 chars total
- **status**: Not Completed
- **log**: []
- **files edited/created**: []

### T2: Grant hivefiver HiveMind Tool Access (TOOL-ACCESS-001)
- **depends_on**: [T1]
- **severity**: CRITICAL
- **location**: 
  - `agents/hivefiver.md` OR `.opencode/agents/hivefiver.md`
- **description**:
  1. Grant permissions: `hivemind_*`, `scan_hierarchy`, `think_back`, `save_anchor`, `save_mem`, `recall_mems`
  2. Alternative: Create proxy tool for context preservation
  3. Test hivefiver can maintain hierarchy across sessions
- **validation**:
  - hivefiver can call `scan_hierarchy` successfully
  - hivefiver can save/recall anchors
  - Test: hivefiver delegates to hivemaker, then recalls context
- **status**: Not Completed
- **log**: []
- **files edited/created**: []

### T3: Consolidate Agent Registry (AGENT-OVERLAP-001)
- **depends_on**: [T2]
- **severity**: CRITICAL
- **location**:
  - `agents/*.md`
  - `.opencode/agents/*.md`
  - `.opencode/agents/REGISTRY.md`
- **description**:
  1. Choose single source of truth (recommend: `.opencode/agents/` with plugin awareness)
  2. Create symlinks or remove duplicates
  3. Document registry hierarchy in REGISTRY.md
  4. Handle `hivefiver-reserved.md` (delete or document purpose)
- **validation**:
  - Single canonical location for each agent
  - No conflicting configurations
  - Agent loader resolves correct paths
- **status**: Not Completed
- **log**: []
- **files edited/created**: []

### T4: Fix hivefiver Read Access Paradox (TOOL-ACCESS-002)
- **depends_on**: [T2]
- **severity**: HIGH
- **location**: `agents/hivefiver.md` OR `.opencode/agents/hivefiver.md`
- **description**:
  1. Grant `read`, `glob`, `grep` permissions
  2. Alternative: Enforce all investigation via hivexplorer delegation
  3. Update scope_paths to match tool access
- **validation**:
  - hivefiver can read files in allowed scope
  - Test: hivefiver investigates framework assets before modification
- **status**: Not Completed
- **log**: []
- **files edited/created**: []

---

## Phase 2: Scope Clarity (Boundary Violations)

### T5: Split docs/** Ownership (SCOPE-BOUNDARY-001)
- **depends_on**: [T3]
- **severity**: CRITICAL
- **location**:
  - `docs/` directory structure
  - `agents/hivefiver.md`, `agents/hivemaker.md`, `agents/hivehealer.md`
- **description**:
  1. Create `docs/framework/` for hivefiver (meta-builder docs)
  2. Keep `docs/` for hivemaker/hivehealer (implementation docs)
  3. Update agent scope_paths to reflect split
  4. Migrate existing docs to appropriate subdirectories
- **validation**:
  - No agent can modify outside their docs scope
  - Framework docs separate from implementation docs
  - Test: hivemaker cannot edit `docs/framework/**`
- **status**: Not Completed
- **log**: []
- **files edited/created**: []

### T6: Define .hivemind/state/ CQRS Ownership (SCOPE-BOUNDARY-002)
- **depends_on**: [T1]
- **severity**: CRITICAL
- **location**:
  - `src/lib/state-mutation-queue.ts`
  - `src/tools/` directory
  - `.opencode/plugins/hiveops-governance/hooks/context-injection.ts`
- **description**:
  1. Document which layer OWNS writes to `.hivemind/state/`
  2. Enforce CQRS: hooks READ, tools WRITE
  3. Add validation in state-mutation-queue.ts to reject direct writes from hooks
  4. Update context-injection.ts to only read, never write
- **validation**:
  - No hook directly modifies state files
  - All state changes go through mutation queue
  - Test: Hook attempting write throws error
- **status**: Not Completed
- **log**: []
- **files edited/created**: []

### T7: Enforce Framework Asset Read Denial (SCOPE-BOUNDARY-003)
- **depends_on**: [T3]
- **severity**: MEDIUM
- **location**:
  - `agents/hivemaker.md`, `agents/hivehealer.md`, `agents/hiveplanner.md`
- **description**:
  1. Deny read access to `agents/**`, `commands/**`, `workflows/**`, `skills/**` for execution agents
  2. Prevent temptation to modify framework assets during investigation
  3. Update permissions in agent configs
- **validation**:
  - hivemaker cannot read `agents/*.md`
  - hivehealer cannot read `workflows/*.yaml`
  - Test: Execution agent blocked from framework assets
- **status**: Not Completed
- **log**: []
- **files edited/created**: []

---

## Phase 3: Enforcement Hardening (Governance Gaps)

### T8: Add hivefiver Enforcement State Query (ENFORCEMENT-GAP-001)
- **depends_on**: [T2, T4]
- **severity**: CRITICAL
- **location**:
  - `src/lib/gatekeeper.ts`
  - `.opencode/agents/hivefiver.md`
- **description**:
  1. Add tool `hivemind_query_enforcement` to check scope violations
  2. Grant hivefiver access to this tool
  3. Allow hivefiver to verify its own constraints without bash
- **validation**:
  - hivefiver can query enforcement state
  - Test: hivefiver detects attempted scope violation
- **status**: Not Completed
- **log**: []
- **files edited/created**: []

### T9: Add Delegation Depth Limits (ENFORCEMENT-GAP-002)
- **depends_on**: [T3]
- **severity**: HIGH
- **location**: `.opencode/agents/hivefiver.md`
- **description**:
  1. Add `max_delegation_depth: 3` to hivefiver config
  2. Enforce in GX-Pack `gx-enforce.sh check-delegation`
  3. Add depth tracking to delegation packets
- **validation**:
  - Delegation chain stops at depth 3
  - Test: hivefiver delegates to depth 4 → error thrown
- **status**: Not Completed
- **log**: []
- **files edited/created**: []

### T10: Remove hiveq Edit Permissions (AGENT-OVERLAP-005)
- **depends_on**: [T3]
- **severity**: MEDIUM
- **location**: `.opencode/agents/hiveq.md`
- **description**:
  1. Remove `edit.*` permissions from hiveq (verifier should be read-only)
  2. Clarify if docs editing is intentional (unlikely for verifier role)
  3. Update role description to match permissions
- **validation**:
  - hiveq cannot edit any files
  - Test: hiveq edit attempt blocked
- **status**: Not Completed
- **log**: []
- **files edited/created**: []

---

## Phase 4: Validation Infrastructure (External Research)

### T11: Implement TypeScript ESLint Module Boundaries
- **depends_on**: [T5, T6, T7]
- **severity**: HIGH
- **location**:
  - `.eslintrc.js` or `eslint.config.js`
  - `package.json` (add devDependency)
- **description**:
  1. Install `@typescript-eslint/eslint-plugin` v6+
  2. Enable `explicit-module-boundary-types` rule
  3. Enable `no-unsafe-*` rules for cross-boundary violations
  4. Configure overrides for mixed JS/TS codebase
- **validation**:
  - ESLint catches implicit `any` crossing module boundaries
  - Test: Intentional boundary violation triggers ESLint error
- **status**: Not Completed
- **log**: []
- **files edited/created**: []

### T12: Create Semgrep Architecture Invariant Rules
- **depends_on**: [T6, T8]
- **severity**: MEDIUM
- **location**: `.semgrep/` directory
- **description**:
  1. Create custom Semgrep rules for:
     - No direct state file writes from hooks
     - CQRS enforcement (tools write, hooks read)
     - Agent scope boundary violations
  2. Enable interfile taint analysis
  3. Add to CI pipeline
- **validation**:
  - Semgrep catches architecture violations
  - Test: Hook writing to state triggers Semgrep alert
- **status**: Not Completed
- **log**: []
- **files edited/created**: []

### T13: Build CQRS Validation Test Harness
- **depends_on**: [T6]
- **severity**: MEDIUM
- **location**: `tests/cqrs-validation.test.ts`
- **description**:
  1. Create event replay infrastructure
  2. Build projection state assertion framework
  3. Add eventual consistency timing utilities
  4. Test command handlers produce valid events
  5. Test query model consistency against event store
- **validation**:
  - Can replay events to reconstruct state
  - Test: CQRS violation detected by test harness
- **status**: Not Completed
- **log**: []
- **files edited/created**: []

---

## Parallel Execution Groups

| Wave | Tasks | Can Start When | Estimated Time |
|------|-------|----------------|----------------|
| 1 | T1 (Fix dual injection) | Immediately | 2-3 hours |
| 2 | T2 (hivefiver tools), T4 (hivefiver read) | Wave 1 complete | 1-2 hours |
| 3 | T3 (consolidate registry) | Wave 2 complete | 1 hour |
| 4 | T5 (docs split), T6 (CQRS ownership), T7 (read denial) | Wave 3 complete | 2-3 hours |
| 5 | T8 (enforcement query), T9 (delegation depth), T10 (hiveq perms) | Wave 4 complete | 1-2 hours |
| 6 | T11 (ESLint), T12 (Semgrep), T13 (CQRS harness) | Wave 5 complete | 3-4 hours |

**Total Estimated Time**: 10-15 hours across 6 waves

---

## Testing Strategy

### After Each Phase
1. **Run full test suite**: `npm test` (expect 230 passing)
2. **Type check**: `npx tsc --noEmit` (expect PASS)
3. **Verify no regressions**: Compare against baseline

### After Critical Tasks (T1, T2, T3)
1. **Manual injection test**: Verify LLM context not polluted
2. **Agent capability test**: hivefiver can perform meta-builder tasks
3. **Registry resolution test**: Agents load from correct location

### After All Phases
1. **Run Semgrep rules**: Verify architecture invariants
2. **Run ESLint with new rules**: Verify module boundaries
3. **Run CQRS harness**: Verify read/write separation
4. **Full regression suite**: All 230 tests still passing

---

## Risks & Mitigations

### Risk 1: Injection Consolidation Breaks Context
**Mitigation**: T1 includes comprehensive deduplication testing; rollback plan if LLM context degrades

### Risk 2: hivefiver Tool Access Creates Security Gap
**Mitigation**: T8 adds enforcement query; T9 adds delegation depth limits; monitor with Semgrep rules

### Risk 3: Registry Consolidation Loses Configuration
**Mitigation**: T3 uses symlinks first; backup both registry locations before migration

### Risk 4: Scope Changes Break Existing Agents
**Mitigation**: Run full test suite after each phase; rollback if any agent functionality breaks

### Risk 5: External Tools (ESLint, Semgrep) Add Overhead
**Mitigation**: Phase 4 is optional; can defer if timeline pressure; provides long-term safety

---

## Guardrails

### Must NOT Proceed Without
- [ ] T1 complete: Dual injection clash resolved
- [ ] T2 complete: hivefiver has essential tools
- [ ] T3 complete: Single agent registry

### Must MAINTAIN Throughout
- [ ] 230 tests passing (no regressions)
- [ ] Type safety: `npx tsc --noEmit` PASS
- [ ] No new context pollution vectors
- [ ] AGENTS.md constraints respected

### Must VERIFY Before Moving to Next Phase
- [ ] Previous phase tasks validated
- [ ] No regressions detected
- [ ] Documentation updated

---

## Next Steps

1. **User Approval**: Review this plan and approve/reject phases
2. **Begin Phase 1**: Start with T1 (dual injection fix)
3. **Iterative Validation**: Run tests after each task
4. **Progressive Buildup**: Complete phases sequentially with guardrail checks

---

## Evidence Sources

- **hivexplorer conflict report**: 15 conflicts identified (6 CRITICAL, 5 HIGH, 4 MEDIUM)
- **hiveq test validation**: 230 passing, 0 failing, type safety PASS
- **hiverd external research**: LangGraph, Semgrep, TypeScript ESLint recommendations
- **AGENTS.md constraints**: CQRS enforcement, session isolation, dual-lineage boundaries
