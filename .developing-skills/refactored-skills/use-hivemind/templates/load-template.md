# Load-3 Template

HiveMind uses a 3-slot skill loading system. At session start, load exactly 3 skills:
- Slot 1 is always `use-hivemind` (entry router)
- Slot 2 is the domain skill
- Slot 3 is the depth/complement skill

---

## Stack Declaration

### Slot 1: Entry (Always)
- **Skill:** `use-hivemind`
- **Purpose:** Establish framework context, detect lineage (hiveminder vs hivefiver), route to correct implementation.
- **Required:** Yes. Every session.

### Slot 2: Domain (Choose One)
| Skill | When to Load |
|-------|-------------|
| `use-hivemind-delegation` | Splitting work across subagents, dispatching with scope boundaries |
| `use-hivemind-planning` | Creating structured plans, decomposing work into phases |
| `use-hivemind-tdd` | Building features with test-driven development |
| `use-hivemind-git-memory` | Committing with semantic memory, git-anchored continuity |
| `use-hivemind-context` | Verifying context health, detecting rot, recovering state |
| `use-hivemind-skill-authoring` | Creating, auditing, or refactoring HiveMind skills |

### Slot 3: Depth (Domain-Appropriate)
Choose based on Slot 2 domain. See load templates below.

---

## Load Templates

### Building Feature
```
Slot 1: use-hivemind
Slot 2: use-hivemind-tdd
Slot 3: hivemind-gatekeeping-delegation
```
- TDD cycle: Red → Green → Refactor
- Gatekeeping enforces test passage before phase transitions
- Use when: implementing new features, fixing bugs with tests

### Planning Work
```
Slot 1: use-hivemind
Slot 2: use-hivemind-planning
Slot 3: hivemind-codemap
```
- Planning creates phased structure
- Codemap provides whole-codebase mapping for dependency awareness
- Use when: starting new work, decomposing complex tasks

### Committing Code
```
Slot 1: use-hivemind
Slot 2: use-hivemind-git-memory
Slot 3: hivemind-atomic-commit
```
- Git memory anchors decisions to commits
- Atomic commit enforces typed classification and pre-commit gates
- Use when: committing changes, creating PRs, finalizing work

### Debugging
```
Slot 1: use-hivemind
Slot 2: use-hivemind-delegation
Slot 3: hivemind-system-debug
```
- Delegation routes debug work to specialized agents
- System debug provides reproducibility, narrowing, containment
- Use when: investigating bugs, tracing failures, diagnosing issues

### Creating Skill
```
Slot 1: use-hivemind
Slot 2: use-hivemind-skill-authoring
Slot 3: hivemind-refactor (review-and-refactor)
```
- Skill authoring guides creation patterns
- Refactor ensures clean structure and maintainability
- Use when: creating new skills, auditing existing skills

### Context Recovery
```
Slot 1: use-hivemind
Slot 2: use-hivemind-context (use-hivemind-context-integrity)
Slot 3: hivemind-codemap
```
- Context integrity detects and routes around rot
- Codemap rebuilds ground truth from actual file structure
- Use when: session feels stale, after interruptions, when docs contradict code

### Research
```
Slot 1: use-hivemind
Slot 2: use-hivemind-delegation
Slot 3: hivemind-research-framework
```
- Delegation routes research threads to subagents
- Research framework provides methodology and evidence contracts
- Use when: investigating technologies, evaluating options, gathering evidence

---

## Slot Budget

- **Maximum active skills:** 3
- **Rationale:** More than 3 skills cause context overlap, contradictory advice, and routing confusion.
- **If you need a 4th skill:** Drop Slot 3 and replace it. Never exceed 3.
- **Rotation:** Slot 3 rotates based on immediate task. Slots 1 and 2 are stable per session.

---

## Quick Reference Card

| Task | Slot 2 | Slot 3 |
|------|--------|--------|
| Build feature | use-hivemind-tdd | hivemind-gatekeeping |
| Plan work | use-hivemind-planning | hivemind-codemap |
| Commit code | use-hivemind-git-memory | hivemind-atomic-commit |
| Debug issue | use-hivemind-delegation | hivemind-system-debug |
| Create skill | use-hivemind-skill-authoring | hivemind-refactor |
| Recover context | use-hivemind-context | hivemind-codemap |
| Research | use-hivemind-delegation | hivemind-research-framework |
