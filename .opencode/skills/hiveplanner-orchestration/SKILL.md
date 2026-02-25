---
description: "Core methodology skill for the hiveplanner agent. Merges GSD lifecycles, BMAD complexity scoring, and HiveMind context governance into a unified planning sequence."
---

# Skill: hiveplanner-orchestration

Use this skill when acting as the `hiveplanner` agent or when orchestrating complex Phase-planning tasks.

## 1. The GSD/BMAD Hybrid Planning Loop

1. **Intake & Context (HiveMind)**:
   - Run `scan_hierarchy({})` to understand the trajectory.
   - Run `think_back({})` if the trajectory has stale anchors.
   - Define the `Phase Goal` (GSD).

2. **Research & Evidence (BMAD/OpenCode)**:
   - Use `mcp` (DeepWiki, Context7, Tavily) to ground decisions in official documentation or codebase reality.
   - Score the complexity of the Phase using BMAD metrics (Level 1: Trivial, Level 2: Component, Level 3: System, Level 4: Architecture).

3. **Draft the Plan (GSD)**:
   - Create the Markdown/XML Plan in `docs/plans/YYYY-MM-DD-phase-plan.md`.
   - Structure:
     - **Phase Goal**: (1 sentence)
     - **Evidence/Research Citations**: (Bullet points of URLs or files checked)
     - **Task Breakdown (Knots 1-5)**:
       - *Knot 1*: [Task Name] (BMAD Level) -> Validation Gate
       - *Knot 2*: [Task Name] (BMAD Level) -> Validation Gate
     - **Integration Checkpoint**: (How this phase links to existing HiveMind State/Graph).

4. **Integration & Hierarchy Update**:
   - Write the plan.
   - Update the state tree via `hivemind_hierarchy({action: 'migrate' or 'prune' ...})` if redefining old tactics.
   - Persist the plan reference via `save_anchor({key: 'current-phase-plan', value: 'path/to/plan.md'})`.
   - Hand off to `hivemind_session({action: 'update', level: 'tactic', content: 'Phase plan drafted, ready for builder/vibecoder'})`.

## 2. Hard Constraints
- **Never Write Code**: If the user asks for implementation, generate the *plan* for implementation, then suggest delegating to a `hivemaker` or `vibecoder` agent.
- **Never Plan Blind**: If the codebase structure is unknown, spawn a `hivexplorer` subagent via `task` BEFORE writing the GSD plan.
- **Always Output Evidence**: Plans without cited research (`read`, `mcp`, `glob`) are considered invalid by the Context Governance.
