# Stacking Rules

How to combine multiple skills together for complex tasks without creating conflicts, cycles, or context dilution.

---

## What Is Skill Stacking?

Skill stacking is loading multiple skills simultaneously so the Agent can draw on their combined guidance. It is not loading every skill "just in case" — it is a deliberate, constrained combination where each skill serves a distinct purpose.

```
Single Skill:    [use-authoring-skills] → guides skill creation
Skill Stack:     [use-authoring-skills + coordinating-loop + planning-with-files]
                 → guides skill creation WITH parallel dispatch WITH persistent memory
```

---

## Stacking Principles

### 1. Primary + Complementary Pattern

Every stack has exactly one **primary** skill (matching the user's main intent) and zero or more **complementary** skills (supporting the primary workflow).

```
Primary:     The skill that matches the user's core intent
Complementary: Skills that enhance the primary workflow
```

**Example:**
- User: "Create a skill for code review, and run the audit in parallel with the TDD cycle"
- Primary: `use-authoring-skills` (creating a skill)
- Complementary: `coordinating-loop` (parallel dispatch), `planning-with-files` (persistent memory)

### 2. Maximum Three Skills

Never load more than 3 skills simultaneously. Beyond that, context dilutes and the Agent loses focus.

| Stack Size | Viability |
|------------|-----------|
| 1 skill | Optimal — full attention |
| 2 skills | Good — clear primary/complementary |
| 3 skills | Acceptable — requires discipline |
| 4+ skills | **Blocked** — context dilution risk |

### 3. No Conflicting Triggers

Before stacking, verify that no two skills claim the same trigger phrases. If they do, pick one.

**Check:**
```bash
# Grep trigger phrases across all candidate skills
grep -r "Use when" skill-a/SKILL.md skill-b/SKILL.md
```

If both skills trigger on "create a skill", they conflict. Choose the more specific one.

### 4. No Shared State Mutation

Skills that write to the same files cannot be stacked for parallel execution. They must run sequentially.

**Check:**
- Compare "Handoff Paths" sections across skills.
- If both write to `task_plan.md`, they share state.
- If both write to different files, stacking is safe.

### 5. No Dependency Cycles

Skill A requires Skill B, and Skill B requires Skill A. This creates an infinite loading loop.

**Check:**
- Trace the "Required Skill Loads" table in each SKILL.md.
- If A lists B and B lists A, you have a cycle.
- Break the cycle by removing one direction.

---

## Valid Stack Patterns

### Pattern A: Authoring + Creation

```
Primary: use-authoring-skills
Complementary: skill-creator, writing-skills
Purpose: Creating skills with proper tooling
```

**When to use:** User wants to create a new skill and needs the creation methodology.

### Pattern B: Engagement + Planning

```
Primary: user-intent-interactive-loop
Complementary: planning-with-files
Purpose: Long sessions with persistent memory
```

**When to use:** User's intent is unclear and the task is complex enough to need file-based planning.

### Pattern C: Coordination + Dispatch

```
Primary: coordinating-loop
Complementary: dispatching-parallel-agents
Purpose: Multi-agent orchestration with parallel execution
```

**When to use:** User has multiple independent tasks to run concurrently.

### Pattern D: Meta-Builder + Any

```
Primary: meta-builder
Complementary: Any GROUP 1 skill + Any GROUP 2 skill
Purpose: Full-stack meta work (routing + execution)
```

**When to use:** User wants the orchestrator to manage the entire workflow end-to-end.

### Pattern E: Authoring + Coordination + Planning

```
Primary: use-authoring-skills
Complementary: coordinating-loop, planning-with-files
Purpose: Complex skill authoring with parallel audits and persistent state
```

**When to use:** User wants to author skills while running parallel audits and maintaining session state.

---

## Invalid Stack Patterns

### Conflict: Same Trigger

```
INVALID: use-authoring-skills + skill-creator
Reason: Both trigger on "create a skill"
Fix: Use use-authoring-skills as primary, load skill-creator as a supporting tool (not a stacked skill)
```

### Conflict: Shared State

```
INVALID: planning-with-files + coordinating-loop (both writing to task_plan.md)
Reason: Both skills may mutate the same planning files
Fix: Run sequentially — planning-with-files first, then coordinating-loop
```

### Conflict: Identity Crisis

```
INVALID: meta-builder (routing) + user-intent-interactive-loop (depth)
Reason: meta-builder is a routing skill; user-intent-interactive-loop is a depth skill
Fix: Route TO user-intent-interactive-loop, don't stack with it
```

### Conflict: Cycle

```
INVALID: skill-a (requires skill-b) + skill-b (requires skill-a)
Reason: Infinite loading loop
Fix: Remove the circular dependency from one skill's "Required Skill Loads"
```

---

## Stacking Decision Flowchart

```
User request spans multiple domains?
  No → Load single skill
  Yes → Are domains compatible?
    No → Handle sequentially
    Yes → How many skills needed?
      1 → Load primary only
      2 → Load primary + 1 complementary
      3 → Load primary + 2 complementary (max)
      4+ → BLOCK — reduce scope or handle sequentially

After selecting skills:
  1. Check trigger overlap → Conflict? → Remove one
  2. Check shared state → Conflict? → Run sequentially
  3. Check dependency cycles → Cycle? → Break it
  4. Run scripts/stack-validate.sh → Pass? → Load stack
```

---

## Stack Validation Checklist

Before loading a stack, verify:

| Check | Method | Pass Criteria |
|-------|--------|---------------|
| Trigger overlap | Grep `description:` in all SKILL.md files | No shared trigger phrases |
| Shared state | Compare "Handoff Paths" sections | No overlapping file writes |
| Dependency cycle | Trace "Required Skill Loads" tables | No circular references |
| Context budget | Count total reference files across all skills | < 15 reference files total |
| Purpose clarity | Can you articulate each skill's role? | Yes, in one sentence each |

Run `scripts/stack-validate.sh` to automate checks 1-3.

---

## Stack Lifecycle

### 1. Assemble

Identify the primary skill and complementary skills based on user intent.

### 2. Validate

Run the validation checklist. Fix any conflicts before loading.

### 3. Load

Load skills in order: primary first, then complementary.

### 4. Execute

Work through the task, drawing on each skill's guidance as needed.

### 5. Integrate

Merge outputs from all skills. Resolve any contradictions.

### 6. Unload

When the task is complete, note which skills were used and whether the stack was effective. Record in `progress.md`.

---

## Stack Recording

Every stack decision must be recorded:

```markdown
## Stack Decision — 2026-04-03
- **Primary:** use-authoring-skills
- **Complementary:** coordinating-loop, planning-with-files
- **Reason:** User wants to create a skill with parallel audit and persistent memory
- **Validation:** stack-validate.sh passed
- **Result:** [pending | successful | failed — reason]
```

---

## Cross-References

| Reference | Relationship |
|-----------|-------------|
| `references/01-routing-logic.md` | How to detect when stacking is needed |
| `references/02-opencode-concepts.md` | Concepts that inform stacking decisions |
| `SKILL.md` (parent) | The stacking guide summary |
| `scripts/stack-validate.sh` | Automated validation script |
