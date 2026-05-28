# Phase C6: Architectural Refactoring — Specification

**Created:** 2026-05-28
**Ambiguity score:** 0.12 (gate: ≤ 0.20)
**Requirements:** 6 locked

## Goal

Extract session-tracker monolithic module (18,207 LOC) into ≤3 dedicated classes with DelegationStatusReader interface; group plugin.ts tool registrations by domain with ≤150 LOC per group.

## Background

The session-tracker code in src/features/session-tracker/ contains 18,207 LOC in a single index.ts file acting as a "god module" that handles event capture, persistence, delegation, recovery, and tool delegation. The plugin.ts file (554 LOC) monolithically registers all tools without domain separation. This creates tight coupling, makes testing difficult, and prevents focused refactoring of individual components. The DelegationStatusReader interface currently does not exist, despite dual persistence format (JSON file + directory state) being the current reality.

## Requirements

1. **Session-tracker class decomposition**: Split session-tracker/index.ts into ≤3 dedicated classes.
   - Current: 18,207 LOC in single session-tracker/index.ts file
   - Target: ≤3 separate files (e.g., session-tracker/event-capture.ts, session-tracker/persistence.ts, session-tracker/delegation-status.ts), each ≤4,000 LOC
   - Acceptance: Grep confirms ≤3 .ts files under src/features/session-tracker/ with combined LOC ≤18,207; each file has ≤4,000 LOC

2. **DelegationStatusReader interface**: Create abstract interface that abstracts persistence format for DelegationStatusReader class.
   - Current: No abstraction — code reads/writes both JSON file and directory state directly
   - Target: DelegationStatusReader interface defined with abstract methods for reading/writing persistence format; at least one concrete implementation exists
   - Acceptance: DelegationStatusReader interface exists in src/coordination/delegation/ and has ≥1 implementation; interface has ≥2 abstract methods

3. **Plugin.ts domain grouping**: Group tool registrations in plugin.ts by domain with ≤150 LOC per group.
   - Current: 554 LOC monolithic tool registration file
   - Target: 3+ domain groups (e.g., "tools/coordination/", "tools/delegation/", "tools/session/") each ≤150 LOC
   - Acceptance: plugin.ts contains ≥3 domain groups, each group has ≤150 LOC

4. **Plugin.ts domain group creation**: Create separate domain files for tool registrations with proper exports.
   - Current: All tool registrations in single plugin.ts file
   - Target: Separate files (e.g., src/plugin/coordination.ts, src/plugin/delegation.ts, src/plugin/session/) with proper exports
   - Acceptance: Each new file has ≥1 tool registration and ≤150 LOC

5. **Event handler class extraction**: Extract event handlers from god module into dedicated class.
   - Current: Event handlers scattered in single file (18,207 LOC)
   - Target: Dedicated class (e.g., EventHandlerClass) with all event handler logic
   - Acceptance: Dedicated class exists with ≥10 event handler methods; class has ≤4,000 LOC

6. **Type safety verification**: All refactored code must pass type-check with no errors.
   - Current: No explicit type-check for refactor
   - Target: Full type-check passes after refactor
   - Acceptance: `npm run typecheck` passes with exit code 0

## Boundaries

**In scope:**
- src/features/session-tracker/ refactoring (event handlers, persistence, delegation)
- src/plugin.ts reorganization into domain groups
- DelegationStatusReader interface creation
- Type-check verification for all changes

**Out of scope:**
- src/hooks/* refactoring (covered by Phase 28)
- Session-view tool rewriting (covered by Phase 30)
- Plugin.ts functionality changes (covered by Phase 24.3)

## Constraints

- Session-tracker total LOC must remain ≤18,207
- Each refactored class must be ≤4,000 LOC
- Plugin.ts domain groups must be ≤150 LOC each
- All code must pass type-check after refactor
- No breaking changes to public API

## Acceptance Criteria

- [ ] session-tracker decomposed into ≤3 dedicated classes, each ≤4,000 LOC
- [ ] DelegationStatusReader interface exists with ≥2 abstract methods
- [ ] At least one implementation of DelegationStatusReader exists
- [ ] plugin.ts grouped into ≥3 domain groups, each ≤150 LOC
- [ ] Each domain group has ≥1 tool registration
- [ ] Full type-check passes with exit code 0

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                    |
|--------------------|-------|------|--------|-------------------------------------------|
| Goal Clarity       | 0.92  | 0.75 | ✓      | Goal derived directly from ROADMAP.md      |
| Boundary Clarity   | 0.95  | 0.70 | ✓      | Explicit in/out-of-scope lists            |
| Constraint Clarity | 0.80  | 0.65 | ✓      | All constraints derived from roadmap      |
| Acceptance Criteria| 0.85  | 0.70 | ✓      | 6 pass/fail criteria, all testable        |
| **Ambiguity**      | 0.12  | ≤0.20| ✓      |                                           |

## Interview Log

| Round | Perspective    | Question summary              | Decision locked                         |
|-------|----------------|------------------------------|-----------------------------------------|
| 1     | Researcher     | What exists in session-tracker? | 18,207 LOC in single index.ts           |
| 2     | Researcher     | What's the target state?       | ≤3 files, each ≤4,000 LOC             |
| 2     | Simplifier     | Minimum viable refactor?      | Class extraction + interface + grouping |
| 3     | Boundary Keeper| What's NOT this phase?         | Hooks (P28), Session-view (P30), Plugin functionality (P24.3) |
| 4     | Failure Analyst| What goes wrong on failure?    | Breaking changes to public API         |
| 5     | Seed Closer    | What makes constraints clear?  | LOC limits, type-check requirement      |
| 6     | Seed Closer    | What would you regret not specify? | LOC limits, interface abstraction |

---

*C6-Architectural-Refactoring*
*Spec created: 2026-05-28*
*Next step: /gsd-discuss-phase C6 — implementation decisions (class design, domain group naming, interface methods)*
