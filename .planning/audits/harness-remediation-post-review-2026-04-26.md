---
reviewed: 2026-04-27T00:20:00+07:00
commit: d89994e0
scope: post-implementation remediation review
status: issues_found
blockers: 0
warnings: 3
info: 0
verification:
  - npm run typecheck
  - npm test -- --run tests/tools/session-patch.test.ts tests/tools/configure-primitive.test.ts tests/lib/session-api.test.ts tests/lib/delegation-manager.test.ts tests/lib/sdk-delegation.test.ts tests/lib/spawner/session-creator.test.ts tests/plugins/plugin-lifecycle.test.ts tests/lib/runtime-policy.test.ts
---

# Harness Remediation Post-Review — 2026-04-26

I am subagent gsd-code-reviewer; I cannot delegate further; I fulfilled the bounded code-review task.

## Review Basis

- Reviewed commit `d89994e0` changed source/test/config surfaces only, with planning markdown used only for acceptance-context orientation.
- OpenCode SDK boundary checked against bundled OpenCode reference:
  - `SessionCreateData` supports `body.parentID`, `body.title`, and `query.directory` (`.opencode/skills/hm-opencode-platform-reference/references/repomix-opencode.md:416720-416728`).
  - `SessionPromptAsyncData` supports `body.agent`, `body.tools`, and text/file/agent/subtask parts (`.opencode/skills/hm-opencode-platform-reference/references/repomix-opencode.md:417321-417335`).
- Verification commands run successfully:
  - `npm run typecheck`
  - `npm test -- --run tests/tools/session-patch.test.ts tests/tools/configure-primitive.test.ts tests/lib/session-api.test.ts tests/lib/delegation-manager.test.ts tests/lib/sdk-delegation.test.ts tests/lib/spawner/session-creator.test.ts tests/plugins/plugin-lifecycle.test.ts tests/lib/runtime-policy.test.ts` — 8 files, 231 tests passed.

## Summary

No blocker findings were found in commit `d89994e0`. Hook composition now preserves tool-guard metadata by calling the captured `toolGuardHooks["tool.execute.after"]` before event-tracker persistence (`src/plugin.ts:135-142`), event tracking consistently uses `projectDirectory` (`src/plugin.ts:53-57`, `src/plugin.ts:155-157`), and delegation/session creation aligns with the referenced OpenCode SDK request shapes (`src/lib/session-api.ts:36-47`, `src/lib/delegation-manager.ts:143-151`).

Three follow-up warnings remain around write-surface hardening completeness. They do not block the remediation because current tests/typecheck pass and no reviewed path creates a direct traversal outside the process-visible filesystem boundary, but they should be fixed before relying on these tools across multiple concurrent OpenCode workspaces.

## Blockers

None.

## Warnings

### WR-01: `configure-primitive` project-scope writes are still process-CWD-relative

**Severity:** Warning / follow-up  
**File:** `src/plugin.ts:130`, `src/tools/configure-primitive.ts:167-206`, `src/lib/config-compiler.ts:68-76`  
**Issue:** `session-patch` receives the active `projectDirectory` (`src/plugin.ts:128`), but `configure-primitive` is created without it (`src/plugin.ts:130`). Compile then calls the compiler with only `{ scope }` (`src/tools/configure-primitive.ts:167`) and writes `result.filePath` (`src/tools/configure-primitive.ts:199-206`). The compiler resolves project scope to literal `.opencode` when no `basePath` is provided (`src/lib/config-compiler.ts:68-76`). In a host where the plugin process CWD differs from the active OpenCode workspace, compile/read/inspect can target the wrong `.opencode` tree.

**Fix:** Pass `projectDirectory` into `createConfigurePrimitiveTool(projectDirectory)` and forward an absolute project base path into compiler options, e.g. `basePath: path.join(projectRoot, ".opencode")`, while keeping global scope explicit.

### WR-02: Batch primitive names bypass the new strict name validator

**Severity:** Warning / follow-up  
**File:** `src/tools/configure-primitive.ts:222-244`, `src/tools/configure-primitive.ts:467-470`, `src/lib/config-compiler.ts:78-82`  
**Issue:** Single-primitive read/inspect paths now call `validatePrimitiveName()` (`src/tools/configure-primitive.ts:439-470`), but batch compile copies `item.name` directly into compiled specs (`src/tools/configure-primitive.ts:222-244`). The lower compiler only rejects paths containing `..` (`src/lib/config-compiler.ts:78-82`), so names containing path separators can still create unexpected nested primitive paths. This is not an immediate traversal escape, but it weakens the remediation guarantee and leaves batch behavior inconsistent with single-primitive behavior.

**Fix:** Apply the same `validatePrimitiveName(item.name)` check inside `handleBatchCompile()` before parsing/compiling each item, and add a regression test for names like `nested/name` and `../escape`.

### WR-03: Session-patch path resolver allows nonexistent outside-root targets before later rejecting them as missing

**Severity:** Warning / follow-up  
**File:** `src/tools/session-patch/tools.ts:40-48`, `src/tools/session-patch/tools.ts:122-140`  
**Issue:** `resolveAllowedSessionPath()` returns `{ allowed: true, path: absoluteTarget }` for any nonexistent `session*.md` target before checking whether the path stays under `projectRoot` (`src/tools/session-patch/tools.ts:129-131`). The current caller immediately rejects nonexistent files (`src/tools/session-patch/tools.ts:46-48`), so this is not exploitable today. However, the resolver's contract says it validates targets against the active project root (`src/tools/session-patch/tools.ts:115-121`), and the current ordering would be unsafe if create-on-missing behavior is later added.

**Fix:** Compute `relative(absoluteProjectRoot, absoluteTarget)` and reject outside-root paths before the `existsSync(absoluteTarget)` early return. Keep the existing `realpathSync()` check for existing symlinks.

## Info

None.

## Confidence

High. The review covered the changed TypeScript source, immediate SDK/config/compiler dependencies, targeted tests, typecheck, and the bundled OpenCode SDK reference for the prompt/session API boundary. Confidence is not absolute because no live OpenCode runtime integration was executed in this review.
