---
name: harness-audit
description: Use when auditing harness architecture, boundary integrity, claim-vs-reality gaps, governance workflows, context poisoning, or cross-platform compatibility. Triggers on "audit harness", "check boundaries", "verify architecture", "audit skills", "check governance", "context poisoning", "cross-platform audit".
metadata:
  layer: "1"
  role: "auditor"
  version: "2.0.0"
---

# harness-audit

Comprehensive audit skill for the HiveMind V3 harness. Reports facts, leaves judgment to the agent. This skill orchestrates parallel subagents — it does NOT do audit work itself.

## The Iron Law

```
AUDIT REPORTS FACTS. NEVER BLOCKS. NEVER FIXES. NEVER DOES THE WORK ITSELF.
```

## On Load

1. **Read project context:** `AGENTS.md`, `opencode.json`, `package.json`
2. **Do NOT load** other skills unless the audit specifically needs them
3. **Dispatch subagents** using the envelopes below — do NOT perform audit checks yourself

## Delegation Architecture

You are the coordinator. Your job is to:
1. Dispatch 4 parallel subagents (Phases 1-4)
2. Collect their reports
3. Synthesize into final audit-report.md
4. Run Phase 5 mandate gate

Each subagent gets a fully constructed prompt below. Copy the prompt text into the Task tool. Do NOT reference files — paste the full task.

---

## PHASE 1: Source & Distribution Inventory (PARALLEL)

**Dispatch this as a subagent:**

```
You are an audit specialist. Your task: inventory the HiveMind V3 harness source tree and distribution outputs.

CONTEXT:
This is a TypeScript npm package (opencode-harness) that provides tools, hooks, and a plugin for OpenCode.
Source lives in src/, build output in dist/, soft meta-concepts in .opencode/.

YOUR TASK:
1. Scan src/ — list every file with path, type (.ts/.json/.md), and line count
2. Scan dist/ — list every built file, map back to src/ source
3. Scan .opencode/ — catalog skills, agents, commands, rules with their file paths
4. Check src/index.ts re-exports — do they match actual src/lib/ modules?
5. Check src/plugin.ts — is it under 100 LOC? Does it only wire tools+hooks (no business logic)?
6. Check package.json exports — do they match actual dist/ files?
7. Verify no .opencode/ content bleeds into src/ (hard harness must be pure)
8. Verify no business logic in plugin.ts

OUTPUT FORMAT — return ONLY this JSON structure:
{
  "phase": "source-distribution-inventory",
  "source_files": [{"path": "...", "type": "...", "lines": N}],
  "dist_files": [{"path": "...", "source": "..."}],
  "opencode_catalog": {"skills": [...], "agents": [...], "commands": [...], "rules": [...]},
  "boundary_violations": [{"type": "...", "description": "...", "severity": "CRITICAL|WARNING|INFO"}],
  "export_gaps": [{"claim": "...", "reality": "..."}],
  "plugin_health": {"loc": N, "has_business_logic": bool, "issues": [...]}
}

RULES:
- Report facts only. Do NOT fix anything.
- Do NOT read files outside src/, dist/, .opencode/, package.json
- If a file doesn't exist, note it — don't assume it should
```

---

## PHASE 2: Claim vs Reality Validation (PARALLEL)

**Dispatch this as a subagent:**

```
You are an audit specialist. Your task: verify every claim in documentation against actual implementation.

CONTEXT:
The HiveMind V3 harness makes claims in AGENTS.md, docs/, README, code comments, and skill descriptions.
Each claim must be verified against actual code in src/.

YOUR TASK:
1. Extract ALL claims from these sources:
   - AGENTS.md (architecture rules, module sizes, dependency rules)
   - package.json (description, dependencies, peer dependencies)
   - Any docs/ files that exist
   - Skill descriptions in .opencode/skills/*/SKILL.md
   - Command descriptions in .opencode/commands/*.md

2. For EACH claim, find the implementation evidence:
   - Feature claims → find the src/ file that implements it
   - Architecture claims → verify code structure matches
   - Completion claims → check tests exist and pass
   - Compatibility claims → verify across platforms

3. Classify each claim:
   - MATCH: claim is accurate and verified
   - GAP: claim is partially true, missing pieces
   - HALLUCINATION: claim has no supporting evidence
   - ORPHAN: implementation exists but no claim documents it
   - OUTDATED: claim was true but is no longer accurate

4. Specifically verify:
   - "Max 500 LOC per module" — check every src/lib/*.ts
   - "No circular dependencies" — trace import graph
   - "types.ts is leaf" — verify it imports nothing
   - "lifecycle-manager.ts has deepest chain" — verify dependency depth
   - "5 tools, hooks, lifecycle, delegation, continuity" — count actual implementations

OUTPUT FORMAT — return ONLY this JSON structure:
{
  "phase": "claim-vs-reality",
  "claims": [
    {
      "text": "exact claim",
      "source": "file:line",
      "category": "feature|architecture|completion|compatibility|performance",
      "evidence": "what verifies or refutes it",
      "status": "MATCH|GAP|HALLUCINATION|ORPHAN|OUTDATED",
      "impact": "what this means"
    }
  ],
  "summary": {
    "total_claims": N,
    "match": N,
    "gap": N,
    "hallucination": N,
    "orphan": N,
    "outdated": N
  }
}

RULES:
- Report facts only. Do NOT fix anything.
- Every claim must have a source file reference.
- Do NOT assume claims are true — verify each one.
```

---

## PHASE 3: Governance & Workflow Coherence (PARALLEL)

**Dispatch this as a subagent:**

```
You are an audit specialist. Your task: audit governance artifacts (skills, commands, agents) for coherence, conflicts, and context poisoning.

CONTEXT:
The HiveMind V3 harness defines skills, commands, and agents in .opencode/.
These must have deterministic execution paths, non-overlapping triggers, and acyclic delegation.

YOUR TASK:
1. Command Integrity — for each .opencode/commands/*.md:
   - Verify YAML frontmatter is valid (description, agent fields exist)
   - Check agent assignment references a real agent in .opencode/agents/
   - Check for subtask: true/false — is it set?
   - Verify command body is deterministic (no ambiguous instructions)
   - Check for hardcoded paths or OS-specific assumptions

2. Skill Trigger Analysis — for each .opencode/skills/*/SKILL.md:
   - Verify SKILL.md exists and has valid frontmatter (name, description)
   - Extract trigger patterns from description
   - Compare triggers across ALL skills — flag overlaps
   - Check for skills that could fire on same user input (context poisoning)
   - Verify skills don't assume they're the only skill loaded

3. Agent Definition Audit — for each .opencode/agents/*.md:
   - Verify agent file exists and has valid structure
   - Check agent roles don't overlap unnecessarily
   - Verify delegation chains are acyclic (no circular delegation)
   - Check agents reference actual skills/commands that exist

4. Context Poisoning Map:
   - For each pair of skills, compare trigger patterns
   - For each pair of commands, check for ambiguous routing
   - Flag any instruction overlaps that could cause double execution or conflicting decisions

OUTPUT FORMAT — return ONLY this JSON structure:
{
  "phase": "governance-workflow-coherence",
  "commands": [
    {
      "name": "...",
      "valid_frontmatter": bool,
      "agent_exists": bool,
      "subtask_set": bool,
      "deterministic": bool,
      "issues": [...]
    }
  ],
  "skills": [
    {
      "name": "...",
      "valid_frontmatter": bool,
      "triggers": [...],
      "overlap_with": [...],
      "issues": [...]
    }
  ],
  "agents": [
    {
      "name": "...",
      "exists": bool,
      "role_overlap_with": [...],
      "delegation_chain": [...],
      "issues": [...]
    }
  ],
  "context_poisoning": [
    {
      "type": "trigger_overlap|instruction_conflict|ambiguous_routing",
      "artifacts": ["skill-a", "skill-b"],
      "risk": "LOW|MEDIUM|HIGH",
      "description": "..."
    }
  ]
}

RULES:
- Report facts only. Do NOT fix anything.
- Compare EVERY skill against EVERY other skill for trigger overlap.
- Do NOT assume agent files exist — verify each one.
```

---

## PHASE 4: Cross-Platform & Environmental Audit (PARALLEL)

**Dispatch this as a subagent:**

```
You are an audit specialist. Your task: audit the harness for OS compatibility, platform assumptions, and environmental dependencies.

CONTEXT:
The HiveMind V3 harness should work across macOS, Linux, and Windows.
Skills should be platform-agnostic. Commands should not assume specific environments.

YOUR TASK:
1. OS Compatibility — scan ALL bash commands in:
   - .opencode/commands/*.md
   - .opencode/skills/*/SKILL.md
   - .opencode/skills/*/references/*.md
   - src/ (any shell commands in code)
   Flag: Linux-only commands, macOS-only commands, Windows-incompatible paths

2. Path Assumptions — check for:
   - Hardcoded absolute paths
   - Platform-specific path separators
   - Home directory references (~/, $HOME, %USERPROFILE%)
   - External file references (e.g., ~/.claude/**/*.md)

3. Environment Variable Assumptions — check for:
   - Required env vars not documented
   - Platform-specific env var handling
   - Missing fallback defaults

4. Tool Dependencies — check for:
   - Tools assumed present but not declared
   - Platform-specific tool requirements
   - Version constraints not specified

5. Skill Portability — check for:
   - Skills that only work on OpenCode (not agentskills.io compatible)
   - Skills with hardcoded OpenCode-specific assumptions
   - Skills that aren't self-contained

OUTPUT FORMAT — return ONLY this JSON structure:
{
  "phase": "cross-platform-environmental",
  "os_compatibility": {
    "macos": {"issues": [...]},
    "linux": {"issues": [...]},
    "windows": {"issues": [...]}
  },
  "path_assumptions": [
    {"location": "file:line", "type": "absolute|platform_specific|home_dir", "value": "..."}
  ],
  "env_var_issues": [
    {"name": "...", "issue": "...", "severity": "CRITICAL|WARNING|INFO"}
  ],
  "tool_dependencies": [
    {"tool": "...", "assumed": bool, "declared": bool, "platform_specific": bool}
  ],
  "skill_portability": [
    {"skill": "...", "platform_locked": bool, "issues": [...]}
  ]
}

RULES:
- Report facts only. Do NOT fix anything.
- Scan ALL files that contain shell commands or path references.
- Flag even minor assumptions — let the user decide severity.
```

---

## PHASE 5: Synthesis & Mandate Gate (SEQUENTIAL — after 1-4)

After collecting all 4 phase reports, synthesize:

1. Merge all findings into a single audit-report.md using this structure:

```markdown
# Harness Audit Report - [DATE]

## Executive Summary
- Overall health: [CRITICAL/WARNING/HEALTHY]
- Critical issues: [count]
- Warnings: [count]
- Info: [count]

## Critical Issues (Must Fix)
[Each issue with: location, description, impact]

## Warnings (Should Fix)
[Each issue with: location, description, impact]

## Informational
[Observations, suggestions]

## Claim vs Reality Table
| Claim | Source | Status | Evidence |
|-------|--------|--------|----------|

## Context Poisoning Map
| Artifacts | Overlap Type | Risk | Description |
|-----------|-------------|------|-------------|

## Cross-Platform Matrix
| Factor | macOS | Linux | Windows |
|--------|-------|-------|---------|

## Recommendations
[Prioritized list]
```

2. Run the Mandate Gate — STOP and report immediately if ANY of these are true:
   - Hard harness (src/) contains soft meta-concepts
   - Circular dependencies in delegation chains
   - Claims of 100% completion that don't match reality
   - Context poisoning that would cause workflow failures
   - OS-specific assumptions that would break on other platforms
   - Skills that edit files directly instead of delegating
   - Commands with ambiguous or non-deterministic execution paths

3. Write the report to `docs/audit/audit-report-YYYY-MM-DD.md`

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Fixer** — editing files during audit | Did this skill call write/edit? | STOP. Audit only. Report findings. |
| **The Hoarder** — doing all work yourself | No Task tool calls for subagents | Dispatch subagents. You coordinate. |
| **The Blocker** — halting progress on warnings | Audit blocking non-critical work | Report facts. Let user decide. |
| **The Assumer** — assuming context not read | Referencing files not loaded | Read first, then audit. |
| **The Completer** — claiming 100% without verification | "All good" without checking | Verify every claim. |

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| CRITICAL | Broken functionality, data loss risk | Must fix before any other work |
| WARNING | Potential issue, may cause failures | Should fix soon |
| INFO | Observation, improvement opportunity | Fix when convenient |
