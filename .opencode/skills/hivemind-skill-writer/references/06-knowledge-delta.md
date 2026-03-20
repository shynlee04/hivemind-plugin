# Knowledge Delta — The Core Formula

## The Equation

> **Good Skill = Expert-only Knowledge − What Claude Already Knows**

A Skill's value is measured by its **knowledge delta** — the gap between what it provides and what the model already knows.

---

## Knowledge Types

| Type | Definition | Treatment |
|------|------------|-----------|
| **Expert** | Claude genuinely doesn't know this | MUST keep — this is the Skill's value |
| **Activation** | Claude knows but may not think of | Keep if brief — serves as reminder |
| **Redundant** | Claude definitely knows this | DELETE — wastes tokens |

---

## Evaluation Rule

**For each section, ask: "Does Claude already know this?"**

### Expert Knowledge (KEEP)

Examples:
- HiveMind-specific conventions and patterns
- Project-specific file locations and structures
- Framework-specific constraints and rules
- Domain expertise not in training data

### Activation Knowledge (KEEP IF BRIEF)

Examples:
- Reminders of common patterns
- Checklist items Claude might forget
- Decision heuristics
- Quick reference for known concepts

### Redundant Knowledge (DELETE)

Examples:
- Universal programming concepts
- Standard tool usage
- Common patterns well-covered in training
- Generic best practices

---

## Quality Check

| If content is... | Action |
|-----------------|--------|
| Expert knowledge | Keep — adds value |
| Already in training | Delete — wastes tokens |
| Reminder/activation | Keep brief or delete |
| Covering known basics | Delete — insults intelligence |

---

## Anti-Patterns

- **Padding** — Adding redundant content to appear thorough
- **Generic filler** — Including what Claude already knows
- **Tutorial mode** — Explaining concepts instead of applying them

---

## Example

**Before (Redundant):**
```markdown
## How to Use

1. First, install dependencies with npm install
2. Then run the build with npm run build
3. Finally, test with npm test
```

**After (Expert):**
```markdown
## Project Build Order

- Install: `npm ci` (clean install, not npm install)
- Build: `npm run build` requires prior `npm run typecheck`
- Test: Only after build succeeds
```

---

**Rule:** If Claude would write similar content without prompting, it's REDUNDANT.
