# Tests and Verification Sector Guidance

**Evidence level:** L5 documentation guidance only. This file does not prove runtime readiness; runtime claims require L1-L3 proof from authorized verification workflows.

## 1. Sector purpose and lifecycle role

`tests/` is the Tests/Verification sector for Vitest unit, schema, hook, tool, CLI, sidecar, plugin, and integration tests that mirror the `src/` Hard Harness structure. Source evidence: `.planning/codebase/STRUCTURE.md:53-62`, `.planning/codebase/STRUCTURE.md:141-145`, `.planning/codebase/TESTING.md:50-75`.

## 2. Allowed mutation authority

- Test files may be added or updated to mirror source changes under `tests/lib/`, `tests/tools/`, `tests/hooks/`, `tests/schema-kernel/`, `tests/cli/`, `tests/plugins/`, `tests/sidecar/`, and `tests/integration/`. Evidence: `.planning/codebase/TESTING.md:52-64`.
- Tests may use Vitest globals, mocks, spies, fixtures, and factories to prove behavior of source contracts. Evidence: `.planning/codebase/TESTING.md:76-213`.
- Coverage configuration and thresholds are verification policy surfaces and require explicit audit amendments before lowering. Evidence: `.planning/codebase/TESTING.md:12-40`.

## 3. Forbidden mutations / explicit no-go boundaries

- Tests SHALL NOT be used to mutate runtime state outside controlled fixtures/temp directories.
- Mocked/unit-only evidence SHALL NOT be claimed as integration or runtime readiness proof. Evidence: `.planning/architecture/hivemind-sector-agents-target-2026-05-07.md:30-37`, `.planning/ROADMAP.md:47-49`.
- Do not lower coverage thresholds without an explicit audit amendment. Evidence: `.planning/codebase/TESTING.md:36-40`.
- Do not add tests that assert implementation details while bypassing public contracts unless the tested module is explicitly internal and the test names that boundary.

## 4. Actors and consumers

| Actor / consumer | Uses this sector for | Boundary |
|---|---|---|
| Builders/fixers | Prove behavior after source changes | Must run relevant tests before completion claims |
| Reviewers/gates | Assess regression and evidence sufficiency | Must classify evidence level honestly |
| Runtime/source sectors | Receive mirrored test coverage | Tests do not own production behavior |
| Human reviewers | Decide whether evidence is enough for readiness | Integration readiness requires non-mocked integration/live proof |

## 5. Naming and placement conventions

- Test files mirror source names with `.test.ts` suffix. Evidence: `.planning/codebase/TESTING.md:66-69`, `.planning/codebase/STRUCTURE.md:186-195`.
- Test directories mirror source sectors: `tests/lib/` → `src/` runtime modules, `tests/tools/` → `src/tools/`, `tests/hooks/` → `src/hooks/`, `tests/schema-kernel/` → `src/schema-kernel/`. Evidence: `.planning/codebase/TESTING.md:52-64`.
- Use descriptive lowercase `it()` names and one behavior per test. Evidence: `.planning/codebase/TESTING.md:104-110`.

## 6. Quality gates and evidence expectations

- Standard commands: `npm test`, `npm run test:coverage`, single-file `npx vitest run tests/...`, and name-filtered `npx vitest run -t "<test name>"`. Evidence: `.planning/codebase/TESTING.md:41-48`.
- Current testing baseline and failures must be reported honestly; as of the source map, 1,765/1,767 tests pass with 2 known session-journal taxonomy failures. Evidence: `.planning/codebase/TESTING.md:70-75`.
- Runtime readiness requires L1-L3 evidence beyond docs-only or mocked unit proof; tests alone must be classified by level and scope.
