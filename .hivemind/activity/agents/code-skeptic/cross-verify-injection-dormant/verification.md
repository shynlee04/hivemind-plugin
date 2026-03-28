# Cross-Verification: Is the Skill Injection System Dormant?

**Scope:** Verify discovery agent claim: "initSkillInjection() is defined in skill-exposure-map.ts but NEVER called from opencode-plugin.ts. The entire skill injection system is dormant."
**Mode:** Verification (on-disk evidence only)
**Date:** 2026-03-26T18:30+07:00
**Git HEAD:** 7183335fcdcbe9ae032287cbf87e5ebfbfb61856

---

## Task 1: Does `initSkillInjection` exist?

**YES — VERIFIED.** Definition at `src/plugin/skill-exposure-map.ts:50-52`:

```typescript
export function initSkillInjection(packageRoot: string): void {
  cachedConfig = loadSkillInjectionConfig(packageRoot)
}
```

It populates a module-scoped `cachedConfig` variable (line 28: `let cachedConfig: SkillInjectionConfig | null = null`) by calling `loadSkillInjectionConfig(packageRoot)` from `src/shared/skill-injection-loader.ts:134`.

**Evidence:** `src/plugin/skill-exposure-map.ts:50-52`

---

## Task 2: Is `initSkillInjection` called from `opencode-plugin.ts`?

**NO — VERIFIED.** The grep of the entire project source confirms:

- `src/plugin/opencode-plugin.ts:33` imports `resolveDefaultAgent` from `'./skill-exposure-map.js'`
- It does NOT import `initSkillInjection`
- The `HiveMindPlugin` function body (lines 52-235) contains zero references to `initSkillInjection`
- The only source file importing `initSkillInjection` is `tests/plugin-assembly-smoke.test.ts:16` (test-only)

Grep results across the full repository for `initSkillInjection` in source files:

| File | Context |
|------|---------|
| `src/plugin/skill-exposure-map.ts:50` | Definition only |
| `tests/plugin-assembly-smoke.test.ts:16` | Test import (never called in test either — line 247 comment says "may or may not have been called") |

**No production source file calls `initSkillInjection()` at runtime.**

**Evidence:** grep of `src/` — only `skill-exposure-map.ts` defines it, `opencode-plugin.ts` does not import or call it.

---

## Task 3: Does `messages-transform-adapter.ts` call `resolveSkillBundle()`?

**YES — VERIFIED.** At `src/plugin/messages-transform-adapter.ts:119-123`:

```typescript
const skillBundle = resolveSkillBundle(
  activeAgent,
  startWork.purposeClass,
  startWork.sessionState,
)
```

This calls `resolveSkillBundle()` with 3 args. The 4th param `taskClassification` is optional (see `skill-exposure-map.ts:75`), so this is valid.

**Evidence:** `src/plugin/messages-transform-adapter.ts:119-123`

---

## Task 4: What happens when `cachedConfig` is null?

**VERIFIED: Returns empty array with console.warn.** At `src/plugin/skill-exposure-map.ts:77-81`:

```typescript
if (!cachedConfig) {
  // Fallback: if init was never called, return empty bundle
  console.warn('[skill-exposure-map] resolveSkillBundle called before initSkillInjection. Returning empty bundle.')
  return []
}
```

Since `initSkillInjection()` is never called, `cachedConfig` is **always** `null`. Every call to `resolveSkillBundle()` in `messages-transform-adapter.ts` hits this branch and returns `[]`.

**This means:** Zero skills are ever injected into any agent's context. The `<available_skills>` block rendered by `skill-focus-renderer.ts` receives an empty array and produces a minimal/empty output.

**There is NO fallback to defaults in `resolveSkillBundle()`.** The only fallback is `return []`.

**Evidence:** `src/plugin/skill-exposure-map.ts:77-81`

---

## Task 5: What does `loadSkillInjectionConfig()` do when config is missing?

**VERIFIED: Falls back to `buildDefaultConfig()` and logs a warning.** At `src/shared/skill-injection-loader.ts:134-166`:

```typescript
export function loadSkillInjectionConfig(packageRoot: string): SkillInjectionConfig {
  if (cachedConfig && cachedRoot === packageRoot) {
    return cachedConfig
  }

  const configPath = join(packageRoot, 'config', 'skill-injection.json')

  try {
    const raw = readFileSync(configPath, 'utf-8')
    const parsed = JSON.parse(raw) as SkillInjectionConfig
    cachedConfig = parsed
    cachedRoot = packageRoot
    return parsed
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(
        `[skill-injection-loader] Config file not found at ${configPath}. ` +
        'Using default skill injection config. Create the file to customize skill bundles.',
      )
    } else {
      console.warn(
        `[skill-injection-loader] Failed to read config at ${configPath}: ${(err as Error).message}. ` +
        'Using default config.',
      )
    }

    cachedConfig = buildDefaultConfig()
    cachedRoot = packageRoot
    return cachedConfig
  }
}
```

When `config/skill-injection.json` is missing (ENOENT), it calls `buildDefaultConfig()` (lines 29-122) which returns a hardcoded `SkillInjectionConfig` with:
- `shared_skills`: `use-hivemind-delegation`
- `agent_bundles`: 9 agent bundles (hiveminder, hivefiver, hiveq, hivemaker, hiveplanner, hivexplorer, hiverd, hivehealer, hitea)
- `purpose_conditional`: 6 purposes (tdd, research, planning, implementation, course-correction, gatekeeping)
- `subsession_additions`: `git-continuity-memory`
- `default_agent`: `'hiveminder'`

**It does NOT throw.** It always returns a valid `SkillInjectionConfig`.

**But this fallback is IRRELEVANT** because `initSkillInjection()` is never called, so `loadSkillInjectionConfig()` is never invoked.

**Evidence:** `src/shared/skill-injection-loader.ts:134-166` (loader), `src/shared/skill-injection-loader.ts:29-122` (default config builder)

---

## Task 6: Full Chain Trace

```
opencode-plugin.ts
  ├── imports resolveDefaultAgent from skill-exposure-map.ts (line 33)
  ├── DOES NOT import initSkillInjection                     ← BROKEN LINK
  │
  ├── Plugin function executes (line 52):
  │   ├── initSdkContext(input)                              ✓
  │   ├── createEventHandler(directory)                      ✓
  │   ├── createTurnSnapshotLoader(directory)                ✓
  │   └── NO initSkillInjection(directory)                   ← MISSING
  │
  └── messages.transform hook fires (line 229):
      └── messagesTransform(transformInput, output)
          └── messages-transform-adapter.ts (line 119):
              └── resolveSkillBundle(activeAgent, purposeClass, sessionState)
                  └── skill-exposure-map.ts (line 77):
                      └── if (!cachedConfig) → return []     ← ALWAYS HAPPENS
```

**The chain is broken at the first step.** `initSkillInjection(directory)` should be called inside `HiveMindPlugin` before any hook fires, but it's absent.

**Evidence:** `src/plugin/opencode-plugin.ts` — no `initSkillInjection` import (line 33 only imports `resolveDefaultAgent`), no call in function body (lines 52-235).

---

## Task 7: Does the report file exist?

**YES — VERIFIED.** File exists at:
`.hivemind/activity/agents/hivexplorer/integration-lifecycle-map/report.md` (334 lines, verified on disk).

**Evidence:** `test -f` returns EXISTS.

---

## Assumptions Challenged

| # | Assumption | Risk if Wrong | Evidence |
|---|-----------|--------------|----------|
| 1 | `initSkillInjection()` was intentionally not wired | If this was a deliberate design choice, the `console.warn` + `return []` fallback is the intended behavior. But the JSDoc at skill-exposure-map.ts:10 says "Call `initSkillInjection(packageRoot)` once at plugin startup" — this contradicts intentional omission. | `skill-exposure-map.ts:10` vs `opencode-plugin.ts:33` |
| 2 | The fallback `return []` is a safe default | An empty skill bundle means agents never receive injected skill context. The `<available_skills>` block is empty. Agents rely solely on their `.opencode/agents/*.md` frontmatter for skill permissions, not the injection system. | `skill-exposure-map.ts:77-81` |
| 3 | `config/skill-injection.json` not existing is the blocker | FALSE. `loadSkillInjectionConfig()` handles missing config with `buildDefaultConfig()`. The missing file is a secondary issue — the primary issue is `initSkillInjection()` never being called. | `skill-injection-loader.ts:150-164` |

---

## Anti-Patterns Detected

1. **Dead integration** — A full config loader + tiered injection system was built but never wired into the plugin entry point. This is feature-incomplete code sitting in production source.
2. **Silent degradation** — The `console.warn` fires on every message transform, but the system continues with empty output. No error is thrown. No diagnostic surfaces to the user.
3. **Test import without use** — `tests/plugin-assembly-smoke.test.ts:16` imports `initSkillInjection` but never calls it (line 247 comment: "may or may not have been called").

---

## Verdict

**CLAIM CONFIRMED. The skill injection system is dormant.**

| Finding | Status | Evidence |
|---------|--------|----------|
| `initSkillInjection()` is defined | CONFIRMED | `skill-exposure-map.ts:50-52` |
| `initSkillInjection()` is NEVER called from plugin | CONFIRMED | `opencode-plugin.ts` — no import, no call |
| `cachedConfig` is always null | CONFIRMED | Only `initSkillInjection` populates it; never called |
| `resolveSkillBundle()` always returns `[]` | CONFIRMED | `skill-exposure-map.ts:77-81` — null check → empty array |
| `loadSkillInjectionConfig()` has fallback defaults | CONFIRMED | `skill-injection-loader.ts:29-122,150-164` — `buildDefaultConfig()` |
| Fallback defaults are NEVER exercised | CONFIRMED | `loadSkillInjectionConfig()` is never called because `initSkillInjection()` is never called |
| `config/skill-injection.json` doesn't exist | CONFIRMED | `config/` directory does not exist on disk |
| Report file exists | CONFIRMED | `.hivemind/activity/agents/hivexplorer/integration-lifecycle-map/report.md` on disk |

**The entire skill injection system — config loader, tiered injection, agent bundles, purpose conditionals — is fully built but completely disconnected from the plugin entry point. No skills are ever injected. The `<available_skills>` block in agent context is always empty.**

**Root cause:** `opencode-plugin.ts` imports `resolveDefaultAgent` (line 33) but not `initSkillInjection`. A single line `initSkillInjection(directory)` added inside the `HiveMindPlugin` function (before line 57 or at line 56) would activate the entire system.
