# Worked Examples: user-intent-interactive-loop

## Example 1: End-to-End Skill Creation

**User says:** "I want to create a skill like this @.kilo/command/deep-research-synthesis-repomix.md"

### PROBE Phase — Turn 1

Agent loads 3 platform skills first per Gate 3, initializes tracking files per FIRST ACTION.

```
question("Should this skill cover just the deep-research synthesis pattern,
          or also include auditing and eval capabilities?")
```

User: "Just the synthesis pattern for now"

→ Updates `intent.json` with `scope_in`/`scope_out`.

### PROBE Phase — Turn 2

```
question("What should trigger this skill? Something like 'synthesize this repo'
          or 'deep research this codebase'?")
```

User: "Both of those, plus 'analyze this repo deeply'"

→ Updates `intent.json` with `success_criteria`.

### PROBE Phase — Turn 3

```
question("Should it follow the exact SKILL.md + references structure,
          or do you want a simpler single-file version?")
```

User: "Full structure with references"

→ Updates `intent.json` with `constraints`.

### Validation Loop

```bash
bash scripts/intent-verify.sh --probe
# Exit 0 — all conditions met
```

### UNDERSTAND Phase

> "So: a skill that triggers on 'synthesize this repo', 'deep research this codebase',
> or 'analyze this repo deeply'. It should use the full SKILL.md + references structure,
> focused on deep-research synthesis patterns. I'll plan the structure, then delegate
> the file writing to a subagent. Correct?"

User: "Yes"

→ Writes confirmation to `progress.md`. Runs validation loop again — exit 0.

### PLAN Phase

```
Phase 1: Audit existing skill patterns
Phase 2: Draft SKILL.md
Phase 3: Write reference files
Phase 4: Write scripts
Phase 5: Validate and commit
```

### DELEGATE Phase

> "Spinning up a writer subagent for Phase 1. Budget: 2000 tokens.
> It will audit existing skill patterns and write findings to disk."

### UPDATE Phase

> "Phase 1 complete. Found 3 relevant patterns. Moving to Phase 2 — drafting SKILL.md."

### DELIVER Phase

> "All 5 phases complete. Delivered:
> - SKILL.md (380 lines)
> - 4 reference files
> - 2 validation scripts
> All committed. Want any adjustments?"

---

## Example 2: Vague Request — Scope Clarification

**User says:** "Help me figure out what to do next"

### PROBE Phase

```
question("What domain are we in — code, skills, config, or something else?")
```

User: "Skills. I have a bunch of half-finished ones."

```
question("Should we audit what exists, or start fresh on a specific skill?")
```

User: "Audit first."

→ Routes to `use-authoring-skills` with audit pattern.

---

## Example 3: Long Session Recovery

**User says:** "Keep going with this"

### Recovery Protocol

1. Read `task_plan.md` first 30 lines — confirm Goal and Current Phase
2. Read `findings.md` — what's been discovered
3. Read `progress.md` — what's been done
4. Resume from last `in_progress` phase
5. Update user: "Recovered state. We're at Phase 3 of 5 — writing reference files."
