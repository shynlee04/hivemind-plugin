---
name: "spec-distillation"
description: "Use when requirements are noisy, contradictory, or incomplete, when multiple stakeholder inputs need reconciliation, or when a vague request must be distilled into a structured spec candidate before planning or execution."
---

# Spec Distillation

**Core principle:** Messy inputs → structured specs. Noise → signal. Ambiguity → decisions.

## When to Use

- Requirements are noisy, contradictory, or incomplete
- Multiple stakeholder perspectives need reconciliation
- Transition from vague idea to actionable plan
- Direct invocation is valid when no sibling router or upstream triage package is available

Do NOT use for simple, clear, single-task requests. Those go directly to execution.

## Workflow

```
Raw Input
    │
    ├── 1. Extract Requirement Atoms ──────────────────────┐
    │      Break input into smallest discrete requirements  │
    │      Classify each: functional | non-functional |     │
    │      integration | risk/compliance | operations       │
    │                                                       │
    ├── 2. Build Ambiguity Map ────────────────────────────┐
    │      For each atom, assess:                           │
    │      ├── Clear?       → add to spec draft             │
    │      ├── Ambiguous?   → add to unresolved queue       │
    │      └── Contradictory? → add to conflict register    │
    │                                                       │
    ├── 3. Clarification Loop ─────────────────────────────┐
    │      Rules:                                           │
    │      ├── MCQ-first (multiple choice before free text) │
    │      ├── One question at a time                       │
    │      ├── Block on HIGH-IMPACT ambiguity               │
    │      ├── Retry up to 10 rounds with progressive hints │
    │      └── Examples for every major decision            │
    │                                                       │
    ├── 4. Generate Spec Candidates ───────────────────────┐
    │      Produce 2-3 candidates with tradeoffs            │
    │      Each candidate must cover all 5 buckets          │
    │                                                       │
    └── 5. Recommend ──────────────────────────────────────┘
           Select one candidate with rationale
           Document tradeoffs of rejected alternatives
```

## Requirement Classification Buckets

| Bucket | What Goes Here | Examples |
|--------|---------------|----------|
| **Functional** | What the system DOES | Features, behaviours, user stories |
| **Non-functional** | How well the system performs | Performance, scalability, security |
| **Integration** | How it connects to other systems | APIs, data contracts, dependencies |
| **Risk/Compliance** | What could go wrong | Regulatory, security, audit requirements |
| **Operations** | How it's deployed and maintained | Deployment, monitoring, incident response |

## Clarification Policy

| Rule | Rationale |
|------|-----------|
| MCQ-first, then free text | Reduces cognitive load, speeds resolution |
| One question at a time | Progressive disclosure — don't overwhelm |
| Block on high-impact ambiguity | Better to clarify now than refactor later |
| 10-round retry limit | Prevents infinite clarification loops |
| Examples for every decision | Vibecoders need concrete examples, not abstractions |

## Bundled Resources

| Resource | Content |
|----------|---------|
| [ambiguity-taxonomy.md](references/ambiguity-taxonomy.md) | 4-category taxonomy: scope, delivery, technical, governance |
| [spec-candidate.md](templates/spec-candidate.md) | Fill-in spec candidate template |
| `scripts/extract-requirements.sh` | Optional local helper that buckets raw notes into rough requirement groups before manual distillation |
| [direct-invocation.md](tests/direct-invocation.md) | Standalone validation scenario proving the package works without sibling routers |

## Independence Rules

- This package can be invoked directly; it does not require a sibling routing skill.
- Local references, templates, and helper scripts support the workflow, but none are required to understand the activation contract.
- If upstream triage exists, it may choose this skill, but the skill must remain usable without that upstream layer.

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| Skipping ambiguity map | Hidden ambiguity surfaces mid-implementation |
| Free-text-first clarification | User gives vague answers — use MCQ |
| Single spec candidate | No tradeoff comparison — decision quality drops |
| No classification buckets | Requirements dump — unstructured, unmaintainable |
| Ignoring contradiction | Contradictory requirements create impossible specs |

## Step-by-Step Protocol

1. **EXTRACT** — Break input into requirement atoms
2. **CLASSIFY** — Assign each atom to a bucket (functional/non-functional/integration/risk/operations)
3. **MAP** — Build ambiguity map, identify clear vs ambiguous vs contradictory
4. **CLARIFY** — Use MCQ-first loop for high-impact ambiguity (max 10 rounds)
5. **GENERATE** — Produce 2-3 spec candidates with tradeoffs
6. **RECOMMEND** — Select candidate with rationale, document rejected alternatives

## Terminal State

- **If spec complete**: Proceed to execution planning
- **If ambiguity unresolved**: BLOCK, continue clarification loop
- **If contradiction detected**: Document both sides, escalate to user
