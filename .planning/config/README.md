# Config Realm Architecture

> **Last updated:** 2026-05-07 (Config Realm Cleanup, hm-l1-coordinator)
> **Source schema:** `src/schema-kernel/hivemind-configs.schema.ts`
> **Traceability:** `.planning/config/config-traceability-2026-05-07.md`

---

## Overview

Hivemind configuration lives in `.hivemind/configs.json` at the project root. The file follows a 29-field Zod v4 schema (`HivemindConfigsSchema`, version 2.0.0). Configs are **lazy-loaded**, **in-memory cached**, and **fall back to defaults** on any failure — config loading never crashes plugin init.

---

## Loading Order

```
1. Plugin init (src/plugin.ts:56)
   └─ getConfig(projectDirectory)

2. getConfig() checks cache (src/lib/config-subscriber.ts:41)
   ├─ Cache HIT → return cached
   └─ Cache MISS → readConfigs() from disk

3. readConfigs() (src/schema-kernel/hivemind-configs.schema.ts:333)
   ├─ File missing → getDefaultConfigs() (all Zod defaults)
   ├─ File exists → JSON.parse → migrateKeys (camelCase→snake_case) → Zod validation
   ├─ Validation fails → getDefaultConfigs() (silent fallback)
   └─ Validation passes → return validated HivemindConfigs
```

---

## Validation

All validation is done by Zod at `readConfigs()` time:

- **Unknown fields are stripped** (`.strip()` on schema) — forward-compatible with future versions
- **Legacy camelCase keys are migrated** — `conversationLanguage` → `conversation_language`, etc. (`LEGACY_KEY_MAP`)
- **Defaults are factory-generated** via `WorkflowConfigInnerSchema.default(() => ...)` — ensures every field has a deterministic fallback

---

## Lazy-Cached Subscriber (`src/lib/config-subscriber.ts`)

The config subscriber provides three access patterns:

| Function | Reads Disk? | Use Case |
|----------|------------|----------|
| `getConfig(projectRoot)` | Only on first call | Plugin init, behavioral profile resolution |
| `getCachedConfig()` | Never (returns cached or defaults) | Hot-path consumers (delegation, continuity, persistence) |
| `invalidateConfigCache()` | N/A | Force re-read on next `getConfig()` |

**Design:**
- Single in-memory cache keyed by `projectRoot`
- `getCachedConfig()` avoids filesystem calls in hot code paths
- Falls back to `getDefaultConfigs()` if cache is cold — never returns null/undefined

---

## Toggle Gate Bridge (`src/hooks/toggle-gates.ts`)

Provides runtime access to workflow toggles:

- `isToggleEnabled(config, toggle)` — checks boolean workflow toggles, falls back to defaults
- `getDiscussMode(config)` — returns the discuss mode enum value

**Current state:** 5 boolean toggles are typed as `BooleanToggle` but no production hooks call `isToggleEnabled()` yet. `discuss_mode` is consumed by behavioral profile resolution.

---

## Config Field Categories

| Category | Count | Examples |
|----------|-------|----------|
| **Wired (active consumers)** | 8 top-level + 1 workflow | mode, user_expert_level, parallelization, atomic_commit, commit_docs, conversation_language, documents_and_artifacts_language, discuss_mode |
| **Wired-in-type (no caller yet)** | 5 workflow | research, plan_check, verifier, use_worktrees, research_before_questions |
| **@future-consumer (annotated)** | 4 workflow | cross_session_tasks_dependencies_validation, trajectory_control, advanced_continuity_validation, task_plus_enabled |
| **Deferred (future workstreams)** | 3 workflow | ui_phase, ui_safety_gate, ai_integration_phase |
| **Dead (no consumer)** | 1 top-level | delegation_systems |

See `.planning/config/config-traceability-2026-05-07.md` for the full field-level traceability.

---

## Consumer Map

```
.hivemind/configs.json
        │
        ▼
    readConfigs()  [schema-kernel/hivemind-configs.schema.ts]
        │
        ▼
    config-subscriber.ts  (lazy cache)
        │
        ├── plugin.ts (startup) → deps.hivemindConfig
        │       │
        │       └── create-core-hooks.ts → governance-block.ts (system.transform injection)
        │               └── Injects: mode, expertise, language into every system prompt
        │
        ├── resolve-behavioral-profile.ts
        │       └── Resolves: mode → BehavioralProfile, user_expert_level → expertise, languages
        │
        ├── delegation-manager.ts  [getCachedConfig()]
        │       └── CA-03 D-14: parallelization toggle → semaphore limit
        │
        ├── continuity.ts  [getCachedConfig()]
        │       └── CA-03 D-15: atomic_commit toggle → disk write gate
        │
        └── delegation-persistence.ts  [getCachedConfig()]
                └── CA-03 D-16: commit_docs toggle → disk write gate
```

---

## File Locations

| File | Role |
|------|------|
| `.hivemind/configs.json` | Runtime configuration file (user-editable, validated at load) |
| `src/schema-kernel/hivemind-configs.schema.ts` | Zod schema, readConfigs/writeConfigs, key migration, defaults |
| `src/lib/config-subscriber.ts` | Lazy cache wrapper (78 LOC) |
| `src/hooks/toggle-gates.ts` | Boolean toggle + discuss_mode accessors (83 LOC) |
| `src/hooks/governance-block.ts` | System prompt governance injection (104 LOC) |
| `.planning/config/config-traceability-2026-05-07.md` | Field → consumer traceability (this audit) |
| `.planning/config/README.md` | This document |
