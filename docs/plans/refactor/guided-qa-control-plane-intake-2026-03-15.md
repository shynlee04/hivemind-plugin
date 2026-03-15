# Guided QA Control-Plane Intake - 2026-03-15

## Objective
Normalize `hm-init` and `hm-settings` into deterministic control-plane primitives that require guided intake before mutation.

## Scope
- `hm-init`
- `hm-settings`
- `hivemind_runtime_status`
- `hivemind_runtime_command`
- CLI `init` / `settings`
- acceptance and regression tests

## Decisions
1. Control-plane intake is authoritative in `src/control-plane/**`.
2. Interactive intake uses the OpenCode built-in `question` tool via command prompt contracts.
3. Runtime execution blocks with `executionMode="question-gate"` when intake is incomplete.
4. `guided-onboarding` is the only supported preset in this tranche.
5. CLI `init` and `settings` are non-interactive and must use explicit flags or `--preset guided-onboarding`.

## Required Outcomes
- `hm-init` no longer succeeds with silent defaults.
- `hm-settings` becomes a real handler, not a prompt-only shell.
- runtime status exposes bootstrap completeness and missing fields.
- direct runtime tool calls are covered by regression tests.

## Verification
```bash
npx tsc --noEmit
npx tsx --test tests/slash-command-stack.test.ts tests/bootstrap-profile-authority.test.ts tests/settings-command.test.ts tests/control-plane-runtime-tools.test.ts tests/start-work-router.test.ts
npm run build
```
