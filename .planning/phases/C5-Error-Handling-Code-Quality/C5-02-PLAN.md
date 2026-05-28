---
phase: C5-Error-Handling-Code-Quality
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/features/governance-engine/create-governance-session.ts
  - src/cli/commands/doctor.ts
autonomous: true
requirements: [REQ-03, REQ-04]
must_haves:
  truths:
    - "create-governance-session.ts uses a scoped env allowlist for execSync (no full process.env spread)"
    - "doctor.ts env spread has an inline comment explaining safety rationale"
    - "TypeScript typecheck passes with zero errors"
  artifacts:
    - path: "src/features/governance-engine/create-governance-session.ts"
      provides: "Scoped env allowlist for git commit execSync"
      not_contains: "...process.env"
      min_lines: 10
    - path: "src/cli/commands/doctor.ts"
      provides: "Inline safety rationale comment at line 244 env spread"
      contains: "safety rationale|diagnostic|intentional"
  key_links:
    - from: "create-governance-session.ts scoped env"
      to: "handler.ts buildMinimalEnv"
      via: "Same allowlist pattern (allowedKeys + Object.fromEntries + filter)"
      pattern: "allowedKeys|buildMinimalEnv"
---

<objective>
Fix two environment propagation concerns: (1) Replace `{ ...process.env }` in `create-governance-session.ts` with a scoped allowlist matching the `buildMinimalEnv` pattern from `handler.ts`, and (2) Add a safety rationale comment to the `{ ...process.env, CI: "true" }` spread in `doctor.ts` (which is acceptable for diagnostic tools).

**Purpose:** Full `process.env` spreads expose arbitrary environment variables to child processes (git commit, spawnSync). The `buildMinimalEnv` pattern in `handler.ts:375-387` shows the correct approach — explicitly list allowed keys. `doctor.ts` is an intentional exception because it's a CLI diagnostic tool where full env is expected by users inspecting their environment.

**Output:** Two files modified with scoped env and documentation comment.
</objective>

<execution_context>
@/Users/apple/.config/opencode/get-shit-done/workflows/execute-plan.md
@/Users/apple/.config/opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/C5-Error-Handling-Code-Quality/C5-SPEC.md
@.planning/C5-Error-Handling-Code-Quality/C5-RESEARCH.md

The `buildMinimalEnv` pattern is in `src/coordination/command-delegation/handler.ts:375-387` (see RESEARCH.md lines 76-89).

For `create-governance-session.ts`, the git-related keys `GIT_DIR` and `GIT_WORK_TREE` should be added to the allowlist alongside `buildMinimalEnv`'s standard keys (PATH, HOME, TERM, LANG, PWD) and the git config keys already used (see lines 125-134).

The `doctor.ts` fix is purely a comment — no code change.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scoped env allowlist in create-governance-session.ts</name>
  <files>src/features/governance-engine/create-governance-session.ts</files>
  <read_first>
    - src/features/governance-engine/create-governance-session.ts (lines 125-140 for the current env spread context)
    - src/coordination/command-delegation/handler.ts (lines 375-387 for the buildMinimalEnv pattern to replicate)
  </read_first>
  <action>
    In `create-governance-session.ts`, replace lines 128-134 (the `const env = { ...process.env, GIT_AUTHOR_NAME: ..., GIT_AUTHOR_EMAIL: ..., GIT_COMMITTER_NAME: ..., GIT_COMMITTER_EMAIL: ... }` block) with a scoped env allowlist:

    ```typescript
    const env = {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      TERM: process.env.TERM,
      LANG: process.env.LANG,
      PWD: process.env.PWD,
      GIT_AUTHOR_NAME: "HiveMind",
      GIT_AUTHOR_EMAIL: "hivemind@local",
      GIT_COMMITTER_NAME: "HiveMind",
      GIT_COMMITTER_EMAIL: "hivemind@local",
    }
    ```

    **Key constraints (per REQ-03 and SPEC boundary):**
    - Per D-03: Do NOT use the `Object.fromEntries` + `filter` pattern from `buildMinimalEnv` here — the direct object literal is simpler and has the same effect for a single call site
    - Keep `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME`, `GIT_COMMITTER_EMAIL` — these are git-specific and already in the current code (lines 130-133)
    - Only include PATH, HOME, TERM, LANG, PWD from `process.env` — all other env vars are excluded
    - Do NOT add `GIT_DIR` or `GIT_WORK_TREE` unless the `execFileAsync` calls use them (they use `cwd` parameter, so these are unnecessary)
    - The exact `execSync` → `execFileAsync` migration is out of scope (already done) — only change the env object
    - Do NOT modify anything else in this file
  </action>
  <verify>
    <automated>grep -n '\.\.\.process\.env' src/features/governance-engine/create-governance-session.ts; test $? -eq 1 || echo "FAIL: full env spread still present"</automated>
    <automated>npx tsc --noEmit 2>&1 | head -10</automated>
  </verify>
  <done>
    create-governance-session.ts has zero `{ ...process.env }` spreads; only explicit keys (PATH, HOME, TERM, LANG, PWD, GIT_*) in the env object; typecheck clean
  </done>
</task>

<task type="auto">
  <name>Task 2: Add safety rationale comment to doctor.ts env spread</name>
  <files>src/cli/commands/doctor.ts</files>
  <read_first>
    - src/cli/commands/doctor.ts (lines 240-250 for the target env spread context)
  </read_first>
  <action>
    In `doctor.ts` at line 244 (`env: { ...process.env, CI: "true" },`), add an inline comment BEFORE or ON the same line explaining why this is safe:

    ```typescript
    env: { ...process.env, CI: "true" }, // Safety: doctor is a CLI diagnostic tool — full env is intentional; not a production delegation path (per REQ-04)
    ```

    Per D-04: The comment must explain that this is acceptable because `doctor.ts` is a diagnostic CLI tool (not a production delegation path). Use the exact phrase "diagnostic CLI tool" and "not a production delegation path".

    **Key constraints:**
    - Do NOT change the env spread itself (it remains `{ ...process.env, CI: "true" }`)
    - Do NOT modify anything else in the file
    - The comment goes on the same line as `env:` — keep the code on one line
  </action>
  <verify>
    <automated>grep -n 'process\.env' src/cli/commands/doctor.ts | grep -v "OPENCODE_CONFIG_DIR"</automated>
    <automated>grep -n 'diagnostic\|rationale\|safety' src/cli/commands/doctor.ts</automated>
    <automated>npx tsc --noEmit 2>&1 | head -10</automated>
  </verify>
  <done>
    doctor.ts env spread has inline comment explaining safety rationale; env spread unchanged; typecheck clean
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Harness process → child process (execSync/spawnSync) | Environment variable propagation |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-C5-03 | Information Disclosure | create-governance-session.ts env | mitigate | Scoped allowlist (PATH/HOME/TERM/LANG/PWD + git config) prevents accidental exposure of API keys, tokens, or secrets in child git process |
| T-C5-04 | Information Disclosure | doctor.ts env spread | accept | Diagnostic CLI tool intentionally exposes full env for troubleshooting; comment documents this as intentional |
</threat_model>

<verification>
- [ ] `grep -n '\.\.\.process\.env' src/features/governance-engine/create-governance-session.ts` returns zero matches (exit 1)
- [ ] `grep -n 'process\.env' src/cli/commands/doctor.ts` shows the env spread line with a safety rationale comment
- [ ] `npm run typecheck` passes with zero errors
</verification>

<success_criteria>
- create-governance-session.ts child git process only receives explicit env keys, not full `process.env`
- doctor.ts has a safety rationale comment on its env spread line
- Typecheck clean
- Existing test suite passes with zero regressions
</success_criteria>

<output>
Create `.planning/phases/C5-Error-Handling-Code-Quality/C5-02-SUMMARY.md` when done
</output>
