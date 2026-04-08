---
name: hm-deep-research
description: "Multi-stage deep research for technology, market, and codebase investigation. Tutorial-style playbook with real case comparisons, edge case handling, and decision frameworks. Teaches agents to brainstorm, shape features, resolve requirements-vs-spec tradeoffs, and produce validated findings. References hm-detective for reading modes and hm-synthesis for artifact export. Triggers on: research, investigate, analyze, compare, explore, evaluate, deep dive, look into, find out, what's the state of, how does X work, compare X vs Y, can we build X, is X viable, audit, analyze codebase, map architecture."
metadata:
  layer: "2"
  role: "research"
  pattern: P1
allowed-tools: Read Write Edit Bash Glob Grep
---

# HM Deep Research

This skill teaches through cases, not rules. Each case is a real research scenario you will encounter. Read the case, understand the decision, apply the pattern.

## Quick Jump

| Research Need | Start Here |
|---------------|------------|
| "This case vs. that case" | [Case Comparison](references/case-comparison.md) |
| "Something went wrong" | [Edge Cases](references/edge-cases.md) |
| "When do I stop researching?" | [Requirements vs. Spec](references/requirements-vs-spec.md) |
| "Where do I draw the line?" | [Interface Tradeoffs](references/interface-tradeoffs.md) |
| "Turn findings into features" | [Brainstorming & Shaping](references/brainstorming-shaping.md) |
| "What kind of research am I doing?" | [Research Patterns](references/research-patterns.md) |

<execution_context>
For reading modes during investigation: load skill "hm-detective"
Reading modes: SKIM for orientation, SCAN for targeted extraction, DEEP for interface analysis

For artifact export and compression: load skill "hm-synthesis"
Export tier: Standard (findings + decisions) for most research
Compression: Snapshot for full analysis, Focused for targeted investigation
</execution_context>

---

## The Six Concepts

Every research task touches at least two of these. Complex tasks touch all six.

### 1. Case Comparison — "This Case vs. That Case"

Research is comparative by nature. You are always deciding between approaches, tools, patterns, or solutions. The case comparison framework gives you a structure for side-by-side analysis.

**When to use it**: Every time you evaluate two or more options.

| Dimension | Case A | Case B |
|-----------|--------|--------|
| Approach | [what A does] | [what B does] |
| Depth needed | [shallow/medium/deep] | [shallow/medium/deep] |
| Risk of wrong answer | [low/medium/high] | [low/medium/high] |
| Time to validate | [hours/days] | [hours/days] |
| Reversibility | [easy/hard] | [easy/hard] |

**Example**: "Should we use Prisma or Drizzle for our ORM?"

| | Prisma | Drizzle |
|---|--------|---------|
| Approach | Schema-first, generated client | SQL-like, type-inferred |
| Depth needed | Medium (docs are thorough) | Deep (patterns are emergent) |
| Risk of wrong answer | Medium (lock-in) | Low (closer to SQL) |
| Time to validate | 2 days (migration tooling) | 1 day (simpler setup) |
| Reversibility | Hard (schema migration) | Easy (raw SQL fallback) |

Load [references/case-comparison.md](references/case-comparison.md) for 5 complete case pairs with decision frameworks.

---

### 2. Edge Cases — When Research Goes Wrong

Research fails in predictable ways. The top 6 failure modes:

| Failure | Signal | First Response |
|---------|--------|----------------|
| Contradictory sources | Two authoritative sources disagree | Check dates. Newer wins, but verify changelogs. |
| Outdated information | Last update > 12 months, API version mismatch | Search with freshness filter. Check GitHub releases. |
| Too new for patterns | < 6 months old, < 100 GitHub stars | Read source code directly. Build a prototype. |
| Vendor docs are wrong | Code doesn't match documented behavior | Create a minimal repro. File an issue. Use the code, not the docs. |
| No clear winner | 3+ valid approaches, zero differentiation | Define your constraints first. Pick the simplest that fits. |
| Scope creep | Research question keeps expanding | Write a one-sentence scope. Anything outside = separate investigation. |

Load [references/edge-cases.md](references/edge-cases.md) for each failure's full resolution workflow.

---

### 3. Requirements vs. Spec — When to Stop Researching

Research has a natural endpoint. Cross it and you are writing a specification, not doing research. The boundary looks like this:

| Phase | Mindset | Output | Duration |
|-------|---------|--------|----------|
| **Research** | "What's possible?" | Findings, options, tradeoffs | Open-ended |
| **Requirements** | "What do we need?" | Measurable needs, constraints, priorities | Convergent |
| **Specification** | "How do we build it?" | Interfaces, data models, test cases | Precise |

**Signals you've crossed the boundary**:

- You start defining function signatures → you are in spec territory
- You list acceptance criteria → you are in requirements territory
- You say "we should" instead of "they offer" → you left research territory

**How to handle premature specification**: Stop. Write down what triggered it. Ask: "Do I have enough evidence for this decision?" If no, go back to research. If yes, acknowledge the transition and switch to requirements framing.

Load [references/requirements-vs-spec.md](references/requirements-vs-spec.md) for the full transition template.

---

### 4. Interface Tradeoffs — Where to Draw Lines

During research, you investigate interfaces — APIs, type boundaries, module contracts. The question is always: how deep do I go?

**Decision framework**:

```
1. SCOPE: What surface area does this research cover?
   - Single function → SCAN mode, 15 min max
   - Module boundary → DEEP mode on public exports only
   - Cross-module → DEEP mode on interfaces, SKIM on implementations

2. DEPTH: How much do I need to understand?
   - "What does it do?" → SKIM + examples
   - "How does it work?" → SCAN + error paths
   - "Can I change it?" → DEEP + dependents + tests

3. CONFIDENCE: How sure do I need to be?
   - High confidence (production decision) → 3+ sources, working prototype
   - Medium confidence (architecture planning) → 2 sources, interface extraction
   - Low confidence (exploration) → 1 source, document as hypothesis

4. STOP CONDITION: When do I stop investigating this interface?
   - When confidence matches the decision's reversibility
   - Easy to reverse → low confidence is fine → stop early
   - Hard to reverse → high confidence needed → keep digging
```

Load [references/interface-tradeoffs.md](references/interface-tradeoffs.md) for worked examples from real codebases.

---

### 5. Brainstorming & Shaping — From Findings to Features

Research produces findings. Findings become features through this pipeline:

```
RESEARCH → SYNTHESIZE → BRAINSTORM → SHAPE → VALIDATE
  findings    patterns     ideas      proposals    evidence
```

**The critical rule**: Brainstorm from evidence, not imagination. Every feature idea must trace back to at least one research finding.

**Shaping a feature proposal**:

| Element | Question | Source |
|---------|----------|--------|
| Problem | What user pain exists? | Research finding |
| Approach | What solution does the evidence support? | Best-evaluated option |
| Scope | What's the minimum viable version? | Constraint analysis |
| Risks | What could go wrong? | Edge case findings |
| Validation | How do we know it worked? | Measurable criteria |

**Anti-patterns to avoid**:

- Feature creep: adding capabilities beyond what research supports
- Analysis paralysis: requiring 100% confidence before proposing anything
- Premature optimization: designing for scale the research doesn't justify
- Solution shopping: researching until you find confirmation of a pre-chosen answer

Load [references/brainstorming-shaping.md](references/brainstorming-shaping.md) for the full brainstorming-to-proposal workflow.

---

### 6. Research Patterns — Five Archetypes

Every research task falls into one of five archetypes. Identify yours, then follow the matching workflow.

| Archetype | Question | Depth | Breadth |
|-----------|----------|-------|---------|
| **Technology Scan** | "What's out there?" | Shallow | Broad |
| **Market Analysis** | "What's the landscape?" | Medium | Broad |
| **Codebase Archaeology** | "What's in here?" | Deep | Narrow |
| **API Investigation** | "How does this work?" | Deep | Narrow |
| **Competitive Audit** | "How do others do it?" | Medium | Medium |

### Quick Pattern Selection

```
What are you researching?
|
+-- A technology, library, or tool
|   +-- "What options exist?" → Technology Scan
|   +-- "How does this specific one work?" → API Investigation
|
+-- A market, product area, or business question
|   +-- "What's the competitive landscape?" → Market Analysis
|   +-- "How do competitors solve this?" → Competitive Audit
|
+-- An existing codebase or system
|   +-- "What does this code do?" → Codebase Archaeology
|   +-- "How does this API work?" → API Investigation
|
+-- Not sure yet
    → Start with Technology Scan (broadest, cheapest)
      Then narrow to the specific archetype that matches
```

Load [references/research-patterns.md](references/research-patterns.md) for complete workflows per archetype (5-7 steps, tools, output format, validation gate).

---

## Research Workflow (All Patterns)

Regardless of archetype, every research task follows this skeleton:

### Step 1: Frame the Question

Write one sentence. If you cannot, the question is too broad.

```
Good: "What ORM options exist for TypeScript serverless projects in 2026?"
Bad: "What's the best database setup?"
```

### Step 2: Identify the Archetype

Use the pattern selection tree above. Load the matching workflow from [references/research-patterns.md](references/research-patterns.md).

### Step 3: Set the Context Budget

Estimate tokens available. Divide by 4 for character budget. Never spend > 70% on fetching — reserve 30% for synthesis.

### Step 4: Execute the Research Loop

```
LOOP:
  1. Pick next hypothesis or question
  2. Select tool (see Tool Quick Reference below)
  3. Execute search/extraction
  4. Write finding immediately — never batch
  5. Check: answered? If no, refine query (max 3 attempts)
  6. Check: contradicts prior finding? If yes, flag for resolution
  7. Next hypothesis
UNTIL all questions addressed OR budget exhausted
```

### Step 5: Synthesize

Merge findings into a coherent answer. Structure depends on archetype:

| Archetype | Synthesis Output |
|-----------|-----------------|
| Technology Scan | Comparison table + recommendation |
| Market Analysis | Landscape map + positioning |
| Codebase Archaeology | Architecture diagram + dependency map |
| API Investigation | Interface contract + usage patterns |
| Competitive Audit | Feature matrix + gap analysis |

### Step 6: Validate

Every claim needs a source. Key claims need direct evidence (source code, official docs) or 2+ corroborating sources.

```
Evidence levels:
  DIRECT       → Code/docs prove it
  CORROBORATED → 2+ independent sources agree
  TESTIMONIAL  → One source says so (mark "unverified")
  ABSENCE      → No evidence found (not the same as disproved)
```

### Step 7: Deliver

Produce the artifact. Minimum structure:

1. **Executive summary** — 3-5 sentences, the answer
2. **Key findings** — numbered, each with evidence level and source
3. **Tradeoffs** — what you gave up, what you gained
4. **Gaps** — what you couldn't answer, and why
5. **Source index** — every URL, file path, or tool output consulted

---

## Tool Quick Reference

| Task | Primary Tool | Fallback |
|------|-------------|----------|
| Broad discovery | tavily-search (basic) | brave-search |
| Targeted extraction | tavily-extract | fetcher |
| Library documentation | Context7 (resolve → query) | DeepWiki |
| Repo understanding | DeepWiki | repomix pack |
| Code search | exa web search | grep |
| Recent news/releases | brave-news | tavily-search (time_range) |
| Site documentation | tavily-crawl | manual extract loop |
| Complex multi-source | tavily-research (pro) | multi-search + manual synthesize |

### Budget Rules

- Context7: resolve-library-id ONCE, then max 3 query-docs calls per library
- Tavily: start with basic depth. Escalate to advanced only when basic is insufficient
- Repomix: always use compress=true (70% reduction). Always set includePatterns
- Context > 70% consumed: stop fetching, synthesize what you have, document gaps

---

## Anti-Patterns — Stop When You Detect These

| Anti-Pattern | Detection | Fix |
|-------------|-----------|-----|
| Single-Source Synthesis | Only 1 source for a key claim | Find a second source before asserting |
| Full-Page Fetch | Reading > 50KB when you need 3 lines | Use grep + offset reading |
| Infinite Research Loop | 3rd search returns no new findings | Stop. Synthesize what you have. |
| Premature Specification | Defining function signatures during research | Write the spec idea down, return to research |
| Feature Creep in Research | Question expands beyond original scope | Write scope boundary, defer expansions |
| Solution Shopping | Only researching one option | Require 2+ alternatives before recommending |
| Context Graveyard | 30 min investigation with nothing on disk | Write findings every batch |
| Stale Cite | Source > 6 months old for current tech | Use freshness filters, re-validate |

## References (Progressive Disclosure)

Load references ONLY when the SKILL.md is insufficient for your task.

- **[Case Comparison](references/case-comparison.md)** — Side-by-side research scenarios with decision frameworks
- **[Edge Cases](references/edge-cases.md)** — Real-life edge cases with resolution workflows
- **[Requirements vs. Spec](references/requirements-vs-spec.md)** — Boundary detection and transition templates
- **[Interface Tradeoffs](references/interface-tradeoffs.md)** — Depth decisions with worked examples
- **[Brainstorming & Shaping](references/brainstorming-shaping.md)** — Findings-to-features pipeline
- **[Research Patterns](references/research-patterns.md)** — 5 archetypes with full workflows

## When NOT to Load References

| Condition | Do NOT Load | Reason |
|-----------|-------------|--------|
| Simple lookup (< 3 searches) | All references | SKILL.md has enough |
| Only need tool parameters | All references | Tool Quick Reference above is sufficient |
| Single-option evaluation | case-comparison.md, competitive patterns | No comparison needed |
| Context > 50% consumed | ALL references | Synthesize what you have, document gaps |
