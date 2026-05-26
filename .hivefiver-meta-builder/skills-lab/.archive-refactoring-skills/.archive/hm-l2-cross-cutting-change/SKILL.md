---
name: hm-l2-cross-cutting-change
description: >
  Use when making cross-cutting changes, cross-pane modifications, or breaking changes that span multiple pans/layers of the codebase.
  Trigger for "modify across pans", "multiple files affected", "red first", "test first change", "lifecycle impact",
  "mock honesty", "pan impact analysis", "ordering governance", "cross-pane modification", "impact analysis across modules",
  "deceptive tests", "change lifecycle", "dependency ordering", "file lifecycle impact", "consumer impact analysis",
  or when changes touch test layer AND interface layer AND deep module layer simultaneously.
  NOT for single-file changes, single-pan edits, cosmetic refactors, or changes where tests are written after implementation.
metadata:
  layer: "2"
  role: "domain-execution"
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

# Cross-Cutting Change Governance

## The Iron Law

```
A change spanning ≥2 pans MUST be red-first. A test that passes before implementation is lying.
```

## Overview

Govern modifications that span multiple pans, layers, or modules of a codebase. When a feature change simultaneously affects the test layer, the interface layer, and the deep module layer, standard edit workflows fail because they do not account for lifecycle impacts, actor/consumer dependencies, and ordering constraints. This skill enforces:

1. **Red-first verification** — tests MUST fail before implementation changes begin (proving the change is real, not cosmetic)
2. **Lifecycle impact checking** — identifying which actors and consumers are affected across pans
3. **Ordering governance** — interface contracts before deep modules before consumers before tests
4. **Non-deceptive testing** — detecting when tests pass deceptively (e.g., heavy mocking that hides real failures)

This skill routes deeper guidance to:
- `hm-test-driven-execution` — owns RED/GREEN/REFACTOR cycle execution
- `hm-spec-driven-authoring` — owns requirement locking before implementation

This package synthesizes three inspected third-party patterns:

| Source pattern | Adopt / adapt decision | Local transformation |
|---|---|---|
| `addyosmani/agent-skills@test-driven-development` | Adopt red-first discipline, Prove-It bug-fix pattern; adapt browser-specific tooling. | Extended to multi-pan scope with lifecycle impact matrix and ordering governance. |
| `helderberto/skills@tdd` | Adopt one-change-at-a-time vertical discipline and public-interface guard. | Extended with pan-classification taxonomy and mock-honesty detection across layers. |
| `kw12121212/auto-spec-driven@spec-driven-sync-specs` | Adapt impact mapping metadata pattern. | Replaced with portable pan-impact matrix compatible with any project structure. |

## On Load

1. Read `references/pan-classification.md` — how to classify files into pans (interface, deep module, test, config, consumer)
2. Read `references/red-first-protocol.md` — step-by-step red-first verification

When mock-based tests are involved, also read `references/mock-honesty-detection.md`. When downstream consumers must be assessed, read `references/lifecycle-impact-matrix.md`.

## Entry Gate

Proceed only when the change satisfies ALL of:

- [ ] The change affects **2 or more pans** (as defined in `references/pan-classification.md`)
- [ ] At least one requirement, bug reproduction, or behavior contract is documented
- [ ] The scope boundary (which pans are IN vs OUT) is declared
- [ ] No implementation code for this change has been written yet — if it has, revert it first for a true RED cycle
- [ ] Required neighboring skill is loaded: `hm-test-driven-execution` (for test execution) or `hm-spec-driven-authoring` (if requirements are ambiguous)

If requirements are ambiguous, stop and hand off to `hm-spec-driven-authoring` before returning.

## Boundary Rules

| Nearby workflow | Boundary |
|---|---|
| `hm-test-driven-execution` | Owns RED/GREEN/REFACTOR cycle execution. This skill governs the pan-level impact analysis and ordering BEFORE TDD begins. |
| `hm-spec-driven-authoring` | Owns requirement locking and acceptance-test derivation. This skill consumes locked requirements. |
| `hm-completion-looping` | Owns completion signal detection. This skill feeds completion evidence for each pan touched. |
| `hm-phase-execution` | Owns wave-based plan execution. This skill may produce a change plan consumable by phase execution. |
| Single-file changes | Not cross-cutting. Use `hm-test-driven-execution` directly. |
| Cosmetic refactors | Not behavior-changing. Use `hm-refactor` directly. |
| Post-implementation tests | Not red-first. Do not claim cross-cutting governance if tests were written after code. |

## Core Workflow

Follow this sequence. Do not skip phases because the change seems simple — cross-cutting changes degrade silently when phases are skipped.

```text
Scan → Classify → Impact Analysis → Red-First → Implement (by ordering) → Verify → Handoff
```

### Phase 1: Scan — Detect Affected Files

Run before touching any file. Use glob and grep to discover all files in the blast radius:

```bash
# Identify all files referencing the target symbol/module
grep -rl "targetSymbol\|targetModule\|targetInterface" src/ tests/ config/
# Map file dependencies
grep -rl "import.*from.*affected-module" src/ tests/ consumers/
```

Record the **full file list** in a scan artifact. Do not filter or assume some files are safe — false negatives in scan phase cause broken consumers downstream.

**Gate:** The scan must identify ≥2 pans. If only one pan is affected, this is not a cross-cutting change — route to `hm-test-driven-execution` directly.

### Phase 2: Classify — Assign Each File to a Pan

Using `references/pan-classification.md`, classify every scanned file into exactly one pan:

| Pan | Definition | Change rules |
|-----|-----------|--------------|
| **Interface** | Public API, CLI, HTTP routes, exported types/contracts | Must change FIRST in the ordering |
| **Deep Module** | Business logic, services, data layer, core algorithms | Changes AFTER interface contracts stabilize |
| **Test** | Unit, integration, e2e test files | Must fail BEFORE implementation (red-first) |
| **Config** | Environment, feature flags, deployment descriptors | May change in parallel with deep modules |
| **Consumer** | Dependent services, plugins, downstream apps | Impact-assessed; changes ordered last |

Record the classification in a pan map artifact:
```yaml
interface_pan: [file-a.ts, file-b.ts]
deep_module_pan: [file-c.ts, file-d.ts]
test_pan: [file-a.test.ts, file-c.test.ts]
config_pan: [feature-flags.json]
consumer_pan: [consumer-service/src/adapter.ts]
```

### Phase 3: Impact Analysis — Identify Lifecycle Effects

For each affected pan, identify the actors and consumers impacted. Read `references/lifecycle-impact-matrix.md` for the full taxonomy.

Answer these questions for each affected file:
1. **Which actors use this?** (users, agents, tools, hooks, external services)
2. **What breaks if this changes?** (compile-time, runtime, behavioral)
3. **What must change in lockstep?** (paired interfaces, shared contracts)
4. **What tests will detect regressions?** (existing tests, new tests needed)

Record impacts in a matrix:

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

**Gate:** Impact analysis must identify all actors and lockstep changes before implementation begins. Missing consumers → broken deployments.

### Phase 4: Red-First Protocol

Before writing ANY implementation code, follow the protocol in `references/red-first-protocol.md`. Summary:

1. **Write failing tests** for the test pan files identified in Phase 2
2. **Verify the failure reason** — the test must fail for the RIGHT reason (the missing/unimplemented behavior), not for a type error, import error, or test setup error
3. **Record RED evidence** — capture the exact test output showing failure
4. **If test passes without implementation** → STOP. Either:
   - The change already exists (scope error)
   - The test is not testing the right thing (rewrite it)
   - Heavy mocking is hiding the real behavior (use `references/mock-honesty-detection.md`)

**Gate:** Every test-pan file must show RED before implementation. No exceptions. If ANY test passes before implementation, the red-first protocol is violated — stop and fix.

### Phase 5: Implement — Change by Ordering

Implement changes in this locked order. Do not skip tiers:

**Ordering (non-negotiable):**

1. **Interface contracts first** — public APIs, types, contracts, route signatures
2. **Deep module changes second** — business logic, services, algorithms
3. **Config changes in parallel** with deep module (low risk, no consumer impact)
4. **Test updates third** — modify tests to match new behavior AFTER deep modules stabilize
5. **Consumer updates last** — downstream services, plugins, dependent modules

**Why this order:** Interface contracts are the public face. Deep modules implement against contracts. Changing deep modules first and then interfaces causes contract drift. Consumers adapt last because their integration surface depends on stable interfaces.

After each tier, verify:

```bash
# After interface changes: type-check passes
npm run typecheck
# After deep module changes: unit tests pass (for changed modules)
npm test -- --related
# After consumer changes: integration tests pass
npm run test:integration
```

**Gate:** If a tier's verification fails, fix within that tier before advancing. Never carry tier-1 breakage into tier-2.

### Phase 6: Verify — Test Honesty Check

After GREEN (all tests pass), run the mock-honesty detection from `references/mock-honesty-detection.md`.

Checklist:
- [ ] Do any tests pass because of heavy mocking that suppresses real behavior?
- [ ] Would tests fail if mocks were replaced with real implementations?
- [ ] Are there tests that assert mock call counts but never verify real side effects?
- [ ] Does removing `.mockImplementation()` or `.mockReturnValue()` break any test?
- [ ] Are there tests for error paths that never actually exercise real failure modes?

Flag any deceptive pass as a blocked handoff — report which tests are lying and why.

**Gate:** At least one real (non-mocked) test must exercise the changed behavior end-to-end. A test suite that passes entirely through mocks is not evidence of correctness.

### Phase 7: Handoff — Produce Change Packet

Produce a handoff packet for downstream skills (`hm-completion-looping`, `hm-phase-execution`):

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

## Gate System

| Gate | Phase | Criteria | Blocking? |
|------|-------|----------|-----------|
| G1: Scan Gate | After Phase 1 | ≥2 pans identified | YES — not cross-cutting otherwise |
| G2: Impact Gate | After Phase 3 | All actors and lockstep changes identified | YES — missing consumers break deployments |
| G3: Red Gate | After Phase 4 | Every test-pan file shows RED for right reason | YES — no exceptions |
| G4: Order Gate | During Phase 5 | Changes follow interface→deep→consumer order | YES — wrong order = contract drift |
| G5: Honesty Gate | After Phase 6 | No deceptive test passes confirmed | YES — lying tests block handoff |
| G6: Handoff Gate | After Phase 7 | Handoff packet complete with rollback steps | YES — incomplete handoff blocks downstream |

**All gates are blocking.** A gate failure at any phase stops execution. Fix the failure before advancing.

## Rollback Plan Requirement

Every cross-cutting change MUST include rollback steps in the handoff packet. Rollback reverses the change in the correct order:

1. Revert consumer changes first (they depend on the change)
2. Revert test changes (they assert the new behavior)
3. Revert deep module changes
4. Revert interface changes last (consumers may depend on old interface)

Rollback must be testable — run the pre-change RED tests after rollback to verify the system returned to its prior state.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Cosmetic RED** — test fails for wrong reason (syntax error, import error) | RED output shows compiler/import failure, not behavior failure | Rewrite test to fail for behavior reason only |
| **Silent Consumer** — consumer pan not included in scan | Consumer breaks after change deploys | Re-run Phase 1 scan with broader patterns; check dependency graphs |
| **Order Inversion** — deep module changed before interface | Interface and deep module drift out of sync | Revert and follow ordering: interface → deep → consumer |
| **Mock Curtain** — all tests pass through heavy mocking | Honesty check reveals 0 real-behavior tests | Add at least one integration test with real dependencies |
| **RED Skip** — skipping Phase 4 because "change is simple" | No RED evidence in handoff packet | Execute red-first protocol; complexity doesn't exempt governance |
| **Phantom Pan** — file assigned to wrong pan | Changes follow wrong ordering tier | Re-classify using `references/pan-classification.md` taxonomy |
| **Test-After Implementation** — tests written to match already-working code | Tests pass on first run, no RED phase recorded | Revert implementation, write failing tests, re-implement |
| **Rollback Absence** — no rollback steps documented | Handoff packet missing rollback_steps field | Add rollback steps; test rollback before declaring done |

## Decision Tree — When to Load References

```
Is the change affecting ≥2 pans?
  YES → Continue with this skill
  NO → Route to hm-test-driven-execution directly

Are you about to change tests?
  YES → Load references/red-first-protocol.md FIRST
  NO → Proceed to pan classification

Are you unsure which pan a file belongs to?
  YES → Read references/pan-classification.md
  NO → Proceed to impact analysis

Are consumers/downstream services involved?
  YES → Read references/lifecycle-impact-matrix.md
  NO → Proceed to implementation

Are tests passing deceptively (passing through mocks when they should fail)?
  YES → Read references/mock-honesty-detection.md
  NO → Proceed to verification
```

## Self-Correction

### When RED phase fails for the wrong reason
**Detection:** Test fails with a compile error, type error, or import error — not a behavior/assertion failure.
**Recovery:** The RED failure must prove the behavior is MISSING, not that code doesn't compile. Fix the test setup (imports, types, mocks) until it compiles but FAILS on the assertion. If the test passes after fixing setup, the change already exists — re-check scope.

### When a consumer pan is missed in the scan
**Detection:** After deployment, a downstream service breaks because it depended on the changed interface. Scan only found 2 pans but there should have been 3+.
**Recovery:** Re-run Phase 1 scan with broader patterns. Check dependency graphs (npm/pip/cargo dependency trees). Check for indirect consumers via re-exports or facade modules. If consumer was in a different repo, document the cross-repo impact.

### When mock honesty check reveals deceptive tests
**Detection:** Multiple tests assert `expect(mockFn).toHaveBeenCalled()` but none verify real side effects. Removing `.mockImplementation()` breaks tests.
**Recovery:** Add at least one integration/E2E test with real dependencies. If integration test is impractical (external service, cost, flakiness), document the limitation in the handoff packet as a known risk. Never claim PASS if all tests are mock-only.

### When ordering rules are violated mid-implementation
**Detection:** Deep module changes were committed before interface contract changes, causing drift.
**Recovery:** Revert to pre-change state. Re-execute from Phase 4 (Red-First) following the locked order: interface → deep module → config → tests → consumers. Document the violation in the handoff packet.

## Verification Checklist

Before declaring a cross-cutting change complete:

- [ ] Scan identified all affected files across ≥2 pans
- [ ] Every file classified to exactly one pan (interface/deep_module/test/config/consumer)
- [ ] Impact analysis documented all actors, consumers, and lockstep changes
- [ ] RED evidence captured for every test-pan file
- [ ] RED failures are for the right reason (behavior, not compile errors)
- [ ] Changes implemented in locked order: interface → deep → config → tests → consumers
- [ ] After each tier, type-check and tests pass
- [ ] Mock honesty check completed — no deceptive passes found
- [ ] At least one real (non-mocked) test exercises changed behavior end-to-end
- [ ] Handoff packet produced with change_id, pans_affected, files_changed, red/green evidence
- [ ] Rollback steps documented and testable
- [ ] Required neighboring skills loaded (hm-test-driven-execution or hm-spec-driven-authoring)
