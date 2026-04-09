# Stage 4: Validation & Synthesis

Deep dive on evidence validation, citation tracking, and synthesis report writing. This stage produces the final deliverable.

---

## Evidence Scoring Rubric

### Level Definitions

| Level | Definition | Requirements | Weight |
|-------|-----------|-------------|--------|
| **Direct** | Code, docs, or official source directly proves the claim | Primary source (source code, official docs, API response) | Highest — stands alone for a claim |
| **Correlational** | Timing, patterns, or multiple secondary sources suggest the claim | 2+ independent secondary sources | Medium — needs 2+ sources to be credible |
| **Testimonial** | Someone said it works, blog post, forum answer | Single secondary source | Low — must be marked "unverified" |
| **Absence** | No evidence found after searching | 3+ search attempts, all negative | Lowest — does NOT disprove, only documents lack of evidence |

### Scoring Rules

1. **Key claims** (central to answering the research question): require Direct evidence OR 2+ Correlational sources. Testimonial-only key claims MUST be marked `unverified`.
2. **Supporting claims** (contextual, not central): Testimonial is acceptable but must cite the source.
3. **Negative claims** ("X does NOT support Y"): require Absence evidence (3+ failed searches) or Direct counter-evidence (docs explicitly say "not supported").
4. **Comparative claims** ("X is faster than Y"): require Direct benchmark evidence or 3+ Correlational sources. Never make comparative claims on Testimonial evidence alone.

---

## Citation Format

Every claim in the synthesis report MUST include a citation block:

```markdown
**Claim**: [statement]
**Evidence**: [Direct|Correlational|Testimonial|Absence]
**Source**: [URL or file path]
**Confidence**: [High|Medium|Low]
```

### Citation Examples

**Direct evidence:**
```markdown
**Claim**: Prisma's `@composite` directive maps PostgreSQL composite types to TypeScript interfaces
**Evidence**: Direct
**Source**: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#composite
**Confidence**: High
```

**Correlational evidence:**
```markdown
**Claim**: Drizzle ORM provides better type inference for complex queries than Prisma
**Evidence**: Correlational (2 sources)
**Source 1**: https://twitter.com/drizzleorm/status/123 (benchmark comparison)
**Source 2**: https://github.com/drizzle-team/drizzle-orm/issues/456 (community discussion)
**Confidence**: Medium
```

**Testimonial evidence:**
```markdown
**Claim**: Kysely's migration system is more flexible than Prisma's
**Evidence**: Testimonial
**Source**: https://reddit.com/r/typescript/comments/abc (user comparison)
**Confidence**: Low (unverified)
```

**Absence evidence:**
```markdown
**Claim**: No Rust WebSocket library supports native message batching
**Evidence**: Absence (3 searches: tavily-search "rust websocket batching", Context7 tokio-tungstenite, codesearch "websocket batch rust")
**Source**: N/A — absence of evidence
**Confidence**: Low (does not disprove existence, only documents search failure)
```

---

## Contradiction Resolution Protocol

When two findings contradict each other:

### Step 1: Identify the Contradiction

```markdown
## Contradiction: [topic]

Finding A (source: [url/path]): [claim A]
Finding B (source: [url/path]): [claim B — contradicts A]
```

### Step 2: Evaluate Evidence Quality

| Scenario | Resolution |
|----------|-----------|
| Both Direct | Prefer the more recent source. If dates unknown, prefer official docs over community. |
| Direct vs Correlational | Direct wins. |
| Direct vs Testimonial | Direct wins. |
| Both Correlational | Need a tiebreaker. Search for a third source. |
| Both Testimonial | Flag as "Unresolved — conflicting testimonials." Do not assert either. |
| Any vs Absence | The non-Absence evidence wins. Absence never overrides positive evidence. |

### Step 3: Document the Resolution

```markdown
## Contradiction Resolved: [topic]

Finding A: [claim A] (Direct, source: [url])
Finding B: [claim B] (Correlational, source: [url])
Resolution: Finding A wins — Direct evidence overrides Correlational.
Reason: [one sentence explaining why]
```

### Step 4: If Unresolvable

```markdown
## Contradiction Unresolved: [topic]

Finding A: [claim A] (Correlational, source: [url])
Finding B: [claim B] (Correlational, source: [url])
Status: Unresolved — insufficient evidence to favor either claim.
Action needed: [specific follow-up to resolve — e.g., "test both claims against current version"]
```

---

## Gap Documentation

Every gap in the research must be documented with a reason:

| Gap Reason | Template | Example |
|-----------|----------|---------|
| **Budget exhausted** | "Gap: [question]. Reason: Context budget reached [X%] before investigation." | "Gap: Drizzle's performance on composite joins. Reason: Budget at 85% after library comparison." |
| **Tool limit reached** | "Gap: [question]. Reason: Context7 query limit (3/question) reached." | "Gap: Prisma v6 breaking changes. Reason: Context7 queries exhausted on v5 docs." |
| **Source unavailable** | "Gap: [question]. Reason: [URL] returned 403/404/paywall." | "Gap: Enterprise benchmark data. Reason: Behind paywall at benchmarksgame.alioth.debian.org." |
| **Time-sensitive** | "Gap: [question]. Reason: Information may have changed since [date]." | "Gap: Next.js 15 support status. Reason: In beta, API may change before release." |
| **Out of scope** | "Gap: [question]. Reason: Outside defined research scope (see plan)." | "Gap: Python ORM comparison. Reason: Research scoped to TypeScript ORMs only." |

---

## Synthesis Report Writing Guide

Use `references/synthesis-report-template.md` as the starting structure.

### Section-by-Section Guide

#### 1. Executive Summary (3-5 sentences)

Answer the research question directly. No hedging in the first sentence.

```markdown
Drizzle ORM provides the best TypeScript type inference for PostgreSQL composite types
among the three ORMs evaluated. Prisma lacks native composite type support. Kysely provides
raw SQL type mapping but requires manual type definitions. Drizzle's column-based schema
definition generates precise types automatically.
```

#### 2. Key Findings (numbered, each with evidence)

Each finding is a self-contained unit:

```markdown
### Finding 1: [Title]

[2-3 sentence description]

**Claim**: [specific claim]
**Evidence**: [Direct|Correlational|Testimonial|Absence]
**Source**: [url or path]
**Confidence**: [High|Medium|Low]
**Implication**: [what this means for the user/project]
```

#### 3. Contradictions & Resolutions

List all contradictions found and their resolution status. Use the resolution protocol format from above.

#### 4. Gaps

List all gaps with reasons. Use the gap documentation format from above.

#### 5. Recommendations

Actionable next steps. Each recommendation must trace back to a finding:

```markdown
### Recommendation 1: [Action]
Based on: Finding 1, Finding 3
Reasoning: [why this is the recommended action]
Risk: [what could go wrong]
```

#### 6. Source Index

Alphabetical list of all sources consulted:

```markdown
| Source | Type | Used In |
|--------|------|---------|
| https://www.prisma.io/docs/... | Official docs | Finding 1, Finding 3 |
| https://github.com/drizzle-team/... | Source code | Finding 2 |
| Context7 /drizzle-team/drizzle-orm | Library docs | Finding 2, Finding 4 |
| src/lib/types.ts:45-89 | Local codebase | Finding 5 |
```

---

## Quality Gate Checklist

Run this checklist before delivering the synthesis report:

- [ ] Every claim has a citation block (Claim, Evidence, Source, Confidence)
- [ ] Key claims have Direct evidence or 2+ Correlational sources
- [ ] Testimonial-only claims are marked "unverified"
- [ ] All contradictions resolved or documented as "Unresolved"
- [ ] All gaps documented with specific reasons (not "ran out of time")
- [ ] Every finding has an "Implication" statement
- [ ] Every recommendation traces back to specific findings
- [ ] Source index is complete and alphabetical
- [ ] Executive summary directly answers the research question
- [ ] No orphaned claims (claim without finding) or orphaned findings (finding not in synthesis)
- [ ] Report is actionable: reader knows exactly what to do next
- [ ] synthesis-report.md written to disk

**FINAL**: Deliver `synthesis-report.md` to the user.
