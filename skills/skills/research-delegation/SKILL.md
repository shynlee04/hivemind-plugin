---
name: research-delegation
description: Research-specific delegation for evidence collection and synthesis. Use when: delegating evidence collection to subagents, validating and grading sources, coordinating multi-source synthesis across parallel research threads, managing research thread lifecycle, or integrating with hivemind-research-framework methodology. Extends use-hivemind-delegation with research-specific packet fields and evidence contracts.
---
# research-delegation

Research-specific delegation for evidence collection, source validation, and multi-source synthesis. Governs how research work is delegated to subagents with evidence contracts.

## Purpose

- Delegate evidence collection to subagents with explicit source requirements
- Validate and grade sources by authority, freshness, and corroboration
- Coordinate multi-source synthesis across parallel research threads
- Manage research thread lifecycle with compressed carry-forward
- Integrate with `hivemind-research-framework` methodology

## Use This For

- Evidence collection delegated to subagents
- Multi-source research requiring parallel threads
- Source validation and grading
- Research synthesis across multiple sub-questions
- Research thread lifecycle management

## Do Not Use This For

- Code scanning — use `hivemind-codemap`
- Debug evidence collection — use `course-correction-delegation`
- Single-source quick lookup — inline execution is sufficient
- TDD work — use `tdd-delegation`

## Prerequisites

- `use-hivemind-delegation` MUST be loaded first — this skill extends it with research fields
- `hivemind-research-framework` recommended — provides research methodology; this skill provides delegation mechanics

## Sibling Skills

| Skill                               | Relationship                                                         |
| ----------------------------------- | -------------------------------------------------------------------- |
| `use-hivemind-delegation`         | Base delegation protocol — this skill extends it                    |
| `hivemind-gatekeeping-delegation` | Loop governance — used for multi-pass research loops                |
| `hivemind-research-framework`     | Research methodology — this skill delegates work using its patterns |
| `hivemind-research-tools`         | MCP tool protocols — children may use these for evidence collection |
| `spec-distillation`               | Spec synthesis — research findings feed into distillation           |

## Evidence Collection Delegation

Each sub-question gets its own delegation packet.

### Collection Rules

1. Decompose the research question into sub-questions before delegating
2. Each sub-question is a separate packet — one question per child
3. Child returns evidence items with: source, confidence, grading
4. Contradictions are flagged, not resolved — the synthesizer resolves them
5. Child must cite sources — uncited evidence is `unverified`

### Evidence Item Format

```json
{
  "claim": "The SDK provides tool.schema as a Zod re-export",
  "source": "src/plugin/opencode-plugin.ts:42",
  "source_type": "code",
  "confidence": "high",
  "freshness": "current",
  "corroborated": true,
  "contradictions": []
}
```

## Source Validation and Grading

### Authority Hierarchy

| Level | Source Type                 | Trust                          |
| ----- | --------------------------- | ------------------------------ |
| 1     | Official docs / SDK source  | Highest — authoritative       |
| 2     | Project source code         | High — behavioral truth       |
| 3     | Blog posts / tutorials      | Medium — may be outdated      |
| 4     | Forum answers / discussions | Low — verify before citing    |
| 5     | Uncited claims              | None — mark as `unverified` |

### Freshness Grading

| Grade       | Definition                                       |
| ----------- | ------------------------------------------------ |
| `current` | Within last 6 months or matches current codebase |
| `recent`  | 6-12 months old — may need verification         |
| `stale`   | >12 months old — treat with skepticism          |
| `unknown` | No date available — mark as unverified          |

### Corroboration Rules

- Multi-source confirmation → `corroborated: true`
- Single source → `corroborated: false` — acceptable but noted
- Contradictions between sources → flag both, do not resolve — synthesizer decides

## Multi-Source Synthesis Coordination

### Decomposition

1. Break the research question into sub-questions
2. Identify which sub-questions can run in parallel (no shared dependencies)
3. Assign source strategy per sub-question (code-first, docs-first, web-first)
4. Delegate each sub-question as a separate packet

### Synthesis Rules

1. Collect all evidence items from all threads
2. Group by claim — identify corroborated vs single-source vs contradictory
3. Per-source attribution — every claim traces to its source
4. Confidence score per synthesized finding
5. Contradictions listed with both sides — synthesizer does not pick winners without evidence

## Research Thread Management

### Thread Structure

```json
{
  "thread_id": "research_sdk_hooks",
  "question": "What hooks does the OpenCode SDK provide?",
  "sub_questions": [
    "What event hooks exist?",
    "What chat hooks exist?",
    "What permission hooks exist?"
  ],
  "evidence_count": 12,
  "synthesis_status": "partial",
  "open_packet_ids": ["deleg_1711072800_events"]
}
```

### Thread Lifecycle

1. **Open** — thread created, sub-questions defined
2. **Collecting** — packets dispatched, evidence incoming
3. **Synthesizing** — all evidence collected, synthesis in progress
4. **Complete** — synthesis done, findings documented
5. **Blocked** — missing evidence, cannot synthesize

### Checkpoint Compression

Research checkpoints carry forward only:

- Sub-question status (answered/partial/blocked)
- Top 3 findings per answered sub-question
- Open contradictions requiring resolution
- Missing evidence gaps

See `references/research-thread-management.md` for lifecycle details.

## Integration with hivemind-research-framework

- `hivemind-research-framework` provides: research types, classification matrix, evidence contracts, confidence scoring
- This skill provides: delegation mechanics, packet design, thread management, parallel coordination
- The framework is methodology; this skill is the delegation harness
- Children reference the framework for evidence grading rules; the orchestrator uses this skill for dispatch

## Anti-Patterns

| Anti-Pattern                            | Why Dangerous                                         |
| --------------------------------------- | ----------------------------------------------------- |
| Delegating without sub-questions        | Child returns unfocused results — hard to synthesize |
| Resolving contradictions in child       | Child lacks full context — synthesizer must decide   |
| Carrying full evidence in checkpoint    | Context bloat — use compressed thread state          |
| Single-threading parallel-safe research | Wastes time — sub-questions are often independent    |
| Accepting uncited evidence              | No verification path — claim is untrusted            |

## Bundled Resources

| Resource                                     | Purpose                                      |
| -------------------------------------------- | -------------------------------------------- |
| `references/evidence-collection.md`        | Evidence collection delegation patterns      |
| `references/source-validation.md`          | Source grading rules and authority hierarchy |
| `references/research-thread-management.md` | Thread lifecycle management                  |
| `templates/research-delegation-packet.md`  | Research packet JSON template                |
| `templates/evidence-table.md`              | Evidence tracking template                   |
| `tests/research-delegation.md`             | Research delegation scenario with validation |

## Independence Rules

- This package extends `use-hivemind-delegation` — it does not replace it
- It may be selected directly or composed with `hivemind-gatekeeping-delegation` for loop control
- Research artifacts are stored in `{project}/.hivemind/activity/delegation/` at runtime
