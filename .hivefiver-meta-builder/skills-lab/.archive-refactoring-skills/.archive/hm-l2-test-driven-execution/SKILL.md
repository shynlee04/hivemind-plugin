---
name: hm-l2-test-driven-execution
description: >
  Use when executing test-first implementation, RED/GREEN/REFACTOR cycles, failing-test validation, coverage claim verification, or test-suite quality work with fresh evidence. Trigger for TDD and runtime-truthful test execution. NOT for spec authoring, generic planning, manual-only QA, or post-hoc test suggestions after implementation is already written.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.2.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# Test-Driven Execution

## Overview

Execute runtime-truthful RED/GREEN/REFACTOR work from locked requirements. This skill owns test-first execution, invalid RED detection, coverage evidence, regression handling, and honest blocked handoffs. It does **not** author ambiguous requirements; use `hm-spec-driven-authoring` first when acceptance criteria are missing or unclear.

This package synthesizes three inspected third-party patterns:

| Source pattern | Adopt / adapt decision | Local transformation |
|---|---|---|
| `addyosmani/agent-skills@test-driven-development` | Adopt comprehensive TDD, Prove-It bug-fix pattern, test sizes, state-over-interactions, DAMP tests, real/fake/stub/mock preference; adapt browser tooling to available tools. | Adds bug reproduction first, test-size labels, boundary-mock policy, and runtime verification warnings. |
| `helderberto/skills@tdd` | Adopt one-test-at-a-time vertical TDD, public-interface discipline, and refactor-after-green rule. | Adds no-batch RED enforcement, public contract focus, and deep-module/testability checkpoints. |
| `jellydn/my-ai-tools@tdd` | Adapt action/status vocabulary and test-template package idea; reject hard-coded slash-command wrappers. | Adds portable session state, workflow template, and runner-agnostic test template. |

## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Consumption Rules

| Action | Rule |
|--------|------|
| **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
| **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
| **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
| **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
| **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
| **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
| Code review | When verifying API usage against docs | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
| Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
| Audit | When reporting version-based findings | Steps 1-5 full |

## Entry Gate

Proceed only when there is at least one locked requirement, bug reproduction, acceptance criterion, or explicit behavior contract.

Before writing tests:

1. Confirm the desired behavior and failure mode are observable.
2. Confirm implementation has not already been written for the slice. If it has, either delete/revert the implementation for a true RED cycle or label the work as test-after and do not claim TDD.
3. Identify the project test runner and coverage options.
4. If requirements are ambiguous, stop and hand off to `hm-spec-driven-authoring`.
5. If work spans sessions, persist RED/GREEN/REFACTOR status through `hm-planning-persistence` (.hivemind/state/planning/<session-id>/progress.md) or a local progress table.

## Boundary Rules

| Nearby workflow | Boundary |
|---|---|
| `hm-spec-driven-authoring` | Owns requirement and acceptance-test derivation. This skill consumes locked requirements. |
| `hm-planning-persistence` | Owns durable task/progress files in `.hivemind/state/planning/<session-id>/`. This skill records test phase state into that mechanism when needed. |
| Manual-only QA | Manual exploration may inform a bug, but it is not RED/GREEN/REFACTOR execution. |
| Test-after work | Useful, but not TDD. Do not claim RED evidence if tests were written after implementation. |
| Generic code review | Review can assess quality after tests pass; it does not replace fresh test output. |

## RED/GREEN/REFACTOR Gates

Default rule: one test, minimal code, then next test. Do **not** batch multiple RED tests and then implement them together unless the requirement is inseparable and you document why.

### Red Phase

Write the smallest test that fails for the right reason before implementation changes.

```bash
npm test
pytest
go test ./...
```

**Gate:** The test must fail before implementation. If it passes, STOP. The RED test is invalid or the feature already exists. Rewrite the test or re-scope the slice before continuing.

Record:

```yaml
phase: red
requirement_id: REQ-...
test_size: small | medium | large
public_interface: <API/CLI/UI/function/event>
command: <exact command>
observed_failure: <excerpt>
failure_reason_valid: true | false
```

### Green Phase

Write the minimal implementation that makes the failing test pass. Avoid unrelated cleanup.

```bash
npm test
pytest
go test ./...
```

**Gate:** If the target test still fails, debug the behavior. Do not refactor before green.

Keep GREEN implementation minimal: no unrelated cleanup, no broad rewrites, no private-interface-only proof.

### Refactor Phase

Clean only after green. Re-run the target test and the relevant broader suite.

**Gate:** If refactor breaks tests, revert the refactor or split it into smaller steps.

Refactor only after green output exists in the current session. Re-run the focused test and the relevant broader suite or explain why the broader suite is out of scope.

## Prove-It Pattern for Bugs

Use this when the task starts from a defect rather than a new feature:

1. Reproduce the bug with a failing test or the smallest automated command that captures the bad behavior.
2. Confirm the failure is meaningful and would fail without the fix.
3. Apply the minimal fix.
4. Re-run the reproduction test, then the relevant regression suite.
5. Record whether the bug is now covered by a permanent regression test.

If the bug can only be reproduced manually, label the evidence `manual-reproduction` and do not claim automated TDD until an automated RED test exists.

## Runtime-Truthful Testing

Prefer tests that exercise real behavior. Mock only transport boundaries, clocks, external services, or expensive infrastructure when the mock does not hide the behavior under test.

Evidence labels:

- `runtime-truthful`: test exercises the behavior through real public interfaces or realistic integration seams.
- `transport-mocked`: external transport is mocked but domain behavior is real.
- `mock-heavy`: many internals are mocked; cannot by itself prove runtime behavior.
- `manual-only`: useful observation, not automated proof.

Mock-heavy tests may support debugging but cannot close runtime-truthful acceptance criteria without complementary evidence.

Use the preference order adapted from the inspected TDD sources:

1. Real implementation through public interface.
2. Fake implementation for expensive external systems.
3. Stub for deterministic boundary values.
4. Mock only for transport, clock, external service, or failure injection boundaries.

## Test Size and Readability Labels

| Label | Meaning | Evidence requirement |
|---|---|---|
| `small` | Single unit/module, no network/process boundary. | Fast target command and public behavior assertion. |
| `medium` | Multiple modules or real persistence/process seam. | Integration command and setup/teardown note. |
| `large` | Browser/E2E/system workflow. | Runtime command, environment/server note, and user-visible behavior. |

Prefer DAMP tests: readable intent beats excessive helper abstraction. Repetition is acceptable when it keeps behavior obvious.

## Coverage Claims

Coverage claims require fresh command output in the current work session.

| Project type | Preferred command | Fallback |
|---|---|---|
| Node / Vitest / Jest | `npm run test:coverage` | If script missing, run project test command and mark `coverage_status: MISSING`. |
| Python / pytest | `pytest --cov` | If `pytest-cov` missing, run `pytest` and mark `coverage_status: MISSING`. |
| Go | `go test ./... -cover` | If module context missing, run package-level `go test` where available or mark blocked. |
| No coverage tooling | N/A | Do not estimate. Record `coverage_status: MISSING`, command attempted, and follow-up needed. |

Valid claim format:

```text
Coverage: <exact output> (verified by `<command>` on <date/session>; coverage_status: PASS|PARTIAL|MISSING)
```

Coverage is not a substitute for RED/GREEN evidence. A high percentage with invalid RED is still blocked.

## Invalid RED and Failure Handling

| Failure | Required response |
|---|---|
| RED test passes before implementation | Stop; rewrite the test or prove feature already exists. |
| Test asserts trivial truth | Replace with assertion that would fail if behavior is removed. |
| GREEN cannot pass after 3 focused attempts | Return blocked with failing command, output, hypotheses, and files changed. |
| Refactor breaks tests | Revert/split refactor and rerun tests. |
| Flaky test | Isolate timing/resource assumptions; do not claim pass until stable or blocked. |
| Coverage command unavailable | Record MISSING/PARTIAL, do not invent percentages. |

## 6-NON Defence Table

| Mode | Defence |
|---|---|
| NON-1 audit | Every pass/coverage claim includes command and observed output. |
| NON-2 context | Boundaries with `hm-spec-driven-authoring`, `hm-planning-persistence`, manual QA, and test-after work are explicit. |
| NON-3 cycles | RED → GREEN → REFACTOR gates include loop-back and stop states. |
| NON-4 hierarchy | Requirement authors lock contracts; this skill executes tests; reviewers verify after fresh evidence. |
| NON-5 ecosystem eval | Eval bundle includes trigger, negative, boundary, invalid RED, coverage-absent, and `stacked_scenario` cases. |
| NON-6 pattern | P2 execution pattern: body contains executable gates; references deepen cycle and coverage details. |

## Integration Wiring

| Surface | Contract |
|---|---|
| Agents | Agents must report whether they are in RED, GREEN, REFACTOR, blocked, or verification. Subagents receive requirements, allowed files, commands, retry budget, and evidence format. |
| Commands | Commands must parse `$ARGUMENTS` into target requirement IDs, test command, coverage command, and retry budget. Commands must be non-interactive or document fallback. |
| Tools | Use `run-background-command` for long-running suites when available; use `prompt-skim`/`prompt-analyze` only to inspect requirement clarity; use `session-patch` for bounded progress updates. |
| Plugin hooks | PostToolUse hooks may record command output. Hooks must not convert failed tests into green status. PreToolUse hooks may warn before non-test implementation changes in RED phase. |
| Runtime state | Persist current phase (`red`, `green`, `refactor`, `blocked`), last command, output summary, coverage_status, retry count, and handoff instructions. In Hivemind harness sessions this may use continuity/lifecycle state; elsewhere use a local progress table. |

## Bundled Resource Map

| Resource | Purpose |
|---|---|
| `references/source-synthesis.md` | Provenance, adopt/adapt/reject decisions, and portability constraints from inspected third-party TDD sources. |
| `references/red-green-refactor.md` | Gate mechanics, one-test-at-a-time enforcement, and blocked states. |
| `references/coverage-verification.md` | Honest coverage command states and missing-tooling handling. |
| `templates/test-case-template.md` | Runner-agnostic test case scaffold with public-interface and evidence fields. |
| `workflows/tdd-session-workflow.md` | Action/state workflow for start/red/green/refactor/coverage/status. |
| `scripts/validate-rich-package.sh` | Static package validator for required source-backed resources. |

## Cross-Platform Adapters

| Environment | Adapter |
|---|---|
| OpenCode-native | Use available shell/test tools and record exact commands. Substitute tool names according to platform mapping. |
| Hivemind harness | Respect delegation guardrails, queue/runtime state, PTY/background execution, and parent-visible evidence. |
| Arbitrary user project | Detect the language and test runner. Do not assume Node, `.planning/`, GSD, or this repository paths. |

## Exit Criteria

Complete only when:

- RED failed for the right reason or the feature was explicitly discovered to already exist.
- GREEN passed with fresh output.
- Refactor, if performed, passed with fresh output.
- Coverage was verified or honestly marked `MISSING`/`PARTIAL` with evidence.
- Remaining blockers and handoff state are recorded.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|---|---|---|
| The Test-After Claim | Implementation existed before tests | Label as test-after or restart with a true RED cycle. |
| The Fake Green | Test would pass if implementation were removed | Rewrite assertion against observable behavior. |
| The Mock Theater | Internals are mocked so runtime behavior is untested | Add runtime-truthful or transport-boundary evidence. |
| The Coverage Lie | Coverage percentage without fresh command output | Run coverage now or mark coverage missing. |
| The Infinite Fix Loop | Same failing test after repeated attempts | Stop after retry budget and return blocked evidence. |

## Self-Correction

### When RED is invalid

Stop immediately. Rewrite the test to fail for the requirement or report that behavior already exists and TDD cannot be honestly claimed for that slice.

### When GREEN keeps failing

After three focused attempts, return blocked with failing command, output excerpt, files touched, and next hypothesis. Do not keep looping silently.

### When refactor regresses

Undo or split the refactor. Keep behavior-preserving cleanup separate from feature implementation.

### When coverage is unavailable

Record attempted command and exact failure. Mark `coverage_status: MISSING` or `PARTIAL`, then recommend tooling setup as follow-up if coverage metrics are required.

### Blocked handoff format

```yaml
status: blocked
phase: red | green | refactor | coverage
requirement_ids: []
last_command: <command>
observed_output: <short excerpt>
files_changed: []
retry_count: <n>
next_needed: <human decision, requirement clarification, tooling install, or implementation hypothesis>
```

## Reference Map

| File | When to Read |
|---|---|
| `references/red-green-refactor.md` | When enforcing gate order, invalid RED handling, and rollback. |
| `references/coverage-verification.md` | When reporting coverage or unavailable coverage tooling honestly. |
| `references/source-synthesis.md` | When auditing provenance, RICH compliance, or third-party pattern choices. |
| `templates/test-case-template.md` | When creating a portable test from a locked requirement. |
| `workflows/tdd-session-workflow.md` | When tracking multi-step TDD session state. |
