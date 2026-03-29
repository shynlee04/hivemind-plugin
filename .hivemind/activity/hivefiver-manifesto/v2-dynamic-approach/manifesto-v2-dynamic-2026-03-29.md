# Hivefiver Module Manifesto V2
## Dynamic Skill + Agent Configuration System

**Created:** 2026-03-29
**Version:** 2.0
**Status:** DRAFT - Research Complete

---

## Executive Summary

This is the updated manifesto based on deep research into:
1. **@json-render** integration for TUI/GUI configuration
2. **Skill auto-registration** mechanism in OpenCode
3. **Skill→Agent→Command** wiring via official opencode.json schema

### Key Discoveries

| Aspect | Finding |
|--------|---------|
| **Skills** | Auto-discovered from `.opencode/skills/` directories via `SKILL.md` frontmatter |
| **Skill Limit** | NO fixed limit - dynamic loading, no `MAX_SKILLS` constant |
| **Skill→Agent Binding** | **NOT** in SKILL.md - 100% config-driven via `permission.skill` patterns |
| **Configuration UI** | **Vercel @json-render/ink** for Terminal UI / **@json-render/react** for GUI |
| **Schema Authority** | Official OpenCode schema at `opencode.ai/config.json` |

---

## Architecture Overview (V2)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Hivefiver Agent                                  │
│  (Interactive Configuration via @json-render TUI/GUI)            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  Skills        │    │  Agents         │    │  Commands      │  │
│  │  (auto-reg)    │    │  (permission)   │    │  (agent map)   │  │
│  │  .opencode/    │◄──►│  opencode.json  │◄──►│  opencode.json  │  │
│  │  skills/        │    │  .opencode/     │    │  .opencode/    │  │
│  │                 │    │  agents/        │    │  commands/     │  │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘  │
│           │                       │                       │           │
│           ▼                       ▼                       ▼           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │         OpenCode Official Schema                          │   │
│  │  https://opencode.ai/config.json                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  @json-render (@json-render/ink for TUI)               │    │
│  │  Interactive: TextInput, Select, MultiSelect, Tabs         │    │
│  │  Display: Box, Text, Table, Card, Metric                  │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Research Results

### 1. @json-render Integration

**Library:** Vercel Labs generative UI framework (13.4K GitHub stars)

| Package | Purpose |
|---------|---------|
| `@json-render/core` | Schema catalog definition, types |
| `@json-render/react` | React renderer for GUI |
| `@json-render/ink` | Terminal UI renderer |

**For Hivefiver TUI:** Use `@json-render/ink` components:
- Interactive: `TextInput`, `Select`, `MultiSelect`, `Tabs`, `ConfirmInput`
- Display: `Box`, `Text`, `Table`, `Card`, `Metric`, `StatusLine`

**Example config flow via Ink:**
```typescript
const configSpec = {
  root: "config-form",
  elements: {
    "config-form": { type: "Box", props: { flexDirection: "column" }},
    "skill-select": { 
      type: "MultiSelect", 
      props: { 
        label: "Select Skills", 
        options: [...discoveredSkills],
        value: { $bindState: "/config/skills" }
      }
    },
    "agent-select": {
      type: "Select",
      props: { label: "Target Agent", options: ["hiveminder", "hivefiver", ...] }
    }
  }
}
```

### 2. Skill Auto-Registration

**Discovery Mechanism:** `src/shared/opencode-skill-registry.ts:88-117`

| Scan Location | Priority |
|--------------|----------|
| `{packageRoot}/.opencode/skills/` | 1 (project) |
| `~/.config/opencode/skills/` | 2 (global) |

**SKILL.md Required Frontmatter:**
```yaml
---
name: use-hivemind-delegation    # REQUIRED
description: Enforce delegation...  # REQUIRED
parent: use-hivemind              # OPTIONAL (hierarchy only)
---
```

**CRITICAL:** SKILL.md does NOT control agent binding. Agent-skill binding is 100% config-driven.

### 3. Skill→Agent Wiring via opencode.json

**Schema Reference:** Official at `https://opencode.ai/config.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  
  // 1. Skill discovery extension
  "skills": {
    "paths": [".hivemind/skills"],  // Custom skill directories
    "urls": []                           // Remote skill URLs
  },
  
  // 2. Global skill access control
  "permission": {
    "skill": {
      "*": "allow",              // Default
      "experimental-*": "ask"     // Patterns allowed
    }
  },
  
  // 3. Per-agent skill permissions
  "agent": {
    "hiveminder": {
      "description": "HiveMind orchestrator",
      "permission": {
        "skill": {
          "internal-*": "allow"   // Agent-specific override
        }
      }
    }
  },
  
  // 4. Commands invoke agents (which use skills)
  "command": {
    "hm-plan": {
      "template": "Use hivemind-planning skill...\nskill({ name: 'hivemind-planning' })",
      "agent": "hiveminder"
    }
  }
}
```

---

## Two-Tier Injection System

**File:** `src/shared/tiered-injection.ts`

| Tier | When | Skills |
|------|------|--------|
| **Tier 1 (Core Init)** | `phase === 'project-initiation'` | `use-hivemind`, `use-hivemind-delegation`, `hivemind-spec-driven` |
| **Tier 2 (Task-Conditional)** | Based on `taskClassification` | `use-hivemind-tdd`, `hivemind-refactor`, `hivemind-system-debug`, etc. |

**Resolution Order:**
1. Shared skills (always)
2. Tier 1 (if init phase)
3. Agent bundle (config-driven)
4. Tier 2 (task-conditional)
5. Purpose-conditional
6. Subsession additions

---

## Implementation Architecture

### Hivefiver Commands

| Command | Function | UI |
|---------|----------|-----|
| **hm-init** | Greenfield/brownfield detection + init `.hivemind/` | Interview via @json-render/ink |
| **hm-doctor** | Diagnose issues + propose fixes | Interactive via @json-render/ink |
| **hm-setting** | Full config management | **TUI/GUI via @json-render/ink** |

### Configuration Flow (hm-setting)

```
User launches hm-setting
    ↓
@json-render/ink renders config TUI
    ├── Skills tab: Discover available skills (auto-scan .opencode/skills/)
    ├── Agents tab: Assign skill permissions per agent
    ├── Commands tab: Configure command templates
    └── Permissions tab: Fine-grained control
    ↓
User makes selections (TextInput, MultiSelect, Tabs)
    ↓
Hivefiver generates opencode.json
    ├── skills.paths ← selected paths
    ├── permission.skill ← skill→agent mapping
    ├── agent.*.permission ← per-agent config
    └── command.* ← command templates
    ↓
Config validated against OpenCode schema
    ↓
Success: Config written to project + global
```

---

## Data Pipeline Trace (Updated)

| Pipeline | Entry | Output |
|----------|-------|--------|
| **Skill Discovery** | `discoverSkills()` in `opencode-skill-registry.ts` | DiscoveredSkill[] registry |
| **Skill Injection** | `messages-transform-adapter.ts` hook | `<available_skills>` XML block |
| **Permission Check** | `permission.skill` patterns in opencode.json | allow/deny/ask decision |
| **Agent Usage** | Agent config + skill tool call | Skill loaded into context |

---

## Files to Modify/Create

### Phase 2: Hivefiver Implementation

| File | Purpose |
|------|---------|
| `src/tools/hivefiver-setting/tui-config-agent.ts` | @json-render/ink renderer for config |
| `src/tools/hivefiver-setting/ui-components.ts` | Reusable TUI components |
| `src/tools/hivefiver-setting/config-generator.ts` | Generate opencode.json from selections |
| `src/tools/hivefiver-setting/schema-validator.ts` | Validate against opencode.ai/config.json |

### Phase 3: Schema Files

| File | Purpose |
|------|---------|
| `config/hivefiver-defaults.json` | Default configuration template |
| `schemas/skill-mapping.schema.json` | Skill→Agent mapping schema |
| `schemas/permission.schema.json` | Permission override schema |

---

## Localization System (5 Languages)

### Language Options

| Code | Language | Native Name | Direction | Status |
|------|----------|-------------|-----------|--------|
| `en` | English | English | LTR | ✅ Supported |
| `vi` | Vietnamese | Tiếng Việt | LTR | ✅ Supported |
| `zh` | Chinese | 中文 | LTR | 🆕 Add |
| `ko` | Korean | 한국어 | LTR | 🆕 Add |
| `ja` | Japanese | 日本語 | LTR | 🆕 Add |

### Dual-Language Configuration

The Hivefiver module requires **two independent language settings**:

#### 1. Communication Language (`user_communication_language`)
- Controls the language used in **Agent↔User interactions**
- Affects: TUI/GUI labels, prompts, error messages, status updates, confirmations
- Applies to: Terminal output, chat messages, interactive prompts
- Default: `en`

#### 2. Document Language (`document_language`)
- Controls the language used in **generated artifacts and documents**
- Affects: README files, commit messages, code comments, JSDoc, PR descriptions, changelogs
- Applies to: Any file output or documentation generated by agents
- Default: `en`

### Configuration Schema Updates

**File:** `src/schema-kernel/config-records.ts`

```typescript
// Current (FREE-FORM STRING - NO VALIDATION)
export const UserPreferences = z.object({
  communication_language: z.string().default('en'),
  document_language: z.string().default('en'),
  // ...
})

// Proposed (ENUM WITH VALIDATION)
export const SupportedLanguage = z.enum(['en', 'vi', 'zh', 'ko', 'ja'])
export type SupportedLanguage = z.infer<typeof SupportedLanguage>

export const UserPreferences = z.object({
  communication_language: SupportedLanguage.default('en'),
  document_language: SupportedLanguage.default('en'),
  // ...
})
```

### Alias Updates

**File:** `src/shared/bootstrap-profile.ts`

```typescript
const LANGUAGE_ALIASES: Record<string, string> = {
  // English
  en: 'en', eng: 'en', english: 'en',
  // Vietnamese
  vi: 'vi', vn: 'vi', vietnamese: 'vi', vietnam: 'vi',
  // Chinese
  zh: 'zh', cn: 'zh', chinese: 'chinese', '中文': 'zh', mandarin: 'zh',
  // Korean
  ko: 'ko', kr: 'ko', korean: 'korean', '한국어': 'ko',
  // Japanese
  ja: 'ja', jp: 'ja', japanese: 'japanese', '日本語': 'ja',
}
```

### TUI Language Selector

**Component:** `@json-render/ink` with `Select` component

```typescript
const languageSelector = {
  type: "Select",
  props: {
    label: t('select_communication_language'), // i18n-aware label
    options: [
      { value: 'en', label: 'English' },
      { value: 'vi', label: 'Tiếng Việt' },
      { value: 'zh', label: '中文' },
      { value: 'ko', label: '한국어' },
      { value: 'ja', label: '日本語' },
    ],
    value: { $bindState: '/config/communication_language' }
  }
}

const documentLanguageSelector = {
  type: "Select",
  props: {
    label: t('select_document_language'),
    options: [/* same options */],
    value: { $bindState: '/config/document_language' }
  }
}
```

### Implementation Tasks

| Task | File | Priority |
|------|------|----------|
| Add `SupportedLanguage` enum to schema | `src/schema-kernel/config-records.ts` | CRITICAL |
| Expand `LANGUAGE_ALIASES` with zh/ko/ja | `src/shared/bootstrap-profile.ts` | CRITICAL |
| Add language detection for zh/ko/ja | `src/features/session-entry/language-resolution.ts` | HIGH |
| Create i18n message files for TUI labels | `src/i18n/{en,vi,zh,ko,ja}.json` | HIGH |
| Update `hm-setting` with language selectors | `src/tools/hivefiver-setting/tui-config-agent.ts` | HIGH |
| Add validation tests | `src/schema-kernel/config-records.test.ts` | HIGH |

### Validation Gates

| Gate | Command |
|------|---------|
| Type check | `npm run typecheck:core` |
| Boundary lint | `npm run lint:boundary` |
| Tests | `npm test` |
| Build | `npm run build` |

---

## References

| Document | Location |
|----------|----------|
| @json-render docs | https://json-render.dev/docs/api/ink |
| OpenCode config schema | https://opencode.ai/config.json |
| OpenCode skills docs | https://opencode.ai/docs/skills/ |
| OpenCode agents docs | https://opencode.ai/docs/agents/ |
| OpenCode commands docs | https://opencode.ai/docs/commands/ |
| Skill registry source | `src/shared/opencode-skill-registry.ts` |
| Tiered injection source | `src/shared/tiered-injection.ts` |

---

**This manifesto reflects the dynamic approach: skills auto-registered, agent binding via opencode.json permissions, configuration via @json-render TUI/GUI.**

**Status: Research Complete - Pending Implementation Authorization**
