# Cross-Platform Skill Activation

## Table of Contents

- [Purpose](#purpose)
- [How Skill Triggering Works](#how-skill-triggering-works)
- [Platform Discovery Mechanisms](#platform-discovery-mechanisms)
- [OpenCode Activation Patterns](#opencode-activation-patterns)
- [Claude Code Activation Patterns](#claude-code-activation-patterns)
- [Codex Activation Patterns](#codex-activation-patterns)
- [Cursor Activation Patterns](#cursor-activation-patterns)
- [Testing Skill Triggers](#testing-skill-triggers)
- [Cross-Platform Compatibility Considerations](#cross-platform-compatibility-considerations)
- [Discovery Optimization](#discovery-optimization)
- [Troubleshooting Activation](#troubleshooting-activation)
- [References](#references)

---

## Purpose

How skills activate across different agentic coding platforms. The `description` field in `SKILL.md` frontmatter is the primary triggering mechanism — but each platform has its own discovery, loading, and permission model. This file covers how to write skills that trigger reliably everywhere.

See [01-skill-anatomy.md](01-skill-anatomy.md) for directory structure and [02-frontmatter-standard.md](02-frontmatter-standard.md) for frontmatter schema.

---

## How Skill Triggering Works

All platforms follow the same progressive disclosure pattern:

1. **Discovery** — Platform scans filesystem for `SKILL.md` files
2. **Indexing** — Platform reads only `name` and `description` from frontmatter
3. **Matching** — When the Agent receives a user message, it compares the message against all indexed descriptions
4. **Activation** — If a description matches, the platform loads the full `SKILL.md` body into context
5. **Execution** — The Agent follows the instructions in the loaded skill

The description carries the entire burden of triggering. If the description does not convey when the skill is useful, the Agent will not know to reach for it.

### The Triggering Chain

```
User message → Platform scans descriptions → Semantic match → Load SKILL.md → Follow instructions
```

Each platform implements this chain differently. Your skill must work with all of them.

---

## Platform Discovery Mechanisms

### Where Platforms Look for Skills

| Platform | Project-Local Path | Global Path |
|----------|-------------------|-------------|
| **OpenCode** | `.opencode/skills/<name>/SKILL.md` | `~/.config/opencode/skills/<name>/SKILL.md` |
| **OpenCode** (compat) | `.claude/skills/<name>/SKILL.md` | `~/.claude/skills/<name>/SKILL.md` |
| **OpenCode** (compat) | `.agents/skills/<name>/SKILL.md` | `~/.agents/skills/<name>/SKILL.md` |
| **Claude Code** | `.claude/skills/<name>/SKILL.md` | `~/.claude/skills/<name>/SKILL.md` |
| **Codex** | `.agents/skills/<name>/SKILL.md` | `~/.agents/skills/<name>/SKILL.md` |
| **Cursor** | `.cursor/skills/<name>/SKILL.md` | `~/.cursor/skills/<name>/SKILL.md` |

**OpenCode** walks up from the current working directory to the git worktree root, loading any matching `skills/*/SKILL.md` along the way. This means a skill placed in any of the recognized locations will be discovered.

**Recommendation:** Place skills in `.agents/skills/<name>/SKILL.md` for maximum cross-platform compatibility. This path is recognized by OpenCode (compat mode), Codex, and is the most universal convention.

---

## OpenCode Activation Patterns

OpenCode has the most structured skill system. Understanding it helps you write skills that work everywhere.

### Discovery and Loading

OpenCode lists available skills in the `skill` tool description:

```xml
<available_skills>
  <skill>
    <name>git-release</name>
    <description>Create consistent releases and changelogs</description>
  </skill>
</available_skills>
```

The Agent loads a skill by calling: `skill({ name: "git-release" })`

### Permission Control

Skills can be allowed, denied, or require approval via `opencode.json`:

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

| Permission | Behavior |
|------------|----------|
| `allow` | Skill loads immediately |
| `deny` | Skill hidden from Agent, access rejected |
| `ask` | User prompted for approval before loading |

Patterns support wildcards: `internal-*` matches `internal-docs`, `internal-tools`, etc.

### Per-Agent Permissions

```json
{
  "agent": {
    "plan": {
      "permission": {
        "skill": {
          "documents-*": "allow"
        }
      }
    }
  }
}
```

### Disabling Skills Entirely

```json
{
  "agent": {
    "plan": {
      "tools": {
        "skill": false
      }
    }
  }
}
```

When disabled, the `<available_skills>` section is omitted entirely from the Agent's context.

### Troubleshooting OpenCode Loading

If a skill does not show up:
1. Verify `SKILL.md` is spelled in all caps
2. Check that frontmatter includes `name` and `description`
3. Ensure skill names are unique across all locations
4. Check permissions — skills with `deny` are hidden from Agents

---

## Claude Code Activation Patterns

Claude Code uses the same `SKILL.md` format but with different discovery paths:

- **Project-local:** `.claude/skills/<name>/SKILL.md`
- **Global:** `~/.claude/skills/<name>/SKILL.md`

### Activation Mechanism

Claude Code loads skill descriptions at session start. The Agent decides whether to invoke the `Skill` tool based on semantic matching between the user's message and skill descriptions.

### Detection

To verify a skill triggered in Claude Code, check the execution log for `Skill` tool calls:

```bash
# In JSON output mode, look for:
{"type": "tool_use", "name": "Skill", "input": {"skill": "your-skill-name"}}
```

### Permission Model

Claude Code uses `CLAUDE.md` (or `AGENTS.md` in universal terminology) for project-level instructions. Skills listed there are pre-approved. Skills outside the list may still be discovered via filesystem scanning.

---

## Codex Activation Patterns

Codex follows the Agent Skills specification closely:

- **Project-local:** `.agents/skills/<name>/SKILL.md`
- **Global:** `~/.agents/skills/<name>/SKILL.md`

### Activation Mechanism

Codex scans for skills at session initialization. Descriptions are indexed and matched against user messages using semantic similarity.

### Key Difference

Codex may have stricter sandboxing. Skills that rely on filesystem access outside the project directory may not work. Keep skills self-contained or document filesystem requirements in the `metadata` field.

---

## Cursor Activation Patterns

Cursor integrates skills through its rules system:

- **Project-local:** `.cursor/skills/<name>/SKILL.md`
- **Global:** `~/.cursor/skills/<name>/SKILL.md`

### Activation Mechanism

Cursor loads skill descriptions as part of its system prompt construction. The matching is keyword-based rather than purely semantic — include specific trigger keywords in your description.

### Key Difference

Cursor may require skills to be explicitly referenced in `.cursorrules` for reliable activation. If a skill is not triggering, add it to the rules file:

```
Available skills:
- skill-name: description here
```

---

## Testing Skill Triggers

### Manual Testing

1. Install the skill in the platform's recognized location
2. Start a fresh session (no prior context)
3. Send a message that should trigger the skill
4. Observe whether the Agent loads the skill's `SKILL.md`

### Automated Testing

Use a trigger query script to test descriptions systematically. See [11-description-optimization.md](11-description-optimization.md) for the full methodology.

Basic structure:

```bash
#!/bin/bash
# Test whether a skill triggers for a set of queries
QUERIES_FILE="trigger-queries.json"
SKILL_NAME="my-skill"

for query in $(jq -r '.[].query' "$QUERIES_FILE"); do
  # Run the agent and check if the skill was loaded
  # Platform-specific detection logic here
  echo "$query → triggered/not-triggered"
done
```

### Trigger Rate Calculation

Run each query multiple times (3+ runs) and compute:

```
trigger_rate = (times_skill_triggered) / (total_runs)
```

- **Should-trigger queries** pass if `trigger_rate >= 0.5`
- **Should-not-trigger queries** pass if `trigger_rate < 0.5`

See `templates/trigger-queries.json` for the query format.

---

## Cross-Platform Compatibility Considerations

### What Works Everywhere

| Feature | Universal? | Notes |
|---------|-----------|-------|
| `name` + `description` frontmatter | Yes | Core spec |
| `references/` directory | Yes | All platforms load on-demand |
| `scripts/` directory | Yes | But execution varies |
| Relative file paths | Yes | From skill root |
| Markdown body content | Yes | Standard format |

### What Varies by Platform

| Feature | OpenCode | Claude Code | Codex | Cursor |
|---------|----------|-------------|-------|--------|
| Discovery paths | 6 locations | 2 locations | 2 locations | 2 locations |
| Permission model | JSON config | AGENTS.md | Sandbox rules | .cursorrules |
| Skill tool | Native `skill` | `Skill` tool | Built-in scan | Rules-based |
| Script execution | Full shell | Full shell | Sandboxed | Full shell |
| `allowed-tools` | Partial | Yes | Varies | Varies |
| `compatibility` field | Recognized | Ignored | Ignored | Ignored |

### Writing Platform-Agnostic Skills

1. **Use only `name` and `description` in frontmatter** — these are universally recognized
2. **Avoid platform-specific commands** in `SKILL.md` body — use generic descriptions
3. **Document prerequisites** — state what the Agent needs (git, Node.js, etc.)
4. **Use relative paths** — never absolute paths in skill content
5. **Test on multiple platforms** — at minimum, test on OpenCode and one other

---

## Discovery Optimization

### Naming for Discovery

- Use descriptive, searchable names: `csv-analyzer` not `data-tool`
- Match the directory name exactly to the `name` field
- Avoid abbreviations that may not match user queries

### Description Keywords

Include these elements in every description:

1. **Action verbs** — what the skill does (`analyze`, `create`, `validate`)
2. **Domain terms** — what it works with (`CSV`, `PDF`, `git`, `API`)
3. **Trigger phrases** — when to use it (`Use when...`, `Triggers:...`)
4. **User intent** — what the user is trying to achieve

### Example: Good vs Bad

```yaml
# Bad — too vague, no keywords
description: Helps with data.

# Good — specific, keyword-rich, trigger-focused
description: >
  Analyze CSV and tabular data files — compute summary statistics,
  add derived columns, generate charts, and clean messy data.
  Use when the user has a CSV, TSV, or Excel file and wants to
  explore, transform, or visualize the data, even if they don't
  explicitly mention "CSV" or "analysis."
```

### Metadata for Discovery

Use the `metadata` field for structured discovery:

```yaml
metadata:
  category: data-analysis
  pattern: P2
  stacking: "1"
```

Agents can grep/glob metadata for stacking and pairing across skill packages.

---

## Troubleshooting Activation

### Skill Not Showing Up

| Check | Command |
|-------|---------|
| File exists | `ls -la .agents/skills/<name>/SKILL.md` |
| Frontmatter valid | `head -5 .agents/skills/<name>/SKILL.md` |
| Name matches directory | `grep "^name:" .agents/skills/<name>/SKILL.md` |
| Description present | `grep "^description:" .agents/skills/<name>/SKILL.md` |
| No duplicate names | `find . -name SKILL.md -exec grep "^name:" {} \;` |

### Skill Shows But Does Not Trigger

1. **Description too vague** — add specific trigger conditions and keywords
2. **Permission denied** — check platform permission config
3. **Semantic mismatch** — the description does not match how users phrase requests
4. **Stack limit reached** — too many skills already loaded

### Skill Triggers When It Should Not

1. **Description too broad** — narrow the scope with specific conditions
2. **Keyword collision** — remove generic terms that match unrelated tasks
3. **Missing boundary** — add what the skill does NOT do

---

## References

- [01-skill-anatomy.md](01-skill-anatomy.md) — Directory structure and naming rules
- [02-frontmatter-standard.md](02-frontmatter-standard.md) — Frontmatter schema
- [11-description-optimization.md](11-description-optimization.md) — Description optimization loop
- OpenCode skills docs — `opencode-skills.md` in platform references
- Agent Skills spec — https://agentskills.io/specification
