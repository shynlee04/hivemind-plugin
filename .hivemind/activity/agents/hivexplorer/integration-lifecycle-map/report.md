# Integration Lifecycle Map — Investigation Report

**Scope:** Full lifecycle flow trace across 5 component dependency chains
**Question:** What impacts what across the hivefiver refactoring?
**Investigation Date:** 2026-03-26T17:52+07:00
**Git HEAD:** 7183335fcdcbe9ae032287cbf87e5ebfbfb61856

---

## Flow 1: Plugin Startup → Skill Injection

### File Path Chain (Actual Imports Verified)

```
opencode-plugin.ts (line 33)
  → imports resolveDefaultAgent from './skill-exposure-map.js'
  → DOES NOT import initSkillInjection ← BROKEN LINK
    skill-exposure-map.ts (line 18-19)
      → imports loadSkillInjectionConfig from '../shared/skill-injection-loader.js'
      → imports resolveTieredSkills from '../shared/tiered-injection.js'
        skill-injection-loader.ts (line 14-15)
          → imports SkillInjectionConfig, SkillValidationResult from '../schema-kernel/skill-injection-records.js'
          → imports createOpencodeSkillRegistry from './opencode-skill-registry.js'
          → reads config from '{packageRoot}/config/skill-injection.json'
        tiered-injection.ts (line 16-17)
          → imports SkillInjectionConfig from '../schema-kernel/skill-injection-records.js'
          → imports TaskClassification, PhaseClassification from '../schema-kernel/agent-records.js'
    messages-transform-adapter.ts (line 25-27)
      → imports resolveSkillBundle, resolveSessionRole, resolveDefaultAgent from './skill-exposure-map.js'
      → imports renderSkillFocusBlock from './skill-focus-renderer.js'
      → imports setInjectionPayload from './injection-store.js'
        skill-focus-renderer.ts (line 11-12)
          → imports SkillEntry, renderSessionRoleDirective, SessionRole from './skill-exposure-map.js'
        synthetic-parts.ts (line 1)
          → imports Part from '@opencode-ai/sdk'
```

### Findings

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | **CRITICAL: initSkillInjection() NEVER called from plugin** | `src/plugin/opencode-plugin.ts` | — | No import or call of `initSkillInjection` anywhere in the file. Only `resolveDefaultAgent` is imported from skill-exposure-map.ts (line 33). |
| 2 | initSkillInjection() is defined | `src/plugin/skill-exposure-map.ts` | 50-52 | `export function initSkillInjection(packageRoot: string): void { cachedConfig = loadSkillInjectionConfig(packageRoot) }` |
| 3 | resolveSkillBundle warns if not initialized | `src/plugin/skill-exposure-map.ts` | 77-81 | Returns `[]` with console.warn: "resolveSkillBundle called before initSkillInjection" |
| 4 | **config/skill-injection.json DOES NOT EXIST** | project root | — | `config/` directory does not exist at all |
| 5 | skill-injection-loader has fallback defaults | `src/shared/skill-injection-loader.ts` | 29-122 | `buildDefaultConfig()` returns hardcoded defaults when file missing |
| 6 | Import chain: skill-exposure-map → skill-injection-loader → skill-injection-records | `src/plugin/skill-exposure-map.ts` | 18 | `import { loadSkillInjectionConfig, type SkillInjectionConfig } from '../shared/skill-injection-loader.js'` — valid |
| 7 | Import chain: skill-exposure-map → tiered-injection | `src/plugin/skill-exposure-map.ts` | 19 | `import { resolveTieredSkills } from '../shared/tiered-injection.js'` — valid |
| 8 | Import chain: tiered-injection → agent-records (TaskClassification, PhaseClassification) | `src/shared/tiered-injection.ts` | 17 | `import type { TaskClassification, PhaseClassification } from '../schema-kernel/agent-records.js'` — valid |
| 9 | messages-transform-adapter correctly calls resolveSkillBundle with 3 args | `src/plugin/messages-transform-adapter.ts` | 119-123 | `resolveSkillBundle(activeAgent, startWork.purposeClass, startWork.sessionState)` — matches 3-arg signature |
| 10 | resolveSkillBundle signature has optional 4th param taskClassification | `src/plugin/skill-exposure-map.ts` | 71-76 | `taskClassification?: TaskClassification \| undefined` — callers using 3 args still work |
| 11 | opencode-skill-registry.ts exists and is connected | `src/shared/opencode-skill-registry.ts` | 131-137 | `createOpencodeSkillRegistry()` called by skill-injection-loader.ts:183 |
| 12 | synthetic-parts.ts creates hidden parts with ui_hidden: true | `src/plugin/synthetic-parts.ts` | 12-26 | `experimental_providerMetadata: { opencode: { ui_hidden: true } }` |
| 13 | renderSkillFocusBlock correctly calls renderSessionRoleDirective | `src/plugin/skill-focus-renderer.ts` | 48 | `renderSessionRoleDirective(sessionRole)` — imports from same module |

### Broken Links

| # | Broken Link | Impact |
|---|------------|--------|
| 1 | **`initSkillInjection()` never called at plugin startup** | `cachedConfig` is always `null`. Every call to `resolveSkillBundle()` hits the fallback that logs a warning and returns empty array. The entire skill injection system is dormant. |
| 2 | `config/skill-injection.json` missing | Would be handled by fallback defaults IF initSkillInjection were called. Currently irrelevant because init is never called. |

### Conflicts

| # | Conflict | Detail |
|---|---------|--------|
| 1 | Tier 1 core init skills (`use-hivemind`, `use-hivemind-delegation`, `hivemind-spec-driven`) defined in tiered-injection.ts:43-47 are never injected | Since initSkillInjection never runs, Tier 1 skills are never loaded. |
| 2 | Agent bundles in buildDefaultConfig() reference skill names that may not match actual on-disk skill IDs | e.g., `git-continuity-memory` vs actual skill directory name |

---

## Flow 2: hm-init Tool → Config Generation

### File Path Chain

```
opencode-plugin.ts (line 29, 92)
  → imports createHivemindHmInitTool from '../tools/hivefiver-init/index.js'
  → registers as tool: hivemind_hm_init
    hivefiver-init/index.ts (line 1)
      → exports createHivemindHmInitTool from './tools.js'
      → exports types from './types.js'
    hivefiver-init/tools.ts (line 9-13)
      → imports tool from '@opencode-ai/plugin/tool'
      → imports success from '../../shared/tool-response.js'
      → imports renderToolResult from '../../shared/tool-helpers.js'
      → imports HmInitToolArgs, HmInitResult from './types.js'
    hivefiver-init/types.ts
      → Pure type definitions, no imports from other modules
```

### Findings

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | Tool is a PLACEHOLDER — no real bootstrap logic | `src/tools/hivefiver-init/tools.ts` | 7 | Comment: "Placeholder implementation: detects project state and returns a structured plan of proposed changes without writing to .opencode/." |
| 2 | execute() does NOT call context.ask() for authorization | `src/tools/hivefiver-init/tools.ts` | 29 | `_context` is unused (prefixed with underscore) |
| 3 | execute() does NOT reference config-groups.ts | `src/tools/hivefiver-init/tools.ts` | — | No import from config-groups |
| 4 | execute() does NOT reference schema types for validation | `src/tools/hivefiver-init/tools.ts` | — | Uses plain TypeScript interfaces from types.ts, not Zod schemas |
| 5 | execute() returns proposedChanges array but never writes | `src/tools/hivefiver-init/tools.ts` | 42-75 | Returns render(success(...)) with proposed changes only |
| 6 | Tool does NOT reference initSkillInjection or skill injection system | `src/tools/hivefiver-init/tools.ts` | — | No connection to Flow 1 |
| 7 | Tool uses tool.schema (Zod) for args correctly | `src/tools/hivefiver-init/tools.ts` | 15, 24-27 | `const s = tool.schema` + `s.enum(...)` and `s.boolean()` |

### Broken Links

| # | Broken Link | Impact |
|---|------------|--------|
| 1 | hm-init does NOT call initSkillInjection() | Even after hm-init runs, skill injection would still be dormant (Flow 1 still broken) |
| 2 | hm-init does NOT write to .opencode/ (per DIRECT_WRITE_BAN) | Intentional design — but means hm-init is purely advisory |
| 3 | context.ask() is not used despite docstring claiming authorization via context.ask() | Line 23 claims "Does NOT write without user authorization via context.ask()" but context is unused |

---

## Flow 3: hm-doctor Tool → Diagnostics

### File Path Chain

```
opencode-plugin.ts (line 30, 93)
  → imports createHivemindHmDoctorTool from '../tools/hivefiver-doctor/index.js'
  → registers as tool: hivemind_hm_doctor
    hivefiver-doctor/index.ts
      → exports createHivemindHmDoctorTool from './tools.js'
    hivefiver-doctor/tools.ts
      → imports tool from '@opencode-ai/plugin/tool'
      → imports success from '../../shared/tool-response.js'
      → imports renderToolResult from '../../shared/tool-helpers.js'
      → imports HmDoctorToolArgs, HmDoctorResult, HmDoctorFinding from './types.js'
```

### Findings

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | Tool is a PLACEHOLDER — only basic existsSync checks | `src/tools/hivefiver-doctor/tools.ts` | 7 | Comment: "Placeholder implementation: runs read-only diagnostics and returns structured findings." |
| 2 | Does NOT call validateSkillNames() from skill-injection-loader | `src/tools/hivefiver-doctor/tools.ts` | — | No import from skill-injection-loader. Skills check only verifies .opencode/skills/ dir exists. |
| 3 | Does NOT check paths.ts for dead references | `src/tools/hivefiver-doctor/tools.ts` | — | Only checks if .hivemind/ exists, not actual path resolution |
| 4 | Does NOT cross-reference agent configs against skill injection config | `src/tools/hivefiver-doctor/tools.ts` | — | Only checks if .opencode/agents/ dir exists |
| 5 | fix=true proposes fixes but context.ask() is unused | `src/tools/hivefiver-doctor/tools.ts` | 29 | `_context` is unused |
| 6 | Doctor scope supports 'skills'/'agents'/'config'/'paths' | `src/tools/hivefiver-doctor/tools.ts` | 24 | Enum matches types.ts HmDoctorScope |

### Broken Links

| # | Broken Link | Impact |
|---|------------|--------|
| 1 | Doctor does NOT import validateSkillNames() | Cannot detect skill name mismatches between config and on-disk registry |
| 2 | Doctor does NOT import paths.ts | Cannot validate path resolution or detect dead references |
| 3 | Doctor does NOT import config-groups.ts | Cannot validate configuration integrity |

---

## Flow 4: hm-setting Tool → Config Update

### File Path Chain

```
opencode-plugin.ts (line 31, 94)
  → imports createHivemindHmSettingTool from '../tools/hivefiver-setting/index.js'
  → registers as tool: hivemind_hm_setting
    hivefiver-setting/index.ts
      → exports createHivemindHmSettingTool from './tools.js'
    hivefiver-setting/tools.ts (line 12-17)
      → imports CONFIG_GROUPS, getConfigGroup, validateConfigUpdate from '../../shared/config-groups.js'
      → imports ConfigGroupName from '../../shared/config-groups.js'
      → imports HmSettingResult from './types.js'
      config-groups.ts (line 8-15)
        → imports UserPreferences, UserExpertLevel, GovernanceLevel, OperationMode from '../schema-kernel/config-records.js'
        → imports type UserPreferences from '../schema-kernel/config-records.js'
        config-records.ts
          → Pure Zod schema definitions, no external imports
```

### Findings

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | Tool correctly imports from config-groups | `src/tools/hivefiver-setting/tools.ts` | 12-17 | `import { CONFIG_GROUPS, getConfigGroup, validateConfigUpdate } from '../../shared/config-groups.js'` |
| 2 | config-groups correctly imports from config-records | `src/shared/config-groups.ts` | 8-15 | `import { UserPreferences, UserExpertLevel, GovernanceLevel, OperationMode } from '../schema-kernel/config-records.js'` |
| 3 | Schema types are aligned | `src/schema-kernel/config-records.ts` | 28-34 | UserPreferences has communication_language, document_language, expert_level, governance_level, operation_mode |
| 4 | CONFIG_GROUPS maps correctly to schema keys | `src/shared/config-groups.ts` | 52-74 | language→[communication_language, document_language], expertise→[expert_level], governance→[governance_level], operation-mode→[operation_mode] |
| 5 | validateConfigUpdate uses Zod safeParse | `src/shared/config-groups.ts` | 137-145 | `UserPreferences.safeParse(merged)` |
| 6 | Tool validates group name before processing | `src/tools/hivefiver-setting/tools.ts` | 68-69 | `if (!CONFIG_GROUPS[group]) { return render(toolError(...)) }` |
| 7 | Tool proposes changes but does NOT write | `src/tools/hivefiver-setting/tools.ts` | 98-114 | Returns `written: false`, `authorizationRequired: true` |
| 8 | applyConfigUpdate exists but is NOT called by the tool | `src/shared/config-groups.ts` | 160-183 | Function exists, tool only uses validateConfigUpdate |
| 9 | context.ask() is unused for authorization | `src/tools/hivefiver-setting/tools.ts` | 25 | `_projectRoot` is unused; `_context` is unused on line 45 |

### Broken Links

| # | Broken Link | Impact |
|---|------------|--------|
| 1 | hm-setting never writes — only proposes | The tool says "requires authorization" but never calls context.ask() to get it |
| 2 | applyConfigUpdate is defined but never called | Dead code path — the function to apply changes exists but the tool only validates |

### Conflicts

| # | Conflict | Detail |
|---|---------|--------|
| 1 | HmSettingGroup type adds 'all' to ConfigGroupName union | types.ts:6-11 includes 'all' but CONFIG_GROUPS has no 'all' key. Tool handles this separately on line 47. No runtime conflict but type mismatch between the union. |

---

## Flow 5: Agent Delegation → Skill Loading

### File Path Chain

```
messages-transform-adapter.ts (line 119-123)
  → calls resolveSkillBundle(activeAgent, purposeClass, sessionState)
    skill-exposure-map.ts (line 71-94)
      → resolveSkillBundle checks cachedConfig (always null — Flow 1 broken)
      → returns [] with console.warn
    messages-transform-adapter.ts (line 124)
  → calls resolveSessionRole(startWork.sessionState, activeAgent)
    skill-exposure-map.ts (line 118-146)
      → returns 'orchestrate' | 'specialist' | 'standalone'
    messages-transform-adapter.ts (line 133)
  → calls renderSkillFocusBlock(skillBundle, sessionRole)
    skill-focus-renderer.ts (line 32-53)
      → renders <available_skills> block with skill names + session role directive
    messages-transform-adapter.ts (line 143)
  → injected as synthetic parts into user message
```

### Agent Config Verification

Agent config files at `.opencode/agents/*.md` define skill permissions in YAML frontmatter:

| Agent | Config Skills (skill: allow) | Injection System Bundles | Match? |
|-------|------------------------------|-------------------------|--------|
| hiveminder (line 42-47) | use-hivemind, use-hivemind-delegation, agent-role-boundary, use-hivemind-context-integrity, hivemind-gatekeeping-delegation, use-hivemind-git-memory | hivemind-gatekeeping-delegation, git-continuity-memory, hivemind-atomic-commit | **PARTIAL** — config has `agent-role-boundary` and `use-hivemind-context-integrity` which are NOT in injection bundle. Injection has `hivemind-atomic-commit` which is NOT in config. |
| hivemaker (line 18-23) | use-hivemind, use-hivemind-delegation, agent-role-boundary, use-hivemind-context-integrity, tdd-delegation, hivemind-atomic-commit | tdd-delegation, clean-code, refactor, test-driven-development | **PARTIAL** — config has `agent-role-boundary` and `use-hivemind-context-integrity` not in bundle. Injection has `clean-code`, `refactor`, `test-driven-development` not in config. |
| hivexplorer (line 14-19) | use-hivemind, use-hivemind-context-integrity, hivemind-codemap, research-delegation, hivemind-research-tools, use-hivemind-git-memory | research-delegation, context-map, hivemind-codemap, hivemind-research | **PARTIAL** — config has `hivemind-research-tools` and `use-hivemind-context-integrity` not in bundle. Injection has `context-map` and `hivemind-research` not in config. |

### Findings

| # | Finding | File | Line | Evidence |
|---|---------|------|------|----------|
| 1 | **CRITICAL: resolveSkillBundle always returns []** | `src/plugin/skill-exposure-map.ts` | 77-81 | Because initSkillInjection never runs, cachedConfig is always null |
| 2 | renderSkillFocusBlock receives empty array | `src/plugin/skill-focus-renderer.ts` | 32-53 | When skills=[], block is minimal (no skill_X= lines) |
| 3 | Agent config frontmatter permissions are SEPARATE from injection system | `.opencode/agents/*.md` | skill: section | The `skill:` permissions in agent YAML control what the skill tool can load, not what gets injected into context |
| 4 | Skill names in agent configs don't consistently match injection bundles | — | — | See table above |
| 5 | resolveSessionRole works independently of skill injection | `src/plugin/skill-exposure-map.ts` | 118-146 | Uses hardcoded agent lists, not config-dependent |
| 6 | The skill injection config default bundles reference skill names that may not match on-disk SKILL.md names | `src/shared/skill-injection-loader.ts` | 38-121 | e.g., `git-continuity-memory` — need to verify actual directory name |

### Broken Links

| # | Broken Link | Impact |
|---|------------|--------|
| 1 | Flow 1 broken = Flow 5 broken | The skill injection system feeds this flow. Since initSkillInjection never runs, no skills are ever injected into context. |
| 2 | Agent configs define skill permissions that don't match injection bundles | Even if injection worked, there's a mismatch between what the system would inject and what the agent config allows |

### Conflicts

| # | Conflict | Detail |
|---|---------|--------|
| 1 | Skill names in injection config vs agent config permissions | Different skills in each. Injection config bundles don't include `agent-role-boundary` or `use-hivemind-context-integrity` which are in agent configs. Agent configs don't include `clean-code`, `refactor`, `context-map`, `hivemind-research` which are in injection bundles. |
| 2 | Shared skills (use-hivemind-delegation) in injection config should be in EVERY agent's bundle | But agent configs only allow specific skills in their `skill:` permissions |

---

## Summary: Critical Broken Chains

### 1. initSkillInjection() — THE ROOT CAUSE

**File:** `src/plugin/opencode-plugin.ts`
**Issue:** `initSkillInjection()` is defined in `skill-exposure-map.ts` (line 50) but NEVER called from `opencode-plugin.ts`. The plugin imports `resolveDefaultAgent` (line 33) but not `initSkillInjection`.
**Impact:** The entire skill injection system is dormant. `cachedConfig` is always null. `resolveSkillBundle()` always returns `[]`. No skills are ever injected into any agent's context.

### 2. config/skill-injection.json — Missing File

**Path:** `{projectRoot}/config/skill-injection.json`
**Issue:** The `config/` directory doesn't exist. The fallback `buildDefaultConfig()` in skill-injection-loader.ts would handle this, but it's never invoked because initSkillInjection is never called.

### 3. hm-init/hm-doctor/hm-setting — All Placeholders

All three hivefiver tools are placeholder implementations:
- hm-init: detects project state, proposes changes, never writes
- hm-doctor: basic existsSync checks, never calls validateSkillNames() or paths.ts
- hm-setting: validates config, proposes changes, never writes, never calls context.ask()

### 4. Agent Config vs Injection Bundle Mismatch

Agent `.md` files define skill permissions that don't align with what the injection system would inject (if it worked). This means even after fixing Flow 1, there would be permission conflicts.

### 5. applyConfigUpdate() — Dead Code

`src/shared/config-groups.ts` line 160 defines `applyConfigUpdate()` but it's never called by any tool. The hm-setting tool only validates, never applies.

---

## Structure Map

```
src/
├── plugin/
│   ├── opencode-plugin.ts          ← Entry point (assembly only)
│   ├── skill-exposure-map.ts       ← Skill bundle resolution + session role
│   ├── messages-transform-adapter.ts ← Hook adapter, calls resolveSkillBundle
│   ├── skill-focus-renderer.ts     ← Renders <available_skills> block
│   ├── synthetic-parts.ts          ← Creates hidden message parts
│   └── injection-store.ts          ← Stores injection payload for diagnostics
├── shared/
│   ├── skill-injection-loader.ts   ← Loads config, validates skill names
│   ├── tiered-injection.ts         ← Two-tier skill resolution logic
│   ├── opencode-skill-registry.ts  ← Scans SKILL.md files on disk
│   ├── config-groups.ts            ← 4 config groups + validation
│   └── paths.ts                    ← Path resolution utilities
├── schema-kernel/
│   ├── agent-records.ts            ← TaskClassification, PhaseClassification Zod schemas
│   ├── skill-injection-records.ts  ← SkillInjectionConfig, SkillValidationResult Zod schemas
│   └── config-records.ts           ← UserPreferences, enums Zod schemas
└── tools/
    ├── hivefiver-init/
    │   ├── tools.ts                ← PLACEHOLDER: hm-init tool
    │   ├── index.ts                ← Barrel export
    │   └── types.ts                ← TypeScript interfaces
    ├── hivefiver-doctor/
    │   ├── tools.ts                ← PLACEHOLDER: hm-doctor tool
    │   ├── index.ts                ← Barrel export
    │   └── types.ts                ← TypeScript interfaces
    └── hivefiver-setting/
        ├── tools.ts                ← READ-ONLY: hm-setting tool (validates but doesn't write)
        ├── index.ts                ← Barrel export
        └── types.ts                ← TypeScript interfaces
```

---

## Git Context

- **HEAD:** `7183335` — "Generated numerous Hivemind session artifacts, error logs, and inspection reports..."
- **Working tree:** 87 modified files, many deleted session JSON files, untracked activity/error directories
- **Key modified source files:** opencode-plugin.ts, skill-exposure-map.ts, messages-transform-adapter.ts, paths.ts, hooks, tools
- **Recently deleted:** `.opencode/commands/hm-doctor.md`, `.opencode/commands/hm-init.md`, `.opencode/commands/hm-settings.md`, `bin/hivemind-tools.cjs`
