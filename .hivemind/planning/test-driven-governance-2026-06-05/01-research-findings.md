[LANGUAGE: Write this file in en per Language Governance.]
# W1 Research Findings — Test-Driven Execution Principles (Project-Agnostic)

**Source skill:** `hm-l2-test-driven-execution` (v1.2.0) at `.opencode/skills/hm-l2-test-driven-execution/`
**Synthesized:** 2026-06-05
**Audience:** Wave 2 (generic-guide author), Wave 3 (AGENTS.md author), Wave 4 (universal-rules author)
**Vocabulary rule:** This artifact is strictly project-agnostic. The generic guide (`GENERIC-TEST-DRIVEN-GUIDE.md`) must inherit this discipline. W3/W4 may reference project-specific anchors; W1/W2 must not.

---

## Provenance and Synthesis Method

The source skill itself records the inspect-and-decide method in `references/source-synthesis.md`. Three upstream patterns were adopted/adapted/rejected:

| Upstream source | Adopt/Adapt/Reject |
|---|---|
| `addyosmani/agent-skills@test-driven-development` | Adopt: Prove-It bug-fix pattern, test sizes, state-over-interactions, DAMP, real/fake/stub/mock preference, runtime verification warnings |
| `helderberto/skills@tdd` | Adopt: one-test-at-a-time, public-interface discipline, refactor-after-green |
| `jellydn/my-ai-tools@tdd` | Adapt: action/status vocabulary and portable test template; reject hard-coded command wrappers |

The distillation below strips the Hivemind-specific vocabulary that wraps the source skill's body while preserving every operational rule, gate, and evidence requirement.

---

## Distilled Principles (8)

### Principle 1 — Test-First Cycle (RED → GREEN → REFACTOR)

**Statement.** A test that fails for the right reason must exist before any implementation change. The minimal implementation that makes it pass is written next. Refactor happens only after the test passes — never before.

**Source.**
- `SKILL.md:64-78` (cycle gates: "The test must fail before implementation. If it passes, STOP.")
- `SKILL.md:92-104` (GREEN gate: "Write the minimal implementation that makes the failing test pass. Avoid unrelated cleanup.")
- `SKILL.md:106-113` (REFACTOR gate: "Clean only after green.")

**Example.** A new `add(a, b)` function is required. First write `expect(add(2, 3)).toBe(5)`. Run → fail with "add is not defined." Then implement `function add(a, b) { return a + b; }`. Run → pass. Only now consider renaming, extracting helpers, or tightening types.

**Anti-pattern.** Writing the implementation first, then writing tests against it, then claiming "RED" was achieved. This is test-after work and must be labelled as such.

---

### Principle 2 — One Test at a Time (Vertical TDD)

**Statement.** Each behavior is exercised by exactly one new failing test, which is then driven to green before the next test is written. A pile of failing tests written before any implementation hides which behavior independently drove which design.

**Source.**
- `SKILL.md:64-66` (Default rule: "one test, minimal code, then next test. Do not batch multiple RED tests and then implement them together unless the requirement is inseparable and you document why.")
- `references/red-green-refactor.md:11-19` (numbered one-test-at-a-time loop)
- `references/red-green-refactor.md:21-22` ("Do not write a pile of failing tests and then implement all of them.")

**Example.** A queue needs `enqueue`, `dequeue`, and `size`. Write the test for `enqueue` → fail → make it pass. Then write the test for `dequeue` → fail → make it pass. Each cycle proves that one new test forced one new implementation decision.

**Anti-pattern.** Writing six failing tests, then writing a queue implementation that happens to satisfy all of them, with no per-test evidence that each was independently red.

---

### Principle 3 — Public-Interface Discipline

**Statement.** Tests assert against externally observable surfaces (public APIs, CLI output, UI semantics, events, persisted state, documented contracts). Mocking internals is acceptable only when the helper is itself the slice's public contract.

**Source.**
- `SKILL.md:128-144` (Runtime-Truthful Testing preference order)
- `references/red-green-refactor.md:33-35` (Public Interface Discipline)

**Example.** To test that a pricing rule applies a discount, assert on the final price or a `PricingResult` returned from `pricing.calculate(...)`. Do not assert on internal calls to `taxLookup.fetch(...)` or private cache mutations.

**Anti-pattern.** Mocking five private helpers so the test can pass even though the public output is wrong. This is "Mock Theater" and is one of the source skill's named anti-patterns (see Principle 8).

---

### Principle 4 — Boundary-Only Mocking with Explicit Preference Order

**Statement.** Mocks are a last resort for transport, clock, external services, or failure injection. The default test exercises real behavior through the public interface. When a real dependency is expensive, use a fake; when deterministic boundary values are needed, use a stub; only then mock.

**Source.**
- `SKILL.md:139-144` (preference order, 4 levels)
- `references/source-synthesis.md:22` ("Honest boundaries: mock at transports/clocks/external services; label mock-heavy evidence as limited.")

**Example.** To test retry-on-timeout behavior, keep the production retry logic real but replace the time source with a controllable stub. To test a paid-API call, use a recorded fake response, not a mocking framework that re-implements the API surface.

**Anti-pattern.** Mocking the database AND the cache AND the message bus AND the clock in a single test, then claiming the test proves the system works. It proves the orchestration code is called in the right order — nothing more.

---

### Principle 5 — Honest Evidence Labels

**Statement.** Every test result carries an evidence label that describes what the test actually exercises. Labels form a hierarchy: `runtime-truthful` > `transport-mocked` > `mock-heavy` > `manual-only`. Mock-heavy and manual-only evidence cannot by themselves close runtime-truthful acceptance criteria.

**Source.**
- `SKILL.md:130-137` (evidence labels and their limitations)
- `references/coverage-verification.md:25-32` (label table with limitations)

**Example.** A test that calls `await pricing.calculate(items)` against a real in-memory pricing engine and asserts on the result is `runtime-truthful`. The same test with the engine replaced by a hand-rolled mock is `mock-heavy` and needs complementary integration evidence to be accepted as proof.

**Anti-pattern.** Reporting a test as "covers the feature" when it actually substitutes so many internals that any implementation of the function would pass.

---

### Principle 6 — Coverage Is Evidence, Not a Grade

**Statement.** Coverage claims require fresh command output from the current work session. There are four valid states: `PASS` (command ran), `PARTIAL` (behavioral tests ran but coverage scope was incomplete), `MISSING` (tooling absent — do not estimate), `BLOCKED` (setup/dependency failure). A high percentage with invalid RED is still blocked.

**Source.**
- `SKILL.md:158-173` (Coverage Claims)
- `references/coverage-verification.md:6-15` (Claim States with required evidence)
- `references/coverage-verification.md:55-60` (Invalid Reports)

**Example.** A correct claim: "Coverage: 88.42% statements (verified by `npm run test:coverage` on 2026-06-05; coverage_status: PASS)." An incorrect claim: "About 90% coverage" — no command, no output, no date, no status.

**Anti-pattern.** Stating coverage from a prior session, hand-waving "tests pass so coverage is fine," or quoting a percentage from documentation.

---

### Principle 7 — Test-Size Discipline

**Statement.** Every test is labelled by size, and each size has a different evidence requirement. `small` tests a single unit through a public seam with a fast target command. `medium` exercises multiple modules or a real persistence/process boundary and needs setup/teardown note. `large` runs an end-to-end or browser workflow and needs the runtime command plus environment/server note plus user-visible behavior.

**Source.**
- `SKILL.md:148-153` (size table with evidence requirements)
- `SKILL.md:154-155` ("Prefer DAMP tests: readable intent beats excessive helper abstraction. Repetition is acceptable when it keeps behavior obvious.")

**Example.** A `small` test runs `npm test -- pricing.spec.ts` in milliseconds against pure logic. A `medium` test spins up a real SQLite test database. A `large` test boots a docker-compose stack and drives the UI with Playwright.

**Anti-pattern.** Calling a heavily-mocked unit test "integration" because it imports from two files, or calling a 30-second setup a "small" test because the assertion is single-line.

---

### Principle 8 — Anti-Pattern Catalogue and Retry Budget

**Statement.** Five named anti-patterns each have a defined detection signal and a defined correction path. When the correction path is exhausted, the work is blocked, not looped: after three focused attempts at RED or GREEN, the executor must stop and return a blocked handoff with command output and next hypothesis. More attempts without new evidence is "loop theater," not TDD.

**Source.**
- `SKILL.md:238-244` (anti-patterns table with detection + correction)
- `SKILL.md:175-184` (invalid RED and failure handling)
- `references/red-green-refactor.md:69-71` (retry budget)
- `SKILL.md:264-275` (blocked handoff format)

**The five anti-patterns and their detection signals.**

| Anti-pattern | Detection | Correction |
|---|---|---|
| Test-After Claim | Implementation existed before tests | Label as test-after or restart with a true RED cycle |
| Fake Green | Test would pass if implementation were removed | Rewrite assertion against observable behavior |
| Mock Theater | Internals are mocked so runtime behavior is untested | Add runtime-truthful or transport-boundary evidence |
| Coverage Lie | Coverage percentage without fresh command output | Run coverage now or mark coverage missing |
| Infinite Fix Loop | Same failing test after repeated attempts | Stop after retry budget and return blocked evidence |

**Example.** A test is failing because of a typo, not the missing behavior. Three fix attempts later, the typo is fixed but the test still fails for the original reason. The fourth attempt must not happen — return a blocked handoff naming the real failure mode.

**Anti-pattern.** Continuing to edit the implementation in hopes the test will "go green eventually" — this is precisely the loop the budget exists to prevent.

---

## Supplementary Rules (Distilled from Source)

These are smaller but load-bearing rules that the generic guide should preserve.

- **Bug-fix Prove-It pattern.** For defect work, the reproduction IS the RED phase: reproduce → prove failure matches user-visible defect → minimal fix → prove fixed → preserve as permanent regression test. Source: `SKILL.md:115-124`.
- **Invalid RED detection.** A RED test that passes before implementation means the test is invalid or the feature already exists. STOP, rewrite the test, or report the slice as not TDD-eligible. Source: `SKILL.md:248-250`.
- **Deep-module checkpoint.** If a slice is hard to test without mocking many internals, pause before GREEN and identify the public seam. A small interface change is valid; a broad architecture rewrite is not part of a single TDD cycle. Source: `references/red-green-refactor.md:73-75`.
- **Refactor-only-after-green.** Behavior-preserving cleanup is separate from feature implementation. If refactor regresses, revert or split. Source: `references/red-green-refactor.md:61-67`.
- **Runner detection.** Detect the project's test runner (`npm`, `pytest`, `go test`, or equivalent). Do not assume a stack. If no runner exists, return `blocked-tooling` or `manual-only` evidence. Source: `SKILL.md:218-224` and `references/source-synthesis.md:33`.
- **DAMP over DRY.** Readability beats abstraction in tests. Repetition is acceptable when it keeps behavior obvious. Source: `SKILL.md:154-155`.

---

## Application Guidance for W2/W3/W4

| Wave | What it can/should reference | What it MUST NOT contain |
|---|---|---|
| W2 (generic guide) | The 8 principles above, supplementary rules, anti-patterns | Project-specific path conventions, internal agent names, SDK references, delegation verbs |
| W3 (AGENTS.md section) | Any of the above + Hivemind-specific anchors (state root, harness internals) | None — Hivemind-voice is appropriate here |
| W4 (universal-rules.md) | A concise normative subset of the principles (cycle gate, evidence label, no test-after claim, retry budget) | None — universal rules are by definition generic |

**Vocabulary audit checklist for W2.** Before writing the generic guide, scrub for any of these terms and rewrite: `hm-*`, `harness`, `delegation`, `subagent`, `dispatcher`, `orchestrator`, `work contract`, `session`, `continuity`, `runtime`, `plugin`, `tool call`, `plan.md`, `roadmap`, `requirements.md`, `state.md`, `todo`, `atomic commit` (project-specific), `codebase map`, `agent prompt`. Where the underlying concept must be referenced, use the generic equivalent ("executor", "executable gate", "implementer", "session state", "test runner", etc.).
