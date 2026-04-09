# Stage 1: Framing

Deep dive on research framing — the most critical stage. A well-framed research question determines whether the remaining stages succeed or waste context budget.

---

## Writing the Research Question

The research question must be ONE sentence. Not two. Not a paragraph. One sentence with a subject, a predicate, and a scope boundary.

### Examples by Research Type

**Discovery** — "Does a production-ready WebSocket library exist for Rust that supports message batching?"

**Technical** — "How does Vercel's AI SDK handle streaming tool calls in the useChat hook?"

**Comparative** — "Which ORM between Prisma, Drizzle, and Kysely provides the best TypeScript type inference for PostgreSQL composite types?"

**Diagnostic** — "Why does the session recovery loop in lifecycle-manager.ts fail after 3 retries on network timeout?"

**Feasibility** — "Can we build a plugin hot-reload system using Node.js worker threads without file locking on macOS?"

**Audit** — "What is the full dependency graph of the plugin initialization path in hivemind-plugin, and which modules have circular dependencies?"

### Bad Research Questions

| Bad Question | Why It Fails | Fixed Version |
|-------------|-------------|---------------|
| "Tell me about databases" | No scope, no subject | "Which embedded database provides the best write throughput for TypeScript Node.js apps handling 10K writes/sec?" |
| "Compare everything about React and Vue" | No dimension, no criteria | "How do React Server Components and Vue's upcoming Vapor mode compare for SSR performance on data-heavy dashboards?" |
| "Fix the bug" | No diagnostic context | "Why does the circuit breaker in concurrency.ts trip on every 4th request when the semaphore is set to 5?" |

---

## Hypothesis Formation

Write 3-5 hypotheses BEFORE starting research. Each hypothesis must be falsifiable — you must be able to find evidence that disproves it.

### Discovery Scenario: "Does X exist?"

Hypotheses:
1. X exists as a standalone npm package with >1000 weekly downloads
2. X exists but is bundled inside a larger framework (undiscoverable via direct search)
3. X does not exist, but equivalent functionality can be composed from 2-3 smaller libraries
4. X does not exist and no composition of existing tools provides equivalent functionality

### Technical Scenario: "How does X work?"

Hypotheses:
1. X works via a pub/sub pattern with async iterators (based on export names)
2. X works via a polling mechanism with configurable intervals
3. X delegates to an external service via HTTP API calls
4. X uses a callback-based event system with middleware chains

### Comparative Scenario: "Compare X vs Y vs Z"

Hypotheses:
1. X leads in type safety, Y leads in performance, Z leads in developer experience
2. All three use similar underlying patterns but differ in API surface area
3. X and Y share a common ancestor library, Z is architecturally different
4. None of them handle edge case [specific scenario], requiring custom work

### Diagnostic Scenario: "Why is X broken?"

Hypotheses:
1. Race condition between two concurrent state updates (temporal)
2. Incorrect error propagation swallowing the real failure (structural)
3. Dependency version mismatch causing API incompatibility (environmental)
4. Off-by-one error in retry counter causing premature termination (logical)

### Feasibility Scenario: "Can we build X?"

Hypotheses:
1. X is buildable with current platform APIs and no native modules
2. X requires native modules but has precedents in existing libraries
3. X is blocked by a known platform limitation with no workaround
4. X is technically possible but would require unacceptable performance tradeoffs

### Audit Scenario: "Map architecture of X"

Hypotheses:
1. X follows a clean layered architecture with unidirectional dependencies
2. X has 2-3 circular dependencies in core modules
3. X's module boundaries don't match its directory structure
4. X has dead code paths that are never exercised in production

---

## Context Budget Estimation

### Formula

```
Available context (tokens) = Platform context window - System prompt - Conversation history
Usable chars = Available tokens x 4 (approx chars per token)
Research budget = Usable chars x 0.6 (reserve 40% for output and synthesis)
```

### Concrete Examples

| Context Window | After System/History | Research Budget (chars) | Equivalent |
|---------------|---------------------|------------------------|------------|
| 200,000 tokens | 150,000 available | 360,000 chars (~360KB) | ~3-4 large files or 1 repomix pack |
| 128,000 tokens | 80,000 available | 192,000 chars (~192KB) | ~2 medium files or compressed repomix |
| 32,000 tokens | 20,000 available | 48,000 chars (~48KB) | ~1 medium file, heavy grep usage |

### Budget Allocation per Stage

| Stage | Budget % | Purpose |
|-------|---------|---------|
| Stage 1: Framing | 5% | Write plan, set scope |
| Stage 2: Domain Research | 50% | Search, extract, read docs |
| Stage 3: Cross-Tech | 30% (if needed) | Delegate, collect results |
| Stage 4: Synthesis | 15% | Write report, verify citations |

---

## Tool Bundle Selection Decision Tree

```
What is the research type?
|
+-- Discovery
|   |
|   +-- Web-first topic (library, SaaS, framework)?
|   |   -> tavily-search (basic) -> Context7 -> DeepWiki
|   |
|   +-- Code-first topic (pattern, implementation)?
|       -> grep/glob -> codesearch -> repomix pack
|
+-- Technical
|   |
|   +-- Library/framework API?
|   |   -> Context7 (resolve -> query) -> tavily-extract (official docs)
|   |
|   +-- Internal codebase?
|   |   -> repomix pack (compressed) -> grep -> read (offset)
|   |
|   +-- External service behavior?
|       -> tavily-search -> tavily-extract (API docs) -> fetcher (live endpoint)
|
+-- Comparative
|   |
|   +-- Comparing libraries?
|   |   -> Context7 per library (parallel resolve) + tavily-search for benchmarks
|   |
|   +-- Comparing architectures?
|       -> repomix pack per codebase -> grep for patterns -> cross-reference
|
+-- Diagnostic
|   |
|   +-- Runtime error?
|   |   -> grep error message -> read surrounding code -> git log for recent changes
|   |
|   +-- Type error?
|   |   -> grep type definition -> read interface -> trace imports
|   |
|   +-- Performance issue?
|       -> grep hot path -> repomix pack (focused) -> count operations
|
+-- Feasibility
|   |
|   +-- New feature with known libraries?
|   |   -> Context7 for each library -> code search for patterns -> combine
|   |
|   +-- Novel approach?
|       -> tavily-search for academic/industry precedent -> Context7 for tools -> repomix for codebase constraints
|
+-- Audit
    |
    +-- Architecture audit?
    |   -> repomix pack (compressed, full) -> grep for imports/exports -> map deps
    |
    +-- Security audit?
        -> grep for patterns (eval, exec, sql, auth) -> read matches -> tavily-search for CVEs
```

---

## Research Plan Template Walkthrough

Use `references/research-plan-template.md` as the starting structure. Fill each section:

1. **Research Question**: One sentence from the examples above.
2. **Research Type**: One of Discovery, Technical, Comparative, Diagnostic, Feasibility, Audit.
3. **Hypotheses**: 3-5 falsifiable statements from the hypothesis bank above.
4. **Tool Bundle**: Primary + fallback from the decision tree.
5. **Context Budget**: Calculate using the formula. Write exact token counts.
6. **Scope**: What to include (specific files, domains, URLs) and exclude (unrelated modules, out-of-scope topics).
7. **Success Criteria**: Checkbox items that define "done."

### Example Filled Plan (Discovery)

```markdown
# Research Plan: Production WebSocket Library for Rust

## Research Question
Does a production-ready WebSocket library exist for Rust that supports message batching?

## Research Type
Discovery

## Hypotheses
1. tokio-tungstenite is the standard and supports batching
2. A batching wrapper exists on top of tungstenite
3. No Rust WebSocket library supports batching natively; must build custom
4. The batching pattern is better served by a message queue library

## Tool Bundle
Primary: tavily-search -> Context7 -> code search
Fallback: brave-search -> DeepWiki

## Context Budget
Available: 150,000 tokens
Allocated: 90,000 tokens (60%)
Remaining: 60,000 tokens (40% reserved)

## Scope
Include: Rust WebSocket libraries, message batching patterns, tokio ecosystem
Exclude: WebSocket client libraries in other languages, raw TCP libraries

## Success Criteria
- [x] All hypotheses addressed
- [ ] Key claims have Direct evidence
- [ ] Synthesis report delivered
```

---

## Gate Check Before Proceeding

Run this checklist. Every item must pass before moving to Stage 2:

- [ ] Research question is one sentence with clear scope
- [ ] Research type identified (Discovery, Technical, Comparative, Diagnostic, Feasibility, Audit)
- [ ] 3-5 hypotheses written and falsifiable
- [ ] Context budget calculated with exact numbers
- [ ] Tool bundle selected (primary + fallback)
- [ ] Scope boundaries defined (include AND exclude)
- [ ] Success criteria written as checkable items
- [ ] research-plan.md written to disk

If any item fails, resolve it before proceeding. A bad frame produces bad research.
