---
name: use-hivemind-ideating
description: Meta-skill that turns vague ideas into validated, architecture-evaluated features through structured brainstorming, multi-agent review, cross-stack research, and quality gating.
parent: use-hivemind
---

# use-hivemind-ideating

## Table of Contents

- [Load Position](#load-position)
- [When to Load](#when-to-load)
- [Skill Chain Position](#skill-chain-position)
- [Core Pipeline](#core-pipeline)
- [Phase 0: Intent Gate](#phase-0-intent-gate)
- [Phase 1: Ideation Intake](#phase-1-ideation-intake)
- [Phase 2: Idea Generation](#phase-2-idea-generation)
- [Phase 3: Cross-Stack Research](#phase-3-cross-stack-research)
- [Phase 4: Multi-Agent Review](#phase-4-multi-agent-review)
- [Phase 5: Feature Quality Gate](#phase-5-feature-quality-gate)
- [Phase 6: Documentation](#phase-6-documentation)
- [Phase 7: Handoff to Planning](#phase-7-handoff-to-planning)
- [Scope Classification](#scope-classification)
- [Intent Routing Map](#intent-routing-map)
- [MCP Tool Selection](#mcp-tool-selection)
- [Swarm Orchestration](#swarm-orchestration)
- [Anti-Patterns](#anti-patterns)
- [Sibling Skills](#sibling-skills)
- [Bundled Resources](#bundled-resources)
- [Activity Output](#activity-output)

## Load Position

**Layer: Domain** — ideation. `use-hivemind` must be loaded first. `use-hivemind-delegation` must be loaded for shared resource access.

| Constraint | Rule |
|-----------|------|
| Position | Domain layer |
| Load order | After `use-hivemind` (entry router) |
| Prerequisites | `use-hivemind` loaded, `use-hivemind-delegation` available for shared scripts |
| Depth companions | `use-hivemind-research`, `hivemind-synthesis` |

## When to Load

- User has a vague idea or wants to brainstorm
- User needs to validate a feature concept before committing
- User asks "what should we build?" or "I'm thinking about..."
- User wants to evaluate approaches before choosing one
- User explicitly triggers ideating mode
- Intent Gate classifies request as evaluation or open-ended

## Skill Chain Position

```
use-hivemind (router)
  → use-hivemind-ideating (this skill — ideas → validated features)
    ↗ use-hivemind-research (external evidence gathering)
    ↗ hivemind-synthesis (multi-source compression)
    → use-hivemind-planning (validated → decomposed plan)
    → use-hivemind-delegation (plan → dispatched slices)
    → hivemind-gatekeeping (loop control + evidence gates)
```

## Core Pipeline

Seven phases, sequential, gated between each.

| Phase | Name | Input | Output | Gate |
|-------|------|-------|--------|------|
| 0 | Intent Gate | Raw user message | Classified intent + routing | Intent verbalized |
| 1 | Ideation Intake | Classified intent | Scope classification + vocabulary map | Scope confirmed |
| 2 | Idea Generation | Scope + vocabulary | 2-3 approaches with pros/cons | Understanding Lock passed |
| 3 | Cross-Stack Research | Approaches | External evidence, repo analysis | Evidence threshold met |
| 4 | Multi-Agent Review | Evidence + approaches | Reviewer dispositions (APPROVED/REVISE/REJECT) | ≥1 APPROVED approach |
| 5 | Feature Quality Gate | Approved approach + evidence | Scored viability + creep check | Score ≥ threshold |
| 6 | Documentation | All prior outputs | Requirements doc + Decision Log + 10x Analysis | Artifacts validate |
| 7 | Handoff to Planning | Validated documentation | Planning-ready packet | Exit criteria all true |

## Phase 0: Intent Gate

Every ideation session begins with explicit intent classification. Never assume intent from prior turns.

### Step 0: Intent Verbalization

Before any action, verbalize what you detect:

> "I detect a **[research / implementation / investigation / evaluation / fix / open-ended]** request — [reason]. My approach: **[explore → answer / plan → execute / clarify first / etc.]**."

### Step 1: Request Type Classification

| Type | Signal | Depth |
|------|--------|-------|
| Trivial | Single fact, known area | Answer directly, skip pipeline |
| Explicit | Clear goal, known scope | Lightweight mode |
| Exploratory | "What if...", "Should we..." | Standard mode |
| Open-ended | "I want to...", "How might we..." | Standard or Deep |
| Ambiguous | Unclear goal, contradictory signals | Clarify first (Phase 0 loop) |

### Step 1.5: Turn-Local Intent Reset (MANDATORY)

**Re-classify from the current message only.** Prior turn context informs but never overrides. Even if the previous turn was implementation, the current message may be research.

Enforcement rules:
- Ignore accumulated context when classifying the current message
- Look at the user's exact words, not the conversation history
- If the message could be multiple types, pick the highest-priority match from the routing table
- Log the re-classification to activity output

### Step 2: Ambiguity Check

If intent is ambiguous, ask ONE clarifying question. Do not proceed until resolved.

Questions to ask:
- "Are you asking me to research this, or do you want to start building it?"
- "Is this a quick question or are you exploring a new feature?"
- "Should I investigate the current state first, or are you proposing a change?"

### Step 2.5: Context-Completion Gate

Before proceeding to Phase 1, ALL three conditions must be true:

| # | Condition | Check |
|---|-----------|-------|
| 1 | User's goal is stated or inferable | Can I write a one-sentence problem statement? |
| 2 | Relevant context is available | Do I know the domain, stack, and constraints? |
| 3 | No blocking ambiguity remains | Are there zero unresolved HIGH-IMPACT questions? |

If any condition fails → ask one targeted question. Do not batch questions.

### Step 3: Validation Before Acting

**Assumptions Check:** List any assumptions you're making. If more than 2, ask the user to confirm.

**Delegation Check:** Can this be answered inline in <3 actions? If yes, handle directly and skip the pipeline.

### When to Challenge the User

- User proposes adding a feature that duplicates existing functionality → flag it
- User wants to skip research for a cross-stack change → push back
- User is solving a symptom, not the root cause → reframe the problem
- User's scope keeps expanding during dialogue → invoke creep prevention early

Extended examples and edge cases: see [references/intent-gate-protocol.md](references/intent-gate-protocol.md).

## Phase 1: Ideation Intake

Classify scope and build vocabulary map.

### Scope Classification

| Mode | When | Depth | Agents | Duration |
|------|------|-------|--------|----------|
| Lightweight | Single-concern, known area | 1-2 questions | Self | 1-2 turns |
| Standard | Multi-concern, needs validation | 3-5 questions | 1 reviewer | 3-5 turns |
| Deep | Cross-stack, architectural impact | Full pipeline | Full swarm | 5-10 turns |

### Vocabulary Map

For every session, build a vocabulary map:

1. List core terms the user uses
2. Map synonyms and variants
3. Note any domain-specific jargon
4. Identify depth indicators (how deep the user wants to go)

Template: [templates/vocabulary-map.md](templates/vocabulary-map.md).

### Gate: Scope Confirmed

- Scope classification is recorded in the ideation session
- Vocabulary map has ≥3 core terms
- User has confirmed the scope level (Lightweight/Standard/Deep)

Detailed dialogue rules: see [references/brainstorming-pipeline.md](references/brainstorming-pipeline.md).

## Phase 2: Idea Generation

One-question-at-a-time dialogue. Never batch questions.

### Dialogue Rules

1. Ask ONE question per turn
2. Wait for the answer before asking the next
3. Build understanding incrementally
4. Generate 2-3 approaches only after sufficient context
5. Each approach has: name, description, pros, cons, estimated complexity

### Approach Generation Template

For each approach:
```markdown
### Approach N: <Name>
**Description:** <one paragraph>
**Pros:**
- <pro 1>
- <pro 2>
**Cons:**
- <con 1>
- <con 2>
**Estimated Complexity:** <Low/Medium/High>
```

### Understanding Lock (Hard Gate)

Before proceeding to research, explicitly confirm with the user:

> "I understand the problem as: <problem statement>. I'm considering these approaches:
> 1. <Approach 1 summary>
> 2. <Approach 2 summary>
> Should I proceed with research, or would you like to adjust anything?"

Do NOT proceed until the user confirms. This is a hard gate.

Decision Log is started here. Template: [templates/decision-log.md](templates/decision-log.md).

## Phase 3: Cross-Stack Research

Gather external evidence to validate or challenge approaches.

### Research Mode Selection

| Mode | When | Sources | Depth |
|------|------|---------|-------|
| Quick | Lightweight scope, single library | Context7 or single web search | Surface API |
| Standard | Standard scope, known stack | Context7 + 1 web source | API + patterns |
| Deep | Deep scope, cross-stack | Full MCP chain | Architecture + tradeoffs |
| UltraDeep | Novel territory, no prior art | Full chain + Repomix + DeepWiki | Full evidence package |

### MCP Tool Chaining Rules

1. **Exa / Tavily / Brave** — sequential, NEVER parallel (rate limit)
2. **Context7** — resolve-library-id first, then query-docs (max 3 calls per question)
3. **DeepWiki** — any time for architecture questions
4. **Repomix** — after identifying target repos for deep analysis
5. **GitHub MCP** — any time for code pattern search

### Evidence Triangulation

Minimum 2 sources for any claim that influences a decision. Single-source claims are labeled "unverified."

Extended MCP protocols: see [references/cross-stack-research-integration.md](references/cross-stack-research-integration.md).

### Gate: Evidence Threshold Met

| Scope | Minimum Sources | Minimum Verified Claims |
|-------|----------------|------------------------|
| Lightweight | 1 | 1 |
| Standard | 2 | 2 |
| Deep | 3 | 3 |

## Phase 4: Multi-Agent Review

Three reviewer roles evaluate the approach.

### Reviewer Roles

| Role | Focus | May NOT |
|------|-------|---------|
| Skeptic | Assume the design will fail. Find the weakest points. | Propose new features |
| Constraint Guardian | Check NFRs: performance, security, scalability, maintainability | Debate product goals |
| User Advocate | Cognitive load, usability, developer experience, onboarding | Redesign architecture |

### Disposition Types

| Disposition | Criteria |
|-------------|----------|
| APPROVED | No blocking objections, all concerns addressed or deferred |
| REVISE | Specific blocking concerns that can be addressed within scope |
| REJECT | Fundamental flaw, scope mismatch, or infeasible approach |

### Dispatch Protocol

For Standard scope: dispatch 1 reviewer (Skeptic).
For Deep scope: dispatch all 3 reviewers via `use-hivemind-delegation` investigation swarm.

Each reviewer receives:
- The proposed approach
- Research evidence collected
- A specific review focus area
- Constraints: may NOT expand scope

Extended review protocol: see [references/multi-agent-review.md](references/multi-agent-review.md).

### Gate: ≥1 APPROVED Approach

- If all approaches are REJECTED → return to Phase 2 with feedback
- If all are REVISE → address concerns and re-review
- If ≥1 APPROVED → proceed to quality gate

## Phase 5: Feature Quality Gate

Two checks before documentation.

### Check 1: Creep Prevention (5 Questions)

| # | Question | Pass Criteria |
|---|----------|---------------|
| 1 | Does this solve a real, validated problem? | Problem is user-stated or evidence-backed |
| 2 | Is this aligned with the current product direction? | Consistent with existing architecture |
| 3 | What is the measurable impact? | Impact can be quantified or qualified clearly |
| 4 | Is the complexity proportional to the value? | Complexity score ≤ value score |
| 5 | Final gut check — would we build this if it were harder? | Honest assessment, no sunk-cost bias |

### Check 2: 10x Viability Scoring

Score each criterion: 🔥 Exceptional / 👍 Strong / 🤔 Uncertain / ❌ Weak

| Criterion | What to Evaluate |
|-----------|-----------------|
| Impact | How much value does this create? |
| Reach | How many users/scenarios does this affect? |
| Frequency | How often will this be used? |
| Differentiation | Does this set the product apart? |
| Defensibility | Is this hard for competitors to replicate? |
| Feasibility | Can we build this with current resources? |

### Scoring Helper

```bash
bash scripts/score-idea-viability.sh --input scores.json
```

Thresholds: ≥0.7 PASS | 0.4-0.69 CONDITIONAL | <0.4 FAIL.

### Gate: Score ≥ Threshold

- PASS → proceed to documentation
- CONDITIONAL → document concerns, may proceed with caveats
- FAIL → return to Phase 2 with scoring feedback

Extended gate reference: see [references/feature-quality-gates.md](references/feature-quality-gates.md).

## Phase 6: Documentation

Generate three artifacts from all prior phases.

### Artifact 1: Requirements Document

Structured requirements with stable IDs (R1, R2, R3...).
Template: [templates/requirements-document.md](templates/requirements-document.md).

### Artifact 2: Decision Log

Every decision made during the session, with alternatives and rationale.
Template: [templates/decision-log.md](templates/decision-log.md).

### Artifact 3: 10x Analysis

Full viability analysis with scoring and priority recommendation.
Template: [templates/ten-x-analysis.md](templates/ten-x-analysis.md).

### Gate: Artifacts Validate

Run validation:
```bash
bash scripts/hm-ideating-validate.sh <artifact-path>
```

All three artifacts must pass validation.

## Phase 7: Handoff to Planning

Package everything for `use-hivemind-planning`.

### Exit Criteria (ALL must be true)

| # | Criterion |
|---|-----------|
| 1 | All HIGH-IMPACT ambiguity resolved |
| 2 | Requirements doc has stable IDs (R1, R2, R3...) |
| 3 | Decision Log has dispositions for all key decisions |
| 4 | Feature quality gate passed (PASS or CONDITIONAL with caveats) |
| 5 | No pending reviewer objections |

### Handoff Packet Format

References `use-hivemind-delegation/templates/delegation-packet.md`:
```json
{
  "session_id": "<ideation-session-id>",
  "scope": "<Lightweight|Standard|Deep>",
  "requirements_doc_path": "<path>",
  "decision_log_path": "<path>",
  "ten_x_analysis_path": "<path>",
  "approved_approach": "<approach summary>",
  "open_questions": [],
  "exit_criteria_met": true
}
```

### Bash: Validate Handoff Readiness

```bash
bash scripts/hm-ideating-validate.sh .hivemind/activity/ideating/{session-id}/
```

Extended handoff protocol: see [references/handoff-to-planning.md](references/handoff-to-planning.md).

## Intent Routing Map
| Intent | Signal Words | Route | Ideation Mode |
|--------|-------------|-------|---------------|
| Research | "explain", "how does", "what is" | Explore → Answer | Lightweight or inline |
| Implementation | "add", "create", "build", "implement" | Plan → Execute | Lightweight |
| Investigation | "check", "why", "debug", "failing" | Isolate → Diagnose | Inline (not ideation) |
| Evaluation | "what do you think", "should we", "compare" | Clarify → Evaluate | Standard |
| Fix | "broken", "error", "crash", "regression" | Diagnose → Fix | Inline (not ideation) |
| Open-ended | "refactor", "migrate", "redesign", "rebuild" | Clarify → Ideate | Standard or Deep |

## MCP Tool Selection

| Need | Tool | When | Rate Limit |
|------|------|------|-----------|
| Web discovery | Exa / Tavily / Brave | External evidence needed | Sequential, NEVER parallel |
| Library docs | Context7 | Version-specific API patterns | resolve-library-id first, max 3 calls/question |
| Repo Q&A | DeepWiki | Architecture questions | Any time |
| Repo packaging | Repomix | Full repo analysis needed | After identifying target repo |
| Code search | GitHub MCP | Pattern search, file contents | Any time |

Extended selection guide: see [references/mcp-tool-selection-matrix.md](references/mcp-tool-selection-matrix.md).

## Swarm Orchestration

For Deep scope, use multi-wave investigation:

```
Wave 1: Investigation (explore agents — read-only codebase scan)
  → Carry forward ≤5 key findings
Wave 2: Research (general agents — MCP tool evidence gathering)
  → Carry forward ≤5 evidence items
Wave 3: Synthesis (general agents — compress and grade)
  → Carry forward synthesis report
Wave 4: Verification (explore agents — cross-check claims)
  → Final evidence package
```

Dispatch via `use-hivemind-delegation` investigation swarm protocol.
Extended orchestration: see [references/swarm-orchestration.md](references/swarm-orchestration.md).

## Anti-Patterns

1. **Skipping Intent Gate** and assuming implementation — always classify first
2. **Batching questions** during brainstorming — one question at a time, always
3. **Proceeding past Understanding Lock** without explicit user confirmation — hard gate, no exceptions
4. **Skipping creep check** for "simple" features — every feature gets the 5-question check
5. **Trusting single-source research** without triangulation — minimum 2 sources for decisions
6. **Running Exa/Tavily/Brave in parallel** — rate limit violation, always sequential
7. **Proceeding to planning** with unresolved HIGH-IMPACT ambiguity — all must be resolved
8. **Documenting approaches before research** evidence is collected — research first, document second
9. **Letting scope expand mid-session** without re-classification — invoke creep prevention
10. **Dispatching reviewers** without evidence package — reviewers need context to be effective

## Sibling Skills

| Skill | Relationship |
|-------|-------------|
| `use-hivemind` | Router that triggers this skill |
| `use-hivemind-delegation` | Shared scripts/templates, swarm dispatch protocol |
| `use-hivemind-research` | External evidence gathering pipeline for Phase 3 |
| `hivemind-synthesis` | Multi-source compression for Phase 3 evidence |
| `use-hivemind-planning` | Handoff target — validated docs feed planning |
| `hivemind-gatekeeping` | Loop control if ideation needs iteration |

## Bundled Resources

| Resource | Path | Purpose |
|----------|------|---------|
| **SKILL.md** | `SKILL.md` | Entry point (this file) |
| Intent Gate Protocol | `references/intent-gate-protocol.md` | Extended intent classification |
| Brainstorming Pipeline | `references/brainstorming-pipeline.md` | Detailed dialogue rules |
| Multi-Agent Review | `references/multi-agent-review.md` | Reviewer dispatch protocol |
| Feature Quality Gates | `references/feature-quality-gates.md` | Creep check + 10x scoring |
| Cross-Stack Research | `references/cross-stack-research-integration.md` | MCP tool chaining guide |
| Swarm Orchestration | `references/swarm-orchestration.md` | Multi-wave investigation |
| MCP Tool Selection | `references/mcp-tool-selection-matrix.md` | Extended tool guide |
| Handoff to Planning | `references/handoff-to-planning.md` | Exit criteria + handoff |
| Ideation Session | `templates/ideation-session.md` | Session tracking template |
| Requirements Document | `templates/requirements-document.md` | Structured requirements |
| Decision Log | `templates/decision-log.md` | Decision tracking template |
| 10x Analysis | `templates/ten-x-analysis.md` | Viability analysis template |
| Vocabulary Map | `templates/vocabulary-map.md` | Term mapping template |
| Validate Script | `scripts/hm-ideating-validate.sh` | Artifact validation |
| Score Viability | `scripts/score-idea-viability.sh` | Idea scoring helper |
| Research Readiness | `scripts/check-research-readiness.mjs` | MCP tool readiness check |
| Lightweight Test | `tests/lightweight-ideation.md` | Lightweight scope test |
| Standard Test | `tests/standard-ideation.md` | Standard scope test |
| Deep Test | `tests/deep-ideation.md` | Deep scope test |
| Intent Gate Test | `tests/intent-gate-classification.md` | Intent classification test |

## Activity Output

```
Pathing: .hivemind/activity/ideating/{session-id}/
Naming: {category}-{semantic-id}-{YYYY-MM-DD}.{ext}
Meta: All JSON includes _meta.created_at, _meta.updated_at, _meta.producer
Validation: bash ../use-hivemind-delegation/scripts/hm-artifact-validate.sh {path}
```

### Activity File Categories

`session-*`, `requirements-*`, `decisions-*`, `ten-x-*`, `vocab-*`, `evidence-*` — all date-stamped `YYYY-MM-DD`.
