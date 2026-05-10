# Agent role mode steering system

**Session ID:** ses_1f2e0b3f0ffeweqtbz5Fa9r9fM
**Created:** 5/9/2026, 9:23:35 PM
**Updated:** 5/9/2026, 9:33:44 PM

---

## User

@.hivemind/planning/ideating/agent-role-mode-steering-2026-05-09.md 

---

## Assistant (Hm-L0-Orchestrator · MiMo V2.5 Pro · 25.2s)

_Thinking:_

The user has shared a planning document about "Agent modes, roles, profile steering" - this is a high-level ideation document for a new feature in the Hivemind harness. Let me analyze what they're asking for.

The document describes:
1. A system for injecting conditional "reminder" messages into agent sessions based on agent hierarchy, role, and current context
2. This would use hooks and event subscriptions to inject steering messages that don't require responses
3. The goal is to keep agents aligned to their roles, workflows, and constraints throughout long sessions
4. It addresses problems like: agents drifting after compact, losing role awareness, subagents thinking they talk to users directly, not following governance patterns


5. Now I need to check the available skills to see what applies here - this is clearly a design and architecture task, so I should look at brainstorming, agent-orchestrator, and design-an-interface to understand what tools I have available for this kind of work.

I am hm-orchestrator, front-facing L0 for hm-* product development. I route, delegate, and gatekeep — I never implement.

This is a **planning/ideation** request for a new feature: **Agent Role/Mode Steering via conditional message injection**. Let me classify and route.

**Intent Classification:** Planning domain — this is a pre-brainstorm ideation document that needs deep research, synthesis, and architectural design before any implementation.

Let me load the relevant skills to properly frame this work.

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l2-brainstorm"
}
```

**Output:**
```
<skill_content name="hm-l2-brainstorm">
# Skill: hm-l2-brainstorm

# Brainstorming: Intent → Requirements

Bridge vague user intent to a formal requirements brief through structured questioning, assumption detection, and scope surfacing. This skill owns the ideation-to-requirements phase. It does NOT design solutions — only clarifies WHAT needs to be built.

This package synthesizes three inspected third-party patterns:

| Source | Adopt / Adapt decision | Local transformation |
|--------|------------------------|----------------------|
| `obra/superpowers@brainstorming` | Adopt sequential questioning, hard-gate-before-code, one-question-at-a-time, approach comparisons. Adapt away from superpowers-specific paths. | Use Gate 1 (no implementation before requirements brief approved), one-question-at-a-time, approach comparison in Phase 2. |
| `ratacat/claude-skills@brainstorming` | Adopt YAGNI principles, question techniques, anti-patterns table, handoff options. Adapt generic design doc → hm-specific requirements brief. | Use YAGNI filter in Phase 2, question techniques in Phase 1, anti-patterns throughout. |
| `Jamie-BitFlight/brainstorming-skill` | Adopt assumption challenge technique, constraint variation. Defer creative ideation patterns (perspective multiplication, inversion, SCAMPER). | Use assumption challenge in Phase 1.3, constraint variation in Phase 2.1. |

## HARD GATE — No Code Before Requirements Brief

```
DO NOT write code, scaffold projects, or invoke implementation skills
until the requirements brief is produced AND approved by the user.
This applies to EVERY project regardless of perceived simplicity.
```

## Entry Gate

Proceed when any of these are true:
- User said "brainstorm", "ideation", "figure out what to build", "explore ideas"
- User intent is vague or underspecified (missing constraints, success criteria, scope)
- User describes a problem without specifying a solution direction
- A coordinator skill (`hm-user-intent-interactive-loop`, `hm-coordinating-loop`) routes to this skill

Do NOT proceed when:
- A PRD, spec, or formal requirements document already exists → route to `hm-spec-driven-authoring`
- The task is a straightforward bug fix with clear expected behavior → execute directly
- The user says "just do it", "I know exactly what I want" with explicit details

## Checklist

Create a task for each item and complete them in order. Do not skip phases.

- [ ] Phase 1: Understand Intent — structured questioning, assumption detection, scope surfacing
- [ ] Phase 2: Explore Requirements — approach options, constraint mapping, priority setting
- [ ] Phase 3: Produce Requirements Brief — structured output for handoff
- [ ] Phase 4: Handoff — route to next skill (hm-spec-driven-authoring, hm-deep-research, or hm-detective)

## Phase 1: Understand Intent

### 1.1 Gather Context

Before asking the user any questions:
1. Check project files: `README.md`, instruction files (`AGENTS.md` or equivalent), `package.json`, recent commits
2. Identify the project domain, stack, and existing patterns
3. Check for existing specs, PRDs, or design docs that relate to the request
4. If the request mentions a specific file or module, read it

### 1.2 Assess Scope

Flag scope issues immediately — do NOT burn questions on something that needs decomposition first.

**Multi-system signal:** If the request describes multiple independent subsystems (e.g., "build a platform with auth, payments, and real-time chat"), stop and say:

> "This request spans multiple independent systems: [list them]. Each needs its own requirements brief. Which should we start with?"

**Appropriately scoped:** A single feature, component, module, or workflow. Continue to Phase 1.3.

### 1.3 Ask Clarifying Questions

**One question at a time.** Prefer multiple choice when natural options exist. Break complex topics into multiple questions.

Use question patterns from `references/question-patterns.md`. Default priority order:

| Priority | Category | Example |
|----------|----------|---------|
| 1 | Purpose | "What problem does this solve? (a) automate existing workflow, (b) add new capability, (c) replace legacy system" |
| 2 | Users | "Who uses this? (a) developers, (b) end-users, (c) admins — or multiple?" |
| 3 | Constraints | "Any hard constraints? Technology, timeline, compliance, dependencies?" |
| 4 | Success | "How will you know this is working? What does success look like?" |
| 5 | Scope boundaries | "What should this explicitly NOT do?" |

**Stop conditions (any of these):**
- User says "proceed", "let's move on", "that's enough questions"
- 5 questions asked (stop and surface what you have)
- All 5 priority categories covered with clear answers
- The intent is clear enough to state: "We need to build [X] so that [Y] can [Z]"

### 1.4 Detect Unstated Assumptions

After gathering answers, run assumption detection using `references/assumption-detection.md`:

1. List every assumption you made about the user's request
2. Validate explicit assumptions with the user: "I'm assuming [X]. Is that correct?"
3. Surface implicit assumptions the user may not have considered: "This implies [Y] will need to happen. Is that in scope?"

Record all validated assumptions in the requirements brief.

### 1.5 Pause for Confirmation

After questions are exhausted (max 5), restate your understanding:

```markdown
## Intent Summary

**Problem:** [1-2 sentences]
**Target users:** [who]
**Success looks like:** [measurable outcome]
**In scope:** [what's included]
**Out of scope:** [what's explicitly excluded]
**Key constraints:** [hard boundaries]
**Validated assumptions:** [confirmed assumptions]

Does this match what you had in mind? Adjustments before we explore requirements?
```

Wait for user confirmation before proceeding to Phase 2.

## Phase 2: Explore Requirements

### 2.1 Propose 2-3 Approach Directions

Not implementations — requirement shapes. For each approach, describe:

```markdown
### Direction A: [Name]

**What gets built:** [what the user would end up with]
**Key requirements:** [2-3 bullet requirements this direction implies]
**Trade-offs:** [what's gained vs. lost]

**Best when:** [conditions this direction suits]
```

**Guidelines:**
- Lead with a recommendation and explain why
- Apply YAGNI ruthlessly — remove unnecessary requirements
- Reference existing codebase patterns when relevant
- Challenge over-engineering: "Do we really need [complex requirement], or would [simpler version] suffice?"

### 2.2 Map Requirements by Priority

For the chosen direction, produce a prioritized requirement list:

```markdown
| Priority | Requirement | Rationale | Verification idea |
|----------|------------|-----------|-------------------|
| P0 — Must have | [requirement] | [why critical] | [how to verify] |
| P1 — Should have | [requirement] | [why important] | [how to verify] |
| P2 — Nice to have | [requirement] | [why deferrable] | [how to verify] |
```

### 2.3 Detect Research Needs

During requirements exploration, if you hit any of these signals, flag for research routing:

| Signal | Route to |
|--------|----------|
| "I'm not sure what library/framework to use" | `hm-deep-research` |
| "How does [existing code] work?" | `hm-detective` |
| "What's the best practice for [domain]?" | `hm-deep-research` |
| "Can we even do [technical requirement]?" | `hm-deep-research` |

Say: "This requirement needs more investigation. I recommend pausing here, researching [topic] via `hm-deep-research`, and returning with findings before we finalize the requirements brief."

### 2.4 Pause for Confirmation

Confirm the requirement map with the user before producing the brief.

## Phase 3: Produce Requirements Brief

Use the template from `references/handoff-template.md`. Write to a file in the project's requirements/planning directory:

```
<project-root>/requirements/YYYY-MM-DD-<topic>-brief.md
```

**Framework adapter:** If the project uses GSD, write to `.planning/requirements/`. If using BMAD, align with BMAD elicitation artifacts. If no framework is detected, default to `requirements/` in the project root. Ask the user for their preferred location if uncertain.

**Template sections:**
1. **Intent Summary** — from Phase 1.5, user-confirmed
2. **Functional Requirements** — prioritized list (P0/P1/P2)
3. **Non-Functional Requirements** — performance, security, accessibility, reliability
4. **Constraints** — technical, timeline, dependency, compliance
5. **Assumptions** — all validated and surfaced assumptions
6. **Open Questions** — unresolved items for the spec phase
7. **Research Notes** — any deferred research references
8. **Handoff** — routing recommendation to next skill

## Phase 4: Handoff

Present clear options:

1. **Proceed to spec-driven authoring** → Load `hm-spec-driven-authoring` with the requirements brief as input
2. **Research needed first** → Route to `hm-deep-research` or `hm-detective`
3. **Refine further** → Return to Phase 1.3 with targeted questions
4. **Done for now** → Requirements brief committed; user returns later

## Decision Tree: When to Route vs. Continue

```
Is user intent clear enough for a requirements brief?
  YES → Is research needed for any requirement?
    YES → Route to hm-deep-research / hm-detective → return to Phase 2
    NO → Continue to Phase 3 (produce brief)
  NO → Is this a multi-system request?
    YES → Decompose into sub-projects → pick first → restart Phase 1
    NO → Continue Phase 1.3 (more questions, max 5 total)
```

## Routing Table

| Situation | Skill to Load |
|-----------|---------------|
| Requirements brief ready, needs spec-locking | `hm-spec-driven-authoring` |
| Need library/framework/pattern research | `hm-deep-research` |
| Need to understand existing codebase | `hm-detective` |
| User intent still unclear after 5 questions | Return to `hm-user-intent-interactive-loop` |
| Multi-agent coordination needed | `hm-coordinating-loop` |

## Boundary Rules

| Nearby workflow | Boundary |
|----------------|----------|
| `hm-spec-driven-authoring` | Consumes the requirements brief and derives falsifiable requirements. This skill produces the brief; spec-driven-authoring locks it. |
| `hm-deep-research` | Investigates technical unknowns surfaced during requirements exploration. This skill detects the need and routes. |
| `hm-detective` | Explores existing codebase for patterns and constraints. Route when "how does this work?" arises. |
| `hm-user-intent-interactive-loop` | Handles deep intent probing with persistent state. This skill is the structured-questions layer under it. |
| `hm-test-driven-execution` | Executes after spec-driven-authoring produces RED tests. Not reached directly from brainstorm. |

## YAGNI Filter

Apply this filter before every requirement in the brief:

1. "Does the user's stated problem actually need this?"
2. "What happens if we defer this to P2?"
3. "Is there a simpler version that solves the same problem?"
4. "Are we designing for hypothetical future requirements?"

If any answer justifies removal → remove or defer.

## Anti-Patterns

| Anti-Pattern | Detection | Correction |
|-------------|-----------|------------|
| **Question flood** — asking 3+ questions in one message | Count question marks in your output | One question per message. Break multi-topic questions into separate messages. |
| **Jumping to implementation** — proposing code, architecture, or file structure | "We could use React hooks with..." in Phase 1 | Stay focused on WHAT. Implementation comes after spec-driven-authoring. |
| **Over-engineering** — inventing requirements the user didn't ask for | Requirements list > 10 items for a "simple" request | Run every requirement through YAGNI filter. "Does the user need this?" |
| **Skipping confirmation** — moving to Phase 2 without user sign-off | Phase 1 questions → immediately into approach proposals | Always pause for confirmation after Phase 1.5 and Phase 2.4. |
| **Unvalidated assumptions** — treating guesses as facts | "The user probably wants..." without asking | State assumptions explicitly: "I'm assuming [X]. Is that correct?" |
| **Scope creep acceptance** — saying yes to every user addition | Requirements list grows with each question | "That's interesting — would you like me to add it, or should we capture it as a P2 for later?" |
| **Wrong skill handoff** — routing to implementation skill from brainstorm | "Let me now write the code..." | Requirements brief → hm-spec-driven-authoring → hm-test-driven-execution. Never code from brainstorm. |

## Framework Adapter Notes

This skill is framework-agnostic. When loaded in a project that uses a specific methodology, adapt as follows:

| Framework | Adaptation |
|-----------|------------|
| **GSD** (Get Shit Done) | Write requirements brief to `.planning/` directory. GSD phases consume it naturally. |
| **BMAD** | Align requirements brief with BMAD's elicitation artifacts. Requirements map → BMAD stories. |
| **OpenCode native** | Write brief to `.planning/requirements/`. Use `session-patch` for mid-session append. |
| **None / generic** | Write brief to `.planning/requirements/YYYY-MM-DD-<topic>-brief.md`. No framework assumptions. |

## Validation Before Handoff

Before routing to the next skill, verify:

- [ ] Requirements brief file exists and is complete (8 sections filled)
- [ ] All assumptions are explicitly stated (no hidden guesses)
- [ ] P0 requirements have clear verification ideas
- [ ] Out-of-scope items are explicitly listed
- [ ] Research needs are flagged with routing recommendation
- [ ] User confirmed the brief (in Phase 3)

## Self-Correction

### When the questioning loop gets stuck
**Detection:** User gives short answers ("yes", "no", "idk") for 3+ questions, or intent summary remains unclear after 5 questions.
**Recovery:** Stop asking. Surface what you have: "Here's what I understand so far. The remaining unclear areas are [X, Y]. Would you like to (a) proceed with what we have, (b) take a break and return, or (c) route to `hm-user-intent-interactive-loop` for deeper probing?"

### When the requirements brief is too vague for handoff
**Detection:** The brief has empty sections, P0 requirements lack verification ideas, or out-of-scope list is "none".
**Recovery:** Return to Phase 2.1 — propose 2-3 approach directions with concrete requirements. If the user cannot decide, recommend the simplest direction and explain why. Never hand off a brief that says "TBD" in multiple places.

### When YAGNI is being over-applied (useful requirements removed)
**Detection:** Requirements list is too small (1-2 items) for a multi-step feature request.
**Recovery:** Ask: "The current requirements list is minimal. Are there any must-have aspects I've filtered out? I may have been too aggressive with YAGNI."

### When jumping to implementation prematurely
**Detection:** You find yourself describing code, architecture, file structure, or mentioning libraries in Phase 1 or 2.
**Recovery:** Stop immediately. Restate: "My job is to clarify WHAT to build, not HOW. Let me return to [current phase]." Cross-check against the HARD GATE at the top of this skill.

## Quick Reference

| Phase | Input | Output | Duration |
|-------|-------|--------|----------|
| Phase 1: Understand | Vague intent | Confirmed intent summary + assumptions | 5 questions max |
| Phase 2: Explore | Confirmed intent | Prioritized requirement map + approach direction | 2-3 directions |
| Phase 3: Produce | Requirement map | Requirements brief file | 1 write operation |
| Phase 4: Handoff | Requirements brief | Route to hm-spec-driven-authoring | 1 message |

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-brainstorm
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-brainstorm/scripts/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-brainstorm/task_plan.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-brainstorm/references/assumption-detection.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-brainstorm/references/question-patterns.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-brainstorm/references/handoff-template.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-brainstorm/evals/evals.json</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-brainstorm/metrics/rich-gate-scorecard.md</file>
</skill_files>
</skill_content>
```

**Tool: skill**

**Input:**
```json
{
  "name": "hm-l2-lineage-router"
}
```

**Output:**
```
<skill_content name="hm-l2-lineage-router">
# Skill: hm-l2-lineage-router

## The Iron Law

```
Every task has a lineage. Route to the bundle that matches the task's category. Max 5 skills per bundle.
```

# Lineage Router

## Overview

Given a task intent, determine which hm-* skills should be loaded. This skill maps task categories to skill loading bundles. It does NOT execute skills — it only determines which skills to load and in what order.

**Six task categories, six skill bundles:**

| Category | Skills | Max |
|----------|--------|-----|
| Research | hm-detective + hm-deep-research + hm-tech-stack-ingest | 3 |
| Planning | hm-spec-driven-authoring + hm-planning-persistence | 2 |
| Execution | hm-phase-execution + hm-cross-cutting-change | 2 |
| Quality | hm-test-driven-execution + hm-gate-orchestrator | 2 |
| Debug | hm-debug + hm-completion-looping | 2 |
| Review | hm-production-readiness + hm-gate-orchestrator | 2 |

## On Load

1. Read `references/routing-map.md` — the complete routing map with priority ordering and dependency chains
2. Identify the task intent from the current context
3. Classify the task into one of the six categories

## Trigger Phrases

- "route task" / "route this task"
- "classify intent" / "classify task intent"
- "which skill to load" / "what skills do I need"
- "task routing" / "lineage routing"
- "skill bundle for task" / "load skills for"
- "skill loading order" / "determine skill lineage"
- "map task to skills" / "skill selection for workflow"

## Routing Map

### Category 1: Research Tasks

**Intent signals:** "investigate", "research", "find out", "analyze", "look into", "explore"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-detective` | Codebase investigation (SCAN/READ/DEEP modes) |
| 2 | `hm-deep-research` | Version-matched deep research with citations |
| 3 | `hm-tech-stack-ingest` | Cache third-party docs for offline reference |

**Loading order:** hm-tech-stack-ingest (if stack cache needed) → hm-detective → hm-deep-research

### Category 2: Planning Tasks

**Intent signals:** "plan", "spec", "requirements", "design", "architect"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-spec-driven-authoring` | Falsifiable requirements + acceptance criteria |
| 2 | `hm-planning-persistence` | 3-file external memory for multi-session planning |

**Loading order:** hm-planning-persistence (setup) → hm-spec-driven-authoring (content)

### Category 3: Execution Tasks

**Intent signals:** "implement", "build", "execute", "run the phase", "code"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-phase-execution` | Wave-based parallelization + checkpoint recovery |
| 2 | `hm-cross-cutting-change` | Cross-pane modification safety for breaking changes |

**Loading order:** hm-phase-execution (primary) → hm-cross-cutting-change (when touching multiple layers)

### Category 4: Quality Tasks

**Intent signals:** "test", "verify", "quality", "validate", "TDD", "red-green-refactor"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-test-driven-execution` | RED/GREEN/REFACTOR cycles with runtime truth |
| 2 | `hm-gate-orchestrator` | Quality gate triad pipeline (lifecycle → spec → evidence) |

**Loading order:** hm-test-driven-execution (implementation) → hm-gate-orchestrator (validation)

### Category 5: Debug Tasks

**Intent signals:** "debug", "fix", "broken", "failing", "error", "investigate issue"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-debug` | Systematic debugging with persistent state |
| 2 | `hm-completion-looping` | Guardrail against premature completion claims |

**Loading order:** hm-debug (investigation) → hm-completion-looping (verification)

### Category 6: Review Tasks

**Intent signals:** "review", "audit", "readiness", "deploy check", "ship ready"

| Priority | Skill | Role |
|----------|-------|------|
| 1 | `hm-production-readiness` | Deployment safety verification (8 dimensions) |
| 2 | `hm-gate-orchestrator` | Quality gate triad for final approval |

**Loading order:** hm-production-readiness (evidence collection) → hm-gate-orchestrator (gate verification)

## Loading Rules

1. **Max 5 skills per bundle.** If a task needs more than 5, split the task.
2. **Load in priority order.** Lower-numbered skills load first.
3. **Respect dependencies.** If Skill B depends on Skill A's output, load A first.
4. **Classify before loading.** Determine the category before loading any skills.
5. **Multi-category tasks.** If a task spans 2 categories, load the primary category's bundle first, then add 1-2 skills from the secondary category (staying within the 5-skill limit).

### Multi-Category Decision Tree

```
Task spans 2 categories?
  → YES: Primary category gets full bundle (2-3 skills)
         Secondary category gets 1-2 skills from its bundle
         Total must be ≤ 5
  → NO:  Load single bundle (2-3 skills)

Task spans 3+ categories?
  → SPLIT THE TASK. No single task should span 3+ categories.
```

## Self-Correction

### Anti-Pattern 1: Overloading

**Detection:** More than 5 skills being loaded for a single task.
**Correction:** Split the task into subtasks. Each subtask gets its own bundle. Signal: "Task too broad — split into [A] and [B], then route each independently."

### Anti-Pattern 2: Wrong Lineage

**Detection:** Loading hf-* skills for an hm-* task, or vice versa.
**Correction:** This router handles hm-* lineage only. If the task is a meta-builder task (creating skills, agents, commands), route to hf-meta-builder instead. If the task is a product-dev task, use this router.

### Anti-Pattern 3: Missing Input

**Detection:** Task intent cannot be classified into any of the 6 categories.
**Correction:** If the task is genuinely new (e.g., "monitor production"), route to the closest category and flag: "No exact match. Routed to [closest category]. Verify the bundle covers the task's needs."

### Anti-Pattern 4: Stale Bundles

**Detection:** A loaded skill references another skill not in the current bundle, and the referenced skill is critical for the task.
**Correction:** Add the missing skill to the bundle if the total stays ≤ 5. If adding would exceed 5, remove the lowest-priority skill from the current bundle and document the trade-off.

## Quality Contract (HMQUAL Compliance)

| HMQUAL | Compliance | Evidence |
|--------|-----------|----------|
| HMQUAL-01 | Trigger phrases ≥7 in description | 12 trigger phrases in description |
| HMQUAL-02 | Self-correction with 4 anti-patterns | Overloading, Wrong Lineage, Missing Input, Stale Bundles |
| HMQUAL-03 | Cross-references to sibling skills | 13 skill references across 6 bundles + 4 consumer skills |
| HMQUAL-04 | Progressive disclosure | SKILL.md (routing map) + references/routing-map.md (detailed routing) |
| HMQUAL-05 | Evals with 3 scenarios | evals/evals.json — 3 trigger scenarios |
| HMQUAL-06 | Metrics scorecard | metrics/rich-gate-scorecard.md |
| HMQUAL-07 | Iron law enforcement | "Max 5 skills per bundle." |
| HMQUAL-08 | Honest RICH scoring | Scored in metrics/rich-gate-scorecard.md |

## Cross-References

| Related Skill | Boundary |
|---------------|----------|
| `hm-coordinating-loop` | Consumer — uses this router to determine skill bundles for delegated tasks |
| `hm-phase-execution` | Consumer — uses this router to determine execution-time skill loading |
| `hm-phase-loop` | Consumer — uses this router for iterative phase skill selection |
| `hm-subagent-delegation-patterns` | Consumer — uses this router to attach skill bundles to delegation packets |
| `hm-gate-orchestrator` | Referenced in Quality and Review bundles — the gate triad orchestrator |

Base directory for this skill: file:///Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-lineage-router
Relative paths in this skill (e.g., scripts/, reference/) are relative to this base directory.
Note: file list is sampled.

<skill_files>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-lineage-router/references/.gitkeep</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-lineage-router/references/routing-map.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-lineage-router/metrics/rich-gate-scorecard.md</file>
<file>/Users/apple/hivemind-plugin-private/.opencode/skills/hm-l2-lineage-router/evals/evals.json</file>
</skill_files>
</skill_content>
```

---

## Assistant (Hm-L0-Orchestrator · MiMo V2.5 Pro · 20.3s)

_Thinking:_

Good. I've loaded the brainstorm and lineage-router skills. Now let me analyze the user's document and frame this properly.

The document is an ideation for a feature called "Agent Role/Mode Steering" - a system to inject conditional reminder messages into agent sessions to keep them aligned to their roles, workflows, and constraints.

This is clearly a **Planning** category task that needs:
1. Deep research into OpenCode SDK capabilities (hooks, event subscriptions, message injection)
2. Brainstorming to clarify requirements
3. Architecture design

Let me follow the brainstorm skill's Phase 1 approach. But first, I need to understand the scope better. The document is quite dense and covers multiple concerns:


- Conditional message injection based on agent hierarchy
- Event subscription hooks
- Role/profile steering
- Session continuity after compact
- Delegation awareness

This is a significant feature that spans multiple subsystems. I should check the current codebase state and existing architecture before asking questions, following the brainstorm skill's Phase 1.1: Gather Context. Let me start by examining the project structure and relevant existing code to understand what's already in place.

Using **hm-l2-brainstorm** to bridge this ideation to requirements, and **hm-l2-lineage-router** to classify the task domain.

**Task Classification:** Planning + Research hybrid — this ideation needs deep investigation into OpenCode SDK capabilities before requirements can be locked.

Let me first gather context on the existing architecture before asking clarifying questions.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Phase 1.1: Gather context — existing hooks, event system, delegation architecture",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "content": "Phase 1.2: Assess scope — multi-system decomposition check",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Phase 1.3: Ask clarifying questions (one at a time, max 5)",
      "status": "pending",
      "priority": "high"
    },
    {
      "content": "Phase 1.4: Detect unstated assumptions",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Phase 1.5: Produce Intent Summary for user confirmation",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Phase 2: Explore requirements — approach directions, priority mapping",
      "status": "pending",
      "priority": "medium"
    },
    {
      "content": "Phase 3: Produce Requirements Brief",
      "status": "pending",
      "priority": "low"
    },
    {
      "content": "Phase 4: Handoff to next skill",
      "status": "pending",
      "priority": "low"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Phase 1.1: Gather context — existing hooks, event system, delegation architecture",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Phase 1.2: Assess scope — multi-system decomposition check",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Phase 1.3: Ask clarifying questions (one at a time, max 5)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Phase 1.4: Detect unstated assumptions",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Phase 1.5: Produce Intent Summary for user confirmation",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Phase 2: Explore requirements — approach directions, priority mapping",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Phase 3: Produce Requirements Brief",
    "status": "pending",
    "priority": "low"
  },
  {
    "content": "Phase 4: Handoff to next skill",
    "status": "pending",
    "priority": "low"
  }
]
```

---

## Assistant (Hm-L0-Orchestrator · MiMo V2.5 Pro · 184.9s)

_Thinking:_

Let me gather context on the existing architecture - hooks, event system, delegation, and the OpenCode SDK capabilities. I need to understand what exists before I can ask good questions.

**Tool: task**

**Input:**
```json
{
  "description": "Investigate hooks and event system",
  "prompt": "You are the subagent Name: hm-l2-scout role — rapid codebase detection specialist. You must do as this prompt instructed and know that you are being delegated.\n\n**Task:** Investigate the existing hooks, event subscription, and message injection capabilities in this Hivemind harness codebase. I need to understand:\n\n1. What hooks exist in `src/hooks/` — list all files, their purposes, and what events they subscribe to\n2. How the hook system works — what SDK hooks are used (PreToolUse, PostToolUse, etc.)\n3. Is there any existing mechanism for injecting messages into agent sessions?\n4. How does the delegation system work in `src/coordination/delegation/` — what awareness do subagents have of their role?\n5. What does the behavioral profile system do in `src/routing/`?\n6. Check `src/shared/types.ts` for any relevant type definitions about agent roles, modes, or steering\n\n**Return:** A structured summary with file paths and line references for each finding. Do NOT edit any files.",
  "subagent_type": "explore"
}
```

**Output:**
```
task_id: ses_1f2dfcfdeffektVyDBDOXxeTzJ (for resuming to continue this task if needed)

<task_result>
Now I have a comprehensive picture. Let me compile the structured summary.

---

## Structured Investigation Report: Hooks, Events, Message Injection, Delegation, and Routing

### 1. Hooks in `src/hooks/` — Complete Inventory

**Directory structure:**
```
src/hooks/
├── types.ts                          — HookDependencies interface
├── composition/
│   └── cqrs-boundary.ts             — CQRS boundary enforcement (hook effect classification)
├── guards/
│   ├── governance-block.ts           — System prompt governance block builder
│   └── tool-guard-hooks.ts           — Tool budget + circuit breaker enforcement
├── lifecycle/
│   ├── core-hooks.ts                 — event, system.transform, messages.transform, shell.env
│   └── session-hooks.ts              — session.idle auto-loop, experimental.session.compacting
├── observers/
│   └── event-observers.ts            — Delegation event observer, session journey observer, session entry observer
└── transforms/
    ├── toggle-gates.ts               — Workflow toggle state accessors
    └── tool-after-composer.ts        — tool.execute.after response shaping
```

**Hook files and their purposes:**

| File | Purpose | SDK Hooks Used |
|------|---------|----------------|
| `src/hooks/lifecycle/core-hooks.ts` (L1-166) | Routes SDK events to lifecycle manager; injects governance, intake, and behavioral profile into system prompt | `event`, `system.transform`, `experimental.chat.system.transform`, `messages.transform`, `shell.env` |
| `src/hooks/lifecycle/session-hooks.ts` (L1-340) | Drives auto-loop on `session.idle`; preserves context across compaction | `event` (session.idle), `experimental.session.compacting` |
| `src/hooks/guards/tool-guard-hooks.ts` (L1-156) | Enforces tool call budget + circuit breaker; injects `_harness` metadata into tool outputs | `tool.execute.before`, `tool.execute.after` |
| `src/hooks/guards/governance-block.ts` (L1-104) | Builds `--- Governance ---` block for system prompt injection | N/A (helper, not a hook) |
| `src/hooks/observers/event-observers.ts` (L1-93) | Extracts delegation lifecycle facts; classifies session intake on `session.created` | N/A (observer factories consumed by core event hook) |
| `src/hooks/transforms/tool-after-composer.ts` (L1-71) | Composes tool-after hook for response shaping and projection facts | N/A (composes `tool.execute.after`) |
| `src/hooks/transforms/toggle-gates.ts` (L1-83) | Runtime access to workflow toggle state from HivemindConfigs | N/A (helper) |
| `src/hooks/composition/cqrs-boundary.ts` (L1-36) | Classifies hook effects; rejects durable writes from hooks | N/A (guard) |
| `src/hooks/types.ts` (L1-45) | `HookDependencies` interface — shared dependency bundle for all hook factories | N/A (types) |

---

### 2. How the Hook System Works — SDK Hook Registration

The plugin composition root at `src/plugin.ts` (L52-185) assembles hooks:

**Hook registration pattern** (`src/plugin.ts` L121-184):
```typescript
return {
  ...createCoreHooks({ ...deps, eventObservers: [...] }),
  ...sessionReadHooks,
  ...toolGuardHooks,
  tool: { ... },  // tools registered separately
  "tool.execute.after": async (input, output) => { ... },  // inline hook
}
```

**SDK hooks consumed** (from `src/hooks/lifecycle/core-hooks.ts` L27-36):
- `event` — Observes all OpenCode events, routes to lifecycle manager and event observers
- `system.transform` — Injects governance block, intake context, and behavioral profile into `output.system[]`
- `experimental.chat.system.transform` — No-op stub during clean slate (L136-141)
- `messages.transform` — Stripped in Phase 35; passes through input messages unchanged (L143-150)
- `shell.env` — Injects `CI=true`, `GIT_TERMINAL_PROMPT=0`, `NO_COLOR=1`, `TERM=dumb` (L152-164)

**From `src/hooks/lifecycle/session-hooks.ts`:**
- `event` (session.idle) — Auto-loop retry for delegation packets (L133-216)
- `experimental.session.compacting` — Preserves continuity, lifecycle, and intake context across compaction (L222-338)

**From `src/hooks/guards/tool-guard-hooks.ts`:**
- `tool.execute.before` — Enforces tool call budget + circuit breaker (L66-111)
- `tool.execute.after` — Injects `_harness` metadata (delegation info, lifecycle, warnings) into tool output (L113-155)

**CQRS boundary** (`src/hooks/composition/cqrs-boundary.ts` L1-36):
- Classifies hooks as `observation`, `response-shaping`, or `guard-decision`
- `assertHookWriteBoundary()` throws if a hook attempts a `durable-write`

---

### 3. Message Injection Mechanisms

**Three distinct injection paths exist:**

**A. System prompt injection** (`src/hooks/lifecycle/core-hooks.ts` L69-133):
- `system.transform` hook pushes strings into `output.system[]` array
- Three injection blocks:
  1. **Governance block** (L79-85) — `--- Governance ---` header + mode/expertise/language instructions + behavioral field values
  2. **Intake context** (L87-107) — Session purpose, language, routing target, communication style, warnings
  3. **Behavioral profile** (L109-133) — Guardrail level, delegation mode, tool access, skill filter, expertise, discuss mode

**B. Prompt injection via SDK** (`src/shared/session-api.ts`):
- `sendPrompt()` (L143-172) — Synchronous prompt delivery to a session via `client.session.prompt()`
- `sendPromptAsync()` (L181-193) — Async (fire-and-forget) prompt delivery via `client.session.promptAsync()`

**C. Auto-loop prompt injection** (`src/hooks/lifecycle/session-hooks.ts` L79-109):
- `buildAutoLoopPrompt()` constructs a `<system_reminder>` wrapped prompt with retry count, completion signal, task description, constraints, and latest assistant response
- Injected via `lifecycleManager.requestAutoLoopRetry()` which calls `sendPrompt()` (`src/task-management/lifecycle/index.ts` L210-213)

**D. Notification injection** (`src/coordination/completion/notification-handler.ts`):
- `notifyDelegationTerminal()` (L221-236) — Sends `<system_reminder>` wrapped delegation status to parent session via `sendPrompt()` with `noReply: true`
- `notifyParentSession()` (L168-197) — Generic notification delivery
- `replayPendingNotifications()` (L199-212) — Replays queued notifications on parent session events

**E. Tool output metadata injection** (`src/hooks/guards/tool-guard-hooks.ts` L113-155):
- `tool.execute.after` hook injects `_harness` object into `output.metadata` containing: `totalToolCalls`, `recentWarnings`, `repeatedSignatureCount`, `rootSessionID`, `delegationDepth`, `specialistAgent`, `specialistCategory`, `specialistModel`, `concurrencyKey`, `continuityStatus`, `lifecycle`, `routing`, `governance`, `continuityStorage`, `continuity`

---

### 4. Delegation System — `src/coordination/delegation/`

**Files:**

| File | Purpose |
|------|---------|
| `manager.ts` (L1-500) | `DelegationManager` class — dispatch, concurrency, agent validation, recovery |
| `state-machine.ts` (L1-426) | `DelegationStateMachine` — in-memory store, terminal transitions, timers |
| `types.ts` (L1-140) | Delegation types: `Delegation`, `DelegationResult`, `DelegationStatus`, constants |
| `category-gates.ts` | Category gate policy enforcement |
| `category-gate-audit.ts` | Category gate ask audit recording |

**Subagent awareness of their role:**

Delegated subagents have **no explicit role awareness injected by the harness**. The delegation system:

1. **Dispatches via SDK** (`manager.ts` L210-256): Creates a child session via `spawnDelegatedSession()`, sends prompt via `sendPromptAsync()`
2. **Prompt content** (`manager.ts` L234-238): The prompt body contains only `{ parts: [{ type: "text", text: params.prompt }], agent: agent.name, tools: buildDelegationPromptTools(...) }`
3. **Tool restrictions** (`manager.ts` L56-62): `buildDelegationPromptTools()` explicitly disables `delegate-task` and `task` tools for child sessions
4. **Metadata injection**: The `_harness` metadata in `tool.execute.after` provides delegation context (`specialistAgent`, `specialistCategory`, `delegationDepth`, etc.) — this is how subagents can discover their role, but only after they make a tool call
5. **System prompt injection**: The governance block and behavioral profile are injected via `system.transform` for ALL sessions (parent and child alike), but there is no delegation-specific system prompt injection that tells a subagent "you are a subagent"

**Key delegation types** (`src/coordination/delegation/types.ts`):
- `DelegationStatus`: `dispatched` | `running` | `completed` | `error` | `timeout`
- `DelegationSurface`: `agent-delegation` | `command-process`
- `DelegationTerminalKind`: `completed` | `error` | `timeout` | `cancelled` | `interrupted-by-signal` | `non-resumable-after-restart`
- `executionMode`: `sdk` | `pty` | `headless`
- `MAX_DELEGATION_DEPTH = 3`
- `DEFAULT_SAFETY_CEILING_MS = 30 * 60 * 1000` (30 minutes)

**Dual-signal completion** (`state-machine.ts` L245-291):
- `transitionToTerminal()` handles all terminal paths: sets status, persists, clears timers, schedules grace period cleanup, fires parent notification via `notifyDelegationTerminal()`

---

### 5. Behavioral Profile System — `src/routing/`

**Files:**

| File | Purpose |
|------|---------|
| `behavioral-profile/types.ts` (L1-100) | `BehavioralProfile`, `ResolvedBehavioralProfile`, `BehavioralOverrides` types |
| `behavioral-profile/profiles.ts` (L1-45) | Static mode-to-profile lookup table |
| `behavioral-profile/resolve-behavioral-profile.ts` (L1-136) | Lazy-cached profile resolution (config-first + runtime fallback) |
| `behavioral-profile/index.ts` | Re-exports |
| `session-entry/intake-gate.ts` (L1-148) | Session intake: purpose classification + language detection + profile resolution + routing |
| `session-entry/purpose-classifier.ts` | Classifies user input into purpose classes |
| `session-entry/language-resolution.ts` | Detects language from input |
| `session-entry/profile-resolver.ts` (L1-148) | Runtime profile detection from session context hints |
| `command-engine/types.ts` | Command engine types |
| `command-engine/index.ts` | Command engine re-exports |

**What the behavioral profile does:**

The behavioral profile system controls agent behavior through three layers:

1. **Static mode profiles** (`profiles.ts` L26-45) — Three modes:
   - `expert-advisor`: moderate guardrails, waiter delegation, full tools, all skills
   - `hivemind-powered`: strict guardrails, waiter delegation, restricted tools, curated skills
   - `free-style`: minimal guardrails, delegation disabled, full tools, all skills

2. **Resolved profile** (`resolve-behavioral-profile.ts` L72-109) — Merges:
   - Config values (mode, language, user expert level, discuss mode)
   - Static behavioral profile from mode lookup
   - Runtime-detected profile (communication style, decision speed, expertise)
   - Config-first merge strategy: `mapLevelToExpertise()` wins if defined, else runtime fallback

3. **Injection into system prompt** (`core-hooks.ts` L109-133) — The resolved profile is injected as:
   ```
   Behavioral profile context:
   - behavioral.guardrailLevel: moderate
   - behavioral.delegationMode: waiter
   - behavioral.toolAccessPattern: full
   - behavioral.skillFilter: all
   - language.conversation: en
   - language.documents: en
   - runtime.communicationStyle: concise
   - runtime.decisionSpeed: fast
   - runtime.expertise: mid
   - discuss.mode: sufficient-phase-discussion
   ```

**Session entry routing** (`intake-gate.ts` L24-33):
```typescript
PURPOSE_TO_ROUTING_TARGET = {
  discovery: "hm-l2-scout",
  brainstorming: "hm-l2-brainstorm",
  research: "hm-l3-research-chain",
  planning: "gsd-planner",
  implementation: "gsd-executor",
  gatekeeping: "hm-l2-critic",
  tdd: "hm-l2-test-driven-execution",
  "course-correction": "gsd-debugger",
}
```

---

### 6. Relevant Type Definitions in `src/shared/types.ts`

**Agent role/delegation types:**
- `SpecialistAgent = string` (L40)
- `DelegationCategory` (L41): `"research" | "implementation" | "review" | "visual-engineering" | "deep" | "quick"`
- `DelegationMeta` (L91-101): `{ rootID, depth, budgetUsed, agent, category?, model?, queueKey, runtimePolicyOverride? }`

**Session lifecycle types:**
- `SessionLifecyclePhase` (L259-265): `"created" | "queued" | "dispatching" | "running" | "completed" | "failed"`
- `SessionLifecycleState` (L267-275): `{ phase, launchedAt?, completedAt?, runMode?, queue?, observation?, error? }`
- `HarnessStatus` (L145-155): 9-value superset including `"pending"`, `"dispatching"`, `"interrupt"`

**Continuity/metadata types:**
- `SessionContinuityMetadata` (L306-320): Includes `delegation: DelegationMeta | null`, `route?: string`, `pendingNotifications`, `lifecycle`, `delegationPacket`
- `DelegationPacket` (L294-304): `{ id, createdAt, spec, plan?, artifacts, commits, parentChain, status, updatedAt }`

**Runtime policy types:**
- `RuntimePolicy` (L204-211): `{ concurrency, budget, trustedRuntime, categoryGate?, maxDelegationDepth? }`
- `SessionPolicyOverride` (L240-246): Per-session overrides for concurrency, budget, trusted runtime

---

### Key Findings Summary

1. **No explicit subagent role injection exists.** The harness does NOT inject a "you are a subagent" message into delegated sessions. Subagents only learn about their delegation context through `_harness` metadata appended to tool outputs (after they make their first tool call).

2. **Message injection is possible via three SDK paths**: `system.transform` (system prompt array), `sendPrompt()`/`sendPromptAsync()` (direct prompt injection), and `experimental.session.compacting` (compaction context preservation).

3. **The auto-loop mechanism** (`session-hooks.ts` L133-216) is the primary retry/re-injection pattern — it detects when a delegation packet session is idle without emitting the completion signal, and re-injects a continuation prompt.

4. **The notification system** (`notification-handler.ts`) can inject `<system_reminder>` wrapped messages into parent sessions when delegations complete, fail, or time out.

5. **The behavioral profile system** controls agent behavior through mode-based guardrails, tool access patterns, and skill filters — injected into every session's system prompt via `system.transform`.
</task_result>
```

**Tool: task**

**Input:**
```json
{
  "description": "Investigate OpenCode SDK capabilities",
  "prompt": "You are the subagent Name: hm-l2-technician role — technology stack specialist. You must do as this prompt instructed and know that you are being delegated.\n\n**Task:** Investigate the OpenCode SDK capabilities relevant to message injection and event subscription. I need to understand:\n\n1. Read the OpenCode platform reference skill at `.opencode/skills/hm-l3-opencode-platform-reference/SKILL.md` — what hooks, events, and message manipulation APIs exist?\n2. Read `.opencode/skills/stack-l3-opencode/SKILL.md` — what SDK internals are available for session/message manipulation?\n3. Check `src/shared/session-api.ts` — what session API wrappers exist?\n4. Look for any existing message injection, prompt enhancement, or context injection patterns in the codebase\n5. Check if there's a way to subscribe to \"before assistant message\" or \"after tool execution\" events\n\n**Return:** A structured summary of SDK capabilities with file references. Do NOT edit any files.",
  "subagent_type": "explore"
}
```

**Output:**
```
task_id: ses_1f2dfcd8fffetp3rJ2HcPri6Ff (for resuming to continue this task if needed)

<task_result>
Here is the structured summary of OpenCode SDK capabilities relevant to message injection and event subscription.

---

## OpenCode SDK Capabilities: Message Injection & Event Subscription

### 1. HOOKS (Plugin-Side, Read/Write via Output Mutation)

The OpenCode plugin system (`@opencode-ai/plugin`) provides hooks as the primary mechanism for intercepting and modifying runtime behavior. Hooks are returned as a flat object from the Plugin function. No `definePlugin()` wrapper exists — plain async function returning `Hooks`.

**Source:** `/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-opencode/references/api/plugin.md` (lines 57-78), `/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-opencode/references/expert/hook-composition.md`

#### Full Hook Catalog (v1.14.28):

| Hook | Signature | Purpose | Message Injection? |
|------|-----------|---------|-------------------|
| `event` | `(input: { event: Event }) => Promise<void>` | Fire-and-forget observer for all events (32-40+ types). No output. | No (read-only) |
| `chat.params` | `(input, output) => Promise<void>` | Modify LLM parameters (temperature, etc.) per agent/session | Indirectly — can alter model behavior |
| `chat.headers` | `(input, output) => Promise<void>` | Modify HTTP headers sent to LLM provider | No |
| `chat.message` | `(input, output) => Promise<void>` | Intercept/modify chat messages | **Yes — can modify message content** |
| `tool.execute.before` | `(input, output) => Promise<void>` | Mutate tool args before execution (runs AFTER schema validation) | Indirectly — can alter tool inputs |
| `tool.execute.after` | `(input, output) => Promise<void>` | Mutate tool output/title/metadata after execution | **Yes — can inject metadata into tool results** |
| `tool.definition` | `(input, output) => Promise<void>` | Modify tool description/parameters seen by LLM | Indirectly — changes what LLM sees |
| `permission.ask` | `(input, output) => Promise<void>` | Auto-allow/ask/ask for permissions | No |
| `shell.env` | `(input, output) => Promise<void>` | Inject env vars into every shell execution | No (env only) |
| `command.execute.before` | `(input, output) => Promise<void>` | Before command execution | Indirectly |
| `experimental.chat.messages.transform` | `(input, output) => Promise<void>` | **Transform the entire message array** before LLM sees it | **Yes — primary message injection surface** |
| `experimental.chat.system.transform` | `(input, output) => Promise<void>` | **Inject into system prompt array** | **Yes — system prompt injection** |
| `experimental.session.compacting` | `(input, output) => Promise<void>` | Inject context during compaction recovery | **Yes — post-compaction context injection** |
| `experimental.compaction.autocontinue` | `(input, output) => Promise<void>` | Control whether auto-continue message is sent after compaction | Indirectly |
| `experimental.text.complete` | `(input, output) => Promise<void>` | Modify completed text | **Yes — text mutation** |

#### Key Injection Surfaces Already Used in This Codebase:

| Hook | File | What It Does |
|------|------|-------------|
| `system.transform` | `src/hooks/lifecycle/core-hooks.ts:69-133` | Injects governance block, intake context, and behavioral profile into system prompt |
| `experimental.session.compacting` | `src/hooks/lifecycle/session-hooks.ts:222-338` | Injects lifecycle state, continuity snapshot, and intake compaction preservation |
| `tool.execute.before` | `src/hooks/guards/tool-guard-hooks.ts:66-111` | Circuit breaker and tool budget enforcement |
| `tool.execute.after` | `src/hooks/guards/tool-guard-hooks.ts:113-155` + `src/hooks/transforms/tool-after-composer.ts` | Injects `_harness` metadata into tool outputs |
| `shell.env` | `src/hooks/lifecycle/core-hooks.ts:152-164` | Injects `CI=true`, `GIT_TERMINAL_PROMPT=0`, etc. |
| `messages.transform` | `src/hooks/lifecycle/core-hooks.ts:143-150` | **Currently a no-op pass-through** (stripped in Phase 35) |

---

### 2. EVENT SUBSCRIPTION (SSE-Based)

**Source:** `/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-opencode/references/expert/client-server.md` (lines 48-77), `/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-opencode/references/expert/hook-composition.md` (lines 40-77)

#### Event Types Available:

| Category | Events |
|----------|--------|
| **Session** | `session.created`, `session.updated`, `session.deleted`, `session.status`, `session.idle`, `session.compacted`, `session.diff`, `session.error` |
| **Message** | `message.updated`, `message.removed`, `message.part.updated`, `message.part.removed` |
| **Permission** | `permission.updated`, `permission.replied` |
| **Tool/PTY** | `pty.created`, `pty.updated`, `pty.exited`, `pty.deleted` |
| **File/VCS** | `file.edited`, `file.watcher.updated`, `vcs.branch.updated` |
| **UI** | `tui.prompt.append`, `tui.command.execute`, `tui.toast.show` |
| **Server** | `server.connected`, `server.instance.disposed` |
| **Other** | `installation.updated`, `command.executed`, `todo.updated`, `lsp.client.diagnostics` |

**v2 Additional:** `message.part.delta`, `permission.asked`, `question.asked`, `question.replied`, `question.rejected`, `mcp.tools.changed`, `worktree.ready/failed`, `workspace.ready/failed/restore/status`

#### Subscription Mechanisms:

1. **Plugin `event` hook** — receives ALL events, no filtering. Must dispatch internally via `switch(input.event.type)`.
2. **SSE endpoints:**
   - `GET /event?sessionID=abc123` — per-session event stream
   - `GET /event` — global event stream
   - `GET /global/event` — cross-session events
3. **SDK client** — `createOpencodeClient()` auto-reconnects on drop. Events during disconnection may be lost (not guaranteed-delivery).

#### Existing Event Observers in This Codebase:

| Observer | File | Events Handled |
|----------|------|----------------|
| `consumeDelegationFact` | `src/plugin.ts:99-107` | `session.idle`, `session.deleted` → delegation manager |
| `sessionEventObserver` | `src/hooks/lifecycle/session-hooks.ts:133-220` | `session.idle` → auto-loop, `session.deleted/error` → terminal cleanup |
| `consumeJourneyFact` | `src/plugin.ts:108-117` | All events → event tracker artifacts |
| `consumeSessionEntryFact` | `src/plugin.ts:92-98` | All events → intake classification |
| Core event handler | `src/hooks/lifecycle/core-hooks.ts:53-67` | All events → lifecycle manager |

---

### 3. MESSAGE INJECTION APIs (SDK Client-Side)

**Source:** `/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-opencode/references/expert/client-server.md` (lines 84-95), `/Users/apple/hivemind-plugin-private/.opencode/skills/stack-l3-opencode/references/api/sdk.md` (lines 174-197)

| API | Endpoint | Purpose | Blocking? |
|-----|----------|---------|-----------|
| `client.session.prompt()` | `POST /session/{id}/prompt` | Send user message, wait for full LLM response | **Yes** — blocks until response |
| `client.session.promptAsync()` | `POST /session/{id}/prompt_async` | Send user message, return immediately | **No** — fire-and-forget |
| `PATCH /session/{id}/message/{mid}/part/{pid}` | Part-level mutation | Live-update tool output during execution | **No** — streaming update |

#### Session API Wrappers in This Codebase:

**File:** `/Users/apple/hivemind-plugin-private/src/shared/session-api.ts`

| Function | Purpose |
|----------|---------|
| `createSession()` | Create new session with optional parentID |
| `getSession()` | Get session by ID |
| `getSessionStatusMap()` | Get all session statuses (idle/busy/retry) |
| `abortSession()` | Abort in-progress generation |
| `getSessionMessages()` | Get messages for a session (with optional limit) |
| `getSessionMessageCount()` | Count messages in a session |
| `sendPrompt()` | Synchronous prompt with fallback polling for empty responses |
| `sendPromptAsync()` | Fire-and-forget prompt (background delegation) |
| `walkParentChain()` | Walk session parent chain for hierarchy |
| `getSessionBehavioralProfile()` | Get resolved behavioral profile for a session |
| `getEventSessionID()` | Extract session ID from event |
| `getEventParentID()` | Extract parent ID from event |

---

### 4. EXISTING PROMPT ENHANCEMENT / CONTEXT INJECTION PATTERNS

| Pattern | File | Mechanism |
|---------|------|-----------|
| **System prompt injection** | `src/hooks/lifecycle/core-hooks.ts:69-133` | `system.transform` hook pushes governance, intake, and behavioral profile blocks into `output.system[]` |
| **Compaction context injection** | `src/hooks/lifecycle/session-hooks.ts:222-338` | `experimental.session.compacting` hook pushes lifecycle state, continuity snapshot, and intake preservation into `output.context[]` |
| **Tool metadata injection** | `src/hooks/guards/tool-guard-hooks.ts:113-155` | `tool.execute.after` hook injects `_harness` metadata block into every tool output |
| **Auto-loop prompt injection** | `src/hooks/lifecycle/session-hooks.ts:79-109` | Builds retry prompts with task description, constraints, and assistant text, sends via `lifecycleManager.requestAutoLoopRetry()` |
| **Prompt skim/analyze tools** | `src/tools/prompt/prompt-skim/tools.ts`, `src/tools/prompt/prompt-analyze/tools.ts` | LLM-callable tools for analyzing prompt content (not injection, but analysis) |
| **Session patch tool** | `src/tools/session/session-patch/tools.ts` | LLM-callable tool for patching session artifact files |

---

### 5. "BEFORE ASSISTANT MESSAGE" / "AFTER TOOL EXECUTION" EVENTS

**There is no direct "before assistant message" hook.** The closest surfaces are:

| What You Want | SDK Surface | Notes |
|---------------|-------------|-------|
| Before assistant generates | `chat.params` hook | Fires before LLM call; can modify temperature, model params |
| Before assistant generates | `experimental.chat.messages.transform` | Can transform the entire message array the LLM sees |
| Before assistant generates | `experimental.chat.system.transform` | Can modify system prompt before LLM sees it |
| After tool execution | `tool.execute.after` hook | Fires after every tool execution; can mutate output/metadata |
| After any event | `event` hook + SSE | `message.updated`, `message.part.updated`, `tool.state` events |
| After session becomes idle | `session.idle` event | Session finished generating, ready for new input |
| Before tool execution | `tool.execute.before` hook | Fires after schema validation but before `execute()` |
| Before tool definition sent to LLM | `tool.definition` hook | Modifies what LLM sees about available tools |

---

### 6. KEY ARCHITECTURAL CONSTRAINTS

| Constraint | Source |
|------------|--------|
| **No hook priority system** — ordering determined by `Config.plugin[]` array position | `stack-l3-opencode` SKILL.md line 49 |
| **Hook output is mutable pass-through** — last-write-wins at field level; always spread | `stack-l3-opencode` SKILL.md line 43 |
| **`tool()` is an identity function** — zero runtime validation, pure TypeScript branding | `stack-l3-opencode` SKILL.md line 43 |
| **`context.ask()` returns Effect, not Promise** — `await` does nothing; use `Effect.runPromise()` | `stack-l3-opencode` SKILL.md line 44 |
| **CQRS boundary** — hooks cannot perform durable writes; only tools have mutation authority | `src/hooks/composition/cqrs-boundary.ts` |
| **Session has no "completed" state** — only idle/busy/retry | `stack-l3-opencode` SKILL.md line 46 |
| **SSE is not guaranteed-delivery** — events during disconnection may be lost | `client-server.md` line 61 |

---

### Summary: Injection Surfaces Available

For **message injection before LLM processes**, use (in priority order):
1. `experimental.chat.messages.transform` — transform entire message array
2. `experimental.chat.system.transform` — inject into system prompt
3. `chat.params` — modify model parameters
4. `experimental.session.compacting` — inject recovery context after compaction

For **post-execution observation/modification**, use:
1. `tool.execute.after` — mutate tool output metadata
2. `event` hook — observe all session/message/tool events
3. SSE endpoints — programmatic event subscription

For **programmatic message injection into a session**, use:
1. `client.session.promptAsync()` — fire-and-forget user message injection
2. `client.session.prompt()` — synchronous prompt injection (blocks)
</task_result>
```

---

## Assistant (Hm-L0-Orchestrator · MiMo V2.5 Pro · 14.4s)

_Thinking:_

Excellent! I now have a comprehensive understanding of the existing architecture. Let me update the todo and move to Phase 1.2: Assess Scope.

Key findings:
1. **No explicit subagent role injection exists** - subagents only learn about their delegation context through `_harness` metadata in tool outputs
2. **Multiple injection surfaces exist**: `system.transform`, `messages.transform`, `experimental.session.compacting`, `tool.execute.after`, `sendPrompt()`/`sendPromptAsync()`
3. **The behavioral profile system** already injects guardrail level, delegation mode, tool access, skill filter into system prompt


4. **The auto-loop mechanism** already re-injects prompts when sessions are idle
5. **Event subscription** is available via the `event` hook and SSE endpoints

This is definitely a multi-system feature spanning hooks and event observation, session and message injection, delegation and agent hierarchy awareness, behavioral profile extension, and workflow and skill routing integration. Since these systems are deeply interconnected, I should assess the scope before diving into clarifying questions.

The ideation document actually covers several distinct capabilities: conditional message injection based on agent hierarchy, role and profile steering, session continuity after compaction, delegation awareness for subagents, and workflow and task routing alignment. Rather than treating these as separate features, they're all part of a unified "agent steering" system, so I'll approach them as one cohesive feature with multiple components.

Now I need to formulate the first clarifying question to understand priorities and constraints better.

**Tool: todowrite**

**Input:**
```json
{
  "todos": [
    {
      "content": "Phase 1.1: Gather context — existing hooks, event system, delegation architecture",
      "priority": "high",
      "status": "completed"
    },
    {
      "content": "Phase 1.2: Assess scope — multi-system decomposition check",
      "priority": "high",
      "status": "in_progress"
    },
    {
      "content": "Phase 1.3: Ask clarifying questions (one at a time, max 5)",
      "priority": "high",
      "status": "pending"
    },
    {
      "content": "Phase 1.4: Detect unstated assumptions",
      "priority": "medium",
      "status": "pending"
    },
    {
      "content": "Phase 1.5: Produce Intent Summary for user confirmation",
      "priority": "medium",
      "status": "pending"
    },
    {
      "content": "Phase 2: Explore requirements — approach directions, priority mapping",
      "priority": "medium",
      "status": "pending"
    },
    {
      "content": "Phase 3: Produce Requirements Brief",
      "priority": "low",
      "status": "pending"
    },
    {
      "content": "Phase 4: Handoff to next skill",
      "priority": "low",
      "status": "pending"
    }
  ]
}
```

**Output:**
```
[
  {
    "content": "Phase 1.1: Gather context — existing hooks, event system, delegation architecture",
    "status": "completed",
    "priority": "high"
  },
  {
    "content": "Phase 1.2: Assess scope — multi-system decomposition check",
    "status": "in_progress",
    "priority": "high"
  },
  {
    "content": "Phase 1.3: Ask clarifying questions (one at a time, max 5)",
    "status": "pending",
    "priority": "high"
  },
  {
    "content": "Phase 1.4: Detect unstated assumptions",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Phase 1.5: Produce Intent Summary for user confirmation",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Phase 2: Explore requirements — approach directions, priority mapping",
    "status": "pending",
    "priority": "medium"
  },
  {
    "content": "Phase 3: Produce Requirements Brief",
    "status": "pending",
    "priority": "low"
  },
  {
    "content": "Phase 4: Handoff to next skill",
    "status": "pending",
    "priority": "low"
  }
]
```

---

## Assistant (Hm-L0-Orchestrator · MiMo V2.5 Pro · 20.8s)

_Thinking:_

Now let me assess the scope. The ideation document covers multiple interconnected concerns. Let me analyze whether this should be decomposed or treated as one feature.

Looking at the document again:
1. **Conditional message injection** based on agent hierarchy (L0/L1/L2/L3, hm-/hf-)
2. **Role/profile steering** - reminding agents of their role, constraints, workflows
3. **Session continuity after compact** - preserving context, TODO tasks, planning state
4. **Delegation awareness** - subagents knowing they're subagents, not front-facing
5. **Workflow alignment** - agents following the correct loops, skills, commands


6. **Context preservation** - atomic commits, plan retrieval, governance compliance

These are all facets of the same core problem: agents losing alignment to their role and context over long sessions. The solution is a unified steering system that uses conditional message injection across multiple surfaces. The technical implementation spans hook extensions for injection, delegation awareness, behavioral profile enhancements, and session continuity mechanisms, but they all serve one cohesive feature.

Now I'm moving into Phase 1.3 to ask clarifying questions. I need to understand the primary pain point—is it agents forgetting their role after compaction, subagents overstepping their boundaries, or something else entirely? Let me formulate the first question.

**Phase 1.2 Assessment:** This is a **single cohesive feature** with multiple interconnected subsystems. The core problem is "agent role/context drift over long sessions." The subsystems (injection, delegation awareness, profile steering, continuity) are tightly coupled and should be designed together. No decomposition needed.

---

Now entering **Phase 1.3: Clarifying Questions**. One at a time.

**Context gathered from codebase investigation:**

| Existing Capability | Status |
|---|---|
| System prompt injection via `system.transform` | ✅ Exists — governance block, intake context, behavioral profile already injected |
| Subagent role awareness | ❌ **Missing** — subagents only learn delegation context from `_harness` metadata after first tool call |
| Message injection via `sendPrompt()` | ✅ Exists — used by auto-loop and notification system |
| `messages.transform` hook | ⚠️ **Stripped to no-op** in Phase 35 — available for reactivation |
| Event subscription (session.idle, message.updated, etc.) | ✅ Exists — full SSE + plugin event hook |
| Behavioral profile system | ✅ Exists — 3 modes (expert-advisor, hivemind-powered, free-style) with guardrails/tool-access/skill-filter |
| Compaction context preservation | ✅ Exists — lifecycle state + continuity snapshot injected during compaction |
| Auto-loop retry mechanism | ✅ Exists — re-injects prompts when delegation sessions are idle |

---

**Question 1 of 5:**

Your document identifies 6 distinct problems (role drift after compact, workflow constitution drift, delegation unawareness, governance non-compliance, context rot, hierarchy confusion). 

**Which problem is the PRIMARY pain point you want to solve first?**

(a) **Subagent delegation awareness** — subagents don't know they're subagents, think they talk to users directly, don't follow delegation constraints

(b) **Post-compact role drift** — after context compaction, agents lose their role, workflow state, TODO tasks, and planning context

(c) **Workflow/loop alignment** — agents don't follow the correct skills, commands, or delegation loops for their current phase

(d) **All of the above as one unified system** — you want the full "agent steering" feature designed together

---

## User

(d) All of the above as one unified system — you want the full "agent steering" feature designed together >>> but build toward making the foundations first and extend after MVP

---

## Assistant (Hm-L0-Orchestrator · DeepSeek V4 Pro · 24.4s)

_Thinking:_

The user wants the full unified system, but with an MVP-first approach - build the foundation that can be extended later. This is a clear direction.

Let me now ask the next clarifying question. The document mentions both "hooks" and "event subscriptions" as the injection mechanism. The codebase investigation revealed several injection surfaces. I should ask which injection surfaces are the priority for MVP - system prompt injection, message stream injection, or programmatic session prompts.

Actually, let me think about what the most impactful next question would be. The user mentioned "build toward making the foundations first." So I should ask about what constitutes the "foundation" - what's the minimum viable steering that provides the most value.

The key architectural decision is: what gets injected WHERE and WHEN. The existing surfaces are:
1. `system.transform` - injects into system prompt before every LLM call
2. `messages.transform` - currently no-op, could transform the message array
3. `experimental.session.compacting` - injects during compaction
4. `sendPrompt()` - injects as a user message
5. `tool.execute.after` - injects metadata into tool outputs

For the foundation, the question is: should the steering messages go into the system prompt (always present but may be pruned), into a separate injected message (more visible but transient), or into compaction recovery (only present after compact)?

Let me ask about the injection surface priority for MVP.

Clear. MVP-first with foundations then extensions. Good architectural instinct — the injection and observation infrastructure comes first, then domain-specific steering policies build on it.

---

**Question 2 of 5:**

The codebase already has several injection surfaces available. For the **MVP foundation**, which injection surface should carry the "steering reminder" messages?

(a) **System prompt injection** (`system.transform` hook — injected before every LLM call, always present in context, but can be pruned by compaction)

(b) **Compaction recovery injection** (`experimental.session.compacting` — injected only after context compaction, preserved across resets, but absent during normal turns)

(c) **Strategic message injection** via `sendPrompt()` + event-triggered dispatch (e.g., inject a `<system_reminder>` message on `session.idle` or after N turns — visible, doesn't compete with system prompt, but transient)

(d) **Combination** — system prompt for always-present steering + compaction for recovery + event-triggered messages for turn-specific reminders

---

## User

I am not sure you must decide upon research and synthesis base on the fact that this is highly intricate logics  and complexity of conditions toward hybrid of many things - do not pick events that dumbly strike the injection nor impact system-wide

---

## Assistant (Hm-L0-Orchestrator · DeepSeek V4 Pro · 78.6s)

_Thinking:_

The user wants me to decide which injection surface(s) to use based on deep research and synthesis, not a simple choice. They're emphasizing that:

1. This is highly intricate logic with complex conditions
2. It's a hybrid system touching many things
3. Not to pick events that "dumbly strike the injection" (i.e., don't just blindly inject on every event)
4. Not to impact system-wide (i.e., don't have global side effects)

I need to deeply reason about which injection surfaces make sense based on the actual SDK capabilities and the architecture. Let me think through this carefully before presenting a recommendation.

The key concerns are:
1. Precision - only inject when needed, not on every event
2. Conditionality - based on agent role, hierarchy, session state, turn count, delegation depth
3. Non-disruptive - shouldn't interfere with normal operation
4. The injection should be subtle steering, not loud commands

Let me think through each surface:

**system.transform**: Injected before every LLM call. Good for persistent awareness (role, constraints) but always present and can be pruned by compaction. Risk: adding noise to every turn.

**experimental.session.compacting**: Only fires during compaction. Good for recovery but too narrow for ongoing steering.

**messages.transform**: Transforms the entire message array before LLM sees it. This is powerful - can inject conditional messages based on context. Currently a no-op (stripped in Phase 35). Can target specific messages, add system_reminder blocks, etc.

**sendPrompt() injection via events**: Can inject on specific triggers (session.idle, after N turns, when delegation detected). Good for precision but transient.

**tool.execute.after**: Already used for _harness metadata. Can extend to inject role reminders.

The best approach is likely a multi-surface strategy:
1. **messages.transform** - Primary surface. Conditionally inject role-awareness messages before LLM processing. This is the most appropriate because:
   - It runs before every LLM call (like system.transform)
   - But can conditionally decide WHAT to inject based on context analysis
   - Can inject as system_reminder or assistant-visible message
   - Currently a no-op, so available for use
   - More controllable than system.transform (which affects system prompt structure)

2. **experimental.session.compacting** - Recovery surface. Inject continuity + role context specifically after compaction.

3. **system.transform** - Lightweight persistent markers only. Don't inject full steering here, just minimal role identifiers.

The reason messages.transform is better than system.transform for the primary surface:
- system.transform modifies the system prompt, which is always there, competing for attention
- messages.transform can be surgical - only inject when needed
- Can inject as a system_reminder message that's visible but not permanent

Actually, let me reconsider. The document says these should be "reminder" messages that require NO response from agents - they play a part as steering, soft governance. This sounds like system_reminder type messages, not system prompt additions.

For system_reminder messages:
- They appear in the conversation but don't require a response
- They're visible to the agent
- They're transient (not in system prompt)
- They can be injected conditionally

So the ideal approach for MVP:
1. **messages.transform** for turn-by-turn conditional role injection (primary steering)
2. **experimental.session.compacting** for post-compaction context recovery
3. **system.transform** gets a minimal role marker only (e.g., "[role: l2-subagent, lineage: hm]")

The conditionality is critical - I should NOT inject on every turn. Instead, inject based on:
- Turn count milestones (every N turns, remind of role)
- Delegation depth changes
- After compaction events
- When task boundary shifts
- When agent seems to drift (detected via pattern matching on responses?)

Let me present this recommendation to the user now.

Good — I need to synthesize a recommendation, not just pick from options. Let me reason through the SDK surfaces systematically.

---

## Synthesis: Optimal Injection Surface Architecture for MVP

### The hard constraint: precision + non-disruptive

The ideation doc says: *"injections must NOT require a response from agents — they play a part as steering, soft governance"* and also warns: *"poor logics will inject rot-to-context injections that drive agents hallucination."*

This rules out `sendPrompt()` in most cases (it creates visible user messages). It also rules out `system.transform` as the primary carrier (it adds persistent noise to every LLM call, competes with governance blocks, gets pruned by compaction anyway).

### The winning architecture: **trifurcated surface with conditional dispatch**

| Surface | Purpose | Trigger | What gets injected |
|---------|---------|---------|--------------------|
| **`messages.transform`** | Turn-by-turn conditional role steering | Before LLM processing, **when conditions met** (not every turn) | Lightweight `<system_reminder>` block: role, current phase, boundary constraints |
| **`experimental.session.compacting`** | Post-compact context recovery | Only on compaction event | Full context packet: role + TODO + plan refs + delegation chain |
| **`system.transform`** | Minimal persistent role marker | Every session start | Single-line identifier: `[role: l2-subagent | lineage: hm | depth: 2/3]` |

### Why `messages.transform` as the primary surface

1. **Exists but is currently a no-op** (`src/hooks/lifecycle/core-hooks.ts:143-150`): Stripped in Phase 35, available for reactivation. No conflict.

2. **Runs before every LLM call** but unlike `system.transform`, it can **conditionally decide** whether to inject based on context analysis. It sees the full message array — can inspect what the agent is about to process and decide: "does this agent need a role reminder right now?"

3. **Injects as a `<system_reminder>` block** in the message stream, not the system prompt. This is critical:
   - It's visible to the agent but doesn't pollute the system prompt
   - It's transient — doesn't survive beyond the current turn
   - The agent can read it but doesn't need to respond to it
   - The model sees it as part of the conversation context, not as a permanent instruction

4. **Conditional dispatch mechanism:** The `messages.transform` hook receives `input.messages` (the full array). A steering evaluator can inspect:
   - How many turns since last reminder? (turn counter)
   - What's the agent's delegation depth? (from session API)
   - Is this a front-facing or subagent session? (parent chain walk)
   - Has the task boundary shifted? (workflow state change)
   - Was there a recent compaction? (compaction event flag)
   - **Only inject when conditions warrant it.**

### Why NOT the other surfaces as primary

| Surface | Rejected because |
|---------|-----------------|
| `event` hook | Fire-and-forget, no output mutation. Can't inject anything. |
| `sendPrompt()` on events | Creates a visible user message that may distract or mislead. Only appropriate for completion notifications (already used for that). |
| `tool.execute.after` | Only fires after tool calls. Subagents may not make tool calls for several turns. |
| `system.transform` as primary | Always present, pruned by compaction, competes with governance blocks. But ideal for a trivial persistent marker. |
| `chat.params` | Can't inject content, only modify model parameters. |

### MVP architecture diagram (conceptual)

```
                          ┌──────────────────────────┐
                          │  SteeringPolicyEngine     │
                          │                          │
                          │  Conditions assessed:     │
                          │  - hierarchy (front/sub)  │
                          │  - depth (L0/L1/L2/L3)    │
                          │  - lineage (hm/hf)        │
                          │  - turns since reminder   │
                          │  - phase/workflow state   │
                          │  - compaction flag        │
                          └─────┬──────────┬─────────┘
                                │          │
                    ┌───────────┘          └───────────┐
                    ▼                                  ▼
    ┌────────────────────────┐        ┌────────────────────────┐
    │ messages.transform     │        │ session.compacting     │
    │ (primary — conditional)│        │ (secondary — recovery) │
    │                        │        │                        │
    │ <system_reminder>      │        │ <system_reminder>      │
    │ role + phase + bounds  │        │ full context packet    │
    │ injected when needed   │        │ always on compact      │
    └────────────────────────┘        └────────────────────────┘
                                │
                    ┌───────────┘
                    ▼
    ┌────────────────────────┐
    │ system.transform       │
    │ (tertiary — persistent)│
    │                        │
    │ [role: hm-l2-subagent] │
    │ minimal, non-noise     │
    └────────────────────────┘
```

### What makes this "not dumbly striking"

The conditional evaluator in `messages.transform` applies a **check-before-inject** policy:

```
IF (turns_since_last_reminder >= TURNS_PER_REMINDER)
   AND (session.is_delegated == true)
   AND (agent.is_front_facing == false)
   AND (phase_changed OR compaction_occurred OR turn_milestone_reached)
THEN inject(role_reminder)
ELSE pass_through()
```

This prevents injection fatigue, context rot, and hallucination-inducing noise.

---

**My recommendation:** `messages.transform` as primary + `session.compacting` as recovery + `system.transform` as minimal marker. The key innovation is the **conditional policy engine** that decides when to inject based on session state, not just blindly on every hook fire.

Does this architectural direction make sense? I'll continue to the next question if so.

---

