# Research Packet — Delegation Template

Use this template when spawning a research sub-agent. Copy, fill in, and pass as context.

---

## Research Delegation Packet

**Packet ID**: [auto-generate or assign]
**Spawned By**: [agent name / orchestrator]
**Timestamp**: [ISO 8601]

### Agent Role

- [ ] **Researcher** — Answer assigned sub-question(s)
- [ ] **Synthesizer** — Merge findings from multiple researchers
- [ ] **Verifier** — Re-check findings for contradictions or staleness

### Research Configuration

| Field | Value |
|---|---|
| Research Type | Tech/API \| Pattern \| Comparison \| Requirements \| Landscape \| Cross-Dependency |
| Delegation Pattern | Sequential \| Parallel \| Iterative |
| Confidence Target | full \| partial \| low |
| Max Rounds | [1-3] |
| Max Sources | [default: 8-12] |

### Sub-Questions for This Agent

**Question 1**: [text]
- Expected answer shape: [behavior description / comparison / list / ...]
- Satisfactory evidence: [what would convince you this is answered]

**Question 2**: [text]
- Expected answer shape: [...]
- Satisfactory evidence: [...]

**Question 3**: [text]
- Expected answer shape: [...]
- Satisfactory evidence: [...]

### Context from Prior Agents

> If first agent, write "none — first agent in chain"

[Findings from prior agents, including key entities, definitions, and open questions]

### Source Strategy

| Priority | Provider | Use For | Fallback If Unavailable |
|---|---|---|---|
| Primary | [provider] | [purpose] | [fallback provider] |
| Secondary | [provider] | [purpose] | [fallback provider] |
| Skip | [provider] | Not relevant because [reason] | — |

### Constraints

- **Scope boundaries**: [what NOT to investigate]
- **Time/depth limit**: [max rounds, max sources per provider]
- **Exclusions**: [topics, files, or domains to skip]

### Return Contract

This agent MUST return:

```markdown
## Research Return

### Sub-Questions Answered
1. [Q1] → [answered / partially answered / gap]
2. [Q2] → [answered / partially answered / gap]

### Findings
#### Finding 1: [title]
- **Answer**: [concise answer]
- **Confidence**: full | partial | low
- **Evidence**: [citation]
- **Grading**: A/R/C/R (e.g., H/H/M/H)

### Evidence Table
| Claim ID | Claim | Provider | Source | Grading | Confidence |
|---|---|---|---|---|---|

### Contradictions Found
[if any, with both positions cited]

### Coverage Gaps
[gaps identified, with rationale]

### For Next Agent
[key entities, assumptions, and open questions to pass forward]
```

---

## Usage Notes

- **Sequential**: Attach prior agent's "For Next Agent" section as "Context from Prior Agents"
- **Parallel**: Attach same prior context to all parallel agents; synthesizer gets all returns
- **Iterative**: Each round formulates new packets based on gaps from prior round
