---
name: use-hivemind
description: Master entry point for HiveMind framework. MUST LOAD FIRST at session start, after compaction, on context uncertainty, or when user mentions "hive", "hivemind", "framework", "meta", "skill". Sets entire framework context, resolves lineages, establishes delegation network, and provides platform-specific activation guidance. All other use-hivemind-* skills branch from this activator.
---

# use-hivemind

Master entry point for HiveMind Context Governance framework. Routes, does NOT implement.

## When to Activate

**MUST LOAD at:** Session start, after `/clear`, context confusion, user mentions "hivemind"/"hive"/"framework"/"meta".

**Primary Triggers:** "use hivemind", "hive framework", "what is hivemind", "start hivemind", "load hivemind", "hivemind skills", "framework guide", "meta framework"

**Secondary Triggers:** "how does hivemind work", "which lineage", "hiveminder or hivefiver", "skill routing", "agent hierarchy"

## Do NOT Activate When

| Condition | Action |
|-----------|--------|
| Context depth >70% | Defer to `context-intelligence-entry` |
| Session degraded/interrupted | Skip activation |
| Active skills ≥3 | Skip activation (stack budget) |
| Domain work (not framework) | Use domain skills directly |
| Another meta-skill active | Defer to active meta-skill |

## Two Lineages

| Lineage | Purpose | Primary Agent | Work Type |
|---------|---------|---------------|-----------|
| **hivefiver** | Meta-builder | `hivefiver.md` | Framework development, skill creation |
| **hiveminder** | Project-oriented | `hiveminder.md` | Product development, implementation |

**Detection:** Agent name → hivefiver/hiveminder. Task context → "write skill" = hivefiver, "implement feature" = hiveminder. File paths → `.opencode/skills/` = hivefiver, `src/` = hiveminder.

## Platform Detection

| Platform | Detection | Skill Loading |
|----------|-----------|---------------|
| OpenCode | `.opencode/`, `opencode.json` | `skill` tool loads SKILL.md |
| Claude Code | `.claude/`, `CLAUDE.md` | `skill` tool |
| Cursor | `.cursor/`, `.cursorrules` | Rules system |
| Codex | `.codex/`, `CODEX.md` | Task context |
| Gemini | `.gemini/` | Prompt engineering |

**Terminology:** Skill=SKILL.md. Agent=`.opencode/agents/*.md`. Tool=built-in capability. Task=work unit with delegation. Permission=access control.

## Conditional Loading

**Session Start:** Always load `use-hivemind`. Conditionally: `context-intelligence-entry` (if context_health>70%), `use-hivemind-session-resume` (if session_resumed), `use-hivemind-delegation` (if delegation_context). Never load: `use-hivemind-skill-writer`, `use-hivemind-git-memory`, domain skills at start.

**Context Confusion:** Drift → `use-hivemind-context-integrity`. Pollution → `use-hivemind-context-verify`. Chain break → `use-hivemind-delegation`. Lineage unclear → Ask clarifying question.

**Workflow:** Skill authoring → `use-hivemind-skill-writer` → `hivemind-skill-write`. Context recovery → `use-hivemind-context-integrity` → `context-intelligence-entry`. Delegation → `use-hivemind-delegation` → `harness-architecture`. Git memory → `use-hivemind-git-memory` → `git-atomic-memory`.

## Delegation Network

**Agent Hierarchy:** Orchestrator (hiveminder/hivefiver) → delegates to sub-agents (hivexplorer, hiverd, hiveq, hiveplanner, hivemaker, hivehealer, hitea). Orchestrators do NOT Read, Write, Edit, Execute, Plan, Search. They DO delegate, handoff, coordinate.

**Agent Skill Routing:**
| Agent | Skills Route |
|-------|---------------|
| hivefiver | `use-hivemind-skill-writer`, `hivemind-skill-write` |
| hiveminder | Domain skills, GSD agents |
| hivexplorer | `research-methodology`, `context-intelligence-entry` |
| hiveq | `hivemind-skill-doctor`, `context-entry-verify` |
| hiveplanner | `ralph-tasking`, `spec-distillation` |

## Knowledge References

| Artifact | Location |
|----------|----------|
| Framework governance | `AGENTS.md` (project root) |
| Agent definitions | `.opencode/agents/*.md` |
| Skill definitions | `.opencode/skills/*/SKILL.md` |
| Contract authority | `src/schema-kernel/` |
| Custom Tools (6) | `src/tools/{runtime,doc,task,trajectory,handoff}/` |

## Gap Analysis

**Missing (P0):** `use-hivemind-context-integrity`, `use-hivemind-context-verify`, `use-hivemind-delegation`, `use-hivemind-git-memory`, `use-hivemind-hierarchy`, `use-hivemind-session-resume`.

**Exists but needs entry router:** `git-atomic-memory` → `use-hivemind-git-memory`. `context-intelligence-entry` implements `use-hivemind-context-integrity`. `context-entry-verify` implements `use-hivemind-context-verify`.

## Routing Logic

**Intent Detection:** "skill" + "write/audit" → `use-hivemind-skill-writer`. "context" + "drift/rot" → `use-hivemind-context-integrity`. "verify" + "context/truth" → `use-hivemind-context-verify`. "git" + "memory/anchor" → `use-hivemind-git-memory`. "delegate" + "handoff" → `use-hivemind-delegation`. "role" + "boundary" → `use-hivemind-hierarchy`. UNKNOWN → Ask clarifying question.

## Related Skills

| Skill | Relationship |
|-------|--------------|
| `use-hivemind-skill-writer` | Entry router for skill authoring |
| `use-hivemind-context-integrity` | Entry router for context health |
| `use-hivemind-context-verify` | Entry router for verification |
| `use-hivemind-git-memory` | Entry router for git memory |
| `use-hivemind-delegation` | Entry router for handoffs |
| `use-hivemind-hierarchy` | Entry router for agent roles |
| `use-hivemind-session-resume` | Entry router for session continuation |

## NO-LOAD Rules

Context depth >70% → Defer to context recovery. Session degraded → Skip activation. Stack budget exhausted (≥3skills) → Skip activation. Authority unclear → Escalate first.

---

**Pattern:** P0 (Entry Layer) | **Degrees of Freedom:** High (Router) | **Stack Impact:** Does not count against stack budget