---
name: meta-builder
description: Use when building, modifying, or combining agent skills, commands, tools, agents, or OpenCode configurations. Routes intent to the right authoring skill, stacks skills for multi-domain tasks, and provides concrete recipes. Triggers: "create a skill like this", "build a skill", "create an agent", "set up a command", "add a custom tool", "configure OpenCode", "stack these skills", "modify my workflow", "add MCP server", "write a rule".
metadata:
  audience: agent-operators
  workflow: orchestration
  spec: agentskills.io
allowed-tools: Bash skill
---

# meta-builder

Thin routing orchestrator. Routes user intent to specialist authoring skills, stacks skills for multi-domain tasks, and provides concrete recipes.

**This skill enforces. It does not execute.** If you catch yourself editing files, STOP and route.

---

## ENFORCEMENT: Run This Before Anything Else

```bash
bash "$(dirname "$0")/../scripts/preflight.sh" "$USER_REQUEST"
```

In practice, run the preflight with the user's exact request text:

```bash
bash .skills-lab/refactoring-skills/meta-builder/scripts/preflight.sh "<exact user text>"
```

**The preflight script blocks on:**
1. Non-empty request (exit 1 if blank)
2. Deterministic GROUP scoring (GROUP_1 vs GROUP_2 — see formula below)
3. Primary skill existence on disk (searches local + global paths)
4. Stack skill existence (if stacking recipe applies)

**Parse the output.** It returns key=value lines:
```
INTENT=<extracted intent>
GROUP=<GROUP_1|GROUP_2>
PRIMARY_SKILL=<skill-name>
STACK_SKILLS=<comma-separated or empty>
QUESTIONS_ALLOWED=<0-3>
PREFLIGHT_PASSED=true
```

If `PREFLIGHT_PASSED` is not `true`, do NOT proceed. Fix the issue first.

---

## Mandatory Execution Order

After preflight passes, follow these steps **in order**. No skipping.

1. **Read preflight output.** Note `PRIMARY_SKILL`, `STACK_SKILLS`, `QUESTIONS_ALLOWED`.
2. **Load the primary skill** via the `skill` tool. Example: `skill({ name: "use-authoring-skills" })`
3. **If STACK_SKILLS is non-empty**, load each stack skill too. Max 3 total.
4. **Execute within the loaded skill's workflow.** Do NOT execute directly from meta-builder.
5. **If QUESTIONS_ALLOWED > 0 and intent needs clarification**, ask questions using the `task` tool or direct text. **Max 3 questions total across the entire session.** Track count.
6. **Create a todo plan** via `todowrite` before any file edits. Each task = one skill workflow step.

---

## Routing Table — User Says X → Do Y

| User Says | Primary Skill | Stack With | Reference |
|-----------|--------------|------------|-----------|
| "create a skill like this @file" | `use-authoring-skills` | `skill-creator` | 01-routing-logic.md |
| "write a skill" / "build a skill" | `use-authoring-skills` | `writing-skills` | 01-routing-logic.md |
| "audit this skill" / "improve this skill" | `use-authoring-skills` | — | 01-routing-logic.md |
| "create an agent" / "configure agent" | `opencode-platform-reference` | — | 02-opencode-concepts.md |
| "set up a command" / "add /my-command" | `opencode-platform-reference` | — | 02-opencode-concepts.md |
| "build a custom tool" / "add a tool" | `opencode-tool-architect` | — | 02-opencode-concepts.md |
| "configure OpenCode" / "opencode.json" | `opencode-platform-reference` | — | 02-opencode-concepts.md |
| "add MCP server" / "configure LSP" | `opencode-platform-reference` | — | 02-opencode-concepts.md |
| "write a rule" / "AGENTS.md" | `opencode-platform-reference` | — | 02-opencode-concepts.md |
| "stack skills" / "combine skills" | This skill | See recipes below | 03-stacking-rules.md |
| "help me figure out what I want" | `user-intent-interactive-loop` | — | 01-routing-logic.md |
| "coordinate agents" / "dispatch parallel" | `coordinating-loop` | `dispatching-parallel-agents` | 01-routing-logic.md |
| "plan this" / "break it down" | `planning-with-files` | — | 01-routing-logic.md |

---

## Routing Decision Formula

```
GROUP 1 score = (process_verbs × 3) + (coordination_nouns × 2) + (planning_modifiers × 1)
GROUP 2 score = (creation_verbs × 3) + (entity_nouns × 2) + (new_modifiers × 1)
```

**Process verbs** (GROUP 1): figure out, explore, brainstorm, coordinate, dispatch, plan, organize
**Creation verbs** (GROUP 2): create, build, write, design, set up, add, configure
**Coordination nouns** (GROUP 1): parallel, batch, handoff, orchestrate, multiple
**Entity nouns** (GROUP 2): skill, agent, command, tool, workflow, MCP, LSP, rule
**Planning modifiers** (GROUP 1): complex, multi-step, long-running, iterative
**New modifiers** (GROUP 2): new, from scratch, first time, template

Route to the higher score. If within 2 points, use `QUESTIONS_ALLOWED` to probe the user. Tie-breaker: file reference (`@file`) → GROUP_2.

---

## Stacking Recipes

Max 3 skills per stack.

### Recipe 1: Create Skill from Template
```
Primary:     use-authoring-skills
Complement:  skill-creator
Purpose:     Convert a file/template into a valid SKILL.md
Steps:       1. Read template  2. Apply frontmatter  3. Write body  4. Validate
```

### Recipe 2: Create Skill + Parallel Audit
```
Primary:     use-authoring-skills
Complement:  coordinating-loop
Purpose:     Author a skill while auditing existing ones in parallel
Steps:       1. Draft skill  2. Dispatch audit subagent  3. Merge results
```

### Recipe 3: Full Meta Work (Routing + Authoring + Persistence)
```
Primary:     use-authoring-skills
Complement:  planning-with-files, coordinating-loop
Purpose:     Long-running skill authoring with persistent state
Steps:       1. Init task_plan.md  2. Author skill  3. Track phases  4. Validate
```

### Recipe 4: OpenCode Configuration
```
Primary:     opencode-platform-reference
Complement:  meta-builder (this skill)
Purpose:     Configure agents, commands, tools, MCP, LSP, permissions
Steps:       1. Identify concept  2. Read concept reference  3. Apply config
```

---

## Worked Example

**User says:** "I want to create a skill like this @.kilo/command/deep-research-synthesis-repomix.md"

1. **Run preflight:** `bash scripts/preflight.sh "create a skill like this @.kilo/command/deep-research-synthesis-repomix.md"`
2. **Parse output:** `PRIMARY_SKILL=use-authoring-skills`, `STACK_SKILLS=skill-creator`, `GROUP=GROUP_2`
3. **Load skills:** `skill({ name: "use-authoring-skills" })` then `skill({ name: "skill-creator" })`
4. **Execute within those skills' workflows** — do NOT execute directly from meta-builder.

---

## Question Enforcement

- **Max 3 questions per session.** Track count in a variable.
- **Questions must be specific.** Not "what do you want?" but "Should this skill trigger on 'create X' or 'build X'?"
- **After 3 questions**, make a best-effort routing decision and proceed. Document the assumption.
- **Never ask questions** when the preflight already determined a clear route (score difference > 4).

---

## Anti-Patterns — With Detection

| Anti-Pattern | What It Looks Like | How to Detect |
|-------------|-------------------|---------------|
| Executor | meta-builder edits files directly | Check: did this skill call write/edit? If yes, STOP. |
| Hoarder | 4+ skills loaded simultaneously | Count active skills. If >3, unload the least relevant. |
| Blind Router | Routing without running preflight | Check: did you run preflight.sh first? If no, run it. |
| Concept Dumper | Loading all 10 OpenCode concepts at once | Check: does the user's request mention MCP/LSP/agents? If not, skip 02-opencode-concepts.md. |
| Silent Worker | Many turns without user update | Check: has the user been informed of the routing decision? |
| Question Spammer | Asking >3 questions or vague questions | Count questions. If >3, STOP and route with assumption. |

---

## Progressive Disclosure

| Situation | Read This | Skip This |
|-----------|-----------|-----------|
| Creating a skill | Routing Table → Recipe 1 → load `use-authoring-skills` | 02-opencode-concepts.md, 04-hivemind-compatibility.md |
| Configuring OpenCode | Routing Table → Recipe 4 → 02-opencode-concepts.md | 01-routing-logic.md, 03-stacking-rules.md |
| Stacking skills | Routing Table → Stacking Recipes → 03-stacking-rules.md | 02-opencode-concepts.md, 04-hivemind-compatibility.md |
| Intent unclear | Run preflight → if GROUP_1, load `user-intent-interactive-loop` | All references until intent is clear |

---

## Platform Adaptation

| Platform | Skill Tool | Skill Path | Config |
|----------|-----------|------------|--------|
| OpenCode | `skill` tool | `.opencode/skills/`, `~/.config/opencode/skills/` | `opencode.json` |
| Claude Code | `Skill` tool | `.claude/skills/`, `~/.claude/skills/` | `CLAUDE.md` |
| Codex | `Skill` tool | `.agents/skills/`, `~/.agents/skills/` | `AGENTS.md` |
| Cursor | `Skill` tool | `.agents/skills/`, `~/.agents/skills/` | `.cursor/rules/` |

---

## Future Skills — Fallback Behavior

| Missing Skill | Fallback |
|--------------|----------|
| `use-authoring-agents` | `opencode-platform-reference` (agents concept) |
| `use-authoring-commands` | `opencode-platform-reference` (commands concept) |
| `use-authoring-tools` | `opencode-tool-architect` |
| `use-authoring-workflows` | `opencode-platform-reference` + `coordinating-loop` |

---

## Reference Map

| File | When to Read |
|------|-------------|
| `references/01-routing-logic.md` | Intent is ambiguous; need detailed classification |
| `references/02-opencode-concepts.md` | User asks about OpenCode config (agents, commands, tools, MCP, LSP, permissions, rules) |
| `references/03-stacking-rules.md` | Task spans 2+ domains; need validation checklist |
| `references/04-hivemind-compatibility.md` | Only if working with HiveMind v3 TypeScript modules |
