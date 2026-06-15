# Chaining Patterns

GSD agents don't work in isolation. They compose into chains where each agent's output is the next agent's input. This document maps the standard chains, artifact flows, failure recovery patterns, and wave execution models.

## Standard Chains

### Phase Development Chain (most common)

```
gsd-project-researcher     → Research domain ecosystem
        ↓ (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md)
gsd-research-synthesizer   → Synthesize into SUMMARY.md
        ↓ (SUMMARY.md)
gsd-roadmapper             → Create ROADMAP.md from requirements
        ↓ (ROADMAP.md)
gsd-phase-researcher       → Research specific phase
        ↓ (RESEARCH.md)
gsd-planner                → Create PLAN.md
        ↓ (PLAN.md)
gsd-plan-checker           → Verify plan achieves goal
        ↓ (BLOCK / FLAG / PASS)
gsd-executor               → Execute PLAN.md
        ↓ (SUMMARY.md, commits)
gsd-verifier               → Verify goal achievement
        ↓ (VERIFICATION.md with gaps)
gsd-nyquist-auditor        → Fill validation gaps
        ↓ (VALIDATION.md, test files)
```

**Artifact flow:** Each agent produces files that the next agent consumes. No agent in this chain reads source code directly (except executor) — they read upstream artifacts.

### UI Development Chain

```
gsd-ui-researcher          → Produce UI-SPEC.md
        ↓ (UI-SPEC.md)
gsd-ui-checker             → Verify spec contracts
        ↓ (BLOCK / FLAG / PASS verdicts)
gsd-planner                → Create PLAN.md (references UI-SPEC.md)
        ↓ (PLAN.md)
gsd-executor               → Implement UI
        ↓ (commits, SUMMARY.md)
gsd-ui-auditor             → Retroactive 6-pillar audit
        ↓ (UI-REVIEW.md)
```

**Key difference:** UI chain inserts a checker before planning, and an auditor after execution. Standard chain uses verifier + nyquist instead.

### Security Chain

```
gsd-planner                → Creates PLAN.md with <threat_model>
        ↓ (PLAN.md with threat model)
gsd-executor               → Implements with security mitigations
        ↓ (SUMMARY.md with ## Threat Flags)
gsd-security-auditor       → Verifies mitigations exist
        ↓ (SECURITY.md)
```

**Key difference:** Security is embedded in planning and execution, not a separate chain. The planner declares threats, executor applies mitigations, auditor verifies.

### Documentation Chain

```
gsd-codebase-mapper        → Explore codebase, write analysis docs
        ↓ (STACK.md, ARCHITECTURE.md, CONVENTIONS.md, etc.)
gsd-doc-writer             → Write project documentation
        ↓ (README.md, docs/*.md)
gsd-doc-verifier           → Verify factual claims against codebase
        ↓ (JSON result files)
```

## Artifact Flow Matrix

| Agent | Produces | Consumes |
|-------|----------|----------|
| gsd-project-researcher | STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md | Requirements, user prompt |
| gsd-research-synthesizer | SUMMARY.md | All 4 research files |
| gsd-roadmapper | ROADMAP.md, STATE.md | SUMMARY.md, REQUIREMENTS.md |
| gsd-phase-researcher | RESEARCH.md | ROADMAP.md, phase definition |
| gsd-planner | PLAN.md | RESEARCH.md, ROADMAP.md, CONTEXT.md |
| gsd-plan-checker | BLOCK / FLAG / PASS verdict | PLAN.md, CONTEXT.md |
| gsd-executor | SUMMARY.md, commits, deferred-items.md | PLAN.md, STATE.md |
| gsd-verifier | VERIFICATION.md | PLAN.md, SUMMARY.md, ROADMAP.md, codebase |
| gsd-nyquist-auditor | VALIDATION.md, test files | VERIFICATION.md gaps, codebase |
| gsd-security-auditor | SECURITY.md | PLAN.md threat_model, SUMMARY.md threat_flags |
| gsd-ui-researcher | UI-SPEC.md | REQUIREMENTS.md, CONTEXT.md, codebase |
| gsd-ui-checker | Verdict (BLOCK/FLAG/PASS) | UI-SPEC.md |
| gsd-ui-auditor | UI-REVIEW.md | UI-SPEC.md, implemented code |
| gsd-doc-writer | Documentation files | doc_assignment, codebase |
| gsd-doc-verifier | JSON result files | Documentation file to verify |
| gsd-codebase-mapper | Analysis docs (STACK.md, etc.) | Focus area, source code |

## Wave Execution Model

Plans organize tasks into waves for parallel execution:

```
Wave 1: Task 1 (independent)  +  Task 2 (independent)
         ↓                          ↓
       Commit A                  Commit B
         ↓                          ↓
Wave 2: Task 3 (depends on A)  +  Task 4 (depends on B)
         ↓                          ↓
       Commit C                  Commit D
```

**Rule:** Tasks in the same wave must not share files. If Task 1 modifies `src/auth.ts` and Task 2 also touches `src/auth.ts`, they MUST be in different waves.

### Wave Declaration in PLAN.md

```yaml
wave: 1
depends_on: []
```

```yaml
wave: 2
depends_on: ["01-01", "01-02"]
```

## Failure Recovery Chains

When an agent fails mid-chain, recovery follows these patterns:

### Planner Returns BLOCK

```
gsd-plan-checker → BLOCK → gsd-planner revises → gsd-plan-checker re-verifies
```

**Never proceed to executor with a BLOCK verdict.**

### Verifier Finds Gaps

```
gsd-verifier → VERIFICATION.md with gaps → gsd-nyquist-auditor fills test gaps
                                              ↓
                                    If implementation bugs → ESCALATE → gsd-planner creates fix plan
                                              ↓
                                    gsd-executor applies fixes
```

### Security Auditor Finds Open Threats

```
gsd-security-auditor → OPEN_THREATS → gsd-planner creates mitigation plan
                                           ↓
                                     gsd-executor implements
                                           ↓
                                     gsd-security-auditor re-verifies
```

### Executor Hits Checkpoint

```
gsd-executor → CHECKPOINT → user provides input → fresh executor continues
```

**The fresh executor receives:** completed tasks table, resume point, checkpoint type, user's decision.

## Escalation Chain

When any agent escalates (can't resolve):

```
Agent → ESCALATE with {reason, evidence, suggestion}
  ↓
Orchestrator presents to user
  ↓
User decides: fix manually / replan / accept gap
  ↓
If replan → gsd-planner creates fix plan
If accept → document in STATE.md as accepted deviation
```

## Chain Composition Rules

1. **Every chain starts with context gathering** — researcher, mapper, or ui-researcher
2. **Planning always follows research** — never plan without upstream artifacts
3. **Verification always follows execution** — never ship without verification
4. **Nyquist follows verifier only if gaps exist** — no gaps → skip nyquist
5. **Security audit follows executor only if threat_model exists** — no threats → skip
6. **UI checker follows ui-researcher** — spec must be verified before planning
7. **UI auditor follows executor** — retroactive audit, not pre-planning

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Chain skipping** — executor without planner | No PLAN.md in phase directory | Always plan before execute |
| **Verification skipping** — no verifier after executor | SUMMARY.md exists but no VERIFICATION.md | Always verify after execute |
| **Double execution** — running executor twice on same plan | Duplicate commits in git log | Check commits before re-executing |
| **Orphan artifacts** — verifier checks files executor never created | VERIFICATION.md references files not in SUMMARY.md | Verify executor produced what verifier checks |
| **Stale context** — planner using outdated RESEARCH.md | RESEARCH.md timestamp older than latest code changes | Re-research before replanning |
