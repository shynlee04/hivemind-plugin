# Brainstorming & Shaping

Research produces findings. Findings become features. This reference covers the pipeline from raw research output to shaped feature proposals.

---

## The Pipeline

```
RESEARCH ──────> SYNTHESIZE ──────> BRAINSTORM ──────> SHAPE ──────> VALIDATE
  findings         patterns          ideas           proposals     evidence
  (raw)          (clustered)      (divergent)     (convergent)    (grounded)
```

Each stage has a specific mindset and output. Never skip stages. Never blend stages.

| Stage | Mindset | Input | Output | Rule |
|-------|---------|-------|--------|------|
| **Research** | "What's out there?" | Questions | Findings | Answer the question, nothing more |
| **Synthesize** | "What patterns emerge?" | Findings | Clusters, themes | Group, don't judge |
| **Brainstorm** | "What could we build?" | Patterns + constraints | Feature ideas | Diverge, don't filter |
| **Shape** | "What's the smallest useful version?" | Feature ideas | Proposals | Converge, don't expand |
| **Validate** | "Does the evidence support this?" | Proposals | Validated proposals | Every claim needs a source |

---

## Stage 1: Synthesize — Finding the Patterns

Research produces a pile of findings. Before brainstorming, cluster them.

### How to Cluster

```
1. List every finding as a single sentence
2. Group findings that relate to the same theme
3. Name each group with a noun phrase ("Migration complexity", "Type safety story")
4. Identify the 2-3 strongest findings per group
5. Discard groups with < 2 findings (move to "deferred" list)
```

### Synthesis Example

Raw findings from an ORM investigation:

| # | Finding | Source |
|---|---------|--------|
| F1 | Prisma generates a client from schema | Context7 |
| F2 | Drizzle infers types from SQL-like definitions | Context7 |
| F3 | Prisma migrations are declarative, hard to customize | GitHub issues |
| F4 | Drizzle migrations are SQL-first, full control | DeepWiki |
| F5 | Prisma cold start is 200-400ms due to query engine | Benchmarks |
| F6 | Drizzle cold start is < 10ms, no engine | Benchmarks |
| F7 | Both support PostgreSQL, MySQL, SQLite | Official docs |
| F8 | Prisma has 25k GitHub stars, Drizzle has 15k | GitHub |

Clustered:

| Group | Findings | Strongest Signal |
|-------|----------|-----------------|
| Type strategy | F1, F2 | Schema-first vs SQL-first |
| Migration model | F3, F4 | Declarative vs SQL-first |
| Performance | F5, F6 | Cold start gap is 20-40x |
| Ecosystem | F7, F8 | Both cover main databases, Prisma has larger community |

**Deferred**: Nothing deferred — all findings cluster.

---

## Stage 2: Brainstorm — Diverge From Evidence

Every feature idea must trace back to at least one research finding. This is the critical rule.

### The Brainstorming Protocol

```
1. Start with a synthesis group
2. Ask: "What user pain does this finding address?"
3. Write the idea as a user story: "A user can [do X] so that [benefit Y]"
4. Tag the idea with the finding(s) that support it
5. Move to the next group
6. Repeat until all groups have at least one idea
```

### Brainstorming Example (from ORM research)

| Idea | User Story | Supported By | Confidence |
|------|-----------|-------------|-----------|
| A: SQL-first ORM setup | "A developer can write SQL-like queries with full type safety so that they catch errors at compile time" | F2, F4 | High |
| B: Custom migration pipeline | "A developer can write custom SQL migrations so that they handle complex schema changes" | F3, F4 | High |
| C: Fast cold-start queries | "A developer can run queries in serverless environments without cold-start penalty" | F5, F6 | High |
| D: ORM swap layer | "A developer can abstract the ORM behind an interface so that they can swap ORMs later" | F1, F2, F7 | Medium |

### Validity Check

For each idea, verify the trace:

```
Idea A → F2 (Drizzle types) + F4 (SQL-first migrations)
  → Can we build this? Yes, it IS the product of using Drizzle.
  → Evidence is direct? Yes, from official docs + source code.

Idea D → F1 + F2 + F7 (both ORMs cover same databases)
  → Can we build this? Yes, abstraction layer.
  → Evidence is direct? No — inferred from compatibility, not tested.
  → Downgrade confidence to Medium. Flag for validation.
```

---

## Stage 3: Shape — Converge to the Smallest Useful Version

Brainstorming produces ideas. Shaping produces proposals. The shaping question is always: "What is the smallest version that delivers value?"

### The Shaping Template

For each idea worth pursuing, fill in:

| Element | Question | Must Reference |
|---------|----------|---------------|
| **Problem** | What user pain exists? | Specific finding |
| **Approach** | What solution does evidence support? | Best-evaluated option |
| **Scope** | What is the minimum viable version? | Constraint from research |
| **Risks** | What could go wrong? | Edge case finding |
| **Validation** | How do we know it worked? | Measurable criterion |
| **Not doing** | What are we explicitly excluding? | Out-of-scope findings |

### Shaping Example

Take Idea A (SQL-first ORM setup) and shape it:

| Element | Content |
|---------|---------|
| **Problem** | Developers need compile-time type safety for database queries without runtime query engine overhead (F5, F6) |
| **Approach** | Adopt Drizzle as ORM. Use SQL-like query definitions with TypeScript inference (F2) |
| **Scope** | Phase 1: Core schema + 5 most common queries. Migration pipeline for development only |
| **Risks** | Drizzle is less mature than Prisma (F8). Migration tooling has fewer examples (F3 vs F4) |
| **Validation** | All 5 queries compile with full type inference. Cold start < 50ms in serverless test |
| **Not doing** | Multi-database support (F7 shows both support it, but we only need PostgreSQL). ORM abstraction layer (Idea D — deferred) |

---

## Stage 4: Validate — Evidence Gates

Every shaped proposal passes through an evidence gate before it becomes a recommendation.

### Evidence Levels

| Level | Definition | Required For |
|-------|-----------|-------------|
| **DIRECT** | Source code or official docs prove it | Core claims |
| **CORROBORATED** | 2+ independent sources agree | Supporting claims |
| **TESTIMONIAL** | One source says so | Low-stakes claims (mark "unverified") |
| **INFERRED** | Logical deduction from other evidence | Hypotheses (mark "not directly verified") |
| **ABSENCE** | No evidence found | Gaps (mark "no evidence, needs prototype") |

### Validation Protocol

```
1. List every claim in the proposal
2. Tag each claim with its evidence level
3. Check:
   - Every "Problem" claim → CORROBORATED or better
   - Every "Approach" claim → DIRECT or better
   - Every "Risk" claim → TESTIMONIAL or better
   - Every "Validation" criterion → must be measurable
4. If any claim fails its gate:
   - Downgrade the proposal confidence
   - Add a "validation spike" task to the proposal
   - Never remove the claim — flag it instead
```

### Validation Example

| Claim | Evidence | Level | Gate |
|-------|----------|-------|------|
| "Drizzle provides full type inference" | F2 (Context7), verified against source | DIRECT | Pass |
| "Cold start < 50ms in serverless" | F6 (benchmarks), not tested in our stack | CORROBORATED | Pass (add spike) |
| "Drizzle is less mature than Prisma" | F8 (GitHub stars), community reports | CORROBORATED | Pass |
| "Migration tooling handles our schema" | F4 (DeepWiki), not tested with our schema | TESTIMONIAL | Needs spike |

**Result**: Proposal passes validation with 2 required spikes (cold start test, migration test).

---

## Anti-Patterns

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| **Feature creep** | Adding capabilities beyond what findings support | Every feature must trace to ≥ 1 finding |
| **Analysis paralysis** | Requiring 100% confidence before proposing anything | Set a time box. Ship at deadline. Document gaps. |
| **Premature optimization** | Designing for scale the research doesn't justify | Only optimize for evidence-backed constraints |
| **Solution shopping** | Researching until you find confirmation of a pre-chosen answer | Require 2+ alternatives. Compare honestly. |
| **Imagination-driven ideas** | Feature ideas with no finding to support them | Kill the idea or find evidence first |
| **Scope inflation during shaping** | "Smallest useful version" keeps growing | Write scope explicitly. Review after each addition. |
| **Confidence laundering** | Treating INFERRED evidence as DIRECT | Always tag evidence level. Never upgrade without new source. |

---

## Quick Reference: The Complete Pipeline

```
1. RESEARCH → Gather findings
   Output: Numbered findings with sources

2. SYNTHESIZE → Cluster into themes
   Output: 3-5 groups, each with strongest findings

3. BRAINSTORM → Generate ideas from evidence
   Output: Feature ideas, each tagged with supporting findings
   Gate: Every idea traces to ≥ 1 finding

4. SHAPE → Define smallest useful version
   Output: Proposal with Problem/Approach/Scope/Risks/Validation/Not-doing
   Gate: Scope is the minimum, not the wish list

5. VALIDATE → Check evidence quality
   Output: Validated proposal with evidence levels
   Gate: Core claims have DIRECT evidence. Gaps are flagged.
```
