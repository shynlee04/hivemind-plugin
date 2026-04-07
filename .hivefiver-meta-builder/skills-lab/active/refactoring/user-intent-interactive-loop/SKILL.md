---
name: user-intent-interactive-loop
description: >
  Use when the user needs help figuring out what they want, has a vague or
  underspecified request, or drops a wall of text with multiple meta-concept
  problems. Triggers on: "build me a skill like this @file", "fix my skills,
  agents, and commands", "my skill doesn't load", "i'm not sure what i need,
  help me figure it out", "customize my meta concepts", "i have skills that
  conflict", "improve this skill", "what should i do first", "help me plan
  my skill system", "diagnose my agents", "audit my commands", "unclear intent",
  "probe requirements", "long session management", "parent child delegation",
  "context preservation", "iterative engagement", "clarify before delegating".
  Maintains context across long sessions, probes intent through targeted
  questions, diagnoses what needs improvement across skills/agents/commands,
  and prepares routing to specialist skills only after intent is confirmed.
metadata:
  layer: "1"
  role: "front-agent"
  pattern: P3
  version: "1.1.0"
  lineage: "meta-builder"
  hierarchy: "coordinator"
  orientation: "how-to-process"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - Question
---

# user-intent-interactive-loop

Front-agent skill for iterative user engagement. The Agent stays in control, probes intent, delegates appropriately, and keeps users informed across long sessions. Deep material lives in `references/`; this body encodes the loop pattern, delegation rules, and persistence discipline.

---

## HARD GATES — Non-Negotiable Enforcement

These gates block phase transitions. They are checked by `scripts/intent-verify.sh`, not by self-assessment.

### Gate 1: Question Tool Cap
- **Rule:** Max 3 questions per PROBE phase, via OpenCode `question` tool ONLY.
- **Enforcement:** Each question increments `.opencode/state/question-count.json`. Script reads count.
- **Violation:** If count > 3, `intent-verify.sh --probe` returns exit 1. PROBE cannot end.
- **No bypass:** Plain-text questions count toward the cap. Track them too.

### Gate 2: PROBE Stop Conditions (ALL 6 Must Be True)
Each condition maps to a concrete, checkable artifact:

| # | Condition | Checkable Artifact | Verification Command |
|---|-----------|-------------------|---------------------|
| 1 | Scope bounded | `intent.json` has `"scope_in"` and `"scope_out"` arrays, each ≥ 1 item | `jq '.scope_in \| length > 0 and .scope_out \| length > 0' intent.json` |
| 2 | Success defined | `intent.json` has `"success_criteria"` string, non-empty, ≥ 10 chars | `jq '.success_criteria \| length >= 10' intent.json` |
| 3 | Constraints known | `intent.json` has `"constraints"` array, ≥ 1 item | `jq '.constraints \| length >= 1' intent.json` |
| 4 | Priority set | `intent.json` has `"priority"` with value "high", "medium", or "low" | `jq '.priority \| test("^(high\|medium\|low)$")' intent.json` |
| 5 | Delegation level set | `intent.json` has `"delegation"` with value "execute", "delegate", or "clarify" | `jq '.delegation \| test("^(execute\|delegate\|clarify)$")' intent.json` |
| 6 | User confirmed | `progress.md` contains "USER CONFIRMED: yes" or equivalent explicit confirmation | `grep -qi "USER CONFIRMED.*yes" progress.md` |

**If ANY condition fails → PROBE continues. No exceptions.**

### Gate 3: Ecosystem Loading Order (RECOMMENDED, NOT BLOCKING)

Before any action in PROBE phase, attempt to load 3 background skills. These enhance capability but are NOT required — the skill functions standalone without them.

1. **Run hierarchy verification (informational):**
   ```bash
   bash scripts/verify-hierarchy.sh user-intent-interactive-loop
   ```
   This checks which background skills are loaded in `.opencode/state/loaded-skills.json`.

   **If exit 1 → PROCEED WITH DEGRADED CAPABILITY.** Log which skills are missing. The core function (probing intent via questions) does not require codebase exploration or shell strategy.

2. **Register this skill as loaded:**
   ```bash
   bash scripts/register-skill.sh user-intent-interactive-loop
   ```

3. **Load background skills if available (not blocking):**
   ```
   skill("opencode-platform-reference")  — enhances platform-aware probing
   skill("repomix-exploration-guide")    — enables codebase-aware questions
   skill("opencode-non-interactive-shell") — enables shell-safety awareness
   ```

   **If any skill is not found → continue without it.** Do not block. Do not error. The PROBE phase works with questions alone.

### Gate 4: Validation Loop
After intent appears confirmed:
1. Write `intent.json` with all 6 stop condition fields
2. Run `bash scripts/intent-verify.sh --probe`
3. If exit 0 → proceed to UNDERSTAND phase
4. If exit 1 → read failure details, fix `intent.json`, return to PROBE
5. Repeat until exit 0

---

## FIRST ACTION — When This Skill Loads

**Do this before anything else, in this exact order:**

1. **Run hierarchy verification (informational):**
   ```bash
   bash scripts/verify-hierarchy.sh user-intent-interactive-loop
   ```
   If this exits 1, log which skills are missing and continue. Do NOT stop.

2. **Register this skill as loaded:**
   ```bash
   bash scripts/register-skill.sh user-intent-interactive-loop
   ```

3. **Load 3 platform skills if available (not blocking):**
   ```
   skill("opencode-platform-reference")
   skill("repomix-exploration-guide")
   skill("opencode-non-interactive-shell")
   ```
   If any skill is not found, continue without it.

4. **Initialize tracking files:**
   ```bash
   mkdir -p .opencode/state
   echo '{"question_count": 0, "questions": []}' > .opencode/state/question-count.json
   echo '{"scope_in": [], "scope_out": [], "success_criteria": "", "constraints": [], "priority": "", "delegation": "", "user_confirmed": false}' > .opencode/state/intent.json
   ```

5. **GATE: Do not write, edit, or delete any project file until PROBE phase passes Gate 4 (validation loop).**

---

## Required Skill Loads

| Purpose | Skills | Load Order |
|---------|--------|------------|
| Platform reference | `opencode-platform-reference` | **First** — before any action |
| Codebase exploration | `repomix-exploration-guide` | **First** — before any action |
| Shell strategy | `opencode-non-interactive-shell` | **First** — before any action |
| Parallel dispatch | `dispatching-parallel-agents` | After PROBE passes Gate 4 |
| File-based planning | `planning-with-files` | After PROBE passes Gate 4 |
| Deep investigation | `deep-research` or `deep-investigation` | After PROBE passes Gate 4 |
| Git-backed memory | `gcc` | After PROBE passes Gate 4 |
| Skill creation | `skill-creator`, `writing-skills` | After PROBE passes Gate 4 |

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

## Chaos Handling — Wall of Text, Folder Dumps, Absurd Requests

When the user's input is unstructured, oversized, or chaotic:

1. **SKIM FIRST** — Count files referenced, estimate LOC, identify structure. Do NOT read everything.
2. **EXTRACT KEY ENTITIES** — What meta-concepts are mentioned? (skills, agents, commands, tools)
3. **CONFIRM UNDERSTANDING** — Restate what you see: "You've dropped X files about Y. You want Z. Is that right?"
4. **IF INPUT EXCEEDS 50 FILES OR 10K LOC** — Delegate to `explore` agent for triage before PROBE.
5. **PROCEED WITH NORMAL PROBE** — Once structure is understood, ask targeted questions.

**Never:** Read every file the user references. Skim frontmatter, first headings, and file names only.

---

## Core Pattern: The Interactive Loop

```
PROBE → UNDERSTAND → PLAN → DELEGATE → UPDATE → DELIVER
```

### Phase 1: PROBE — Extract Intent

Ask targeted questions using the OpenCode `question` tool. **Maximum 3 questions total across entire PROBE phase.**

| Question Type | Purpose | Example |
|---------------|---------|---------|
| Scope boundary | Define what's in/out | "Should this skill cover just creation, or also auditing and evals?" |
| Success criteria | Define done | "What does a 'good' skill look like — line count, trigger accuracy?" |
| Constraint check | Surface limits | "Any existing skills this should reference or avoid overlapping with?" |
| Priority signal | Rank importance | "Is trigger accuracy or content depth the priority?" |
| Delegation appetite | Gauge trust level | "Should I draft the skill myself or dispatch a writer subagent?" |

**Question selection by user input:**

| User Says | Ask First |
|-----------|-----------|
| "I want to create a skill" | Scope boundary — "What should this skill do? What triggers it?" |
| "Clone this pattern into a skill" | Constraint check — "Should it follow the exact structure of the source?" |
| "Turn this document into a skill" | Success criteria — "What's the core behavior?" |
| "Improve this skill" | Scope boundary — "What aspect — description, references, scripts, or the whole pack?" |
| "I need help figuring out..." | Scope boundary — "What domain are we in — code, skills, config, or something else?" |

**After each answer, update `intent.json` immediately.**

→ Full protocols: `references/01-question-protocols.md`

### Phase 2: UNDERSTAND — Synthesize and Confirm

Restate the intent in the Agent's own words. Include:
- What the user wants (outcome)
- What constraints exist (boundaries)
- What success looks like (criteria)
- What the Agent will do next (action)

**Write confirmation to `progress.md`:**
```
## User Confirmation
USER CONFIRMED: yes
Intent: <restated intent>
Constraints: <list>
Success: <criteria>
```

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
| **Task is skill file creation AND Agent is Coordinator** | **Delegate to writer subagent** |

**Delegation rules:**
- Always pass the user's original intent verbatim
- Include constraints and success criteria
- Require the subagent to write outputs to disk
- Set a budget (token limit or turn limit)

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

**If any criterion is false → return to the appropriate phase.**

**Delivery actions:**
1. Summarize what was delivered
2. Point to specific files or outputs
3. Offer final adjustments
4. Write final checkpoint to `progress.md`
5. If using git, commit the work

---

## Validation Loop Procedure

After Phase 2 (UNDERSTAND) completes:

```
1. Write intent.json with all 6 stop condition fields
2. Run: bash scripts/intent-verify.sh --probe
3. If exit 0:
   → PROBE phase complete, proceed to PLAN
4. If exit 1:
   → Read stderr output for failed conditions
   → Update intent.json to fix failures
   → Return to PROBE for missing information
   → Repeat from step 2
```

**Maximum 3 validation loop iterations.** If still failing after 3 attempts, escalate to user with specific missing information.

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
| Question tracking | `.opencode/state/question-count.json` | Every question asked |
| Intent capture | `.opencode/state/intent.json` | Every answer received |

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

## Worked Examples

See `references/05-worked-examples.md` for complete end-to-end examples:
- Example 1: Skill creation from template (PROBE → UNDERSTAND → PLAN → DELEGATE → DELIVER)
- Example 2: Vague request — scope clarification
- Example 3: Long session recovery protocol

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
| `references/05-worked-examples.md` | End-to-end examples: skill creation, vague request handling, session recovery |
