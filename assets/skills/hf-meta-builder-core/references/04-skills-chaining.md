# Skills Chaining — Concept Composition Patterns

## What Is Skills Chaining

Skills chaining combines multiple OpenCode skills into a single workflow. The meta-builder determines which skills to chain, in what order, and how they interact.

## Core Rules

1. **Max 3 skills per stack** — More than 3 creates cognitive overload
2. **Load order matters** — Background skills first, then domain skills
3. **Each skill retains its gates** — Chaining doesn't bypass individual skill rules
4. **One primary skill** — The skill that does the main work
5. **Complement skills support** — They provide context, coordination, or validation

## Loading Order

```
Layer 0: meta-builder (this skill — routing)
    ↓
Background: opencode-platform-reference, repomix-exploration-guide, opencode-non-interactive-shell
    ↓
Layer 1: user-intent-interactive-loop (if intent unclear)
    ↓
Layer 2: hm-planning-persistence (if multi-step)
    ↓
Layer 3: coordinating-loop (if multiple tasks)
    ↓
Layer 4: use-authoring-skills (if creating/editing skills)
```

## Stack Patterns

### Pattern 1: Linear Chain
```
A → B → C
```
Each skill completes before the next starts. Used for sequential workflows.

**Example:** Create skill from template
```
meta-builder → user-intent-interactive-loop → hm-planning-persistence → use-authoring-skills
```

### Pattern 2: Parallel Branch
```
     ┌── B ──┐
A →──┤       ├──→ D
     └── C ──┘
```
B and C run simultaneously. D waits for both.

**Example:** Create skill + audit existing skills
```
meta-builder → hm-planning-persistence → (coordinating-loop ║ use-authoring-skills) → validator
```

### Pattern 3: Conditional Branch
```
     ┌── B (if condition X)
A →──┤
     └── C (if condition Y)
```
Only one branch executes based on conditions.

**Example:** Route based on user intent
```
meta-builder → (user-intent-interactive-loop if ambiguous) OR (hm-planning-persistence if clear)
```

### Pattern 4: Loop with Validation
```
A → B → validate → (retry B if fail) → C
```
B repeats until validation passes.

**Example:** Skill authoring with validation loop
```
meta-builder → use-authoring-skills → validate-skill.sh → (fix if fail) → coordinating-loop
```

## Concept Stacking with OpenCode Soft Concepts

Skills can stack with other OpenCode concepts:

| Concept | How It Stacks | Example |
|---------|--------------|---------|
| **Agents** | Agent provides execution context for skill | Hivemind orchestrator agent runs meta-builder skill |
| **Commands** | Command triggers skill chain | `/start-work` → meta-builder → planning → execution |
| **Permissions** | Permissions gate which skills can load | `permission.skill: {"meta-builder": "allow"}` |
| **Rules** | Rules constrain skill behavior | "Never edit .opencode/ without user confirmation" |
| **Custom Tools** | Tools extend skill capabilities | Zod-validated tool for skill scaffolding |

## Anti-Patterns in Chaining

| Anti-Pattern | What It Looks Like | Fix |
|-------------|-------------------|-----|
| **The Tower** — Stacking 5+ skills | `skill(A) → skill(B) → skill(C) → skill(D) → skill(E)` | Max 3. Split into sub-graphs. |
| **The Bypass** — Loading skill but ignoring its gates | Load `use-authoring-skills` but skip validation loop | Follow each skill's gates. No exceptions. |
| **The Duplicate** — Loading same skill twice | `skill("hm-planning-persistence")` called in two nodes | Check loaded skills before loading. |
| **The Orphan** — Loading skill with no execution path | Load skill but never execute its workflow | Every loaded skill must have a traversal path. |
| **The Circular** — A depends on B, B depends on A | `coordinating-loop` → `hm-planning-persistence` → `coordinating-loop` | Break the cycle. One skill must be primary. |

## Worked Example: Full Stack

**User says:** "Create a new skill for API pattern synthesis, audit existing skills for overlaps, and set up a command to trigger it"

**Stack:**
```
Primary:     use-authoring-skills (creates the new skill)
Complement:  coordinating-loop (audits existing skills in parallel)
Complement:  opencode-platform-reference (sets up the command)
```

**Traversal:**
1. meta-builder → intent-clarifier (scope: 3 tasks identified)
2. meta-builder → planner (task_plan.md with 3 phases)
3. meta-builder → (coordinator ║ author) (parallel: audit + create)
4. meta-builder → validator (check all 3 tasks complete)
5. meta-builder → terminal (report delivery)

**Result:** New skill created, audit report generated, command configured.
