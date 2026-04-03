# Stacking Rules

Concrete recipes for combining skills. Not abstract principles — specific combinations with validation steps.

---

## The Rule: Max 3 Skills

| Stack Size | Viability |
|------------|-----------|
| 1 skill | Optimal |
| 2 skills | Good — clear primary/complementary |
| 3 skills | Acceptable — requires discipline |
| 4+ skills | **BLOCKED** — unload the least relevant |

---

## Validation Checklist — Run Before Loading a Stack

| Check | How | Pass Criteria |
|-------|-----|---------------|
| Trigger overlap | Read `description:` frontmatter of each skill | No shared trigger phrases |
| Shared state | Compare what files each skill writes | No overlapping file writes |
| Dependency cycle | Check "Required Skill Loads" in each SKILL.md | No circular references |
| Purpose clarity | Can you state each skill's role in one sentence? | Yes for all skills |

Run `scripts/stack-validate.sh <skill1> <skill2> [skill3]` to automate checks.

---

## Concrete Stack Recipes

### Recipe 1: Create Skill from Template

```
Primary:     use-authoring-skills
Complement:  skill-creator
When:        User provides a file/template and says "create a skill like this"
Steps:
  1. Read the template file
  2. Load use-authoring-skills → follow its frontmatter + anatomy guidance
  3. Load skill-creator → follow its creation workflow
  4. Write SKILL.md with proper frontmatter
  5. Validate with scripts/validate-skill.sh
```

### Recipe 2: Create Skill + Parallel Audit

```
Primary:     use-authoring-skills
Complement:  coordinating-loop
When:        User wants to author a skill while auditing existing ones
Steps:
  1. Load use-authoring-skills → draft the new skill
  2. Load coordinating-loop → dispatch subagent to audit existing skills
  3. Merge audit results into the new skill
  4. Validate the final skill
```

### Recipe 3: Full Meta Work (Routing + Authoring + Persistence)

```
Primary:     use-authoring-skills
Complement:  planning-with-files, coordinating-loop
When:        Long-running skill authoring with persistent state
Steps:
  1. Load planning-with-files → init task_plan.md, findings.md, progress.md
  2. Load use-authoring-skills → author the skill
  3. Load coordinating-loop → dispatch parallel validation subagents
  4. Track phases in task_plan.md
  5. Validate and commit
```

### Recipe 4: OpenCode Configuration

```
Primary:     opencode-platform-reference
Complement:  meta-builder (this skill)
When:        User wants to configure agents, commands, tools, MCP, LSP, permissions
Steps:
  1. Identify which concept the user needs (agents, commands, tools, etc.)
  2. Load opencode-platform-reference → read the relevant concept
  3. Apply the configuration
  4. Validate with opencode CLI (e.g., `opencode mcp list`)
```

### Recipe 5: Skill Improvement Cycle

```
Primary:     use-authoring-skills
Complement:  skill-creator
When:        User wants to improve an existing skill
Steps:
  1. Load use-authoring-skills → audit the existing skill
  2. Score against the 5-dimension rubric
  3. Load skill-creator → apply targeted improvements
  4. Re-score → iterate until ≥4.5
```

---

## Invalid Stack Patterns

### Conflict: Same Trigger

```
INVALID: use-authoring-skills + skill-creator (both trigger on "create a skill")
Fix: Use use-authoring-skills as primary. Load skill-creator as supporting reference, not as a stacked skill.
```

### Conflict: Shared State

```
INVALID: planning-with-files + coordinating-loop (both may write to task_plan.md)
Fix: Run sequentially — planning-with-files first to set up state, then coordinating-loop for execution.
```

### Conflict: Identity Crisis

```
INVALID: meta-builder (routing) + user-intent-interactive-loop (probing/depth)
Fix: Route TO user-intent-interactive-loop. Don't stack with it — let it own the session.
```

### Conflict: Cycle

```
INVALID: skill-a (requires skill-b) + skill-b (requires skill-a)
Fix: Remove the circular dependency from one skill's "Required Skill Loads".
```

---

## Stack Lifecycle

1. **Assemble** — Identify primary + complementary skills from the Routing Table.
2. **Validate** — Run the validation checklist above.
3. **Load** — Primary first, then complementary.
4. **Execute** — Work through the task within each skill's methodology.
5. **Unload** — When done, note which skills were used and whether the stack was effective.

---

## Recording a Stack Decision

```markdown
## Stack Decision — YYYY-MM-DD
- **Primary:** <skill-name>
- **Complementary:** <skill1>, <skill2>
- **Reason:** <one sentence>
- **Validation:** stack-validate.sh passed/failed
- **Result:** <pending | successful | failed — reason>
```
