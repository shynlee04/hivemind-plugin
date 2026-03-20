---
name: spec-distillation
description: Distill noisy, contradictory, or incomplete requirements into
  structured specs. Use when user requirements are noisy or contradictory, when
  entry-resolution classifies intent as needing spec work, or when multiple
  stakeholder inputs need reconciliation. Provides ambiguity mapping,
  clarification loops, and spec candidate generation. Lineage-agnostic — works
  for both framework and product domains.
---

# Spec Distillation

**Core principle:** Messy inputs → structured specs. Noise → signal. Ambiguity → decisions.

## When to Use

- Requirements are noisy, contradictory, or incomplete
- Entry-resolution routes here after classifying complex intent
- Multiple stakeholder perspectives need reconciliation
- Transition from vague idea to actionable plan

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

## Anti-Patterns

| Pattern | Problem |
|---------|---------|
| Skipping ambiguity map | Hidden ambiguity surfaces mid-implementation |
| Free-text-first clarification | User gives vague answers — use MCQ |
| Single spec candidate | No tradeoff comparison — decision quality drops |
| No classification buckets | Requirements dump — unstructured, unmaintainable |
| Ignoring contradiction | Contradictory requirements create impossible specs |
