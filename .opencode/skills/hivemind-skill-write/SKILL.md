---
name: hivemind-skill-write
description: Use when writing, creating, refactoring, or composing HiveMind
  skills — provides step-by-step authoring guidance, templates, YAML/frontmatter
  standards, and validation patterns.
---

# hivemind-skill-write

Authoring and construction skill for HiveMind skill development.

## Purpose

Domain-specific implementation guidance for:
- Writing new skills from scratch
- Rewriting or restructuring existing skills
- Composing skill sets and skill packs
- Batch creation of multiple skills
- Template application and customization
- YAML/frontmatter correctness
- Atomic action plans
- Workflow structure design

## When to Activate

| Trigger | Task Type |
|---------|-----------|
| `create a new skill` | New skill from scratch |
| `write a skill for...` | New skill for specific domain |
| `refactor this skill` | Restructure existing skill |
| `compose skill set` | Multi-skill package |
| `batch create skills` | Multiple skills at once |
| `design skill templates` | Reusable patterns |
| `fix YAML frontmatter` | Structural corrections |

## Preflight Checklist

Before any skill writing, verify:

```
□ Session health: Entry state known, trust score sufficient
□ Scope explored: Domain complexity mapped
□ No activation conflict: Skill won't collide with loaded skills
□ Stack budget available: Active skills <3
□ Authority clear: SOT for framework decisions
```

If any fail, defer to recovery or clarification.

## Core Process

### Step 1: Discover

**Goal:** Understand the skill's purpose and runtime behavior.

```
1. Identify skill domain and scope
2. Map activation triggers (semantic phrases, not keywords)
3. Identify platform target (OpenCode, Claude Code, Cursor, etc.)
4. Check existing skill inventory for overlap
5. Determine complexity level (A: Simple, B: Moderate, C: Complex, D: Very Complex)
```

**Discovery Questions:**
- What domain problem does this skill solve?
- What platform(s) will run this skill?
- What triggers should activate this skill?
- What skills already exist in this domain?
- Is this standalone or part of a skill set?

### Step 2: Design

**Goal:** Create skill structure before content.

```
1. Choose pattern level:
   ├── Pattern 1: High-level bundled references
   │   └── Single skill + references/ bundle
   ├── Pattern 2: Cross-domain flattening  
   │   └── Skill + background + prerequisites + routing
   └── Pattern 3: Specialized field-routed
       └── Lightweight skill + conditional deep branches

2. Define skill anatomy:
   ├── name field (platform-appropriate)
   ├── description field (semantic triggers)
   ├── body structure (numbered sections, explicit hierarchy)
   └── references (if Pattern 2 or 3)

3. Map quality dimensions:
   ├── Trigger Accuracy (25%)
   ├── Action Coherence (25%)
   ├── Reference Integrity (20%)
   ├── Non-Redundancy (15%)
   └── Edge Case Coverage (15%)

4. Plan validation:
   ├── TDD checklist
   ├── Skill-Judge evaluation points
   └── Runtime activation test scenarios
```

**Design Anti-Patterns:**

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| Too much frontmatter | Bloats context, slow activation | Keep only `name` + `description` |
| Keyword triggers | Fragile, platform-specific | Use semantic trigger phrases |
| Implicit hierarchy | LLM loses structure | Number steps, expose branches |
| No boundaries | Activates too often | Add "Do NOT Activate When" section |
| Redundant knowledge | Model already knows | Apply Knowledge Delta principle |
| Vague triggers | False positive activations | Make activation semantic and explicit |

### Step 3: Implement

**Goal:** Write the skill content following templates.

#### Template: Minimal Frontmatter

```yaml
---
name: skill-name-here
description: Use when [semantic trigger phrase 1], [semantic trigger phrase 2] — [brief purpose].
---
```

#### Template: Standard Body Structure

```markdown
# skill-name

[Brief purpose statement]

## When to Activate

[Trigger table or list]

## Do NOT Activate When

[Boundary conditions]

## Core Process

### Step 1: [First major step]
### Step 2: [Second major step]...

## Anti-Patterns

[Common mistakes to avoid]

## References

[Link to reference files if Pattern 2 or 3]
```

#### Template:when-to-Activate Table

```markdown
| Intent Category | Trigger Phrases |
|-----------------|-----------------|
| **Create** | `create X`, `build X`, `design X` |
| **Audit** | `audit X`, `evaluate X`, `score X` |
| **Refactor** | `refactor X`, `improve X`, `for iterate X` |
```

### Step 4: Validate

**Goal:** Ensure quality before release.

```
Validation Checklist:
□ Trigger clarity: Activation language is explicit, concise, high-signal
□ Action coherence: Instructions produce consistent behavior
□ Runtime safety: No dangerous operations without safeguards
□ Non-redundancy: No duplication of model-existing knowledge
□ Edge-case coverage: Boundary conditions addressed
□ Cross-workflow compatibility: Works in isolation and combination
□ Hierarchical readability: LLM can parse structure reliably
□ Measurable quality: Can be evaluated objectively
```

**TDD for Skills:**

```
1. Identify failure modes before writing
2. Write test scenarios that would fail
3. Design skill to pass those scenarios
4. Validate against Skill-Judge metrics
5. Confirm no existing skill overlap
```

## Knowledge Delta Principle

```
Good Skill = Expert Knowledge − What Model Already Knows
```

| Knowledge Type | Definition | Treatment |
|----------------|------------|-----------|
| **Expert** | Model genuinely does not know | Keep verbatim, no paraphrasing |
| **Activation** | Model knows but may not think to use | Keep only if brief |
| **Redundant** | Model already knows well | Delete |

**Never** explain what the model already knows well.**Never** rely on inference for critical meaning.

## Writing Standards

1. **Optimize for runtime activation accuracy**, not appearance
2. **Write for AI agents and LLM workflows**, not human engineers
3. **Make activation language explicit, concise, high-signal**
4. **Use deterministic instructions**: measurable constraints, clear actions, exact file paths, explicit fallbacks
5. **Preserve breadth** via framework/language/workflow variants
6. **Use examples as patterns** — red flags, green flags, not filler
7. **Prefer semantic prompting** over keyword stuffing
8. **Make hierarchy explicit** — numbered steps, exposed branches
9. **Be concise without becoming vague**
10. **Label content appropriately** — degree of freedom, platform specificity

## Platform-Specific Implementation

### OpenCode

```yaml
# OpenCode loads skills via the 'skill' tool
# Skill file location: .opencode/skills/*/SKILL.md
# Required frontmatter: name, description

---
name: my-skill
description: Use when [trigger] — [purpose].
---

# Skill content here
```

**OpenCode specifics:**
- Skills load through `skill` tool invocation
- Built-in tools: file, bash, question, task, skill, todowrite
- Permissions govern tool/file access
- Rules define allowed behaviors
- Agents can invoke subagents via `task` tool

### Claude Code

```yaml
# Claude Code uses similar skill pattern
# Skill file location: .claude/skills/*/SKILL.md

---
name: my-skill
description: Use when [trigger] — [purpose].
---
```

### Cursor

```markdown
# Cursor uses rules system
# Rules file location: .cursor/rules/
# Different activation contract
```

## Complexity Gating

### Level A: Simple Skill

```
✓ Preflight complete
✓ No overlap detected
✓ Stack budget available
→ Proceed directly with drafting
→ Minimum viable review
→ Pattern 1 or standalone Pattern 3
```

### Level B: Moderate Skill

```
✓ Preflight complete
✓ Overlap checked
→ Create explicit action plan
→ Batch work into atomic units
→ Incremental validation per batch
→ Pattern 2 with references
```

### Level C: Complex Skill

```
✓ Preflight complete
✓ Full overlap analysis done
→ One skill = one plan
→ Build incrementally from previous plan
→ Audit every batch
→ Pattern 3 with conditional branches
```

### Level D: Very Complex Skill Set

```
✓ Preflight complete
✓ All conflicts mapped
→ Never attempt in one pass
→ Explicit sequencing required
→ Runtime verification per batch
→ Post-delegation audit mandatory
→ Multiple patterns combined
```

## Batch Work Protocol

For multi-skill or batch creation:

```
1. Identify all skills in batch
2. Map dependencies between skills
3. Sequence skills by dependency order
4. Create each skill with validation
5. Confirm no activation conflicts betweenbatch skills
6. Package as skill set if related
```

## Hivemind Framework Integration

### Tool vs Skill Distinction

| Concept | Meaning | Purpose |
|---------|---------|---------|
| **Tool** | What the model can do | Execute actions |
| **Skill** | What the model knows how to do well | Guide decisions |

**Formula:** `General Agent + Excellent Skill = Domain Expert Agent`

### Skill Stacking Rules

- Maximum active skill stack: **3**
- Entry/router skills do not count against the stack
- Never load overlapping skills without explicit necessity
- If stack is full, unload before proceeding

### References Required

This skill requires reference material for full implementation:

| Reference | Purpose |
|-----------|---------|
| `references/01-skill-anatomy.md` | Full anatomy template |
| `references/02-frontmatter-standard.md` | YAML schema |
| `references/03-three-patterns.md` | Pattern system (P1/P2/P3) |
| `references/04-tdd-workflow.md` | TDD methodology for skills |

## Delegation Pattern

When skill creation requires investigation:

```
IF domain complexity high OR scope unclear:
1. Delegate scope exploration to explore agent
2. Specify exact investigation requirements
3. Receive investigation report
4. Convert to action plan
5. Proceed with skill creation
```

## Never Do

- ❌ Start writing before scope exploration
- ❌ Start drafting before planning
- ❌ Skip TDD validation
- ❌ Duplicate model-existing knowledge
- ❌ Use keyword triggers instead of semantic phrases
- ❌ Let skill become vague to fill space
- ❌ Mix platform-specific instructions incorrectly
- ❌ Create overlapping activation with existing skills