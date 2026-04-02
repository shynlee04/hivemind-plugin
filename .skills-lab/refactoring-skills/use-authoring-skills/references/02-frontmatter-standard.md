# Frontmatter Standard

## Purpose

YAML frontmatter schema for Agent Skills. Defines the six fields recognized by the official specification at [agentskills.io/specification](https://agentskills.io/specification).

---

## Field Reference

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | **Yes** | Max 64 chars. Lowercase `a-z`, digits, and hyphens only. No leading, trailing, or consecutive hyphens. Must match the parent directory name. |
| `description` | **Yes** | Max 1024 chars. Non-empty. Describe what the skill does and when to use it. Include keywords for activation matching. |
| `license` | No | License name or reference to a bundled license file. Keep short. |
| `metadata` | No | Arbitrary string-to-string key-value mapping. Use unique key names to avoid conflicts. Agents grep/glob metadata for discovery, stacking, and pairing across skill packages. |
| `allowed-tools` | No | Space-delimited list of pre-approved tools. **Experimental** — support varies across agent implementations. |

---

## Required Fields

> **Rule: `name` and `description` are the only required fields.** All other frontmatter fields are optional per the specification.

### `name`

- 1–64 characters
- Lowercase alphanumeric (`a-z`, `0-9`) and hyphens (`-`) only
- Must not start or end with a hyphen
- Must not contain consecutive hyphens (`--`)
- Must match the skill's parent directory name

```yaml
name: context-intelligence
name: delegation-scope
name: git-atomic-memory
```

See [01-skill-anatomy.md](01-skill-anatomy.md) for naming conventions and directory structure rules.

### `description`

- 1–1024 characters
- Describe **what** the skill does and **when** to use it
- Include specific keywords that help agents identify relevant tasks
- Start with "Use when..." to provide activation context

```yaml
description: Use when encoding commit intent as semantic memory, retrieving past decisions from git history, or resuming work after context loss. Triggers: "what did we decide", "why was this changed", "resume from commits", "git memory".
```

**Description checklist:**
- Start with "Use when..." or equivalent activation context
- Include specific trigger conditions
- Describe the effect clearly
- Add constraints if any
- Include trigger keywords for discovery

---

## Optional Fields

### `license`

Specify the skill's license. Keep it short — either a license name or a reference to a bundled file.

```yaml
license: MIT
license: Apache-2.0
license: SEE LICENSE IN LICENSE.md
```

### `metadata`

Arbitrary key-value pairs for additional properties. Both keys and values must be strings. Use unique key names to prevent accidental conflicts across skills.

```yaml
metadata:
  author: agent-team
  category: context-governance
  pattern: P1
  stacking: "1"
```

### `allowed-tools`

Space-delimited list of tools the skill may invoke without prompting. Experimental — agent implementations may not support this field.

```yaml
allowed-tools: Bash Read Write
allowed-tools: fetch_fetch github_search
```

---

## Cross-Platform Notes

Frontmatter fields help agents discover and pair skills through grep/glob-friendly text:

- **`name`** — agents match the skill directory name during discovery (`glob **/SKILL.md`)
- **`description`** — agents grep descriptions for keyword matching when deciding which skill to activate
- **`metadata`** — tooling and orchestration layers read structured key-value data without parsing the full body

All fields are grep-friendly plain text. Avoid binary data, multi-line YAML blocks, or nested structures in `metadata` values.

---

## Correct Examples

### Minimal (required fields only)

```yaml
---
name: context-intelligence
description: Use when starting a session, resuming after interruption, or detecting context drift. Provides context rot defense and trust scoring. Triggers: "help me", "continue", "start working", "what did we do".
---
```

### With optional fields

```yaml
---
name: git-atomic-memory
description: Use when encoding commit intent as semantic memory, retrieving past decisions from git history, or resuming work after context loss. Triggers: "what did we decide", "why was this changed", "resume from commits".
license: MIT
compatibility: Requires git CLI and Node.js >=20.
metadata:
  category: developer-tools
  pattern: P2
allowed-tools: Bash Read
---
```

### With license reference

```yaml
---
name: use-agent-skill-authoring
description: Use when creating, auditing, refactoring, or packaging skills. Activates the meta-builder for skill authoring, TDD workflows, and quality validation. Triggers: "write a skill", "create a new skill", "audit this skill".
license: SEE LICENSE IN LICENSE.md
---
```

---

## Anti-Patterns

### Wrong: Invalid name format

```yaml
name: ContextIntelligence    # WRONG — uppercase
name: context_intelligence   # WRONG — underscores
name: context--memory        # WRONG — consecutive hyphens
-name: leading-hyphen-       # WRONG — leading/trailing hyphens
```

### Wrong: Vague description

```yaml
description: Manages context       # WRONG — no activation context, no keywords
description: Use always            # WRONG — not specific
```

### Wrong: Overly long description

```yaml
description: Use when... [>1024 characters of text]  # WRONG — exceeds 1024 char limit
```

---

## Validation Checklist

- [ ] `name` present, kebab-case, max 64 chars, matches directory name
- [ ] `description` present, starts with "Use when...", max 1024 chars, includes keywords
- [ ] `license` is a short name or file reference (if present)
- [ ] `compatibility` is max 500 chars and describes real requirements (if present)
- [ ] `metadata` values are all strings with unique keys (if present)
- [ ] `allowed-tools` is space-delimited (if present)
- [ ] No fields beyond the six defined above
