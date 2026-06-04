# Interface Tradeoffs

During research, you investigate interfaces — APIs, type boundaries, module contracts, public exports. The question is always: how deep do I go? This reference gives you a decision framework and worked examples.

---

## The Decision Framework

Every interface investigation has four dimensions. Assess them before you start digging.

### 1. SCOPE — What surface area does this cover?

| Scope | Definition | Reading Mode | Time |
|-------|-----------|-------------|------|
| Single function | One API endpoint, one method | SCAN | 5 min |
| Module boundary | Public exports of one module | SCAN → DEEP on exports | 30 min |
| Cross-module | Interfaces between 2+ modules | DEEP on boundaries, SKIM on internals | 1-2 hours |
| System-level | External API surface, protocol | DEEP on contracts, Focused compression | 2-4 hours |

### 2. DEPTH — How much understanding is needed?

| Question | Depth | Approach |
|----------|-------|----------|
| "What does it do?" | Surface | SKIM: read the type signature + JSDoc |
| "How does it work?" | Medium | SCAN: read the implementation, trace happy path |
| "Can I change it?" | Deep | DEEP: read implementation, all callers, all tests |
| "Is it safe to remove?" | Full | DEEP: every dependent, every usage, every test, migration path |

### 3. CONFIDENCE — How sure do you need to be?

| Decision Type | Confidence Required | Evidence Needed |
|---------------|-------------------|-----------------|
| Exploration | Low | 1 source, mark as hypothesis |
| Architecture planning | Medium | 2 sources, interface extraction |
| Production decision | High | 3+ sources, working prototype |
| Breaking change | Very high | Source code + tests + dependents + migration path |

### 4. STOP CONDITION — When do you stop investigating?

```
Match confidence to reversibility:

Easy to reverse (config change, wrapper function)
  → Low confidence is fine → stop after SCAN

Medium to reverse (library swap, new dependency)
  → Medium confidence needed → stop after SCAN + 1 validation

Hard to reverse (database migration, protocol change)
  → High confidence needed → stop only after DEEP + prototype + test

Irreversible (data format change, public API)
  → Very high confidence → stop only after full analysis + review
```

---

## Worked Example 1: Investigating a Library's Error Handling

**Scenario**: You're evaluating a logging library. Need to understand how it handles errors before committing.

### SCOPE: Module boundary (public error types + behavior)
### DEPTH: Medium (how does it work, not can we change it)
### CONFIDENCE: Medium (architecture planning, not production yet)

```
Step 1 (SKIM): grep -rn "error\|Error\|catch" src/ --include="*.ts" | wc -l
  → 47 matches across 6 files

Step 2 (SCAN): grep -n "export.*Error\|class.*Error" src/ --include="*.ts"
  → 3 exported error types: ValidationError, TransportError, ConfigError

Step 3 (SCAN): For each error type, read ±20 lines
  → ValidationError: thrown on invalid log format, has .details field
  → TransportError: thrown on write failure, has .retryable flag
  → ConfigError: thrown on bad config, has .field path

Step 4 (DEEP): grep -n "catch" src/ --include="*.ts"
  → Library catches all transport errors internally, retries if .retryable
  → Validation errors propagate to caller
  → Config errors throw during initialization

Step 5 (STOP): Confidence = Medium. Decision = proceed.
  → Error model is well-structured
  → Retry behavior is documented in code
  → No surprises in error propagation
```

**Cost**: ~150 lines of context. ~20 minutes.

---

## Worked Example 2: Evaluating a Module Boundary for Extraction

**Scenario**: A 600-line file needs to be split. You need to understand the interface between two logical sections before proposing the split.

### SCOPE: Cross-module (interface between two logical sections)
### DEPTH: Deep (can we change it — this is a restructuring decision)
### CONFIDENCE: High (production decision — this will be committed)

```
Step 1 (SKIM): grep -n "^export\|^function\|^class" file.ts
  → 8 exports, 12 functions, 2 classes

Step 2 (SCAN): Identify which exports belong to which logical section
  → Section A (lines 1-320): 5 exports, state management
  → Section B (lines 321-600): 3 exports, persistence layer

Step 3 (DEEP): Find the interface between A and B
  → Section A imports nothing from B
  → Section B imports 2 functions from A: getState, setState
  → Section B imports 1 type from A: StateConfig

Step 4 (DEEP): Find all callers of both sections
  → grep -rn "import.*from.*file" src/ --include="*.ts"
  → 5 files import from Section A
  → 3 files import from Section B
  → No file imports from both

Step 5 (STOP): Confidence = High. Decision = split is safe.
  → Interface is 2 functions + 1 type
  → No shared callers
  → Clean dependency direction (B depends on A, not vice versa)
```

**Cost**: ~300 lines of context. ~45 minutes.

---

## Worked Example 3: Deciding Whether to Investigate Deeper

**Scenario**: You're researching a new API. You've found the endpoint docs but something feels off — the response shape doesn't match what you'd expect.

### Decision: Stop or Keep Digging?

| Factor | Assessment |
|--------|-----------|
| Decision importance | Medium (feature design, not production) |
| Reversibility | Medium (can change API wrapper later) |
| Current confidence | Low (docs look wrong) |
| Time to increase confidence | 15 min (read source code) |

**Decision**: Keep digging. Low confidence + medium reversibility = justify 15 min more investigation.

```
Step 1: Check if DeepWiki has the repo analyzed
  → Yes. Ask: "What is the response shape for endpoint /api/v2/users?"
  → Response matches your suspicion, not the docs

Step 2: Flag the documentation as potentially incorrect
  → Note: "Docs say X, source shows Y. Trusting source."

Step 3: Proceed with source-derived understanding
  → Mark docs-derived findings as "per docs, unverified"
  → Mark source-derived findings as "verified against source"
```

**Cost**: ~50 lines of context. ~15 minutes.

---

## The Stop-or-Continue Checklist

When you're mid-investigation and unsure whether to go deeper:

```
1. What decision depends on this finding?
   → No decision → STOP, note what you found
   → Low-stakes decision → STOP at current confidence
   → High-stakes decision → CONTINUE to next depth level

2. How much time will deeper investigation cost?
   → < 15 min → Usually worth it
   → 15-60 min → Worth it for medium+ stakes
   → > 60 min → Only for high-stakes, irreversible decisions

3. How much additional confidence will it provide?
   → Marginal → STOP
   → Significant → CONTINUE
   → Unknown → Do 15 min more, then reassess

4. Is the information available at all?
   → Yes, in source code → CONTINUE
   → Yes, but needs prototype → Estimate prototype time, decide
   → No, doesn't exist → STOP, document as gap
```

---

## Interface Investigation Anti-Patterns

| Anti-Pattern | What Happens | Fix |
|-------------|-------------|-----|
| **Depth without scope** | Reading implementation before understanding the boundary | Always SKIM the public surface first |
| **Confidence mismatch** | High-confidence investigation for a low-stakes decision | Match investigation depth to decision stakes |
| **Scope overreach** | Investigating internal implementation when you only need the public API | Start with exports, dig into internals only when needed |
| **Premature abstraction** | Designing interfaces based on incomplete research | Complete research first, design after |
| **Missing the callers** | Understanding the interface but not who uses it | Always grep for dependents before drawing boundaries |
| **One-sided analysis** | Understanding the provider but not the consumer | Investigate both sides of every interface |
