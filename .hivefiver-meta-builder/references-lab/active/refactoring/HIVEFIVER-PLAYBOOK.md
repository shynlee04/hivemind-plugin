# Hivefiver Playbook

## Core Principles

Hivefiver is the **meta-builder module** for HiveMind. It creates, audits, stacks, and extends OpenCode soft concepts: skills, agents, commands, tools, and workflows. It is NOT a product code executor.

### What Hivefiver IS

- **Orchestrator**: Routes requests to specialist subagents
- **Quality gatekeeper**: Verifies outputs before passing on
- **Pattern enforcer**: Ensures agentskills.io principles are followed
- **Meta-concept craftsman**: Creates skills, agents, commands, and tools

### What Hivefiver IS NOT

- **Executor**: Never implements code directly — always delegates
- **Generic agent**: Never uses `general`, `Explore`, `Plan` — always specialist subagents
- **Context hoarder**: Never passes session history to subagents
- **File inliner**: Never dumps large files into subagent prompts

### The Iron Laws

```
NO DIRECT CREATION WITHOUT DELEGATION
NO SUBAGENT WITHOUT CONSTRUCTED CONTEXT
NO SKILL WITHOUT TRIGGER PHRASES
NO STACK WITHOUT A REASON
```

---

## Skill Authoring Rules

### The Trigger Phrase Mandate

The skill `description` field is the **ONLY thing** an agent sees before deciding to load the skill. Without specific trigger phrases, the skill is invisible.

**WRONG:**
```yaml
description: "Provides guidance for skill development."
```

**RIGHT:**
```yaml
description: "Use when creating a new skill from scratch, editing an existing skill, or auditing skill quality. Triggers on: 'create a skill', 'make a skill', 'audit this skill', 'fix the triggers on a skill'."
```

### Trigger Phrase Requirements

- Must be **third person**: "Use when..." not "I help you..."
- Must contain **specific phrases** users would actually say
- Must include **"Use when..."** clause
- Max 64 characters for skill name (kebab-case)

### Skill Anatomy

```
skill-name/
├── SKILL.md              # Entry point with frontmatter + procedures
├── references/           # Substantive depth files (100+ lines each)
│   ├── 01-skill-anatomy.md
│   ├── 02-frontmatter-standard.md
│   └── 03-pattern-selection.md
├── scripts/              # Validation scripts (must exit non-zero on failure)
│   ├── validate-skill.sh
│   └── check-overlaps.sh
└── templates/             # Optional scaffolds
```

### SKILL.md Body Rules

1. **Procedures over declarations** — "Run this script", "Check the output", "If X, do Y"
2. **Defaults not menus** — Pick one approach as primary path
3. **Checklists for 3+ steps** — `[ ]` items agents check off
4. **Validation loops** — do → validate → fix → repeat
5. **Anti-patterns table** — Detection + Correction for each

**NEVER write:**
- "This skill handles..."
- "The agent should..."
- Pseudo-code or TypeScript examples as "implementation"

### Frontmatter Standard

```yaml
---
name: skill-name
description: <third-person description with trigger phrases>
metadata:
  layer: "<N>"
  role: "<routing|domain-execution|verification>"
  pattern: P<P1|P2|P3>
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---
```

**Required fields:** `name`, `description`
**Banned fields:** `compatibility` (per agentskills.io spec)
**Note:** `allowed-tools` must be a proper YAML list (with `-` prefixes) or omitted entirely. Space-separated strings like `allowed-tools: Read Write Edit` will NOT parse correctly.

### Pattern Selection

| Pattern | When | SKILL.md Size | Reference Files |
|---------|------|---------------|-----------------|
| **P1 — Router** | Thin entry, delegates to sub-skills | <200 lines | 0-2 |
| **P2 — Domain** | Focused guidance for one domain | 200-400 lines | 3-8 |
| **P3 — Comprehensive** | Deep reference-heavy content | 400+ lines | 8-12 |

### Validation Gate

Before declaring skill creation complete:

- [ ] Description has trigger phrases (specific things users would say)
- [ ] Description uses third person
- [ ] SKILL.md body uses imperative form (procedures, not declarations)
- [ ] SKILL.md is lean (1,500-2,000 words, <5k max)
- [ ] All referenced files exist and have real content (not stubs)
- [ ] No script stubs that exit 0 always
- [ ] No dead references to files/scripts that don't exist
- [ ] Works standalone — doesn't require other HiveMind skills

---

## Agent Definition Rules

### Agent File Structure

```
---
description: "What this agent does. Trigger phrases in quotes."
mode: <primary|subagent>
temperature: <0.0-1.0>
steps: <max steps, e.g. 80>
instructions: [<file paths>]
permission:
  read: allow|ask
  edit: allow|ask
  write: allow|ask
  bash:
    "*": ask|allow|ask
    "git status*": allow
  task: allow|ask
  skill:
    "*": ask
    "skill-name": allow
  glob: allow|ask
  grep: allow|ask
---
```

**Field notes:**
- `name` is NOT a frontmatter field — the agent name is derived from the filename
- `instructions` (plural) is the correct field name, not `instruction`
- `steps` is required — sets the maximum step budget for the agent

### Agent Modes

| Mode | Use When | Can Use Task Tool |
|------|----------|------------------|
| **primary** | User-facing, orchestrating | Yes |
| **subagent** | Specialist, spawned by Task tool | No |

### Specialist Subagent Types

**Never use generic agent types.** Always use project-specific specialists:

| Correct | Never Use |
|---------|-----------|
| `hivefiver-skill-author` | `general`, `Explore` |
| `hivefiver-agent-builder` | `Plan`, `Researcher` |
| `critic` | `general`, `Reviewer` |
| `researcher` | `Explore`, `Plan` |
| `builder` | `general`, `Implementer` |

### The `<files_to_read>` Mandate

When a prompt contains a `<files_to_read>` block, agents **MUST** use the Read tool to load every file listed before performing any other actions.

```markdown
**CRITICAL: Mandatory Initial Read**
If the prompt contains a `<files_to_read>` block, you MUST use the `Read` tool to load every file listed there before performing any other actions. This is your primary context.
```

### Project Context Discovery Pattern

When starting fresh in a project:

```markdown
**Project context:**
1. List available skills (subdirectories)
2. Read `SKILL.md` for each skill (lightweight index ~130 lines)
3. Load specific `rules/*.md` files as needed
4. Do NOT load full `AGENTS.md` files
```

### Delegation Protocol

When using the Task tool to spawn subagents:

1. **Construct fresh context** — task text + scene-setting + scope + output format
2. **Never pass session history** — the subagent has its own context window
3. **Wait for completion** — before proceeding to the next task
4. **Use Task tool, not text simulation** — never write `**Tool: Task**` blocks

**CORRECT:**
```
Task tool:
  description: "Phase 0: Skim the user's prompt"
  prompt: "Analyze this prompt and return a skim summary.\n\nPrompt: $USER_PROMPT\n\nReturn: intent, complexity_score, key_entities, ambiguity_flags."
```

### Status Protocol

| Status | Meaning | Action |
|--------|---------|--------|
| DONE | Complete, verified | Proceed |
| DONE_WITH_CONCERNS | Complete but has doubts | Read concerns → address if correctness |
| NEEDS_CONTEXT | Hit knowledge gap | Provide context → re-dispatch |
| BLOCKED | Cannot proceed | Assess → escalate if needed |

---

## Anti-Patterns to Never Do

### The Phantom
- **Problem:** Description has no trigger phrases
- **Detection:** `grep -i "use when\|triggers on" SKILL.md` returns nothing
- **Never let this happen:** Every skill must have specific user phrases

### The Bloat
- **Problem:** SKILL.md exceeds 800 lines
- **Detection:** `wc -l SKILL.md` > 800
- **Never let this happen:** Split into thin SKILL.md + reference files

### The Stub
- **Problem:** Scripts that exit 0 without checking
- **Detection:** `grep "exit 0" scripts/*.sh` finds stub scripts
- **Never let this happen:** Delete or implement real validation

### The Ghost
- **Problem:** References to files that don't exist
- **Detection:** `ls references/` vs grep in SKILL.md
- **Never let this happen:** Remove dead refs or create the files

### The Dependent
- **Problem:** Skill requires other skills to work
- **Detection:** `grep "load.*skill" SKILL.md`
- **Never let this happen:** Make standalone, push to load as prerequisite

### The Declarer
- **Problem:** Body says "this skill handles..." not "run this..."
- **Detection:** `grep -c "this skill\|the agent should" SKILL.md`
- **Never let this happen:** Rewrite in imperative form

### The Simulator
- **Problem:** Writing fake `**Tool: Task**` blocks in text
- **Detection:** Text includes `**Input:**` / `**Output:**` blocks
- **Never let this happen:** Always use the actual Task tool

### The Executor
- **Problem:** Creating skills/agents directly instead of delegating
- **Detection:** You wrote/edit a SKILL.md or agent file yourself
- **Never let this happen:** Delegate to specialist via Task tool

### The Context Polluter
- **Problem:** Passing session history to subagents
- **Detection:** Subagent prompt includes "earlier in conversation"
- **Never let this happen:** Construct fresh context every time

### The Improviser
- **Problem:** Ignoring routing table, doing wrong specialization
- **Detection:** Routed to wrong skill, task failed
- **Never let this happen:** Trust the routing table

---

## GSD Patterns to Avoid

GSD (get-shit-done) patterns are specific to the GSD CLI environment. Hivefiver skills and agents must NOT use them on bare OpenCode.

### GSD CLI Dependency

**GSD pattern (AVOID):**
```markdown
# Run gsd-tools for validation
$HOME/.claude/get-shit-done/bin/gsd-tools.cjs validate-skill
```

**Hivefiver correct pattern:**
```bash
bash scripts/validate-skill.sh <skill-dir>
```

### Hardcoded Home Paths

**GSD pattern (AVOID):**
```markdown
Read `~/.claude/get-shit-done/references/thinking-models.md`
```

**Hivefiver correct pattern:**
```markdown
Read `.opencode/skills/use-authoring-skills/references/03-three-patterns.md`
```

### Wrong YAML allowed-tools

**GSD pattern (AVOID):**
```yaml
allowed-tools: Read Write Edit
```

**Hivefiver correct pattern:**
```yaml
# Use proper YAML list format:
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep

# OR omit the field entirely (it's optional per agentskills.io spec)
```

### Constraint Flags That Don't Exist

**GSD pattern (AVOID):**
```markdown
# Use --constraint flag to restrict operations
gsd-tools --constraint no-delete validate
```

**Hivefiver correct pattern:**
```markdown
# Use session context via task prompt sections instead
# Constraints are conveyed through permissions in the agent frontmatter
```

### Generic Agent Types

**GSD pattern (AVOID):**
```markdown
Use the `general` agent for this task.
```

**Hivefiver correct pattern:**
```markdown
Use the `hivefiver-skill-author` subagent for skill creation.
```

### Pseudo-Code as Implementation

**GSD pattern (AVOID):**
```markdown
# Example implementation in TypeScript:
# function validateSkill(skillDir: string): boolean {
#   const files = fs.readdirSync(skillDir);
#   return files.includes('SKILL.md');
# }
```

**Hivefiver correct pattern:**
```markdown
# Describe the pattern, not the code
# Scripts live in scripts/ directory with real validation logic
# SKILL.md references scripts, doesn't inline them
```

---

## Required Reading Pattern

### The `<files_to_read>` Block

When present in a prompt, this is **mandatory**:

```markdown
**CRITICAL: Mandatory Initial Read**
If the prompt contains a `<files_to_read>` block, you MUST use the `Read` tool to load every file listed there before performing any other actions. This is your primary context.
```

### Reading Order

1. **Files in `<files_to_read>` block** — always first, before anything else
2. **Skill SKILL.md** — for skill-specific guidance
3. **Reference files** — for depth on specific topics
4. **Rules files** — for platform constraints

### What to Never Do

- **Never inline large files** — direct agents to read from disk
- **Never read full PLAN.md files** from other phases — only current phase plans
- **Never re-read full file contents** when frontmatter is sufficient

---

## Self-Contained Design

### The Standalone Contract

Every skill, agent, and command must work without requiring other HiveMind skills to be loaded.

**WRONG:**
```yaml
# This skill requires another skill to work
Before using this skill, load: meta-builder
```

**RIGHT:**
```yaml
# This skill works standalone
# Prerequisites are documented, not required
# If prerequisites are needed, they are pushed to load, not required
```

### No External Dependencies

Skills must NOT reference:
- `$HOME/.claude/get-shit-done/` paths
- GSD CLI tools (`gsd-tools.cjs`)
- Hardcoded absolute paths (`/Users/xxx`)
- Other HiveMind skills as hard requirements

### Path References

Use **relative paths** from workspace root:

| Instead of | Use |
|------------|-----|
| `~/claude/skills/` | `.opencode/skills/` |
| `/Users/xxx/project` | `.` or absolute via `$WORKDIR` |
| `$HOME/.claude/get-shit-done/` | `./.opencode/` |

### MCP Tool Usage

When available, use MCP tools for documentation lookups:

```markdown
<mcp_tool_usage>
Use all tools available in your environment. If Context7 MCP is available, use it for library documentation lookups.
</mcp_tool_usage>
```

---

## Context Window Awareness

### Scaling Rules

| Context Window | Delegation Strategy |
|---------------|---------------------|
| < 50K tokens | Minimal context, heavy delegation |
| 50K-100K tokens | Moderate context, focused subagents |
| 100K-200K tokens | Standard delegation, watch for bloat |
| 200K+ tokens | Full context, but still no session history passing |

### Budget Rules

- **Never inline large files** into subagent prompts
- **Delegate heavy work** to subagents
- **Prioritize skimming** for research tasks: grep, regex, keywords, metadata
- **Warn at 70% context** usage

### Never Do

- Never pass session history to subagents
- Never dump conversation context into task prompts
- Never assume subagent has "earlier context"

---

## Two-Stage Review

After specialist returns DONE, always perform two-stage review:

### Stage 1: Spec Compliance
Does the output match requirements?
- Nothing extra?
- Nothing missing?

**Stage 1 MUST pass before Stage 2.**

### Stage 2: Code Quality
Is it well-built?
- Clean structure?
- Following patterns?

---

## Output Contract

After completing meta-concept creation, return this contract:

```markdown
## HIVEFIVER COMPLETE

**Request:** [what was asked]
**Routed to:** [specialist agent + skill]
**Status:** DONE | DONE_WITH_CONCERNS | BLOCKED

### What Was Created
- `path/to/file.md` — [purpose]

### Verification
- [validation steps and results]

### Next Steps
- [how to test, what to do next]
```

For skill authoring specifically:

```markdown
## SKILL AUTHOR COMPLETE

**Skill:** <name>
**Pattern:** P<P1|P2|P3>
**Location:** <path>

### Files Created
- `SKILL.md` — <lines> lines
- `references/` — <N> files, <total> lines
- `scripts/` — <N> files, <total> lines

### Validation Results
- validate-skill.sh: PASS | FAIL (<details>)
- check-overlaps.sh: PASS | FAIL (<details>)

### Trigger Phrases
- "<phrase 1>"
- "<phrase 2>"
- "<phrase 3>"
```

---

## Summary Card

| Rule | Must Never |
|------|------------|
| **Creation** | Never create directly — always delegate |
| **Delegation** | Never pass session history — construct fresh context |
| **Skills** | Never skip trigger phrases — skill is dead without them |
| **Agents** | Never use generic types — always specialist |
| **Files** | Never inline large files — direct to disk |
| **Patterns** | Never use GSD CLI tools — use native OpenCode tools |
| **Paths** | Never hardcode home paths — use relative paths |
| **Review** | Never skip Stage 1 — spec compliance before quality |
