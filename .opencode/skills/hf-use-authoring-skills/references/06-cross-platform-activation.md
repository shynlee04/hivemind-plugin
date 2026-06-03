# Cross-Platform Activation

## How Skill Triggering Works

All platforms follow the same progressive disclosure pattern:

1. **Discovery** — Platform scans filesystem for `SKILL.md` files
2. **Indexing** — Platform reads only `name` and `description` from frontmatter
3. **Matching** — Agent compares user message against indexed descriptions
4. **Activation** — If matched, platform loads full `SKILL.md` body
5. **Execution** — Agent follows the instructions

The description carries the **entire burden of triggering**.

## Platform Discovery Paths

| Platform | Project-Local Path | Global Path |
|----------|-------------------|-------------|
| **OpenCode** | `.opencode/skills/<name>/SKILL.md` | `~/.config/opencode/skills/<name>/SKILL.md` |
| **OpenCode** (compat) | `.claude/skills/<name>/SKILL.md` | `~/.claude/skills/<name>/SKILL.md` |
| **OpenCode** (compat) | `.agents/skills/<name>/SKILL.md` | `~/.agents/skills/<name>/SKILL.md` |
| **Claude Code** | `.claude/skills/<name>/SKILL.md` | `~/.claude/skills/<name>/SKILL.md` |
| **Codex** | `.agents/skills/<name>/SKILL.md` | `~/.agents/skills/<name>/SKILL.md` |
| **Cursor** | `.cursor/skills/<name>/SKILL.md` | `~/.cursor/skills/<name>/SKILL.md` |

**Recommendation:** Place skills in `.agents/skills/<name>/SKILL.md` for maximum cross-platform compatibility.

## OpenCode Activation

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

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "internal-*": "ask",
      "experimental-*": "ask"
    }
  }
}
```

| Permission | Behavior |
|------------|----------|
| `allow` | Skill loads immediately |
| `ask` | Skill hidden from Agent |
| `ask` | User prompted before loading |

### Troubleshooting OpenCode

If a skill does not show up:
1. Verify `SKILL.md` is spelled in all caps
2. Check frontmatter includes `name` and `description`
3. Ensure skill names are unique across all locations
4. Check permissions — skills with `ask` are hidden

## Claude Code Activation

- Loads skill descriptions at session start
- Agent decides whether to invoke the `Skill` tool based on semantic matching
- Detection: check execution log for `Skill` tool calls

## Codex Activation

- Scans for skills at session initialization
- Semantic similarity matching
- May have stricter sandboxing — keep skills self-contained

## Cursor Activation

- Loads skill descriptions as part of system prompt construction
- Keyword-based matching (not purely semantic)
- May require skills to be explicitly referenced in `.cursorrules`

## What Works Everywhere

| Feature | Universal? | Notes |
|---------|-----------|-------|
| `name` + `description` frontmatter | Yes | Core spec |
| `references/` directory | Yes | All platforms load on-demand |
| `scripts/` directory | Yes | Execution varies |
| Relative file paths | Yes | From skill root |
| Markdown body content | Yes | Standard format |

## What Varies by Platform

| Feature | OpenCode | Claude Code | Codex | Cursor |
|---------|----------|-------------|-------|--------|
| Discovery paths | 6 locations | 2 locations | 2 locations | 2 locations |
| Permission model | JSON config | AGENTS.md | Sandbox rules | .cursorrules |
| Skill tool | Native `skill` | `Skill` tool | Built-in scan | Rules-based |
| Script execution | Full shell | Full shell | Sandboxed | Full shell |
| `allowed-tools` | Partial | Yes | Varies | Varies |

## Writing Platform-Agnostic Skills

1. **Use only `name` and `description` in frontmatter** — universally recognized
2. **Avoid platform-specific commands** in SKILL.md body
3. **Document prerequisites** — state what the Agent needs
4. **Use relative paths** — never absolute paths
5. **Test on multiple platforms** — at minimum OpenCode and one other
