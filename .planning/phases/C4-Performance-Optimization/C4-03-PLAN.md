---
phase: C4-Performance-Optimization
plan: 03
type: execute
wave: 2
depends_on:
  - C4-02
files_modified:
  - src/features/governance-engine/create-governance-session.ts
  - src/tools/config/bootstrap-init.ts
autonomous: true
requirements:
  - REQ-04
  - REQ-02
must_haves:
  truths:
    - "createGovernanceSession uses execFile (async) instead of execSync for git operations"
    - "bootstrapInit function contains zero mkdirSync/writeFileSync/readFileSync calls"
    - "CLI helper functions (readInstalledPackageVersion, shouldRefreshSchemaArtifact) remain sync"
    - "Existing governance session tests pass after execSync→execFile migration"
    - "Existing bootstrap-init tests pass after async FS migration"
  artifacts:
    - path: "src/features/governance-engine/create-governance-session.ts"
      provides: "execFile async replacement for execSync; import of execFile + promisify"
      min_lines: 220
      exports: ["createGovernanceSessionTool"]
    - path: "src/tools/config/bootstrap-init.ts"
      provides: "Async FS (mkdir/writeFile/readFile) for tool-exposed path; sync helpers preserved"
      min_lines: 330
      exports: ["createBootstrapInitTool", "bootstrapInit"]
  key_links:
    - from: "create-governance-session.ts"
      to: "execFileAsync"
      via: "replaces execSync at git add/commit step"
      pattern: "execFileAsync"
    - from: "bootstrap-init.ts"
      to: "fs/promises imports"
      via: "import { mkdir, writeFile, readFile } from node:fs/promises replaces node:fs sync variants in bootstrapInit"
      pattern: "from \"node:fs/promises\""
user_setup: []
---

<objective>
Fix two event-loop blocking concerns: REQ-04 (execSync in create-governance-session.ts — blocks Node event loop during git operations) and REQ-02 (synchronous FS in bootstrap-init.ts tool path — blocks OpenCode event loop during init).

Purpose: REQ-04 prevents the OpenCode event loop from blocking during governance session git commits. REQ-02 prevents tool-invoked bootstrap init from blocking concurrent operations.
Output: Modified create-governance-session.ts with async execFile, modified bootstrap-init.ts with async FS for tool-exposed path.
</objective>

<execution_context>
@/Users/apple/.config/opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/C4-Performance-Optimization/C4-SPEC.md
@.planning/phases/C4-Performance-Optimization/C4-RESEARCH.md
@.planning/phases/C4-Performance-Optimization/C4-VALIDATION.md
@src/features/governance-engine/create-governance-session.ts
@src/tools/config/bootstrap-init.ts

# Existing test references for regression
@tests/features/governance-engine/create-governance-session.test.ts
@tests/tools/bootstrap-init.test.ts
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Replace execSync with execFile async in create-governance-session.ts</name>
  <files>
    src/features/governance-engine/create-governance-session.ts
  </files>
  <behavior>
    - Given createGovernanceSessionTool executes, git commands use execFile (async) instead of execSync
    - Given git add fails, the empty catch block handles the rejection gracefully (no unhandled promise rejection)
    - Given git commit succeeds, the function continues to session creation
    - Best-effort semantics preserved: git failure never propagates to the caller
  </behavior>
  <action>
    Modify `src/features/governance-engine/create-governance-session.ts`:

    1. **Replace import** at line 14: Change from `import { execSync } from "node:child_process"` to:
       ```typescript
       import { execFile } from "node:child_process"
       import { promisify } from "node:util"
       ```

    2. **Add module-level helper** after imports, before `CoordinatorLike` interface:
       ```typescript
       const execFileAsync = promisify(execFile)
       ```

    3. **Replace Step 4** (lines 111-120): Change the git commit block from:
       ```typescript
       try {
         const cwd = context.directory ?? context.worktree ?? process.cwd()
         execSync(
           `git add -A && git commit -m "phase(24.3.1): pre-governance handoff - ${sessionTitle}" --no-verify`,
           { cwd, env: { ...process.env, GIT_AUTHOR_NAME: "HiveMind", GIT_AUTHOR_EMAIL: "hivemind@local", GIT_COMMITTER_NAME: "HiveMind", GIT_COMMITTER_EMAIL: "hivemind@local" } },
         )
       } catch {
         // Best-effort: git failure must never propagate to the caller
       }
       ```
       To:
       ```typescript
       try {
         const cwd = context.directory ?? context.worktree ?? process.cwd()
         const env = {
           ...process.env,
           GIT_AUTHOR_NAME: "HiveMind",
           GIT_AUTHOR_EMAIL: "hivemind@local",
           GIT_COMMITTER_NAME: "HiveMind",
           GIT_COMMITTER_EMAIL: "hivemind@local",
         }
         // Stage all files
         await execFileAsync("git", ["add", "-A"], { cwd, env })
         // Commit
         await execFileAsync("git", ["commit", "-m", `phase(24.3.1): pre-governance handoff - ${sessionTitle}`, "--no-verify"], { cwd, env })
       } catch {
         // Best-effort: git failure must never propagate to the caller
       }
       ```

    Preserve empty catch block — best-effort semantics are intentional. No other changes to the file.

    Per RESEARCH.md Pitfall 4: `execFile` does not invoke a shell. The `sessionTitle` is already sanitized via regex at line 107 (only alphanumeric and hyphens), so command injection is not a concern. The separate `git add -A` and `git commit` calls use hardcoded arguments.
  </action>
  <verify>
    <automated>npx vitest run tests/features/governance-engine/create-governance-session.test.ts --reporter verbose</automated>
  </verify>
  <done>
    Existing governance session tests pass. Typecheck passes. grep confirms `execSync` is no longer imported in create-governance-session.ts. `execFile` import present. `execFileAsync` is used for git operations.
  </done>
</task>

<task type="auto">
  <name>Task 2: Convert sync FS to async in bootstrap-init tool path</name>
  <files>
    src/tools/config/bootstrap-init.ts
  </files>
  <action>
    Modify `src/tools/config/bootstrap-init.ts` to use async FS in the `bootstrapInit` function while keeping sync helpers for the CLI-only path.

    1. **Change imports** at line 1: Replace the `node:fs` import block. Keep sync imports for helpers, add async imports:
       ```typescript
       import { accessSync, constants, cpSync, existsSync, lstatSync, readdirSync, renameSync, rmSync } from "node:fs"
       import { mkdir, readFile, writeFile } from "node:fs/promises"
       ```

       Note: `mkdirSync`, `readFileSync`, `writeFileSync` are REMOVED from the `node:fs` import. `existsSync` is KEPT (it has no async equivalent and is used in both bootstrapInit and helpers).

    2. **Convert `bootstrapInit` function** (lines 87-172) — replace sync FS calls with async:

       a. Line 113: `mkdirSync(hiveMindRoot, { recursive: true })` → `await mkdir(hiveMindRoot, { recursive: true })`

       b. Lines 114-128 (TIER_1 loop): Replace the `mkdirSync`/`writeFileSync` block:
          ```typescript
          for (const directory of TIER_1_DIRECTORIES) {
            const directoryPath = join(hiveMindRoot, directory)
            if (existsSync(directoryPath)) {
              existing.hiveMindDirectories += 1
            } else {
              await mkdir(directoryPath, { recursive: true })
              created.hiveMindDirectories += 1
            }

            const gitkeepPath = join(directoryPath, GITKEEP_FILE)
            if (!existsSync(gitkeepPath)) {
              await writeFile(gitkeepPath, "", "utf8")
              created.gitkeepFiles += 1
            }
          }
          ```

       c. Line 131: `backupPath = backupPrimitiveTarget(scope.primitiveTargetRoot)` — this stays sync (it calls `cpSync`, `existsSync` which are filesystem-copy operations called once during upgrade). No change needed.

       d. Lines 135-138: Replace `writeFileSync` with `await writeFile`:
          ```typescript
          if (!existsSync(configsPath)) {
            await writeFile(configsPath, renderConfigJson(input.config, input.nonInteractive), "utf8")
            created.configsJson = true
          }
          ```

       e. Line 140: `shouldRefreshSchemaArtifact` — this function uses `readFileSync` and `existsSync`. It is called from `bootstrapInit` but the `readFileSync` inside it reads a config file to check for drift. Convert the function body:
          Change `shouldRefreshSchemaArtifact` (lines 174-182) from:
          ```typescript
          function shouldRefreshSchemaArtifact(schemaPath: string): boolean {
            if (!existsSync(schemaPath)) return true
            const currentContents = readFileSync(schemaPath, "utf8")
            ...
          }
          ```
          To async:
          ```typescript
          async function shouldRefreshSchemaArtifact(schemaPath: string): Promise<boolean> {
            if (!existsSync(schemaPath)) return true
            const currentContents = await readFile(schemaPath, "utf8")
            ...
          }
          ```
          And update the call site at line 140: `const schemaDriftDetected = await shouldRefreshSchemaArtifact(schemaPath)`

       f. Lines 146-148: `writeVersionFile` uses `mkdirSync` + `writeFileSync`. This is called from `bootstrapInit`. Convert:
          Change `writeVersionFile` (lines 235-238) from:
          ```typescript
          function writeVersionFile(versionFilePath: string, version: string): void {
            mkdirSync(dirname(versionFilePath), { recursive: true })
            writeFileSync(versionFilePath, `${JSON.stringify({ version }, null, 2)}\n`, "utf8")
          }
          ```
          To async:
          ```typescript
          async function writeVersionFile(versionFilePath: string, version: string): Promise<void> {
            await mkdir(dirname(versionFilePath), { recursive: true })
            await writeFile(versionFilePath, `${JSON.stringify({ version }, null, 2)}\n`, "utf8")
          }
          ```
          And update the call site at line 147: `await writeVersionFile(versionFilePath, currentVersion)`

    3. **Preserve sync-only helper functions** — these remain unchanged (CLI-only path):
       - `readInstalledPackageVersion` (lines 219-223) — uses `readFileSync` (file URL, CLI context only)
       - `readTrackedVersion` (lines 225-233) — uses `readFileSync` (version check, simple utility)
       - `resolveBootstrapScope` (lines 184-217) — uses `mkdirSync` + `accessSync` (called at top of bootstrapInit before async FS; keep sync for this early path, or convert to use `access` from fs/promises)
       - `backupPrimitiveTarget` (lines 248-255) — uses `cpSync`, `existsSync` (filesystem copy, one-time operation)
       - `listPrimitiveSources` (lines 257-280) — uses `readdirSync`, `existsSync`, `lstatSync` (reads asset directory structure)
       - `copyPrimitive` (lines 306-322) — uses `mkdirSync`, `lstatSync`, `rmSync`, `renameSync`, `cpSync` (filesystem copy operations)
       - `resolvePrimitiveTargetPath` (lines 282-304) — uses `existsSync` only (pure logic)
       - `renderConfigJson` (lines 240-246) — pure function
       - `resolveBootstrapScope` at line 200: `mkdirSync(globalRoot, { recursive: true })` — this is an early-path `mkdirSync` for global config directory resolution. Keep sync since it happens before any async operations and is a simple recursive mkdir.

    **IMPORTANT**: The function `bootstrapInit` is already declared `async` (line 87). The conversion simply adds `await` to existing FS calls.

    **Verify after conversion**: `grep -c "mkdirSync\|writeFileSync\|readFileSync" src/tools/config/bootstrap-init.ts` should return 0 for the `bootstrapInit` function body (these calls may remain in helper functions which is intentional per SPEC.md out-of-scope).
  </action>
  <verify>
    <automated>npx vitest run tests/tools/bootstrap-init.test.ts --reporter verbose</automated>
  </verify>
  <done>
    Existing bootstrap-init tests pass. Typecheck passes. `bootstrapInit` function body contains zero `mkdirSync`/`writeFileSync`/`readFileSync` calls. Sync helper functions (`readInstalledPackageVersion`, `readTrackedVersion`) remain unchanged.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries
| Boundary | Description |
|----------|-------------|
| git add/commit in governance session | Hardcoded commands with sessionTitle sanitized via regex — no user input interpolated into command args |

## STRIDE Threat Register
| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-C4-03 | Tampering | execFileAsync git commands | mitigate | Commands are hardcoded: `["add", "-A"]` and `["commit", "-m", "msg", "--no-verify"]`. `sessionTitle` is sanitized via regex at line 107 (`[a-z0-9-]` only). No shell invocation means no shell injection vector. |
| T-C4-04 | Elevation of Privilege | bootstrap-init async FS | accept | Async FS operations run with same privileges as sync equivalents. No permission escalation. |
| T-C4-05 | Denial of Service | Empty catch blocks | accept | Best-effort git operations. Failure means no commit, not a crash. Governance session still proceeds. |
</threat_model>

<verification>
- `npx vitest run tests/features/governance-engine/create-governance-session.test.ts --reporter verbose` — all governance session tests pass
- `npx vitest run tests/tools/bootstrap-init.test.ts --reporter verbose` — all bootstrap-init tests pass
- `npm test` — full suite passes (no regressions)
- `npm run typecheck` — no type errors
- `grep -c "execSync" src/features/governance-engine/create-governance-session.ts` — 0 (execSync removed)
- `grep "execFile" src/features/governance-engine/create-governance-session.ts` — present with async usage
- `grep -n "mkdirSync\|writeFileSync\|readFileSync" src/tools/config/bootstrap-init.ts` — only in sync helper functions (readInstalledPackageVersion, readTrackedVersion, listPrimitiveSources, copyPrimitive, backupPrimitiveTarget, resolveBootstrapScope line 200)
</verification>

<success_criteria>
- `execFile` (async) replaces `execSync` for all git operations in create-governance-session.ts
- Git commands are split into separate `git add -A` and `git commit` execFile calls
- Empty catch block handles rejected promises gracefully (no unhandled rejections)
- `bootstrapInit` function uses `mkdir`, `writeFile`, `readFile` from `node:fs/promises`
- Sync helper functions (`readInstalledPackageVersion`, `readTrackedVersion`) remain unchanged
- `shouldRefreshSchemaArtifact` and `writeVersionFile` updated to async
- All existing tests pass, typecheck clean
</success_criteria>

<output>
- `.planning/phases/C4-Performance-Optimization/C4-03-SUMMARY.md` when done
</output>
