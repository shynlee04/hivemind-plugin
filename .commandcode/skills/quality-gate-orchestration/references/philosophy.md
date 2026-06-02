# Philosophy: Why the Triad Order and Evidence Hierarchy Matter

## Core Question

> Why must gates run in the order **lifecycle → spec → evidence**, and why can't we just run them in parallel or in any order?

This document answers that question and explains the design principles behind quality gate orchestration.

---

## Part 1: Why Triad Order Is Fixed

### The Dependency Chain

Each gate validates a precondition that the next gate assumes:

```
Gate 1 (Lifecycle)     →  Gate 2 (Spec)        →  Gate 3 (Evidence)
"Is it in the          →  "Does it meet         →  "Can we prove
 right place?"            the spec?"               it works?"
```

Gate 2 assumes the code is structurally sound. Checking spec compliance on code that violates architecture boundaries is wasted effort — the code will need to be restructured anyway.

Gate 3 assumes the spec is correct. Checking runtime evidence against a wrong spec produces false confidence — tests passing on misaligned requirements.

### Concrete Example: A Feature in the Wrong Module

**Scenario:** A new tool is implemented in `src/hooks/` instead of `src/tools/`.

| Order | Gate 1 (Lifecycle) | Gate 2 (Spec) | Gate 3 (Evidence) | Outcome |
|-------|:---:|:---:|:---:|---------|
| **Correct order** | FAIL: wrong location | (skipped) | (skipped) | Immediate feedback. Fix location. |
| **Wrong order (evidence first)** | (not yet run) | (not yet run) | PASS: tests pass | False confidence. Tests pass on code that will be moved. |
| **Parallel** | FAIL: wrong location | PASS: spec is complete | PASS: tests pass | Confusion. Two checkmarks, one failure. Which matters? |

Running evidence first produces the most dangerous outcome: a green checkmark on code that needs structural change. The developer sees "tests pass" and assumes correctness, missing the architecture violation.

### The HALT Rule Is a Safety Mechanism

A gate failure HALTS the pipeline because downstream gates would produce misleading results:

- **Gate 1 FAILS** → Gate 2 results are invalid (wrong baseline)
- **Gate 2 FAILS** → Gate 3 results are invalid (wrong requirements)
- **Gate 3 FAILS** → Work is not ready, regardless of structure and spec

HALT prevents the chain of false confidence that leads to deploying structurally broken or unverified code.

---

## Part 2: Why Evidence Hierarchy Exists

### The Problem: All Evidence Is Not Equal

Without a hierarchy, any claim of "it works" becomes acceptable gate evidence. This creates three failure modes:

1. **Documentation Theater**: A spec document claims "feature X is complete" with no runtime proof. The gate passes on words, not facts.
2. **Mock Overconfidence**: Unit tests with fully mocked dependencies pass. The gate reports "tested and verified" — but nothing hit a real boundary.
3. **Outdated Evidence**: A continuity record from last week claims success. Since then, the code changed. The gate trusts stale data.

### The Solution: Classify Every Claim

The L1-L5 hierarchy forces honest classification of every evidence claim:

| Level | Source | What It Actually Proves | What It Cannot Prove |
|-------|--------|------------------------|---------------------|
| **L1** | Live runtime session | "This worked in production right now" | Nothing — this is the gold standard |
| **L2** | Continuity/execution record | "This worked in a real session recently" | That it still works after code changes |
| **L3** | Integration test (real boundaries) | "This works with real dependencies" | That it works in production conditions |
| **L4** | Unit test (mocked) | "The logic is correct in isolation" | That real dependencies behave as mocked |
| **L5** | Documentation | "Someone documented this" | Anything about runtime behavior |

### The L5 Trap

L5 evidence (documentation) is the most common source of false gate passes. A well-written spec creates the illusion of completeness. A detailed design doc suggests implementation readiness. Neither provides any runtime proof.

**The rule: L5 alone never passes Gate 3.** Documentation describes intent. Evidence proves reality. Conflating them is the root cause of most deployment failures.

### Why Gate Types Need Different Minimums

Not all gates need L1 evidence. The minimum matches the risk:

| Gate Context | Risk of Insufficient Evidence | Minimum | Why |
|-------------|------------------------------|---------|-----|
| PR review | Medium — issues caught in review | L3 | Integration test proves real behavior |
| Phase completion | High — unverified phase blocks next work | L2 | Continuity record proves actual execution |
| Merge | Medium — merge can be reverted | L2 | Execution record is sufficient |
| Milestone | High — milestone gates downstream releases | L2 + L1 | Need recent runtime proof |
| Release/Deployment | Critical — production impact | L1 | Must observe in real environment |

Requiring L1 for every PR would create unnecessary friction. Allowing L5 for deployment would create unacceptable risk. The graduated minimum matches evidence requirements to stakes.

---

## Part 3: Design Principles

### Principle 1: Gates Are Contracts, Not Suggestions

A gate that issues warnings but passes is not a gate — it is a linter. Gates enforce binary contracts: the code meets the standard, or it does not. Warnings belong in code review, not in gate verdicts.

**Why this matters**: Binary gates force decisions. "Almost" is not "yes." When every gate can be overridden with a warning, the gate system loses credibility.

### Principle 2: Order Encodes Dependencies

The fixed triad order is not arbitrary convention. It encodes real dependencies: spec compliance depends on structural correctness, and evidence depends on spec correctness. Changing the order would break these dependency chains.

**Why this matters**: When developers understand the dependency chain, they stop arguing about order. "Why can't we run evidence first?" Because evidence checked against the wrong spec is noise.

### Principle 3: Evidence Level Is a Claim, Not a Fact

Every evidence classification (L1-L5) is a claim made by the party presenting evidence. Claims can be wrong — a test described as "integration" may actually mock dependencies. Gate 3's job is to verify claims, not accept them.

**Why this matters**: Self-reported evidence levels create moral hazard. The person implementing the feature also classifies its evidence. Gate orchestration must include mock detection and classification verification.

### Principle 4: Gate Shopping Destroys Gate Integrity

Gate shopping — re-running only the passing gates to get a clean verdict — is the fastest way to destroy trust in the gate system. It transforms gates from quality enforcement to a checkbox ritual.

**Why this matters**: Gate shopping is tempting under time pressure. The orchestrator must detect and reject it every time, or the gate system becomes performative.

### Principle 5: Remediation Is Part of the Gate Contract

A gate that fails without providing a remediation path is a dead end. Every FAIL verdict must include:
- What failed (specific failure mode)
- Why it matters (impact on downstream quality)
- How to fix it (actionable remediation steps)

**Why this matters**: Gates that block without guiding create frustration and gate avoidance. A gate that says "fix X by doing Y, then re-run" is a helpful checkpoint. A gate that says "FAIL" with no path forward is an obstacle.

---

## Part 4: Anti-Philosophies (What Gate Orchestration Is NOT)

### NOT: A Replacement for Human Judgment

Gates enforce known contracts. They cannot evaluate novelty, taste, or strategic trade-offs. Use gates for structural, spec, and evidence verification. Use human judgment for design decisions, UX quality, and architectural trade-offs.

### NOT: A Guarantee of Correctness

Passing all three gates does not mean the code is correct. It means the code is structurally sound, spec-aligned, and evidenced. Bugs can still exist. Gates prevent known failure modes, not unknown ones.

### NOT: A Performance Metric

Gate pass rates are not team performance metrics. High pass rates may indicate gate shopping. Low pass rates may indicate overly strict gates. Gate results measure quality, not people.

### NOT: A Coordination Mechanism

Gate orchestration sequences checks. It does not dispatch subagents, manage parallel work, or coordinate team efforts. Those are separate concerns handled by coordination patterns.

---

## Summary

1. **Fixed order (lifecycle → spec → evidence) is non-negotiable** because gates depend on each other's outputs.
2. **HALT on FAIL** prevents false confidence from downstream gates on invalid baselines.
3. **Evidence hierarchy (L1-L5)** forces honest classification of proof — documentation is not runtime evidence.
4. **Gate types have different minimum evidence levels** matching risk to requirements.
5. **Gates are contracts, not suggestions** — binary PASS/FAIL forces real decisions.
6. **Remediation is mandatory** — every FAIL includes a fix path.
