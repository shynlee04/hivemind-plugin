---
name: use-authoring-skills
description: Use when creating a new agent skill, auditing an existing skill, improving skill quality, optimizing skill descriptions, writing evals for skills, packaging skills for distribution, or resolving conflicts between skills. Covers frontmatter compliance, skill pattern selection, TDD for skills, quality scoring via 5-dimension rubric, eval-driven development, description optimization, and cross-platform skill architecture. Triggers: "write a skill", "create a skill", "audit this skill", "improve this skill", "skill authoring", "skill frontmatter", "skill pattern", "skill quality", "skill description", "skill eval".
---

# use-authoring-skills

Universal skill authoring meta-builder. Whether building, reviewing, or resolving conflicts between skills — start here. Deep material lives in `references/`; this body encodes the locked decisions, methodology, and routing.

---

## Required Skill Loads

This skill expects the following to be loaded alongside it:

| Purpose | Skills |
|---------|--------|
| Creating/improving | `skill-creator`, `skill-development`, `writing-skills` |
| Auditing/refactoring | `skill-judge`, `skill-review` |
| Git-backed memory | `gcc` |
| Long-running planning | `planning-with-files` |

---

## When to Load

| Situation | Route |
|-----------|-------|
| Creating a new skill from scratch | → `references/01-skill-anatomy.md` + `references/02-frontmatter-standard.md` + TDD workflow |
| Reviewing or auditing an existing skill | → `references/05-skill-quality-matrix.md` (9-phase audit) |
| Two skills may conflict | → `references/08-conflict-detection.md` |
| Choosing a skill architecture pattern | → `references/03-three-patterns.md` (P1/P2/P3) |
| Writing or fixing frontmatter | → `references/02-frontmatter-standard.md` |
| Improving a skill that scored low | → `references/07-iterative-refinement.md` |
| Testing skill descriptions for trigger accuracy | → `references/11-description-optimization.md` |
| Writing evals for a skill | → `references/10-eval-lifecycle.md` |
| Writing bundled scripts | → `references/09-script-authoring.md` |
| Ensuring cross-platform compatibility | → `references/06-cross-platform-activation.md` |
| Diagnosing a broken skill | → `references/05-skill-quality-matrix.md` + `references/08-conflict-detection.md` |

---

## Operating Discipline (NON-NEGOTIABLE)

These rules govern all skill authoring work. They are locked from user decisions and apply to every agent using this skill.

### Methodology Constraints

1. **Frame skeleton first** — Map the architecture, identify nodes, map branches, acknowledge hypotheses before any deep work. (MANDATORY)
2. **Hierarchical thinking** — Every decision traces to reasoning. Distinguish critical from peripheral. Understand parent-child and dependency hierarchies. (MANDATORY)
3. **Strategic traversal** — Sequenced exploration with conditional logic. Trace actors and context networks. Consider git history. (REQUIRED)
4. **Cyclical judgment** — Never judge on first encounter. Return to entities multiple times. Validate against real use cases. Only conclude after repeated cycles. (MANDATORY)
5. **Selective deep improvement** — No surface-level grep-and-shrink. Deep, selective, multi-cycle improvement. Not one-time completion. (MANDATORY)

### Subagent Orchestration Rules

6. **Batch planning** — Always plan subagent work in batches and cycles. Never single-round execution. (MANDATORY)
7. **Max 3 domains, max 5k LOC/text** — Never launch a single subagent to read more than 3 domains or more than 5,000 lines. Split when compare-and-contrast is needed. (HARD LIMIT)
8. **Sequential preference** — Favor sequential over parallel when possible. Each batch must chain from previous outputs. (REQUIRED)
9. **Disk-based synthesis** — ALL subagent outputs written to disk with descriptive names. Structured for consumption by subsequent batches. (MANDATORY)
10. **Complete workflow nodes** — Each wave/cycle must produce complete nodes and workflow cycles. Every delegation must output knowledge documents. (REQUIRED)

### Discipline Corrections

11. **NEVER delete working content** — Always archive to `.skills-lab/.archive/YYYY-MM-DD-<topic>/`. Only remove old content once new pack is fully functional. (HARD RULE)
12. **NEVER edit skill files directly as coordinator** — Coordinator role is PLAN + DELEGATE, not execute. Must not pollute skill files. (HARD RULE)
13. **Write-to-disk every turn** — Coherence is lost between turns by default. Only defense is persistent write-to-disk and hierarchical strategy. (CRITICAL)
14. **Record and commit ALL changes** — If it's not in git, it doesn't exist. Commit after every meaningful action. (CRITICAL)
15. **Verify actual state before planning** — Run `git status`, `git diff` before planning next steps. Never trust claimed completions without git evidence. (CRITICAL)

---

## Terminology Mandate (UNIVERSAL)

This skill is universal — not platform-specific. OpenCode is the closest measurement, but all agentic coding platforms must work.

| Refer to | Use | NOT |
|----------|-----|-----|
| The AI entity | "Agent" | Claude, GPT, Gemini |
| The config file | "AGENTS.md" | CLAUDE.md, CLAUDE.local.md |
| Package manager | "your package manager" | npm, yarn, pnpm |
| Test runner | "your test framework" | Jest, Vitest, Mocha |
| Language | "your language" | TypeScript, Python |
| Config file | "config file" | opencode.json, .claude/settings.json |
| Agent | "Agent" | Claude |

---

## Frontmatter Standard

The Agent Skills specification recognizes six fields. Only `name` and `description` are required.

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | **Yes** | Max 64 chars. Lowercase + hyphens. No leading/trailing/consecutive hyphens. Must match directory name. |
| `description` | **Yes** | Max 1024 chars. Start with "Use when...". Include trigger keywords. |
| `license` | No | Short name or file reference. |
| `metadata` | No | Key-value pairs. Unique keys. |
| `allowed-tools` | No | Space-delimited tool list. Experimental. |
| ~~`compatibility`~~ | ~~No~~ | **BANNED.** Do not use. |

**Critical rules:**
- Frontmatter is `name` + `description` only in most cases.
- `metadata` and `allowed-tools` are useful optionals for discovery/stacking and eval gating.
- `description` is the activation surface — vague descriptions cause false positives.
- No `compatibility` field. Period. User explicitly rejected it.

→ Full rules: `references/02-frontmatter-standard.md`

---

## Pattern Selection

Three architecture patterns. Choose by purpose and depth:

| Pattern | Purpose | Body Size | When to Use |
|---------|---------|-----------|-------------|
| **P1 — Routing** | Thin entry, delegates to sub-skills | <200 lines | Meta skills, domain routers |
| **P2 — Domain** | Focused guidance for one domain | 200–500 lines | Step-by-step processes, templates |
| **P3 — Expertise** | Deep reference-heavy content | 500+ or reference-heavy | Recovery protocols, complex scenarios |

**Decision tree:**
```
Is this an entry/routing skill? → P1
  No → Is this a focused domain skill? → P2 (default)
    No → Is the complexity genuinely beyond P2? → P3
```

→ Full patterns: `references/03-three-patterns.md`

---

## Phase Gate System (PROGRAMMATIC)

Granular hierarchy with **incremental integration checkpoints**. All gates must pass before proceeding. Gates are **programmatic and measurable** (boolean or scoring). Compatible with ralph-loop patterns.

### Gate Structure

| Gate | Phase | Measure | Pass Criteria |
|------|-------|---------|---------------|
| G1 | Context Scouting | Quality scores for all files identified | All issues ranked by severity |
| G2 | Deep Audit | Duplication quantified, spec gaps cataloged | Overlap matrix complete, gaps documented |
| G3 | Architecture Design | Token budget, ownership model assigned | 12-file structure with progressive tiers |
| G4 | Implementation | Cross-file duplication, contradictions | Duplication <5%, contradictions = 0 |
| G5 | Validation | Real scenario test, trigger rate | Line counts verified, dead links = 0 |
| G6 | Bridging | Cross-package linkage spec | Convention established for sibling packs |

### Gate Enforcement

- **All gates must pass** before proceeding to next phase.
- **Failure in any gate** → loop back to that phase (ralph-loop compatible).
- **Gates are boolean or scoring** — not subjective.
- **Programmatic enforcement** — scripts validate gates automatically where possible.

→ Gate methodology: `references/04-tdd-workflow.md`, `references/10-eval-lifecycle.md`

---

## TDD for Skills

Every skill validated against real failure scenarios before shipping:

1. **RED** — Document a specific scenario that fails without the skill
2. **GREEN** — Write minimum skill content that resolves that failure
3. **REFACTOR** — Remove duplication, tighten triggers, validate structure

**Knowledge Delta Test** (before writing content):
- **Expert** — "Does the agent genuinely NOT know this?" → Keep
- **Activation** — "Knows but may not think of it?" → Keep brief
- **Redundant** — "Definitely knows this?" → Delete. Wastes tokens.

→ Full methodology: `references/04-tdd-workflow.md`

---

## Quality Scoring

5 dimensions, scored 1–5 each:

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Trigger Accuracy | 25% | Description activates on specific conditions |
| Action Coherence | 25% | One purpose, clear entry/exit, no mission creep |
| Reference Integrity | 20% | 1-level depth, no circular refs |
| Non-Redundancy | 15% | No overlap with existing skills |
| Edge Case Coverage | 15% | Handles degraded, delegated, resumed states |

**Overall:** `(Trigger×0.25) + (Action×0.25) + (Reference×0.20) + (Redundancy×0.15) + (Edge×0.15)`

**Release thresholds:**
| Grade | Score | Action |
|-------|-------|--------|
| EXCELLENT | 4.5+ | Ship it |
| GOOD | 4.0+ | Minor polish |
| ACCEPTABLE | 3.5+ | Address specific gaps |
| NEEDS WORK | <3.5 | Do not release |

**Block rule:** Any single dimension scoring ≤2 blocks release regardless of overall score.

→ Full rubric: `references/05-skill-quality-matrix.md`

---

## Iteration & Orchestration Protocol

### Iteration Loop (ralph-loop compatible)

When a skill scores below threshold:

1. **Analyze** — Which dimension(s) failed? Extract specific criteria.
2. **Classify the gap** — Missing trigger? Oversized scope? Broken refs? Authority overlap? Missing edge case?
3. **Fix one thing** — One targeted change per iteration. Do not batch.
4. **Re-score** — Run all 5 dimensions again. Compare to previous.
5. **Decide** — Release (≥4.5), continue (improved), escalate (no change after 2 cycles), redesign (no change after 3 cycles).

→ Worked examples: `references/07-iterative-refinement.md`

### Planning-with-Files Integration

For long-running multi-session work, maintain three files at project root:

| File | Purpose | When Updated |
|------|---------|--------------|
| `task_plan.md` | Phase tracker, goals, locked decisions | Every phase change |
| `findings.md` | Discovered facts, scores, analysis | Every 2 search/read actions |
| `progress.md` | Timestamped actions, decisions, recovery | Every meaningful action |

**Read-before-decide rule:** Re-read `task_plan.md` for goals and `findings.md` for facts before any major decision.

### Knowledge Synthesis

- ALL agents (main + subagents) must output synthesized knowledge to disk.
- State must persist across sessions via `gcc` (git-backed memory).
- Reasoning paths must be traceable.
- Named exports with descriptive filenames.
- Chain continuity across batches.

### Dynamic Breadth-Depth Resolution

Balance exploration (breadth) with exploitation (depth) based on task requirements and emerging patterns. Not rigid single-mode exploration.

---

## Conflict Detection

Five conflict types:

| Type | What It Looks Like | Detection |
|------|-------------------|-----------|
| Scope overlap | Two skills claim same trigger | Grep trigger phrases across skills |
| Contradictory instructions | One says "always X", another "never X" | Compare "When to Load" sections |
| Shared state mutation | Both write to same file | Compare Handoff Paths |
| Boundary violation | Depth skill has routing logic | Check for IF/THEN routing |
| Dependency cycle | A requires B, B requires A | Trace dependency chains |

→ Full protocol: `references/08-conflict-detection.md`

---

## Recovery Protocol

When restarting a session after interruption:

1. Read `.skills-lab/findings.md` — locked decisions and current state
2. Read `.skills-lab/realignment-2026-04-03.md` — hard constraints for all future sessions
3. Read `.skills-lab/task_plan.md` — current phase and blockers
4. Run `git log --oneline -5` — verify recent commits
5. Run `git status` — verify actual file state (never trust compact context)
6. Resume from current phase

**5-Question Recovery** (when lost, write answers in `progress.md`):
1. Where am I?
2. Where am I going?
3. What's the goal?
4. What have I learned?
5. What have I done?

---

## Anti-Patterns

1. **The Novel** — Skills exceeding 500 lines trying to do everything. Split them.
2. **The Ghost Skill** — Exists but has no clear trigger. Dead weight.
3. **The Identity Crisis** — Depth skill with routing logic. Pick a lane.
4. **The Assumer** — Assumes specific tools. Declare requirements explicitly.
5. **The Copy-Paste Factory** — Duplicates other skills. Reference them instead.
6. **The Platform Loyalist** — Hardcodes platform-specific commands.
7. **The Silent Conflict** — Same trigger, different advice. Detect before shipping.
8. **The Orphan** — Created, never audited. Skills rot like code.
9. **The Parameter Leaker** — Runtime placeholders like `{state_dir}` in static content.
10. **The Hallucinator** — Claims work is "done" without git evidence. Commit and verify.
11. **The Coordinator Executor** — Coordinator edits skill files directly. Delegate.

---

## Handoff Paths

| Artifact | Location |
|----------|----------|
| Skill under development | Working directory or staging area |
| Review evidence | Alongside the skill or in project notes |
| Conflict reports | Alongside the skill or in project notes |
| Knowledge synthesis | Date-stamped files in project workspace |

---

## Bundled Resources

| File | Purpose |
|------|---------|
| `references/01-skill-anatomy.md` | Directory structure, naming rules, version policy |
| `references/02-frontmatter-standard.md` | Field reference, validation rules, examples |
| `references/03-three-patterns.md` | P1/P2/P3 patterns, stacking rules |
| `references/04-tdd-workflow.md` | RED-GREEN-REFACTOR, test templates, pressure testing |
| `references/05-skill-quality-matrix.md` | 5-dimension scoring, evaluation template |
| `references/06-cross-platform-activation.md` | Platform compatibility patterns |
| `references/07-iterative-refinement.md` | Iteration loop, worked examples |
| `references/08-conflict-detection.md` | Overlap types, detection protocol |
| `references/09-script-authoring.md` | Writing bundled scripts |
| `references/10-eval-lifecycle.md` | Eval-driven skill development |
| `references/11-description-optimization.md` | Trigger accuracy optimization |
| `references/12-anti-deception.md` | Gatekeeping and refusal intelligence |

---

## Cross-Package Integration

This skill is the meta-builder foundation. It connects to sibling packages:

| Package | Relationship |
|---------|-------------|
| Agent authoring | Shares naming conventions and routing patterns |
| Tool authoring | Shares frontmatter standards and eval framework |
| Command authoring | Shares TDD methodology and quality scoring |
| Workflow authoring | Shares pattern selection and iteration protocols |

All packages share: universal terminology, progressive disclosure, programmatic gates, and planning-with-files discipline.
