# Phase 45 Security Verification — OpenCode SDK Permission Boundary

**Phase:** 45 — OpenCode SDK Permission Boundary  
**Verified:** 2026-04-27  
**Baseline:** after CR-01 restrictive permission remediation commit `02a4bdf2` (`fix(45): CR-01 fail closed restrictive delegated permissions`)
**ASVS Level:** 1  
**Threats Closed:** 4/4  

## Threat Verification

| Threat ID | Category | Disposition | Status | Evidence |
|-----------|----------|-------------|--------|----------|
| P45-T1 | Unsupported permission forwarding to `session.create` | mitigate | CLOSED | `src/lib/session-api.ts:36-47` only sends `parentID`, `title`, and optional `query.directory`; `src/lib/spawner/session-creator.ts:19-23` calls `createSession` without permission fields; `tests/lib/session-api.test.ts:48-60` and `tests/lib/spawner/session-creator.test.ts:14-47` cover this request shape. |
| P45-T2 | Permission boundary not applied at prompt time | mitigate | CLOSED | `src/lib/delegation-manager.ts:51-57` builds prompt-time tool allow/ask map; `src/lib/delegation-manager.ts:143-151` passes it to `session.promptAsync`; `tests/lib/delegation-manager.test.ts:640-668` verifies the prompt body includes the tool map and recursive delegation denial. |
| P45-T3 | Recursive delegation from child sessions | mitigate | CLOSED | `src/lib/delegation-manager.ts:54-55` explicitly denies `delegate-task` and `task`; `tests/lib/delegation-manager.test.ts:651-665` asserts both are false in the prompt-time tool map. |
| P45-T4 | Hard-coded delegated permission profile | mitigate | CLOSED | `src/lib/spawner/spawn-request-builder.ts:70-82` derives the prompt-time permission profile from selected agent primitive metadata (`permission` / legacy `tools`) and task intent. `src/lib/spawner/spawn-request-builder.ts:84-113` treats `ask`/unknown permission states as not auto-allowed, expands restrictive edit/write ask records before task-intent escalation, and fails closed to read-only tools (`read`, `glob`, `grep`) when a permission/tool record is present but no prompt tool is explicitly allowed. `src/lib/spawner/agent-primitive-policy.ts:37-47` enriches live SDK agent metadata from local `.opencode/agents/*.md` when available before spawning. `tests/lib/spawner/spawn-request-builder.test.ts:54-88` covers restrictive `ask`/`ask` permission maps and ambiguous restrictive records so they do not resolve to write-capable delegated session tools. |

## Threat Flags

No `## Threat Flags` section was present in `45-SUMMARY-2026-04-27.md`.

## Test Evidence

- `npx vitest run tests/lib/spawner/spawn-request-builder.test.ts tests/lib/delegation-manager.test.ts tests/lib/spawner/session-creator.test.ts tests/lib/session-api.test.ts` — **PASS**, 4 files / 144 tests (fresh post-`02a4bdf2` targeted permission-boundary suite).
- `npm run typecheck` — **PASS** (fresh post-`02a4bdf2`).
- `npm test` — **PASS**, 50 files / 907 tests (fresh post-`02a4bdf2`).
- `npm run build` — **PASS**.

## Residual Risks

- OpenCode live SDK agent metadata may omit full primitive permission details. The harness compensates by loading local project `.opencode/agents/*.md` metadata from the resolved working directory when possible, then applies conservative read-only fallback when neither live nor local metadata exposes a policy.
- If OpenCode adds additional delegation-capable tool IDs besides `delegate-task` and `task`, the explicit ask list will need to be updated or converted to a safer default-ask policy.
- The CR-01 closure is scoped to preventing restrictive `ask`/`ask` records from becoming write-capable delegated sessions. Explicit read/glob/grep denials are still normalized into the current read-only fallback posture rather than a zero-tool prompt map; this is not a Phase 45 write-boundary blocker, but should be revisited if read-ask semantics become a project requirement.

## Accepted Risks

None.

## Recommended Follow-up

- Re-run live Phase 48 provider completion proof when an OpenCode runtime/provider fixture returns non-empty assistant content.
