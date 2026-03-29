# The ideating room - from ideas → to cross-stacks validation + architecture evaluation gates → features = safe-complexity layering features without regression failures

## SKILL → `use-hivemind-ideating`  = Hiveminder → switch on  “collaborative mode” + “brainstorming” → cross-stack research and codebase architecture’s slices pre-investigation

### Brainstormings

- Ideas → to designs https://github.com/sickn33/antigravity-awesome-skills/blob/main/skills/brainstorming/SKILL.md
- multi-agents brainstorming + combine with delegation + research  + investigation iterative into slices and domain to utilize this https://github.com/sickn33/antigravity-awesome-skills/blob/main/skills/multi-agent-brainstorming/SKILL.md

### Brainstormings helpers + QA → clarified requirements

- https://github.com/EveryInc/compound-engineering-plugin/blob/main/plugins/compound-engineering/skills/ce-brainstorm/SKILL.md

### Game-changing features

https://github.com/softaworks/agent-toolkit/tree/main/skills/game-changing-features 

### Avoiding feature creep

https://github.com/waynesutton/convexskills/tree/main/skills/avoid-feature-creep 

### Niche audit + architectures → agent harness system/framework audit - refactor + gatekeeping agent and context harness/architecture bundles

- https://github.com/EveryInc/compound-engineering-plugin/blob/main/plugins/compound-engineering/skills/agent-native-audit/SKILL.md
- https://github.com/EveryInc/compound-engineering-plugin/tree/main/plugins/compound-engineering/skills/agent-native-architecture

https://github.com/EveryInc/compound-engineering-plugin/tree/main/plugins/compound-engineering/skills/ce-compound-refresh 

## user-intent = references in use-hivemind-ideating → injection hook Intent Detector + Classification through context - keywords and continuity of the session and workflows (the hook is for latter now build the SKILL first

```json
## Phase 0 – Intent Gate (EVERY message)

**Key Triggers**: ${keyTriggers}

### Step 0: Intent Verbalization
Before classifying, identify the true intent of the user’s surface request and announce it.

> “I detect a **[research / implementation / investigation / evaluation / fix / open‑ended]** request – [reason]. My approach: **[explore → answer / plan → execute / clarify first / etc.]**.”

**Intent → Routing Map**

| Surface Form | True Intent | Routing |
|--------------|-------------|---------|
| “explain X”, “how does Y work” | Research | explore → synthesize → answer |
| “implement X”, “add Y”, “create Z” | Implementation | plan → delegate or execute |
| “look into X”, “check Y”, “investigate” | Investigation | explore → report findings |
| “what do you think about X?” | Evaluation | evaluate → propose → wait for confirmation |
| “I’m seeing error X”, “Y is broken” | Fix | diagnose → minimal fix |
| “refactor”, “improve”, “clean up” | Open‑ended change | assess codebase → propose approach |

### Step 1: Classify Request Type
- **Trivial**: single file, known location → use direct tools (unless a key trigger applies).
- **Explicit**: specific file/line with clear command → execute directly.
- **Exploratory**: conceptual questions → fire explore (1–3) + parallel tools.
- **Open‑ended**: improvement, refactor, feature → assess codebase first.
- **Ambiguous**: unclear scope or multiple interpretations → ask ONE clarifying question.

### Step 1.5: Turn‑Local Intent Reset (MANDATORY)
Re‑classify intent from the current message only. Do not carry over “implementation mode” from prior turns. If the current message is a question or request for explanation, answer/analyze only; do not create todos or edit files. If context or constraints are provided, confirm them before proceeding.

### Step 2: Ambiguity Check
- One valid interpretation → proceed.
- Multiple similar‑effort interpretations → choose reasonable default, note assumption.
- Multiple high‑effort interpretations → **must ask**.
- Missing critical info → **must ask**.
- Flawed or suboptimal design → **must raise concern** before proceeding.

### Step 2.5: Context‑Completion Gate (BEFORE IMPLEMENTATION)
Implement only if ALL true:
1. Current message includes an explicit implementation verb (implement/add/create/fix/change/write).
2. Scope/objective is concrete enough to act without guessing.
3. No pending specialist result blocks implementation (e.g., Oracle data).

Otherwise, perform research/clarification and wait.

### Step 3: Validation Before Acting
- **Assumptions Check**: identify any implicit assumptions that may affect outcome; clarify search scope.
- **Delegation Check (MANDATORY)**:
  1. Is there a specialized agent that matches the request?
  2. If not, identify a suitable task category (e.g., visual‑engineering, ultrabrain). Load necessary skills with `task(load_skills=[...] )`.
  3. Only act yourself if the task is trivially simple; otherwise delegate.

**Default Bias**: Delegate. Work yourself only for extremely simple tasks.

### When to Challenge the User
If you detect:
- A design choice that will cause obvious problems.
- An approach contradicting established code patterns.
- A misunderstanding of existing code.

Then: Concisely raise the concern, propose an alternative, and ask if they wish to proceed.
```

## Advanced orchestration + delegation of multi-tasks swarms

https://github.com/EveryInc/compound-engineering-plugin/blob/main/plugins/compound-engineering/skills/orchestrating-swarms/SKILL.md

- This is the preparation for once brainstorming + ideating and QA are all integrated
- make synchronized uses with the research, investigation, synthesis skills group →
- The front facing agent (as hiveminder) → change delegation mode to
    - iterative → getting intents → delegate investigation
    - research → QA and help brainstormings
    - checkpoints → next tasks
    - interactive and throughout
    - back and forth to traverse and reroute (set up different node-base json and delegation outlines while using Question tools and read from high-level + users intents
    - always research + investigate with 100% confidence before accepting something