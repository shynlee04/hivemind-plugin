---
name: use-authoring-skills
description: Use when creating, auditing, refactoring, evaluating, or packaging skills. Activates the meta-builder for skill authoring, TDD workflows, quality validation, description optimization, and cross-platform skill development. Covers frontmatter compliance, pattern selection, eval-driven iteration, and conflict detection. Triggers: "write a skill", "create a new skill", "audit this skill", "improve this skill", "skill quality", "skill authoring", "skill frontmatter", "skill pattern".
---

# use-authoring-skills

Universal routing hub for skill authoring across all agentic coding platforms. Whether building, reviewing, or resolving conflicts between skills — start here. Deep material lives in `references/`; this body encodes methodology, gates, and decision rules.

---

## Required Skill Loads

This skill works best when loaded with:

- `skill-creator`, `skill-development`, `writing-skills` — for creating/improving skills
- `skill-judge`, `skill-review` — for auditing/refactoring skills
- `gcc` — for git-backed memory and atomic commits across sessions
- `planning-with-files` — for long-running planning, progress tracking, and session recovery

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
| Diagnosing a broken skill | → `references/05-skill-quality-matrix.md` + `references/08-conflict-detection.md` |

---

## Terminology Mandate (NON-NEGOTIABLE)

This skill is **universal** — not platform-specific. OpenCode is the closest measurement, but all agentic coding platforms must work (Claude Code, Codex, Cursor, etc.).

| Refer to | As | NOT |
|----------|-----|-----|
| The AI entity | "Agent" | Claude, GPT, Gemini |
| The config file | "AGENTS.md" | CLAUDE.md, CLAUDE.local.md |
| Package manager | "your package manager" | npm, yarn, pnpm |
| Test runner | "your test framework" | Jest, Vitest, Mocha |
| Language | "your language" | TypeScript, Python |
| Config file | "config file" | opencode.json, .claude/settings.json |

Platform-specific terms belong only in examples, prefixed with "For example, in TypeScript..."

---

## Operating Discipline (NON-NEGOTIABLE)

These methodology rules govern all skill authoring work. Violations produce degraded, unusable skills.

### M1: Frame Skeleton First, Then Iterate

Before any work: map the high-level architecture, identify nodes, map branches, acknowledge hypotheses, prepare to reroute.

### M2: Hierarchical Thinking (MANDATORY)

Every decision traces to reasoning. Distinguish critical from peripheral. Understand parent-child and dependency hierarchies. Rank importance.

### M3: Strategic Traversal

Sequenced exploration with conditional logic. Consider git history. Trace actors and context networks. Build mental models of how components interconnect.

### M4: Cyclical Judgment (MANDATORY)

Never judge on first encounter. Return to entities multiple times. Validate against real use cases. Only draw conclusions after repeated judgment cycles.

### M5: Subagent Orchestration

- Always plan in **batches and cycles** — never single-round execution
- **Sequential preference** over parallel when possible
- ALL outputs written to disk with descriptive names
- Each batch must chain from previous outputs
- **Max 3 domains** and **max 5k LOC/text** per subagent
- **Selective deep improvement** — no grep-and-shrink, no surface-level analysis

### M6: Write-to-Disk Every Turn

Coherence is lost between turns by default. The only defense is persistent write-to-disk and hierarchical strategy on disk.

### M7: Complete Workflow Nodes Per Wave

Each wave/cycle produces **complete nodes** — not partial work. Every delegation outputs knowledge documents. Testing must be easy per wave.

---

## Frontmatter Standard

The Agent Skills specification recognizes six fields. Only `name` and `description` are required.

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | **Yes** | Max 64 chars. Lowercase `a-z`, digits, hyphens. No leading/trailing/consecutive hyphens. Must match directory name. |
| `description` | **Yes** | Max 1024 chars. Start with "Use when...". Include trigger keywords. |
| `license` | No | Short name or file reference. |
| `metadata` | No | String key-value pairs. Unique keys. |
| `allowed-tools` | No | Space-delimited tool list. Experimental. |
| ~~`compatibility`~~ | ~~No~~ | **BANNED.** Do not use. |

**Critical rules:**
- Frontmatter is `name` + `description` only. Pattern, stacking, dependencies — those belong in the body.
- `description` is the activation surface. Vague descriptions cause false positives or silent non-activation.
- **No `compatibility` field.** Period. It was explicitly rejected.

→ Full rules: `references/02-frontmatter-standard.md`

---

## Phase Gate System

Granular hierarchy with **incremental integration checkpoints**. ALL checkpoints must pass before proceeding. Gates are **programmatic and measurable** (boolean or scoring).

### Gate Flow

```
Frame Skeleton → Deep Audit → Architecture Design → Implementation → Validation → Bridging
     ↑               ↑              ↑                   ↑               ↑
   GATE 1          GATE 2         GATE 3              GATE 4          GATE 5
```

### Gate Criteria (all must pass)

| Gate | Measure | Target |
|------|---------|--------|
| G1: Context Scouting | Quality scores for all files identified | 4 CRITICAL, 5 HIGH, 5 MEDIUM issues |
| G2: Deep Audit | Duplication quantified, spec gaps cataloged | Overlap matrix complete, >25% gaps identified |
| G3: Architecture | Token budget, ownership model, 12-file structure | Progressive disclosure tiers assigned |
| G4: Implementation | Cross-file duplication, contradictions | Duplication <5%, contradictions = 0 |
| G5: Validation | Real scenario test, trigger rate | Line counts verified, dead links = 0 |

### Compatible with ralph-loop pattern

Gates integrate with iterative enforcement loops — run until all gates pass boolean checks. Re-dispatch on failure.

→ Full methodology: `references/04-tdd-workflow.md`, `references/10-eval-lifecycle.md`

---

## Iteration & Orchestration Protocol

### Planning-with-Files Discipline

For long-running, multi-session work. Three files at project root, updated every turn:

| File | Purpose | When Updated |
|------|---------|--------------|
| `task_plan.md` | Phase tracker, goals, decisions | Every phase change |
| `findings.md` | Discovered facts, scores, analysis | Every 2 search/read actions |
| `progress.md` | Timestamped actions, decisions, recovery state | Every meaningful action |

**Read before decide** — re-read `task_plan.md` for goals, `findings.md` for facts, before any major decision.

**5-Question Recovery** — when lost, write answers in `progress.md`:
1. Where am I?
2. Where am I going?
3. What's the goal?
4. What have I learned?
5. What have I done?

→ Full methodology: `planning-with-files` skill

### Knowledge Synthesis & Persistence

Both main agent and all subagents must output synthesized knowledge to disk. State persists across sessions. Reasoning paths must be traceable. Use `gcc` for git-backed memory — lean index (hash + intent + notes), not verbose markdown.

### Recovery Protocol

When restarting a session:
1. Read `.skills-lab/findings.md` — locked decisions
2. Read `.skills-lab/realignment-2026-04-03.md` — hard constraints
3. Read `.skills-lab/task_plan.md` — current phase
4. Run `git log --oneline -5` — verify recent commits
5. Run `git status` — verify actual state
6. Resume from current phase

---

## Pattern Selection

Three architecture patterns. Choose by purpose and depth:

| Pattern | Purpose | Body Size | When to Use |
|---------|---------|-----------|-------------|
| **P1 — Routing** | Thin entry, delegates | <200 lines | Meta skills, domain routers |
| **P2 — Domain** | Focused guidance | 200-500 lines | Step-by-step processes, templates |
| **P3 — Expertise** | Deep reference-heavy | 500+ or reference-heavy | Recovery, complex scenarios |

**Decision tree:**
```
Entry/routing skill? → P1
  No → Focused domain? → P2 (default)
    No → Genuine complexity beyond P2? → P3
```

→ Full patterns: `references/03-three-patterns.md`

---

## TDD for Skills

Every skill validated against real failure scenarios before shipping:

1. **RED** — Document a specific scenario that fails without the skill
2. **GREEN** — Write minimum skill content that resolves that failure
3. **REFACTOR** — Remove duplication, tighten triggers, validate structure

**Do not write content without a documented failing scenario first.**

**Knowledge Delta Test** (before writing any content):
- **Expert** — "Does the agent genuinely NOT know this?" → Keep
- **Activation** — "Knows but may not think of it?" → Keep brief
- **Redundant** — "Definitely knows this?" → Delete

→ Full methodology: `references/04-tdd-workflow.md`

---

## Quality Scoring

5 dimensions, scored 1-5 each:

| Dimension | Weight | What It Measures |
|-----------|--------|-----------------|
| Trigger Accuracy | 25% | Description activates on specific conditions |
| Action Coherence | 25% | One purpose, clear entry/exit, no mission creep |
| Reference Integrity | 20% | 1-level depth, no circular refs |
| Non-Redundancy | 15% | No overlap with existing skills |
| Edge Case Coverage | 15% | Handles degraded, delegated, resumed states |

**Release thresholds:** ≥4.5 ship, ≥4.0 minor polish, ≥3.5 address gaps, <3.5 do not release.
**Block rule:** Any dimension ≤2 blocks release regardless of overall score.

→ Full rubric: `references/05-skill-quality-matrix.md`

---

## Iteration Loop

When a skill scores below threshold:

1. **Analyze** — Which dimension(s) failed?
2. **Classify the gap** — Missing trigger? Oversized? Broken refs? Overlap? Missing edge case?
3. **Fix one thing** — One targeted change per iteration
4. **Re-score** — Run all 5 dimensions again
5. **Decide** — Release (≥4.5), continue (improved), escalate (no change 2 cycles), redesign (no change 3 cycles)

→ Worked examples: `references/07-iterative-refinement.md`

---

## Conflict Detection

Five conflict types:

| Type | Detection |
|------|-----------|
| Scope overlap | Trigger phrases >70% match |
| Contradictory instructions | "When to Load" sections differ |
| Shared state mutation | Handoff paths overlap |
| Boundary violation | Depth skill contains routing logic |
| Dependency cycle | A requires B, B requires A |

→ Full protocol: `references/08-conflict-detection.md`

---

## Cross-Package Bridging

This skill is the **meta-builder** for a larger skill ecosystem. It connects to:

| Package | Relationship |
|---------|-------------|
| Agent authoring | Provides naming conventions and routing patterns |
| Tool authoring | Provides frontmatter standards and eval framework |
| Command authoring | Provides TDD methodology and quality scoring |
| Workflow authoring | Provides pattern selection and iteration protocols |

All packages share: universal terminology, progressive disclosure, programmatic gates, and planning-with-files discipline.

---

## Anti-Patterns

1. **The Novel** — Skills >500 lines trying to do everything. Split them.
2. **The Ghost** — Exists but has no clear trigger. Dead weight.
3. **The Identity Crisis** — Depth skill with routing logic. Pick a lane.
4. **The Assumer** — Assumes specific tools. Declare requirements explicitly.
5. **The Copy-Paste Factory** — Duplicates other skills. Reference them instead.
6. **The Platform Loyalist** — Hardcodes platform-specific commands.
7. **The Silent Conflict** — Same trigger, different advice. Detect before shipping.
8. **The Orphan** — Created, never audited. Skills rot like code.
9. **The Parameter Leaker** — Runtime placeholders like `{state_dir}` in static content.
10. **The Hallucinator** — Claims work is "done" without git evidence. Commit and verify.

---

## Handoff Paths

| Artifact | Location |
|----------|----------|
| Skill under development | Working directory or staging area |
| Review evidence | Alongside the skill or in project notes |
| Conflict reports | Alongside the skill or in project notes |
| Knowledge synthesis | `.skills-lab/workspace/` with date-stamped files |

---

## Bundled Resources

| File | Purpose |
|------|---------|
| `references/01-skill-anatomy.md` | Directory structure, naming rules, version policy |
| `references/02-frontmatter-standard.md` | Field reference, validation rules, examples |
| `references/03-three-patterns.md` | P1/P2/P3 patterns, stacking rules |
| `references/04-tdd-workflow.md` | RED-GREEN-REFACTOR, test templates, pressure testing |
| `references/05-skill-quality-matrix.md` | 5-dimension scoring, evaluation template |
| `references/06-cross-platform-activation.md` | Platform-agnostic activation patterns |
| `references/07-iterative-refinement.md` | Iteration loop, worked examples |
| `references/08-conflict-detection.md` | Overlap types, detection protocol |
| `references/09-script-authoring.md` | Writing bundled scripts |
| `references/10-eval-lifecycle.md` | Eval-driven development |
| `references/11-description-optimization.md` | Trigger accuracy optimization |
| `references/12-anti-deception.md` | Gatekeeping, refusal, shadowing |
