---
name: cross-cutting-change-mgmt
description: >
  Use when making cross-cutting changes, cross-pane modifications, framework migrations,
  or breaking changes that span multiple layers or frameworks (GSD, BMAD, Hivemind, or other).
  Triggers on: "cross-cutting change", "cross-pane change", "multi-layer change",
  "framework migration", "breaking change across frameworks", "change impact analysis",
  "cross-framework change", "multi-pane impact", "test-first change ordering",
  "dependency ordering across layers", "consumer impact tracing",
  "interface-first change", "ordered change management".
  NOT for single-layer changes, single-framework refactors, or cosmetic edits.
  Framework-agnostic — works across GSD, BMAD, Hivemind, or any project governance framework.
---

# Cross-Cutting Change Management

## Iron Law

```
Changes spanning multiple layers MUST follow ordered governance.
A test written after implementation is a description, not a guard.
```

## Overview

Govern changes that span multiple architectural layers or frameworks. When a feature change simultaneously affects test infrastructure, interface contracts, and deep module logic — or when migrating behavior across framework boundaries — standard edit workflows fail because they do not account for lifecycle impacts, actor/consumer dependencies, and ordering constraints.

This skill is **framework-agnostic**. It provides the methodology for ordering, impact analysis, and consumer tracing without depending on any specific framework's tooling or conventions. For framework-specific application, see the terminology map in `references/terminology-map.md`.

The methodology rests on three pillars:

1. **Red-first verification** — failing tests prove the change is real, not cosmetic. A test that passes before implementation is either wrong or redundant.
2. **Ordering governance** — interface contracts stabilize before deep modules change before consumers adapt. Inverting this order causes contract drift and broken consumers.
3. **Consumer impact tracing** — every change radiates outward. Untracked consumers become broken consumers.

## When to Use

Use this skill when ALL of the following apply:

- [ ] The change affects **2 or more layers** (test layer + implementation layer; interface + deep module; or ≥2 framework domains)
- [ ] The change involves **behavioral modification**, not cosmetic refactoring
- [ ] Consumers (downstream modules, dependent services, external callers) exist and may be affected

Do NOT use this skill for:
- Single-layer changes, single-file edits, or cosmetic refactors — use standard TDD
- Framework-specific tool configuration — consult that framework's reference
- Code review or audit — use review skills

## Entry Gate

Proceed only when:

- [ ] The scope boundary is declared: which layers are IN vs OUT
- [ ] At least one behavior contract, requirement, or bug reproduction is documented
- [ ] No implementation code has been written yet — revert if it has (for a true RED cycle)
- [ ] The framework context is identified (GSD, BMAD, Hivemind, or other)

If requirements are ambiguous, stop and clarify before proceeding. Cross-cutting changes made against unclear requirements produce changes that are hard to reverse.

## Core Workflow

Follow this sequence. Do not skip phases — the ordering is the governance.

```text
Scan → Classify → Impact Analysis → Red-First → Implement (by ordering) → Verify → Handoff
```

### Phase 1: Scan — Detect Affected Files

Identify every file in the blast radius. Use search tools to find all references to the target symbol, module, or interface.

**Approach:**
1. Search for the target symbol across the entire project
2. Map file dependencies — who imports/requires the affected module
3. Check for indirect consumers via re-exports or facade modules
4. Record the full file list — do not filter or assume files are safe

**Gate:** The scan must identify ≥2 layers. If only one layer is affected, this is not a cross-cutting change.

### Phase 2: Classify — Assign Each File to a Layer

Classify every scanned file into exactly one layer. The specific layer names vary by framework — use the terminology map in `references/terminology-map.md` to identify the correct taxonomy for your framework.

**Universal layer taxonomy:**

| Layer | Definition | Change rules |
|-------|-----------|--------------|
| **Interface / Contract** | Public API, types, route signatures, CLI surface, exported contracts | Change FIRST in ordering |
| **Deep Module / Implementation** | Business logic, services, data layer, core algorithms | Change AFTER interface contracts stabilize |
| **Test / Verification** | Unit, integration, and end-to-end test files | Must fail BEFORE implementation (red-first) |
| **Config / Environment** | Feature flags, deployment descriptors, environment settings | May change in parallel with deep modules |
| **Consumer / Downstream** | Dependent services, plugins, downstream applications, external callers | Impact-assess; change LAST |

Record the classification. Do not assign a file to multiple layers — pick the primary role.

### Phase 3: Impact Analysis — Identify Lifecycle Effects

For each affected file, answer:

1. **Which actors use this?** (users, services, agents, tools, external systems)
2. **What breaks if this changes?** (compile-time, runtime, behavioral, contract)
3. **What must change in lockstep?** (paired interfaces, shared contracts, tight coupling)
4. **What tests detect regressions?** (existing tests, new tests needed)

Document impacts. A missed consumer is a broken consumer.

**Gate:** All actors and lockstep changes must be identified before implementation begins.

### Phase 4: Red-First Protocol

Before writing ANY implementation code:

1. **Write failing tests** for the test-layer files identified in Phase 2
2. **Verify the failure reason** — the test must fail due to the missing or changed behavior, not due to syntax errors, import errors, or test setup issues
3. **Record RED evidence** — capture test output showing the failure
4. **If a test passes before implementation** → STOP. Either:
   - The change already exists (scope error)
   - The test does not test the right thing (rewrite it)
   - Heavy mocking is hiding real behavior (reduce mocking)

**Gate:** Every test-layer file must show RED before implementation. No exceptions.

Read `references/philosophy.md` for the reasoning behind this non-negotiable requirement.

### Phase 5: Implement — Change by Ordering

Implement changes in this locked order:

1. **Interface / Contract changes first** — public APIs, types, contracts, route signatures
2. **Deep Module / Implementation changes second** — business logic, services, algorithms
3. **Config / Environment changes** — in parallel with deep modules (low risk)
4. **Test updates third** — modify tests to match new behavior AFTER deep modules stabilize
5. **Consumer / Downstream updates last** — dependent services, plugins, external callers

**Why this order:** Interface contracts define the public face. Deep modules implement against contracts. Changing deep modules first causes contract drift. Consumers adapt last because their integration surface depends on stable interfaces.

After each tier, verify correctness before advancing.

**Gate:** Never carry tier-1 breakage into tier-2. Fix within the current tier first.

### Phase 6: Verify — Honesty Check

After GREEN (all tests pass), verify the tests are honest:

- [ ] Do any tests pass only because of heavy mocking that suppresses real behavior?
- [ ] Would tests fail if mocks were replaced with real implementations?
- [ ] Are there tests that assert mock call counts but never verify real side effects?
- [ ] Does at least one real (non-mocked) test exercise the changed behavior end-to-end?

A test suite that passes entirely through mocks is not evidence of correctness.

**Gate:** At least one real test must exercise the changed behavior end-to-end.

### Phase 7: Handoff — Produce Change Packet

Document the change for downstream consumers and future maintainers:

- **What changed** — summary of the behavioral modification
- **Which layers were affected** — with the classification from Phase 2
- **Which files were changed** — full list with per-file description
- **RED evidence** — test failure output from Phase 4
- **GREEN evidence** — test passing output from Phase 6
- **Rollback steps** — how to reverse the change in the correct order
- **Consumer impact** — which downstream consumers were affected and how

## Rollback Governance

Every cross-cutting change must include rollback steps. Rollback reverses in the opposite order of implementation:

1. Revert consumer changes first (they depend on the change)
2. Revert test changes (they assert the new behavior)
3. Revert deep module changes
4. Revert interface changes last (consumers may depend on old interface)

Rollback must be testable — run the pre-change RED tests after rollback to verify the system returned to its prior state.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Cosmetic RED** — test fails for wrong reason (syntax error, import error) | RED output shows compiler/import failure, not behavioral failure | Rewrite test to fail for behavioral reason only |
| **Silent Consumer** — consumer layer not included in scan | Consumer breaks after change deploys | Re-run scan with broader patterns; check dependency graphs |
| **Order Inversion** — implementation changed before interface | Interface and implementation drift out of sync | Revert and follow ordering: interface → implementation → consumer |
| **Mock Curtain** — all tests pass through heavy mocking | Honesty check in Phase 6 reveals zero real-behavior tests | Add at least one integration test with real dependencies |
| **RED Skip** — skipping Phase 4 because "change is simple" | No RED evidence in handoff packet | Execute red-first protocol; simplicity does not exempt governance |
| **Test-After Implementation** — tests written to match already-working code | Tests pass on first run, no RED phase recorded | Revert implementation, write failing tests, re-implement |
| **Rollback Absence** — no rollback steps documented | Handoff packet missing rollback information | Add rollback steps; test rollback before declaring done |
| **Framework Coupling** — methodology tied to a specific framework's tooling | Skill body references framework-specific commands or paths | Generalize to framework-agnostic language; use terminology map for translation |

## Self-Correction

### When RED phase fails for the wrong reason
**Detection:** Test fails with a compile error, type error, or import error — not a behavior/assertion failure.
**Recovery:** The RED failure must prove the behavior is MISSING, not that code does not compile. Fix the test setup (imports, types, mocks) until it compiles but FAILS on the assertion. If the test passes after fixing setup, the change already exists — re-check scope.

### When a consumer layer is missed in the scan
**Detection:** After deployment, a downstream service breaks because it depended on the changed interface. Scan only found 2 layers but there should have been 3+.
**Recovery:** Re-run scan with broader patterns. Check dependency trees. Check for indirect consumers via re-exports or facade modules. If consumer is in a different repository, document the cross-repo impact.

### When ordering rules are violated mid-implementation
**Detection:** Implementation changes were committed before interface contract changes, causing drift.
**Recovery:** Revert to pre-change state. Re-execute from Phase 4 (Red-First) following the locked order. Document the violation in the handoff packet.

### When tests deceive through mocking
**Detection:** Multiple tests assert `expect(mockFn).toHaveBeenCalled()` but none verify real side effects. Removing mock implementations breaks tests.
**Recovery:** Add at least one integration test with real dependencies. If integration test is impractical (external service, cost, flakiness), document the limitation in the handoff packet as a known risk. Never claim PASS if all tests are mock-only.

## Verification Checklist

Before declaring a cross-cutting change complete:

- [ ] Scan identified all affected files across ≥2 layers
- [ ] Every file classified to exactly one layer
- [ ] Impact analysis documented all actors, consumers, and lockstep changes
- [ ] RED evidence captured for every test-layer file
- [ ] RED failures are for the right reason (behavioral, not compile errors)
- [ ] Changes implemented in locked order: interface → implementation → config → tests → consumers
- [ ] After each tier, verification passes
- [ ] Honesty check completed — no deceptive passes found
- [ ] At least one real (non-mocked) test exercises changed behavior end-to-end
- [ ] Handoff packet produced with change summary, affected layers, file list, red/green evidence
- [ ] Rollback steps documented and testable

## References

### Framework-Agnostic Methodology

- **`references/philosophy.md`** — why ordered, test-first change management matters; the reasoning behind the red-first protocol, ordering governance, and consumer impact tracing. Read before implementing your first cross-cutting change.

### Cross-Framework Terminology

- **`references/terminology-map.md`** — maps cross-cutting concepts across GSD, BMAD, and Hivemind frameworks. When the methodology references "layers" or "pans," use this map to translate to your framework's specific taxonomy.
