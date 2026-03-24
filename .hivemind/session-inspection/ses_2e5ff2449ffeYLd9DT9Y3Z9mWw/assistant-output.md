# Session Inspection Export

- ses_id: `ses_2e5ff2449ffeYLd9DT9Y3Z9mWw`
- prepared_at: `2026-03-23T09:24:08.461Z`

## Assistant Output

## Codebase Investigation Report

**Scope:** Search for `message.injection`/`messageInjection`, skill-suggesting hooks, and `.opencode/` config files
**Question:** Find files containing message injection patterns, hooks that recommend skills before messages, and skill suggestion mechanisms

---

### Findings

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | **No `message.injection` or `messageInjection` found** | — | — | Grep returned zero matches for these exact patterns |
| 2 | **Skill recommendation in `research-delegation`** | `.opencode/skills/research-delegation/SKILL.md` | 35 | `hivemind-research-framework` recommended as prerequisite |
| 3 | **Skill recommendation in `course-correction-delegation`** | `.opencode/skills/course-correction-delegation/SKILL.md` | 35 | `hivemind-system-debug`, `use-hivemind-detox-refactor`, `hivemind-codemap` recommended as prerequisites |
| 4 | **Skill injection hook — `messages.transform`** | `src/plugin/messages-transform-adapter.ts` | 1-170 | Primary hook that injects skills before user message |
| 5 | **Skill bundle resolver** | `src/plugin/skill-exposure-map.ts` | 137-188 | `resolveSkillBundle()` resolves 6-7 skills per agent per turn |
| 6 | **Skill focus block renderer** | `src/plugin/skill-focus-renderer.ts` | 32-53 | Renders `<available_skills>` block for injection |
| 7 | **Skills injected as `<available_skills>`** | `.opencode/agents/AGENTS.md` | 45, 58-63 | Skills injected as synthetic part before user message |

---

### Hook That Suggests/Recommends Skills Before Messages

**File:** `src/plugin/messages-transform-adapter.ts`
**Hook:** `experimental.chat.messages.transform`

**What it does (lines 121-154):**
1. Resolves skill bundle via `resolveSkillBundle(activeAgent, purposeClass, sessionState)` — returns 6-7 skills
2. Resolves session role via `resolveSessionRole()` — returns `orchestrate`, `specialist`, or `standalone`
3. Renders skill focus block via `renderSkillFocusBlock(skillBundle, sessionRole)`
4. Injects as synthetic part **before user message parts** at line 153:
   ```typescript
   lastUserMessage.parts = [...injectedParts, ...(lastUserMessage.parts ?? [])]
   ```

**Skills injected per agent (from `skill-exposure-map.ts`):**

| Agent | Skills Injected |
|-------|-----------------|
| hiveminder | `use-hivemind-delegation`, `hivemind-gatekeeping-delegation`, `git-continuity-memory`, `hivemind-atomic-commit` |
| hivefiver | `use-hivemind-delegation`, `hivemind-gatekeeping-delegation`, `git-continuity-memory`, `hivemind-atomic-commit` |
| hiveq | `use-hivemind-delegation`, `tdd-delegation`, `verification-before-completion`, `test-driven-development` |
| hivemaker | `use-hivemind-delegation`, `tdd-delegation`, `clean-code`, `refactor`, `test-driven-development` |
| hiveplanner | `use-hivemind-delegation`, `writing-plans`, `breakdown-plan`, `spec-distillation` |
| hivexplorer | `use-hivemind-delegation`, `research-delegation`, `context-map`, `hivemind-codemap`, `hivemind-research` |
| hiverd | `use-hivemind-delegation`, `research-delegation`, `deep-research`, `hivemind-research` |
| hivehealer | `use-hivemind-delegation`, `course-correction-delegation`, `systematic-debugging`, `hivemind-system-debug` |
| hitea | `use-hivemind-delegation`, `tdd-delegation`, `qa-test-planner`, `test-driven-development` |

**Skill injection format (from `skill-focus-renderer.ts` lines 36-52):**
```xml
<available_skills>
skill_1="use-hivemind-delegation"
skill_2="hivemind-gatekeeping-delegation"
...
REMINDER: The skills above are available for this turn. Use the skill tool to load any of them when your task matches their purpose.

[Session role directive: orchestrate/specialist/standalone]
</available_skills>
```

---

### Other Context Injection Hooks

| Hook | File | Purpose |
|------|------|---------|
| `session.compacting` | `src/plugin/compaction-adapter.ts` | Injects context before compaction |
| `command.execute.before` | `src/plugin/opencode-plugin.ts:117-157` | Pre-command context injection |
| `chat.message` | `src/plugin/opencode-plugin.ts` | Resets turn snapshot, shows degraded-mode warning |

---

### GSD Context Monitor Hook (Not Skill-Related)

**File:** `.opencode/hooks/gsd-context-monitor.js` (155 lines)
**Type:** Post-tool use hook for context warnings
**Purpose:** Injects context warnings (not skill suggestions) when context usage exceeds thresholds (35% warning, 25% critical)

---

### Skills Recommended in SKILL.md Prerequisites

**`research-delegation/SKILL.md` line 35:**
- `use-hivemind-delegation` — **MUST** be loaded first
- `hivemind-research-framework` — **recommended** for research methodology

**`course-correction-delegation/SKILL.md` line 35:**
- `use-hivemind-delegation` — **MUST** be loaded first
- `hivemind-system-debug`, `use-hivemind-detox-refactor`, `hivemind-codemap` — **recommended** for mechanics