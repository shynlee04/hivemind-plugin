# HiveMind Plan Consolidation - 2026-02-14

## Latest: PR #43 Merged
- Task Management instructions in agent behavior prompt
- [TASKS] section added to system prompt injection
- `regenerateManifests` function added
- Parent existence validation in map_context
- Simplified bootstrap text (~1100 → concise)

### PR #43 Code Review Findings
| Severity | Issue | Status |
|----------|-------|--------|
| Medium | Localization regression - Vietnamese translations removed in bootstrap | Not fixed |
| Low | LOCKED warning removed from bootstrap | Not fixed |
| Positive | findParentId now returns null instead of unsafe root fallback | Fixed |
| Positive | Manifest auto-regen via regenerateManifests | Fixed |

## Status Summary

### ✅ DONE (Evidence: CHANGELOG + Code)
| # | Item | Plan | Evidence |
|---|------|------|----------|
| 1 | 8 Critical Bug Fixes | Master P1 | CHANGELOG [Unreleased] |
| 2 | export_cycle syncs hierarchy | Strategic 1.2 | CHANGELOG |
| 3 | declare_intent template fix | Strategic 1.3 | CHANGELOG |
| 4 | First-run auto-bootstrap blocked | Strategic 1.8 | CHANGELOG |
| 5 | CLI --name field fix | Master P5 | .opencode/commands/*.md |
| 6 | README rewrite | Master P5 | CHANGELOG |
| 7 | Dashboard TUI | - | CHANGELOG 2.6.0 |
| 8 | PR3 Integration (10 tasks) | PR3 | All batches done |

### ⚠️ PARTIAL (Needs completion)
| # | Item | What works | What missing |
|---|------|-----------|--------------|
| 1 | Toast/Alert system | trackSectionUpdate wired | Still confusing for AI |
| 2 | compact_session | Clears report | Tool description unclear |
| 3 | Manifest system | manifest.ts exists | Auto-regen not done |

### ❌ NOT DONE (Priority order)
| # | Item | Status | Note |
|---|------|--------|------|
| **1** | **TODO/Task System** | ⚠️ PARTIAL | PR#43 added TASKS section + parent validation |
| **2** | **Prompt transformation** | ⚠️ PARTIAL | Actionable suggestions added (this session) |
| **3** | **.hivemind reorganization** | ❌ | |
| **4** | **Entry validation** | ❌ | |
| **5** | **Signal→Action mapping** | ❌ | |

---

## Priority Hierarchy

```
PRIORITY 1 (blocks everything):
├── 1. Task/TODO system → agent mindless
└── 2. Prompt transformation → confusing AI

PRIORITY 2 (productivity):
├── 3. .hivemind organization
├── 4. Entry validation
└── 5. Signal→Action

PRIORITY 3 (nice to have):
└── Integration tests
```

---

## Recent Fixes Applied (2026-02-14)

1. **Clean state → "READ FIRST" guidance** (`session-lifecycle.ts`)
   - New projects now injected with: scan, read plans, then declare_intent
   
2. **Actionable suggestions** (`detection.ts`)
   - Changed: `→ use map_context`
   - To: `→ reset drift tracking (use map_context)`

---

## OpenCode SDK Insights (Reference)

See: `docs/reference/opencode-sdk-mechanisms-2026-02-14.md`

Key mechanisms:
- `experimental.session.compacting` → inject context before compaction
- `tool.execute.after` → chain actions after tools
- `todowrite`/`todoread` → built-in TODO (use this!)
- TUI toasts → not decorative, can have actions

# OpenCode SDK - Key Mechanisms for Agent Control

## 1. Between-Turn Context Injection

| Mechanism | Hook | Purpose |
|-----------|------|---------|
| `insertReminders` | `session.prompt` | Injects synthetic parts into user messages each turn |
| `experimental.session.compacting` | Plugin hook | Customize context preserved across compaction |

**Key:** Context injected WITHOUT agent stop - goes directly to next turn prompt.

---

## 2. Session Tree (Parent-Child)

```
Sessions linked via parentID
- client.session.list() → all sessions
- client.session.children({ sessionID }) → direct children
- Full tree: build manually from list
```

---

## 3. Tool Execution Chaining

```ts
// Hook after tool runs → trigger follow-up
"tool.execute.after": async (input, output) => {
  if (input.tool === "write" && output.success) {
    await triggerValidation(output.args.filePath)
  }
}
```

---

## 4. TUI Toasts - NOT Decorative

- Can include actions (e.g., "Go to session")
- Triggered via: `client.tui.showToast()`
- Events: `tui.toast.show`

---

## 5. TODO Tasks

| Tool | Permission | Purpose |
|------|------------|---------|
| `todowrite` | Required | Create/update tasks |
| `todoread` | Required | Read task list |
| SDK: `session.todo()` | - | Get session tasks |

**Note:** Disabled for subagents by default.

---

## 6. Plugin Hooks for Sessions

| Hook | Fires On |
|------|----------|
| `session.created` | New session |
| `session.compacted` | After compaction |
| `session.updated` | Session change |
| `session.idle` | Session idle |
| `experimental.session.compacting` | Before compaction prompt |

---

## 7. Agent Modes

| Mode | Behavior |
|------|----------|
| `build` | Default agent, executes tools |
| `plan` | Disallows edit tools, only plan files |

Switching between modes injects prompts automatically.

---

## Key Takeaways for HiveMind

1. **Use `experimental.session.compacting`** to inject HiveMind context into compaction
2. **Use `tool.execute.after`** to chain actions (e.g., auto-export after task)
3. **Use `todowrite`/`todoread`** for task tracking (already exists in OpenCode!)
4. **TUI toasts** can show actionable items, not just notifications
5. **Session tree** can track parent-child session relationships

---

*Source: DeepWiki Q&A - anomalyco/opencode SDK analysis*
