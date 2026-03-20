# HiveMind Meta-Builder Skill Architecture

> **Document Version**: 3.0
> **Last Updated**: 2026-03-20
> **Status**: Production---

## Overview

The HiveMind meta-builder skill ecosystem provides a layered architecture for skill design, authoring, and maintenance across OpenCode and compatible agent platforms.

## Three-Skill Architecture

The `hivemind-skill-writer` concept has been split into three distinct skills with clear boundaries and non-overlapping responsibilities:

| Skill | Layer | Purpose | Depth |
|-------|-------|---------|-------|
| **use-hivemind-skill-writer** | Entry/Router | Broad semantic gate, routing, meta-teaching | Shallow (<150 lines) |
| **hivemind-skill-write** | Implementation | Authoring, building, composing | Medium (200-400 lines) |
| **hivemind-skill-doctor** | Diagnostic/Repair | Audit, diagnosis, repair, hardening | Deep (300-500 lines+ references) |

---

## 1. use-hivemind-skill-writer

### Role
Entry, router, andmeta-teaching layer.

### Triggers
- "create a new skill", "write a skill for...", "design a skill"
- "audit this skill", "is this skill good", "skill quality"
- "refactor this skill", "improve this skill", "fix skill routing"
- "validate skill", "check skill overlap"

### What It Does
1. **Routes** to appropriate sub-skill based on task type
2. **Teaches** broad philosophy of skill design
3. **Explains** when each sub-skill is superior
4. **Guards** against common false equivalences
5. **Clarifies** platform-specific behavior

### What It Does NOT Do
- Does NOT implement skill content
- Does NOT perform deep audits
- Does NOT execute specialist work directly

### Routing Logic
```
CREATE/REWRITE/COMPOSE → hivemind-skill-write
AUDIT/DIAGNOSE/REPAIR → hivemind-skill-doctor  
VALIDATE/TEST        → hivemind-skill-doctor (TDD mode)
UNKNOWN               → Ask clarifying question
```

### NO-LOAD Rules
| Condition | Action |
|-----------|--------|
| Context depth >70% | Skip activation |
| Session degraded | Skip activation |
| Stack budget exhausted | Skip activation |
| Authority unclear | Escalate first |

### Key Distinctions
- **Skill-design vs Task-execution**: This skill routes skill design work, not domain work
- **Coordinator vs Specialist**: This skill delegates, doesn't implement
- **Entry vs Implementation**: This is the gate, not the factory

---

## 2. hivemind-skill-write

### Role
Authoring and construction skill.

### Triggers
- "create a new skill", "write a skill for..."
- "refactor this skill", "restructure skill"
- "compose skill set", "batch create skills"
- "design skill templates"

### Core Process
1. **Discover** - Understand scope, triggers, platform target
2. **Design** - Choose pattern (P1/P2/P3), define anatomy, plan validation
3. **Implement** - Write content following templates
4. **Validate** - TDD checklist, Skill-Judge metrics, activation tests

### Knowledge Delta Principle
```
Good Skill = Expert Knowledge − What Model Already Knows
```
| Knowledge Type | Treatment |
|----------------|-----------|
| **Expert** (model doesn't know) | Keep verbatim |
| **Activation** (model knows but may forget) | Keepbrief |
| **Redundant** (model knows well) | Delete |

### Templates Provided
- Minimal Frontmatter (name + description only)
- Standard Body Structure
- When-to-Activate Table
- Do-NOT-Activate-When Section

### Complexity Levels
| Level | Approach |
|-------|----------|
| A: Simple | Direct drafting, minimal review |
| B: Moderate | Action plan, batch work, Pattern 2 |
| C: Complex | One skill = one plan, audit per batch, Pattern 3 |
| D: Very Complex | Explicit sequencing, never monolithic |

---

## 3. hivemind-skill-doctor

### Role
Audit, diagnosis, repair, and hardening skill.

### Triggers
- "audit this skill", "is this skill good"
- "fix skill routing", "diagnose skill problem"
- "improve determinism", "deconflict skills"
- "validate skill compliance", "anti-pattern detection"

### Auto-Activate Signals
- Skill-Judge score <3.5
- Clear quality issues detected
- Redundant logic found
- Trigger ambiguity identified

### Quality Dimensions
| Dimension | Weight | Minimum |
|-----------|--------:|---------|
| Trigger Accuracy | 25% | ≥3.0 |
| Action Coherence | 25% | ≥4.0 |
| Reference Integrity | 20% | ≥3.0 |
| Non-Redundancy | 15% | ≥3.0 |
| Edge Case Coverage | 15% | ≥3.0 |
| **Overall** | — | **≥3.5** |

### Audit Process
1. **Pre-Audit Check** - Session health, stack status
2. **Static Analysis** - Parse structure, validate frontmatter
3. **Runtime Behavior** - Activation, coherence, edge cases
4. **Conflict Detection** - Overlap with other skills
5. **Generate Report** - Scored findings, recommendations

### Repair Process
1. **Diagnose** - Root cause per failing dimension
2. **Plan** - Prioritize by severity, group issues
3. **Execute** - Apply fixes atomically
4. **Re-validate** - Re-run metrics, verify pass

### Edge Cases Must Handle
| Scenario | Requirement |
|----------|-------------|
| FRESH | First activation, no context |
| RESUMED | Session continuation |
| DELEGATED | Subagent invocation |
| DEGRADED | Context rot present |
| POST-CANCEL | After user cancellation |
| LATE | Activation after stack full |

---

## Platform Knowledge

### Platform-Agnostic Concepts
All platforms share these fundamentals:
- Skills guide LLM behavior
- Triggers are semantic, not keywords
- Quality requires determinism and clarity
- Anti-patterns include vague triggers, missing boundaries

### Platform-Specific Behavior

| Platform | Skill Loading | Key Terminology |
|----------|---------------|-----------------|
| **OpenCode** | `skill` tool loads `.opencode/skills/*/SKILL.md` | Skills, agents, tools, tasks, rules, permissions, sessions |
| **Claude Code** | `skill` tool loads `.claude/skills/*/SKILL.md` | Skills, agents, prompts, rules |
| **Cursor** | Rules system loads `.cursor/rules/` | Rules, prompts, configurations |
| **Codex** | Task context | Tasks, instructions, configurations |
| **Gemini** | Prompt engineering | Prompts, instructions |

### OpenCode-Specific Guidance
OpenCode skills operate under specific constraints:
- **Skills** load through `skill` tool invocation
- **Tools** are built-in capabilities (file, bash, question, task, todowrite)
- **Permissions** govern access
- **Rules** define allowed behaviors
- **Agents** can invoke subagents via `task` tool

Common mistakes:
- Confusing "skills" with "tools"
- Using keyword triggers instead of semantic phrases
- Missing permission/rule awareness
- Incorrect frontmatter structure

---

## Two HiveMind Lineages

When HiveMind is used to build itself, guard against confusion:

| Lineage | Purpose | Confusion Pattern |
|---------|---------|-------------------|
| **hivefiver** | Meta-builder lineage: skills that build skills | Confusing with hiveminder project work |
| **hiveminder** | Project-oriented lineage: skills that apply to projects | Confusing with hivefiver framework work |

**Rule**: In self-referential mode, explicitly state which lineage the task belongs to.

---

## Coordinator vs Specialist Behavior

| Behavior | Coordinator (router) | Specialist (sub-skill) |
|----------|---------------------|------------------------|
| Role | Route, gatekeep, teach | Execute deep implementation |
| Reading | Broad by default | Deep investigation |
| Execution | Delegate, don't implement | Implement directly |
| Monitoring | Gatekeep and sequence | Report with evidence |
| Depth | Strategic overview | Detailed implementation |

**Never** let a coordinator skill jump into specialist implementation without explicit handoff.

---

## Hard Behavioral Rules

### 1. Task is Not Automatically Execution-Ready
- Stay user-oriented
- Confirm intent
- Clarify ambiguity
- Use back-and-forth when needed
- Use phased planning for layered work

### 2. System Must Not Pretend Full Understanding
- Discovery before conclusions
- Delegate investigation for complex cases
- Ask clarifying questions

### 3. Skill-Design ≠ Task-Execution
- Prevent skill creation from accidentally doing domain work
- Keep meta-layer and execution-layer separate

### 4. Orchestration Must Remain Explicit
- Maintain plan state
- Use iterative checkpoints
- Preserve role reminders internally
- Don't require user to re-establish framing

---

## Skill Stacking Discipline

- Maximum active skill stack: **3**
- Entry/router skills do not count against stack
- Never load overlapping skills without necessity
- If stack full, unload before proceeding

---

## Anti-Patterns

### 1. Inferior Expert Adaptation
Do NOT water down expert workflows. Preserve:
- Real prompting technique
- Workflow accelerators
- Common pitfall prevention
- Breadth across variants
- Depth across real complexity

### 2. Human-Oriented Design
Skills are for AI agents, not humans.

Avoid:
- Shallow keyword bias
- Human-only prose
- Implicit assumptions

Prefer:
- Semantic structure
- Explicit activation cues
- Runtime-aware instructions

### 3. Weak Hierarchy Handling
LLMs do NOT reliably preserve hierarchy unless explicit.

Always:
- Break down work
- Number steps
- Sequence dependencies
- Expose branches
- Separate alternatives clearly

### 4. Terminology Collapse
Do NOT flatten framework-specific language when exact terms matter for runtime activation or authority.

---

## Relationship to Other Skills

| Skill | Relationship |
|-------|--------------|
| **use-hivemind-skill-writer** | Entry/router for skill design |
| **hivemind-skill-write** | Authoring/building specialist |
| **hivemind-skill-doctor** | Audit/repair specialist |
| **use-hivemind-meta-builder** | Broader meta-builder entry |
| **skill-creator** | Generic skill creation (non-HiveMind) |
| **meta-skill-creator** | Agent Skills open standard compliant |

---

## Future Reference Points

| Future Skill | Purpose |
|--------------|---------|
| `hivefiver-meta-creator` | Meta-builder for hivefiver lineage |
| `hivefiver-meta-doctor` | Audit/repair for hivefiver skills |

These are mentioned for future reference only. Current implementation covers the core three-skill architecture.

---

## References

| Reference | Purpose |
|-----------|---------|
| `references/01-skill-anatomy.md` | Full anatomy template |
| `references/02-frontmatter-standard.md` | YAML schema |
| `references/03-three-patterns.md` | Pattern system (P1/P2/P3) |
| `references/04-tdd-workflow.md` | TDD methodology for skills |
| `references/05-skill-quality-matrix.md` | Skill-Judge 120-point system |
| `references/06-agent-activation.md` | Agent/sub-agent activation patterns |
| `references/07-iterative-refinement.md` | Self-improvement loops |
| `references/08-conflict-detection.md` | Cross-pack overlap detection |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
|3.0 | 2026-03-20 | Split hivemind-skill-writer into 3-skill architecture |
| 2.0 | 2026-03-15 | Added prompt-engineering patterns |
| 1.0 | Initial | Monolithic hivemind-skill-writer |