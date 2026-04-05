# Delegation Patterns for Research

Research often requires multiple agents working in parallel or sequence. This reference defines the three delegation patterns and when to use each.

## Pattern 1: Sequential Delegation

**When**: Sub-question B's answer depends on sub-question A's result.

### Structure

```
┌─────────────┐     findings-A     ┌─────────────┐     findings-B     ┌─────────────┐
│  Agent-1    │ ──────────────────→ │  Agent-2    │ ──────────────────→ │  Agent-3    │
│  Answer Q1  │                     │  Answer Q2  │                     │  Synthesize │
└─────────────┘                     └─────────────┘                     └─────────────┘
```

### Independence Proof Test

Sub-question Q2 depends on Q1 if:
- Q2's text contains Q1's key entity name
- Q2 cannot be fully answered without Q1's result
- Q2's answer would change if Q1's answer changed

**Example**:
- Q1: "What is the HiveMind plugin architecture?"
- Q2: "How does the trajectory tool interact with the supervisor layer?"
  - Q2 contains "supervisor layer" which is defined in Q1 → DEPENDENT → Sequential

### Handoff Contract

```markdown
## Handoff from Agent-1 → Agent-2

### Sub-Question Answered
[Q1 text]

### Findings
[answer with confidence score]

### Key Entities Identified
- [entity1]: [definition/role]
- [entity2]: [definition/role]

### Evidence
| Source | Provider | Reliability |
|---|---|---|

### For Next Agent
- Use these entities: [list]
- Watch for these assumptions: [list]
- Known gaps: [list]
```

## Pattern 2: Parallel Delegation

**When**: Sub-questions share no entities, premises, or dependencies.

### Structure

```
                    ┌─────────────┐
                ┌──→│  Agent-1    │──┐
                │   │  Answer Q1  │  │
┌───────────┐   │   └─────────────┘  │   ┌─────────────┐
│  Dispatch  │──┤   ┌─────────────┐  ├──→│  Synthesizer │
│  3 sub-Qs  │  ├──→│  Agent-2    │──┤   │  Merge all   │
└───────────┘   │   │  Answer Q2  │  │   └─────────────┘
                │   └─────────────┘  │
                │   ┌─────────────┐  │
                └──→│  Agent-3    │──┘
                    │  Answer Q3  │
                    └─────────────┘
```

### Independence Proof Test

Two sub-questions are independent if:
- Their answer could be written WITHOUT reading the other question
- They address different entities, libraries, or domains
- Combining their findings doesn't require reconciling contradictions

**Example**:
- Q1: "What is the Context7 MCP setup process?"
- Q2: "What anti-patterns exist in Repomix usage?"
  - Different entities (Context7 vs Repomix), different domains → INDEPENDENT → Parallel

### Synthesis Contract

The synthesizer agent receives all findings and must:

1. **Check for contradictions** across parallel results
2. **Identify cross-references** (did Agent-1 mention something Agent-2 found?)
3. **Merge evidence tables** into unified inventory
4. **Produce unified confidence score** (weakest link: min of all sub-scores)
5. **Generate final recommendations**

## Pattern 3: Iterative Delegation

**When**: Initial findings reveal new questions or deeper investigation needed.

### Structure

```
Round 1: Answer top-level sub-questions
    │
    ├── Gaps found? ──→ Round 2: Formulate follow-up sub-questions
    │                        │
    │                        ├── Gaps found? ──→ Round 3: Narrow scope further
    │                        │                        │
    │                        │                        └── Flag remaining as low-confidence
    │                        │
    │                        └── No gaps? ──→ Done
    │
    └── No gaps? ──→ Done
```

### Iteration Rules

1. **Max 3 rounds** — prevents infinite research loops
2. **Scope must narrow** each round — can't repeat same broad questions
3. **Confidence must increase** — if round N finds no new evidence, stop
4. **Document what changed** — each round must state what it learned differently from prior round

### Follow-Up Question Generation

After each round, review findings for:

| Trigger | Follow-Up Action |
|---|---|
| Contradiction found | Formulate resolution question, seek third source |
| "According to [source]..." with no corroboration | Verify with different provider |
| Version-specific behavior | Check if behavior changed in latest version |
| "It depends" answer | Narrow scope: "for use case X, what is the answer?" |
| Coverage gap | Try different provider or different query formulation |

### Iteration Tracking

```markdown
## Iteration N

### Questions This Round
1. [follow-up Q1]
2. [follow-up Q2]

### What Changed From Round N-1
- [finding that was refined/corrected]
- [new evidence found]

### Confidence Delta
- Round N-1: partial
- Round N: full (improved by adding Context7 corroboration)

### Remaining Gaps
- [gaps still open, with rationale for stopping]
```

## Choosing the Right Pattern

| Scenario | Pattern | Reason |
|---|---|---|
| "How does X work?" (single library) | Sequential | Each sub-Q builds on previous |
| "Compare X vs Y vs Z" | Parallel | Each comparison is independent |
| "Investigate this bug" | Iterative | Initial hypothesis → test → refine |
| "Evaluate architecture options" | Parallel + Iterative | Parallel discovery, iterative refinement |
| "Map this dependency graph" | Sequential | Each dependency depends on prior findings |

## Delegation Packet Template

When spawning sub-agents, always include:

```markdown
## Research Delegation Packet

**Agent Role**: [researcher / synthesizer / verifier]
**Research Type**: [Tech/API / Comparison / Pattern / ...]
**Pattern**: [sequential / parallel / iterative]

### Sub-Questions (for this agent)
1. [question text]
   - Expected answer shape: [behavior description / comparison table / ...]
   - Satisfactory evidence: [what would convince you]

### Context from Prior Agents
[findings so far, or "none — first agent"]

### Source Strategy
- Primary: [provider]
- Fallback: [provider]
- Skip: [providers not relevant]

### Constraints
- Scope boundaries: [what NOT to investigate]
- Time/depth limit: [max rounds, max sources]

### Return Contract
- Confidence level expected: [full / partial / low]
- Must include: [evidence table / code examples / ...]
```
