# Session Inspection Export

- ses_id: `ses_2e5ff5f21ffefZfdrXXbiBtpIU`
- prepared_at: `2026-03-23T09:24:24.742Z`

## Assistant Output

## Answer

**Yes, there IS a message injection hook — but it's called `experimental.chat.messages.transform`, NOT `message.injection`.**

### Hook Details

**File:** `src/plugin/messages-transform-adapter.ts`  
**Hook name:** `experimental.chat.messages.transform`

### What It Does

This hook injects skills **before every user message** by:

1. Resolving a skill bundle via `resolveSkillBundle(activeAgent, purposeClass, sessionState)` — returns ~6-7 skills per agent
2. Resolving session role (`orchestrate`, `specialist`, or `standalone`)
3. Rendering a skill focus block via `renderSkillFocusBlock()`
4. Prepending injected parts **before the user's message parts** (line 153):
   ```typescript
   lastUserMessage.parts = [...injectedParts, ...(lastUserMessage.parts ?? [])]
   ```

### Skills Injected for YOUR Current Session

You are running as **`hiveminder`** (lineage=`hivefiver`), so the injected skills are:

| Skill | Purpose |
|-------|---------|
| `use-hivemind-delegation` | Delegation packet structure, routing rules, return contracts |
| `hivemind-gatekeeping-delegation` | Synthesis gates, carry-forward, loop control |
| `git-continuity-memory` | Git-based context recovery and session continuity |
| `hivemind-atomic-commit` | Typed commit discipline with rollback planning |

### Injected Block Format

You can see these at the **top of every `<available_skills>` block** in this conversation — the reminder text:
> *"The skills above are available for this turn. Use the skill tool to load any of them when your task matches their purpose."*

### Other Related Hooks

| Hook | File | Purpose |
|------|------|---------|
| `session.compacting` | `src/plugin/compaction-adapter.ts` | Context before compaction |
| `command.execute.before` | `src/plugin/opencode-plugin.ts:117-157` | Pre-command context injection |
| `chat.message` | `src/plugin/opencode-plugin.ts` | Resets turn snapshot, shows degraded-mode warning |