# iter-15: Tool-Intelligence Test Rewrite + Config-Governance Wiring — Specification

**Created:** 2026-06-08
**Ambiguity score:** 0.08 (gate: ≤ 0.20)
**Requirements:** 5 locked

## Goal

The `ToolIntelligenceEngine` is fully config-driven (R1, R2, R4 severities come from `.hivemind/configs.json` `governance.rules[].action.type`), so the legacy 4-detector hardcoded contract under `tests/features/tool-intelligence/tool-intelligence-engine.test.ts` is wrong. This iteration rewrites the test suite to assert against the new config-driven engine and wires the surrounding governance ecosystem (workflow doc, agent frontmatter, command, skill) so 42 shipped agents can author and consume rules safely — producing one atomic commit that satisfies `npm run typecheck` and `npm test`.

## Background

- Engine is now config-driven: `src/features/tool-intelligence/index.ts` exposes a constructor that accepts `governanceRules[]` and walks them via `findMatchingRule` + `resolveFromConfig`. The 4 detectors (R1/R2/R3/R4) classify events but **severity always comes from config**. Default (no rule match) → `allow`.
- 14 governance rules already exist in `.hivemind/configs.json`, including `R1-malformed-task → block`, `R2-child-recursive-task → needs_jit_grant`, `R4-delegate-task-code-intent → block`.
- Schema: `.hivemind/configs.schema.json` defines `GovernanceRuleSchema` with `action.type` enum `allow|warn|block|escalate|needs_jit_grant`.
- 6/20 tests in `tests/features/tool-intelligence/tool-intelligence-engine.test.ts` fail under the new engine because they hardcoded old severities.
- Authoring assets already exist: `assets/references/hm-config-governance.md`, `assets/templates/config-rules.template.json`, `assets/commands/hm-config-govern.md`. Missing: `assets/workflows/hm-config-edit.md` and `assets/skills/hm-config-governance/SKILL.md`. No `assets/agents/hm-platform-references.md` exists.
- 42 agents that use Hivemind tools (31 hm-*, 10 hf-*, 1 hm-l0-orchestrator) lack `skills: [hm-config-governance]` in frontmatter.

## Requirements

1. **Test rewrite — config-driven severities**: The test file `tests/features/tool-intelligence/tool-intelligence-engine.test.ts` must construct the engine with a SAMPLE inline rule set (not by mutating `.hivemind/configs.json`), and assert config-driven outcomes for every detector path.
   - Current: 6/20 tests fail because the suite hardcodes R1=`block`, R2=`needs_jit_grant`, R4=`block` as if the engine produced them directly. R3 path is also broken. Default path asserts the wrong reason text.
   - Target: All 20+ tests construct `new ToolIntelligenceEngine([...sampleRules])` where the sample rule array includes entries with `id: "R1-malformed-task" → block`, `id: "R2-child-recursive-task" → needs_jit_grant`, `id: "R4-delegate-task-code-intent" → block`. Tests assert `kind` and `reason` for R1, R2, R3, R4, default (unmatched tool), decision metadata, and guidance.
   - Acceptance: `npm test -- tests/features/tool-intelligence/tool-intelligence-engine.test.ts` reports ≥ 20 tests passing, 0 failing. Each test asserts ONE behavior (single `expect` or tightly grouped related asserts).

2. **Workflow doc — `assets/workflows/hm-config-edit.md`**: TUI workflow for editing governance rules with read → list → pick action → prompt → validate → diff → confirm → write → reset engine → suggest commit, in 7 turns.
   - Current: The workflow file does not exist. The `hm-config-govern` command references it as the actual editor but no implementation backs it.
   - Target: A markdown file at `assets/workflows/hm-config-edit.md` that documents a 7-turn TUI flow: (T1) read current config and print rules table; (T2) prompt user to pick `list|add|remove|set-action|validate`; (T3) for `add`/`set-action` collect `rule id`, `toolNames`, `action.type`; (T4) call `validateConfigsFile()` and on failure show the issue path and exit; (T5) show before/after diff and ask for confirmation; (T6) on success write the file and call `resetToolIntelligenceEngine()` to invalidate the singleton; (T7) suggest an atomic commit per rule change.
   - Acceptance: The file exists at the exact path, is referenced by `assets/commands/hm-config-govern.md` (via the relative path), each turn is a numbered section with the action + tool calls in fenced code blocks, and the doc length is ≤ 200 LOC.

3. **Agent command registration — `hm-platform-references`**: The `hm-config-govern` command must be reachable from the `hm-platform-references` agent so the command routes correctly when fired.
   - Current: `assets/agents/hm-platform-references.md` does not exist in this repo. The command at `assets/commands/hm-config-govern.md` declares `agent: hm-platform-references` in frontmatter.
   - Target: Either create `assets/agents/hm-platform-references.md` with `commands:` and `tools:` frontmatter that includes `hm-config-govern` and the required tools (`hivemind-steer`, `hivemind-doc`, `hivemind-command-engine`, `configure-primitive`), OR update the command's `agent:` field to an existing agent that already loads the command (e.g. add `hm-config-govern` to `hm-platform-references` if it exists in a sibling location, else create the agent file).
   - Acceptance: `grep -l "hm-config-govern" assets/agents/*.md assets/commands/hm-config-govern.md` returns at least one agent file containing the command name, and running `node scripts/sync-assets.js` does not error.

4. **Bulk agent wiring — `skills: [hm-config-governance]` on 42 agents**: All 42 shipped agents that use Hivemind tools must declare `skills: [hm-config-governance]` in their frontmatter so they auto-load the new skill.
   - Current: 31 `hm-*` agents (architect, code-fixer, code-reviewer, codebase-mapper, debugger, debug-session-manager, doc-verifier, doc-writer, ecologist, executor, integration-checker, intel-updater, intent-loop, nyquist-auditor, orchestrator, pattern-mapper, phase-researcher, plan-checker, planner, project-researcher, roadmapmer, security-auditor, shipper, specifier, synthesizer, ui-auditor, ui-checker, ui-researcher, user-profiler, verifier) — that's 30 in the brief, but counted from `assets/agents/hm-*.md` is 31; 10 `hf-*` agents (agent-builder, auditor, command-builder, coordinator, meta-builder, prompter, refactorer, skill-builder, synthesizer, tool-builder); and `hm-l0-orchestrator` (1). None have `hm-config-governance` in their `skills:` list.
   - Target: Each of the 42 agents has `skills: [hm-config-governance]` (or the skill list extended to include it) in YAML frontmatter, applied via a single idempotent shell script modeled on `add-tools-to-agents.sh`. Agents that already have a `skills:` list get the entry appended; agents without one get a `skills: [...]` block injected.
   - Acceptance: `grep -l "hm-config-governance" assets/agents/hm-*.md assets/agents/hf-*.md | wc -l` reports ≥ 42, and running the script twice does not duplicate the entry (idempotent).

5. **Skill creation — `assets/skills/hm-config-governance/SKILL.md`**: Progressive-disclosure skill that always-loads the config-driven governance context and loads the workflow/template/reference pointers on demand.
   - Current: No `assets/skills/hm-config-governance/` directory exists.
   - Target: A `SKILL.md` with: `name: hm-config-governance`; `description:` containing trigger phrases `'governance rule'`, `'config tool'`, `'action.type'`, `'block list'`, `'warn list'`, `'add rule'`, `'remove rule'`, `'set severity'`; Pattern 1 (always-loaded) one paragraph explaining config-driven governance; Pattern 2 (when relevant) cross-references to `assets/references/hm-config-governance.md`, `assets/templates/config-rules.template.json`, `assets/workflows/hm-config-edit.md`, `assets/commands/hm-config-govern.md`; body covering how the engine consults config, what each `action.type` means, when to use which, and how to add a rule with an example.
   - Acceptance: The directory and `SKILL.md` exist, the file passes `node scripts/sync-assets.js` (or equivalent dry-run), and all 4 cross-reference paths resolve to existing files in the repo.

## Boundaries

**In scope:**
- Rewriting `tests/features/tool-intelligence/tool-intelligence-engine.test.ts` against the new config-driven engine contract.
- Creating `assets/workflows/hm-config-edit.md` (the missing TUI workflow).
- Ensuring `hm-config-govern` command has a reachable agent (creating `hm-platform-references` agent if needed).
- Wiring `skills: [hm-config-governance]` onto the 42 named agents via a single idempotent shell script.
- Creating `assets/skills/hm-config-governance/SKILL.md` with full progressive-disclosure content.
- One atomic commit: `feat(iteration-15): config-governance wiring + test rewrite`.
- Running `npm run typecheck` and `npm test` and reporting pass counts.

**Out of scope:**
- Touching `.hivemind/configs.json` or `.hivemind/configs.schema.json` (already correct, per brief).
- Touching `src/features/tool-intelligence/index.ts` (engine refactor already landed, per brief).
- Touching `.opencode/get-shit-done/` (developer tooling, off-limits).
- Renaming, removing, or restructuring any l0/l1/l2/l3 skill/agent files (ITER 16 territory).
- Changing the engine's runtime behavior (the config-driven contract is the new source of truth).
- Adding new `action.type` enum values to the Zod schema or runtime.
- Creating new `GovernanceRule` entries in `.hivemind/configs.json` (the 14 existing rules are correct).

## Constraints

- **Single atomic commit** — `feat(iteration-15): config-governance wiring + test rewrite`. No multi-commit history; bisect-friendly.
- **TypeScript strict** — `verbatimModuleSyntax: true`, `import type` for type-only imports; no `any`, no `as`, no unused locals/parameters. `npm run typecheck` must pass.
- **Module size ≤ 500 LOC** — `assets/workflows/hm-config-edit.md` ≤ 200 LOC; `SKILL.md` ≤ 250 LOC; no `src/` files added in this iteration.
- **Idempotent shell script** — Wiring script (modeled on `add-tools-to-agents.sh`) must not duplicate `hm-config-governance` in `skills:` if already present.
- **No `.hivemind/configs.json` mutation from tests** — Tests use an inline `sampleRules` array passed to the engine constructor, never `process.cwd()` config reads.
- **No new dependencies** — Use only packages already in `package.json` (zod, vitest, etc.).
- **TDD discipline** — Each test asserts ONE behavior; test-first RED→GREEN, not test-after.
- **macOS-compatible shell** — No `mapfile` / associative arrays; the wiring script must run on darwin.
- **Conventional commit format** — `feat(iteration-15): ...` with body listing the 5 file changes and the test/typecheck pass counts.

## Acceptance Criteria

- [ ] `tests/features/tool-intelligence/tool-intelligence-engine.test.ts` exists, contains ≥ 20 test cases, and `npm test -- tests/features/tool-intelligence/tool-intelligence-engine.test.ts` reports 0 failures.
- [ ] All test cases construct `new ToolIntelligenceEngine([...sampleRules])` with an inline rule set (no global config mutation).
- [ ] R1 path test asserts `kind === "block"` because the sample rule sets `R1-malformed-task → block`.
- [ ] R2 path test asserts `kind === "needs_jit_grant"` because the sample rule sets `R2-child-recursive-task → needs_jit_grant`.
- [ ] R3 (root task with valid subagent_type) test asserts `kind === "allow"`, `reason` contains `'Root/front-facing'`, and `fromCapabilityBaseline === true`.
- [ ] R4 path test asserts `kind === "block"` because the sample rule sets `R4-delegate-task-code-intent → block`.
- [ ] Default (unmatched tool) test asserts `kind === "allow"` and `reason` contains `'No tool intelligence rule matched'`.
- [ ] "Decision metadata" test asserts `fromCapabilityBaseline === true` ONLY for the R3 path, `false` for all other paths.
- [ ] "Guidance" test asserts that detector-produced guidance has `reason`, `useInstead`, and `context` fields populated.
- [ ] `assets/workflows/hm-config-edit.md` exists and documents exactly 7 numbered turns matching the brief (T1 read, T2 pick action, T3 prompt, T4 validate, T5 diff, T6 write+reset, T7 commit suggestion).
- [ ] `assets/skills/hm-config-governance/SKILL.md` exists, has a `name: hm-config-governance` field, and the `description:` field contains the trigger phrases `'governance rule'`, `'config tool'`, `'action.type'`, `'block list'`, `'warn list'`, `'add rule'`, `'remove rule'`, `'set severity'`.
- [ ] `assets/skills/hm-config-governance/SKILL.md` cross-references all 4 of: `assets/references/hm-config-governance.md`, `assets/templates/config-rules.template.json`, `assets/workflows/hm-config-edit.md`, `assets/commands/hm-config-govern.md`, and each path resolves to an existing file.
- [ ] `assets/agents/hm-platform-references.md` (or the actual existing agent file that the command routes to) contains the command name `hm-config-govern` in its `commands:` or `tools:` frontmatter list.
- [ ] At least 42 agent files in `assets/agents/{hm-*,hf-*}.md` (specifically: 31 hm-*, 10 hf-*, plus `hm-l0-orchestrator.md`) have `hm-config-governance` in their `skills:` list.
- [ ] Re-running the wiring script is a no-op (idempotent): each affected agent still has exactly one `hm-config-governance` entry, no duplicates.
- [ ] `npm run typecheck` exits 0.
- [ ] `npm test` exits 0 (full suite, not just the tool-intelligence file).
- [ ] Git history shows exactly one commit for this iteration: `feat(iteration-15): config-governance wiring + test rewrite`.
- [ ] The commit body lists: commit hash, files-changed count, test pass count, typecheck output.

## Ambiguity Report

| Dimension          | Score | Min  | Status | Notes                                                                       |
|--------------------|-------|------|--------|-----------------------------------------------------------------------------|
| Goal Clarity       | 0.95  | 0.75 | ✓      | Brief enumerates 5 concrete deliverables; goal is single-commit, all-pass.  |
| Boundary Clarity   | 0.90  | 0.70 | ✓      | Explicit out-of-scope list (configs.json, engine, get-shit-done, l0-l3).    |
| Constraint Clarity | 0.85  | 0.65 | ✓      | Atomic commit, 500 LOC cap, idempotent script, no test mutation of config.  |
| Acceptance Criteria| 0.95  | 0.70 | ✓      | 18 pass/fail checkboxes, each tied to a concrete command or file check.    |
| **Ambiguity**      | 0.08  | ≤0.20| ✓      | Weighted: 1.0 − (0.35·0.95 + 0.25·0.90 + 0.20·0.85 + 0.20·0.95) = 0.0825.  |

Status: ✓ all dimensions met. Gate passed. No planner assumptions needed.

## Interview Log

| Round | Perspective     | Question summary                                       | Decision locked                                                                 |
|-------|-----------------|--------------------------------------------------------|---------------------------------------------------------------------------------|
| —     | —               | `[auto]` Initial brief already at gate-passing clarity.| Generated SPEC.md directly from brief context; no Socratic interview required.  |

`[auto] Phase requirements are already sufficiently clear — generating SPEC.md from existing context.`

The brief was already a falsifiable contract: 5 file deliverables, exact file paths, exact test assertions, exact commit message, explicit out-of-scope list, explicit acceptance commands. The ambiguity gate was already ≤ 0.20 from the brief alone, so the Socratic interview was skipped per the workflow's `--auto` policy.

---

*Phase: iter-15-tool-intelligence-config-governance-wiring*
*Spec created: 2026-06-08*
*Next step: /hm-discuss-phase iter-15 — implementation decisions (e.g. exact TUI prompt format, shell script details, test sample rule structure)*
