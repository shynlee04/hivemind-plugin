---
name: "hivemind-research-framework"
description: "Research methodology for structured investigation. Use when conducting multi-source research requiring question framing, source evaluation, evidence grading, confidence scoring, and delegation patterns. Provides 6 research types, classification matrix, delegation strategies, and evidence contracts."
---

# hivemind-research-framework — Research Methodology

Refactored from `research-methodology`. Provides the intellectual framework for structured research: question framing, type classification, delegation patterns, and evidence grading.

## Use This For

- Research needs evidence grading with confidence scores
- Multiple sub-questions require decomposition
- Contradiction resolution across sources anticipated
- Subagent delegation for parallel research threads needed
- Any structured investigation beyond simple lookup

> **Cross-reference**: For MCP tool execution protocols, chaining strategies, and provider-specific setup, see `hivemind-research-tools/SKILL.md`.

## Research Types (6)

| # | Type | Signal Words | Core Question Shape | Typical Sources |
|---|---|---|---|---|
| 1 | **Tech/API** | how does, behavior, semantics, contract | "How does X behave under Y?" | Context7, Repomix, DeepWiki |
| 2 | **Pattern** | architecture, design, approach, pattern | "What pattern fits X constraint?" | Repomix, DeepWiki, Exa |
| 3 | **Comparison** | versus, alternative, better, trade-off | "Is X or Y better for Z?" | Tavily, Exa, Context7 |
| 4 | **Requirements** | need, must have, scope, what does it take | "What's needed to achieve X?" | All sources |
| 5 | **Landscape** | ecosystem, who does, options, list | "What exists in space X?" | Tavily, Exa |
| 6 | **Cross-Dependency** | depends on, breaks, couples, impacts | "Does X affect Y?" | Repomix, DeepWiki, Tavily |

## Question Framing Protocol

Transform vague topics into answerable sub-questions:

1. **Identify the knowledge gap** — what exactly is unknown?
2. **Decompose into 3-5 sub-questions** with clear scope boundaries
3. **Assign a research type** to each sub-questions using signal words
4. **Define satisfactory answers** — what evidence would satisfy each sub-question?
5. **Map to source strategy** — which providers address each sub-question?

### Classification Decision Tree

```
User request
├── Contains comparison language? ──────────→ Comparison
├── Asks "how does X work"? ───────────────→ Tech/API
├── Asks "what pattern/approach"? ─────────→ Pattern
├── Asks "what's needed/scope"? ───────────→ Requirements
├── Asks "who/what exists in X space"? ────→ Landscape
├── Asks about dependency/impact? ─────────→ Cross-Dependency
└── None of the above ─────────────────────→ Refine question first
```

## Delegation Patterns

### Sequential (dependent sub-questions)

Use when sub-question B's answer depends on sub-question A's result.

```
Agent-1: Answer sub-Q1 → hand off Q1-findings
Agent-2: Using Q1-findings, answer sub-Q2 → hand off Q2-findings
Agent-3: Using Q1+Q2-findings, synthesize final answer
```

**Independence proof**: If Q2's question text contains Q1's key entity, they are dependent.

### Parallel (independent sub-questions)

Use when sub-questions share no entities or premises.

```
Agent-1: Answer sub-Q1 (scope: library A)
Agent-2: Answer sub-Q2 (scope: library B)  ← runs simultaneously
Agent-3: Answer sub-Q3 (scope: use case C) ← runs simultaneously
Synthesizer: Merge findings from all agents
```

**Independence proof**: Two sub-questions are independent if their answer could be written without reading the other question.

### Iterative (deepening investigation)

Use when initial findings reveal follow-up questions.

```
Round-1: Answer top-level sub-questions
Round-2: Based on gaps/contradictions, formulate follow-up sub-questions
Round-3: If gaps remain, narrow scope further or flag as low-confidence
Stop: After 3 rounds or when confidence target met
```

## Evidence Grading (4-Dimension Table)

Every piece of evidence receives grades on 4 dimensions:

| Dimension | High (H) | Medium (M) | Low (L) |
|---|---|---|---|
| **Source Authority** | Official docs, maintained repo | Blog post, tutorial | Forum answer, Stack Overflow |
| **Recency** | <6 months old | 6-18 months old | >18 months old |
| **Corroboration** | 2+ independent sources agree | Single reliable source | Contradicted by other source |
| **Relevance** | Directly answers sub-question | Answers related question | Tangential context only |

### Grading Example

```
Finding: "Context7 supports 5000+ libraries"
- Authority: H (official docs)
- Recency: H (updated 2026-03)
- Corroboration: H (confirmed by Exa search)
- Relevance: H (directly answers sub-Q1)
Overall: HHHH → full confidence
```

## Confidence Scoring

| Level | Criteria | Action |
|---|---|---|
| **full** | All dimensions H, 2+ corroborating sources, no critical gaps | Proceed with findings |
| **partial** | Mostly H/M, single source or minor gap | Proceed with caveats |
| **low** | Any L dimension, contradictions, critical gaps | Flag for user review |

Run `scripts/score-confidence.sh <corroborated> <gaps> <contradictions>` for deterministic scoring.

## Contradiction Resolution

When sources disagree:

1. **Log both positions** with full source attribution
2. **Compare recency** — newer may reflect API changes
3. **Compare authority** — official docs > blog posts
4. **Seek third source** — attempt resolution through additional evidence
5. **Caveat block** — if unresolvable after 3 attempts, emit explicit caveat

### Contradiction Template

```markdown
### Contradiction #N
- **Position A**: [claim] — Source: [provider/url], dated [date], authority [H/M/L]
- **Position B**: [claim] — Source: [provider/url], dated [date], authority [H/M/L]
- **Resolution**: [resolved/unclear]
- **Reasoning**: [why one position prevails, or why unresolved]
```

## Output Structure

Every research output must include:

```markdown
## Research Findings

### Sub-Questions Addressed
1. [sub-Q1] → Type: [type]
2. [sub-Q2] → Type: [type]

### Source Inventory
| Source | Provider | Reliability | Recency |
|---|---|---|---|

### Findings
#### Sub-Q1: [question text]
- **Finding**: [answer]
- **Confidence**: full/partial/low
- **Evidence**: [source citations]

### Contradictions
[contradiction blocks if any]

### Coverage Gaps
- [gaps identified]

### Recommendations
- [actionable next steps]
```

## Bundled Resources

| Reference | Trigger | Content |
|---|---|---|
| [research-classification.md](references/research-classification.md) | Type classification unclear | Decision trees, signal word tables |
| [delegation-for-research.md](references/delegation-for-research.md) | Multi-agent research | Sequential/parallel/iterative patterns |
| [evidence-contract.md](references/evidence-contract.md) | Evidence grading | 4-dimension table, confidence rules |
| [research-packet.md](templates/research-packet.md) | Delegating to subagent | Ready-to-use delegation template |
| [evidence-table.md](templates/evidence-table.md) | Tracking evidence | Structured evidence log |
| [score-confidence.sh](scripts/score-confidence.sh) | Confidence scoring | Deterministic full/partial/low |
