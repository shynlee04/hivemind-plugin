# Frontmatter Standard

## agentskills.io Specification Compliance

The Agent Skills specification (https://agentskills.io/specification) recognizes these fields:

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | **Yes** | 1-64 chars. Lowercase alphanumeric + hyphens. No leading/trailing/consecutive hyphens. Must match directory name. |
| `description` | **Yes** | 1-1024 chars. Non-empty. Should describe what the skill does AND when to use it. |
| `license` | No | License name or reference to bundled license file. |
| `compatibility` | No | 1-500 chars. Environment requirements. Most skills do NOT need this. |
| `metadata` | No | Arbitrary key-value mapping (string → string). Use unique key names. |
| `allowed-tools` | No | Space-delimited list of pre-approved tools. Experimental. |

## Required Fields — Deep Dive

### `name`

```yaml
# Valid
name: deep-research-synthesis
name: use-authoring-skills
name: pdf-processing

# Invalid
name: PDF-Processing      # uppercase not allowed
name: -pdf                # cannot start with hyphen
name: pdf--processing     # consecutive hyphens not allowed
name: this_name           # underscores not allowed
```

### `description`

The description is the **activation surface** — it determines when the agent selects this skill.

```yaml
# Good — specific, includes trigger keywords, describes what + when
description: Extracts text and tables from PDF files, fills PDF forms, and merges multiple PDFs. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction.

# Good — skill authoring example
description: Create, audit, refactor, and doctor agent skills. Use when the user wants to create a skill, improve an existing skill, audit skill quality, convert a document to a skill, or fix skill triggers.

# Poor — too vague
description: Helps with PDFs.
description: A skill for skills.
```

**Description formula:** `[What it does]. Use when [specific trigger conditions].`

## Optional Fields

### `metadata`

Use for additional structured data. Keys should be unique to avoid conflicts.

```yaml
metadata:
  author: hivemind-plugin
  version: "2.0.0"
  pattern: "P2-hybrid"
  rebuild-date: "2026-04-03"
```

### `allowed-tools`

Space-delimited list of tools the skill may use. Support varies by platform.

```yaml
allowed-tools: Read Write Edit Bash Glob Grep
```

### `compatibility`

Only include if the skill has specific environment requirements. Most skills should omit this.

```yaml
# Only when truly needed
compatibility: Requires git CLI and Node.js >=20
compatibility: Requires Python 3.14+ and uv
```

## Complete Example

```yaml
---
name: deep-research-synthesis
description: Synthesizes Repomix-packed codebase analysis into structured research reports with citations. Use when the user asks to analyze a codebase deeply, create research reports from Repomix output, or synthesize findings from multiple code sources.
license: MIT
metadata:
  author: hivemind-plugin
  version: "1.0.0"
  pattern: "P2"
allowed-tools: Read Write Edit Bash Glob Grep
---
```

## Validation Checklist

Before declaring frontmatter complete:

- [ ] `name` is 1-64 characters
- [ ] `name` matches the directory name
- [ ] `name` uses only lowercase alphanumeric + single hyphens
- [ ] `description` is 1-1024 characters
- [ ] `description` includes "Use when..." or equivalent trigger phrase
- [ ] `description` contains specific trigger keywords
- [ ] No unknown fields (they will be ignored by the platform)
- [ ] YAML is valid (no tab characters, proper indentation)

## OpenCode-Specific Notes

OpenCode loads skills from these locations (in discovery order):
- `.opencode/skills/<name>/SKILL.md` (project)
- `~/.config/opencode/skills/<name>/SKILL.md` (global)
- `.claude/skills/<name>/SKILL.md` (project, Claude-compatible)
- `~/.claude/skills/<name>/SKILL.md` (global, Claude-compatible)
- `.agents/skills/<name>/SKILL.md` (project, agent-compatible)
- `~/.agents/skills/<name>/SKILL.md` (global, agent-compatible)

Unknown frontmatter fields are silently ignored. Only `name` and `description` are required.
