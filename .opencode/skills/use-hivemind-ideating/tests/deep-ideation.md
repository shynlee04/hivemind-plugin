# Deep Ideation Test

## Scenario: "I want to migrate from monolith to microservices with zero downtime."

A cross-stack, architecturally impactful change requiring full pipeline execution.

### Setup

- User message: "I want to migrate from monolith to microservices with zero downtime."
- Current stack: Node.js monolith with PostgreSQL (known)
- Scope: Cross-stack, architectural, high-risk

### Validation Table

| Step | Action | Expected | Pass/Fail Criteria |
|------|--------|----------|-------------------|
| 1 | Intent classification | `open-ended` — major architectural change | Intent = open-ended |
| 2 | Scope classification | `Deep` — cross-stack, architectural impact | Scope = Deep |
| 3 | Full 7-phase pipeline | All phases 0-7 executed in order | 7/7 phases completed |
| 4 | Questions asked | 5+ questions across multiple domains | ≥5 questions, one at a time |
| 5 | Approaches generated | 2-3 comprehensive approaches | ≥2 approaches |
| 6 | Understanding Lock | Hard gate triggered and confirmed | Explicit user confirmation recorded |
| 7 | Cross-stack research triggered | Full MCP chain: Exa/Tavily/Brave (sequential) + Context7 + DeepWiki | ≥3 sources, tools sequential |
| 8 | Swarm dispatched | 4-wave investigation for evidence | All 4 waves dispatched |
| 9 | Multi-agent review | 3 reviewers dispatched (Skeptic, Guardian, Advocate) | 3/3 reviewers |
| 10 | Reviewer synthesis | Dispositions collected, conflicts resolved | ≥1 APPROVED approach |
| 11 | Feature quality gate | Both creep check + 10x scoring completed | Score ≥0.7 or documented caveats |
| 12 | Documentation | Requirements doc + Decision Log + 10x Analysis | All 3 artifacts validate |
| 13 | Handoff packet | Formatted for planning consumption | Exit criteria all true |

### Expected Output Artifacts

| Artifact | Must Contain |
|----------|-------------|
| Requirements doc | ≥5 requirements with stable IDs (R1-R5+) |
| Decision log | ≥5 decisions with alternatives, rationale, objections |
| 10x analysis | All 6 criteria scored, priority recommendation |
| Vocabulary map | Domain terms for microservices, migration, deployment |
| Evidence package | ≥3 evidence items from different sources |
| Handoff packet | Complete JSON with all paths and exit criteria |

### Wave Validation (Swarm)

| Wave | Agent Type | Tasks | Carry-Forward |
|------|-----------|-------|---------------|
| 1 | explore | Codebase scan for coupling points | ≤5 findings |
| 2 | general | MCP tool evidence gathering | ≤5 evidence items |
| 3 | general | Synthesis and grading | 1 synthesis report |
| 4 | explore | Claim verification | 1 verified evidence package |

### Anti-Pattern Checks

| Anti-Pattern | Must NOT Happen |
|-------------|-----------------|
| Skipping any phase | All 7 phases executed in order |
| Parallel web search | Exa/Tavily/Brave never called simultaneously |
| Skipping Understanding Lock | Hard gate explicitly confirmed |
| Skipping any reviewer | All 3 reviewers dispatched for Deep scope |
| Trusting single source | ≥2 sources for every decision-influencing claim |
| Proceeding with unresolved HIGH-IMPACT | All ambiguity resolved before handoff |
| Skipping swarm | 4-wave investigation executed for Deep scope |

### Timing Target

- Total turns: 5-10
- Total tool calls: ≤15
- Duration: 30-60 minutes
