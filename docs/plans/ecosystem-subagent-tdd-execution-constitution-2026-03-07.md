# Ecosystem Subagent TDD Execution Constitution

Date: 2026-03-07
Status: active-constitution
Type: execution-constitution

## Goal

Turn the ecosystem control plane into an execution-safe refactor system so later implementation can proceed through bounded subagent waves and TDD instead of broad uncontrolled mutation.

## Required Skill Stack

Every implementation cycle must load and apply this stack in order:

1. `using-superpowers`
2. `agent-orchestrator` or `subagent-driven-development`
3. `test-driven-development`
4. `verification-before-completion`

## Mandatory Subagent Roles

- `hivexplorer`: refresh read-only evidence and confirm current boundaries
- `hiveplanner`: update packets, gates, and control docs
- `hitea`: design or extend the red-test surface
- `hivemaker`: execute the bounded implementation slice
- `hivehealer`: handle failed-green remediation only
- `hiveq`: issue PASS/FAIL verdicts against the verification ring

## Mandatory Packet Fields

Every implementation packet must include:

- objective
- authoritative files
- allowed write scope
- forbidden surfaces
- red-test target
- green verification ring
- hard stop
- next gate

## Default Execution Loop

1. explorer refresh
2. planner packet freeze
3. red-test creation or confirmation
4. bounded implementation
5. green verification
6. PASS/FAIL review
7. promotion or remediation

## Workstream B Default Rule

Workstream B is the only active implementation workstream.

Its next implementation bite must be:

1. harness planning
2. harness implementation
3. post-harness review
4. only then consider one further bounded context extraction

## Hard Stops

- stop if write scope expands beyond the active packet
- stop if governance or lifecycle files are pulled in without promotion
- stop if the red-test target is unclear
- stop if the verification ring is incomplete
- stop if unrelated dirty files are about to be mixed into the wave

## Verification Ring

- `npx tsx --test tests/injection-dedupe-contract.test.ts`
- `npx tsx --test tests/plugin-fallback-context.test.ts`
- `npx tsx --test tests/injection-surface-ownership.test.ts`
- `npx tsx --test tests/child-session-injection-policy.test.ts`
- `npx tsx --test tests/budget-hook-cap.test.ts`
- `npx tsc --noEmit`
- `git diff --check`
