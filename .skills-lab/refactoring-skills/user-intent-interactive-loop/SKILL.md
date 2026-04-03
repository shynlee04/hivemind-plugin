---
name: user-intent-interactive-loop
description: Use when the Agent needs to iteratively probe user intent, maintain context across long sessions, facilitate brainstorming, manage parent/child task delegation, or act as a strategist updating users throughout extended work. Triggers on: "figure out what I want", "help me think through", "keep going with this", "what should we do next", "stay focused on", "don't lose track of", "delegate this", "keep me updated", "long session", "interactive loop", "I want to create", "help me build", "let's work on this together", "I need help figuring out", "turn this into a skill", "clone this pattern".
metadata:
  group: "1"
  role: "front-agent"
  phase: "probe"
allowed-tools: skill question write edit read bash
---

# user-intent-interactive-loop

Front-agent skill for iterative user engagement. The Agent stays in control, probes intent, delegates appropriately, and keeps users informed across long sessions. Deep material lives in `references/`; this body encodes the loop pattern, delegation rules, and persistence discipline.

---

## FIRST ACTION — When This Skill Loads

**Do this before anything else:**

1. **Complete the PROBE phase** before loading any other skill, writing any file, or dispatching any subagent.
2. Ask at most **3 questions per turn** using the OpenCode `question` tool — never more.
3. Load these 3 skills immediately for platform context:
   - `skill({ name: "opencode-platform-reference" })` — SDK docs
   - `skill({ name: "repomix-exploration-guide" })` — cheat-sheet
   - `skill({ name: "opencode-non-interactive-shell" })` — shell strategy
4. **GATE: Do not write, edit, or delete any file until PROBE phase is complete and user has confirmed intent.**

If the user's request is already specific enough (all 6 stop conditions met), skip to Phase 2. Otherwise, begin probing.

---

## Required Skill Loads

| Purpose | Skills | Load Order |
|---------|--------|------------|
| Platform reference | `opencode-platform-reference` | **First** — before any action |
| Codebase exploration | `repomix-exploration-guide` | **First** — before any action |
| Shell strategy | `opencode-non-interactive-shell` | **First** — before any action |
| Parallel dispatch | `dispatching-parallel-agents` | After PROBE |
| File-based planning | `planning-with-files` | After PROBE |
| Deep investigation | `deep-research` or `deep-investigation` | After PROBE |
| Git-backed memory | `gcc` | After PROBE |
| Skill creation | `skill-creator`, `writing-skills` | After PROBE |

**Load-order enforcement:** Complete PROBE before loading skills beyond the 3 platform skills above. Other skills are tools used *within* the loop, not replacements for it.

---

## When to Use

| Situation | Route |
|-----------|-------|
| User's request is vague or underspecified | → `references/01-question-protocols.md` |
| Session spans many turns, context drifting | → `references/02-context-preservation.md` |
| User wants to explore ideas, not just execute | → `references/03-brainstorming-patterns.md` |
| Session exceeds 50+ turns or hits compaction | → `references/04-long-session-management.md` |
| Need to decide: execute vs delegate vs clarify | → Core Pattern below |
| User says "keep going" or "stay on track" | → This skill, full loop |

---

## Core Pattern: The Interactive Loop

```
PROBE → UNDERSTAND → PLAN → DELEGATE → UPDATE → DELIVER
```

### Phase 1: PROBE — Extract Intent

Ask targeted questions using the OpenCode `question` tool. **Maximum 3 questions per turn.** Never overwhelm.

| Question Type | Purpose | Skill-Creation Example |
|---------------|---------|----------------------|
| Scope boundary | Define what's in/out | "Should this skill cover just creation, or also auditing and evals?" |
| Success criteria | Define done | "What does a 'good' skill look like to you — line count, trigger accuracy, something else?" |
| Constraint check | Surface limits | "Any existing skills this should reference or avoid overlapping with?" |
| Priority signal | Rank importance | "Is trigger accuracy or content depth the priority?" |
| Delegation appetite | Gauge trust level | "Should I draft the skill myself or dispatch a writer subagent?" |

**Skill-creation question selection:**

| User Says | Ask First |
|-----------|-----------|
| "I want to create a skill" | Scope boundary — "What should this skill do? What triggers it?" |
| "Clone this pattern into a skill" | Constraint check — "Should it follow the exact structure of the source, or adapt it?" |
| "Turn this document into a skill" | Success criteria — "What's the core behavior? What should the Agent do when this skill activates?" |
| "Improve this skill" | Scope boundary — "What aspect — description, references, scripts, or the whole pack?" |
| "I need help figuring out..." | Scope boundary — "What domain are we in — code, skills, config, or something else?" |

**Stop probing when ALL 6 conditions are true:**
1. Scope is bounded — can describe what's in and out
2. Success is defined — can describe what "done" looks like
3. Constraints are known — can list active constraints
4. Priority is set — can rank competing concerns
5. Delegation level is set — knows how much autonomy to use
6. User has confirmed — user said "yes", "correct", or equivalent

**If any condition is false → continue probing.**

→ Full protocols: `references/01-question-protocols.md`

### Phase 2: UNDERSTAND — Synthesize and Confirm

Restate the intent in the Agent's own words. Include:
- What the user wants (outcome)
- What constraints exist (boundaries)
- What success looks like (criteria)
- What the Agent will do next (action)

**Example:**
> "So you want a skill that manages iterative user engagement — it should probe intent, delegate tasks, and persist context across long sessions. Constraints: under 500 lines, universal terminology, reference files for depth. I'll start with the SKILL.md structure, then fill references. Correct?"

### Phase 3: PLAN — Structure the Work

Break into discrete, verifiable tasks. Use `planning-with-files` for multi-session work.

| Task Granularity | When |
|------------------|------|
| Single file change | Execute directly |
| 2-5 related changes | Execute with checkpoints |
| 6+ changes or cross-cutting | Delegate to subagent |
| Unknown scope | Probe more, then decide |

### Phase 4: DELEGATE — Hand Off or Stay

| Condition | Action |
|-----------|--------|
| Task is well-scoped, independent | Dispatch subagent with full context |
| Task requires user judgment | Stay in control, ask user |
| Task depends on previous output | Sequential dispatch |
| Multiple independent tasks | Parallel dispatch (`dispatching-parallel-agents`) |
| Task is ambiguous | Do NOT delegate — clarify first |
| **Task is skill file creation/edit AND Agent is Coordinator** | **Delegate to writer subagent — Coordinator must NOT edit skill files directly** |

**Delegation rules:**
- Always pass the user's original intent verbatim
- Include constraints and success criteria
- Require the subagent to write outputs to disk
- Set a budget (token limit or turn limit)

→ Delegation patterns: `dispatching-parallel-agents`

### Phase 5: UPDATE — Keep User Informed

| Event | Update Type |
|-------|-------------|
| Phase complete | Brief summary + next step |
| Blocker found | Problem + options + recommendation |
| Delegation dispatched | "Spinning up subagent for X, will report back" |
| Session checkpoint | "Saved state to disk. We're at step N of M." |
| User asks for status | Full progress report |

**Update discipline:**
- Be specific, not vague ("Fixed the parser" not "Made progress")
- Include what changed, not just what happened
- Offer options when blocked, don't just report problems
- Never update more than once per turn unless asked

### Phase 6: DELIVER — Loop Termination

The loop terminates when ALL of the following are true:

| Termination Criterion | Check |
|-----------------------|-------|
| User's confirmed intent is fully addressed | Can point to specific deliverables |
| All success criteria are met | User can verify "done" |
| All planned phases are complete | `task_plan.md` shows all phases done |
| No open blockers remain | Blockers section is empty or resolved |
| User has acknowledged delivery | User said "looks good", "done", or equivalent |

**If any criterion is false → return to the appropriate phase (PROBE, PLAN, or DELEGATE).**

**Delivery actions:**
1. Summarize what was delivered
2. Point to specific files or outputs
3. Offer final adjustments
4. Write final checkpoint to `progress.md`
5. If using git, commit the work

---

## Hierarchy Awareness

The Agent must understand its position in the task hierarchy:

| Role | Responsibility |
|------|----------------|
| Front Agent | Owns user relationship, controls delegation, maintains context |
| Parent Agent | Manages child sessions, enforces budgets, aggregates results |
| Child Agent | Executes scoped task, writes output to disk, reports back |

**Key rule:** The Front Agent never fully delegates the user relationship. It delegates tasks, not trust.

---

## Session Persistence Protocol

Context is lost between turns by default. The only defense is write-to-disk.

**Concrete file paths** — write to the project workspace directory:

| What to Persist | File Path | When |
|-----------------|-----------|------|
| User's stated intent | `<project-root>/progress.md` | Every confirmation |
| Current phase + step | `<project-root>/task_plan.md` | Every phase change |
| Decisions made | `<project-root>/progress.md` | Every decision |
| Discovered facts | `<project-root>/findings.md` | Every 2-3 discoveries |
| Delegation state | `<project-root>/progress.md` | Every dispatch/return |
| Session checkpoints | `<project-root>/.checkpoints/<timestamp>-<name>.md` | On request or phase change |

**Recovery rule:** On session restart, read `task_plan.md` first, then `findings.md`, then `progress.md`. Reconstruct state from disk, not from memory.

→ Full persistence: `references/02-context-preservation.md`, `references/04-long-session-management.md`

---

## Quick Reference: Decision Matrix

| Situation | Probe? | Plan? | Delegate? | Update? |
|-----------|--------|-------|-----------|---------|
| Vague request | Yes — first | After | No | After confirm |
| Clear task, small scope | No | Mental | No | On complete |
| Clear task, large scope | No | Yes — written | Yes | On dispatch + complete |
| Blocked | Yes — root cause | Yes — options | Maybe | Immediately |
| User checks in | No | No | No | Yes — full report |
| Session restart | Yes — re-confirm | Yes — re-read | After | On recovery |
| Skill file creation | Yes — scope + constraints | Yes — structure | **Yes — delegate to writer** | On dispatch + complete |

---

## Anti-Patterns

| # | Anti-Pattern | Detection | Enforcement Gate |
|---|-------------|-----------|-----------------|
| 1 | **The Premature Executor** — Acting before understanding. Writing files before PROBE is complete. | Check: has user confirmed intent? If no, STOP. | **GATE: Before any file write, verify PROBE phase is complete. If not, abort write and return to PROBE.** |
| 2 | **The Interrogator** — Asking 4+ questions in one turn. | Count questions per turn. | **GATE: Max 3 questions per turn via OpenCode question tool.** |
| 3 | **The Yes-Agent** — Accepting vague requests without probing. | Check: are all 6 stop conditions met? | **GATE: If any stop condition is false, must probe before acting.** |
| 4 | **The Abandoner** — Delegating and disappearing. | Check: has subagent reported back? | **GATE: Must report subagent results before next action.** |
| 5 | **The Amnesiac** — Losing context between turns. | Check: are persistence files updated? | **GATE: Write to disk every turn. On restart, read files before acting.** |
| 6 | **The Silent Worker** — Executing for 20 turns without updates. | Count turns since last update. | **GATE: Update at every phase boundary, max 10 turns between updates.** |
| 7 | **The Scope Creep** — Adding features the user didn't ask for. | Compare deliverables to confirmed intent. | **GATE: Every deliverable must trace to a confirmed user requirement.** |
| 8 | **The Orphan Dispatcher** — Sending subagents without context or success criteria. | Check delegation message for required fields. | **GATE: Delegation must include intent, constraints, success criteria, and budget.** |
| 9 | **The Skill Ignorer** — Loading a skill for its file list but bypassing its workflow. | Check: did you follow the loaded skill's gates? | **GATE: If you load a skill with gates or phases, you must follow them.** |
| 10 | **The Coordinator Executor** — Coordinator edits skill files directly instead of delegating. | Check: is task skill file creation AND Agent is Coordinator? | **GATE: Skill file creation/edit by Coordinator → delegate to writer subagent.** |

---

## Worked Example: End-to-End Skill Creation

```
User: "I want to create a skill like this @.kilo/command/deep-research-synthesis-repomix.md"

Agent: [Loads 3 platform skills first per FIRST ACTION block]
Agent: [PROBE Phase — Turn 1]
  question("Should this skill cover just the deep-research synthesis pattern,
            or also include auditing and eval capabilities?")

User: "Just the synthesis pattern for now"

Agent: [PROBE Phase — Turn 2]
  question("What should trigger this skill? Something like 'synthesize this repo'
            or 'deep research this codebase'?")

User: "Both of those, plus 'analyze this repo deeply'"

Agent: [PROBE Phase — Turn 3]
  question("Should it follow the exact SKILL.md + references structure,
            or do you want a simpler single-file version?")

User: "Full structure with references"

Agent: [UNDERSTAND Phase]
  "So: a skill that triggers on 'synthesize this repo', 'deep research this codebase',
   or 'analyze this repo deeply'. It should use the full SKILL.md + references structure,
   focused on deep-research synthesis patterns. I'll plan the structure, then delegate
   the file writing to a subagent. Correct?"

User: "Yes"

Agent: [PLAN Phase — writes task_plan.md]
  Phase 1: Audit existing skill patterns
  Phase 2: Draft SKILL.md
  Phase 3: Write reference files
  Phase 4: Write scripts
  Phase 5: Validate and commit

Agent: [DELEGATE Phase]
  "Spinning up a writer subagent for Phase 1. Budget: 2000 tokens.
   It will audit existing skill patterns and write findings to disk."

[... subagent completes, reports back ...]

Agent: [UPDATE Phase]
  "Phase 1 complete. Found 3 relevant patterns. Moving to Phase 2 — drafting SKILL.md."

[... phases 2-5 complete ...]

Agent: [DELIVER Phase — all termination criteria met]
  "All 5 phases complete. Delivered:
   - SKILL.md (380 lines)
   - 4 reference files
   - 2 validation scripts
   All committed. Want any adjustments?"
```

---

## Cross-References

| Skill | Relationship |
|-------|-------------|
| `planning-with-files` | Use for multi-session planning. This skill decides WHEN to use it. |
| `dispatching-parallel-agents` | Use for parallel task execution. This skill decides WHAT to parallelize. |
| `deep-research` / `deep-investigation` | Use for deep topic exploration. This skill decides WHEN depth is needed. |
| `gcc` | Use for git-backed memory. This skill decides WHAT to persist. |
| `coordinating-loop` | Sibling skill in GROUP 1. **Handoff point:** When intent is confirmed and work is scoped, load `coordinating-loop` to plan execution. This skill owns the user relationship up to that point. |

---

## Platform Adaptation

| Platform | Question Tool | Skill Loading | File Paths |
|----------|--------------|---------------|------------|
| **OpenCode** | `question` tool (native) | `skill({ name: "..." })` | Project root or `.opencode/` |
| **Claude Code** | Text output (no native question tool) | `Skill` tool | Project root or `.claude/` |
| **Codex** | Text output | Platform-specific skill loading | Project root |
| **Cursor** | Chat interface | Platform-specific skill loading | Project root or `.cursor/` |

**Max 3 questions per turn** applies on all platforms. On platforms without a native question tool, output questions as text and wait for user response before proceeding.

---

## Reference Map

| File | Purpose |
|------|---------|
| `references/01-question-protocols.md` | How to probe user intent — question types, sequencing, skill-creation examples, stop conditions |
| `references/02-context-preservation.md` | Maintaining awareness across sessions — concrete file paths, persistence, recovery, compaction |
| `references/03-brainstorming-patterns.md` | Facilitating ideation — divergence/convergence, skill-creation examples, decision frameworks |
| `references/04-long-session-management.md` | Persisting through extended sessions — budget management, explicit termination, checkpoint strategy |
