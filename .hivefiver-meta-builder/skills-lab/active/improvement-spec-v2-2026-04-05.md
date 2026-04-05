# Improvement Spec v2 — What Superpowers Gets Right That We Don't

**Created:** 2026-04-05
**Status:** DRAFT v2 — Honest assessment after reading actual source
**Previous version:** improvement-packages-spec-2026-04-05.md (overengineered — replaced)

---

## The Real Mechanism (from reading the source)

Superpowers works because of **3 things**, not 14:

### 1. Prompt Templates (the gap-filler between skills)

```
subagent-driven-development/
├── SKILL.md                         ← 12K — controller logic
├── implementer-prompt.md            ← 4.2K — THE template
├── spec-reviewer-prompt.md          ← 2K — THE template
└── code-quality-reviewer-prompt.md  ← 1.1K — delegates to requesting-code-review

writing-plans/
├── SKILL.md                         ← 6K — writes ONE plan
└── plan-document-reviewer-prompt.md ← 1.7K — THE template
```

Each template is a **filled-by-the-controller** document. The controller:
- Reads the plan
- Extracts task text (FULL TEXT, never file paths)
- Pastes it into the template
- Dispatches subagent with the filled template

The subagent never reads files. The subagent never inherits session context. The controller constructs EXACTLY what the subagent needs.

### 2. ONE Plan (not hierarchies)

`writing-plans` produces ONE file: `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`

No PRD → Architecture Plan → Implementation Plan → Verification Plan. Just ONE plan with:
- Header saying "REQUIRED SUB-SKILL: subagent-driven-development"
- Bite-sized tasks (2-5 min each)
- Actual code in every step (no placeholders)
- Self-review before handoff

### 3. Status Protocol (the return path)

Every subagent returns one of:
- **DONE** — proceed to review
- **DONE_WITH_CONCERNS** — read concerns first
- **NEEDS_CONTEXT** — provide context, re-dispatch
- **BLOCKED** — assess, escalate, or decompose

The controller handles each differently. Never ignores escalation. Never retries without change.

---

## What .skills-lab Gets Wrong

| .skills-lab Pattern | Why It's Wrong | What Superpowers Does Instead |
|---------------------|----------------|------------------------------|
| Scripts/ directory with stubs (validate-gate.sh, check-overlaps.sh) | Fake enforcement — exits 0 always | No scripts. Enforcement is in the SKILL.md text (Iron Laws, rationalization tables) |
| Graph/hierarchy references (graph.json, MINDNETWORK) | Adds complexity that doesn't help | Flat: skill → template → subagent. No graph. |
| Multiple planning files (task_plan + findings + progress) | Fragmented state | ONE plan file. Findings go in the plan. Progress is git commits. |
| Gate scripts (validate-gate.sh) | Cosmetic — scripts that always pass | Real gates: "if you haven't run the verification command in this message, you cannot claim it passes" |
| Skill hierarchy enforcement (LAYER 0-4) | Rigid layers that don't match reality | Natural chain: brainstorming → writing-plans → subagent-driven → finishing. No layer numbers. |
| Hierarchy of agents (coordinator → conductor → builder → critic → explore → researcher) | 6 agents, most unused | 3 roles: implementer, spec reviewer, code quality reviewer. All dispatched as Task tool subagents. |

---

## What's Actually Worth Building

### Keep These (they're unique, superpowers doesn't have them)

1. **opencode-platform-reference** — 87MB of actual SDK docs, configs, source code. Superpowers has nothing like this.
2. **repomix-exploration-guide** — Codebase exploration patterns. Unique.
3. **opencode-non-interactive-shell** — Headless execution strategy. Unique.
4. **planning-with-files** — 3-file persistence is different from superpowers' single-plan-file approach. Both have merits. Keep as option.

### Drop These (superpowers does it better, don't duplicate)

1. **meta-builder** — Replace with: just USE superpowers:brainstorming. The routing table is unnecessary complexity.
2. **coordinating-loop** — Replace with: superpowers:subagent-driven-development. The templates (implementer-prompt.md, spec-reviewer-prompt.md, code-quality-reviewer-prompt.md) are the actual mechanism.
3. **user-intent-interactive-loop** — Replace with: superpowers:brainstorming or superpowers:simple (lighter). Both already do intent probing.
4. **use-authoring-skills** — Keep the REFERENCES (agentskills.io principles, three-patterns.md, quality-matrix.md). Drop the script infrastructure. The validation is in the text, not in bash stubs.

### Build These (the actual gap)

**Gap 1: HiveMind-specific commands** — Superpowers doesn't know about OpenCode agents, plugins, hooks, tools, MCP servers. We need commands that:
- `/create-agent` — reads opencode-platform-reference/references/opencode-agents.md, produces agent .md file
- `/create-command` — reads opencode-platform-reference/references/opencode-commands.md, produces command .md file
- `/create-tool` — reads opencode-platform-reference/references/opencode-custom-tools.md, produces tool file
- `/doctor-config` — reads opencode-platform-reference/references/opencode-configs.md, validates opencode.json

Each command should have a **prompt template** (like superpowers' implementer-prompt.md) that the agent fills and dispatches.

**Gap 2: Research/investigation templates** — Superpowers has no research skill. We need:
- `investigator-prompt.md` — template for dispatching research subagents (codebase exploration, web search, doc synthesis)
- `synthesis-prompt.md` — template for combining multiple research results into one document

These go in a new skill directory alongside the SKILL.md, following the superpowers pattern.

**Gap 3: Agent team definition** — Not 6 agents. 3, matching superpowers' actual roles:
- `coordinator` — dispatches with templates, handles status protocol
- `implementer` — receives filled template, executes, returns status
- `reviewer` — receives filled template + work output, returns verdict

Each has the right permissions (not the hivefiver "deny everything" approach).

---

## The Actual Implementation Order

| Step | What | Why This First |
|------|------|---------------|
| 1 | Write prompt templates (investigator-prompt.md, synthesis-prompt.md) | Templates are the mechanism. Without them, nothing else works. |
| 2 | Write 4 commands (/create-agent, /create-command, /create-tool, /doctor-config) | Commands are the user entry points. Each fills a template. |
| 3 | Write 3 agent definitions (coordinator, implementer, reviewer) | Agents receive filled templates. Simple YAML. |
| 4 | Strip meta-builder and coordinating-loop back to basics | Remove graph/hierarchy/script references. Keep only what actually helps. |
| 5 | Keep use-authoring-skills REFERENCES, drop script stubs | The references are valuable (agentskills.io, three-patterns, quality-matrix). The scripts that exit 0 are not. |

---

## What NOT To Do (Lessons from v1 Spec)

1. **Don't create 5 packages** — Too much structure. Just: templates → commands → agents → cleanup.
2. **Don't create plan hierarchies** — ONE plan. Not PRD → Plan → Verification Plan. Superpowers proves one plan is enough.
3. **Don't create variant systems** — One naming convention. One output location. Done.
4. **Don't create script infrastructure** — Enforcement is in the SKILL.md text (Iron Laws, rationalization tables, red flags lists). Not in bash scripts that exit 0.
5. **Don't duplicate superpowers skills** — If superpowers has it (brainstorming, writing-plans, tdd, subagent-driven, verification), USE it. Don't reimplement.
6. **Don't create MINDNETWORK/graph infrastructure** — Superpowers proves flat skill → template → subagent is enough.

---

## Template Examples (What "Good" Looks Like)

### investigator-prompt.md (Gap 2)
```
You are investigating [TOPIC] for the HiveMind project.

## Scope
[FULL TEXT of research scope — pasted, not file path]

## Questions to Answer
1. [Question 1]
2. [Question 2]
3. [Question 3]

## Context
[Scene-setting: where this fits, why it matters]

## Your Job
1. Search codebase using grep/glob for relevant patterns
2. Search web for current documentation (use MCP tools)
3. Read relevant files completely (don't skim)
4. Synthesize findings into structured report

## Output Format
Return:
- **Status:** DONE | NEEDS_CONTEXT | BLOCKED
- **Findings:** [numbered list with file:line references]
- **Resources:** [URLs and file paths discovered]
- **Gaps:** [what you couldn't answer and why]
```

### /create-agent command
```yaml
---
description: "Create an OpenCode agent definition. Use when adding new agents to the team."
arguments:
  - name: purpose
    description: "What this agent does"
---
```

Command body reads `opencode-platform-reference/references/opencode-agents.md`, then uses the brainstorming skill to probe intent, then produces the agent .md file following the spec.

---

## File Map (What Goes Where)

```
.skills-lab/active/
├── improvement-spec-v2-2026-04-05.md     ← this file
├── refactoring-skills/
│   ├── opencode-platform-reference/      ← KEEP (unique value)
│   ├── repomix-exploration-guide/        ← KEEP (unique value)
│   ├── repomix-explorer/                 ← KEEP (unique value)
│   ├── opencode-non-interactive-shell/   ← KEEP (unique value)
│   ├── planning-with-files/              ← KEEP (different approach, valid)
│   ├── use-authoring-skills/             ← STRIP scripts, KEEP references
│   ├── meta-builder/                     ← STRIP to routing table only
│   ├── coordinating-loop/                ← STRIP to dispatch + templates
│   ├── user-intent-interactive-loop/     ← EVALUATE against superpowers:brainstorming
│   ├── oh-my-openagent-reference/        ← KEEP (reference, but trim 87MB)
│   └── oh-my-openagent-reference copy/   ← DELETE (stale copy)
│
│   NEW: investigation/                   ← New skill for research
│   ├── SKILL.md
│   ├── investigator-prompt.md
│   └── synthesis-prompt.md
│
.opencode/
├── agents/
│   ├── coordinator.md    ← REPLACE hivefiver
│   ├── implementer.md    ← NEW
│   ├── reviewer.md       ← NEW
│   └── hivefiver.md      ← ARCHIVE (not delete)
├── commands/
│   ├── create-agent.md   ← NEW
│   ├── create-command.md ← NEW
│   ├── create-tool.md    ← NEW
│   └── doctor-config.md  ← NEW
└── skills/
    └── [keep existing — don't touch]
```
