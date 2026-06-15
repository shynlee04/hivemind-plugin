# Skill Audit — Batch 1 of 4

**Date:** 2026-04-07
**Auditor:** researcher (read-only)
**Base path:** `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.hivefiver-meta-builder/skills-lab/active/refactoring/`
**Skills audited:** agent-authorization, agents-and-subagents-dev, command-dev, command-parser, coordinating-loop

---

## 1. agent-authorization

| Field | Value |
|---|---|
| **name** | `agent-authorization` |
| **frontmatter** | **YES** — `name`, `description`, `metadata` (version "1.0.0", pattern "P2", layer "domain-execution"), `allowed-tools` list |
| **triggers** | `"authorize agent creation"`, `"create agent guardrails"`, `"specialist agent profile"`, `"checkpoint gate"`, `"authorization gate for agents"` — all present in description |
| **self_contained** | **partial** — references `references/gates.md` (exists), `task_plan.md` (external skill dependency on `planning-with-files`), and `.opencode/agents/` directory (resolves on disk). The gate workflow depends on `task_plan.md` existing, which is managed by `planning-with-files`. |
| **cross_refs** | See table below |
| **hardcoded_paths** | `.opencode/skills/` (relative, OK), `.opencode/agents/` (relative, OK), `task_plan.md` (relative, OK), `references/gates.md` (relative, OK). No absolute paths. No macOS-specific paths. |
| **cross_platform_safe** | **partial** — scripts `check-overlaps.sh` and `validate-skill.sh` use bash color codes (`\033[0;31m` etc.) which may not render on Windows CMD. Scripts are otherwise POSIX-compatible. The skill body itself is platform-agnostic. |
| **quality_score** | **7/10** |
| **issues** | See list below |
| **connections** | See list below |

### Cross-References

| Reference | Location in skill | Target exists? | Resolvable? |
|---|---|---|---|
| `references/gates.md` | SKILL.md:21, SKILL.md:232 | YES (447 lines) | YES |
| `task_plan.md` | SKILL.md:95, SKILL.md:126 | External (planning-with-files) | YES (conditional) |
| `.opencode/skills/` | SKILL.md:46 | YES (symlinked dir) | YES |
| `.opencode/agents/` | SKILL.md:190, SKILL.md:210 | YES (23 agent .md files) | YES |
| `hivefiver-skill-author` | SKILL.md:194, SKILL.md:204 | YES (agent exists) | YES |
| `hivefiver-agent-builder` | SKILL.md:195, SKILL.md:206 | YES (agent exists) | YES |
| `hivefiver-command-builder` | SKILL.md:196, SKILL.md:207 | YES (agent exists) | YES |
| `builder` | SKILL.md:197, SKILL.md:208 | YES (agent exists) | YES |
| `critic` | SKILL.md:198, SKILL.md:209 | YES (agent exists) | YES |
| `scripts/check-overlaps.sh` | scripts/ dir | YES (131 lines) | YES |
| `scripts/validate-skill.sh` | scripts/ dir | YES (150 lines) | YES |

### Issues

1. **Gate count inconsistency:** SKILL.md says "typically 2-4" skills needed (line 46) but `references/gates.md` says "≥ 3" (line 29). These thresholds should match.
2. **Specialist registry mismatch:** `references/gates.md` line 68 lists a `router` specialist that does NOT exist in `.opencode/agents/`. The closest is `hivefiver-orchestrator` (routing brain).
3. **Capability matrix references `meta-builder`:** `references/gates.md` line 422 lists `meta-builder` as a specialist for "General task" — but `meta-builder` is a skill, not an agent. The agent that does routing is `hivefiver-orchestrator` or `coordinator`.
4. **Scripts not referenced from SKILL.md:** The `scripts/` directory contains `check-overlaps.sh` and `validate-skill.sh` but neither is mentioned anywhere in SKILL.md or `references/gates.md`. Dead code or undocumented tooling.
5. **Gate 4 references `planning-with-files` skill implicitly:** Line 95 mentions "conventionally `task_plan.md` if the planning-with-files skill is loaded" — this creates a soft dependency that isn't declared in frontmatter.
6. **Color codes in scripts:** Both scripts use ANSI escape codes (lines 10-13 of each) which won't render on Windows CMD/PowerShell without special handling.
7. **validate-skill.sh checks for "Use when" trigger phrase** (line 48) but the actual SKILL.md description uses "Use when authorizing agent creation, creating agent guardrails..." — this passes, but the check is fragile (case-insensitive grep for "use when" substring).

### Connections

- **Agents using this skill:** Referenced by specialist profiles for `hivefiver-skill-author`, `hivefiver-agent-builder`, `hivefiver-command-builder`, `builder`, `critic` — all require Gate 1-4 authorization before agent creation.
- **Commands triggering it:** None explicitly. Would be triggered by natural language phrases in description.
- **Workflows executing it:** Part of the agent creation authorization chain in the Hivefiver delegation protocol.

---

## 2. agents-and-subagents-dev

| Field | Value |
|---|---|
| **name** | `agents-and-subagents-dev` |
| **frontmatter** | **YES** — `name` and `description` only. No `metadata`, no `allowed-tools`, no `version`. |
| **triggers** | `"create an agent"`, `"add an agent"`, `"define agent permissions"`, `"set up subagent delegation"`, `"configure agent temperature"`, `"create agent definition"`, mentions of `agent:`, `subtask:`, `worktree isolation`, `fork sessions`, `parallel tasks` — all present in description |
| **self_contained** | **partial** — mandates reading `references/delegation-protocol.md` and `references/worktree-control.md` on load (lines 31-32). Both files exist. The skill re-exports core concepts from those files but also duplicates significant content inline (the "What agents actually rationalize" table, status protocol, anti-patterns). |
| **cross_refs** | See table below |
| **hardcoded_paths** | `references/delegation-protocol.md` (relative, OK), `references/worktree-control.md` (relative, OK). No absolute paths. No macOS-specific paths. |
| **cross_platform_safe** | **yes** — no scripts, no platform-specific commands. Pure markdown guidance. |
| **quality_score** | **6/10** |
| **issues** | See list below |
| **connections** | See list below |

### Cross-References

| Reference | Location in skill | Target exists? | Resolvable? |
|---|---|---|---|
| `references/delegation-protocol.md` | SKILL.md:31, SKILL.md:43 | YES (115 lines) | YES |
| `references/worktree-control.md` | SKILL.md:32, SKILL.md:65 | YES (71 lines) | YES |

### Issues

1. **Missing metadata fields:** No `version`, `metadata`, `allowed-tools`, or `pattern` in frontmatter. Compare with `agent-authorization` which has all of these. This is inconsistent with the skill package standard.
2. **Content duplication with references:** The "What agents actually rationalize" table (SKILL.md:20-27) duplicates content that should live in `references/delegation-protocol.md`. The status protocol table (SKILL.md:47-54) is also duplicated from the reference file. The anti-patterns table (SKILL.md:80-85) overlaps with the reference file's content. This violates the "summaries in SKILL.md, details in references" principle.
3. **"On Load" section is imperative but vague:** Lines 31-32 say "MANDATORY - READ ENTIRE FILE" for both references. This is good for actionability but means the skill loads ~186 additional lines every time, which is a significant context cost for a skill that may only need a subset.
4. **No validation gate checklist:** Unlike `agent-authorization` which has a clear authorization checklist, this skill has a "Validation Gate" (SKILL.md:69-76) but it's a simple checkbox list with no enforcement mechanism or script.
5. **Worktree control section is thin:** SKILL.md:58-65 is only 8 lines and essentially says "read the reference file." This section adds no value beyond the reference pointer.
6. **No `metadata.layer` or `metadata.pattern`:** The skill doesn't declare its position in the loading hierarchy, making it impossible for orchestrators to know when to load it relative to other skills.

### Connections

- **Agents using this skill:** Likely used by `coordinator`, `conductor`, and `hivefiver-orchestrator` when creating or configuring agents.
- **Commands triggering it:** `/hf-create` (when creating agents), `/start-work` (when setting up delegation).
- **Workflows executing it:** Agent creation workflow in Hivefiver, delegation setup in multi-agent coordination.

---

## 3. command-dev

| Field | Value |
|---|---|
| **name** | `command-dev` |
| **frontmatter** | **YES** — `name` and `description` only. No `metadata`, no `allowed-tools`, no `version`. |
| **triggers** | `"create a command"`, `"add a command"`, `"write a custom command"`, `"update a command"`, `"set up a command with arguments"`, `"create a command with bash injection"`, `"configure command agent"`, mentions of `$ARGUMENTS`, `!bash`, `@file`, `agent:`, `subtask:` — all present in description |
| **self_contained** | **partial** — mandates reading `references/non-interactive-shell.md` (224 lines) and `references/command-anatomy.md` (119 lines) on load. Both exist. The skill body is a thin wrapper (~68 lines) that mostly points to references. |
| **cross_refs** | See table below |
| **hardcoded_paths** | `references/non-interactive-shell.md` (relative, OK), `references/command-anatomy.md` (relative, OK). No absolute paths. No macOS-specific paths. |
| **cross_platform_safe** | **yes** — no scripts, no platform-specific commands. The non-interactive shell guidance is universal (applies to any headless CI environment). |
| **quality_score** | **7/10** |
| **issues** | See list below |
| **connections** | See list below |

### Cross-References

| Reference | Location in skill | Target exists? | Resolvable? |
|---|---|---|---|
| `references/non-interactive-shell.md` | SKILL.md:29, SKILL.md:59 | YES (224 lines) | YES |
| `references/command-anatomy.md` | SKILL.md:30, SKILL.md:43 | YES (119 lines) | YES |

### Issues

1. **Missing metadata fields:** Same as `agents-and-subagents-dev` — no `version`, `metadata`, `allowed-tools`, or `pattern` in frontmatter.
2. **SKILL.md is a thin index:** At 68 lines, the skill body is essentially a table of contents pointing to two large reference files. The "On Load" section (lines 28-31) loads 343 additional lines of reference material. This is a valid pattern but means the skill's standalone value is low.
3. **Worked example in reference, not skill:** The worked example (`/deep-tech-research`) lives in `references/command-anatomy.md` (lines 79-119) rather than in SKILL.md itself. For a skill that should be actionable on its own, having the only worked example in a reference file is a weakness.
4. **No validation script:** Unlike `agent-authorization` which has `validate-skill.sh`, this skill has no script to validate command structure. The `command-parser` skill handles parsing but there's no command structure validator.
5. **Anti-patterns table is minimal:** Only 4 anti-patterns listed (SKILL.md:63-68). The `non-interactive-shell.md` reference has extensive banned command lists that aren't summarized in the skill body.
6. **Description is very long:** The description field is 374 characters. While comprehensive, this may exceed effective trigger matching in some platforms.

### Connections

- **Agents using this skill:** `hivefiver-command-builder` (primary), `hivefiver-orchestrator` (routing).
- **Commands triggering it:** `/hf-create` (when creating commands).
- **Workflows executing it:** Command creation workflow in Hivefiver meta-builder pipeline.

---

## 4. command-parser

| Field | Value |
|---|---|
| **name** | `command-parser` |
| **frontmatter** | **YES** — `name`, `description`, `metadata` (layer "3", role "domain-execution", pattern P2), `allowed-tools` list |
| **triggers** | `"parse $ARGUMENT"`, `"command parsing framework"`, `"propositional commands"`, `"extract flags from command"` — all present in description |
| **self_contained** | **yes** — The skill body contains all parsing patterns, procedures, error handling, and non-interactive compliance rules. The reference file `references/parsing-rules.md` provides additional grammar spec and edge cases but the skill is fully functional without it. |
| **cross_refs** | See table below |
| **hardcoded_paths** | `references/parsing-rules.md` (relative, OK). No absolute paths. No macOS-specific paths. |
| **cross_platform_safe** | **yes** — pure parsing logic, no scripts, no platform dependencies. |
| **quality_score** | **8/10** |
| **issues** | See list below |
| **connections** | See list below |

### Cross-References

| Reference | Location in skill | Target exists? | Resolvable? |
|---|---|---|---|
| `references/parsing-rules.md` | SKILL.md:22 | YES (71 lines) | YES |
| `task_plan.md` | Root directory (stale artifact) | YES (17 lines) | YES but shouldn't be here |

### Issues

1. **Stale `task_plan.md` in skill directory:** The file `task_plan.md` at the skill root (17 lines) is a leftover from the skill creation process. It contains a checklist for creating the command-parser skill itself. This file should NOT be part of the skill package — it's build artifact, not skill content.
2. **No `<files_to_read>` enforcement:** Line 21-23 uses a `<files_to_read>` XML tag to reference `references/parsing-rules.md`, but unlike `agents-and-subagents-dev` and `command-dev`, there's no "On Load" section that mandates reading it. The tag is decorative, not procedural.
3. **Missing metadata fields:** While it has `metadata` and `allowed-tools`, it lacks `version`. Compare with `agent-authorization` which has `version: "1.0.0"`.
4. **Reconstruction rules reference non-interactive compliance:** SKILL.md:79 says "always add `-y`/`--yes`/`--no-pager` for interactive tools" but doesn't reference the comprehensive `non-interactive-shell.md` reference that `command-dev` uses. This is a gap — if command-parser reconstructs commands, it should follow the same non-interactive mandates.
5. **No scripts directory:** Unlike `agent-authorization` and `coordinating-loop`, this skill has no `scripts/` directory. Given that it's a parser, a validation script that tests parsing against the examples table would be valuable.
6. **Description lacks "Use when" phrase:** The description starts with "Parses $ARGUMENT propositional commands..." rather than "Use when..." — this is a minor deviation from the pattern used by other skills.

### Connections

- **Agents using this skill:** `conductor` (command execution workhorse), `hivefiver-orchestrator` (command-related routing).
- **Commands triggering it:** Any command using `$ARGUMENTS` syntax — `/start-work`, `/plan`, `/ultrawork`, `/hf-create`, `/hf-audit`, `/hf-stack`, `/hf-prompt-enhance`.
- **Workflows executing it:** Implicitly used whenever any slash command with arguments is invoked.

---

## 5. coordinating-loop

| Field | Value |
|---|---|
| **name** | `coordinating-loop` |
| **frontmatter** | **YES** — `name`, `description`, `metadata` (layer "3", role "coordinator", min-tasks 2), `allowed-tools` |
| **triggers** | `"dispatching multiple agents"`, `"deciding between sequential vs parallel execution"`, `"orchestrating multi-agent workflows with validation gates"` — present in description but fewer natural language trigger phrases than other skills |
| **self_contained** | **partial** — heavily depends on scripts for gate enforcement (8 scripts), references for protocols (4 reference files), and requires `planning-with-files` to be loaded as a prerequisite (SKILL.md:27). The skill body is 371 lines but delegates enforcement to scripts. |
| **cross_refs** | See table below |
| **hardcoded_paths** | `.coordination/` (relative, OK), `task_plan.md` (relative, OK), `progress.md` (relative, OK), `findings.md` (relative, OK). Scripts reference `.opencode/state/loaded-skills.json` (relative, OK). No absolute paths. No macOS-specific paths in skill body. Scripts use `#!/usr/bin/env bash` which is cross-platform. |
| **cross_platform_safe** | **partial** — The Platform Adaptation section (SKILL.md:318-341) explicitly handles Claude.ai (no bash), Cowork (subagents, no bash), and no-subagent fallback. However, the 8 scripts are bash-only and will not work on Windows without WSL or Git Bash. The `verify-hierarchy.sh` script checks `$HOME/.opencode/skills/` etc. which are Unix paths. |
| **quality_score** | **8/10** |
| **issues** | See list below |
| **connections** | See list below |

### Cross-References

| Reference | Location in skill | Target exists? | Resolvable? |
|---|---|---|---|
| `scripts/verify-hierarchy.sh` | SKILL.md:17 | YES (295 lines) | YES |
| `scripts/register-skill.sh` | SKILL.md:23 | YES (122 lines) | YES |
| `scripts/init-session.sh` | SKILL.md:42, SKILL.md:366 | YES (65 lines) | YES |
| `scripts/coordination-check.sh` | SKILL.md:46, SKILL.md:109, SKILL.md:367 | YES (192 lines) | YES |
| `scripts/check-gate.sh` | SKILL.md:63, SKILL.md:105, SKILL.md:123, SKILL.md:135, SKILL.md:139, SKILL.md:150-158 | YES (206 lines) | YES |
| `scripts/validate-envelope.sh` | SKILL.md:104, SKILL.md:369 | YES (75 lines) | YES |
| `scripts/run-ralph-loop.sh` | SKILL.md:118, SKILL.md:370 | YES (169 lines) | YES |
| `scripts/loop-status.sh` | SKILL.md:371 | YES (141 lines) | YES |
| `references/01-handoff-protocols.md` | SKILL.md:236, SKILL.md:362 | YES (252 lines) | YES |
| `references/02-sequential-vs-parallel.md` | SKILL.md:363 | YES (187 lines) | YES |
| `references/03-parent-child-cycles.md` | SKILL.md:364 | YES (212 lines) | YES |
| `references/04-ralph-loop-integration.md` | SKILL.md:365 | YES (292 lines) | YES |
| `planning-with-files` skill | SKILL.md:19, SKILL.md:27, SKILL.md:351 | YES (skill exists) | YES |
| `dispatching-parallel-agents` skill | SKILL.md:43, SKILL.md:349 | YES (skill exists in `.opencode/skills/`) | YES |
| `user-intent-interactive-loop` skill | SKILL.md:350 | YES (skill exists) | YES |
| `skill-creator` skill | SKILL.md:352 | **NO** — skill not found in `.opencode/skills/` | **BROKEN REF** |
| `gcc` skill | SKILL.md:353 | **NO** — skill not found in `.opencode/skills/` | **BROKEN REF** |
| `evals/evals.json` | evals/ dir | YES (135 lines, 8 test cases) | YES |
| `evals/trigger-queries.json` | evals/ dir | YES (24 lines, 20 queries) | YES |

### Issues

1. **Broken cross-reference to `skill-creator` skill:** SKILL.md:352 references `skill-creator` skill but it does NOT exist in `.opencode/skills/`. The closest is `skill-synthesis` or `use-authoring-skills`.
2. **Broken cross-reference to `gcc` skill:** SKILL.md:353 references `gcc` skill but it does NOT exist in `.opencode/skills/`. This is a Claude Code skill (`~/.claude/skills/gcc/`) not available in this OpenCode project.
3. **Trigger phrases are too few:** The description has only 3 trigger phrases. Compare with `agent-authorization` (5 triggers) or `command-dev` (7+ triggers). The evals/trigger-queries.json has 10 "should trigger" queries that are NOT reflected in the description. This means the skill may not trigger for phrases like "coordinate these tasks", "set up a ralph loop for this", "manage the handoff between agents", etc.
4. **Hierarchy enforcement depends on external state:** SKILL.md:16-31 requires running `scripts/verify-hierarchy.sh` which reads `.opencode/state/loaded-skills.json`. This file may not exist if the state system hasn't been initialized. The script handles this by creating an empty JSON object, but the skill doesn't document this prerequisite.
5. **`register-skill.sh` script is not referenced in SKILL.md body:** It's listed in the Kit Bundle Contents table (SKILL.md:367) but never mentioned in the procedural steps. The skill says to "Register this skill as loaded" (line 23) but this is in the "HIERARCHY ENFORCEMENT" section at the top, not in the main workflow.
6. **Ralph-loop integration references external URL:** `references/04-ralph-loop-integration.md` line 17 links to `https://fullstackrecipes.com/recipes/ralph-setup` — an external dependency that may become stale.
7. **Worked example references non-existent skill:** The worked example (SKILL.md:223) references `.opencode/skills/use-authoring-skills/SKILL.md` as a pattern — this file exists, so it's fine. But the example also mentions `validate-skill.sh` from `use-authoring-skills` (SKILL.md:227) — need to verify this script exists.
8. **Scripts use `$HOME` paths:** `verify-hierarchy.sh` lines 78-82 check `$HOME/.opencode/skills/`, `$HOME/.config/opencode/skills/`, `$HOME/.agents/skills/`, `$HOME/.claude/skills/`, `$HOME/.kilo/skills/` — these are Unix-specific and won't work on Windows without WSL.
9. **`coordination-check.sh` has a bug in line 19:** `MODE="${2:-}"` — the script is called as `bash scripts/coordination-check.sh <session> --pre-dispatch` but the `--pre-dispatch` flag is the second argument. However, in SKILL.md:46, it's called as `bash scripts/coordination-check.sh <session> --pre-dispatch` which is correct. The issue is that the script uses `MODE="${2:-}"` which would capture `--pre-dispatch` correctly. This is actually fine — no bug.
10. **Evals are all unrun:** All 8 test cases in `evals/evals.json` have `"passed": false` and empty `"evidence"` fields. This is expected for a skill under development but worth noting.

### Connections

- **Agents using this skill:** `coordinator` (task management, delegation, parallel execution), `conductor` (delegate-task routing), `hivefiver-orchestrator` (meta-builder routing).
- **Commands triggering it:** `/start-work`, `/ultrawork` (both involve multi-agent coordination).
- **Workflows executing it:** Multi-agent skill creation workflows, parallel investigation workflows, any workflow requiring sequential/parallel dispatch decisions.

---

## Batch Summary

| Skill | Frontmatter | Self-Contained | Cross-Platform | Quality | Broken Refs |
|---|---|---|---|---|---|
| agent-authorization | ✓ full | partial | partial | 7/10 | 0 |
| agents-and-subagents-dev | ✓ minimal | partial | yes | 6/10 | 0 |
| command-dev | ✓ minimal | partial | yes | 7/10 | 0 |
| command-parser | ✓ partial | yes | yes | 8/10 | 0 |
| coordinating-loop | ✓ full | partial | partial | 8/10 | 2 |

### Cross-Batch Observations

1. **Frontmatter inconsistency:** Only `agent-authorization`, `command-parser`, and `coordinating-loop` have `metadata` and `allowed-tools`. `agents-and-subagents-dev` and `command-dev` have only `name` and `description`. This should be standardized.
2. **No version numbers:** Only `agent-authorization` has a `version` field. The other 4 skills lack versioning.
3. **Trigger phrase coverage:** `command-dev` and `agent-authorization` have comprehensive trigger phrases. `coordinating-loop` has only 3 triggers despite having 10 eval queries that should trigger it.
4. **Script density varies wildly:** `coordinating-loop` has 8 scripts + 4 references + 2 eval files. `command-parser` has 1 reference + 0 scripts. `agents-and-subagents-dev` has 2 references + 0 scripts.
5. **Broken references in coordinating-loop:** The `skill-creator` and `gcc` skill references are dead links in this project context.
6. **All skills use relative paths:** No absolute paths found. Good practice.
7. **All scripts use `#!/usr/bin/env bash`:** Good for cross-platform compatibility (works on macOS, Linux, WSL).
8. **Stale artifacts:** `command-parser/task_plan.md` is a build artifact that shouldn't be in the skill package.
