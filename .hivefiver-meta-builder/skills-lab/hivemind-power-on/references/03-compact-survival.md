# Reference 03: Compact Survival

> **Jump targets:** [ref-03 §1]–[ref-03 §4]

## §1 — Compact/Purge Survival Protocol

When context is compacted (OpenCode auto-compacts at 70%) or purged, follow this protocol to survive context loss.

```
1. Export current session BEFORE compaction hits:
   session-tracker(action: "export-session", sessionId: "<current>")

2. Read project-continuity.json → find current session metadata

3. Read session-continuity.json → map active delegation tree

4. From exported .md, grep "## USER (turn" for most recent user request

5. Reconstruct from disk:
   - Last user intent → from ## USER turn in .md
   - Active delegations → from session-continuity.json hierarchy.children
   - task_ids → from child session IDs
   - Agent types → from delegatedBy field

6. Present reconstruction to user before proceeding:
   "Recovered from compaction. Last request: [intent]. Resume?"
```

### State Reconstruction Checklist

After compaction, reconstruct:
- [ ] Current session ID
- [ ] Active delegation tree (all children with status="active")
- [ ] Deepest incomplete delegation (highest depth with status="active")
- [ ] Most recent user intent
- [ ] Current phase/goal (from session .md frontmatter or ## USER turn)
- [ ] Loaded skills (from session .md ## SKILL blocks)

## §2 — Context Optimization Rules

Agents load this skill at session start — every word costs context. Follow these rules religiously.

### Reading Strategy

| Situation | Tool | Example |
|-----------|------|---------|
| Find active sessions | read (small JSON) | `read(".hivemind/session-tracker/project-continuity.json")` |
| Find aborted delegations | read (small JSON) | `read(".hivemind/.../session-continuity.json")` |
| Find last user turn | grep + offset | `grep(pattern: "## USER \\(turn", include: "*.md")` |
| Read .md turn content | read with offset | `read(filePath, offset=200, limit=40)` |
| Classify large prompts | prompt-skim | `prompt-skim(content: "<prompt>", workspaceRoot: "<root>")` |

### NEVER

- Read full AGENTS.md files — use frontmatter via `read(limit=30)`
- Read full .md session files — use grep + offset (NEVER read all 7000 lines)
- Load >3 skills at once — cascade: router → primary domain skill → tool skill
- Read the same file twice within the same conversation turn
- Inline large files into subagent prompts — direct agents to read files from disk

### Line-Aware Reading: grep → offset → limit

```
1. grep to find the line number of the content you need
2. read with offset=<lineNumber> and limit=<window> to get just that section
3. Never read the entire file

Example:
  grep(pattern: "## USER \\(turn", path: ".hivemind/session-tracker/ses_xxx/")
  → Returns line 450
  → read(filePath, offset=450, limit=60)
```

## §3 — Efficient Reading Patterns Quick Reference

| Goal | Command |
|------|---------|
| Find last user turn in .md | `grep(pattern: "## USER \\(turn", include: "*.md")` |
| Read last turn content | `read(filePath, offset=<lastUserLine>, limit=60)` |
| Find task dispatches | `grep(pattern: "## TOOL: task", include: "*.md")` |
| Find specific session child | `read(".hivemind/session-tracker/<id>/session-continuity.json")` |
| Search across all sessions | `session-tracker(action: "search-sessions", query: "<agent_type>")` |
| Read project index | `read(".hivemind/session-tracker/project-continuity.json")` |

### Anti-Pattern: Reading Full .md Files

**NEVER:** `read(".hivemind/session-tracker/ses_xxx/ses_xxx.md")` (could be 7000+ lines)

**ALWAYS:** Use grep to find the line number, then read with offset and limit.

## §4 — At 70% Context Protocol

When context budget is getting heavy (OpenCode warns at 70%):

```
1. Export session: session-tracker(action: "export-session", sessionId: current)
2. Checkpoint: write current state to disk
3. Continue with compacted context from session-tracker output
4. Announce: "Context budget heavy. Checkpointed. Continuing from compacted state."
```

### Context Budget Awareness Rules

| Tool | Why |
|------|-----|
| `prompt-skim` | Fast scan: count words/lines/tokens, extract URLs, compute complexity — before deep reading |
| `grep` + `read(offset, limit)` | Avoid full file reads. Find exact line → read window |
| `session-tracker` export | Get session .md without reading the full file inline |
| `hivemind-doc` skim | Markdown skim without loading full content |
