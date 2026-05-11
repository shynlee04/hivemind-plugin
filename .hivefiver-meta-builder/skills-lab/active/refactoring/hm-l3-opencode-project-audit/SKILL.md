---
name: hm-l3-opencode-project-audit
description: Audit OpenCode projects across skills, commands, tools, permissions, agents, and subagents. Use when checking boundaries, verifying architecture, mapping ecosystem structure, or auditing setup. NOT for code review or direct implementation.
metadata:
  layer: "3"
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

## 🔨 IRON CLAW: Tech-Stack References & Assets Consumption Governance

> **ABSOLUTE RULE:** No bundled reference, cached asset, or stale pattern from this skill shall be consumed for tech-stack API interface decisions without MCP-verified validation against the project's ACTUAL versions (package.json + lockfile), canonical source mappings (`.hivemind/STACKS-REFERENCES.md`), AND a raw codebase context scan of the current implementation state.

### Rationale

Skills bundle references and assets as ORIENTATION tools — they help you understand WHAT exists and WHERE to look. But every bundled reference is a SNAPSHOT, frozen at the moment of ingestion. Stacks evolve: packages release breaking changes, APIs shift, SDKs deprecate surfaces. Using stale bundled signatures as implementation authority produces silent runtime errors.

### Mandatory 5-Step Validation Chain

Before ANY tech-stack API interface from this skill's references/assets is used for implementation, code generation, or quality gate decisions:

```
STEP 1 — CONSUME .hivemind/STACKS-REFERENCES.md
 ├─ Read the canonical stack→repo→version mapping table
 ├─ Identify the correct GitHub repo for each dependency
 └─ Confirm the repo is active (not archived), version is current

STEP 2 — READ package.json + lockfile
 ├─ Extract the ACTUAL installed version (npm ls / grep lockfile)
 ├─ Cross-reference repo URL from STACKS-REFERENCES.md against npm registry
 └─ Flag any discrepancy between bundled version and installed version

STEP 3 — RAW CODEBASE CONTEXT SCAN
 ├─ grep/glob the actual src/ directory structure for current implementation
 ├─ Read current implementation files — not stale docs or bundled references
 ├─ Verify the claimed API signatures match current codebase reality
 └─ Check import paths, type definitions, and function signatures exist in actual code

STEP 4 — MCP LIVE VALIDATION (minimum 2 tools)
 ├─ Context7: resolve-library-id → query-docs (API signatures at installed version)
 ├─ DeepWiki: ask-question (architecture patterns, behavioral semantics)
 ├─ Repomix: pack-remote-repository (full repo analysis at correct version tag)
 ├─ Exa: web-search (latest docs, tutorials, migration guides)
 ├─ Tavily: search + extract (version-specific migration info)
 ├─ GitHub: get-file-contents (exact source verification at correct version)
 └─ GitMCP: search-code (source-level pattern matching)

STEP 5 — VERIFICATION RECORD
 ├─ Source URL + version confirmed to match package.json
 ├─ MCP tool(s) used + fetch timestamp
 ├─ Codebase scan paths + findings
 ├─ Version match status (MATCHED / MISMATCHED / UNVERIFIED)
 └─ Flag as BLOCKING if version mismatch or critical staleness detected
```

### Consumption Rules

| Action | Rule |
|--------|------|
| **Orientation** (understanding WHAT exists, WHERE to look) | ✅ Reference-tier allowed from bundled assets without live validation |
| **API signature lookup** for implementation | 🚫 BLOCKED without live MCP validation (Step 4) + codebase scan (Step 3) |
| **Interface verification** for quality gates | 🚫 BLOCKED without live MCP validation (Step 4) + version match (Step 2) |
| **Version-sensitive behavioral claims** | 🚫 BLOCKED without live MCP validation (Step 4) |
| **Architecture pattern understanding** | ✅ Reference-tier allowed, but recommend live verification for production decisions |
| **Generating code from bundled patterns** | 🚫 BLOCKED — route to live MCP tools for current API surface |

### Integrated Enforcement Points

| Workflow Phase | IRON CLAW Trigger | Required Validation |
|---------------|-------------------|---------------------|
| Implementation | Before using any API from bundled refs | Steps 2-4 minimum |
| Code review | When verifying API usage against docs | Steps 2-4 minimum |
| Quality gate | Before PASS verdict on interface claims | Steps 1-5 full |
| Research | When synthesizing findings from cached assets | Steps 4-5 minimum |
| Audit | When reporting version-based findings | Steps 1-5 full |

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
