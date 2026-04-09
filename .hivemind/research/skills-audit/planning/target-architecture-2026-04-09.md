# Target Architecture — Skills Collection After Revamp (2026-04-09)

> **Mode:** Orchestrator direct (swarm delegation non-functional)
> **Sources:** cycle1-aggregate, pair-mapping (domain coverage), cross-batch-findings (gold standards, removals)

---

## 1. Current → Target Skill Mapping

### Surviving Skills (15 — no structural change)

| # | Current Name | Target Name | Current Grade | Target Grade | Action Needed |
|---|-------------|-------------|---------------|--------------|---------------|
| 1 | meta-builder | meta-builder | B+ | A- | Remove internal vocab, shrink 403→200L, fix depth stubs |
| 2 | use-authoring-skills | use-authoring-skills | B | A | Rewrite description (add triggers), resolve self-contradiction |
| 3 | agents-and-subagents-dev | agents-and-subagents-dev | D | B | Rewrite description, add basic evals |
| 4 | command-dev | command-dev | D → PASS | B | Rewrite description (formulaic), consider adding evals |
| 5 | custom-tools-dev | custom-tools-dev | D → PASS | B | Rewrite description (formulaic), consider adding evals |
| 6 | coordinating-loop | coordinating-loop | A | A | Dedup from .opencode/, add script fallbacks |
| 7 | phase-loop | phase-loop | D | B | Rewrite description, expand 117→200L, add worked example |
| 8 | planning-with-files | planning-with-files | PASS → D bundle | A | Merge session-ctx into it, add 3-file schema from merge |
| 9 | user-intent-interactive-loop | user-intent-interactive-loop | A | A | Dedup from .opencode/, integrate orphan first-action.sh |
| 10 | opencode-platform-reference | opencode-platform-reference | C+ | B | No changes needed (reference by design) |
| 11 | opencode-non-interactive-shell | opencode-non-interactive-shell | C → PASS | A | Already gold standard, no changes |
| 12 | oh-my-openagent-reference | oh-my-openagent-reference | D | B | Fix phantom refs, add domain synthesis section |
| 13 | skill-synthesis | skill-synthesis | C+ | B | Fix validate-gate.sh bug, rewrite description |
| 14 | hm-deep-research | hm-deep-research | C+ | A | Gold standard, minimal changes |
| 15 | command-parser | command-parser | C → PASS | A | Already good, no changes |

### Merged (−1)

| Source | Into | Rationale |
|--------|------|-----------|
| session-context-manager (FAIL) | planning-with-files | Functional overlap — one cross-session persistence system |

### Split (+1)

| Source | Result A | Result B |
|--------|----------|----------|
| harness-delegation-inspection | subagent-delegation-patterns | opencode-project-inspection |

### Renamed (0 net)

| Current | Target |
|---------|--------|
| eval-harness | eval-driven-development |
| harness-audit | opencode-project-audit |
| agent-authorization | delegation-gates |

### Created (+2)

| New Skill | Domain | Template |
|-----------|--------|----------|
| eval-execution | Eval/Benchmarking | hm-deep-research (methodology pattern) |
| agent-lifecycle-events | Subagent Management | command-dev (lean pattern) |

---

## 2. Target Count: 20 Skills

| Action | Delta | Running Total |
|--------|-------|---------------|
| Start | — | 19 |
| Merge session-ctx → planning | -1 | 18 |
| Split delegation-insp → 2 | +1 | 19 |
| Create eval-execution | +1 | 20 |
| Create agent-lifecycle-events | +1 | 21 |
| Merge eval-execution into eval-driven-dev? | -1? | 20 |

**Final target: 20 skills** (same count, better distribution)

---

## 3. Target Grade Distribution

| Grade | Current | Target | Skills |
|-------|---------|--------|--------|
| A | 2 | 8 | coordinating-loop, user-intent-interactive-loop, opencode-non-interactive-shell, hm-deep-research, command-parser, use-authoring-skills, planning-with-files, meta-builder |
| B | 2 | 8 | opencode-project-audit, delegation-gates, skill-synthesis, agents-and-subagents-dev, command-dev, custom-tools-dev, phase-loop, opencode-project-inspection |
| C | 4 | 3 | oh-my-openagent-reference, opencode-platform-reference, subagent-delegation-patterns |
| D | 6 | 1 | eval-driven-development (rebuilt from scratch) |
| F | 1 | 0 | — |
| FAIL/REMOVED | 1 | 0 | — |

**Target average: B** (up from C)

---

## 4. Target Bundle Standard (What Every Skill MUST Have)

### Minimum Viable Bundle

| Component | Required | Notes |
|-----------|----------|-------|
| SKILL.md | ✅ Always | Max 500L body, push detail to refs |
| Description | ✅ Always | Max 40 words, 5+ natural triggers, no internal vocab |
| Name | ✅ Always | lowercase-hyphen, matches directory, no "harness"/"OMO"/"GSD" |
| Layer metadata | ✅ Always | 0=router, 1=orchestrator, 2=domain-exec, 3=reference |
| References | ✅ If >200L body | Progressive disclosure: body for workflow, refs for detail |
| Eval fallback | ✅ Always | Inline "if script fails" procedure in SKILL.md body |

### Tier-Based Bundle

| Tier | Skills | Must Have | Optional |
|------|--------|-----------|----------|
| **Tactical** (P2, <150L body) | command-dev, custom-tools-dev, command-parser | SKILL.md + 1-2 refs | scripts, evals |
| **Methodology** (P1, 200-400L body) | hm-deep-research, coordinating-loop, use-authoring-skills | SKILL.md + refs + scripts + evals | assets |
| **Reference** (data-only) | opencode-platform-reference, oh-my-openagent-reference | SKILL.md + packed refs | scripts (not needed) |
| **Router** (thin dispatcher) | meta-builder | SKILL.md + graph state | refs, scripts |

---

## 5. Naming Convention (Post-Revamp)

### Rules
1. **No internal vocabulary** — no "harness", "OMO", "GSD", "hivefiver", "/hf-*"
2. **Describe purpose, not implementation** — "delegation-gates" not "agent-authorization"
3. **lowercase-hyphen** — matches agentskills.io spec
4. **Max 3 words** — scannable in directory listings

### Rename Summary

| Current | Target | Violation Fixed |
|---------|--------|----------------|
| harness-audit | opencode-project-audit | "harness" → "opencode-project" |
| harness-delegation-inspection | (split into 2) | "harness" removed entirely |
| eval-harness | eval-driven-development | "harness" → "eval-driven-development" |
| agent-authorization | delegation-gates | "authorization" → "gates" (actual purpose) |

---

## 6. Description Template (Universal)

```
<active verb> <what it does in 10 words>. Use when <5-8 natural trigger phrases>. NOT for <1-2 explicit exclusions>.
```

### Examples

| Skill | Proposed Description |
|-------|---------------------|
| meta-builder | Route OpenCode meta-concept requests to specialist authoring skills. Use when creating, auditing, stacking, or configuring skills, agents, commands, or tools. NOT for direct implementation. |
| use-authoring-skills | Author, audit, and score OpenCode skills using TDD workflow and quality rubrics. Use when writing a new skill, fixing frontmatter, checking skill quality, or running evals. NOT for agent or command authoring. |
| agents-and-subagents-dev | Build OpenCode agents with delegation envelopes, worktree isolation, and dispatch protocols. Use when creating agents, defining permissions, or configuring subagent sessions. NOT for skill authoring. |
| delegation-gates | Enforce pre-delegation authorization gates before agent dispatch. Use when setting up checkpoint gates, defining capability matrices, or validating agent permissions. NOT for orchestration execution. |
| opencode-project-audit | Audit OpenCode projects across skills, commands, tools, permissions, agents, and subagents. Use when checking boundaries, verifying architecture, or validating setup. NOT for code review. |
| eval-driven-development | Implement eval-driven development with define-run-grade-improve cycles. Use when writing evals, benchmarking skill quality, or measuring trigger accuracy. NOT for general testing. |

---

## 7. Uncovered Domains (Post-Revamp Gaps)

Even after revamp, these domains remain uncovered:

| Gap | Severity | Recommendation |
|-----|----------|----------------|
| **Permission Enforcement** — no runtime validation | HIGH | Create agent-lifecycle-events with permission hooks |
| **Hook/Event System** — no reactive agent patterns | MEDIUM | Add to opencode-platform-reference as new reference section |
| **Context Compaction Protocol** — no shrink procedure | MEDIUM | Add to planning-with-files as compaction schema |
| **Non-OpenCode Platforms** — multi-platform deployment | LOW | Expand use-authoring-skills/06-cross-platform-activation.md |

---

_Generated: 2026-04-09_
_Method: Orchestrator direct from research synthesis_
