Rewrite the `hivemind-skill-writer` cluster inside `/Users/apple/hivemind-plugin/knowledge-of-skill-for-HIVEMIND-meta-builder.md` into a clean, production-quality 3-skill architecture for OpenCode + the Hivemind metaframework.

## Working context

Use the existing file content as the source of intent, but substantially improve clarity, structure, routing, and technical precision.

Relevant history for continuity:

- Instructions were already fetched.
- The `prompt-engineering-patterns` slash command was already run.
- `/Users/apple/.kilocode/skills/prompt-engineering-patterns/SKILL.md` was already read and should inform prompt quality and structure.
- `knowledge-of-skill-for-HIVEMIND-meta-builder.md` was already edited and read.
- Base this rewrite on OpenCode conventions and the Hivemind metaframework.
- Use `use-superpower` as the model for how a broad semantic entry should route, teach boundaries, and cover edge cases.

## Platform and framework knowledge that must be encoded

The rewritten skill set must teach and correctly distinguish skill-related behavior across:

- OpenCode
- Claude Code
- Codex
- Gemini
- Cursor
- Antigravity
- Windsurf
- Kilocode
- similar agent/tooling ecosystems when relevant

Make clear:

- what is platform-agnostic
- what is platform-specific
- what changes in terminology across platforms
- what changes in configuration shape, routing, permissions, rules, or orchestration behavior

For OpenCode specifically, the rewrite must emphasize:

- correct YAML/frontmatter setup
- correct terminology around tools, tasks, rules, permissions, configuration, context, and sessions
- that skills load through the task tool named `skill`
- that built-in tools and task semantics must be described accurately
- that initial primitives heavily depend on permissions and rules
- that some tool usage patterns are often misapplied by agents and should be corrected in the knowledge

Reference point for terminology alignment:

- `https://opencode.ai/docs/tools/#built-in`

## Hivemind metaframework knowledge that must be embedded

The rewritten content must cover the broader meta-framework concerns behind skill design, routing, and orchestration, including:

- agents
- subagents
- orchestrators
- coordinators
- delegation
- handoff
- steering
- sessions
- workflows
- commands
- prompts
- CLI
- tools
- plugins
- extensions
- rules
- permissions
- context
- chaining
- stacking
- deterministic setup
- programmatic setup
- non-conflicting composition
- context harnessing
- spec-driven development
- TDD
- guardrails
- user intent handling
- incremental gatekeeping
- autonomy boundaries for agent delegation and handoff

## Important background knowledge to preserve and rewrite cleanly

### A) OpenCode system-knowledge-related skills

Do **not** rely on them for execution right now, but:

- inspect and inventory them
- keep them as future reference points
- leave room for later expansion and linkage
- do not present them as currently required dependencies

### B) Hivemind framework lineage confusion

Preserve and clarify the “two lineages” factor:

- `hivefiver` = metabuilder lineage
- `hiveminder` = project-oriented lineage

Explicitly guard against confusion when the Hivemind framework is being used to build itself. The rewrite must reduce hallucination risk and context rot in those self-referential cases.

### C) Delegation and coordinator behavior

The rewrite must explicitly teach that coordinator/orchestrator-style skills or agents:

- delegate rather than execute specialist work
- monitor and gatekeep
- sequence and batch work
- choose waves, returns, parallelism, and sequencing
- read broadly by default instead of deeply reading everything
- rely on subagents for depth investigation
- ask for reports and verification
- do not silently take over the specialist role
- do not over-specify the specialist implementation unless handoff context requires it

### D) Granular, iterative work cycles

Preserve the requirement that good delegation needs:

- granularity
- iterative knowledge cycles
- monitoring loops
- TDD awareness
- domain-specific chains
- accurate agent/subagent naming
- mode/profile/permission awareness
- workflow-aligned planning hierarchy
- nuanced, hierarchical extraction of context and domain knowledge

### E) Hivemind custom tools, plugins, SDK

Inventory these for later review, but only if availability and determinism are clear.
Do not treat uncertain capabilities as established facts.

## Hard behavioral rules that must be explicit in the rewritten skills

The rewritten skills must aggressively correct common LLM failure modes.

Make these principles explicit:

1. The task is **not** automatically execution-ready.
    - Stay user-oriented.
    - Confirm intent.
    - Clarify ambiguity.
    - Avoid assumptions.
    - Use back-and-forth clarification when needed.
    - Use phased planning when the work is layered or stacked.
2. The system must **not** pretend it fully understands the task by itself.
    - Discovery comes before conclusions.
    - Delegation for investigation is required before confident output in complex cases.
3. The skill-design layer must **not** be confused with the task-execution layer.
    - Do not let the resulting skill jump into doing the target domain work.
    - Prevent the common mistake of designing a skill and then accidentally behaving as if the skill is already being applied.
4. Orchestration and meta-building must remain explicit in long-haul sessions.
    - Maintain plan state.
    - Use iterative checkpoints.
    - Preserve role reminders internally through the structure of the skill.
    - Do not require the user to repeatedly re-establish the same framing.

## Pattern requirements

Organize the rewritten skill set around these 3 pattern levels:

### Pattern 1: High-level bundled references

Each skill may link to a higher-level bundle of:

- scripts
- assets
- templates
- detailed case samples
- prompt-engineering examples
- superior atomic action plans
- workflow instructions
- phased step-by-step guidance

### Pattern 2: Hivemind cross-domain flattening

When Pattern 1 alone is not enough, the skill must flatten or bridge across hierarchy and adjacent domains by including:

- background knowledge
- prerequisites
- gatekeeping factors
- hierarchy/coupling guidance
- what combines well with what
- conditional routing to related skills

### Pattern 3: Specialized field-routed skills

Some skills should stay lightweight for simple use cases, but reveal deeper branches only when needed for specialized cases.
Example class of problem:

- schema/database-related skill behavior

## Degrees of freedom model

The rewritten content must explicitly support increasing determinism as depth increases.

### Degree 1: High freedom

- adaptive text guidance
- validation through dialogue
- alternatives acknowledged
- “best when / better when” distinctions
- room for judgment and switching strategies

### Degree 2: Medium freedom

- pseudocode or scripts with rich parameters
- inline explanation
- use-case examples
- environment-aware fallbacks
- lane-switch guidance

### Degree 3: Low freedom / deterministic

- script-first or tool-first flows
- minimal choice
- explicit “you must do this” situations only when justified
- recovery paths
- high-level scope visibility
- deterministic setup that is easier to execute and recover from

## Relationship to other skills

Make the routing and references explicit:

- `use-hivemind-skill-writer` = entry/router/meta-teaching layer
- `hivemind-skill-write` = authoring/building layer
- `hivemind-skill-doctor` = audit/repair/hardening layer

Also show how these relate to:

- `use-hivemind-meta-builder` as the broader related concept
- future subsets such as `hivefiver-meta-creator` and `hivefiver-meta-doctor`

Do not overbuild those future subsets now. Mention them only as future reference points if useful.

## Output requirements

Produce the rewritten content so it reads like clean, expert, production-quality knowledge/spec text.

Requirements:

- rewrite the whole target section, not just minor edits
- fix spelling, grammar, structure, hierarchy, and terminology
- remove repetition and weak phrasing
- preserve valuable edge cases and background references
- make routing logic obvious and reliable
- make the boundaries between the 3 skills unmistakable
- include examples, patterns, and anti-patterns where they help
- include conditional branching and cross-domain routing where useful
- keep the language direct and user-side, not roleplay or system-role framing
- do not answer the domain work itself
- do not turn the output into narration about what you are doing
- write the final rewritten skill architecture/content directly

If useful, include suggested YAML/frontmatter semantics for the skills, but keep the main focus on knowledge structure, routing behavior, determinism, and anti-confusion safeguards.