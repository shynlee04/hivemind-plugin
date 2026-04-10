# Debug: delegate-task agent & category validation failures

**Date:** 2026-04-10
**Issue:** `[Harness]` errors when using `delegate-task` tool with custom agent names and categories

## Symptoms

From `improve-tools-coherence-evidence-failure.md` lines 1359+:

1. **Agent error**: `[Harness] Invalid target agent "build". Allowed agents: researcher, builder, critic, general.`
2. **Category error** (would surface after agent fix): `[Harness] Invalid category "wave1-c1-fix". Allowed categories: research, implementation, review, visual-engineering, deep, quick.`

Both errors appeared across 4 parallel `delegate-task` calls from the hivefiver-orchestrator.

## Root Causes

### Three independent failures compound:

#### 1. Agent name mismatch: `"build"` vs `"builder"`

The hivefiver-orchestrator passed `"agent": "build"` (a verb/noun shorthand) but the harness validates against `VALID_AGENTS` in `src/lib/types.ts:7`:

```typescript
export const VALID_AGENTS = ["researcher", "builder", "critic", "general"] as const
```

Validation happens in **two places** (redundant):
- `src/tools/delegate-task.ts:222-227` — `isValidAgent()` guard in `execute()`
- `src/lib/specialist-router.ts:61-62` — `normalizeAgent()` that also validates and throws

The agent check fires **before** category validation, so all 4 errors were agent errors. If the agent had been `"builder"`, the category error would have surfaced instead.

#### 2. Freeform category names rejected

The orchestrator invented ad-hoc categories (`wave1-c1-fix`, `wave1-c2-fix`, `wave1-c3c4-fix`, `wave1-phase1-dedup`) — descriptive task labels, not harness routing categories.

Valid categories are hardcoded in `src/lib/types.ts:8-15`:

```typescript
export const VALID_DELEGATION_CATEGORIES = [
  "research", "implementation", "review",
  "visual-engineering", "deep", "quick",
] as const
```

Validation in `src/lib/specialist-router.ts:66-72`:

```typescript
function normalizeCategory(value: string | undefined): DelegationCategory | undefined {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return undefined
  if (!VALID_DELEGATION_CATEGORIES.includes(normalized as DelegationCategory)) {
    throw new Error(
      `[Harness] Invalid category "${value}". Allowed categories: ${VALID_DELEGATION_CATEGORIES.join(", ")}.`,
    )
  }
  return normalized as DelegationCategory
}
```

#### 3. No customization mechanism exists

The user's core complaint is confirmed: **there is NO mechanism to check what agents are available as subagents at load time, nor to extend the allowed lists.**

| Customization | Supported? | How |
|---------------|-----------|-----|
| Add new agent | ❌ No | Requires code change in 4 files |
| Add new category | ❌ No | Requires code change in 2 files |
| Environment variable override | ❌ No | None exist |
| opencode.json config | ❌ No | No harness config section parsed |
| Continuity store config | ❌ No | Not read at validation time |
| Runtime extension API | ❌ No | None exists |

### Contributing Factors

| Factor | Impact |
|--------|--------|
| **Tool arg description omits valid categories** | The `category` arg description says "Optional routing category that can resolve agent, model, temperature, and guidance" — does NOT list valid values. LLM invents its own. |
| **Tool arg description partially lists agents** | The `agent` arg says "(researcher, builder, critic, general)" — helpful but not enforced as a schema enum, so LLM can still typo. |
| **No bridge between orchestration taxonomy and harness taxonomy** | GSD/hivefiver orchestrators use their own naming (`wave1-c1-fix`) with no mapping to harness categories (`implementation`). |
| **`agent-registry.ts` doesn't exist** | File referenced in architecture docs doesn't exist on disk. Agent definitions scattered across `types.ts`, `delegate-task.ts`, `specialist-router.ts`. |
| **Validation throws instead of normalizing** | Unknown categories throw errors rather than falling back to signal-based routing with a warning. |
| **No agent alias/normalization layer** | Common LLM variants like "build" → "builder", "reviewer" → "critic" are not normalized. |

## Files Involved

| File | Role | Lines of interest |
|------|------|-------------------|
| `src/lib/types.ts` | Defines `VALID_AGENTS`, `VALID_DELEGATION_CATEGORIES` | 7-15 |
| `src/tools/delegate-task.ts` | Tool implementation, agent validation, permission rules | 222-227, 229, 30-57 |
| `src/lib/specialist-router.ts` | `normalizeAgent()`, `normalizeCategory()`, route resolution | 61-72, 74-82 |
| `src/lib/categories.ts` | Category configs, model resolution | 19-59, 67-72 |

## Suggested Fix Strategy

### Fix 1: Agent name normalization (LOW RISK — ~15 LOC)

Add alias map before validation in `src/tools/delegate-task.ts` and `src/lib/specialist-router.ts`:

```typescript
const AGENT_ALIASES: Record<string, SpecialistAgent> = {
  "build": "builder",
  "builder": "builder",
  "researcher": "researcher",
  "research": "researcher",
  "critic": "critic",
  "reviewer": "critic",
  "review": "critic",
  "critique": "critic",
  "general": "general",
  "general-purpose": "general",
}
```

Apply before validation:
```typescript
const normalizedAgent = AGENT_ALIASES[requestedAgent] ?? requestedAgent
```

### Fix 2: Category pass-through mode (MEDIUM RISK — ~10 LOC)

In `src/lib/specialist-router.ts`, change `normalizeCategory()` to warn instead of throw:

```typescript
function normalizeCategory(value: string | undefined): DelegationCategory | undefined {
  const normalized = value?.trim().toLowerCase()
  if (!normalized) return undefined
  if (!VALID_DELEGATION_CATEGORIES.includes(normalized as DelegationCategory)) {
    // Warn and fall through to signal-based routing instead of throwing
    addWarning(parentSessionID, `Unknown category "${value}", using signal-based routing`)
    return undefined
  }
  return normalized as DelegationCategory
}
```

### Fix 3: Tool arg descriptions (LOW RISK — ~5 LOC)

Update `src/tools/delegate-task.ts` arg descriptions:

```typescript
category: s.string().optional().describe(
  "Optional routing category. Valid values: research, implementation, review, visual-engineering, deep, quick. Custom categories are accepted and fall back to signal-based routing.",
),
agent: s.string().optional().describe(
  "Optional explicit specialist agent. Valid: researcher, builder, critic, general. Aliases accepted: build→builder, review→critic.",
),
```

### Fix 4: Runtime-extensible agent/category lists (HIGHER RISK — requires design)

Add `OPENCODE_HARNESS_VALID_AGENTS` and `OPENCODE_HARNESS_VALID_CATEGORIES` env var support, or parse from `opencode.json` harness config section. Requires:
- New config loading in plugin.ts
- Validation against extended lists
- Permission rule generation for new agents
- Category default generation for new categories

**Defer this to Phase 3 Schema Definition** — it's a configuration architecture decision, not a quick fix.

## Verification Plan

After fixes 1-3:
1. Run existing test suite: `npm test`
2. Test with `"agent": "build"` — should normalize to `"builder"` without error
3. Test with `"category": "wave1-c1-fix"` — should warn and fall back to signal-based routing
4. Test with valid agent+category — should work as before
