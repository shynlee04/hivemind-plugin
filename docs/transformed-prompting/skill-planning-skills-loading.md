## Enhanced Prompt

You are to perform a comprehensive analysis and skill development task. Complete the following phases in sequence, applying critical thinking and logical reasoning throughout:

### Phase 1: Language Pattern Analysis

Analyze and document the language use patterns across these representative skill examples located in `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/docs/research/skills-lab/samples-language-use/`:

- `prompting-to-parse-between-session-executing.md` — pattern for cross-session execution
- `prompting-to-parse-between-session-reviewing.md` — pattern for cross-session review
- `skill-show-hot-to-implement-execute.md` — execution implementation pattern
- `skill-show-how-to-implement-gate.md` — gating/conditional logic pattern
- `skill-show-how-to-manageing-tasking.md` — task management pattern
- `skill-show-how-to-technique-cognitive-load.md` — cognitive load management pattern

For each file, identify and document: linguistic structures, directive patterns, conditional phrasing, and templating approaches. Compare these patterns to understand the distinction between skill definition files (which specify the skill's behavior and when to use it) and prompting templates (which guide the subagent during execution). Do not copy or plagiarize—synthesize your own observations adaptively.

### Phase 2: Meta-Builder Structure Investigation

Load the `/writing-plans` skill, then deeply investigate the meta-builder skill architecture at:

- `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/skills/meta-builder/SKILL.md`
- All files in `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/skills/meta-builder/references/`
- All scripts in `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/skills/meta-builder/scripts/`
- State files in `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/.opencode/skills/meta-builder/.meta-builder/state/`

Understand how skills are structured, loaded, chained, and how the graph-based routing works in OpenCode versus Hivemind paradigms.

### Phase 3: Plan Consolidation and Skill Architecture Decision

Review the three planning outputs from the three agents. Load the previous skill content from `/Users/apple/hivemind-plugin/.worktrees/harness-experiment/session-ses_2aaa.md` for additional context.

Apply critical thinking to decide whether these three plans should be:

- **Option A:** Combined into a single unified skill
- **Option B:** Split into multiple distinct skills

Consider these factors: session loading patterns, when skills are invoked intentionally by agents, how subagents parse user intents using skills, and how knowledge exploration flows through the system. Document your reasoning for the chosen architecture.

### Phase 4: Plan Documentation

Write the consolidated and improved plan to disk in an appropriate location within the skills-lab structure.

### Phase 5: Execution

After the plan is written to disk:

1. Load the `/subagent-driven-development` skill
2. Load the skill to `/execute-plan`
3. Proceed with execution based on the documented plan

---

**Deliverables:**

- A comparative analysis document identifying language patterns across all examined skill types
- A clear architectural decision (single vs. multiple skills) with documented rationale
- A consolidated plan file written to disk
- Execution of the plan via the appropriate skills


===

PROMPT 2

Design a comprehensive technical specification document exploring HIVEMIND framework architecture, focusing on skill stacking, agent coordination, and advanced configuration patterns. The output must be saved to /notion-research-documentation.

## Core Investigation Areas

### 1. Meta-Concept Framework Foundation
Document the hierarchical relationships between:
- Skills (in-house vs third-party references)
- Commands and agent implementations
- Prompts, workflows, templates, and rules
- Tools and plugins with their respective integration mechanisms
- How these concepts map differently between OpenCode platform and other environments

### 2. User Journey Analysis (Minimum 2 Use Cases Per Category)

**Category A: Natural Language Concept Stacking**
Document the most advanced use case demonstrating complete cycles where users describe goals in natural language, which concepts are invoked, and how they stack and interact through full implementation journeys.

**Category B: Full Framework Stacking**
Detail advanced scenarios combining HIVEMIND + agent teams + permissions + builtin tools + custom tools + commands + skills + references + instructions + templates as prompts. Show configuration patterns and execution flows.

**Category C: Config-Centric Stacking**
Detail scenarios focusing on HIVEMIND + three selected concepts with deep exploration of configuration management, environment-specific settings, conditional routing logic, and cross-config dependencies.

**Category D: Agent Coordination Stacking**
Detail scenarios focusing on HIVEMIND + three selected concepts with emphasis on main vs sub-agent delegation hierarchies, coordination mechanisms, responsibility chaining, and focus management across agent teams.

**Category E: Dynamic Runtime Stacking**
Detail scenarios demonstrating iterative cycles, on-demand execution, runtime interception, manipulation of active processes, conditional branching based on intermediate results, and adaptive workflow modification during execution.

### 3. Document Structure Requirements
Each use case must include:
- User persona and context
- Initial request/trigger
- Concept stack activation sequence
- Configuration decisions made
- Execution flow with intermediate states
- Outcome and feedback loops
- Extension points for iteration

### 4. Architectural Considerations
Document how HIVEMIND framework handles:
- Project variant proliferation as user configurations grow
- Framework extensibility patterns
- Builtin skill improvement and refactoring approaches
- New skill development methodologies for investigation, research, and tool integration

Output comprehensive technical documentation suitable for skill authoring and opencode-platform-reference purposes, saved to the specified documentation location.