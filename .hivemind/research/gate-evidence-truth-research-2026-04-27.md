# Gate-Evidence-Truth Research Report

**Date:** 2026-04-27
**Task:** Research evidence-based evaluation and verification patterns for proving runtime behavior in plugin/harness systems
**Context:** Hivemind harness `gate-evidence-truth` skill design

---

## 1. Evidence Hierarchy Patterns from Industry

### 1.1 Adapted from Medical Evidence Pyramid (GRADE System)

The GRADE framework rates evidence quality across four levels with explicit confidence ranges:
- **High:** "Lot of confidence that the true effect lies close to the estimated effect"
- **Moderate:** "True effect is likely to be close, but possibility it is substantially different"
- **Low:** "Limited confidence; true effect might be substantially different"
- **Very Low:** "Very little confidence; true effect is likely to be substantially different"

**Software adaptation** — the testing pyramid (Google, Martin Fowler) maps directly:

| Level | Medical Evidence | Software Evidence | Confidence | Cost |
|-------|-----------------|-------------------|------------|------|
| L1 (Highest) | Systematic review of RCTs | **Live runtime session in production-like environment** | Very High | Very High |
| L2 | Well-designed RCT | **Continuity/trace record from live run** | High | High |
| L3 | Cohort/case-control studies | **Integration test with real dependencies** | Moderate | Moderate |
| L4 | Case series | **Unit test / mock-based test** | Low | Low |
| L5 (Lowest) | Expert opinion | **Documentation / historical summary** | Very Low | Minimal |

### 1.2 Google Testing Pyramid (70-20-10)

Google's approach assigns explicit ratios:
- **70% Unit tests** — fast, isolated, deterministic; prove component correctness
- **20% Integration tests** — boundary verification between modules; prove contract adherence
- **10% E2E tests** — full user journey; prove system-level behavior

Source: Google's GWS team reduced emergency pushes by 50% by enforcing automated unit testing (Bender, Principal Engineer at Google).

### 1.3 OpenAI Evals Framework Structure

OpenAI's eval system separates three concerns:
1. **Data source** — structured test cases with input/output schemas (JSONL format)
2. **Testing criteria** — graders that define correctness: `match`, `includes`, `fuzzyMatch`, `score_model`
3. **Execution** — repeatable runs with different prompts/models for comparison

Key insight: "The framework separates test definition from execution. You create an eval once, then run it multiple times with different prompts or models to compare performance." (OpenAI Cookbook)

Anti-patterns from OpenAI: "Don't trust '99% accurate' claims without methodology details. No information about test datasets or evaluation procedures is a red flag."

### 1.4 Anthropic's Eval-Driven Development

Anthropic's approach (from "Demystifying Evals for AI Agents"):

- **Start with 20-50 simple tasks** drawn from real failures
- **Grade outcomes, not paths** — "Anthropic found that checking specific tool call sequences is too rigid. Agents regularly find valid approaches designers didn't anticipate."
- **Build in partial credit** — "A support agent that identifies the problem correctly but fails to process a refund is meaningfully better than one that fails immediately."
- **Three grader types:** Code-based (fast, objective), Model-based (nuanced, scalable), Human (gold standard, calibrates others)
- **Eval-driven development cycle:** Identify gaps → Create evaluations → Establish baseline → Write minimal instructions → Iterate

From Anthropic's tool evaluation cookbook: "Each evaluation prompt should be paired with a verifiable response or outcome. Your verifier can be as simple as an exact string comparison or as advanced as enlisting Claude to judge the response."

### 1.5 Proposed Hivemind Evidence Hierarchy

Adapting these patterns to the Hivemind harness context:

```
Level 1 — LIVE RUNTIME PROOF
├── Live OpenCode session executing the actual plugin
├── Observable tool calls, hook firings, delegation dispatch
├── Real continuity.ts writes, real .hivemind/ state mutations
└── Confidence: HIGHEST (the system actually ran)

Level 2 — RUNTIME ARTIFACT
├── Continuity record from a previous live run
├── Session journal with append-only event timeline
├── Delegation records with completion signals
└── Confidence: HIGH (proof it worked, but not current state)

Level 3 — INTEGRATION EVIDENCE
├── Integration tests with real module dependencies
├── Contract tests across module boundaries
├── Mock-free tests of delegation-manager + continuity
└── Confidence: MODERATE (proves interfaces, not runtime behavior)

Level 4 — UNIT EVIDENCE
├── Vitest unit tests passing
├── Type-check passing (npm run typecheck)
├── Lint passing
└── Confidence: LOW (proves component logic, not integration)

Level 5 — DOCUMENTARY EVIDENCE
├── Documentation claims
├── Historical summaries
├── Code review approvals
└── Confidence: MINIMAL (no execution proof)
```

**Decision rule:** No gate passes on Level 5 alone. Level 4 is necessary but never sufficient for integration claims. Level 3 required for module-boundary claims. Level 2 required for session-recovery claims. Level 1 required for release readiness.

---

## 2. Verification Protocol Structures

### 2.1 Anthropic's Gather → Act → Verify Pattern

From Claude Code best practices: "Gather → Act → Verify. Every time. The single most important framework. Skip verify and you're trusting first drafts."

This maps to a 3-phase verification protocol:

```
PHASE 1: GATHER
├── Read source code at the change boundary
├── Read test coverage for changed modules
├── Read dependency graph (what depends on this?)
└── Read previous verification results (if any)

PHASE 2: ACT
├── Execute the change
├── Run targeted tests at the appropriate level
├── Observe side effects at module boundaries
└── Capture execution artifacts (logs, state snapshots)

PHASE 3: VERIFY
├── Compare observed behavior against specification
├── Check no regression at dependency boundaries
├── Validate state mutations match expectations
└── Produce evidence report with artifact references
```

### 2.2 Runtime Verification (RV) Protocol

From the Runtime Verification research community:

**When to use RV vs static analysis:**
- **RV scales well** even with complex data structures; particularly useful when exhaustive design-time verification is impractical
- **RV quality depends on test scenarios** — less robust than static analysis for completeness
- **Static analysis examines without executing** — no test cases needed, but may miss runtime-only behaviors
- **Optimal: Combine both** — static analysis for completeness guarantees, RV for concrete behavior proof

From the "Static Analysis Meets Runtime Verification" Shonan meeting: "Recent years have seen the use of static analysis in the context of runtime verification to reduce the size of runtime models by pruning certain scenarios that are statically analyzed, on the other hand, the use of runtime verification in the context of static analysis to ease verification burden by deferring certain properties to be verified at runtime."

### 2.3 Proposed Step-by-Step Evaluation Workflow for `gate-evidence-truth`

```
STEP 1: CLASSIFY THE CLAIM
├── What is being claimed? (feature works, bug fixed, no regression)
├── What evidence level does this claim require?
│   ├── Runtime behavior → L1-L2
│   ├── Integration correctness → L3
│   ├── Component logic → L4
│   └── Documentation accuracy → L5 (never sufficient alone)
└── Is this a boundary-crossing claim? → If yes, require L3 minimum

STEP 2: GATHER EVIDENCE AT REQUIRED LEVEL
├── L1: Run live OpenCode session, capture tool calls + state mutations
├── L2: Read continuity records, session journals, delegation records
├── L3: Run integration tests with real dependencies
├── L4: Run unit tests, typecheck, lint
└── L5: Read documentation, code comments

STEP 3: VERIFY EVIDENCE AGAINST CLAIM
├── Does the evidence directly address the claim?
├── Is the evidence from the current session/run (not stale)?
├── Are there gaps between evidence and claim?
└── Would two independent reviewers reach the same verdict?

STEP 4: CHECK FOR HONEST COMPLETION
├── Did the agent claim "done" but skip verification?
├── Does the evidence include runtime output or just assertions?
├── Are error cases covered or just happy paths?
└── Is there evidence of regression testing at boundaries?

STEP 5: PRODUCE VERDICT
├── PASS — evidence at required level, no gaps
├── CONDITIONAL PASS — evidence sufficient but with noted gaps
├── FAIL — evidence insufficient or contradictory
└── INSUFFICIENT — no evidence at required level (don't guess)
```

---

## 3. Anti-Patterns in Evidence-Based Evaluation

### 3.1 Common Mistakes (from research)

**Anti-pattern 1: Grading paths instead of outcomes**
Anthropic explicitly warns: "Checking specific tool call sequences is too rigid. Agents regularly find valid approaches designers didn't anticipate." Grade what the agent produced, not how it got there.

**Anti-pattern 2: One-sided evaluation**
From Anthropic's web search eval experience: "If you only test whether the agent searches when it should, you might end up with an agent that searches for almost everything." Test both positive and negative cases.

**Anti-pattern 3: Accepting documentation as proof**
Documentation is Level 5 evidence. It proves intent, not behavior. Never accept documentation alone as proof of runtime correctness.

**Anti-pattern 4: Mock-only testing for integration claims**
From Martin Fowler: integration tests need to test "one integration point at a time by replacing separate services and databases with test doubles" but contract tests must also run "against real implementations." Mock-only tests prove interface compatibility, not runtime integration.

**Anti-pattern 5: LLM-as-judge without calibration**
From Partnership on AI: "LLM-as-judges often miss subtle failures such as scenarios when agents take harmful actions while appearing to follow instructions properly." Always calibrate model-based graders against human review of a sample.

**Anti-pattern 6: False confidence from synthetic benchmarks**
From Latitude's agent evaluation analysis: "Traditional eval tools will give you false confidence when you ship agents. If your agent makes 5+ tool calls per session, spawns sub-agents, or manages state across turns, you're in territory where traditional eval tools produce false confidence."

**Anti-pattern 7: Confusing test count with evidence quality**
From OpenAI best practices: "Write tests. Not too many. Mostly integration." (quoting Guillermo Rauch). 100% code coverage ≠ comprehensive behavior verification.

### 3.2 The Honest Completion Problem

This is specifically relevant to the Hivemind harness context. From multiple sources:

**The problem:** Agents claim task completion without actually verifying. From the autonomous agent failure study: "The agent faces challenges in self-correcting based on the output of its previous checks. It therefore leads to a loop of failures that ultimately exceeds the maximum attempts."

**Detection patterns:**
1. **Fresh output requirement** — Evidence must be produced in the current session, not "from earlier"
2. **Runtime output capture** — Claims must be backed by actual command output, not summaries
3. **Negative case coverage** — Happy-path-only evidence is insufficient
4. **Boundary regression check** — Must verify no breakage at module interfaces

From Partnership on AI's real-time failure detection framework: "Failure detection should not trigger just because the agent tries a path that does not work out immediately. Exploration, iteration, or partial progress is often part of intelligent behavior. Instead, detection should focus on meaningful failures, e.g., when the agent does something irrecoverable, dangerous, nonsensical, or outside its intended bounds."

---

## 4. Decision Trees for "What Evidence Is Sufficient?"

### 4.1 General Decision Tree

```
START: What type of claim?
│
├── RUNTIME BEHAVIOR CLAIM ("feature works end-to-end")
│   ├── Is there a live run? → YES: L1 evidence → PASS
│   │                     → NO: ↓
│   ├── Is there a recent continuity record? → YES: L2 → CONDITIONAL PASS (verify freshness)
│   │                                       → NO: ↓
│   └── FAIL — Must produce L1 or L2 evidence
│
├── INTEGRATION CLAIM ("modules work together")
│   ├── Are integration tests passing? → YES: L3 → Check if tests use real deps
│   │                                 → NO: ↓
│   └── Are unit tests the only evidence? → YES: FAIL (need L3 minimum)
│
├── COMPONENT CLAIM ("this function works correctly")
│   ├── Are unit tests passing? → YES: L4 → Check coverage
│   │                          → NO: ↓
│   ├── Does typecheck pass? → YES: L4 partial
│   │                       → NO: FAIL
│   └── Is this component used at boundaries? → YES: Require L3 additionally
│
├── NO-REGRESSION CLAIM ("change doesn't break existing behavior")
│   ├── Are boundary tests passing? → YES: L3+ → PASS
│   │                             → NO: ↓
│   ├── Was regression suite run? → YES: Check coverage of changed modules
│   │                            → NO: ↓
│   └── FAIL — Regression claims require execution evidence
│
└── DOCUMENTATION CLAIM ("docs describe system accurately")
    └── L5 only — NEVER sufficient for behavior claims
        └── Must be paired with L3+ execution evidence
```

### 4.2 Hivemind-Specific Decision Tree

```
START: What is being verified?
│
├── DELEGATION SYSTEM
│   ├── Claim: "Delegation dispatches correctly"
│   │   ├── L1: Live session shows delegate-task tool call → COMPLETION signal received
│   │   ├── L2: delegation-status tool returns completed record
│   │   └── L3: delegation-manager.test.ts passes with real continuity.ts
│   │
│   └── Required minimum: L3 for PR, L2 for merge, L1 for release
│
├── CONTINUITY PERSISTENCE
│   ├── Claim: "State persists across sessions"
│   │   ├── L1: Live session writes → kill → resume reads correct state
│   │   ├── L2: continuity.json contains expected state from previous run
│   │   └── L3: continuity.test.ts passes with real filesystem
│   │
│   └── Required minimum: L3 for PR, L2 for merge, L1 for release
│
├── HOOK FIRING
│   ├── Claim: "Hooks fire at correct lifecycle points"
│   │   ├── L1: Live session shows hook output in console/log
│   │   ├── L2: Session journal records hook events
│   │   └── L3: Hook integration test passes with real plugin load
│   │
│   └── Required minimum: L3 for PR, L2 for merge
│
├── CONCURRENCY CONTROL
│   ├── Claim: "Semaphore enforces concurrency limits"
│   │   ├── L3: concurrency.test.ts with parallel operations
│   │   └── L4: Unit test proving FIFO ordering
│   │
│   └── Required minimum: L4 for PR, L3 for merge
│
└── COMPLETION DETECTION
    ├── Claim: "Two-signal completion works"
    │   ├── L1: Live delegation shows both signals
    │   ├── L2: Delegation record shows completion_timestamp + result
    │   └── L3: completion-detector.test.ts with mock signals
    │
    └── Required minimum: L3 for PR, L2 for merge
```

---

## 5. Regression Detection Patterns Across Module Boundaries

### 5.1 Module-Level Regression Test Selection (RTS)

From the Google CI research (Elbaum et al.): "Module-level RTS detects changes at the level of modules. It finds all affected modules by computing the transitive closure of the changed modules in the module dependency graph." On average, this reduces testing time by 52.83% while skipping 74.17% of unaffected tests.

**Applied to Hivemind:**

```
DEPENDENCY GRAPH (simplified):
types.ts (leaf)
  ← helpers.ts, concurrency.ts, completion-detector.ts, task-status.ts
  ← continuity.ts
    ← delegation-persistence.ts
    ← delegation-manager.ts
      ← delegate-task.ts (tool)
      ← delegation-status.ts (tool)

REGRESSION RULE:
If types.ts changes → run ALL tests (everything depends on it)
If continuity.ts changes → run delegation-manager tests + persistence tests + integration tests
If delegate-task.ts changes → run tool tests only
If helpers.ts changes → run helpers tests + dependent module tests
```

### 5.2 Contract Testing for Module Boundaries

From the microservices regression patterns: "Contract testing validates service interfaces without requiring full system integration."

**Hivemind contract test pattern:**
```
For each module boundary:
1. Define the interface contract (input/output types, error shapes)
2. Test the producer side: does the module produce output matching the contract?
3. Test the consumer side: does the downstream module handle all contract cases?
4. Run contract tests on BOTH sides when either module changes
```

### 5.3 CI Pipeline Regression Gates

From CircleCI's regression testing patterns:

```
Gate 1: Unit tests + typecheck + lint
  → Runs on every commit
  → < 3 minutes
  → Catches component-level regressions

Gate 2: Integration tests + selective regression
  → Runs on PRs
  → < 10 minutes
  → Catches boundary regressions

Gate 3: Full regression suite
  → Runs on merge to main
  → Parallelized
  → Catches system-level regressions
```

### 5.4 Cross-Boundary Regression Checklist

When a module changes, verify regression at:

```
□ Direct dependents still compile
□ Direct dependents' tests still pass
□ Interface contract tests pass on both sides
□ State mutations are backward-compatible (continuity.json format)
□ Error handling still produces expected error shapes ([Harness] prefix)
□ No new circular dependencies introduced
□ Module size still under 500 LOC limit
```

---

## 6. Template Structures for Evidence Reports

### 6.1 Gate Evidence Report Template

```markdown
# Gate Evidence Report

**Date:** YYYY-MM-DD
**Gate:** [gate name]
**Claim:** [what is being claimed]
**Required Evidence Level:** [L1-L5]
**Verdict:** [PASS | CONDITIONAL_PASS | FAIL | INSUFFICIENT]

## Evidence Submitted

### Evidence Item 1
- **Level:** [L1-L5]
- **Type:** [live_run | continuity_record | integration_test | unit_test | documentation]
- **Source:** [file path or session reference]
- **Freshness:** [timestamp or "stale: X hours old"]
- **What it proves:** [specific claim this evidence addresses]

### Evidence Item 2
[repeat as needed]

## Evidence Gaps
- [ ] Gap 1: [description]
- [ ] Gap 2: [description]

## Regression Check
- [ ] Boundary: [module A ↔ module B] — [PASS/FAIL/NOT_TESTED]
- [ ] Boundary: [module C ↔ module D] — [PASS/FAIL/NOT_TESTED]

## Honest Completion Check
- [ ] Evidence includes runtime output (not just assertions)
- [ ] Error cases covered (not just happy path)
- [ ] Evidence is from current session (not stale)
- [ ] Two independent reviewers would reach same verdict

## Verdict Rationale
[1-3 sentences explaining the verdict]

## Required Actions (if FAIL/CONDITIONAL/INSUFFICIENT)
1. [action item]
2. [action item]
```

### 6.2 Minimal Evidence Template (for inline gate checks)

```markdown
## Gate: [name] — [VERDICT]
- **Evidence:** [L1-L5] — [brief description]
- **Gaps:** [none | list]
- **Actions:** [none | list]
```

### 6.3 Regression Test Selection Template

```markdown
## Regression Analysis
- **Changed module:** [module path]
- **Dependency level:** [leaf | mid | deep]
- **Tests to run:**
  - [ ] Module's own tests
  - [ ] Direct dependent tests: [list]
  - [ ] Transitive dependent tests: [list]
  - [ ] Full regression suite: [yes/no — justify]
- **Contract tests needed:** [list boundaries]
- **State compatibility check:** [needed/not needed]
```

---

## Source References

1. **GRADE Evidence Framework** — Guyatt & Sackett (1995); Wikipedia "Hierarchy of evidence"
2. **Google Testing Pyramid** — Adam Bender, GWS team; 70-20-10 model
3. **Martin Fowler Practical Test Pyramid** — martinfowler.com/articles/practical-test-pyramid.html
4. **OpenAI Evals Framework** — github.com/openai/evals; developers.openai.com/cookbook
5. **OpenAI Evaluation Best Practices** — developers.openai.com/api/docs/guides/evaluation-best-practices
6. **Anthropic "Demystifying Evals for AI Agents"** — anthropic.com/engineering/demystifying-evals-for-ai-agents
7. **Anthropic "Writing Effective Tools for Agents"** — anthropic.com/engineering/writing-tools-for-agents
8. **Anthropic Skill Authoring Best Practices** — platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
9. **Anthropic "Building Effective Agents"** — anthropic.com/research/building-effective-agents
10. **Runtime Verification** — runtimeverification.com/faq; Shonan meeting "Static Analysis Meets Runtime Verification"
11. **OpenJML + Frama-C** — "Runtime assertion checking and static verification" (CEA/HAL)
12. **Partnership on AI** — "Prioritizing Real-Time Failure Detection in AI Agents" (2025)
13. **Autonomous Agent Failures** — arxiv.org/html/2508.13143v1 "Exploring Autonomous Agents: Why They Fail"
14. **Regression Test Selection** — Shi et al. "Understanding and Improving RTS in CI"; Celik et al. "RTS Across JVM Boundaries"
15. **Google CI Regression** — Elbaum et al. "Techniques for Improving Regression Testing in Continuous Integration"
16. **Confident AI / DeepEval** — confident-ai.com/blog/llm-evaluation-metrics — task completion metrics
17. **Latitude Agent Eval** — latitude.so/blog/agent-evaluation-vs-llm-evaluation — false confidence in traditional tools
18. **Distributed Crash Recovery** — Sultan et al. "Recovering Internet Service Sessions"; Russell "Checkpointing and Rollback-Recovery"
19. **Temporal Durable Execution** — temporal.io/blog/error-handling-in-distributed-systems
20. **Grove Modular Verification** — Sharma et al. "Modular Verification of Distributed Systems" (MIT CSAIL)
