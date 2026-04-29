---
name: hm-brainstorm
description: >
  Use when the user says "let's brainstorm", "help me think through", "figure out what to build",
  "clarify requirements", "explore ideas", "what should we build", "ideation", "requirements gathering",
  "I have a vague idea", or when user intent is ambiguous and needs structured exploration before
  spec-driven-authoring or test-driven-execution can begin. This skill bridges vague intent to a
  formal requirements brief ready for handoff to hm-spec-driven-authoring. NOT for solution design,
  architecture decisions, or implementation planning — those come AFTER requirements are surfaced.
metadata:
  layer: "2"
  role: "domain-execution"
  pattern: P2
  version: "1.0.0"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

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
