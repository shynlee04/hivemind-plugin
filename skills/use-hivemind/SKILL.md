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
| `use-hivemind-context-integrity` | Context health entry |
| `use-hivemind-context-verify` | Truth verification entry |
| `use-hivemind-skill-writer` | Skill design entry |
| `use-hivemind-git-memory` | Memory entry |
| `use-hivemind-delegation` | Handoff entry |
| `context-intelligence-entry` | Implementation for context health |

## Coordinator vs Specialist Behavior

| Behavior | Coordinator (this skill) | Specialist (sub-skills) |
|----------|-------------------------|------------------------|
| **Role** | Route, gatekeep, teach boundaries | Execute deep implementation |
| **Reading** | Broad by default | Deep investigation when delegated |
| **Execution** | Delegate, don't implement | Implement directly |
| **Monitoring** | Gatekeep and sequence | Report back with evidence |
| **Depth** | Strategic overview | Detailed implementation |

**Never** let this skill jump into the specialist implementation role without explicit handoff to a sub-skill.

## Degrees of Freedom Model

### Degree 1: High Freedom (Router Mode)
- Ask clarifying questions about lineage
- Present platform alternatives
- "Best when / better when" skill routing

### Degree 2: Medium Freedom (Teaching Mode)
- Explain framework architecture
- Show delegation network mapping
- Lane-switch guidance for lineages

### Degree 3: Low Freedom (Deterministic Mode)
- Explicit routing when lineage is clear
- Mandatory session-start loading
- Platform detection with fixed mapping

## NO-LOAD Rules

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Context depth exceeds | >70% | Defer to context recovery first |
| Session state is degraded | `interrupted` or `degraded` | Skip activation |
| Stack budget exhausted | Active skills ≥3 | Wait for slot |
| Authority unclear | Conflicting SOT | Escalate first |

## Hard Behavior Rules

1. **Framework work ≠ project work.** Explicitly identify lineage before routing. hivefiver = framework dev, hiveminder = project dev.
2. **Session start is privileged.** Always load first, defer other skills until framework context is established.
3. **Platform matters.** Different platforms have different activation contracts. Detect before routing.
4. **Routing is not implementation.** Never implement directly. Hand off to specialist skills for execution.

---

**Pattern:** P0 (Entry Layer) | **Degrees of Freedom:** High (Router) | **Stack Impact:** Does not count against stack budget