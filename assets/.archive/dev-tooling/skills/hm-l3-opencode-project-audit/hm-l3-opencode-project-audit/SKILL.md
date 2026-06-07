---
name: hm-l3-opencode-project-audit
description: Audit OpenCode projects across skills, commands, tools, permissions, agents, and subagents. Use when checking boundaries, verifying architecture, mapping ecosystem structure, or auditing setup. NOT for code review or direct implementation.
metadata:
  consumed-by:
    - "hm-l2-auditor"
    - "hf-l2-auditor"
  lineage-scope: "hm+hf"
  access: "FLEXIBLE"
  layer: "1"
  role: "auditor"
  pattern: P3
  version: "3.0.0"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
---

## Overview

Comprehensive audit of OpenCode project configuration across skills, agents, commands, tools, and permissions. Use when onboarding to a new project, after structural changes, or when verifying ecosystem integrity. Produces a fact-based audit report covering boundaries, governance, and configuration health.

## The Iron Law

```
AUDIT REPORTS FACTS. NEVER BLOCKS. NEVER FIXES. NEVER DOES THE WORK ITSELF.
```

<files_to_read>
.opencode/skills/harness-audit/references/pointers.md
.opencode/skills/harness-audit/scripts/compile-bundle.sh
.opencode/skills/harness-audit/scripts/validate-skill.sh
</files_to_read>

# harness-audit

Comprehensive audit orchestrator for ANY OpenCode project. Reports facts, leaves judgment to the agent.
## Architecture

```
harness-audit/
├── SKILL.md                    # Thin orchestrator (this file) — no YAML agent config
├── assets/
│   └── profiles/               # 7 subagent profile templates
│       ├── phase-1-skills.md
│       ├── phase-2-commands.md
│       ├── phase-3-tools.md
│       ├── phase-4-permissions.md
│       ├── phase-5-agents.md
│       ├── phase-6-subagents.md
│       └── phase-7-synthesis.md
├── references/                 # Skill pointers for execution_context
│   └── pointers.md
└── scripts/
    ├── compile-bundle.sh
    └── validate-skill.sh
```

## On Load

1. Run `bash scripts/compile-bundle.sh` — compiles all 7 subagent profiles
2. Run `bash scripts/validate-skill.sh` — validates structure before dispatch
3. Read project context: `opencode.json`, `AGENTS.md`
4. Apply the official OpenCode scope matrix before deciding what exists or is missing: agents in `.opencode/agents` or `opencode.json.agent`, commands in `.opencode/commands` or `opencode.json.command`, config overrides from `OPENCODE_CONFIG`/`OPENCODE_CONFIG_DIR`, and rules precedence from `AGENTS.md`/`CLAUDE.md` plus configured instructions.

## Execution Flow

### Phase 0: Bootstrap (FIRST RUN ONLY)
If `assets/profiles/` is empty, inform user:
> "Subagent bundle compiled. Please restart session and re-run audit."

### Phases 1-6: Parallel Dispatch (run simultaneously)

| Phase | Target | Profile | Execution Context |
|-------|--------|---------|-------------------|
| 1 | Skills | `assets/profiles/phase-1-skills.md` | `use-authoring-skills` |
| 2 | Commands | `assets/profiles/phase-2-commands.md` | `command-dev` |
| 3 | Tools | `assets/profiles/phase-3-tools.md` | `custom-tools-dev` |
| 4 | Permissions | `assets/profiles/phase-4-permissions.md` | `opencode-platform-reference` |
| 5 | Agents | `assets/profiles/phase-5-agents.md` | `agents-and-subagents-dev` |
| 6 | Subagents | `assets/profiles/phase-6-subagents.md` | `agents-and-subagents-dev` |
| 7 | Verification | spec-verifier agent | Independent validation pass |

Dispatch each via Task tool with `run_in_background: true`.

### Phase 7: Sequential Synthesis (after 1-6 complete)

| Profile | Focus |
|---------|-------|
| `assets/profiles/phase-7-synthesis.md` | Aggregate all findings, write audit-report-YYYY-MM-DD.md |

## Subagent Profile Envelope

Each profile contains:

```
role: <specialist-auditor>
core_principle: <audit focus>
verification_dimensions:
  - <dimension-name>: <what to verify>
templates:
  - name: <template-name>
    description: <what-to-check>
    command: <bash-command-if-applicable>
forbidden_files:
  - <paths-to-avoid>
critical_rules:
  - <rule-1>
  - <rule-2>
structured_returns:
  findings: <json-schema>
  evidence: <file-references>
  risk_level: <none|low|medium|high|critical>
success_criteria:
  - <criterion-1>
  - <criterion-2>
```

## Dispatch Protocol

```
delegate-task (run_in_background: true)
  └── spawns: 6 parallel subagents (Phases 1-6)
      └── each MAY spawn multiple children for deep investigation
  └── after all complete → Phase 7 (sequential)
```

- NO YAML agent configuration files
- All routing controlled via this SKILL.md
- One subagent can spawn multiple children
- Parallel: 4-6 simultaneous subagents maximum

## Inputs

| Input | Description | Required |
|-------|-------------|----------|
| `target_repo` | Path to OpenCode project | Yes (defaults to cwd) |
| `scope` | full | No |

## RICH Gate Source Decisions

| Source | Decision | Local adaptation |
|--------|----------|------------------|
| OpenCode official agents docs | ADOPT | Audit checks primary/subagent mode, tool permissions, markdown/JSON definition surfaces. |
| OpenCode official commands docs | ADOPT | Audit includes command frontmatter/config, `$ARGUMENTS`, positional args, shell output, file references, and `subtask`. |
| OpenCode official config/rules docs | ADOPT | Audit reports config precedence, `OPENCODE_CONFIG_DIR`, managed config, AGENTS/CLAUDE precedence, and configured instruction files. |
| GitHub agent skill resource model | ADAPT | Bundled profiles/scripts are retained as professional resources; audit outputs remain fact reports. |

## Independence Notes

This skill audits arbitrary OpenCode projects. It must not require HiveMind/GSD/BMAD paths. If a target project lacks `.opencode/`, inspect official global/config override locations before reporting absence.

## Outputs

`audit-report-YYYY-MM-DD.md` with:
- Per-phase findings (structured JSON)
- Cross-phase risk assessment
- Remediation recommendations
- Evidence file references

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Fixer** | Skill calls write/edit | STOP. Report only. |
| **The Hoarder** | No Task tool calls | Dispatch subagents. |
| **The Blocker** | Blocking on warnings | Report facts. |
| **The Executor** | Editing instead of delegating | Delegate. |

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Broken functionality | Must fix |
| WARNING | May cause failures | Should fix |
| INFO | Improvement opportunity | Fix when convenient |

## Self-Correction

### When the Task Keeps Failing

[Detection] If subagent bundles fail to compile (scripts/compile-bundle.sh exits non-zero), check whether the `assets/profiles/` directory is populated — on first run, profiles may need to be generated before compilation. If subagents return empty or malformed findings, verify that the dispatch envelope included the correct execution context skill reference and that the target repository path is accessible. If Phase 7 (synthesis) cannot aggregate findings because earlier phases returned errors, re-dispatch only the failed phases rather than restarting the entire audit.

[Recovery] Check profile directory population first. Re-dispatch only failed phases. Verify execution context skill names match actual available skills.

### When Unsure About the Next Step

[Detection] If you cannot determine whether to run a full audit (all 7 phases) or a targeted audit, check the user's request — if they asked about a specific surface (e.g., "check my skills"), run only that phase. If the request is broad ("audit my project"), run all phases. If the project has no `.opencode/` directory, check global and config override locations before reporting absence — OpenCode can be configured entirely through global config.

[Recovery] Match audit scope to user request. Check override locations before reporting absence. For partial audits, note which phases were skipped in the report.

### When the User Contradicts Skill Guidance

[Detection] If the user asks you to fix issues found during the audit, remind them of the Iron Law — the audit reports facts, it does not fix. Offer to route the findings to the appropriate fix workflow (e.g., code review, refactor, debug) but do not apply fixes within the audit session. If the user disagrees with a severity classification (e.g., thinks a WARNING should be INFO), accept their reclassification but document both the original and user-adjusted severity in the audit report.

[Recovery] Route fixes to appropriate workflows. Document severity reclassifications with both values. Never apply fixes within audit.

### When an Edge Case Is Encountered

[Detection] If the target project has a mixed configuration (some primitives in `.opencode/`, some in global config, some in environment variables), the audit must report the actual configuration source for each primitive, not assume `.opencode/` as the default. If a subagent profile references an execution context skill that doesn't exist in the current environment, load the closest available equivalent and note the substitution. If the audit discovers circular dependencies between skills/agents/commands, report the cycle explicitly in the synthesis phase rather than letting subagents handle it independently.

[Recovery] Report actual configuration sources per primitive. Substitute unavailable execution context skills with closest equivalents. Escalate circular dependencies to synthesis phase.

## Self-Correction (continued)

### When the Audit Report Grows Unmanageably Large

[Detection] If the synthesis phase produces a report exceeding reasonable length, prioritize CRITICAL and WARNING findings in the summary. Move INFO-level findings to an appendix. If evidence file references are broken (files moved or deleted during audit), mark them as unverifiable rather than removing them.

[Recovery] Prioritize findings by severity. Move INFO to appendix. Mark broken evidence references as unverifiable.
