---
name: meta-builder
description: Use when building, modifying, or combining agent skills, commands, tools, or platform configurations. Routes user intent through a hierarchical MINDNETWORK graph for deterministic multi-agent orchestration. Triggers on "create a skill", "build an agent", "configure OpenCode", "stack skills", "plan this workflow", "orchestrate agents", or any meta-concept authoring task.
metadata:
  layer: "0"
  role: "orchestrator"
  graph: "mindsnetwork"
  version: "2.0.0"
---

# meta-builder

Hierarchical relational graph MINDNETWORK orchestrator. Routes user intent through deterministic execution paths across skill nodes, manages long-horizon cross-session state, and delegates to specialist skills for domain execution.

**This skill orchestrates. It does not execute domain work.** If you catch yourself editing skill files directly, STOP and delegate to `use-authoring-skills`.

---

## FIRST ACTION — When This Skill Loads

Do this before anything else, in this exact order:

1. **Initialize MINDNETWORK graph:**
   ```bash
   bash scripts/graph-init.sh
   ```
   Creates `.meta-builder/graph.json`, state directory, and tracking files.

2. **Validate graph structure:**
   ```bash
   bash scripts/validate-graph.sh
   ```
   Reports any structural issues. Fix before proceeding.

3. **Check for existing session state:**
   ```bash
   bash scripts/state-persist.sh restore
   ```
   If a prior session exists, read its checkpoint before starting new work.

4. **Load background skills** (required for all meta-builder work):
   - `skill({ name: "opencode-platform-reference" })` — SDK, agents, commands, tools, configs
   - `skill({ name: "repomix-exploration-guide" })` — Codebase exploration patterns
   - `skill({ name: "opencode-non-interactive-shell" })` — Shell execution strategy

5. **Read planning files** if they exist:
   - `task_plan.md` — Current goal and phases
   - `findings.md` — Prior research findings
   - `progress.md` — Session log and handoff notes

**Gate:** Do not proceed to routing until graph-init.sh reports READY=true and validate-graph.sh reports VALID=true.

---

## MINDNETWORK Graph Structure

The meta-builder operates as a **hierarchical relational graph** where nodes represent skills/agents and edges define execution relationships:

```
                    ┌──────────────┐
                    │   root       │  ← meta-builder (this skill)
                    │ (orchestrator)│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
     ┌──────────────┐ ┌─────────┐ ┌──────────┐
     │ intent-node  │ │research │ │ planner  │
     │ (Layer 1)    │ │ node    │ │(Layer 2) │
     └──────┬───────┘ └────┬────┘ └────┬─────┘
            │              │           │
            └──────────────┼───────────┘
                           │
              ┌────────────┼────────────┐
              │                         │
              ▼                         ▼
     ┌──────────────┐          ┌──────────────┐
     │ coordinator  │◀────────▶│   author     │
     │ (Layer 3)    │ parallel │ (Layer 4)    │
     └──────┬───────┘          └──────┬───────┘
            │                         │
            └────────────┬────────────┘
                         │
                         ▼
                ┌──────────────┐
                │  validator   │  ← graph-validation node
                └──────┬───────┘
                       │
                       ▼
                ┌──────────────┐
                │   terminal   │  ← delivery confirmation
                └──────────────┘
```

**Edge types:**
- `PARENT_OF` — Hierarchical relationship (parent delegates to child)
- `DEPENDS_ON` — Sequential dependency (node B waits for node A)
- `SEQUENCES_WITH` — Ordered execution (A then B)
- `PARALLEL_TO` — Independent execution (A and B simultaneously)

---

## Routing Decision — User Says X → Traverse To Node Y

| User Says | Entry Node | Traversal Path | Stack Skills |
|-----------|-----------|----------------|-------------|
| "create a skill" | `intent-clarifier` | intent → planner → author → validator → terminal | `use-authoring-skills` |
| "create a skill like this @file" | `intent-clarifier` | intent → planner → author → validator → terminal | `use-authoring-skills`, `skill-creator` |
| "audit this skill" | `author` | author → validator → terminal | `use-authoring-skills` |
| "create an agent" | `planner` | planner → author → validator → terminal | `opencode-platform-reference` |
| "set up a command" | `planner` | planner → author → validator → terminal | `opencode-platform-reference` |
| "build a custom tool" | `planner` | planner → author → validator → terminal | `opencode-tool-architect` |
| "configure OpenCode" | `planner` | planner → author → validator → terminal | `opencode-platform-reference` |
| "stack skills" / "combine skills" | `root` | root → planner → coordinator → validator → terminal | This skill + target skills |
| "help me figure out what I want" | `intent-clarifier` | intent → (loop back to intent) | `user-intent-interactive-loop` |
| "coordinate agents" / "dispatch parallel" | `coordinator` | coordinator → validator → terminal | `coordinating-loop`, `dispatching-parallel-agents` |
| "plan this" / "break it down" | `planner` | planner → coordinator → validator → terminal | `planning-with-files` |
| "research this domain" | `researcher` | researcher → planner → validator → terminal | `deep-investigation` |

---

## Execution Control — Deterministic Node Traversal

Every node in the MINDNETWORK follows the same execution protocol:

```
NODE EXECUTION PROTOCOL:
┌──────────────────────────────────────────────────────────────┐
│ BEFORE executing node X:                                      │
│   1. Check all DEPENDS_ON nodes are in completed_nodes[]     │
│   2. Verify EXECUTE conditions are met (from intent)         │
│   3. Load required skill via skill tool                      │
│   4. Log entry: write active_node to checkpoint.json         │
│   5. Execute within the loaded skill's workflow              │
│                                                               │
│ AFTER executing node X:                                       │
│   1. Run node's VALIDATES checks                             │
│   2. If FAIL → add to failed_nodes[], rollback to last valid │
│   3. If PASS → add to completed_nodes[], log to traversal    │
│   4. Traverse SEQUENCES_WITH edge to next node               │
│   5. Save checkpoint via state-persist.sh save               │
└──────────────────────────────────────────────────────────────┘
```

**Rollback rule:** If a node fails validation, rollback to the most recent node in `completed_nodes[]`. Retry with modified approach. Maximum 3 retries per node. On 3rd failure, escalate to user.

---

## Long-Horizon Cross-Session Management

State persists through the **3-file planning system** + **MINDNETWORK checkpoint**:

| What | File | When |
|------|------|------|
| User intent | `progress.md` | Every confirmation |
| Current graph node | `task_plan.md` (Current Phase) | Every node transition |
| Graph checkpoint | `.meta-builder/state/checkpoint.json` | Every node complete |
| Research findings | `findings.md` | Every 2-3 discoveries |
| Session snapshot | `.meta-builder/state/session-{timestamp}.json` | On phase change |
| Question tracking | `.meta-builder/state/question-count.json` | Every question |

**Recovery rule:** On session restart, read in this order:
1. `task_plan.md` → Current phase and goal
2. `.meta-builder/state/checkpoint.json` → Last active node
3. `findings.md` → What was learned
4. `progress.md` → What was done

---

## Skills Chaining — Concept Stacking Rules

Max 3 skills per stack. Load order matters.

### Recipe 1: Create Skill from Template
```
Primary:     use-authoring-skills (Layer 4)
Complement:  skill-creator
Purpose:     Convert a file/template into a valid SKILL.md
Traversal:   intent → planner → author → validator → terminal
```

### Recipe 2: Create Skill + Parallel Audit
```
Primary:     use-authoring-skills (Layer 4)
Complement:  coordinating-loop (Layer 3)
Purpose:     Author a skill while auditing existing ones in parallel
Traversal:   intent → planner → (coordinator ║ author) → validator → terminal
```

### Recipe 3: Full Meta Work (Routing + Authoring + Persistence)
```
Primary:     use-authoring-skills (Layer 4)
Complement:  planning-with-files (Layer 2), coordinating-loop (Layer 3)
Purpose:     Long-running skill authoring with persistent state
Traversal:   intent → planner → coordinator → author → validator → terminal
```

### Recipe 4: OpenCode Configuration
```
Primary:     opencode-platform-reference
Complement:  meta-builder (this skill — routing)
Purpose:     Configure agents, commands, tools, MCP, LSP, permissions
Traversal:   planner → author → validator → terminal
```

---

## Worked Example: Create a Skill

**User says:** "Create a skill for deep-research that uses repomix to analyze codebases"

### Step 1: Initialize
```bash
bash scripts/graph-init.sh        # READY=true
bash scripts/validate-graph.sh    # VALID=true
```

### Step 2: Route to intent-clarifier
Load `user-intent-interactive-loop`. Probe scope:
- What should this skill trigger on?
- Should it include validation scripts?
- Any existing skills to reference or avoid?

### Step 3: Route to planner
Load `planning-with-files`. Create task_plan.md:
```
Goal: Create deep-research skill for repomix codebase analysis
Phase 1: Draft SKILL.md frontmatter and body
Phase 2: Create reference documents
Phase 3: Write validation scripts
Phase 4: Validate and iterate
```

### Step 4: Route to author (parallel with coordinator if needed)
Load `use-authoring-skills`. Follow its validation loop:
- Write SKILL.md
- Run validate-skill.sh
- Run check-overlaps.sh
- Dispatch critic subagent

### Step 5: Validate
Run `bash scripts/validate-graph.sh`. Confirm all nodes completed.

### Step 6: Terminal
Save checkpoint. Report delivery to user.

---

## Question Enforcement

- **Max 3 questions per session.** Track in `.meta-builder/state/question-count.json`.
- **Questions must be specific.** Not "what do you want?" but "Should this skill trigger on 'create X' or 'build X'?"
- **After 3 questions**, make a best-effort routing decision and proceed. Document the assumption in `progress.md`.
- **Never ask questions** when the routing table already determines a clear path.

---

## Anti-Patterns — Detection and Correction

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **The Executor** — meta-builder edits files directly | Check: did this skill call write/edit? | STOP. Delegate to `use-authoring-skills`. |
| **The Hoarder** — 4+ skills loaded simultaneously | Count active skills. If >3, unload least relevant. | Max 3 per stack. |
| **The Blind Router** — Routing without running graph-init | Check: did you run graph-init.sh first? | Run initialization before routing. |
| **The Concept Dumper** — Loading all 10 OpenCode concepts at once | Check: does user request mention MCP/LSP/agents? | Load only relevant skills. |
| **The Silent Worker** — Many turns without user update | Check: has user been informed of routing decision? | Update at every node transition. |
| **The Question Spammer** — Asking >3 questions | Count questions in state file. If >3, STOP. | Route with documented assumption. |
| **The Graph Ignorer** — Bypassing MINDNETWORK for direct execution | Check: did you traverse nodes or jump to execution? | Follow the graph. Every node has a protocol. |

---

## Progressive Disclosure

| Situation | Read This | Skip This |
|-----------|-----------|-----------|
| Creating a skill | Routing Table → Recipe 1 → load `use-authoring-skills` | references/02-deterministic-control.md |
| Configuring OpenCode | Routing Table → Recipe 4 → load `opencode-platform-reference` | references/01-mindsnetwork-graph.md |
| Stacking skills | Routing Table → Stacking Recipes → references/04-skills-chaining.md | references/02-deterministic-control.md |
| Intent unclear | Run graph-init → route to `user-intent-interactive-loop` | All references until intent is clear |
| Long session recovery | references/03-long-horizon-persistence.md → state-persist.sh restore | references/04-skills-chaining.md |

---

## Platform Adaptation

| Platform | Skill Tool | Skill Path | Config |
|----------|-----------|------------|--------|
| OpenCode | `skill` tool | `.opencode/skills/`, `~/.config/opencode/skills/` | `opencode.json` |
| Claude Code | `Skill` tool | `.claude/skills/`, `~/.claude/skills/` | `CLAUDE.md` |
| Codex | `Skill` tool | `.agents/skills/`, `~/.agents/skills/` | `AGENTS.md` |
| Cursor | `Skill` tool | `.agents/skills/`, `~/.agents/skills/` | `.cursor/rules/` |

---

## Reference Map

| File | When to Read |
|------|-------------|
| `references/01-mindsnetwork-graph.md` | Need to understand graph structure, node types, edge semantics |
| `references/02-deterministic-control.md` | Need execution protocol details, rollback rules, retry logic |
| `references/03-long-horizon-persistence.md` | Session recovery, cross-session state, checkpoint management |
| `references/04-skills-chaining.md` | Multi-skill stacks, loading order, concept composition |
| `references/05-hivefiver-agent.md` | Hivefiver orchestrator agent definition and capabilities |
