# Case Comparison

Side-by-side research scenarios. Each case pair shows two different research situations, how they differ, and how the approach changes.

---

## Case 1: Simple Lookup vs. Deep Investigation

When do you escalate from a quick search to a full investigation?

### Simple Lookup: "Does library X support TypeScript?"

| Element | Detail |
|---------|--------|
| **Scenario** | You need to know if a library has TypeScript support |
| **Approach** | Single search, check top result |
| **Tools** | Context7 resolve → query "TypeScript support", or tavily-search basic |
| **Time** | 2 minutes |
| **Output** | Yes/No + source link |
| **Decision point** | If yes → done. If no or unclear → escalate to deep investigation |

### Deep Investigation: "How mature is library X's TypeScript support?"

| Element | Detail |
|---------|--------|
| **Scenario** | You need to evaluate TypeScript maturity for a production decision |
| **Approach** | Multi-source: docs, GitHub issues, type coverage, community adoption |
| **Tools** | Context7 + DeepWiki (type definitions) + brave-search (community reports) + GitHub issues |
| **Time** | 30-60 minutes |
| **Output** | Maturity assessment with evidence: type coverage %, open type bugs, community examples |
| **Decision point** | If maturity is sufficient → recommend. If insufficient → flag as risk |

### Escalation Trigger

Move from lookup to investigation when:
- The answer affects a production decision
- Multiple people will depend on the finding
- The cost of being wrong exceeds the cost of investigating

---

## Case 2: Single-Source vs. Multi-Source Research

When is one source enough, and when do you need corroboration?

### Single-Source: "What's the API signature for `createUser`?"

| Element | Detail |
|---------|--------|
| **Scenario** | You need a factual API detail from a well-maintained library |
| **Approach** | Official docs or source code, single source |
| **Tools** | Context7 query-docs, or DeepWiki ask-question |
| **Confidence** | High — official documentation, verifiable |
| **Risk** | Low — if wrong, easy to detect (compilation/type error) |
| **Validation** | Write a test. If it compiles, the source was right. |

### Multi-Source: "Is library X production-ready for our scale?"

| Element | Detail |
|---------|--------|
| **Scenario** | You need an opinion about production readiness |
| **Approach** | Official docs + GitHub issues + community posts + benchmarks + source code |
| **Tools** | tavily-search + Context7 + DeepWiki + brave-search (news) + repomix pack (source) |
| **Confidence** | Starts low, increases with each corroborating source |
| **Risk** | High — wrong answer leads to production incidents |
| **Validation** | Evidence scoring: require Direct or 2+ Corroborated for recommendation |

### Escalation Trigger

Move from single to multi-source when:
- The question involves judgment, not fact
- The answer cannot be verified by a single test
- The claim is about performance, security, or reliability

---

## Case 3: Known Technology vs. Unknown Technology

How does research change when you're familiar vs. unfamiliar with the domain?

### Known Technology: "Compare React 19's new features vs. React 18"

| Element | Detail |
|---------|--------|
| **Scenario** | You know React. You need to understand what changed. |
| **Approach** | Changelog + migration guide + targeted search for breaking changes |
| **Tools** | Context7 (React docs) + brave-search (release notes) |
| **Depth** | Medium — you know the mental model, focus on deltas |
| **Blind spots** | Subtle behavioral changes, deprecated patterns you still use |
| **Anti-pattern risk** | Assuming behavior based on v18 knowledge without verifying v19 changes |

### Unknown Technology: "Evaluate Zig for embedded systems development"

| Element | Detail |
|---------|--------|
| **Scenario** | You don't know Zig. You need to evaluate it for a project. |
| **Approach** | Broad orientation → mental model construction → targeted evaluation |
| **Tools** | tavily-search (broad) + DeepWiki (ziglang/zig) + brave-search (community) + exa web search (tutorials) |
| **Depth** | Deep — you need to build a mental model from scratch |
| **Blind spots** | Unknown unknowns — you don't know what you don't know about Zig |
| **Anti-pattern risk** | Superficial comparison based on marketing, not technical evidence |

### Key Difference

| Dimension | Known Tech | Unknown Tech |
|-----------|-----------|--------------|
| Starting mental model | Strong | None |
| Search strategy | Targeted (deltas) | Exploratory (orientation) |
| Validation approach | Test assumptions | Build prototype |
| Time budget | Short (30 min) | Long (2-4 hours) |
| Risk of misinterpretation | Low | High |
| Required sources | 1-2 | 4+ |

---

## Case 4: Codebase-Local vs. Ecosystem-Wide Analysis

When do you stay inside the repo and when do you look outside?

### Codebase-Local: "Why does our build fail on Node 22?"

| Element | Detail |
|---------|--------|
| **Scenario** | Build works on Node 20, fails on Node 22 |
| **Approach** | Grep for Node APIs → check breaking changes → fix locally |
| **Tools** | grep + Read (hm-detective SCAN mode) + brave-search (Node 22 changelog) |
| **Scope** | This codebase, this specific error |
| **Output** | Root cause + fix |
| **Lesson** | Start local. The answer is usually in the error message and the diff. |

### Ecosystem-Wide: "Should we migrate from Webpack to Vite?"

| Element | Detail |
|---------|--------|
| **Scenario** | Evaluating a fundamental build tool change |
| **Approach** | Compare tool capabilities → check community trends → assess migration cost → validate with prototype |
| **Tools** | tavily-search (comparison) + Context7 (Vite docs) + repomix (current config complexity) + brave-search (migration reports) |
| **Scope** | Our codebase + ecosystem benchmarks + migration case studies |
| **Output** | Decision matrix with migration plan |
| **Lesson** | Ecosystem decisions need ecosystem evidence. One blog post is not enough. |

### Key Difference

| Dimension | Codebase-Local | Ecosystem-Wide |
|-----------|---------------|----------------|
| Primary evidence | Source code + error logs | Community reports + benchmarks + docs |
| Tools | grep, Read, git log | tavily-search, Context7, DeepWiki |
| Time | Minutes to hours | Hours to days |
| Reversibility | Usually easy (git revert) | Usually hard (migration) |
| Confidence needed | Medium | High |

---

## Case 5: Exploratory vs. Targeted Research

Open-ended exploration vs. answering a specific question.

### Exploratory: "What are the emerging patterns for AI agent orchestration?"

| Element | Detail |
|---------|--------|
| **Scenario** | You need to understand a nascent space with no established patterns |
| **Approach** | Broad search → cluster findings → identify patterns → validate with practitioners |
| **Tools** | tavily-search (broad) + brave-search (discussions) + exa web search (technical blogs) + GitHub search (implementations) |
| **Output** | Landscape map with pattern categories, not recommendations |
| **Confidence** | Low to medium — the space is evolving |
| **Lesson** | Resist the urge to recommend. Map the territory first. |

### Targeted: "Does Next.js 15 support parallel route segments in app router?"

| Element | Detail |
|---------|--------|
| **Scenario** | You need a specific factual answer |
| **Approach** | Official docs first → source code if docs are unclear → community if both fail |
| **Tools** | Context7 (Next.js docs) → DeepWiki (vercel/next.js) → tavily-search (community) |
| **Output** | Yes/No + code example + source |
| **Confidence** | High — factual, verifiable |
| **Lesson** | Start with the most authoritative source. Escalate only if needed. |

### Decision Table

| Question Type | Start With | If Insufficient |
|---------------|-----------|-----------------|
| Factual ("Does X support Y?") | Official docs | Source code → community |
| Comparative ("X vs Y?") | Comparison articles | Each library's docs → benchmarks |
| Evaluative ("Is X good?") | Community reports | Source code → prototype |
| Exploratory ("What's out there?") | Broad search | Cluster → validate → map |
| Diagnostic ("Why does X fail?") | Error message | Source code → issues → community |

---

## Case Comparison Decision Framework

When you encounter a research question, run through this checklist:

```
1. Is this a simple lookup or a deep investigation?
   → Quick answer: can it be resolved in < 3 searches?
   → If yes → lookup. If no → investigation.

2. Does this need one source or many?
   → Quick answer: is the source official and verifiable?
   → If yes → single source. If no → multi-source.

3. Do I know this domain or am I learning it fresh?
   → Quick answer: can I explain the core concepts without searching?
   → If yes → known tech. If no → unknown tech.

4. Is the answer inside this codebase or outside?
   → Quick answer: does the error/feature reference our code?
   → If yes → local. If no → ecosystem.

5. Am I exploring or answering a specific question?
   → Quick answer: do I have a one-sentence question?
   → If yes → targeted. If no → exploratory.
```

Every research task touches at least one of these dimensions. Most touch two or three. Map your task before you start searching.
