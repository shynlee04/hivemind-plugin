---
reviewed_commit: 566ffd560df4fd61fb4fdc3068a72bee2d8f1ad1
reviewed: 2026-04-27T00:31:45Z
scope: commit-only-plus-immediate-dependencies
files_reviewed:
  - src/lib/config-compiler.ts
  - src/lib/delegation-manager.ts
  - src/lib/spawner/agent-primitive-policy.ts
  - src/lib/spawner/spawn-request-builder.ts
  - src/lib/spawner/spawner-types.ts
  - src/lib/spawner/session-creator.ts
  - src/lib/primitive-loader.ts
  - src/tools/configure-primitive-paths.ts
  - src/tools/configure-primitive.ts
  - src/tools/session-patch/tools.ts
  - tests/lib/delegation-manager.test.ts
  - tests/lib/spawner/spawn-request-builder.test.ts
  - tests/tools/configure-primitive.test.ts
  - tests/tools/session-patch.test.ts
  - .opencode/skills/hm-opencode-platform-reference/references/opencode-permissions.md
findings:
  critical: 1
  warning: 1
  info: 0
  total: 2
status: issues_found
confidence: high
---

# Harness Residual Post-Fix Review — 2026-04-27

I am subagent gsd-code-reviewer; I cannot delegate further; I fulfilled the bounded post-fix review task.

## Summary

Reviewed commit `566ffd56` for regressions and incomplete fixes in the agent primitive policy resolver, spawn request builder, delegation manager integration, configure-primitive path/name validation, and session patch resolver. The session patch resolver hardening is directionally correct, and targeted tests still pass, but the permission-profile resolver contains a permission-boundary regression that can grant write-capable prompt tools to agents whose primitive policy only requests `ask`/`deny` permissions. Configure-primitive also still misses the new primitive-name validation path for single compile requests.

## Findings by Severity

| Severity | Count | Findings |
|---|---:|---|
| Critical | 1 | CR-01 |
| Warning | 1 | WR-01 |
| Info | 0 | None |

## Blocker Findings Requiring Fix

- **CR-01:** `resolveDelegationPermissionProfile()` can convert restrictive agent permission metadata into a write-capable prompt tool map. This directly affects the Phase 45 residual permission-boundary fix and should block acceptance until corrected and covered by regression tests.

## Critical Issues

### CR-01: Restrictive `permission` records can still produce write-capable delegated sessions

**File:** `src/lib/spawner/spawn-request-builder.ts:84-94`  
**Immediate integration path:** `src/lib/delegation-manager.ts:144-150`, `src/lib/spawner/session-creator.ts:30-34`  
**Issue:** `toolsFromAgentMetadata()` treats any present `agent.permission` as explicit policy, but when no reviewed tool key resolves to literal `"allow"`, it falls back to `WRITE_CAPABLE_TOOLS` and only removes keys explicitly detected as `deny`:

```ts
const result = (allowed.length > 0 ? allowed : WRITE_CAPABLE_TOOLS).filter((toolName) => !denied.has(toolName))
```

That is unsafe for normal OpenCode permission records. OpenCode supports `"ask"` as a third state and documents agent markdown such as `permission: { edit: deny, bash: ask }` for review agents (`.opencode/skills/hm-opencode-platform-reference/references/opencode-permissions.md:181-190`). For that policy, current code resolves `allowed.length === 0`, `denied === { edit }`, then grants `read`, `write`, `bash`, `glob`, and `grep`. DelegationManager sends those as prompt-time `tools: { write: true, bash: true, ... }` at `src/lib/delegation-manager.ts:144-150`, so the child session can receive capabilities the selected agent policy did not allow. This reopens the residual permission boundary the commit is intended to close.

**Fix:** Treat only literal `allow` entries as allowed, treat `ask` as not auto-allowed for prompt-time delegation, map OpenCode `edit` denial to all write/edit-style prompt tools used by the harness, and default to read-only when a permission record exists but does not explicitly allow a tool.

Suggested shape:

```ts
function toolsFromAgentMetadata(agent: ValidatedAgent): readonly string[] | undefined {
  if (agent.tools) {
    const allowed = WRITE_CAPABLE_TOOLS.filter((toolName) => agent.tools?.[toolName] === true)
    return allowed.length > 0 ? allowed : READ_ONLY_TOOLS
  }

  if (!agent.permission) return undefined

  const allowed = WRITE_CAPABLE_TOOLS.filter((toolName) => isPermissionAllowed(agent.permission?.[toolName]))
  const denied = new Set(WRITE_CAPABLE_TOOLS.filter((toolName) => isPermissionDenied(agent.permission?.[toolName])))

  if (isPermissionDenied(agent.permission.edit)) {
    denied.add("edit")
    denied.add("write")
  }

  const result = allowed.filter((toolName) => !denied.has(toolName))
  return result.length > 0 ? result : READ_ONLY_TOOLS
}
```

Add regression coverage for at least:

```ts
expect(resolveDelegationPermissionProfile(
  { agent: "review", prompt: "review code" },
  { name: "review", permission: { edit: "deny", bash: "ask" } },
)).toEqual({ mode: "review-only", tools: ["read", "glob", "grep"] })
```

## Warnings

### WR-01: Single primitive compile still bypasses the new primitive-name validator

**File:** `src/tools/configure-primitive.ts:171-184`  
**Related validation dependency:** `src/lib/config-compiler.ts:107-113`, `src/lib/primitive-loader.ts:167-181`  
**Issue:** Commit `566ffd56` adds `validatePrimitiveName()` coverage for batch compile (`src/tools/configure-primitive.ts:225-230`) and read/inspect (`src/tools/configure-primitive.ts:313-316`, `373-376`), but single compile still derives `name` from `frontmatter.name` or description and passes it straight into `compileAgent()`, `compileCommand()`, or `compileSkill()`. The compiler only rejects `..` substrings (`src/lib/config-compiler.ts:78-82`); it does not reject slashes or invalid primitive identifiers. A single compile request with `frontmatter.name: "bad/name"` can write `.opencode/agents/bad/name.md`, while `loadPrimitives()` only scans direct files under `.opencode/agents` (`src/lib/primitive-loader.ts:167-181`). The result is an orphaned primitive file outside the discoverable primitive naming model.

**Fix:** Apply `validatePrimitiveName(name)` in each single-compile branch before calling the compiler, or move name validation into `compileAgent()`, `compileCommand()`, and `compileSkill()` so all callers share the same invariant.

Suggested local fix:

```ts
const name = (frontmatter.name as string) || deriveName(frontmatter.description)
try {
  validatePrimitiveName(name)
} catch (nameError) {
  return renderToolResult(error(nameError instanceof Error ? nameError.message : String(nameError)))
}
```

Add a test parallel to the new batch test that calls `action: "compile"` with a single primitive spec whose `name` contains `/` and asserts an `Invalid primitive name` error.

## Verification Evidence Used

- `git show --stat --name-only --format=fuller 566ffd56` and `git show --find-renames --find-copies --stat --patch --format=fuller 566ffd56` to scope the review to commit-changed files.
- Full reads of the changed source files and immediate dependencies listed in frontmatter.
- OpenCode permission reference: `.opencode/skills/hm-opencode-platform-reference/references/opencode-permissions.md:9-13`, `121-126`, `181-190`.
- Targeted test execution: `npx vitest run tests/lib/spawner/spawn-request-builder.test.ts tests/tools/configure-primitive.test.ts tests/tools/session-patch.test.ts` — PASS, 3 files / 49 tests. These tests do not cover the blocker scenarios above.

## Confidence Level

High. The blocker is directly traceable from the resolver implementation to the prompt-time tool map sent by DelegationManager, and the OpenCode permission reference confirms `ask`/`deny` are valid agent policy states that must not be transformed into automatic tool allows.
