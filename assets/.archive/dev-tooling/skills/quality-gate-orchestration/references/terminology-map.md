# Terminology Map: Gate Concepts Across Frameworks

## Purpose

This document maps gate concepts across three quality frameworks: GSD (developer tooling), Hivemind (harness quality triad), and general quality engineering practices. It exists to prevent confusion when terminology overlaps between frameworks.

---

## Core Concepts

### What Is a Gate?

A gate is a **quality checkpoint** that produces a binary verdict: PASS or FAIL. Gates do not make suggestions or generate warnings — they enforce contracts. A gate that always passes is not a gate; it is decoration.

### What Is Orchestration?

Gate orchestration is the **sequencing and routing** of multiple gates into a pipeline. Orchestration decides:
- Which gates run (decision matrix)
- In what order (fixed sequence)
- What happens on failure (HALT + remediation)
- How results compose (unified verdict)

Orchestration is NOT:
- Writing individual gate logic
- Dispatching subagents for parallel gate execution
- Detecting whether work is complete

---

## GSD Gate System

GSD (Get Stuff Done) uses a **three-lane quality gate** model within its phase execution workflow:

| GSD Gate | Domain | When It Runs | Verdict Impact |
|----------|--------|-------------|----------------|
| **Review** | Code correctness, bugs, security | After implementation, before verification | Blocks merge |
| **Verify** | Feature behavior, UAT criteria | After review passes | Blocks phase completion |
| **Validate** | Cross-phase integration, regression | After verify passes | Blocks milestone completion |

### GSD Gate Properties
- **Linear but independent**: Review → Verify → Validate, but each can run standalone
- **Inline**: Gate logic lives within phase workflow skills
- **Phase-scoped**: Gate results apply to a specific phase
- **No evidence hierarchy**: GSD gates check results directly, not evidence levels

### Key Distinction from Hivemind

GSD gates are **operational** — they check whether work is correct. Hivemind gates are **structural** — they check whether the system of checks is correct. A GSD review gate asks "is this code correct?" A Hivemind lifecycle gate asks "is this code in the right place?"

---

## Hivemind Quality Triad

Hivemind uses a **fixed-sequence triad** of three gates. Each gate checks a different dimension of quality, and the order is non-negotiable.

| Hivemind Gate | Position | Domain | Questions Answered |
|---------------|----------|--------|-------------------|
| **Lifecycle Integration** | Gate 1 (entry) | Architecture boundaries, CQRS, classification | "Is this built in the right place?" |
| **Spec Compliance** | Gate 2 (middle) | Requirements traceability, gap detection, acceptance criteria | "Does this meet the spec?" |
| **Evidence Truth** | Gate 3 (terminal) | Runtime proof, evidence hierarchy, mock detection | "Can we prove it works?" |

### Triad Properties
- **Fixed order**: Lifecycle → Spec → Evidence. Never reorder.
- **HALT on FAIL**: A gate failure stops the pipeline. No proceeding to next gate.
- **Cumulative**: Each gate receives the verdicts of previous gates
- **Evidence hierarchy**: L1 (live runtime) through L5 (documentation). Terminal gate requires L1-L2 minimum.
- **Structural, not operational**: Gates check the system of quality, not individual bugs

### Why the Triad Exists

The triad was synthesized from three architectural decisions:
1. **Q6 (.hivemind/ state root)**: Code must be classified correctly (lifecycle gate)
2. **Spec-driven authoring**: Requirements must be falsifiable and traceable (spec gate)
3. **Verify-before-complete**: Completion claims need runtime proof (evidence gate)

See `philosophy.md` for the full rationale.

---

## General Quality Engineering Terms

### Quality Gate (Generic)

A quality gate is any checkpoint in a delivery pipeline that enforces a PASS/FAIL condition. Common in CI/CD, code review, and release management.

| Generic Term | GSD Equivalent | Hivemind Equivalent |
|-------------|----------------|---------------------|
| Static analysis gate | Review (code correctness) | Lifecycle (structural correctness) |
| Test gate | Verify (behavior check) | Spec compliance (requirement check) |
| Deployment gate | Validate (integration check) | Evidence truth (runtime proof) |

### Evidence Hierarchy (Generic)

The L1-L5 evidence hierarchy used in Hivemind is adapted from general quality engineering principles:

| Level | Generic Name | What It Means |
|-------|-------------|---------------|
| L1 | Production/live proof | Observed in real environment |
| L2 | Execution record | Captured from actual run |
| L3 | Integration proof | Real boundaries exercised |
| L4 | Unit proof | Mocked boundaries exercised |
| L5 | Documentation claim | Described but not verified |

### Gate Shopping (Anti-Pattern)

"Gate shopping" is the practice of skipping a failed gate and re-running only the passing gates to get a clean verdict. This is an anti-pattern in all frameworks. A failed gate must be fixed, not bypassed.

---

## Framework Comparison Matrix

| Dimension | GSD | Hivemind | Generic |
|-----------|-----|----------|---------|
| Gate count | 3 (review, verify, validate) | 3 (lifecycle, spec, evidence) | Variable |
| Sequence | Linear, semi-flexible | Fixed, non-negotiable | Context-dependent |
| Failure behavior | Block phase advance | HALT pipeline | Configurable |
| Evidence model | Direct verification | L1-L5 hierarchy | Usually binary (pass/fail tests) |
| Scope | Per phase | Project-level | Per pipeline stage |
| Orchestration | Inline in workflow skills | Dedicated orchestrator skill | Usually CI/CD config |
| Primary concern | Operational quality | Structural quality | Deliverable quality |

---

## When to Use Which Mental Model

| Situation | Use This Model | Why |
|-----------|---------------|-----|
| Building a new feature | GSD model | Phase-scoped, operational checks |
| Auditing architecture compliance | Hivemind model | Structural checks, evidence hierarchy |
| Setting up CI/CD pipeline | Generic model | Pipeline-agnostic, configurable |
| Cross-phase integration check | Both GSD + Hivemind | Operational + structural |
| Pre-deployment verification | Hivemind model | Evidence hierarchy critical for release safety |
| Quick bug fix | GSD model (review only) | Minimal overhead for small changes |

---

## Common Confusions

### "Gates are the same as tests"

**No.** Tests produce evidence (L3-L4). Gates evaluate whether sufficient evidence exists to proceed. A passing test does not mean a gate passes — the gate also checks whether the right tests exist and whether the evidence level matches the claim.

### "If all gates pass, the code is bug-free"

**No.** Gates check structure, spec alignment, and evidence sufficiency. They do not guarantee correctness. Gates prevent known failure modes; they do not discover unknown bugs.

### "Gate orchestration means running gates in parallel"

**No.** Gate orchestration runs gates sequentially because each gate depends on the previous gate's verdict. Parallel gate execution creates false confidence — Gate 3 passing while Gate 1 fails means the evidence was checked against the wrong baseline.

### "Skipping a gate is fine if the code is simple"

**No.** Gate skipping is only valid when the gate's domain is genuinely irrelevant (e.g., no behavioral change → skip spec gate). "Simple" code is often where structural violations hide. Use the decision matrix, not intuition, to decide when to skip.

---

## Cross-Reference

| Related Concept | Where Defined |
|----------------|---------------|
| Gate orchestration pipeline | `../SKILL.md` |
| Triad order rationale | `philosophy.md` |
| Evidence hierarchy details | `../SKILL.md` § Evidence Hierarchy |
| Decision matrix | `../SKILL.md` § Gate Decision Matrix |
