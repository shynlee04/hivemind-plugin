# Research Delegation Test

## Scenario: Multi-Source Evidence Collection

A research question is decomposed into sub-questions and delegated in parallel.

### Setup

- Question: "What authentication methods does the OpenCode SDK support?"
- Sub-questions:
  1. What auth hooks exist?
  2. What API key patterns are used?
  3. What OAuth flows are documented?

### Validation Table

| Step | Action | Expected |
|------|--------|----------|
| 1 | Decompose into 3 sub-questions | 3 independent sub-questions defined |
| 2 | Assign source strategy | code-first, docs-first, web-first |
| 3 | Dispatch 3 parallel packets | 3 packets with `research_type: "evidence-collection"` |
| 4 | Thread 1 returns | Evidence items with sources, confidence graded |
| 5 | Thread 2 returns | Evidence items with sources, confidence graded |
| 6 | Thread 3 returns | Evidence items with sources, confidence graded |
| 7 | Synthesis | Per-source attribution, contradictions flagged |
| 8 | Thread status | All threads `complete` or `blocked` |

### Source Grading Test

| Source | Authority | Freshness | Corroborated | Expected Trust |
|--------|-----------|-----------|-------------|----------------|
| SDK source code | Level 1 | current | N/A | Highest |
| Official docs | Level 1 | current | Yes | Highest |
| Tech blog | Level 3 | recent | No | Medium |
| Forum answer | Level 4 | stale | No | Low |
| Uncited claim | Level 5 | unknown | No | None |

### Anti-Pattern Test

| Step | Action | Expected |
|------|--------|----------|
| 1 | Delegate without sub-questions | Rejected — must decompose first |
| 2 | Resolve contradiction in child | Rejected — synthesizer decides |
| 3 | Carry full evidence in checkpoint | Rejected — use compressed thread state |
