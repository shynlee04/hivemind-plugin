# Document Pipeline

Promotion rules, validation gates, and naming conventions for investigation artifacts.

---

## Pipeline Stages

Investigation artifacts flow through four stages. Each stage has stricter quality requirements.

```
.scratch/          → Raw notes (ephemeral, session-scoped)
  ↓ promote
.research/         → Findings with sources (reusable across sessions)
  ↓ promote
.planning/decisions/ → ADRs (Architecture Decision Records, project-level)
  ↓ promote
.planning/phases/  → Execution plans (Source of Truth for implementation)
```

---

## Stage 1: Scratch (`.scratch/`)

**Purpose**: Raw notes, temporary observations, unstructured thinking.

**Lifetime**: Ephemeral. Deleted or promoted within the session.

**Naming**: `scratch-YYYY-MM-DD-topic.md`

**Content Rules**:
- No quality requirements — write freely
- May contain TODOs, placeholders, incomplete thoughts
- Must include date in filename
- Should reference source files (paths, line numbers)

**Example**:
```markdown
# Scratch — 2026-04-08 — Session Recovery

- lifecycle-manager.ts:480 — approaching LOC limit
- continuity.ts uses JSON file for persistence
- Need to check if state.ts Maps are synced with continuity
- TODO: verify completion-detector signals
```

---

## Stage 2: Research (`.research/`)

**Purpose**: Structured findings with cited sources. Reusable across sessions.

**Lifetime**: Persistent until superseded by a decision or plan.

**Naming**: `findings-YYYY-MM-DD-topic.md`

**Promotion Gate** (from .scratch/ to .research/):
- [ ] Every finding has a source (file path, line number, or URL)
- [ ] No TODOs or placeholders remain
- [ ] Findings are organized by topic, not by time discovered
- [ ] Contradictions between findings are flagged

**Content Structure**:
```markdown
# Findings — YYYY-MM-DD — Topic

## Summary
2-3 sentence overview of what was discovered.

## Findings

### Finding 1: [Title]
**Source**: `src/lib/file.ts:45-67`
**Evidence**: [What the code shows]
**Implication**: [What this means for the project]

### Finding 2: [Title]
**Source**: `src/lib/other.ts:120`
**Evidence**: [What the code shows]
**Implication**: [What this means for the project]

## Contradictions
[Any findings that conflict with each other, with resolution or flag]

## Gaps
[What could not be determined and why]
```

---

## Stage 3: Decisions (`.planning/decisions/`)

**Purpose**: Architecture Decision Records (ADRs). Project-level decisions that affect multiple modules.

**Lifetime**: Persistent until explicitly superseded by a new ADR.

**Naming**: `ADR-NNN-YYYY-MM-DD-title.md` (NNN is sequential: 001, 002, ...)

**Promotion Gate** (from .research/ to .planning/decisions/):
- [ ] Decision is clearly stated in one sentence
- [ ] Context explains why the decision was needed
- [ ] At least 2 alternatives were considered
- [ ] Consequences (positive and negative) are listed
- [ ] All research findings that informed the decision are cited
- [ ] No TODOs or placeholders

**Content Structure** (based on Michael Nygard's ADR format):
```markdown
# ADR-NNN: Title

**Date**: YYYY-MM-DD
**Status**: Proposed | Accepted | Deprecated | Superseded by ADR-NNN

## Context
What is the issue that we're seeing that is motivating this decision?

## Decision
What is the change that we're proposing and/or doing?

## Alternatives Considered
1. [Alternative 1] — Why not chosen
2. [Alternative 2] — Why not chosen

## Consequences
- [Positive consequence]
- [Negative consequence]
- [What becomes easier, what becomes harder]

## Sources
- [Link to research findings that informed this decision]
```

---

## Stage 4: Plans (`.planning/phases/`)

**Purpose**: Execution plans. Source of Truth for implementation work.

**Lifetime**: Persistent until the phase is complete and archived.

**Naming**: `PLAN-NNN-YYYY-MM-DD-phase-name.md`

**Promotion Gate** (from .planning/decisions/ to .planning/phases/):
- [ ] Plan references specific ADRs that govern the approach
- [ ] Plan has clear success criteria (checkable items)
- [ ] Plan identifies specific files to modify (with paths)
- [ ] Plan includes verification steps (commands to run)
- [ ] All research findings are integrated
- [ ] No TODOs or placeholders

**Content Structure**:
```markdown
# PLAN-NNN: Phase Name

**Date**: YYYY-MM-DD
**Status**: Draft | Approved | In Progress | Complete | Archived

## Objective
One sentence: what this phase delivers.

## Scope
- Include: [specific files, features, behaviors]
- Exclude: [what is explicitly out of scope]

## Success Criteria
- [ ] Criterion 1 (checkable)
- [ ] Criterion 2 (checkable)
- [ ] Criterion 3 (checkable)

## Implementation Steps
1. [Step 1 — specific action, target file]
2. [Step 2 — specific action, target file]
3. [Step 3 — specific action, target file]

## Verification
```bash
# Commands to verify the phase is complete
npm run build
npm test
npx vitest run -t "specific test"
```

## Governing ADRs
- [ADR-NNN](../decisions/ADR-NNN-title.md) — [one-line summary]

## Research Sources
- [findings-YYYY-MM-DD-topic.md](../../research/findings-YYYY-MM-DD-topic.md)
```

---

## Promotion Rules

### General Rules

| Rule | Description |
|------|-------------|
| No backward promotion | Cannot promote from Stage 3 to Stage 2 |
| No skipping stages | Must promote sequentially (1→2→3→4) |
| Sources required | Every promoted document must cite its sources |
| No TODOs | Promoted documents have no TODOs or placeholders |
| Date-stamped | Every filename includes YYYY-MM-DD |

### Promotion Checklist

Before promoting any document:
- [ ] All sources are cited
- [ ] No TODOs remain
- [ ] No placeholders (`[TODO]`, `FIXME`, `implement later`)
- [ ] Filename follows naming convention
- [ ] Content is self-contained (does not depend on scratch notes)

---

## Case Study: From Scratch to Plan

**Scenario**: Agent investigates why session recovery fails after 3 retries.

1. **Scratch**: `scratch-2026-04-08-recovery-bug.md` — Raw notes about error messages, stack traces, hypotheses
2. **Research**: `findings-2026-04-08-recovery-bug.md` — Structured findings: retry counter off-by-one in lifecycle-manager.ts:312, continuity.ts doesn't persist retry state
3. **Decision**: `ADR-007-2026-04-08-retry-state-persistence.md` — Decision: persist retry count in continuity store, not just in-memory Map
4. **Plan**: `PLAN-012-2026-04-08-fix-retry-persistence.md` — Implementation plan: modify continuity.ts write path, add retry field to state schema, update tests

Each stage added structure, removed noise, and increased actionability.
