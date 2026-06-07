---
name: hm-cross-change
description: >
  Govern cross-cutting changes, cross-pane modifications, framework migrations,
  and breaking changes that span multiple pans, layers, or frameworks.
  Trigger for "cross-cutting change", "cross-pane change", "multi-layer change",
  "framework migration", "breaking change across frameworks", "change impact analysis",
  "cross-framework change", "multi-pane impact", "test-first change ordering",
  "dependency ordering across layers", "consumer impact tracing",
  "interface-first change", "ordered change management", "pan classification",
  "lifecycle impact", "mock honesty detection", "red-first protocol".
  NOT for single-file changes, single-framework refactors, cosmetic edits,
  or changes where tests are written after implementation.
  Framework-agnostic — works across GSD, BMAD, Hivemind, or any project governance framework.
metadata:
  consumed-by:
    - "hm-executor"
    - "hm-builder"
    - "hm-architect"
    - "hm-coord-loop"
    - "hm-platform-contracts"
  lineage-scope: "hm-*"
  access: "STRICT"
  role: "change-governance"
  realm: "arch,clean-code"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

## GSD Compatibility

This skill is the canonical Hivemind replacement. If you're still on GSD:

| GSD skill | Hivemind equivalent | Behavior diff |
|-----------|--------------------|--------------|
| `gsd-debug` (closest) | `hm-cross-change` | GSD-debug isolates the failing change after the fact; Hivemind `hm-cross-change` prevents cross-cutting regressions pre-merge by enforcing pan-classification + lifecycle-impact analysis + red-first verification. Use GSD-debug for triage, Hivemind `hm-cross-change` for governance. |

You can use either; the Hivemind path is canonical, the GSD path is supported via the equivalence map. **Note**: GSD has no direct counterpart — the closest is `gsd-debug`, but the new `hm-cross-change` does preventive governance that GSD does not have.

## Overview

`hm-cross-change` is the governance skill for changes that span multiple pans, layers, or frameworks. It merges two layers:

1. **Framework-agnostic methodology** (from `cross-cutting-change-mgmt`): the 7-phase workflow (Scan → Classify → Impact Analysis → Red-First → Implement → Verify → Handoff), rollback governance, anti-patterns, verification checklist.
2. **Pan-classification taxonomy** (from `hm-l2-cross-cutting-change`): 5-pan model (interface / deep_module / test / config / consumer), lifecycle-impact matrix, 6-gate system, decision tree, handoff packet schema.

The skill is **framework-agnostic** in methodology. The Hivemind binding layer names the runtime tools that make the governance executable end-to-end.

## When This Skill Loads — Do This First

1. **Verify the entry gate.** A cross-cutting change must affect ≥2 pans/layers, involve behavioral modification, have consumers that may be affected.
2. **Read `references/pan-classification.md`** (or the framework-equivalent terminology map) to identify the pan taxonomy for the framework.
3. **Set the ordering lock.** Write the change contract: interface → deep module → config → tests → consumers.
4. **Identify Hivemind bindings** (if executing in Hivemind runtime): `execute-slash-command` for child-skill dispatch, `hivemind-agent-work` for durable change contracts.
5. **Confirm no implementation has been written yet.** If it has, revert for a true RED cycle.

## The Iron Law

```
A change spanning ≥2 pans MUST be red-first.
A test that passes before implementation is lying.
A test written after implementation is a description, not a guard.
```

## The Three Pillars

1. **Red-first verification** — failing tests prove the change is real, not cosmetic. A test that passes before implementation is either wrong or redundant.
2. **Ordering governance** — interface contracts stabilize before deep modules change before consumers adapt. Inverting this order causes contract drift and broken consumers.
3. **Consumer impact tracing** — every change radiates outward. Untracked consumers become broken consumers.

## Core Workflow (7 Phases)

```
Scan → Classify → Impact Analysis → Red-First → Implement (by ordering) → Verify → Handoff
```

Do not skip phases because the change seems simple — cross-cutting changes degrade silently when phases are skipped.

### Phase 1: Scan — Detect Affected Files

```bash
# Identify all files referencing the target symbol/module
grep -rl "targetSymbol\|targetModule\|targetInterface" src/ tests/ config/
# Map file dependencies
grep -rl "import.*from.*affected-module" src/ tests/ consumers/
```

**Gate (G1):** Scan must identify ≥2 pans. If only one pan is affected, route to `hm-test-execution` directly.

### Phase 2: Classify — Assign Each File to a Pan

| Pan | Definition | Change rules |
|-----|-----------|--------------|
| **Interface** | Public API, CLI, HTTP routes, exported types/contracts | Must change FIRST in the ordering |
| **Deep Module** | Business logic, services, data layer, core algorithms | Changes AFTER interface contracts stabilize |
| **Test** | Unit, integration, e2e test files | Must fail BEFORE implementation (red-first) |
| **Config** | Environment, feature flags, deployment descriptors | May change in parallel with deep modules |
| **Consumer** | Dependent services, plugins, downstream apps | Impact-assessed; changes ordered last |

Record classification:
```yaml
interface_pan: [file-a.ts, file-b.ts]
deep_module_pan: [file-c.ts, file-d.ts]
test_pan: [file-a.test.ts, file-c.test.ts]
config_pan: [feature-flags.json]
consumer_pan: [consumer-service/src/adapter.ts]
```

### Phase 3: Impact Analysis — Identify Lifecycle Effects

For each affected file, answer:
1. **Which actors use this?** (users, agents, tools, hooks, external services)
2. **What breaks if this changes?** (compile-time, runtime, behavioral)
3. **What must change in lockstep?** (paired interfaces, shared contracts)
4. **What tests will detect regressions?** (existing tests, new tests needed)

```yaml
- file: src/api/routes.ts
  pan: interface
  actors: [HTTP clients, CLI users]
  breaks: [route shape, response schema]
  lockstep: [config/route-map.json, tests/routes.test.ts]
  regression_tests: [tests/routes.test.ts]
- file: src/core/engine.ts
  pan: deep_module
  actors: [routes.ts consumer, worker.ts consumer]
  breaks: [internal behavior, output format]
  lockstep: [src/api/routes.ts]
  regression_tests: [tests/engine.test.ts, tests/integration.test.ts]
```

**Gate (G2):** All actors and lockstep changes must be identified before implementation begins. Missing consumers → broken deployments.

### Phase 4: Red-First Protocol

1. **Write failing tests** for the test-pan files identified in Phase 2.
2. **Verify the failure reason** — the test must fail for the RIGHT reason (missing behavior), not type error, import error, or test setup error.
3. **Record RED evidence** — capture the exact test output showing failure.
4. **If a test passes before implementation** → STOP. Either:
   - The change already exists (scope error)
   - The test does not test the right thing (rewrite it)
   - Heavy mocking is hiding real behavior (use mock-honesty-detection)

**Gate (G3):** Every test-pan file must show RED for the right reason. No exceptions.

### Phase 5: Implement — Change by Ordering (Locked)

1. **Interface contracts first** — public APIs, types, contracts, route signatures
2. **Deep module changes second** — business logic, services, algorithms
3. **Config changes in parallel** with deep module (low risk, no consumer impact)
4. **Test updates third** — modify tests to match new behavior AFTER deep modules stabilize
5. **Consumer updates last** — downstream services, plugins, dependent modules

After each tier, verify:
```bash
# After interface: type-check passes
npm run typecheck
# After deep module: unit tests pass
npm test -- --related
# After consumer: integration tests pass
npm run test:integration
```

**Gate (G4):** If a tier's verification fails, fix within that tier before advancing. Never carry tier-1 breakage into tier-2.

### Phase 6: Verify — Honesty Check

After GREEN (all tests pass):
- [ ] Do any tests pass because of heavy mocking that suppresses real behavior?
- [ ] Would tests fail if mocks were replaced with real implementations?
- [ ] Does at least one real (non-mocked) test exercise the changed behavior end-to-end?

**Gate (G5):** At least one real (non-mocked) test must exercise the changed behavior end-to-end. A test suite that passes entirely through mocks is not evidence of correctness.

### Phase 7: Handoff — Produce Change Packet

```yaml
change_id: "CC-<short-hash>"
pans_affected: [interface, deep_module, test, consumer]
files_changed:
  - path: src/api/routes.ts
    pan: interface
    change: "Added new route parameter"
  - path: src/core/engine.ts
    pan: deep_module
    change: "Updated engine to handle new parameter"
red_evidence: "<path to RED output capture>"
green_evidence: "<path to GREEN output capture>"
honesty_check: pass | fail [details]
rollback_steps:
  - "git revert <commit>" or step-by-step revert
lifecycle_impacts: [consumer-A, hook-B]
verified_by: "<test-runner> <command>"
```

**Gate (G6):** Handoff packet complete with rollback steps. Incomplete handoff blocks downstream.

## Gate System (6 Gates)

| Gate | Phase | Criteria | Blocking? |
|------|-------|----------|-----------|
| G1: Scan | After Phase 1 | ≥2 pans identified | YES — not cross-cutting otherwise |
| G2: Impact | After Phase 3 | All actors and lockstep changes identified | YES — missing consumers break deployments |
| G3: Red | After Phase 4 | Every test-pan file shows RED for right reason | YES — no exceptions |
| G4: Order | During Phase 5 | Changes follow interface→deep→consumer order | YES — wrong order = contract drift |
| G5: Honesty | After Phase 6 | No deceptive test passes confirmed | YES — lying tests block handoff |
| G6: Handoff | After Phase 7 | Handoff packet complete with rollback steps | YES — incomplete handoff blocks downstream |

**All gates are blocking.** A gate failure at any phase stops execution. Fix the failure before advancing.

## Rollback Governance

Every cross-cutting change MUST include rollback steps. Rollback reverses in the opposite order of implementation:

1. Revert consumer changes first (they depend on the change)
2. Revert test changes (they assert the new behavior)
3. Revert deep module changes
4. Revert interface changes last (consumers may depend on old interface)

Rollback must be testable — run the pre-change RED tests after rollback to verify the system returned to its prior state.

## Hivemind Runtime Bindings

| Concern | Hivemind binding |
|---------|-----------------|
| Dispatch a child skill (e.g., `hm-test-execution` for TDD) | `execute-slash-command({ command: "hm-execute", agent: "hm-executor" })` |
| Create a durable change contract | `hivemind-agent-work({ ownerAgent, taskBoundary: "cross-cutting change" })` |
| Track the change in trajectory | `hivemind-trajectory({ rootSessionId, depth: "summary" })` |
| Verify session lifecycle | `hivemind-sdk-supervisor({ sessionId })` |
| Get the central binding registry (for pan-to-skill lookup) | load `hm-platform-contracts` skill |

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|--------------|-----------|------------|
| **Cosmetic RED** | Test fails for wrong reason (syntax, import) | Rewrite test to fail for behavior reason only |
| **Silent Consumer** | Consumer pan not included in scan | Re-run scan with broader patterns |
| **Order Inversion** | Deep module changed before interface | Revert and follow ordering |
| **Mock Curtain** | All tests pass through heavy mocking | Add at least one integration test with real dependencies |
| **RED Skip** | Skipping Phase 4 because "change is simple" | Execute red-first; complexity doesn't exempt governance |
| **Phantom Pan** | File assigned to wrong pan | Re-classify using pan-classification taxonomy |
| **Test-After Implementation** | Tests written to match already-working code | Revert implementation, write failing tests, re-implement |
| **Rollback Absence** | No rollback steps documented | Add rollback steps; test rollback before declaring done |
| **Framework Coupling** | Methodology tied to a specific framework's tooling | Generalize to framework-agnostic; use terminology map for translation |

## Decision Tree — When to Load References

```
Is the change affecting ≥2 pans?
  YES → Continue with this skill
  NO  → Route to hm-test-execution directly

Are you about to change tests?
  YES → Load red-first-protocol FIRST
  NO  → Proceed to pan classification

Are you unsure which pan a file belongs to?
  YES → Read pan-classification
  NO  → Proceed to impact analysis

Are consumers/downstream services involved?
  YES → Read lifecycle-impact-matrix
  NO  → Proceed to implementation

Are tests passing deceptively?
  YES → Read mock-honesty-detection
  NO  → Proceed to verification
```

## Self-Correction

### When RED phase fails for the wrong reason

Detection: Test fails with a compile error, type error, or import error — not a behavior/assertion failure. Recovery: Fix the test setup (imports, types, mocks) until it compiles but FAILS on the assertion. If the test passes after fixing setup, the change already exists — re-check scope.

### When a consumer pan is missed in the scan

Detection: After deployment, a downstream service breaks. Recovery: Re-run Phase 1 scan with broader patterns. Check dependency graphs. Check for indirect consumers via re-exports or facade modules. If consumer is in a different repo, document the cross-repo impact.

### When mock honesty check reveals deceptive tests

Detection: Multiple tests assert `expect(mockFn).toHaveBeenCalled()` but none verify real side effects. Removing `.mockImplementation()` breaks tests. Recovery: Add at least one integration/E2E test with real dependencies. If impractical, document the limitation in the handoff packet as a known risk.

### When ordering rules are violated mid-implementation

Detection: Deep module changes were committed before interface contract changes, causing drift. Recovery: Revert to pre-change state. Re-execute from Phase 4 (Red-First) following the locked order. Document the violation in the handoff packet.

## Verification Checklist

Before declaring a cross-cutting change complete:

- [ ] Scan identified all affected files across ≥2 pans
- [ ] Every file classified to exactly one pan
- [ ] Impact analysis documented all actors, consumers, and lockstep changes
- [ ] RED evidence captured for every test-pan file
- [ ] RED failures are for the right reason (behavioral, not compile errors)
- [ ] Changes implemented in locked order: interface → deep → config → tests → consumers
- [ ] After each tier, type-check and tests pass
- [ ] Mock honesty check completed — no deceptive passes found
- [ ] At least one real (non-mocked) test exercises changed behavior end-to-end
- [ ] Handoff packet produced with change_id, pans_affected, files_changed, red/green evidence
- [ ] Rollback steps documented and testable

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-test-execution` | Owns RED/GREEN/REFACTOR cycle. This skill governs the pan-level impact analysis BEFORE TDD begins. |
| `hm-spec-authoring` | Owns requirement locking and acceptance-test derivation. This skill consumes locked requirements. |
| `hm-loop-completion` | Owns completion signal detection. This skill feeds completion evidence for each pan touched. |
| `hm-loop-phase` | Owns wave-based plan execution. This skill may produce a change plan consumable by phase execution. |
| `hm-arch-refactor` | Owns cosmetic refactor discipline. This skill is for BEHAVIORAL cross-cutting changes; refactors are different. |
| `hm-platform-contracts` | Central skill↔agent binding registry. This skill uses it to look up pan-to-skill mappings. |
