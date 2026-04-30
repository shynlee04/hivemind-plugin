# Research Patterns

Five archetypes cover every research task. Identify yours, then follow the matching workflow. Each archetype specifies: when to use it, which tools to reach for, the step-by-step workflow, what the output looks like, and how to validate it.

---

## The Five Archetypes at a Glance

| Archetype | Question Type | Depth | Breadth | Typical Duration |
|-----------|--------------|-------|---------|-----------------|
| **Technology Scan** | "What's out there?" | Shallow | Broad | 30-60 min |
| **Market Analysis** | "What's the landscape?" | Medium | Broad | 2-4 hours |
| **Codebase Archaeology** | "What's in here?" | Deep | Narrow | 1-3 hours |
| **API Investigation** | "How does this work?" | Deep | Narrow | 1-2 hours |
| **Competitive Audit** | "How do others do it?" | Medium | Medium | 2-4 hours |

### Selection Tree

```
What are you researching?
│
├── A technology, library, or tool
│   ├── "What options exist?"         → Technology Scan
│   └── "How does this one work?"     → API Investigation
│
├── A market, product area, or business question
│   ├── "What's the competitive landscape?" → Market Analysis
│   └── "How do competitors solve this?"    → Competitive Audit
│
├── An existing codebase or system
│   ├── "What does this code do?"     → Codebase Archaeology
│   └── "How does this API work?"     → API Investigation
│
└── Not sure yet
    → Start with Technology Scan (broadest, cheapest)
      Then narrow to the specific archetype
```

---

## Archetype 1: Technology Scan

### When to Use

- Evaluating options for a technology choice
- Answering "what's available" questions
- Building a comparison matrix before deep-diving into any single option

### Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| tavily-search (basic) | Broad discovery of options | Start here |
| Context7 resolve-library-id | Identify libraries for deeper investigation | Per candidate |
| brave-search | Community sentiment, recent articles | For validation |
| exa web search | Technical blog posts, comparisons | When tavily results are thin |

### Workflow

```
Step 1: Frame the question
  Write one sentence. "What [category] options exist for [use case] in [year]?"
  Example: "What TypeScript ORM options exist for serverless projects in 2026?"

Step 2: Broad search
  tavily-search with the framed question
  → Collect candidate names from top 10 results

Step 3: Identify candidates
  List each candidate. For each, one-line description from search result.
  → Aim for 3-8 candidates. < 3 means broader search needed.

Step 4: Quick screen each candidate
  For each candidate:
    a. Context7 resolve-library-id → get library ID
    b. Context7 query-docs "overview features" → 1 query max
    c. brave-search "[candidate] review [year]" → community sentiment
  → Screen should take < 5 min per candidate

Step 5: Build comparison matrix
  | Feature | Candidate A | Candidate B | Candidate C |
  → Focus on YOUR constraints, not generic feature lists

Step 6: Recommend or escalate
  - Clear winner → recommend with evidence
  - Need deeper evaluation → escalate to API Investigation for top 2-3
  - No suitable option → document gaps, suggest alternatives or in-house
```

### Output Format

```markdown
# Technology Scan: [Category] for [Use Case]

## Candidates Evaluated
| Name | Type | Stars | Last Updated | Quick Assessment |

## Comparison Matrix
| Criterion | [A] | [B] | [C] |

## Recommendation
[Or: "Top 2-3 need deeper investigation — escalate to API Investigation"]

## Gaps
[What you couldn't evaluate in shallow mode]
```

### Validation Gate

- [ ] At least 3 candidates evaluated
- [ ] Each candidate has at least 1 source (docs or community)
- [ ] Comparison matrix covers YOUR constraints, not generic features
- [ ] Recommendation or escalation is clearly stated

---

## Archetype 2: Market Analysis

### When to Use

- Understanding a product space or industry segment
- Evaluating market positioning for a new feature or product
- Answering "how big is this market" or "who are the players" questions

### Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| tavily-search (advanced) | Market reports, analyst data | Use advanced depth |
| brave-search (news) | Recent market developments | Time-filter to last year |
| exa web search | Long-form analysis, reports | For depth |
| tavily-research (pro) | Multi-source market synthesis | When budget allows |

### Workflow

```
Step 1: Define the market boundaries
  "What is the [market segment] landscape for [target audience]?"
  List: geographic scope, time frame, segment definition

Step 2: Identify the players
  tavily-search "[market segment] companies tools platforms [year]"
  → Collect 10-20 names. Group by category (enterprise, startup, open source).

Step 3: Map the landscape
  Create a positioning map:
  | Player | Segment | Pricing | Key Differentiator | Market Share Signal |

Step 4: Identify trends
  brave-search news "[market segment] trends [year]"
  → 3-5 trends with evidence

Step 5: Assess gaps
  Where are the underserved areas?
  → Cross-reference user complaints (search "[market segment] complaints problems")
  → Identify patterns in negative reviews

Step 6: Synthesize
  Produce landscape map + trend analysis + gap identification
```

### Output Format

```markdown
# Market Analysis: [Segment]

## Landscape Map
| Player | Segment | Model | Differentiator | Signal |

## Key Trends
1. [Trend] — Evidence: [sources]
2. [Trend] — Evidence: [sources]

## Gaps & Opportunities
| Gap | Who's Missing | Why It Matters |

## Confidence Assessment
[High/Medium/Low with reasoning]
```

### Validation Gate

- [ ] At least 5 players identified and categorized
- [ ] Trends are backed by dated sources (< 12 months)
- [ ] Gaps are derived from evidence, not assumptions
- [ ] Confidence level is explicitly stated

---

## Archetype 3: Codebase Archaeology

### When to Use

- Understanding an unfamiliar codebase
- Answering "what does this code do" questions
- Mapping architecture before proposing changes
- Investigating bugs that span multiple modules

### Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| repomix pack-codebase | Full repo analysis | Use compress=true, set includePatterns |
| DeepWiki | Quick architecture overview | For public repos |
| grep / Grep tool | Targeted search | hm-detective SCAN mode |
| Read (offset) | Surgical file reading | hm-detective DEEP mode |
| Glob | File discovery | Pattern-based file finding |

### Workflow

```
Step 1: Orient (SKIM)
  Glob for file types → understand project structure
  Read package.json / tsconfig.json → understand dependencies
  → Output: project type, key directories, dependency count

Step 2: Map the architecture (SCAN)
  repomix pack-codebase with compress=true
  Focus on: imports, exports, public interfaces
  → Output: module dependency graph (text form)

Step 3: Identify the entry points (SCAN → DEEP)
  grep for main exports, route definitions, CLI entry points
  → Output: "This codebase has N entry points: [list]"

Step 4: Trace the critical path (DEEP)
  Pick the most relevant path for your question
  Read in DEEP mode (hm-detective) — full understanding
  → Output: step-by-step execution flow

Step 5: Map the boundaries (DEEP)
  Identify module boundaries: where does one concern end and another begin?
  → Output: interface map — which modules talk to which, through what

Step 6: Document findings
  Architecture diagram (text)
  Dependency map
  Key interfaces
  Surprises / gotchas
```

### Output Format

```markdown
# Codebase Archaeology: [Repo/Module]

## Architecture Overview
[Text diagram of module structure]

## Entry Points
| Entry | Type | Trigger |

## Critical Path
[Step-by-step execution flow for the relevant scenario]

## Module Boundaries
| Module | Depends On | Exports |

## Surprises
[Non-obvious behaviors, implicit dependencies, circular refs]
```

### Validation Gate

- [ ] Architecture diagram covers all modules relevant to the question
- [ ] Entry points are identified with types
- [ ] Critical path is traced end-to-end
- [ ] Module boundaries are explicit (imports/exports listed)
- [ ] At least 1 surprise or gotcha is documented (every codebase has them)

---

## Archetype 4: API Investigation

### When to Use

- Understanding how a specific library, API, or service works
- Evaluating API design for integration
- Answering "can I do X with Y" questions
- Investigating error handling, edge cases, or performance characteristics

### Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Context7 (resolve → query) | Official documentation | Max 3 queries per library |
| DeepWiki ask-question | Targeted architecture questions | Good for "how does X work" |
| tavily-extract | Pull specific docs pages | When Context7 lacks detail |
| repomix pack-remote | Source code analysis | Use compress=true for large repos |

### Workflow

```
Step 1: Define what you need to know
  Write the specific question: "How does [library] handle [specific behavior]?"
  List the 3-5 things you need to understand

Step 2: Check documentation first
  Context7 resolve-library-id → get ID
  Context7 query-docs with your specific question
  → If answered with high confidence → done

Step 3: Check source if docs are insufficient
  DeepWiki ask-question with your specific question
  OR repomix pack-remote with includePatterns targeting the relevant module
  → Focus on: types, error paths, edge cases

Step 4: Check community evidence
  brave-search "[library] [behavior] issue"
  tavily-search "[library] [behavior] workaround"
  → Look for: confirmed bugs, known limitations, workarounds

Step 5: Build the interface contract
  Document what you learned:
  | Aspect | Expected Behavior | Actual Behavior | Source |

Step 6: Validate with a test case (if stakes are high)
  Write a minimal reproduction
  Run it
  Document the result
```

### Output Format

```markdown
# API Investigation: [Library] — [Behavior]

## Question
[The specific question you investigated]

## Interface Contract
| Aspect | Behavior | Evidence | Confidence |

## Error Handling
| Error Type | Trigger | Recovery |

## Known Issues
| Issue | Workaround | Source |

## Verdict
[Can you use this API for your purpose? Yes/No/Partial, with reasoning]
```

### Validation Gate

- [ ] The specific question is answered
- [ ] Behavior is documented with source (docs or source code)
- [ ] Error handling is described (not just happy path)
- [ ] Known issues are listed (if any exist)
- [ ] Verdict is clearly stated

---

## Archetype 5: Competitive Audit

### When to Use

- Understanding how competitors solve a specific problem
- Benchmarking your approach against alternatives
- Answering "how does everyone else do this" questions
- Identifying feature gaps or opportunities

### Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| tavily-search | Broad competitive discovery | Start here |
| brave-search | Recent competitive moves | News-focused |
| exa web search | Deep feature analysis | For top competitors |
| DeepWiki | Open-source competitor code | For public repos |
| repomix pack-remote | Competitor source analysis | Targeted comparison |

### Workflow

```
Step 1: Define the comparison axis
  What specific aspect are you comparing?
  "How do [competitors] handle [specific feature]?"
  NOT: "Tell me everything about all competitors"

Step 2: Identify the competitors
  List 3-6 competitors (products, libraries, or approaches)
  Include: market leaders + direct competitors + emerging alternatives

Step 3: Research each competitor on the comparison axis
  For each competitor:
    a. Search for their approach to [specific feature]
    b. Find documentation or demos
    c. If open source: DeepWiki or repomix for implementation details
  → Focus on the comparison axis, not general features

Step 4: Build the feature matrix
  | Capability | Competitor A | Competitor B | Competitor C | Us |
  → Be honest about your own gaps

Step 5: Identify patterns and outliers
  - Pattern: "Everyone does X" → table stakes, you must do it too
  - Pattern: "Most do Y, but A does Z" → investigate why A chose differently
  - Outlier: "Nobody does W" → opportunity or bad idea? Find evidence.

Step 6: Synthesize
  Produce: feature matrix + pattern analysis + gap/opportunity map
```

### Output Format

```markdown
# Competitive Audit: [Feature] across [Category]

## Competitors Analyzed
| Name | Type | Market Position |

## Feature Matrix
| Capability | [A] | [B] | [C] | [Us] |

## Patterns
| Pattern | Who | Significance |

## Gaps
| Gap | Who's Missing | Opportunity Level |

## Recommendations
[Evidence-based recommendations based on competitive analysis]
```

### Validation Gate

- [ ] At least 3 competitors analyzed
- [ ] Comparison is focused on a specific axis (not generic feature dump)
- [ ] Feature matrix includes your own position (honest assessment)
- [ ] Patterns are derived from evidence, not assumptions
- [ ] Recommendations are grounded in competitive data

---

## Cross-Archetype Rules

Regardless of which archetype you're following, these rules always apply:

### Tool Budget

| Tool | Max Calls | Reason |
|------|-----------|--------|
| Context7 query-docs | 3 per library | Avoid context overconsumption |
| tavily-search | 5 per investigation | Diminishing returns after 5 |
| DeepWiki ask-question | 3 per repo | Targeted questions only |
| repomix pack | 2 per investigation | Full packs are expensive |
| brave-search | 3 per investigation | Use for validation, not discovery |

### Evidence Standards

| Claim Type | Minimum Evidence |
|-----------|-----------------|
| Factual statement | 1 DIRECT source |
| Comparison claim | 1 source per option |
| Recommendation | 2+ CORROBORATED sources |
| Trend claim | 3+ dated sources within 12 months |
| Performance claim | Benchmark or source code |

### Time Guards

| Signal | Action |
|--------|--------|
| 3rd search returns no new findings | Stop searching, synthesize |
| Context > 50% consumed | Stop fetching, start writing |
| Research exceeds 2x estimated time | Pause, document what you have, reassess scope |
| Question keeps expanding | Stop, write scope boundary, enforce it |

---

## Version-Matched Context7 Queries

A specialized pattern for researching libraries and frameworks where documentation changes between versions. Prevents the "latest-doc lie" — when Context7 returns current documentation that doesn't match the codebase's pinned version.

### When to Apply

- The codebase's `.tech-registry.json` or lockfiles pin a specific version
- You are researching APIs, configuration, or behavior of a library
- The library has had breaking changes in recent major versions

### Procedure

```
Step 1: Resolve the versioned library
  resolve-library-id: "Next.js 14"
  → If no match, try "Next.js" and note the version in your query

Step 2: Query with version-specific constraints
  query-docs: "Next.js 14 app router API for middleware"
  query-docs: "Next.js 14 migration from pages router"

Step 3: Detect version gaps
  Compare codebase version vs. latest documented version
  → If 1 major behind: note in findings
  → If 2 majors behind: flag as tech debt
  → If 3+ majors behind: require dedicated migration research

Step 4: Search for breaking changes (if gap >1 major)
  tavily-search: "Next.js 14 to 15 breaking changes"
  tavily-search: "Next.js 15 migration guide from 14"
```

### Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|-------------|--------------|----------------|
| Generic query without version | Returns latest docs, may mislead about available APIs | Always include version in first query attempt |
| Recommending upgrade without gap analysis | Silent breaking changes destroy runtime stability | Document version gap, estimate migration effort |
| Ignoring lockfile versions | Transitive dependencies may differ from package.json | Check lockfile for exact resolved versions |

### Integration with Tech Registry

Version-matched queries consume `.tech-registry.json` written by `hm-synthesis` and `hm-detective`. If the registry is missing or stale (>30 days), trigger `hm-synthesis` Tech-Stack Detection first.
