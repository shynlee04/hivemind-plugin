---
name: use-hivemind-skill-writer
description: Use when "write a skill", "create a new skill", "audit this skill", "is this skill good", "skill quality", "skill design", "skill authoring", "refactor skill", "fix skill routing"— routes to specialized skill operations and teaches skill design philosophy.
---

# use-hivemind-skill-writer

Entry, router, and meta-teaching layer for HiveMind skill design.

## When to Activate

Activate when the user wants to:

| Intent Category | Trigger Phrases |
|-----------------|-----------------|
| **Create** | `create a new skill`, `write a skill for...`, `design a skill`, `draft a skill`, `build a HiveMind skill` |
| **Audit** | `audit this skill`, `evaluate this skill`, `score this skill`, `skill quality check`, `skill review` |
| **Refactor** | `refactor this skill`, `improve this skill`, `iterate on skill`, `refine skill quality`, `rewrite this skill`, `simplify this skill`, `reduce skill overlap` |
| **Validate** | `validate this skill`, `test this skill`, `baseline this skill`, `write test for skill`, `TDD for skills` |
| **Package** | `package this skill set`, `validate skill stack`, `verify no conflicts`, `check skill overlap`, `find conflicts` |
| **Tailor** | `customize skill`, `tailor skill for...`, `adapt skill to...` |

## Do NOT Activate When

| Condition | Reason | What to Use Instead |
|-----------|--------|---------------------|
| User wants to **apply** an existing skill to do domain work | This is task execution, not skill design | Load the target skill directly |
| Request is trivial (typo fix, reword one sentence) | Overhead > benefit | Handle directly |
| Another skill-writing skill is already active | Conflict | Defer to active skill |
| You are not working on HiveMind/OpenCode skill files | Wrong domain | Use `skill-creator` or `meta-skill-creator` |

## False Equivalences to Avoid

| Mistaken Assumption | Reality |
|--------------------|---------|
| "Skill writing is just documentation" | Skills are executable instructions with runtime activation contracts |
| "Any agent can write skills" | Skill design requires understanding activation semantics, trigger matching, and runtime behavior |
| "Skill auditing is just proofreading" | Auditing requires runtime behavior analysis, conflict detection, and quality metrics |
| "Platform skills are portable" | Each platform (OpenCode, Claude Code, Cursor, etc.) has different activation contracts |
| "Use-skills are implementation skills" | Use-skills are entry routers; implementation is delegated to sub-skills |

## Two HiveMind Lineages

When the HiveMind framework is being used to build itself, guard against confusion:

| Lineage | Purpose | Confusion Pattern |
|---------|---------|-------------------|
| **hivefiver** | Meta-builder lineage: skills that build skills, agent orchestration | Confusing hivefiver work with hiveminder project work |
| **hiveminder** | Project-oriented lineage: skills that apply to project work | Confusing hiveminder work with hivefiver framework work |

**Rule:** When in self-referential mode (HiveMind building HiveMind), explicitly state which lineage the current task belongs to.

## Coordinator vs Specialist Behavior

| Behavior | Coordinator (this skill) | Specialist (sub-skills) |
|----------|-------------------------|------------------------|
| **Role** | Route, gatekeep, teach boundaries | Execute deep implementation |
| **Reading** | Broad by default | Deep investigation when delegated |
| **Execution** | Delegate, don't implement | Implement directly |
| **Monitoring** | Gatekeep and sequence | Report back with evidence |
| **Depth** | Strategic overview | Detailed implementation |

**Never** let this skill jump into the specialist implementation role without explicit handoff to a sub-skill.

## Routing Logic

```
TASK TYPE DETECTION:
├── CREATE/REWRITE/COMPOSE
│   ├── New skill from scratch → hivemind-skill-write
│   ├── Restructure existing skill → hivemind-skill-write
│   ├── Batch creation of skills → hivemind-skill-write (with batch flag)
│   └── Compose skill set → hivemind-skill-write
│
├── AUDIT/DIAGNOSE/REPAIR
│   ├── Audit existing skill → hivemind-skill-doctor
│   ├── Diagnose skill problem → hivemind-skill-doctor
│   ├── Fix broken routing → hivemind-skill-doctor
│   ├── Improve determinism → hivemind-skill-doctor
│   └── Deconflict overlapping skills → hivemind-skill-doctor
│
├── VALIDATE/TEST
│   └── TDD for skills → hivemind-skill-doctor (TDD mode)
│
└── UNKNOWN
    └── Ask clarifying question before routing
```

## NO-LOAD Rules

Do NOT activate this skill when:

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Context depth exceeds | >70% | Defer to context recovery first |
| Session state is degraded | `interrupted` or `degraded` | Skip activation |
| Stack budget exhausted | Active skills ≥3 | Skip activation |
| Authority unclear | Conflicting SOT | Escalate first |

## Degrees of Freedom Model

### Degree 1: High Freedom (Router Mode)
- Ask clarifying questions
- Present alternatives
- "Best when / better when" distinctions
- Room for judgment

### Degree 2: Medium Freedom (Teaching Mode)
- Provide patterns
- Explain routing logic
- Show examples
- Lane-switch guidance

### Degree 3: Low Freedom (Deterministic Mode)
- Explicit routing when task is clear
- Mandatory preflight checklist
- Recovery paths defined

## Platform Knowledge

### Platform-Agnostic Concepts
- Skill purpose: Guide LLM behavior
- Trigger patterns: Semantic matching
- Quality metrics: Determinism, clarity, non-redundancy
- Anti-patterns: Vague triggers, missing boundaries, redundant knowledge

### Platform-Specific Behavior

| Platform | Skill Loading | Terminology |
|----------|---------------|-------------|
| **OpenCode** | `skill` tool loads `.opencode/skills/*/SKILL.md` | Skills, agents, tools, tasks, rules, permissions |
| **Claude Code** | `skill` tool loads skills | Skills, agents, prompts, rules |
| **Cursor** | Rules system | Rules, prompts, configurations |
| **Codex** | Task context | Tasks, instructions, configurations |
| **Gemini** | Prompt engineering | Prompts, instructions |

### OpenCode-Specific Guidance

OpenCode loads skills through the `skill` tool. Key concepts:

| Concept | Meaning in OpenCode |
|---------|-------------------|
| **Tool** | Built-in capability (file read/write, bash, etc.) |
| **Skill** | Instruction file loaded via `skill` tool |
| **Agent** | Named subagent configuration |
| **Task** | Work unit with delegation |
| **Rule** | Permission boundary |
| **Permission** | Access control for tools/files |
| **Configuration** | opencode.json settings |
| **Context** | Loaded instruction surface |
| **Session** | Conversation instance |

**Common Mistakes in OpenCode Skills:**
- Confusing "skills" with "tools" — Tools execute, skills guide
- Misnaming activation triggers — Use semantic phrases, not keywords
- Missing permission/rule awareness — Skills operate under permission constraints
- Incorrect frontmatter — OpenCode expects `name` + `description` fields

## Related Skills

| Skill | Relationship |
|-------|--------------|
| `hivemind-skill-write` | Authoring/building layer — route to when creating skills |
| `hivemind-skill-doctor` | Audit/repair/hardening layer — route to when fixing skills |
| `use-hivemind-meta-builder` | Broader meta-builder entry — for agent orchestration |
| `skill-creator` | Generic skill creation — non-HiveMind contexts |
| `meta-skill-creator` | Agent Skills open standard compliant — broader ecosystem |

## HardBehavior Rules

1. **Task is not automatically execution-ready.** Stay user-oriented. Confirm intent. Use back-and-forth clarification when needed.

2. **System must not pretend it fully understands.** Discovery comes before conclusions. Delegate investigation for complex cases.

3. **Skill-design is not task-execution.** Prevent skill creation from accidentally jumping into doing the target domain work.

4. **Orchestration remains explicit.** Maintain plan state. Use iterative checkpoints. Don't require user to repeatedly re-establish framing.

## References

| Reference | When to Load |
|-----------|--------------|
| `references/01-skill-anatomy.md` | When routing to hivemind-skill-write for new skill creation |
| `references/03-three-patterns.md` | When complexity gating is needed |
| `references/05-skill-quality-matrix.md` | When routing to hivemind-skill-doctor for audit |