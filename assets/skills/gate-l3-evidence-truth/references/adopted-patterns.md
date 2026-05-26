# Adopted Patterns

Synthesized from three proven methodologies, adapted for Hivemind harness evidence requirements.

## Pattern 1: Anthropic Gather→Act→Verify

**Source:** Anthropic's recommended agent evaluation methodology

**Adaptation:** Used as the core evaluation workflow (STEPS 1–8 in SKILL.md).

| Phase | In Anthropic | In gate-evidence-truth |
|-------|-------------|----------------------|
| GATHER | Collect task inputs and expected outputs | Collect all evidence artifacts for the claim |
| ACT | Classify and process inputs | Classify each artifact by evidence level (L1–L5) |
| VERIFY | Determine if output meets criteria | Determine if highest evidence level meets gate minimum |

**Key adaptation:** Anthropic's pattern is task-oriented (does the agent produce correct output?). This skill adapts it to gate-oriented evaluation (does the evidence prove the implementation works?). The VERIFY phase is stricter: it doesn't just check if evidence exists, but whether the evidence level is sufficient for the gate type.

**Why this pattern:** Direct lineage from how Anthropic evaluates agent correctness. The three-phase structure maps cleanly to evidence gate evaluation.

## Pattern 2: Google Testing Pyramid (70-20-10)

**Source:** Google's recommended test distribution

**Adaptation:** Used as a target ratio for evidence quality, not a strict enforcement rule.

| Layer | Google Ratio | Hivemind Interpretation |
|-------|-------------|------------------------|
| Unit tests | 70% | L4 evidence — fast, isolated, mocks SDK boundaries |
| Integration tests | 20% | L3 evidence — hits real SDK boundaries |
| E2E/system tests | 10% | L1/L2 evidence — live runtime verification |

**Key adaptation:** Google's pyramid is about test count distribution. This skill uses it as an evidence health check: if a module has 100% L4 evidence and 0% L3+, the pyramid is inverted and evidence quality is suspect. The exact ratio is not enforced, but evidence must span at least two levels for any non-trivial gate.

**Why this pattern:** Provides a calibrated expectation for evidence distribution. Prevents the common failure mode of having thousands of unit tests but zero integration verification.

## Pattern 3: GRADE Evidence Framework

**Source:** GRADE Working Group (Grading of Recommendations, Assessment, Development, and Evaluations)

**Adaptation:** Used as the foundation for the L1–L5 evidence hierarchy.

| GRADE Level | GRADE Meaning | Hivemind Level | Hivemind Meaning |
|-------------|--------------|----------------|------------------|
| High | Randomized trials | L1 | Live OpenCode runtime session |
| Moderate | Non-randomized trials | L2 | Continuity record from live run |
| Low | Observational studies | L3 | Integration test passing |
| Very Low | Expert opinion | L4 | Unit test passing |
| — | — | L5 | Documentation/summary |

**Key adaptation:** GRADE is designed for clinical evidence. This skill adapts the hierarchy principle (higher certainty requires higher quality evidence) to software verification. The critical rule — "no gate passes on L5 alone" — mirrors GRADE's principle that expert opinion alone never justifies a strong recommendation.

**Why this pattern:** Proven hierarchical evidence framework with clear rules for upgrading and downgrading evidence quality. The L1–L5 levels map naturally to software verification artifacts.

## Synthesis: How Patterns Interact

```
Gather→Act→Verify (workflow)
    ↓ uses
GRADE hierarchy (evidence classification)
    ↓ validated against
Testing pyramid (distribution health check)
```

1. The Gather→Act→Verify workflow drives the evaluation process
2. The GRADE hierarchy classifies gathered evidence into levels
3. The testing pyramid checks whether evidence distribution is healthy

All three patterns agree on one principle: **high-stakes decisions require high-quality evidence.** The gate type determines the stakes, the hierarchy determines evidence quality, and the pyramid determines evidence health.
