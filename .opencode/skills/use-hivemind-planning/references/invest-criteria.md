# INVEST Criteria

Validate each decomposed slice against INVEST before delegation. Slices that fail should be split or refined. A passing slice scores ≥3 on every criterion.

## The Six Criteria

### I — Independent

| Attribute | Value |
|-----------|-------|
| **Definition** | Minimal dependencies on other stories; can be developed and tested in isolation |
| **Pass threshold** | Score ≥3 |

**Scoring Rubric:**

| Score | Meaning |
|-------|---------|
| 5 | Zero dependencies — fully self-contained |
| 4 | Shares interfaces but no blocking dependencies |
| 3 | Depends on 1 other slice, but that slice is already complete or parallel-safe |
| 2 | Depends on 2+ slices, at least one not yet started |
| 1 | Cannot begin until multiple other slices complete — tightly coupled |

**Failure signals:**
- Slice `depends_on` list has >2 entries
- Slice shares files with another unstarted slice
- Slice cannot be tested without mocking another slice's output

**Remediation:** Merge dependent slices into one, or refactor shared interfaces into a separate foundation slice.

### N — Negotiable

| Attribute | Value |
|-----------|-------|
| **Definition** | Implementation details can be discussed and adjusted; not a rigid specification |
| **Pass threshold** | Score ≥3 |

**Scoring Rubric:**

| Score | Meaning |
|-------|---------|
| 5 | Only outcome specified — implementation details left to agent |
| 4 | Approach suggested but alternatives acceptable |
| 3 | Key constraints defined but room for implementation choices |
| 2 | Detailed implementation path prescribed with little flexibility |
| 1 | Exact code changes specified — no room for agent judgment |

**Failure signals:**
- Slice `description` contains specific function names or file patterns to create
- Slice mandates a specific library or pattern without "or equivalent" qualifier
- Slice specifies implementation order within a single file

**Remediation:** Rewrite slice to describe the *what* (outcome) not the *how* (implementation). Remove prescriptive details.

### V — Valuable

| Attribute | Value |
|-----------|-------|
| **Definition** | Delivers measurable value to users, developers, or the system |
| **Pass threshold** | Score ≥3 |

**Scoring Rubric:**

| Score | Meaning |
|-------|---------|
| 5 | Directly enables a user-facing feature or unblocks critical work |
| 4 | Removes significant tech debt or improves developer velocity |
| 3 | Enables future work or improves system reliability |
| 2 | Marginal improvement — nice but not impactful |
| 1 | No clear value — why is this a slice? |

**Failure signals:**
- Slice has no `description` of user or developer benefit
- Slice exists solely to "tidy up" without a linked future slice that needs it
- Value proposition cannot be articulated in one sentence

**Remediation:** Link the slice to a concrete outcome. If none exists, drop or merge the slice.

### E — Estimable

| Attribute | Value |
|-----------|-------|
| **Definition** | The team can reasonably estimate the effort required |
| **Pass threshold** | Score ≥3 |

**Scoring Rubric:**

| Score | Meaning |
|-------|---------|
| 5 | Clear scope, known patterns, predictable effort |
| 4 | Mostly clear, minor unknowns that won't spike effort |
| 3 | Some unknowns but comparable to past work — estimate confidence is moderate |
| 2 | Significant unknowns — estimate is a guess |
| 1 | Cannot estimate — scope or approach is entirely unclear |

**Failure signals:**
- Slice touches unfamiliar codebases or APIs with no reference examples
- Slice requires investigation that hasn't been done
- Agent cannot assign a Fibonacci number with >50% confidence

**Remediation:** Add a read/feasibility slice before this one to gather context. Re-estimate after discovery.

### S — Small

| Attribute | Value |
|-----------|-------|
| **Definition** | Completable in one subagent pass (one iteration) |
| **Pass threshold** | Score ≥3 |

**Scoring Rubric:**

| Score | Meaning |
|-------|---------|
| 5 | 1–2 files, single concern, <30 min effort |
| 4 | 2–3 files, single concern, <1 hour |
| 3 | ≤5 files, single concern, fits one subagent pass |
| 2 | 5–8 files, multiple sub-concerns — may need two passes |
| 1 | >8 files, multiple concerns — definitely too large |

**Failure signals:**
- `in_scope` lists >5 files
- Slice has multiple `concern` types mixed (read + write)
- Estimated complexity is "high" or effort >13 Fibonacci points

**Remediation:** Split by authority surface → concern → file cluster (Decomposition Steps 1–4).

### T — Testable

| Attribute | Value |
|-----------|-------|
| **Definition** | Clear acceptance criteria that can be verified with evidence |
| **Pass threshold** | Score ≥3 |

**Scoring Rubric:**

| Score | Meaning |
|-------|---------|
| 5 | Binary pass/fail criteria with specific commands and expected output |
| 4 | Clear criteria, minor ambiguity in expected values |
| 3 | Acceptance criteria defined but some assertions are qualitative |
| 2 | Vague criteria — "should work" or "looks correct" |
| 1 | No acceptance criteria — impossible to verify |

**Failure signals:**
- Slice `gate` is missing or says "visual inspection"
- `evidence_required` is empty or contains only "success_message"
- Acceptance criteria use subjective language ("better", "cleaner", "more robust")

**Remediation:** Add specific gate commands (`npx tsc --noEmit`, `npm test`, `npm run build`). Replace subjective criteria with measurable ones.

## INVEST Validation Checklist

Before delegating a slice, run through this checklist:

```
[ ] Independent:  ≤1 dependency, all deps are complete or parallel-safe
[ ] Negotiable:   outcome specified, implementation details left open
[ ] Valuable:     one-sentence value proposition exists
[ ] Estimable:    Fibonacci estimate assigned with >50% confidence
[ ] Small:        ≤5 files, single concern, one subagent pass
[ ] Testable:     gate command defined, evidence_required populated
```

Any unchecked box → split or refine the slice before delegation.
