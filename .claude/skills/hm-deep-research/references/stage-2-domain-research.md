# Stage 2: Domain Research

Deep dive on domain-level research execution. This stage is where most context budget is spent. Follow the procedures exactly to avoid waste.

---

## Per-Research-Type Tool Bundles

Each research type has a tested tool sequence. Follow the sequence. Do not improvise.

### Discovery: "Does X exist?"

```
Step 1: tavily-search (basic, max_results: 5, query: "X [specific feature]")
Step 2: IF Step 1 found candidates -> Context7 resolve for each candidate
Step 3: IF Context7 found docs -> query-docs (max 3 calls) for specific feature
Step 4: IF no Context7 result -> DeepWiki ask_question for top candidate repo
Step 5: IF no web results -> codesearch (numResults: 5, query: "X implementation")
```

### Technical: "How does X work?"

```
Step 1: Context7 resolve-library-id (libraryName: "X")
Step 2: Context7 query-docs (specific question about X's mechanism)
Step 3: IF docs insufficient -> tavily-extract (official docs URL from Step 1 or 2)
Step 4: IF code-level understanding needed -> repomix pack (compressed, includePatterns: "src/**/*.ts")
Step 5: grep packed output for key function/class names
Step 6: read targeted line ranges from packed output
```

### Comparative: "Compare X vs Y vs Z"

```
Step 1: Context7 resolve-library-id for X, Y, Z (parallel)
Step 2: Context7 query-docs for each (parallel, same question for all)
Step 3: tavily-search (advanced, max_results: 10, query: "X vs Y vs Z [comparison dimension]")
Step 4: IF benchmarks needed -> tavily-search (query: "X Y Z benchmark performance 2024 2025")
Step 5: IF code patterns needed -> codesearch for each library's usage patterns
Step 6: Write comparative findings in table format
```

### Diagnostic: "Why is X broken?"

```
Step 1: grep (pattern: "error message or symptom", include: "*.ts")
Step 2: read (surrounding code, offset ± 20 lines)
Step 3: grep (pattern: "related function/class", include: "*.ts")
Step 4: IF recent changes suspected -> bash: git log --oneline -20 -- [file]
Step 5: IF dependency issue -> bash: cat package.json | grep [dependency]
Step 6: IF type issue -> grep (pattern: "interface|type.*related", include: "*.ts")
Step 7: Synthesize hypothesis evidence into findings
```

### Feasibility: "Can we build X?"

```
Step 1: tavily-search (query: "X implementation tutorial guide")
Step 2: Context7 resolve + query for each required library
Step 3: codesearch (query: "X pattern implementation example")
Step 4: repomix pack (local codebase, compressed) -> grep for existing similar patterns
Step 5: IF platform API needed -> tavily-extract (platform API docs URL)
Step 6: Write feasibility matrix: requirement vs available capability
```

### Audit: "Map architecture of X"

```
Step 1: repomix pack (compressed, includePatterns: "src/**/*.ts")
Step 2: grep packed output for "import" -> map dependency graph
Step 3: grep packed output for "export" -> map public API surface
Step 4: grep packed output for "class|interface|type" -> map type system
Step 5: read targeted sections of packed output for deep understanding
Step 6: IF external repo -> repomix pack_remote_repository instead of Step 1
Step 7: Draw dependency diagram in findings
```

---

## Query Refinement Loop

When a search returns no useful results, refine BEFORE retrying. Maximum 3 refinements per hypothesis.

### Refinement Strategies

| Problem | Strategy | Example |
|---------|----------|---------|
| Too specific | Broaden scope | "rust tokio-tungstenite batch send" -> "rust websocket message batching" |
| Too broad | Add constraints | "websocket library" -> "rust async websocket library with message queuing" |
| Wrong domain | Switch tool | Tavily -> Context7, or Context7 -> codesearch |
| Stale results | Add freshness | Add `time_range: "month"` or `freshness: "pm"` |
| No primary sources | Target official | Add `include_domains: ["github.com", "docs.rs"]` |
| Language mismatch | Switch language | Try `search_lang: "jp"` for Japanese docs |

### Refinement Loop Template

```
Attempt 1: query = "[original query]"
Result: [describe what came back — 0 relevant, partially relevant, wrong angle]

Attempt 2: query = "[refined query using strategy]"
Result: [describe improvement]

Attempt 3 (FINAL): query = "[last refinement]"
Result: [accept what you have, flag gap in findings]
```

After 3 attempts with no useful results:
1. Mark the hypothesis as "Unresolved — search exhausted" in findings.
2. Document the queries attempted.
3. Move to next hypothesis. Do NOT burn more budget.

---

## Findings Writing Protocol

Write findings to `findings-stage2.md` (use `references/findings-format-template.md`) after EVERY search batch. Do not accumulate unwritten findings.

### Writing Rules

1. **One finding per hypothesis**: Even if a hypothesis spans multiple searches, consolidate into one finding.
2. **Source attached immediately**: Every finding must have its source URL or file path at the time of writing. Never "add sources later."
3. **Confidence level assigned**: Rate each finding: High (Direct evidence), Medium (Correlational), Low (Testimonial/Absence).
4. **Contradictions flagged inline**: If Finding 3 contradicts Finding 1, add `**CONTRADICTS**: Finding 1` to Finding 3.
5. **Gaps documented**: If you couldn't fully address a hypothesis, write what's missing and why.

### Finding Example

```markdown
## Finding 2: Prisma supports composite types via $compound

**Hypothesis**: Prisma leads in type inference for PostgreSQL composite types
**Status**: Partially confirmed
**Confidence**: Medium (Correlational)

Prisma does not natively support PostgreSQL composite types as a first-class
feature. However, composite types can be modeled using the `$compound` API
with custom type mapping.

**Source**: https://www.prisma.io/docs/concepts/components/prisma-schema/composite-types
**Evidence**: Correlational — docs show the API exists but no official PG composite type support

**Gap**: No benchmarks on type inference accuracy for composite fields.
**Contradicts**: None
```

---

## Context Budget Management During Research

### Real-Time Budget Tracking

After every tool call, estimate context consumed:

| Tool Call Type | Approx. Context Cost |
|---------------|---------------------|
| tavily-search (basic, 5 results) | 2-4KB |
| tavily-search (advanced, 10 results) | 5-10KB |
| tavily-extract (1 URL, basic) | 5-20KB per page |
| tavily-extract (batch, 10 URLs) | 50-200KB |
| Context7 resolve | 1-2KB |
| Context7 query-docs | 5-15KB |
| DeepWiki ask_question | 5-20KB |
| repomix pack (compressed, focused) | 20-50KB |
| repomix pack (compressed, full repo) | 50-200KB |
| repomix grep | 1-5KB |
| repomix read (targeted lines) | 2-10KB |
| codesearch (5 results) | 3-8KB |

### Budget Checkpoints

After every 3 tool calls:
1. Estimate total context consumed so far.
2. Compare against allocated budget from research-plan.md.
3. If > 60% consumed: switch to write-only mode (synthesize findings, stop fetching).
4. If > 80% consumed: immediately write all remaining findings and proceed to Stage 4.

---

## Escalation to Stage 3

Stage 3 (Cross-Tech) is triggered when ANY of these conditions are met:

1. **Multi-domain**: Research spans 3+ distinct technology domains (e.g., frontend + backend + database).
2. **Multi-repo**: Need to investigate 2+ separate codebases in depth.
3. **Competing hypotheses**: 2+ hypotheses cannot be resolved without parallel investigation.
4. **Budget vs scope**: Single-agent context budget insufficient for the scope defined in the plan.

If none of these apply, skip Stage 3 and proceed directly to Stage 4.

---

## Gate Check

Before leaving Stage 2:

- [ ] All hypotheses addressed OR explicitly deferred with documented reason
- [ ] Every finding has a source URL or file path
- [ ] Every finding has a confidence level (High/Medium/Low)
- [ ] No finding contradicts another without being flagged
- [ ] findings-stage2.md written to disk with all findings
- [ ] Context budget not exceeded (verify against plan allocation)
- [ ] If escalation triggered: research-plan.md updated with Stage 3 scope
- [ ] If no escalation: ready to proceed directly to Stage 4
