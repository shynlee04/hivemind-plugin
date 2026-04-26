---
artifact_type: code-review
reviewed_commit: 02a4bdf2
reviewed_at: 2026-04-26T19:07:49Z
reviewer: gsd-code-reviewer
scope:
  - src/lib/spawner/spawn-request-builder.ts
  - tests/lib/spawner/spawn-request-builder.test.ts
  - .planning/phases/45-opencode-sdk-permission-boundary/SECURITY.md
immediate_dependencies:
  - src/lib/delegation-manager.ts
  - src/lib/spawner/agent-primitive-policy.ts
  - .opencode/skills/hm-opencode-platform-reference/references/opencode-permissions.md
findings:
  critical: 0
  warning: 0
  info: 0
  total: 0
cr01_status: closed
confidence: high
---

I am subagent gsd-code-reviewer; I cannot delegate further; I fulfilled the bounded final code-review task.

# CR-01 Final Code Review — Commit `02a4bdf2`

## Scope

Reviewed commit `02a4bdf2` (`fix(45): CR-01 fail closed restrictive delegated permissions`) for correctness and regressions, focused on whether prior **CR-01: restrictive `permission` records can still produce write-capable delegated sessions** is fixed.

Files reviewed from the commit:

- `src/lib/spawner/spawn-request-builder.ts`
- `tests/lib/spawner/spawn-request-builder.test.ts`
- `.planning/phases/45-opencode-sdk-permission-boundary/SECURITY.md`

Immediate dependencies checked:

- `src/lib/delegation-manager.ts:52-57`, `144-150` — consumes `allowedTools` in prompt-time `tools` map and denies recursive delegation.
- `src/lib/spawner/agent-primitive-policy.ts:37-47` — enriches SDK agent metadata with local primitive `permission` / legacy `tools` data.
- `.opencode/skills/hm-opencode-platform-reference/references/opencode-permissions.md:9-13`, `104-113`, `181-190` — confirms OpenCode permission states include `allow`, `ask`, and `deny`, and review-agent examples use `edit: deny`, `bash: ask`.

## Findings by Severity

| Severity | Count | Findings |
|---|---:|---|
| Critical | 0 | None |
| Warning | 0 | None |
| Info | 0 | None |

## CR-01 Closure Decision

**CR-01 is CLOSED.**

The previous blocker was that `toolsFromAgentMetadata()` could treat a present-but-restrictive `permission` record as explicit policy and then fall back to broad write-capable tools when no tool resolved to literal `allow`. Commit `02a4bdf2` removes that unsafe fallback:

- `src/lib/spawner/spawn-request-builder.ts:90-94` now computes allowed tools only from explicit `allow` matches, subtracts denied tools, and falls back to `READ_ONLY_TOOLS` when the resulting allowlist is empty.
- `src/lib/spawner/spawn-request-builder.ts:104-112` expands `edit: deny` into both prompt-time `edit` and `write` denials, preventing OpenCode's primitive-level edit denial from leaving the harness `write` tool auto-allowed.
- `src/lib/spawner/spawn-request-builder.ts:120-124` no longer treats empty nested permission objects as denied by default; denial requires at least one nested value and all nested values denied. This avoids accidental denial classification from empty objects while preserving fail-closed behavior through the empty allowlist fallback.
- `tests/lib/spawner/spawn-request-builder.test.ts:54-88` adds regression coverage for the exact CR-01 scenarios: `edit: deny` + `bash: ask` resolves to review-only read/glob/grep, and `edit: ask` + `bash: ask` for a write-intent builder task resolves to read-only read/glob/grep.

Integration path remains aligned: `DelegationManager` sends `child.allowedTools` into `session.promptAsync(... body.tools ...)` at `src/lib/delegation-manager.ts:144-150`, so the resolver's read-only output prevents the prior write-capable prompt-tool escalation.

## Blocker Findings

None.

## Verification Evidence Used

- `git show --stat --oneline --decorate --name-status 02a4bdf2` and `git show --format=fuller --find-renames 02a4bdf2 --` scoped the review to the target commit.
- Full file reads of `src/lib/spawner/spawn-request-builder.ts` and `tests/lib/spawner/spawn-request-builder.test.ts`.
- Dependency reads of `src/lib/delegation-manager.ts`, `src/lib/spawner/agent-primitive-policy.ts`, previous audit `.planning/audits/harness-residual-post-review-2026-04-27.md`, updated Phase 45 `SECURITY.md`, and OpenCode permission reference.
- Targeted tests run: `npx vitest run "tests/lib/spawner/spawn-request-builder.test.ts" "tests/lib/delegation-manager.test.ts" "tests/lib/spawner/session-creator.test.ts"` — **PASS**, 3 files / 99 tests.
- Working tree check showed many pre-existing unrelated changes; this review did not modify source files.

## Confidence Level

High. The original CR-01 exploit path is directly covered by new tests and by code inspection of the resolver path that feeds `DelegationManager` prompt-time tools. No blocker regressions were found in the reviewed commit scope.
