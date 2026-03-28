# Session Inspection Export

- ses_id: `ses_2da8ecddbffeG7n11jeQXlfR7v`
- prepared_at: `2026-03-25T14:43:17.656Z`

## Assistant Output

## Codebase Investigation Report

**Scope:** Skill injection mechanism — how skill names/instructions are conditionally injected into agent prompts
**Question:** What hooks fire, what they do, how skills are picked, whether referenced skill names exist

---

### Findings

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | **Plugin registers `messages.transform` hook** | `src/plugin/opencode-plugin.ts` | 222 | `'experimental.chat.messages.transform': messagesTransform` |
| 2 | **Plugin registers `system.transform` hook** | `src/plugin/opencode-plugin.ts` | 75-76 | `'experimental.chat.system.transform': async (input, output) => { await transformHandler(input, output) }` |
| 3 | **`system.transform` handler is a thin stub** — only captures payload for journal, no skill injection | `src/hooks/transform-handler.ts` | 23-45 | Creates empty `skillBundle: []`, `skillFocusBlock: ''`, stores via `setInjectionPayload` |
| 4 | **`messages.transform` handler is the real injection engine** | `src/plugin/messages-transform-adapter.ts` | 41-178 | `createMessagesTransformHandler()` — resolves skills, renders blocks, prepends synthetic parts |
| 5 | **Skills are resolved by hardcoded exposure map, NOT by scanning `skills/` directory** | `src/plugin/skill-exposure-map.ts` | 38-94 | `AGENT_BUNDLES` is a static `Record<string, SkillEntry[]>` keyed by agent ID |
| 6 | **MAX_SKILLS = 7** (not 3) | `src/plugin/skill-exposure-map.ts` | 30 | `const MAX_SKILLS = 7` |
| 7 | **4-layer skill resolution** | `src/plugin/skill-exposure-map.ts` | 137-187 | (1) SHARED_SKILLS → (2) agent bundle → (3) purpose-conditional → (4) sub-session additions |
| 8 | **Skills rendered as `<available_skills>` XML block** | `src/plugin/skill-focus-renderer.ts` | 36-52 | `skill_1="name"`, `skill_2="name"`, ..., plus session role directive |
| 9 | **Synthetic parts prepended BEFORE user message parts** | `src/plugin/messages-transform-adapter.ts` | 170 | `lastUserMessage.parts = [...injectedParts, ...(lastUserMessage.parts ?? [])]` |
| 10 | **Injection only fires on `variant === 'new'` or `'continue'`** — skips tool results and thinking turns | `src/plugin/messages-transform-adapter.ts` | 57 | `lastMsg.info.variant !== 'new' && lastMsg.info.variant !== 'continue'` |
| 11 | **Separate `opencode-skill-registry.ts` exists but is NOT wired to injection** | `src/shared/opencode-skill-registry.ts` | 87-136 | Scans `skills/skills/*/SKILL.md` — used by tools, not by the transform pipeline |
| 12 | **Injection store bridges `messages.transform` → `text.complete`** for diagnostic logging | `src/plugin/injection-store.ts` | 27-35 | `setInjectionPayload` on inject, `getAndClearInjectionPayload` on `text.complete` |

---

### The Injection Mechanism (Full Chain)

#### 1. Hook Registration
**File:** `src/plugin/opencode-plugin.ts` (line 222)

The plugin registers a handler for `experimental.chat.messages.transform`. This is the OpenCode SDK hook that fires before each turn's messages are sent to the LLM.

#### 2. Adapter Handler
**File:** `src/plugin/messages-transform-adapter.ts` (lines 41-178)

`createMessagesTransformHandler(deps)` returns an async function that:

1. **Finds the last user message** (`findLastUserMessage` from `synthetic-parts.ts:35`)
2. **Guards on variant** — only `new` or `continue` (line 57). Skips tool results and thinking.
3. **Resolves startWork** — determines purpose class, risk level, recommended command (lines 71-77)
4. **Resolves skill bundle** via `resolveSkillBundle(activeAgent, purposeClass, sessionState)` (line 119)
5. **Resolves session role** via `resolveSessionRole(sessionState, activeAgent)` (line 124)
6. **Renders three blocks:**
   - `turnHierarchyPacket` — turn depth, trajectory path
   - `packet` — HiveMind context (session identity, governance, TDD state, etc.)
   - `skillFocusPacket` — the `<available_skills>` block (line 133)
7. **Creates synthetic parts** — these are `Part` objects with `synthetic: true` and `ui_hidden: true` (line 136-143)
8. **Prepends** injected parts before user's own parts (line 170)
9. **Optionally appends** route hint after user parts (lines 172-177)
10. **Stores injection payload** for diagnostic log (lines 155-168)

#### 3. Skill Selection Logic
**File:** `src/plugin/skill-exposure-map.ts` (lines 137-187)

`resolveSkillBundle(activeAgent, purposeClass, sessionState)` — **4-layer waterfall**:

1. **SHARED_SKILLS** (always-on): `use-hivemind-delegation` (line 22-27)
2. **Agent bundle** from `AGENT_BUNDLES[agentId]` (lines 38-94). Falls back to `hivefiver` for unknown agents (line 156)
3. **Purpose-conditional** from `PURPOSE_CONDITIONAL[purposeClass]` (lines 97-122). Keys: `tdd`, `research`, `planning`, `implementation`, `course-correction`, `gatekeeping`
4. **Sub-session additions** if `sessionState === 'sub-session'` (lines 178-185): `git-continuity-memory`

Deduplication via `seen` set. Cap at `MAX_SKILLS = 7`.

#### 4. Skill Rendering
**File:** `src/plugin/skill-focus-renderer.ts` (lines 32-52)

Output format:
```xml
<available_skills>
skill_1="use-hivemind-delegation"
skill_2="hivemind-gatekeeping-delegation"
skill_3="git-continuity-memory"
REMINDER: The skills above are available for this turn. Use the skill tool to load any of them when your task matches their purpose.

You are coordinating the session. Break work into focused tasks...
</available_skills>
```

#### 5. Synthetic Part Creation
**File:** `src/plugin/synthetic-parts.ts` (lines 12-26)

Parts have `id: prt_hm_...`, `type: 'text'`, `synthetic: true`, and metadata `{ opencode: { ui_hidden: true } }` — so they're injected into the message context but hidden from the UI.

---

### Skill Names: Existence Verification

Checked all 21 skill names referenced in `skill-exposure-map.ts` against `skills/skills/*/SKILL.md`:

| Skill Name | EXISTS in `skills/skills/`? |
|---|---|
| `use-hivemind-delegation` | **YES** |
| `hivemind-gatekeeping-delegation` | **YES** |
| `git-continuity-memory` | **YES** |
| `hivemind-atomic-commit` | **YES** |
| `tdd-delegation` | **YES** |
| `hivemind-codemap` | **YES** |
| `hivemind-research` | **YES** |
| `spec-distillation` | **YES** |
| `research-delegation` | **YES** |
| `course-correction-delegation` | **YES** |
| `hivemind-system-debug` | **YES** |
| `verification-before-completion` | **MISSING** |
| `test-driven-development` | **MISSING** |
| `clean-code` | **MISSING** |
| `refactor` | **MISSING** |
| `writing-plans` | **MISSING** |
| `breakdown-plan` | **MISSING** |
| `deep-research` | **MISSING** |
| `systematic-debugging` | **MISSING** |
| `qa-test-planner` | **MISSING** |
| `context-map` | **MISSING** |

**11 of 21 hardcoded skill names have no `SKILL.md` file.** These names are injected into prompts as available skills, but if an agent tries to load them via the skill tool, they won't be found.

---

### Is the Injection Working or Broken?

**The injection pipeline IS functional** — the `messages.transform` hook fires, resolves skills, renders the `<available_skills>` block, and prepends synthetic parts. The full chain from `opencode-plugin.ts:222` → `messages-transform-adapter.ts:41` → `skill-exposure-map.ts:137` → `skill-focus-renderer.ts:32` → `synthetic-parts.ts:12` → `injection-store.ts:27` → `text.complete` diagnostic log is wired end-to-end.

**However, there are two separate, disconnected skill systems:**

| System | File | Purpose | Wired to injection? |
|---|---|---|---|
| **Hardcoded exposure map** | `src/plugin/skill-exposure-map.ts` | Static `AGENT_BUNDLES` — injects skill names into prompts | **YES** — this IS the injection source |
| **File-system skill registry** | `src/shared/opencode-skill-registry.ts` | Scans `skills/skills/*/SKILL.md` — discovers actual skill files | **NO** — not connected to the transform pipeline |

The injection system tells the LLM "these skills are available" but uses a hardcoded list that includes 11 names with no backing files. The file-system registry that knows about real skills is not consulted during injection.

---

### Structure Map

```
src/plugin/
├── opencode-plugin.ts              ← Plugin assembly, registers hooks
├── messages-transform-adapter.ts   ← THE injection engine (messages.transform handler)
├── skill-exposure-map.ts           ← Hardcoded skill bundles per agent (AGENT_BUNDLES)
├── skill-focus-renderer.ts         ← Renders <available_skills> XML block
├── injection-store.ts              ← Bridges injection → diagnostic logging
├── synthetic-parts.ts              ← Creates hidden synthetic Part objects
├── system-transform.ts             ← Thin wrapper around runtime-prompt (NOT the skill injector)
├── messages-transform.ts           ← Thin wrapper around runtime-prompt (NOT the skill injector)
├── runtime-prompt.ts               ← Delegates to context/prompt-packet compiler
├── context-renderer.ts             ← HiveMind context packet assembly
└── route-hint.ts                   ← Route reminder block

src/hooks/
└── transform-handler.ts            ← system.transform handler (journal capture only, no skills)

src/shared/
└── opencode-skill-registry.ts      ← File-system SKILL.md discovery (NOT wired to injection)

skills/skills/                      ← 19 SKILL.md files (actual skill definitions)
skills/_deprecated_hive/            ← 31 deprecated skill directories
```