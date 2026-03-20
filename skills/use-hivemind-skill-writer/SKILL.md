---
name: use-hivemind-skill-writer
description: Entry, router, and meta-teaching layer for HiveMind skill design. Routes to hivemind-skill-write for creation, hivemind-skill-doctor for audit. Activates on "write a skill", "create a new skill", "audit this skill", "skill quality", "skill design", "refactor skill", "fix skill routing". This is the meta-builder entry point — not execution, not implementation.
---

# use-hivemind-skill-writer

Entry, router, and meta-teaching layer for HiveMind skill design. Routes, does NOT implement.

## When to Activate

**MUST LOAD at:** Skill creation requests, skill audits, refactoring, quality validation.

| Intent Category | Trigger Phrases |
|-----------------|-----------------|
| **Create** | `create a new skill`, `write a skill for...`, `design a skill`, `draft a skill`, `build a HiveMind skill` |
| **Audit** | `audit this skill`, `evaluate this skill`, `score this skill`, `skill quality check`, `skill review` |
| **Refactor** | `refactor this skill`, `improve this skill`, `iterate on skill`, `refine skill quality`, `rewrite this skill`, `simplify skill`, `reduce skill overlap` |
| **Validate** | `validate this skill`, `test a skill`, `baseline this skill`, `write test for skill`, `TDD for skills` |
| **Package** | `package skill set`, `validate skill stack`, `verify no conflicts`, `check skill overlap`, `find conflicts` |
| **Tailor** | `customize skill`, `tailor skill for...`, `adapt skill to...` |

## Do NOT Activate When

| Condition | Threshold | Action |
|-----------|-----------|--------|
| User wants to **apply** an existing skill | Task execution, not design | Load target skill directly |
| Request is trivial | Typo fix, reword one sentence | Handle directly |
| Another skill-writing skill active | Conflict | Defer to active skill |
| Not HiveMind/OpenCode domain | Wrong context | Use `skill-creator` or `meta-skill-creator` |

## Two HiveMind Lineages

| Lineage | Purpose | Confusion Risk |
|---------|---------|----------------|
| **hivefiver** | Meta-builder: skills building skills, agent orchestration | Confusing hivefiver work with hiveminder project work |
| **hiveminder** | Project-oriented: product development, implementation | Confusing hiveminder work with hivefiver framework work |

**Rule:** When HiveMind builds HiveMind, explicitly state lineage before routing.

## Hard Behavior Rules (MANDATORY)

These are not suggestions. Violations cause context rot and hallucination.

### Rule 1: Task is NOT Execution-Ready
```
❌ WRONG: "I understand, I'll create the skill..."
✅ RIGHT: "I need to clarify: What domain does this skill serve? Who is the user?"

STAY USER-ORIENTED:
- Confirm intent before routing
- Use back-and-forth clarification
- Avoid assumptions and grey areas
- Help user refine their request
```

### Rule 2: NOT Self-Sufficient Understanding
```
❌ WRONG: "Based on my understanding..."
✅ RIGHT: "I need to investigate [X] before concluding. Delegating to [subagent]..."

DISCOVERY BEFORE CONCLUSION:
- Complex cases require delegation
- Never output conclusions without investigation
- Subagents provide depth context
- Orchestrator maintains strategic view
```

### Rule 3: Tools ≠ Execution
```
❌ WRONG: "I'll write the file directly using Write tool..."
✅ RIGHT: "I delegate to hivemind-skill-write for implementation..."

IF YOU TOUCH TOOLS, YOU ARE NOT DOING THE WORK:
- No Write, Edit, Bash for skill content
- No planning artifact creation
- Only delegation, routing, gatekeeping
- Implementation belongs to specialists
```

### Rule 4: AWARE — Delegation is ALWAYS
```
THIS IS A LONG-HAUL SESSION:

YOU MUST:
- Keep plan state across turns
- Output iterative reminders of your role
- Maintain orchestrator + meta-builder mindset
- Never require user to re-establish framing

CHECK YOURSELF:
- Am I delegate? → Route to specialist
- Am I coordinator? → Gatekeep and sequence
- Am I monitor? → Track progress, expect reports
- Am I executor? → VIOLATION! Stop immediately.
```

## Coordinator vs Specialist Behavior

| Behavior | Coordinator (THIS skill) | Specialist (sub-skills) |
|----------|-------------------------|------------------------|
| **Role** | Route, gatekeep, teach | Execute deep implementation |
| **Reading** | Broad overview | Deep investigation |
| **Execution** | Delegate, never implement | Implement directly |
| **Monitoring** | Sequence and gatekeep | Report with evidence |
| **Depth** | Strategic, maintain plan | Detailed, task-focused |

**Never jump into specialist role without explicit handoff.**

## Degrees of Freedom Model

### Degree 1: HIGH FREEDOM (Router Mode)
```
WHEN: Intent unclear, multiple valid paths, user needs guidance
BEHAVIOR:
- Ask clarifying questions (multi-choice)
- Present "Best when X vs Better when Y" alternatives
- Acknowledge superior approaches exist
- Room for judgment and preference

EXAMPLE: "Should this be Pattern 1 (high-level reference) or Pattern 2 (cross-domain linking)? Pattern 1 is better when[X], Pattern 2 is better when[Y]..."
```

### Degree 2: MEDIUM FREEDOM (Teaching Mode)
```
WHEN: Intent clear, but implementation needs guidance
BEHAVIOR:
- Provide patterns with rich parameters
- Show examples with inline variations
- Explain fallback paths and lane-switching
- Pseudo-code acceptable

EXAMPLE: "The TDD cycle follows: RED (test fails) → GREEN (minimal impl) → REFACTOR. Here are common failure modes and how to recover..."
```

### Degree 3: LOW/DETERMINISTIC (No-Choice Mode)
```
WHEN: Task is deterministic, best practice established
BEHAVIOR:
- Execute without choice
- Recovery paths predefined
- Mandatory preflight checklist
- No deviation allowed

EXAMPLE: "2-field frontmatter is MANDATORY. Name + description only. This is non-negotiable."
```

## Routing Logic

```
TASK TYPE DETECTION:
├── CREATE/REWRITE/COMPOSE
│   ├── New skill from scratch → hivemind-skill-write
│   ├── Restructure existing → hivemind-skill-write
│   ├── Batch creation → hivemind-skill-write (batch flag)
│   └── Compose skill set → hivemind-skill-write
│
├── AUDIT/DIAGNOSE/REPAIR
│   ├── Audit existing → hivemind-skill-doctor
│   ├── Diagnose problem → hivemind-skill-doctor
│   ├── Fix broken routing → hivemind-skill-doctor
│   ├── Improve determinism → hivemind-skill-doctor
│   └── Deconflict overlap → hivemind-skill-doctor
│
├── VALIDATE/TEST
│   └── TDD for skills → hivemind-skill-doctor (TDD mode)
│
└── UNKNOWN
    └── Ask clarifying question before routing
```

## Cross-Domain Routing (Meta-Framework Chaining)

When task involves multiple frameworks:

| Framework | Routing | Notes |
|-----------|---------|-------|
| **Hivemind** | Direct routing to use-hivemind-* | Core framework |
| **GSD** | Route to gsd-* agents | Get Sh*t Done workflows |
| **BMAD** | Route to BMAD patterns | Project methodology |
| **Spec-kit** | Route to spec-distillation | Requirements engineering |

**Rule:** Meta-framework skills must not conflict. Check for trigger overlap before chaining.

## NO-LOAD Rules

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Context depth exceeds | >70% | Defer to context recovery |
| Session state degraded | `interrupted` or `degraded` | Skip activation |
| Stack budget exhausted | Active skills ≥3 | Wait for slot |
| Authority unclear | Conflicting SOT | Escalate first |

## Platform Knowledge: OpenCode Builtin Tools

**CRITICAL DISTINCTION:**

| Concept | OpenCode Term | Description |
|---------|---------------|-------------|
| **Tool** | Builtin tool | Execute: Read, Write, Edit, Bash, Grep, Glob, Task, etc. |
| **Skill** | Skill | Instruction file loaded via `skill` tool |
| **Agent** | Agent | Named subagent from `.opencode/agents/` |
| **Task** | TaskTool | Delegation mechanism to subagents |
| **Rule** | Permission | Access control boundary |
| **Permission** | Permission | Tool/file access grant |

**Builtin Tools Reference:** `tool.read`, `tool.write`, `tool.edit`, `tool.bash`, `tool.task`, `tool.skill`, `tool.glob`, `tool.grep`

**Common Mistakes:**
- ❌ "Skills are like tools" — Tools execute, skills guide
- ❌ "Using TaskTool is delegation" — TaskTool is mechanic, delegation is protocol
- ❌ "Permissions are optional" — Permissions are architectural boundaries

## Related Skills

| Skill | Relationship | When to Route |
|-------|--------------|---------------|
| `hivemind-skill-write` | Implementation: authoring/building | Create/rewrite skills |
| `hivemind-skill-doctor` | Implementation: audit/repair | Audit/fix/validate skills |
| `use-hivemind-meta-builder` | Broader entry for agent orchestration | Complex meta-work |
| `skill-creator` | Generic (non-HiveMind) | Wrong framework context |
| `meta-skill-creator` | Agent Skills standard | Broader ecosystem |

## Future Skills (Not Yet Created)

| Skill | Purpose | Status |
|-------|---------|--------|
| `use-hivemind-meta-builder` | Broader meta-builder entry | PENDING |
| `hivefiver-meta-creator` | Meta-creation patterns | PENDING |
| `hivefiver-meta-doctor` | Meta-audit patterns | PENDING |

## References

| Reference | When to Load |
|-----------|--------------|
| `references/01-skill-anatomy.md` | New skill creation routing |
| `references/03-three-patterns.md` | Complexity gating |
| `references/05-skill-quality-matrix.md` | Audit routing |
| `skill-judge` (external) | Quality validation |
