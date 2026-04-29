---
phase: SE-1-skill-reclassification-cleanup
reviewed: 2026-04-28T01:30:00Z
depth: deep
files_reviewed: 135
files_reviewed_list:
  - .opencode/skills/hf-agent-composition/SKILL.md
  - .opencode/skills/hf-agents-and-subagents-dev/SKILL.md
  - .opencode/skills/hf-agents-md-sync/SKILL.md
  - .opencode/skills/hf-command-dev/SKILL.md
  - .opencode/skills/hf-command-parser/SKILL.md
  - .opencode/skills/hf-context-absorb/SKILL.md
  - .opencode/skills/hf-custom-tools-dev/SKILL.md
  - .opencode/skills/hf-delegation-gates/SKILL.md
  - .opencode/skills/hf-skill-synthesis/SKILL.md
  - .opencode/skills/hf-use-authoring-skills/SKILL.md
  - .opencode/skills/donotusethis-hm-planning-with-files/SKILL-DISABLED.md
  - .opencode/agents/hivefiver-agent-builder.md
  - .opencode/agents/hivefiver-command-builder.md
  - .opencode/agents/hivefiver-orchestrator.md
  - .opencode/agents/hivefiver-skill-author.md
  - .opencode/agents/hivefiver-tool-builder.md
  - .opencode/commands/hf-absorb.md
  - .opencode/commands/hf-create.md
  - .opencode/commands/hf-audit.md
  - .opencode/commands/hf-stack.md
  - .opencode/commands/hf-configure.md
  - .opencode/commands/hf-prompt-enhance.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/conductor.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/coordinator.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-code-fixer.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-code-reviewer.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-codebase-mapper.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-doc-classifier.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-doc-verifier.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-doc-writer.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-eval-auditor.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-executor.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-integration-checker.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-nyquist-auditor.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-phase-researcher.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-plan-checker.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-planner.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-project-researcher.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-roadmapper.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-security-auditor.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-ui-auditor.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/gsd-verifier.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/hf-prompter.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-agent-builder.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-command-builder.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-orchestrator.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-skill-author.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver-tool-builder.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/hivefiver.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/intent-loop.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/meta-synthesis-agent.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/phase-guardian.md
  - .hivefiver-meta-builder/agents-lab/active/refactoring/spec-verifier.md
  - .hivefiver-meta-builder/commands-lab/active/refactoring/hf-absorb.md
  - .hivefiver-meta-builder/commands-lab/active/refactoring/sync-agents-md.md
  - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-subagent-delegation-patterns/SKILL.md
  - .hivefiver-meta-builder/skills-lab/active/refactoring/hm-opencode-project-inspection/SKILL.md
  - AGENTS.md
findings:
  critical: 1
  warning: 3
  info: 3
  total: 7
status: issues_found
---

# Phase SE-1: Code Review Report

**Reviewed:** 2026-04-28T01:30:00Z
**Depth:** deep
**Files Reviewed:** 135
**Status:** issues_found

## Summary

Reviewed the 3-wave commit series (e114cdb8, f0c785db, 01f1ccd1) that renamed 10 skill directories from `hivefiver-*`/`hm-*` prefixes to the shorter `hf-*` prefix, deleted `hm-opencode-project-inspection` (merged into `hm-opencode-project-audit`), and updated cross-references across agents, commands, and AGENTS.md.

**The core rename was executed correctly** — all 10 renamed directories exist in both `.hivefiver-meta-builder/skills-lab/` and `.opencode/skills/`, and all SKILL.md `name:` frontmatter fields match their directory names. Agent skill-permission references were updated from old prefixes to new `hf-*` names.

However, AGENTS.md contains a **significant count mismatch** — it claims 21 skills but there are actually 33 active skill directories. Additionally, several evals.json files contain stale skill names, and `hm-planning-with-files` is listed in AGENTS.md as a core skill but has been disabled (renamed to `donotusethis-*`).

## Critical Issues

### CR-01: AGENTS.md Skill Count Grossly Inaccurate (21 claimed vs 33 actual)

**File:** `AGENTS.md:297`
**Issue:** AGENTS.md states "21 skills in `.opencode/skills/`" with an explicit enumeration of 5 core + 16 extended. The actual count of active skill directories is **33** (excluding `donotusethis-hm-planning-with-files`). 12 active skills are completely unlisted:

- `gate-evidence-truth`, `gate-lifecycle-integration`, `gate-spec-compliance` (3 gate skills)
- `hf-agents-md-sync` (renamed but not added to AGENTS.md list)
- `hm-completion-looping`, `hm-debug`, `hm-phase-execution`, `hm-refactor`, `hm-research-chain`, `hm-spec-driven-authoring`, `hm-subagent-delegation-patterns`, `hm-test-driven-execution` (8 hm- skills)
- `opencode-config-workflow` (1 config skill)

Additionally, `hm-planning-with-files` is listed as a core skill but the directory has been renamed to `donotusethis-hm-planning-with-files` with its SKILL.md renamed to `SKILL-DISABLED.md` — it is effectively dead but still documented as active.

This is a **documentation integrity issue** that will cause agents and developers to have an incorrect mental model of the ecosystem. The `hm-planning-with-files` reference in particular could cause agents to attempt loading a disabled skill.

**Fix:**
1. Update AGENTS.md skill count from 21 to 33 (or group accurately: e.g., 5 core + 16 extended + 8 process + 3 gate + 1 config)
2. Replace `hm-planning-with-files` in the core skills list with its actual replacement, or remove it if intentionally disabled
3. Add all 12 unlisted skills to the enumeration

## Warnings

### WR-01: hf-command-parser evals.json Contains Old Skill Name in Test Scenario

**File:** `.opencode/skills/hf-command-parser/evals/evals.json:12`
**Issue:** The eval scenario "propositional action" contains `"skill:repair hm-command-parser --no-execute priority=high"` — the old name `hm-command-parser` appears in the test prompt. While this is a test input (testing the parser's ability to handle commands), it uses a stale skill name as the test fixture. If the eval is measuring accuracy against real skill names, this could produce misleading results.

**Fix:** Update the eval scenario to use the new name:
```json
"prompt": "extract flags from command: skill:repair hf-command-parser --no-execute priority=high"
```

### WR-02: hm-planning-with-files Listed as Core Skill But Disabled

**File:** `AGENTS.md:297`
**Issue:** AGENTS.md lists `hm-planning-with-files` as one of the "5 core" skills. However, the skill directory has been renamed to `donotusethis-hm-planning-with-files` and its SKILL.md to `SKILL-DISABLED.md`. This skill cannot be loaded by the runtime. Any agent that attempts to follow AGENTS.md instructions to load this skill will fail silently (OpenCode will not find it).

**Fix:** Either:
- Remove `hm-planning-with-files` from the core skills list in AGENTS.md and replace it with an active skill, OR
- Re-enable the skill by renaming the directory and file back to their original names

### WR-03: hf-delegation-gates SKILL.md References Updated But Other Skills' `files_to_read` Not Fully Verified

**File:** `.opencode/skills/hf-delegation-gates/SKILL.md`
**Issue:** The `hf-delegation-gates` SKILL.md had its `<files_to_read>` paths correctly updated from `hivefiver-delegation-gates` to `hf-delegation-gates`. However, this was the only skill in the diff where `files_to_read` needed changing. The grep check across all `.opencode/skills/` found a stale reference in `hf-command-parser/evals/evals.json` (see WR-01). No other `files_to_read` blocks contained stale paths, confirming the cross-reference update was thorough for this specific pattern.

**Fix:** No additional fix needed for `files_to_read` — this is a note confirming the update was thorough. The related fix is WR-01 for the evals.json test fixture.

## Info

### IN-01: Multiple evals.json skill_name Fields Don't Match Directory Names

**Files:**
- `.opencode/skills/hf-agent-composition/evals/evals.json` — `skill_name: gsd-agent-composition` vs directory `hf-agent-composition`
- `.opencode/skills/hf-use-authoring-skills/evals/evals.json` — `skill_name: use-authoring-skills` vs directory `hf-use-authoring-skills`
- `.opencode/skills/hm-coordinating-loop/evals/evals.json` — `skill_name: coordinating-loop` vs directory `hm-coordinating-loop`
- `.opencode/skills/hm-meta-builder/evals/evals.json` — `skill_name: meta-builder` vs directory `hm-meta-builder`
- `.opencode/skills/hm-user-intent-interactive-loop/evals/evals.json` — `skill_name: user-intent-interactive-loop` vs directory `hm-user-intent-interactive-loop`

**Issue:** These evals.json `skill_name` values predate the SE-1 rename and contain even older names (e.g., `gsd-agent-composition`). While this was not introduced by SE-1 (it was pre-existing drift), the rename wave was an opportunity to fix them. These stale names don't affect runtime but create confusion for anyone reading eval artifacts.

**Fix:** Update each evals.json `skill_name` to match the current directory name.

### IN-02: hm-opencode-project-inspection Deleted But Backup Copy Exists in gsd-user-files-backup

**File:** `.opencode/gsd-user-files-backup/skills/hm-opencode-project-inspection/SKILL.md`
**Issue:** The skill was deleted from `.hivefiver-meta-builder/skills-lab/active/refactoring/` (correct — it was merged into `hm-opencode-project-audit`). However, a backup copy exists in `.opencode/gsd-user-files-backup/skills/hm-opencode-project-inspection/`. This is likely intentional as a backup, but should be noted for future cleanup.

**Fix:** Consider adding to backlog for cleanup in a future phase, or document the backup convention.

### IN-03: Hivefiver Agent Names Not Renamed (Consistency Note)

**Files:** `.opencode/agents/hivefiver-agent-builder.md`, `.hivefiver-agent-builder.md`, `hivefiver-command-builder.md`, etc.
**Issue:** The agent files retain the `hivefiver-*` prefix (e.g., `hivefiver-agent-builder`, `hivefiver-orchestrator`) while their associated skills were renamed to `hf-*`. This is a naming inconsistency between agents and their skills. However, agent names are a separate namespace from skill names, and renaming agents was explicitly out of scope for SE-1 (which focused on skills only). Note for future consistency work.

**Fix:** No action required for SE-1. Consider a follow-up phase to align agent naming with skill naming conventions if desired.

---

_Reviewed: 2026-04-28T01:30:00Z_
_Reviewer: gsd-code-reviewer (subagent)_
_Depth: deep_
