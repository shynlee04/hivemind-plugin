# ses_2bb1

**Session ID:** ses_2bb1
**Created:** 4/1/2026, 12:25:48 AM
**Updated:** 4/1/2026, 12:28:49 AM

---

## Table of Contents

| # | Timestamp | Actor | Tools | Summary |
|---|-----------|-------|-------|---------|

---
## User



---
## User



---
**Tool:** skill

**Input:**
```json
{"name":"use-hivemind"}
```

**Output:**
```
<skill_content name="use-hivemind">
# Skill: use-hivemind

# use-hivemind

## Purpose

Resolve one question before any action: "Am I the orchestrator or an executor?" Then gate project validity. Then route.

## GATE 0: Role Lineage Detection

Check ONE signal: does this agent receive instructions from a human, or from a delegation packet?

| Signal | Orchestrator | Executor |
|--------|-------------|----------|
| Prompt source | Human user directly | Delegation packet from another agent |
| Session type | Primary session | Sub-session (delegated) |
| context.ask() | Available (human in loop) | Not available (autonomous within bounds) |

Resolution rules:
1. Human prompt + context.ask() available → ORCHESTRATOR
2. Pre-defined scope + return contract → EXECUTOR
3. Ambiguous signal → assume ORCHESTRATOR (safer default)
4. Executor signal but no packet → BLOCK, escalate

Load exactly ONE reference after resolution:

| Role | Load |
|------|------|
| Orchestrator | `references/orchestrator-entry.md` |
| Executor | `references/executor-entry.md` |

## GATE 1: Project Validity

Run: `node scripts/hm-entry-gate.cjs --cwd <project-root>`

Exit code 0, PASS → proceed.
Exit code 0, DEGRADED → proceed with caution. Log soft warnings.
Exit code 1, FAIL → STOP. Report failures. Do not proceed.

Run GATE 1 once per session start (or when context feels uncertain). Not every turn.

## Post-Gate Routing

After GATE 0 + GATE 1 resolve, load routing and intelligence references:

### Protocol References (loaded by both branches)

| File | Contains |
|------|----------|
| `references/agent-roles.md` | Per-agent capability matrix for routing resolution |
| `references/role-boundaries.md` | Session positioning, lineage detection, delegation thresholds |
| `references/domain-coupling-map.md` | Intent → specialist → depth reference routing table |

### Intelligence References (loaded after routing)

| File | Contains |
|------|----------|
| `references/project-state-awareness.md` | Phase detection, blockage signals, doc trustworthiness, distrust levels |
| `references/task-classification.md` | Request type classification matrix with routing targets |
| `references/session-state.md` | Session continuity: fresh, resume, post-compaction tracking |

### Templates

| File | Contains |
|------|----------|
| `templates/load-template.md` | Dynamic batch loading templates for common workflows |

### Scripts

| File | Contains |
|------|----------|
| `scripts/hm-entry-gate.cjs` | Universal project validity gate (6 gates, zero deps) |

## Turn Loop

Re-enter GATE 0 every turn. Do not carry state between turns except what the orchestrator persists via git memory.

```
Turn start → GATE 0 → Load role reference → Follow role protocol → Turn end
                                                                      │
                                                Next turn → GATE 0 ──┘
```

## Hard Blocks

- Skip GATE 0 → BLOCK
- Load BOTH branch references → BLOCK
- Act before role resolved → BLOCK
- Executor loading governance content → BLOCK
- Proceed past GATE 1 when script fails → BLOCK

## Platform

Framework-agnostic. Works in OpenCode, Claude Code, Cursor, Gemini CLI, and any agent system that supports skill loading. Platform-specific behaviors handled by the platform layer, not by this skill.

## Independence Rules

- No implementation — routes only
- No deep reads — context assessment is shallow
- No mutation — never writes files, modifies state, or commits
- No how-to-implement — delegates process guidance only

Base directory for this skill: file:///Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/templates/load-template.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/scripts/hm-entry-gate.cjs</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/context-rot-defense.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/orchestrator-self-assessment.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/verification-before-completion.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/orchestrator-entry.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/task-classification.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/intent-classification.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/context-health-protocol.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/agent-roles.md</file>
</skill_files>
</skill_content>
```

---
**Tool:** skill

**Input:**
```json
{"name":"use-hivemind"}
```

**Output:**
```
<skill_content name="use-hivemind">
# Skill: use-hivemind

# use-hivemind

## Purpose

Resolve one question before any action: "Am I the orchestrator or an executor?" Then gate project validity. Then route.

## GATE 0: Role Lineage Detection

Check ONE signal: does this agent receive instructions from a human, or from a delegation packet?

| Signal | Orchestrator | Executor |
|--------|-------------|----------|
| Prompt source | Human user directly | Delegation packet from another agent |
| Session type | Primary session | Sub-session (delegated) |
| context.ask() | Available (human in loop) | Not available (autonomous within bounds) |

Resolution rules:
1. Human prompt + context.ask() available → ORCHESTRATOR
2. Pre-defined scope + return contract → EXECUTOR
3. Ambiguous signal → assume ORCHESTRATOR (safer default)
4. Executor signal but no packet → BLOCK, escalate

Load exactly ONE reference after resolution:

| Role | Load |
|------|------|
| Orchestrator | `references/orchestrator-entry.md` |
| Executor | `references/executor-entry.md` |

## GATE 1: Project Validity

Run: `node scripts/hm-entry-gate.cjs --cwd <project-root>`

Exit code 0, PASS → proceed.
Exit code 0, DEGRADED → proceed with caution. Log soft warnings.
Exit code 1, FAIL → STOP. Report failures. Do not proceed.

Run GATE 1 once per session start (or when context feels uncertain). Not every turn.

## Post-Gate Routing

After GATE 0 + GATE 1 resolve, load routing and intelligence references:

### Protocol References (loaded by both branches)

| File | Contains |
|------|----------|
| `references/agent-roles.md` | Per-agent capability matrix for routing resolution |
| `references/role-boundaries.md` | Session positioning, lineage detection, delegation thresholds |
| `references/domain-coupling-map.md` | Intent → specialist → depth reference routing table |

### Intelligence References (loaded after routing)

| File | Contains |
|------|----------|
| `references/project-state-awareness.md` | Phase detection, blockage signals, doc trustworthiness, distrust levels |
| `references/task-classification.md` | Request type classification matrix with routing targets |
| `references/session-state.md` | Session continuity: fresh, resume, post-compaction tracking |

### Templates

| File | Contains |
|------|----------|
| `templates/load-template.md` | Dynamic batch loading templates for common workflows |

### Scripts

| File | Contains |
|------|----------|
| `scripts/hm-entry-gate.cjs` | Universal project validity gate (6 gates, zero deps) |

## Turn Loop

Re-enter GATE 0 every turn. Do not carry state between turns except what the orchestrator persists via git memory.

```
Turn start → GATE 0 → Load role reference → Follow role protocol → Turn end
                                                                      │
                                                Next turn → GATE 0 ──┘
```

## Hard Blocks

- Skip GATE 0 → BLOCK
- Load BOTH branch references → BLOCK
- Act before role resolved → BLOCK
- Executor loading governance content → BLOCK
- Proceed past GATE 1 when script fails → BLOCK

## Platform

Framework-agnostic. Works in OpenCode, Claude Code, Cursor, Gemini CLI, and any agent system that supports skill loading. Platform-specific behaviors handled by the platform layer, not by this skill.

## Independence Rules

- No implementation — routes only
- No deep reads — context assessment is shallow
- No mutation — never writes files, modifies state, or commits
- No how-to-implement — delegates process guidance only

Base directory for this skill: file:///Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/templates/load-template.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/scripts/hm-entry-gate.cjs</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/context-rot-defense.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/orchestrator-self-assessment.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/verification-before-completion.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/orchestrator-entry.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/task-classification.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/intent-classification.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/context-health-protocol.md</file>
<file>/Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/references/agent-roles.md</file>
</skill_files>
</skill_content>
```

---
**Tool:** bash

**Input:**
```json
{"command":"node /Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/scripts/hm-entry-gate.cjs --cwd /Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/refactoring-skills","description":"Run HiveMind entry gate check"}
```

**Output:**
```
{
  "passed": false,
  "verdict": "FAIL",
  "gates": [
    {
      "id": "manifest",
      "label": "Project manifest exists and parseable",
      "severity": "hard",
      "data": {
        "error": "no manifest found"
      },
      "passed": false
    },
    {
      "id": "build",
      "label": "Build/typecheck passes",
      "severity": "soft",
      "data": {
        "note": "no build command detected",
        "manager": "unknown"
      },
      "passed": true
    },
    {
      "id": "git-state",
      "label": "Git state is known",
      "severity": "hard",
      "data": {
        "clean": false,
        "dirtyCount": 702
      },
      "passed": true
    },
    {
      "id": "deps-critical",
      "label": "No broken critical dependencies",
      "severity": "soft",
      "data": {
        "error": "no manifest found"
      },
      "passed": true
    },
    {
      "id": "doc-freshness",
      "label": "Documentation not obviously stale",
      "severity": "soft",
      "data": {
        "note": "no docs found"
      },
      "passed": true
    },
    {
      "id": "structure-health",
      "label": "No obvious structural issues",
      "severity": "soft",
      "data": {
        "rootMdCount": 0,
        "hasGitignore": false,
        "warning": "no .gitignore found"
      },
      "passed": false
    }
  ]
}

```

---
**Tool:** bash

**Input:**
```json
{"command":"node /Users/apple/hivemind-plugin/.worktrees/product-detox/.opencode/skills/use-hivemind/scripts/hm-entry-gate.cjs --cwd /Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/refactoring-skills","description":"Run HiveMind entry gate check"}
```

**Output:**
```
{
  "passed": false,
  "verdict": "FAIL",
  "gates": [
    {
      "id": "manifest",
      "label": "Project manifest exists and parseable",
      "severity": "hard",
      "data": {
        "error": "no manifest found"
      },
      "passed": false
    },
    {
      "id": "build",
      "label": "Build/typecheck passes",
      "severity": "soft",
      "data": {
        "note": "no build command detected",
        "manager": "unknown"
      },
      "passed": true
    },
    {
      "id": "git-state",
      "label": "Git state is known",
      "severity": "hard",
      "data": {
        "clean": false,
        "dirtyCount": 702
      },
      "passed": true
    },
    {
      "id": "deps-critical",
      "label": "No broken critical dependencies",
      "severity": "soft",
      "data": {
        "error": "no manifest found"
      },
      "passed": true
    },
    {
      "id": "doc-freshness",
      "label": "Documentation not obviously stale",
      "severity": "soft",
      "data": {
        "note": "no docs found"
      },
      "passed": true
    },
    {
      "id": "structure-health",
      "label": "No obvious structural issues",
      "severity": "soft",
      "data": {
        "rootMdCount": 0,
        "hasGitignore": false,
        "warning": "no .gitignore found"
      },
      "passed": false
    }
  ]
}

```

---
**Tool:** bash

**Input:**
```json
{"command":"ls /Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/refactoring-skills/aACTIVE-TASKS.md 2>&1 || echo \"NOT FOUND\"","description":"Check if aACTIVE-TASKS.md exists"}
```

**Output:**
```
ls: /Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/refactoring-skills/aACTIVE-TASKS.md: No such file or directory
NOT FOUND

```

---
**Tool:** bash

**Input:**
```json
{"command":"ls /Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/refactoring-skills/aACTIVE-TASKS.md 2>&1 || echo \"NOT FOUND\"","description":"Check if aACTIVE-TASKS.md exists"}
```

**Output:**
```
ls: /Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/refactoring-skills/aACTIVE-TASKS.md: No such file or directory
NOT FOUND

```

---
**Tool:** bash

**Input:**
```json
{"command":"ls /Users/apple/hivemind-plugin/.worktrees/product-detox/.developing-skills/refactoring-skills/use-hivemind/references/ 2>&1","description":"List use-hivemind references directory"}
```

**Output:**
```
absolute-entry-variables.md
agent-roles.md
anti-patterns-compendium.md
context-health-protocol.md
context-rot-defense.md
domain-coupling-map.md
executor-entry.md
intent-classification.md
orchestrator-entry.md
orchestrator-mandate.md
orchestrator-self-assessment.md
project-state-awareness.md
role-boundaries.md
session-state.md
task-classification.md
verification-before-completion.md

```

---
**Tool:** glob

**Input:**
```json
{"pattern":"**/aACTIVE-TASKS.md"}
```

**Output:**
```
No files found
```

---
**Tool:** glob

**Input:**
```json
{"pattern":"**/aACTIVE-TASKS.md"}
```

**Output:**
```
No files found
```

---
