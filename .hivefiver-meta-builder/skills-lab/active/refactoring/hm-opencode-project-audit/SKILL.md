---
name: hm-opencode-project-audit
description: This skill should be used when the user asks to "audit my OpenCode project", "check boundaries", "verify architecture", "audit skills", "check governance", "context poisoning", "cross-platform audit", "full harness audit", "validate opencode setup". Audits skills, commands, tools (built-in and custom), permissions, agents, and subagents.
metadata:
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

<files_to_read>
.opencode/skills/harness-audit/references/pointers.md
.opencode/skills/harness-audit/scripts/compile-bundle.sh
.opencode/skills/harness-audit/scripts/validate-skill.sh
</files_to_read>

# harness-audit

Comprehensive audit orchestrator for ANY OpenCode project. Reports facts, leaves judgment to the agent.

## The Iron Law

```
AUDIT REPORTS FACTS. NEVER BLOCKS. NEVER FIXES. NEVER DOES THE WORK ITSELF.
```

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
