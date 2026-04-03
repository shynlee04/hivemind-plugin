# Routing Logic

Concrete decision engine: user says X → classify → route → execute.

---

## The Routing Formula (Different for Each Group)

GROUP 1 and GROUP 2 use **different** signal weights. This is the fix for the identical-scoring bug.

### GROUP 1 Score (Implementation Methodology)

```
score = (process_verbs × 3) + (coordination_nouns × 2) + (planning_modifiers × 1)
```

| Signal | Weight | Examples |
|--------|--------|----------|
| process_verbs | 3 | "figure out", "explore", "brainstorm", "coordinate", "dispatch", "plan", "organize", "help me think" |
| coordination_nouns | 2 | "parallel", "batch", "handoff", "orchestrate", "multiple", "several" |
| planning_modifiers | 1 | "complex", "multi-step", "long-running", "iterative", "keep going" |

### GROUP 2 Score (Domain Authoring)

```
score = (creation_verbs × 3) + (entity_nouns × 2) + (new_modifiers × 1)
```

| Signal | Weight | Examples |
|--------|--------|----------|
| creation_verbs | 3 | "create", "build", "write", "design", "set up", "add", "configure" |
| entity_nouns | 2 | "skill", "agent", "command", "tool", "workflow", "MCP", "LSP", "rule", "permission" |
| new_modifiers | 1 | "new", "from scratch", "first time", "template", "like this" |

### Decision Rule

- GROUP 1 wins by 3+ → route to GROUP 1 skill
- GROUP 2 wins by 3+ → route to GROUP 2 skill
- Difference < 3 → probe user (max 3 questions)
- Both scores = 0 → default to `user-intent-interactive-loop`

---

## Concrete Routing: User Says X → Do Y

### Skill Creation (GROUP 2)

| User Says | Route | Stack | Why |
|-----------|-------|-------|-----|
| "create a skill like this @file" | `use-authoring-skills` | `skill-creator` | Creation verb + entity noun = GROUP 2 |
| "write a skill for code review" | `use-authoring-skills` | `writing-skills` | Creation verb + skill entity |
| "build a skill from this template" | `use-authoring-skills` | `skill-creator` | Creation verb + template modifier |
| "audit this skill" | `use-authoring-skills` | — | Skill entity, no creation verb → audit mode |
| "improve this skill's description" | `use-authoring-skills` | — | Skill entity + improvement intent |

### Agent Configuration (GROUP 2 → fallback)

| User Says | Route | Stack | Why |
|-----------|-------|-------|-----|
| "create a code review agent" | `opencode-platform-reference` | — | Creation verb + agent entity → fallback (no `use-authoring-agents` yet) |
| "configure agent permissions" | `opencode-platform-reference` | — | Configuration verb + agent entity |
| "set up a subagent for docs" | `opencode-platform-reference` | — | Setup verb + subagent entity |

### Command Creation (GROUP 2 → fallback)

| User Says | Route | Stack | Why |
|-----------|-------|-------|-----|
| "add a /test command" | `opencode-platform-reference` | — | Creation verb + command entity → fallback |
| "create a custom command" | `opencode-platform-reference` | — | Creation verb + command entity |

### Tool Creation (GROUP 2 → fallback)

| User Says | Route | Stack | Why |
|-----------|-------|-------|-----|
| "build a custom tool" | `opencode-tool-architect` | — | Creation verb + tool entity → `opencode-tool-architect` |
| "write a tool in TypeScript" | `opencode-tool-architect` | — | Creation verb + tool entity |

### OpenCode Configuration (GROUP 2 → this skill)

| User Says | Route | Stack | Why |
|-----------|-------|-------|-----|
| "configure OpenCode" | `opencode-platform-reference` | — | Configuration verb + platform entity |
| "add an MCP server" | `opencode-platform-reference` | — | Creation verb + MCP entity |
| "write AGENTS.md rules" | `opencode-platform-reference` | — | Creation verb + rules entity |
| "set up permissions" | `opencode-platform-reference` | — | Setup verb + permissions entity |

### Implementation Methodology (GROUP 1)

| User Says | Route | Stack | Why |
|-----------|-------|-------|-----|
| "help me figure out what I want" | `user-intent-interactive-loop` | — | Process verb, no entity → GROUP 1 |
| "run these 3 tasks in parallel" | `coordinating-loop` | `dispatching-parallel-agents` | Coordination noun + process verb |
| "plan this complex task" | `planning-with-files` | — | Process verb + planning modifier |
| "break this down into steps" | `planning-with-files` | — | Process verb + planning modifier |

### Stacking (This Skill)

| User Says | Route | Stack | Why |
|-----------|-------|-------|-----|
| "stack these skills together" | This skill | See 03-stacking-rules.md | Stacking verb → this skill |
| "combine skill authoring with parallel dispatch" | This skill | `use-authoring-skills` + `coordinating-loop` | Stacking verb + multi-domain |

---

## Probing Protocol

When the score difference is < 3, ask targeted questions. Max 3 questions per turn.

### Probe Templates

| Ambiguity | Question |
|-----------|----------|
| Unclear domain | "Are you looking to **create** something new (skill, agent, command, tool), or **figure out how** to approach existing work?" |
| Unclear scope | "Is this a single task, or does it involve multiple pieces that could run in parallel?" |
| Unclear urgency | "Should I start executing now, or would you like to plan the approach first?" |

### Probe Discipline

- One question per turn unless the user invites more.
- Stop probing when you can articulate intent back and the user confirms.
- After 3 probes, make a best-effort classification and state your assumptions.

---

## Worked Classification Examples

### Example 1: "I want to create a skill like this @deep-research.md"

```
Signals:
  creation_verbs: "create" → 1 × 3 = 3
  entity_nouns: "skill" → 1 × 2 = 2
  new_modifiers: "like this" → 1 × 1 = 1
  GROUP 2 score = 6

  process_verbs: 0 × 3 = 0
  coordination_nouns: 0 × 2 = 0
  planning_modifiers: 0 × 1 = 0
  GROUP 1 score = 0

Result: GROUP 2 wins by 6 → route to use-authoring-skills
```

### Example 2: "Help me think through how to coordinate these agents"

```
Signals:
  creation_verbs: 0 × 3 = 0
  entity_nouns: "agents" → 1 × 2 = 2
  new_modifiers: 0 × 1 = 0
  GROUP 2 score = 2

  process_verbs: "help me think", "coordinate" → 2 × 3 = 6
  coordination_nouns: "agents" (as coordination target) → 1 × 2 = 2
  planning_modifiers: 0 × 1 = 0
  GROUP 1 score = 8

Result: GROUP 1 wins by 6 → route to coordinating-loop
```

### Example 3: "Set up a new agent with restricted tools"

```
Signals:
  creation_verbs: "set up" → 1 × 3 = 3
  entity_nouns: "agent", "tools" → 2 × 2 = 4
  new_modifiers: "new" → 1 × 1 = 1
  GROUP 2 score = 8

  process_verbs: 0 × 3 = 0
  coordination_nouns: 0 × 2 = 0
  planning_modifiers: "restricted" (weak) → 0 × 1 = 0
  GROUP 1 score = 0

Result: GROUP 2 wins by 8 → route to opencode-platform-reference (agent config fallback)
```

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| "do everything" | Route to `user-intent-interactive-loop` — scope undefined |
| References non-existent skill | Inform user, suggest closest match, offer to create |
| User changes mid-session | Re-classify, update routing, log the change |
| Multiple intents in one message | Handle sequentially, not in parallel |
| User provides a file path | Read the file first, then classify based on its content + user message |
