# Meta-Builder 5-Skill Chain — Spec Document

**Date:** 2026-04-07  
**Status:** Draft — awaiting user review  
**Author:** Orchestrator session

---

## Problem Statement

The current `meta-builder` skill does one-hop routing (request → routing table → specialist → done). Real users need multi-step navigation through complex requests: wall-of-text dumps, @file references, entire folder references, absurd multi-paragraph rambling. The skill must navigate, not just route.

## Scope

**In scope:**
- Refactor `meta-builder` SKILL.md into a 5-skill chain orchestrator
- Each step has: specific skill, hard gate, spawned agents, domain references, failure handling
- Chain: intent capture → codebase exploration → skill audit → design → execution dispatch
- meta-builder must work standalone (no other skills) AND enhanced (with specialists)

**Out of scope:**
- Refactoring the 5 downstream skills themselves (separate specs for each)
- Changes to `src/` runtime code
- New skill creation
- Changes to governance documents

## Architecture

meta-builder becomes an orchestrator that loads skills sequentially, validates hard gates between steps, spawns agents for domain work, and tracks progress via git commits per step.

```
Step 1: user-intent-interactive-loop → Gate: intent-verify.sh exits 0
Step 2: repomix-explorer             → Gate: findings.md populated
Step 3: use-authoring-skills         → Gate: validate-gate.sh audit exits 0
Step 4: brainstorming                → Gate: spec approved + committed
Step 5: coordinating-loop            → Gate: check-complete.sh exits 0
```

Each step blocks the next until its gate passes. No batching. No skipping.

## Components

### meta-builder SKILL.md (refactored)

**Changes:**
- Replace current routing-table-only body with 5-skill chain protocol
- Add hard gate enforcement (no proceeding without gate validation)
- Add failure handling table (what happens when each gate fails)
- Add cross-reference map (which reference files from other skills to load per step)
- Keep: Iron Law, anti-patterns, question discipline

**Unchanged:**
- Frontmatter (name, description, metadata, allowed-tools)
- Routing table (still valid for intent classification)
- Stacking recipes (still valid for multi-skill stacks)

### Hard Gates

| Step | Gate | Enforcement |
|------|------|-------------|
| 1 | `intent-verify.sh --probe` exits 0 | Script checks intent.json has all 6 fields |
| 2 | `findings.md` exists and has content | File existence + non-empty check |
| 3 | `validate-gate.sh audit` exits 0 | Script checks quality scores documented |
| 4 | Spec file exists, user confirmed | File existence + grep for user approval |
| 5 | `check-complete.sh` exits 0 | Script checks all tasks DONE |

### Spawned Agents Per Step

| Step | Agents | Purpose |
|------|--------|---------|
| 1 | `intent-loop` (if unclear) | Extended probing beyond 3 questions |
| 2 | `explore`, `researcher` | Codebase scan, external repo analysis |
| 3 | `critic`, `hivefiver-skill-author` | Quality review, audit path |
| 4 | `spec-document-reviewer` | Spec validation |
| 5 | `builder`, `critic`, `researcher` | Implementation, review, investigation |

### Cross-Reference Map

When navigating, meta-builder loads reference files from other skills:

| If User Wants | Load Reference From |
|--------------|-------------------|
| Create a skill | `use-authoring-skills/references/03-three-patterns.md` |
| Fix triggers | `use-authoring-skills/references/11-description-optimization.md` |
| Audit quality | `use-authoring-skills/references/05-skill-quality-matrix.md` |
| Agent config | `agents-and-subagents-dev/references/delegation-protocol.md` |
| Command structure | `command-dev/references/command-anatomy.md` |
| Non-interactive shell | `command-dev/references/non-interactive-shell.md` |
| Skill conflicts | `use-authoring-skills/references/08-conflict-detection.md` |
| Loading order | `meta-builder/references/04-skills-chaining.md` |

## Data Flow

1. User request (may include @file, wall of text, folder references)
2. Step 1 reads request, classifies intent, writes `intent.json`
3. Step 2 packs codebase, extracts patterns, writes `findings.md`
4. Step 3 audits current state, scores quality, writes gap analysis
5. Step 4 designs refactoring approach, writes spec, gets user approval
6. Step 5 dispatches agents, tracks progress, commits per step

## Error Handling

| Step | Failure | Recovery |
|------|---------|----------|
| 1 | Intent unclear after 3 questions | Extended probing via intent-loop agent |
| 2 | File/repo inaccessible | Scale down: compress mode, sample key files |
| 3 | Quality score < 2/5 | Recommend rewrite, not refactor |
| 4 | User rejects design | Revise, re-present, re-approve |
| 5 | Tasks BLOCKED after retry | Escalate to user with blocker details |

## Testing

### RED Tests (6 invoke + 4 non-invoke)

**Should invoke meta-builder:**
1. "build me a skill for deep research like this @file"
2. "my skill doesn't load when i say 'create agent' — what's broken?"
3. "i have 3 skills that all trigger at the same time and fight each other"
4. "stack these skills together but they keep overloading context"
5. "i'm not sure what i need, help me figure it out"
6. "convert this 500-line command into a proper skill"

**Should NOT invoke meta-builder:**
1. "fix this typescript compilation error"
2. "write a test for the login function"
3. "deploy this to production"
4. "explain how react hooks work"

### Extreme Cases (from community failures)
1. Trigger phrase too generic → false positive
2. Mega-skill syndrome → reliability drops
3. Silent fake success → validation bypassed
4. Step skipping → intermediate steps omitted
5. Output format drift → inconsistent results
6. Error swallowing → plausible fake data
7. Context overload → 6+ skills loaded, all ignored
8. Routing improvisation → agent ignores routing table

## Acceptance Criteria

- [ ] meta-builder SKILL.md refactored with 5-skill chain protocol
- [ ] Hard gates documented and enforceable
- [ ] Cross-reference map complete (8 reference files mapped)
- [ ] Failure handling table complete (5 failure modes with recovery)
- [ ] RED tests pass (6 invoke, 4 non-invoke)
- [ ] Extreme cases documented (8 failure patterns from community)
- [ ] No dead references (all referenced files exist)
- [ ] Works standalone (no other skills required)
- [ ] Works enhanced (with specialist skills loaded)
- [ ] Atomic git commits per step (one commit per validated step)

## Dependencies

- `user-intent-interactive-loop` — must exist and have intent-verify.sh
- `repomix-explorer` — must exist and support file packing
- `use-authoring-skills` — must exist and have validate-gate.sh
- `brainstorming` — must exist (third-party, already available)
- `coordinating-loop` — must exist and have check-complete.sh

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Step 1 doesn't trigger on natural language | High | Critical | Add real user phrases to description |
| Hard gates are scripts that don't exist | Medium | High | Verify all scripts exist before proceeding |
| Chain is too rigid for simple requests | Medium | Medium | Add "quick path" for trivial requests |
| Context budget exceeded by step 2 | Medium | Medium | Use compress mode, sample key files |
