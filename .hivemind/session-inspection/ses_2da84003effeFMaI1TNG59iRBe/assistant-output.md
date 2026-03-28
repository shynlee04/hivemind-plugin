# Session Inspection Export

- ses_id: `ses_2da84003effeFMaI1TNG59iRBe`
- prepared_at: `2026-03-25T14:56:31.270Z`

## Assistant Output

---

## Skill Injection JSON Configuration Schema — Design Document

**Project:** `hivemind-context-governance`  
**Date:** 2026-03-25  
**Author:** Hivexplorer (Terminal Repository Investigator)

---

## 1. Problem Statement

The skill injection pipeline in `src/plugin/skill-exposure-map.ts` uses **hardcoded TypeScript constants** to define which skills to inject per agent, per purpose class, and per session state. This creates a brittle coupling: when skill names change on disk, the injection system silently fails because it references stale names.

### Current Hardcoded Assets

| Constant | Type | Usage |
|---|---|---|
| `SHARED_SKILLS` | `SkillEntry[]` | Always-on, all agents |
| `AGENT_BUNDLES` | `Record<string, SkillEntry[]>` | Per-agent (9 agents) |
| `PURPOSE_CONDITIONAL` | `Record<string, SkillEntry[]>` | Per purpose class (6 purposes) |
| `SUBSESSION_ADDITIONS` | `SkillEntry[]` | Sub-session extra skills |
| `MAX_SKILLS` | `number` (7 → should be 3) | Cap |

### The Naming Mismatch Evidence

File: `src/plugin/skill-exposure-map.ts:40`  
```typescript
{ name: 'hivemind-gatekeeping-delegation', description: '...' }
```

Disk reality (`.kilocode/skills/`):
```
hivemind-gatekeeping/     ← correct current name
NOT hivemind-gatekeeping-delegation/
```

Disk reality (`skills/skills/`):
```
hivemind-gatekeeping-delegation/  ← old path, still ships
```

The registry at `src/shared/opencode-skill-registry.ts` already discovers skills on disk but **is not wired into the injection pipeline** — confirmed by grep finding zero imports of it.

---

## 2. JSON Schema Design

### 2.1 File Location

**Recommended path:** `config/skill-injection.json` relative to package root.

Rationale:
- `config/` is a standard convention for application configuration
- It is NOT inside `.opencode/` (which is runtime-generated, not authoring-surface)
- It is NOT at project root alongside `opencode.json` (which is OpenCode-specific, not HiveMind-specific)
- It is NOT inside `src/` (which is source code, not data)
- It survives `npm pack` / install since `config/` is not gitignored

**Alternative considered:** `.hivemind/skill-injection.json` — rejected because `.hivemind/` is runtime-generated output, not configuration input.

### 2.2 Schema Structure

```json
{
  "_meta": {
    "version": "1.0.0",
    "updated_at": "2026-03-25T14:30:00.000Z",
    "updated_by": "hiveminder",
    "schema": "skill-injection-config-v1"
  },

  "shared_skills": [
    { "name": "use-hivemind-delegation", "description": "Enforce delegation when front-facing agents must split work across subagents" }
  ],

  "max_skills": 3,

  "agent_bundles": {
    "hiveminder": [
      { "name": "hivemind-gatekeeping", "description": "Loop control and synthesis gates" },
      { "name": "use-hivemind-git-memory", "description": "Git-aware context continuity" },
      { "name": "hivemind-atomic-commit", "description": "Atomic commit discipline" }
    ],
    "hivefiver": [
      { "name": "hivemind-gatekeeping", "description": "Loop control and synthesis gates" },
      { "name": "use-hivemind-git-memory", "description": "Git-aware context continuity" },
      { "name": "hivemind-atomic-commit", "description": "Atomic commit discipline" }
    ],
    "hiveq": [
      { "name": "tdd-delegation", "description": "TDD-aware delegation for red-green-refactor loops" },
      { "name": "verification-before-completion", "description": "Run verification commands before completing claims" },
      { "name": "use-hivemind-tdd", "description": "Test-first development with 80%+ coverage" }
    ],
    "hivemaker": [
      { "name": "tdd-delegation", "description": "TDD-aware delegation for red-green-refactor loops" },
      { "name": "clean-code", "description": "Clean Code principles" },
      { "name": "refactor", "description": "Surgical refactoring" },
      { "name": "use-hivemind-tdd", "description": "Test-first development" }
    ],
    "hiveplanner": [
      { "name": "writing-plans", "description": "Create structured implementation plans" },
      { "name": "breakdown-plan", "description": "Epic > Feature > Story hierarchy" },
      { "name": "hivemind-spec-driven", "description": "Spec distillation before planning" }
    ],
    "hivexplorer": [
      { "name": "research-delegation", "description": "Research-specific delegation" },
      { "name": "context-map", "description": "Map files relevant to a task" },
      { "name": "hivemind-codemap", "description": "Whole-codebase mapping and seam discovery" },
      { "name": "use-hivemind-research", "description": "Structured research methodology" }
    ],
    "hiverd": [
      { "name": "research-delegation", "description": "Research-specific delegation" },
      { "name": "deep-research", "description": "Enterprise-grade research" },
      { "name": "use-hivemind-research", "description": "Structured research methodology" }
    ],
    "hivehealer": [
      { "name": "course-correction-delegation", "description": "Debug loop delegation" },
      { "name": "hivemind-system-debug", "description": "Detox and restoration work" },
      { "name": "systematic-debugging", "description": "Reproduce, narrow, contain, prove evidence" }
    ],
    "hitea": [
      { "name": "tdd-delegation", "description": "TDD-aware delegation" },
      { "name": "qa-test-planner", "description": "Comprehensive test plans" },
      { "name": "use-hivemind-tdd", "description": "Test-first development" }
    ]
  },

  "purpose_conditional": {
    "tdd": [
      { "name": "tdd-delegation", "description": "TDD-aware delegation" },
      { "name": "use-hivemind-tdd", "description": "Test-first development" }
    ],
    "research": [
      { "name": "research-delegation", "description": "Research-specific delegation" },
      { "name": "deep-research", "description": "Enterprise-grade research" }
    ],
    "planning": [
      { "name": "writing-plans", "description": "Create structured plans" },
      { "name": "breakdown-plan", "description": "Epic > Feature > Story hierarchy" }
    ],
    "implementation": [
      { "name": "clean-code", "description": "Clean Code principles" },
      { "name": "refactor", "description": "Surgical refactoring" }
    ],
    "course-correction": [
      { "name": "course-correction-delegation", "description": "Debug loop delegation" },
      { "name": "systematic-debugging", "description": "Reproduce, narrow, contain" }
    ],
    "gatekeeping": [
      { "name": "hivemind-gatekeeping", "description": "Loop control and synthesis gates" },
      { "name": "verification-before-completion", "description": "Run verification before completing claims" }
    ]
  },

  "subsession_additions": [
    { "name": "use-hivemind-git-memory", "description": "Git-aware context continuity for delegated sessions" }
  ],

  "excluded_skill_ids": [
    "_deprecated_hive",
    "context-entry-verify",
    "context-intelligence-entry"
  ]
}
```

### 2.3 TypeScript Interfaces (Design Only)

```typescript
// skill-injection.types.ts

export interface SkillInjectionMeta {
  version: string
  updated_at: string
  updated_by: string
  schema: string
}

export interface SkillEntry {
  name: string
  description: string
}

export interface SkillInjectionConfig {
  _meta: SkillInjectionMeta
  shared_skills: SkillEntry[]
  max_skills: number
  agent_bundles: Record<string, SkillEntry[]>
  purpose_conditional: Record<string, SkillEntry[]>
  subsession_additions: SkillEntry[]
  excluded_skill_ids: string[]
}

export interface ValidatedSkillBundle {
  skills: SkillEntry[]
  missingSkills: string[]      // Skills referenced but not on disk
  duplicateNames: string[]     // Names appearing multiple times across bundles
  invalidAgentIds: string[]    // Agent keys not in OPENCODE_AGENT_REGISTRY_IDS
  invalidPurposeClasses: string[] // Purpose keys not in known purpose class list
}
```

### 2.4 JSON Schema (Formal)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://hivemind-context-governance/schema/skill-injection/v1",
  "type": "object",
  "required": ["_meta", "shared_skills", "max_skills", "agent_bundles", "purpose_conditional", "subsession_additions"],
  "additionalProperties": true,
  "properties": {
    "_meta": {
      "type": "object",
      "required": ["version", "updated_at", "schema"],
      "properties": {
        "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
        "updated_at": { "type": "string", "format": "date-time" },
        "updated_by": { "type": "string" },
        "schema": { "type": "string", "const": "skill-injection-config-v1" }
      }
    },
    "shared_skills": {
      "type": "array",
      "items": { "$ref": "#/definitions/SkillEntry" }
    },
    "max_skills": {
      "type": "integer",
      "minimum": 1,
      "maximum": 10
    },
    "agent_bundles": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": { "$ref": "#/definitions/SkillEntry" }
      }
    },
    "purpose_conditional": {
      "type": "object",
      "additionalProperties": {
        "type": "array",
        "items": { "$ref": "#/definitions/SkillEntry" }
      }
    },
    "subsession_additions": {
      "type": "array",
      "items": { "$ref": "#/definitions/SkillEntry" }
    },
    "excluded_skill_ids": {
      "type": "array",
      "items": { "type": "string" }
    }
  },
  "definitions": {
    "SkillEntry": {
      "type": "object",
      "required": ["name", "description"],
      "properties": {
        "name": { "type": "string", "minLength": 1 },
        "description": { "type": "string", "minLength": 1 }
      }
    }
  }
}
```

---

## 3. Loading and Validation Flow

### 3.1 Module Architecture

```
config/skill-injection.json
         │
         ▼
┌─────────────────────────────────┐
│  src/shared/skill-injection-   │  ← New module (loader + validator)
│         loader.ts               │
└─────────────────┬───────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────────────┐
│  opencode-    │   │  opencode-skill-       │  ← Existing, not connected
│  agent-       │   │  registry.ts          │
│  registry.ts  │   │  (file discovery)      │
└───────────────┘   └───────────────────────┘
        │                   │
        └─────────┬─────────┘
                  ▼
        ┌───────────────────────┐
        │  validateSkillConfig  │  ← New pure function
        └─────────┬─────────────┘
                  │
                  ▼
        ┌───────────────────────┐
        │  resolveSkillBundle   │  ← Modified existing function
        └───────────────────────┘
```

### 3.2 Loading Mechanism

**Decision: Lazy initialization with module-level singleton cache.**

```typescript
// pseudo-design — NOT actual code
let cachedConfig: SkillInjectionConfig | null = null
let validationResult: ValidatedSkillBundle | null = null

export function loadSkillInjectionConfig(packageRoot: string): SkillInjectionConfig {
  if (cachedConfig) return cachedConfig
  
  const configPath = join(packageRoot, 'config', 'skill-injection.json')
  const raw = readFileSync(configPath, 'utf-8')
  cachedConfig = JSON.parse(raw) as SkillInjectionConfig
  return cachedConfig
}

export function getOrCreateSkillRegistry(packageRoot: string) {
  // Connects to existing opencode-skill-registry.ts
}
```

Rationale for lazy vs. module-init:
- **Lazy**: Delays I/O until first `resolveSkillBundle()` call; avoids blocking plugin startup if JSON is missing
- **Module-level singleton cache**: Ensures the JSON is only parsed once per plugin lifetime
- **Not a factory pattern**: The config is effectively immutable at runtime (loaded once, used everywhere)

### 3.3 Validation Strategy

Validation occurs **at load time** (not at every `resolveSkillBundle()` call):

```
loadSkillInjectionConfig()
         │
         ▼
validateSkillNamesAgainstDisk(config, registry)
         │
    ┌────┴────┐
    ▼         ▼
 warnings[]  errors[]
    │         │
    │         └─ If critical (missing shared_skills): throw
    │
    ▼
logWarning("Skill 'hivemind-gatekeeping-delegation' referenced but not on disk. Skipping.")
logWarning("Agent 'hivemakerx' not in OPENCODE_AGENT_REGISTRY_IDS. Bundle ignored.")
```

**Validation checks:**

| Check | Severity | Action |
|---|---|---|
| Skill name not on disk | `warn` | Skip from bundle, continue |
| Shared skill missing | `error` | Throw at load time |
| Agent ID not in registry | `warn` | Skip agent bundle |
| Purpose class not recognized | `warn` | Skip purpose bundle |
| `max_skills` out of range (1-10) | `error` | Throw at load time |
| Duplicate skill names within a bundle | `warn` | Deduplicate (first occurrence wins) |
| Duplicate skill names across shared + agent + purpose | `warn` | Deduplicate (shared wins first) |

### 3.4 Fallback Behavior

If `config/skill-injection.json` is **missing**:

1. Log console warning: `[hivemind] skill-injection.json not found, using hardcoded defaults`
2. Return the **current hardcoded TypeScript constants** as the fallback
3. This ensures zero breaking change for existing deployments

---

## 4. Files Requiring Modification

### 4.1 New Files

| File | Purpose |
|---|---|
| `config/skill-injection.json` | The configuration file itself |
| `src/shared/skill-injection-loader.ts` | JSON loading + validation against disk registry |
| `src/shared/skill-injection.types.ts` | TypeScript interfaces for the config |
| `src/shared/skill-injection-schema.json` | JSON Schema for the config |

### 4.2 Modified Files

| File | Change | Risk |
|---|---|---|
| `src/plugin/skill-exposure-map.ts` | Replace hardcoded constants with calls to `loadSkillInjectionConfig()`. Keep `resolveSkillBundle()` signature identical to preserve `messages-transform-adapter.ts` compatibility | **High** — core of injection pipeline |
| `src/plugin/messages-transform-adapter.ts` | No changes needed — imports from `skill-exposure-map.ts` which keeps same exports | **Low** — adapter only calls existing `resolveSkillBundle()` |

### 4.3 No Changes Required

| File | Reason |
|---|---|
| `src/plugin/skill-focus-renderer.ts` | Receives `SkillEntry[]` from `skill-exposure-map.ts` — no knowledge of loading mechanism |
| `src/plugin/context-renderer.ts` | Same — pure consumer |
| `src/plugin/opencode-plugin.ts` | Assembly only — doesn't reference skill constants |

---

## 5. Edge Cases

### 5.1 Duplicate Skill Names

**Case:** Same skill appears in `shared_skills`, `agent_bundles.hiveminder`, and `purpose_conditional.tdd`.

**Resolution:**  
`resolveSkillBundle()` uses a `seen: Set<string>` to deduplicate. Priority order:
1. `shared_skills` first (always-on)
2. `agent_bundles` next (per-agent)
3. `purpose_conditional` next (per-purpose)
4. `subsession_additions` last

First occurrence wins; subsequent duplicates are skipped silently.

### 5.2 Agent ID Not in Registry

**Case:** JSON has `"agent_bundles": { "hivemakerx": [...] } }` where `hivemakerx` is not in `OPENCODE_AGENT_REGISTRY_IDS`.

**Resolution:**  
Validation logs `warn: Agent 'hivemakerx' not in OPENCODE_AGENT_REGISTRY_IDS — skipping bundle` and removes it from the resolved config. `resolveSkillBundle()` uses the existing fallback: `effectiveAgent = activeAgent in AGENT_BUNDLES ? activeAgent : 'hivefiver'`.

### 5.3 Purpose Class Not Recognized

**Case:** JSON has `"purpose_conditional": { "foobar": [...] } }`.

**Resolution:**  
Validation logs `warn: Purpose class 'foobar' not recognized — skipping`. `resolveSkillBundle()` already guards: `if (purposeClass && purposeClass in PURPOSE_CONDITIONAL)`. The unknown purpose class simply doesn't add any conditional skills.

### 5.4 JSON File Has Syntax Errors

**Case:** `JSON.parse()` throws.

**Resolution:**  
Catch the parse error, log `error: Failed to parse config/skill-injection.json: <message>`, and fall back to hardcoded TypeScript constants. This prevents the plugin from crashing on misconfiguration.

### 5.5 All Skills in a Bundle Are Missing

**Case:** An agent bundle lists 3 skills, but none exist on disk.

**Resolution:**  
Validation notes `"Agent 'hivemaker': all 3 referenced skills missing from disk"` at `warn` level. The bundle contributes zero skills. The agent still resolves with just `shared_skills` (if any exist).

### 5.6 JSON Version Mismatch

**Case:** `config/skill-injection.json` has `_meta.schema = "skill-injection-config-v2"` but the loader only supports `v1`.

**Resolution:**  
Throw an error at load time: `error: skill-injection.json schema version 'v2' not supported by this version of hivemind-context-governance`. Requires manual config update.

---

## 6. Integration with Existing Registry

The `src/shared/opencode-skill-registry.ts` currently discovers skills but is not wired to the injection system. The new loader connects them:

```
skill-injection-loader.ts
       │
       ├── calls createOpencodeSkillRegistry(packageRoot)
       │         │
       │         └── opencode-skill-registry.ts:discoverSkills()
       │
       └── returns Set<string> of valid skill IDs on disk
                 │
                 ▼
          validateSkillNamesAgainstDisk(config, validIds)
```

The `opencode-skill-registry.ts` itself **does not need modification** — it already returns a clean `OpencodeSkillRegistryEntry[]` with `id` and `frontmatter.name`.

---

## 7. Migration Path Summary

| Phase | Action | Files |
|---|---|---|
| **Phase 1: Author the config** | Create `config/skill-injection.json` with all current hardcoded values translated (with corrected skill names using actual disk names) | `config/skill-injection.json` (new) |
| **Phase 2: Author the loader** | Create `src/shared/skill-injection-loader.ts` with JSON loading, fallback, and validation | `src/shared/skill-injection-loader.ts` (new), `src/shared/skill-injection.types.ts` (new) |
| **Phase 3: Wire to existing code** | Modify `skill-exposure-map.ts` to delegate to loader instead of returning hardcoded constants | `src/plugin/skill-exposure-map.ts` (modified) |
| **Phase 4: Verify** | Run `npm run typecheck` and `npm test` — `messages-transform-adapter.ts` should pass unchanged | — |
| **Phase 5: Ship** | Publish with `config/skill-injection.json` in the `files` array of `package.json` (add if not present) | `package.json` (modified) |

---

## 8. Summary Table

| Dimension | Decision |
|---|---|
| **File location** | `config/skill-injection.json` |
| **Loading pattern** | Lazy singleton cache, module-level |
| **Validation** | At load time, compare names against `opencode-skill-registry.ts` disk discovery |
| **Missing file** | Fall back to current TypeScript constants with console warning |
| **Skill name mismatch** | Log warning, skip missing skills, don't throw |
| **Schema version** | In `_meta.schema` field, checked at load time |
| **No breaking changes** | `resolveSkillBundle()` signature unchanged — adapter needs zero edits |
| **Skill names on disk** | Use actual names from `.kilocode/skills/` directory listing |