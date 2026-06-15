# tests/AGENTS.md

Scope: rules that apply when reading, writing, or auditing code under `tests/`. Inherits the root `AGENTS.md` rules; this file deepens the test discipline, evidence labels, and public-interface boundaries. Full governance: `.hivemind/planning/test-driven-governance-2026-06-05/GENERIC-TEST-DRIVEN-GUIDE.md`.

## Test Framework

- **Framework:** Vitest 4.1.x (configured in `vitest.config.ts`).
- **Globals enabled:** `describe`, `it`, `expect`, `beforeEach`, `beforeAll`, `afterEach`, `afterAll` are available without imports.
- **Setup file:** `vitest.setup.ts` (loaded via `setupFiles`). Place global mocks, environment polyfills, or per-test fixes here.
- **Coverage provider:** `v8` (configured in `vitest.config.ts`).
- **Test pattern:** `tests/**/*.test.ts` and `eval/**/*.test.ts`. Anything else is ignored.
- **Watch mode:** `npm run test:watch` for TDD.
- **Single-pass mode:** `npm test` for CI and gate runs.

## Test Naming & File Layout

- **File name:** `*.test.ts`. Suffix only — no `.spec.ts`, no `.test.js`.
- **Mirror structure:** A test for `src/hooks/guards/foo.ts` lives at `tests/hooks/guards/foo.test.ts`. The mirroring is required for the tree to be navigable.
- **Describes:** Use the file path or module name as the top-level `describe`. Example: `describe("src/hooks/guards/foo", () => { ... })`.
- **Test names:** Imperative mood, observable behavior, not implementation. `"rejects delegation when session is not found"`, not `"tests delegation"`.

## Test-First Cycle (RED → GREEN → Coverage → REFACTOR)

Every executable behavior change MUST follow this cycle. No exceptions, no "I'll add the test later" — the test IS the spec.

1. **RED.** Write a test that asserts the new behavior. The test MUST fail with a `runtime-truthful` failure (not a compile error, not a missing-import error). Verify the failure matches the user-visible bug or the missing capability.
2. **GREEN.** Make the smallest possible implementation change to turn the test green. Do not refactor. Do not add unrelated improvements. Do not add future-proofing.
3. **Coverage.** Run `npm run test:coverage` and confirm the change is covered at the threshold level. Report the command, percentage, and date.
4. **REFACTOR.** Only after green + coverage are confirmed. A refactor that regresses green is a bug, not a refactor — split it into its own cycle.

**One test at a time.** Each behavior is exercised by exactly one new failing test before the next is written. Bundles of failing tests written before any implementation hide which behavior drove which design.

## Evidence Labels (binding)

Every test result carries one of four labels. The Evidence Truth Gate (`gate-evidence-truth`) refuses to pass without an evidence label on every test in the changed surface.

| Label | Definition | Use when |
|-------|------------|----------|
| `runtime-truthful` | Test exercises real behavior through a public seam | **Required** for any acceptance claim on tool, hook, plugin, or state-store changes |
| `transport-mocked` | Real behavior through a public seam; transport replaced by in-process adapter | Acceptable for SDK wrapper changes when the SDK itself is not in scope |
| `mock-heavy` | Substitutes enough internals that any implementation would pass | **Insufficient alone** — must be paired with `runtime-truthful` or `transport-mocked` |
| `manual-only` | Verified by a human, not by an executable test | **Insufficient alone** — must be paired with stronger evidence |

`mock-heavy` and `manual-only` cannot close `runtime-truthful` acceptance criteria. They may be combined with stronger evidence, never used alone.

## Public-Interface Discipline

Tests assert against externally observable surfaces, NOT internals. The binding public seams for this project:

- **Tools** (`src/tools/`): the `tool()` factory's execute function, the JSON envelope returned to the agent, and the error envelope (`code`, `message`, optional `data`).
- **Hooks** (`src/hooks/`): the mutation passed to the next middleware in the chain, the early return value, and the side effect on shared state.
- **Plugins** (`src/plugin.ts`): the public `Plugin` interface assembled, including the registration of tools, hooks, and config.
- **State stores** (`src/task-management/`, `src/features/session-tracker/`): the value read via the public `get`/`read` method, NOT the internal `Map` or file path.
- **Session lifecycle** (`src/task-management/lifecycle/`): the phase transitions observed via the public lifecycle manager API, NOT the internal `state.ts` module.

**Mocking internals is acceptable only when the helper is itself the slice's public contract.** When a test needs to mock several internals to pass, the public seam is in the wrong place — pause and re-design.

## Coverage Thresholds (CI gate)

Configured in `vitest.config.ts`. The build fails if coverage drops below any threshold.

| Type | Threshold |
|------|-----------|
| Statements | 75% |
| Branches | 62% |
| Functions | 80% |
| Lines | 77% |

These floors were calibrated against a Node 20 green-bar measurement (89.94 / 79.25 / 92.38 / 90.95 for the Node 20 baseline). Floors sit ~5pp below actual to absorb normal churn. **Do not lower thresholds** without an explicit audit amendment.

## Coverage States (binding)

Coverage claims must report one of:

- **`PASS`** — `npm run test:coverage` ran and produced a percentage. Report the command, percentage, and date.
- **`PARTIAL`** — Behavioral tests ran but coverage command did not finish or only covered a subset. Report what ran and what was missing.
- **`MISSING`** — Tooling absent. Report the gap. Do not estimate.
- **`BLOCKED`** — Setup or dependency failure prevented coverage. Report the command attempted and the failure.

A high coverage percentage on a slice with invalid RED is still a blocked slice. Coverage is necessary, not sufficient.

## Test-Size Labels (binding)

Every test is labeled by size, and the size determines what evidence must accompany the commit.

- **`small`** — Single unit, public seam, focused command runs in milliseconds. Evidence: focused test command output.
- **`medium`** — Multiple modules or a real persistence or process boundary. Evidence: focused test command output + a one-line setup/teardown note.
- **`large`** — End-to-end or browser-driven. Evidence: focused test command output + environment bring-up, runtime command, and a user-visible behavior note.

## Bug Fix Path — Prove-It

Defect work follows the reproduction-first path. The reproduction is the RED phase.

1. **Reproduce.** Write a test that exhibits the user-visible defect.
2. **Prove failure matches.** The test must fail for the same reason the user observed, not an unrelated error.
3. **Minimal fix.** The smallest change that turns the test green.
4. **Prove fixed.** Run the test, confirm green, AND run the surrounding test surface to confirm no regression.
5. **Preserve.** The reproduction test stays in the suite as a permanent regression guard.

The reproduction test is a non-negotiable deliverable of the fix. Removing it after merge is a regression of the test discipline.

## Retry Budget

After **3 focused attempts** in RED or GREEN with the same hypothesis, the implementer must stop and return a blocked handoff. More attempts without new evidence is "loop theater," not test-first execution.

The blocked handoff must state:

- The command attempted
- The failure output
- The hypothesis being tested
- What evidence is needed to resume

## Anti-Patterns (will fail the Evidence Truth Gate)

| # | Anti-pattern | Why it fails |
|---|--------------|--------------|
| 1 | Test-after evidence (write code, then write test) | Spec Compliance Gate refuses slice; test never failed for the asserted reason |
| 2 | Mock-heavy without `runtime-truthful` pair | Acceptance criteria cannot be closed by mock-only |
| 3 | Manual-only without executable test | Manual verification is not durable evidence |
| 4 | Inferred pass (claim "tests pass" without running them) | Evidence Truth Gate requires fresh output |
| 5 | Coverage percentage without command output | PASS state requires command + percentage + date |
| 6 | Skipping RED (no failing test before implementation) | Test-first reduction is part of spec compliance |
| 7 | Bundled failing tests before any implementation | Hides which behavior drove which design |
| 8 | Removing a passing test to "make it pass" | Removes the regression guard; reset cycle |
| 9 | Test files in `src/` (not `tests/`) | `tsconfig.json` excludes `tests/`; build will fail |
| 10 | Using `describe.skip` / `it.skip` to silence failures | Skips are a deferred bug, not a fix |

## Test Directory Structure

```
tests/
├── cli/                    # CLI binary tests
├── coordination/           # Concurrency, delegation, completion tests
├── features/               # Feature module tests
├── fixtures/               # Shared test fixtures
├── hooks/                  # Hook tests (guards, lifecycle, observers, transforms)
├── integration/            # Multi-module integration tests (medium/large size)
├── kernel/                 # Schema-kernel tests
├── lib/                    # Helper test utilities (no test files here)
├── plugin/                 # Plugin composition tests
├── plugins/                # Plugin SDK tests
├── schema-kernel/          # Config JSON schema tests
├── scripts/                # Build/sync-script tests
├── shared/                 # Cross-surface type & helper tests
├── sidecar/                # Local HTTP sidecar tests
├── smoke/                  # End-to-end smoke tests (large size)
├── task-management/        # Continuity, journal, lifecycle, trajectory tests
├── tools/                  # Tool surface tests
└── *.test.ts               # Top-level cross-cutting tests (rare)
```

## CI Integration

- **Trigger:** Every push and pull request.
- **Command:** `npm test` (full suite) + `npm run typecheck` (must pass before merge).
- **Coverage gate:** `npm run test:coverage` is run as part of the `test` workflow; failure below threshold blocks merge.
- **Workflow file:** `.github/workflows/test.yml` (verify path before adding new tests; the workflow may have been renamed).

## Where to Find More

- Test governance: `.hivemind/planning/test-driven-governance-2026-06-05/GENERIC-TEST-DRIVEN-GUIDE.md`
- Spec-driven authoring: `.opencode/skills/hm-l2-spec-driven-authoring/SKILL.md`
- Code under test: `src/AGENTS.md`
- Quality gate triad: `.opencode/skills/hm-l2-gate-orchestrator/SKILL.md`
