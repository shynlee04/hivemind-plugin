# OpenCode Meta-Concepts Verified Research

**Document ID**: RES-2026-03-03-001
**Date**: 2026-03-03
**Status**: Verified
**Sources**: OpenCode Official Documentation, Community Resources

---

## Executive Summary

This research synthesis verifies OpenCode meta-concepts for the hivefiver meta-builder module implementation. All findings are sourced from external documentation with citations.

---

## 1. Agent Definition Best Practices

### Single Source of Truth
OpenCode supports **two** agent definition locations serving different purposes:
- `agents/*.md` (markdown files) = **Primary definition** - human-readable, version-controllable
- `opencode.json` = Runtime configuration for quick overrides

**Source**: [OpenCode Agents Documentation](https://opencode.ai/docs/agents/)

### YAML Frontmatter Schema (Verified)
```yaml
---
description: "[Required] What the agent does"
mode: "primary|subagent|all"
model: "provider/model-id"
tools:
  write: true
  edit: true
permission:
  edit: allow|deny|ask
---
```

**Recommendation**: Use markdown as source of truth, generate JSON snippets for distribution.

---

## 2. Hook Cascade Order

### Recommended Execution Order
1. `session-lifecycle` → Load essential context
2. `soft-governance` → Inject governance, detect intent  
3. `tool-gate` → Validate/gate tool operations
4. `messages-transform` → Transform message content
5. `event-handler` → Handle lifecycle events
6. `compaction` → Preserve critical context
7. `swarm-executor` → Coordinate multi-agent

### CQRS Enforcement
- Hooks are READ-ONLY (context injection only)
- Tools own WRITE operations
- Violations break session integrity

**Source**: [OpenCode Plugins](https://opencode.ai/docs/plugins/)

---

## 3. Auto-Mechanism Governance Recommendations

| Mechanism | Recommendation | Rationale |
|-----------|---------------|-----------|
| auto-realignment | User confirmation for significant shifts | Prevents unintended context drift |
| auto-commit | Require explicit consent via permission.ask | User control over code changes |
| auto-compact | Use `session.compacted` hook for context preservation | Critical context recovery |
| auto-session-split | Inherit critical anchors in new session | Session continuity |
| auto-anchors | Mark milestones for context recovery | Context integrity |

**Source**: [OpenCode Config](https://opencode.ai/docs/config/)

---

## 4. Progressive Disclosure Patterns

### 3-Layer Hierarchy
```
Level 0: Essential (always visible in agents/)
Level 1-2: On-demand loaded (skills/)
Level 3: Deep reference (references/)
```

### Skill Optimization
With many skills, use "SkillPointer" pattern - lightweight category pointers instead of full loading.

**Demonstrated Result**: 99.7% token reduction

**Source**: [Reddit: opencodeCLI](https://www.reddit.com/r/opencodeCLI/comments/1rfwlzk/)

---

## 5. Skill Definition Schema

```yaml
---
name: skill-name           # REQUIRED, must match directory
description: |-            # REQUIRED, 1-1024 chars
  [Capability]. Use for [use cases].
  Use proactively when [triggers].
license: MIT              # Optional
---

# Skill content
```

**Source**: [OpenCode Skills](https://opencode.ai/docs/skills/)

---

## Implementation Recommendations for hivefiver

1. **Agent Strategy**: Markdown as source → generate JSON snippets
2. **Hook Architecture**: Sequential execution, read-only, CQRS compliance
3. **Auto-mechanisms**: User consent for realignment/commit, preserve context at compaction
4. **Progressive Disclosure**: Minimize startup tokens, use pointer patterns

---

## Source Citations

| Topic | Source |
|-------|--------|
| Agent definitions | https://opencode.ai/docs/agents/ |
| Config format | https://opencode.ai/docs/config/ |
| Hook system | https://opencode.ai/docs/plugins/ |
| Skills spec | https://opencode.ai/docs/skills/ |
| Hook events | https://github.com/code-yeongyu/oh-my-opencode/blob/dev/docs/reference/features.md |
| Progressive disclosure | https://lobehub.com/skills/flpbalada-my-opencode-config-progressive-disclosure |
| Skill optimization | https://www.reddit.com/r/opencodeCLI/comments/1rfwlzk/ |

---

*Research completed: 2026-03-03*
*Verified by: hiverd research agent*
