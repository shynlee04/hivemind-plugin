# Dynamic Batch Loading Template

HiveMind loads skill batches dynamically and conditionally based on the current plan, workflow phase, and task context. There is no fixed slot limit — the orchestrator loads what the task demands.

---

## Loading Principles

1. **Entry first.** `use-hivemind` is always loaded first — it establishes framework context and routes to the correct domain.
2. **Domain on demand.** Domain skills (`use-hivemind-delegation`, `use-hivemind-planning`, etc.) load when the task enters that domain.
3. **Depth as needed.** Depth skills (`use-hivemind-tdd`, `hivemind-gatekeeping`, etc.) load when the task requires specific methodology.
4. **Prerequisite chain.** Skills with prerequisites must have those prerequisites loaded first. E.g., `hivemind-gatekeeping` requires `use-hivemind-delegation`.
5. **Drop before replacing.** When rotating to a new batch, drop skills that are no longer relevant.

---

## Batch Declaration

### Layer 1: Entry (Always)
- **Skill:** `use-hivemind`
- **Purpose:** Establish framework context, detect lineage (hiveminder vs hivefiver), route to correct implementation.
- **Required:** Yes. Every session.

### Layer 2: Domain (Load on Domain Entry)
| Skill | When to Load |
|-------|-------------|
| `use-hivemind-delegation` | Splitting work across subagents, dispatching with scope boundaries |
| `use-hivemind-planning` | Creating structured plans, decomposing work into phases |
| `use-hivemind-tdd` | Building features with test-driven development |
| `use-hivemind-git-memory` | Committing with semantic memory, git-anchored continuity |
| `use-hivemind-context` | Verifying context health, detecting rot, recovering state |
| `use-hivemind-skill-authoring` | Creating, auditing, or refactoring HiveMind skills |
| `use-hivemind-research` | Multi-source research routing and evidence collection |

### Layer 3: Depth (Load Based on Task Needs)
| Skill | When to Load | Prerequisites |
|-------|-------------|---------------|
| `hivemind-gatekeeping` | Iterative loops, synthesis gates, verification | `use-hivemind-delegation` |
| `hivemind-codemap` | Codebase scanning, seam discovery, mapping | None |
| `hivemind-atomic-commit` | Typed commit discipline, pre-commit gates | `use-hivemind-git-memory` |
| `hivemind-refactor` | Refactor methodology, surgical changes | `use-hivemind-delegation` |
| `hivemind-patterns` | Architecture patterns, anti-pattern reference | None |
| `hivemind-spec-driven` | Spec-driven engineering, acceptance criteria | `use-hivemind-planning` |
| `hivemind-system-debug` | Debug-to-refactor transitions | None |

---

## Conditional Batch Templates

### Building Feature (TDD)
```
use-hivemind (entry)
use-hivemind-tdd (domain: TDD lifecycle)
hivemind-gatekeeping (depth: test gate enforcement)
```
- TDD cycle: Red → Green → Refactor
- Gatekeeping enforces test passage before phase transitions
- Use when: implementing new features, fixing bugs with tests

### Planning Work
```
use-hivemind (entry)
use-hivemind-planning (domain: plan lifecycle)
hivemind-spec-driven (depth: requirements extraction)
hivemind-codemap (depth: dependency mapping)
```
- Planning creates phased structure
- Spec-driven ensures requirements are testable
- Codemap provides whole-codebase mapping for dependency awareness
- Use when: starting new work, decomposing complex tasks

### Committing Code
```
use-hivemind (entry)
use-hivemind-git-memory (domain: git-anchored continuity)
hivemind-atomic-commit (depth: typed commit discipline)
```
- Git memory anchors decisions to commits
- Atomic commit enforces typed classification and pre-commit gates
- Use when: committing changes, creating PRs, finalizing work

### Debugging
```
use-hivemind (entry)
use-hivemind-delegation (domain: subagent dispatch)
hivemind-system-debug (depth: debug methodology)
hivemind-codemap (depth: codebase investigation)
```
- Delegation routes debug work to specialized agents
- System debug provides reproducibility, narrowing, containment
- Codemap maps the affected area
- Use when: investigating bugs, tracing failures, diagnosing issues

### Creating Skill
```
use-hivemind (entry)
use-hivemind-skill-authoring (domain: skill creation)
hivemind-refactor (depth: clean structure enforcement)
```
- Skill authoring guides creation patterns
- Refactor ensures clean structure and maintainability
- Use when: creating new skills, auditing existing skills

### Context Recovery
```
use-hivemind (entry)
use-hivemind-context (domain: context health)
hivemind-codemap (depth: ground truth rebuild)
```
- Context integrity detects and routes around rot
- Codemap rebuilds ground truth from actual file structure
- Use when: session feels stale, after interruptions, when docs contradict code

### Research
```
use-hivemind (entry)
use-hivemind-delegation (domain: subagent dispatch)
use-hivemind-research (depth: research methodology)
```
- Delegation routes research threads to subagents
- Research framework provides methodology and evidence contracts
- Use when: investigating technologies, evaluating options, gathering evidence

### Orchestrator Session
```
use-hivemind (entry)
use-hivemind-delegation (domain: dispatch protocol)
hivemind-gatekeeping (depth: checkpoint gates)
```
- Orchestrator coordinates, delegates, gatekeeps
- Gatekeeping enforces checkpoint gates across workflow phases
- Use when: front-facing agent receiving user prompts, multi-agent coordination

### Investigation Wave
```
use-hivemind (entry)
use-hivemind-delegation (domain: swarm dispatch)
hivemind-codemap (depth: scan mechanics)
```
- Delegation dispatches investigation swarms to subagents
- Codemap provides scan mechanics for hivexplorer agents
- Use when: starting any complex task, context gathering before implementation

---

## Multi-Wave Batch Rotation

For complex tasks, the skill batch rotates across waves. Drop skills that are no longer relevant before loading replacements.

```
Wave 1 (Investigation): use-hivemind + use-hivemind-delegation + hivemind-codemap
Wave 2 (Research):      use-hivemind + use-hivemind-delegation + use-hivemind-research
Checkpoint (Planning):  use-hivemind + use-hivemind-planning + hivemind-spec-driven + hivemind-codemap
Wave 3 (Implement):     use-hivemind + use-hivemind-tdd + hivemind-gatekeeping
Wave 4 (Verify):        use-hivemind + use-hivemind-delegation + hivemind-gatekeeping
```

- Each wave drops skills from the previous wave that are no longer needed
- Domain skills may also rotate when the domain changes (e.g., delegation → planning)
- Checkpoints between waves are explicit: pause, verify gate, then rotate
- Depth skills may accumulate if the task genuinely needs multiple complementary methodologies

---

## Dynamic Rotation Rules

1. **Load on demand.** Don't pre-load skills "just in case." Load when the task enters that domain or needs that methodology.
2. **Drop when done.** If a skill served its purpose and the task moved on, drop it to keep context clean.
3. **Prerequisite chain.** `hivemind-gatekeeping` needs `use-hivemind-delegation`. `hivemind-atomic-commit` needs `use-hivemind-git-memory`. `hivemind-spec-driven` needs `use-hivemind-planning`. Load prerequisites first.
4. **Depth accumulation is allowed.** If the task needs TDD + gatekeeping + patterns, load all three. Don't artificially constrain.
5. **The orchestrator decides.** Batch composition is driven by the workflow state, not by a fixed formula.

---

## Quick Reference Card

| Task | Domain Skill | Depth Skill(s) |
|------|-------------|----------------|
| Build feature | use-hivemind-tdd | hivemind-gatekeeping |
| Plan work | use-hivemind-planning | hivemind-spec-driven, hivemind-codemap |
| Commit code | use-hivemind-git-memory | hivemind-atomic-commit |
| Debug issue | use-hivemind-delegation | hivemind-system-debug, hivemind-codemap |
| Create skill | use-hivemind-skill-authoring | hivemind-refactor |
| Recover context | use-hivemind-context | hivemind-codemap |
| Research | use-hivemind-delegation | use-hivemind-research |
| Orchestrator session | use-hivemind-delegation | hivemind-gatekeeping |
| Investigation wave | use-hivemind-delegation | hivemind-codemap |
| Multi-wave orchestration | varies (rotate per phase) | varies (rotate per phase) |
