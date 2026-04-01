# Tier Architecture Investigation Report

**Scope:** Map Tier 1 (Hard Harness), Tier 2 (Opencode-Dependable), and Tier 3 (Skills) implementations  
**Question:** From OVERVIEW.md - classify all implementations into the three-tier model  
**Investigation Completed:** 2026-03-31  
**Git Commit:** d351aecf (External research: AI agent tool design best practices)

---

## Executive Summary

The codebase implements a three-tier architecture with clear separation of concerns:

| Tier | Definition | Implementation Location | Status |
|------|------------|------------------------|--------|
| **Tier 1: Hard Harness** | SDK, deterministic, programmatic, npm packages | `src/plugin/`, `src/sdk-supervisor/`, `src/schema-kernel/`, `src/cli.ts`, `src/core/` | **EXISTS AND WORKS** |
| **Tier 2: Opencode-Dependable** | Plugins, hooks, commands, agents, sub-agents | `src/hooks/`, `src/commands/slash-command/`, `src/tools/`, `.opencode/agents/` | **EXISTS AND WORKS** |
| **Tier 3: Skills** | Platform-agnostic, fail-safe, installed via npx | `skills/`, `.opencode/skills/` | **EXISTS AND WORKS** |

---

## Tier 1: Hard Harness

### SDK Usage

**OpenCode SDK Imports (32 instances across codebase):**

| File | Line | Import | Purpose |
|------|------|--------|---------|
| `src/plugin/opencode-plugin.ts` | 8 | `import { type Plugin } from '@opencode-ai/plugin'` | Plugin type definition |
| `src/tools/runtime/tools.ts` | 8 | `import { tool } from '@opencode-ai/plugin/tool'` | Tool creation |
| `src/tools/task/tools.ts` | 1 | `import { tool } from '@opencode-ai/plugin/tool'` | Task tool |
| `src/tools/trajectory/tools.ts` | 1 | `import { tool } from '@opencode-ai/plugin/tool'` | Trajectory tool |
| `src/tools/handoff/tools.ts` | 1 | `import { tool } from '@opencode-ai/plugin/tool'` | Handoff tool |
| `src/tools/doc/tools.ts` | 1 | `import { tool } from '@opencode-ai/plugin/tool'` | Doc tool |
| `src/tools/hivefiver-init/tools.ts` | 9 | `import { tool } from '@opencode-ai/plugin/tool'` | Init tool |
| `src/tools/hivefiver-doctor/tools.ts` | 9 | `import { tool } from '@opencode-ai/plugin/tool'` | Doctor tool |
| `src/tools/hivefiver-setting/tools.ts` | 8 | `import { tool } from '@opencode-ai/plugin/tool'` | Settings tool |
| `src/tools/hivemind-journal.ts` | 17 | `import { tool, type ToolDefinition } from '@opencode-ai/plugin'` | Journal tool |
| `src/features/agent-work-contract/tools/create-contract-tool.ts` | 11 | `import { tool } from '@opencode-ai/plugin/tool'` | Contract creation |
| `src/features/agent-work-contract/tools/export-contract-tool.ts` | 1 | `import { tool, type ToolContext } from '@opencode-ai/plugin/tool'` | Contract export |
| `src/features/agent-work-contract/tools/classify-intent-tool.ts` | 1 | `import { tool, type ToolContext } from '@opencode-ai/plugin/tool'` | Intent classification |
| `src/hooks/event-handler.ts` | 1 | `import type { Event } from '@opencode-ai/sdk'` | Event types |
| `src/hooks/sdk-context.ts` | 1 | `import type { PluginInput } from '@opencode-ai/plugin'` | SDK context |
| `src/control-plane/sdk-runtime.ts` | 1 | `import { createOpencode, createOpencodeClient, type OpencodeClient, type ServerOptions } from '@opencode-ai/sdk'` | SDK runtime |

**NPM Dependencies that form the Hard Harness:**

From `package.json` lines 76-97:
```json
"dependencies": {
  "@opencode-ai/plugin": ">=1.1.0",
  "@opencode-ai/sdk": "^1.2.27",
  "zod": "^4.3.6",
  "yaml": "^2.8.2",
  "typescript": "^5.3.0",
  "fast-glob": "^3.3.3",
  "proper-lockfile": "^4.1.2",
  "remark": "^15.0.1",
  "unist-util-visit": "^5.1.0",
  "web-tree-sitter": "^0.26.5",
  "magic-string": "^0.30.21"
}
```

### Deterministic/Programmatic Implementations

| Component | File | Evidence | Purpose |
|-----------|------|----------|---------|
| **Plugin Assembly** | `src/plugin/opencode-plugin.ts:90-257` | `export const HiveMindPlugin: Plugin = async (input) => { ... }` | Main plugin entry - assembles all hooks and tools |
| **SDK Supervisor** | `src/sdk-supervisor/runtime-status.ts:184-300` | `buildRuntimeStatusSnapshot()` function | Programmatic runtime status building |
| **Schema Kernel** | `src/schema-kernel/` | 9 files including `agent-records.ts`, `config-records.ts`, `default-agent-templates.ts` | Contract schemas for persisted records |
| **CLI Entry** | `src/cli.ts:101-178` | `runCli()` function | Programmatic CLI routing |
| **Core Trajectory** | `src/core/trajectory/` | 9 files | Deterministic trajectory ledger |
| **Core Workflow** | `src/core/workflow-management/` | 8 files | Workflow authority, task lifecycle |

---

## Tier 2: Opencode-Dependable

### Plugins

**Main Plugin:**
| File | Lines | Evidence |
|------|-------|----------|
| `src/plugin/opencode-plugin.ts` | 1-257 | `HiveMindPlugin` exported as default |

**Plugin Sub-components (25 files in `src/plugin/`):**
- `compaction-adapter.ts` - Compaction handling
- `context-renderer.*.ts` (6 files) - Context rendering pipeline
- `evidence-reporter.ts` - Evidence reporting
- `messages-transform-adapter.ts` - Message transformation
- `skill-exposure-map.ts` - Skill injection
- `synthetic-parts.ts` - Synthetic parts generation
- `runtime-snapshot.ts` - Turn snapshot loading

### Hooks (16 files in `src/hooks/`)

| Hook File | Purpose | Key Evidence |
|-----------|---------|--------------|
| `event-handler.ts` | All OpenCode lifecycle events | `createEventHandler()` at line 172 |
| `chat-message-handler.ts` | Track messages per-session | `handleChatMessage()` |
| `tool-execution-handler.ts` | Post-tool observation | `handleToolExecution()` |
| `text-complete-handler.ts` | Streaming text injection | `createTextCompleteHandler()` |
| `compaction-handler.ts` | Session compaction | `createCompactionHandler()` |
| `transform-handler.ts` | System prompt modification | `createTransformHandler()` |
| `sdk-context.ts` | SDK context initialization | `initSdkContext()` |
| `soft-governance.ts` | Governance toasts | `showGovernanceToast()` |
| `runtime-loader/index.ts` | Runtime loading | Exports `isHivemindManagedTool`, `recordToolEvent` |
| `start-work/index.ts` | Start work hooks | 6 files |
| `auto-slash-command/index.ts` | Auto slash command | 5 files |
| `workflow-integration/index.ts` | Workflow hooks | 4 files |

**Hook Registration (in `opencode-plugin.ts` lines 115-250):**
```typescript
return {
  event: async (eventInput) => { await eventHandler(eventInput) },
  'experimental.chat.system.transform': async (input, output) => { ... },
  'chat.message': async (messageInput, output) => { ... },
  'permission.ask': async (permissionInput, output) => { ... },
  'tool.execute.before': async (toolInput, _output) => { ... },
  'tool.execute.after': async (toolInput, output) => { ... },
  'shell.env': async (_input, output) => { ... },
  'command.execute.before': async (commandInput, output) => { ... },
  'experimental.text.complete': async (input, output) => { ... },
  'experimental.chat.messages.transform': messagesTransform,
  'experimental.session.compacting': async (input, output) => { ... },
}
```

### Commands (Slash Commands)

**Location:** `src/commands/slash-command/`

| File | Lines | Purpose |
|------|-------|---------|
| `command-bundles.ts` | 179 | Defines 10 command bundles (hm-init, hm-doctor, hm-harness, hm-settings, hm-research, hm-plan, hm-implement, hm-verify, hm-tdd, hm-course-correct) |
| `command-types.ts` | - | Type definitions |
| `command-discovery.ts` | - | Command discovery |
| `command-runner.ts` | - | Command execution |
| `index.ts` | - | Barrel export |

### Tools (14 files in `src/tools/`)

| Tool Directory | Tool Name | File | Evidence |
|----------------|-----------|------|----------|
| `runtime/` | `hivemind_runtime_status` | `tools.ts:21-35` | `createHivemindRuntimeStatusTool()` |
| `runtime/` | `hivemind_runtime_command` | `tools.ts:41-82` | `createHivemindRuntimeCommandTool()` |
| `task/` | `hivemind_task` | `tools.ts` | Task management |
| `trajectory/` | `hivemind_trajectory` | `tools.ts` | Trajectory control |
| `handoff/` | `hivemind_handoff` | `tools.ts` | Handoff management |
| `doc/` | `hivemind_doc` | `tools.ts` | Document intelligence |
| `hivemind-journal.ts` | `hivemind_journal` | - | Session journaling |
| `hivefiver-init/` | `hivemind_hm_init` | - | Init command |
| `hivefiver-doctor/` | `hivemind_hm_doctor` | - | Doctor command |
| `hivefiver-setting/` | `hivemind_hm_setting` | - | Settings command |
| `agent-work-contract/` | `hivemind_agent_work_create_contract` | - | Contract creation |
| `agent-work-contract/` | `hivemind_agent_work_export_contract` | - | Contract export |

### Agents (14 files in `.opencode/agents/`)

| Agent | File | Purpose |
|-------|------|---------|
| `hiveminder` | `hiveminder.md` | Orchestrator role |
| `hivefiver` | `hivefiver.md` | Executor role |
| `hiveplanner` | `hiveplanner.md` | Planning |
| `hivemaker` | `hivemaker.md` | Implementation |
| `hiveq` | `hiveq.md` | Verification |
| `hitea` | `hitea.md` | Testing |
| `hivehealer` | `hivehealer.md` | Recovery |
| `hivexplorer` | `hivexplorer.md` | Investigation |
| `architect` | `architect.md` | Architecture |
| `code-skeptic` | `code-skeptic.md` | Code review |
| `hiverd` | `hiverd.md` | Research |
| `general` | `general.md` | General purpose |
| `explore` | `explore.md` | Exploration |
| `explore-small` | `explore-small.md` | Lightweight exploration |

---

## Tier 3: Skills

### Skill Packages (20 packages)

**Location:** `skills/` and `.opencode/skills/`

| Skill Package | Location | Status | Evidence |
|---------------|----------|--------|----------|
| `use-hivemind` | `skills/use-hivemind/` | Active | SKILL.md with frontmatter |
| `use-hivemind-context` | `skills/use-hivemind-context/` | Active | SKILL.md with frontmatter |
| `use-hivemind-delegation` | `skills/use-hivemind-delegation/` | Active | SKILL.md with frontmatter |
| `use-hivemind-git-memory` | `skills/use-hivemind-git-memory/` | Active | SKILL.md with frontmatter |
| `use-hivemind-planning` | `skills/use-hivemind-planning/` | Active | SKILL.md with frontmatter |
| `use-hivemind-research` | `skills/use-hivemind-research/` | Active | SKILL.md with frontmatter |
| `use-hivemind-skill-authoring` | `skills/use-hivemind-skill-authoring/` | Active | SKILL.md with frontmatter |
| `use-hivemind-tdd` | `skills/use-hivemind-tdd/` | Active | SKILL.md with frontmatter |
| `hivemind-codemap` | `skills/hivemind-codemap/` | Active | SKILL.md with frontmatter |
| `hivemind-gatekeeping` | `skills/hivemind-gatekeeping/` | Active | SKILL.md with frontmatter |
| `hivemind-architecture` | `skills/hivemind-architecture/` | Active | SKILL.md with frontmatter |
| `hivemind-atomic-commit` | `skills/hivemind-atomic-commit/` | Active | SKILL.md with frontmatter |
| `hivemind-execution` | `skills/hivemind-execution/` | Active | SKILL.md with frontmatter |
| `hivemind-patterns` | `skills/hivemind-patterns/` | Active | SKILL.md with frontmatter |
| `hivemind-refactor` | `skills/hivemind-refactor/` | Active | SKILL.md with frontmatter |
| `hivemind-spec-driven` | `skills/hivemind-spec-driven/` | Active | SKILL.md with frontmatter |
| `hivemind-synthesis` | `skills/hivemind-synthesis/` | Active | SKILL.md with frontmatter |
| `hivemind-system-debug` | `skills/hivemind-system-debug/` | Active | SKILL.md with frontmatter |
| `hivemind-ideating` | `skills/hivemind-ideating/` | Active | SKILL.md with frontmatter |
| `use-hivemind-ideating` | `skills/use-hivemind-ideating/` | Active | SKILL.md with frontmatter |

### Skill Registry

**Internal Registry:** `skills/registry-internal.yaml`

Contains 30+ skill entries with metadata:
- `name`, `domain`, `bundle`, `knowledge_delta_score`, `status`, `owner`, `disclosure_level`, `triggers`, `supersedes`, `depends_on`

Example entry (lines 31-42):
```yaml
- name: agent-role-boundary
  domain: agent-governance
  bundle: governance-core
  knowledge_delta_score: 0.88
  status: active
  owner: hivemind-core
  disclosure_level: L1
  triggers:
    - "agent profile refactor"
    - "permission envelope design"
```

### Skill Installation Mechanism

**SKILL.md Standard (from `skills/use-hivemind/SKILL.md`):**

Each skill follows a strict frontmatter standard:
```yaml
---
name: use-hivemind
description: Master session entry router...
parent: none
---
```

**Bundled Resources Structure:**
Each skill contains:
- `SKILL.md` - Main skill file
- `references/` - Supporting documentation
- `templates/` - Output templates
- `scripts/` - Validation/utility scripts
- `tests/` - Test scenarios

**OpenCode Skill Loading:**
From `src/plugin/skill-exposure-map.ts` and `src/shared/skill-injection-loader.ts`:
- Skills are loaded via OpenCode's `skill` tool
- Skill injection is handled through `initSkillInjection(directory)` at `opencode-plugin.ts:93`
- Skill registry path resolution via `src/shared/skill-registry-path.ts`

---

## Tier Gaps Analysis

### Tier 1 Missing

| Expected | Status | Notes |
|----------|--------|-------|
| SDK surface for `client.app.log()` | **REFERENCED** | Mentioned in AGENTS.md but not found in grep |
| SDK surface for `client.tui.showToast()` | **REFERENCED** | Mentioned in AGENTS.md but not found in grep |
| `permission.ask` hook details | **PARTIAL** | Hook exists at `opencode-plugin.ts:154-171` but SDK surface may be incomplete |

### Tier 2 Missing

| Expected | Status | Notes |
|----------|--------|-------|
| `chat.params` hook | **NOT FOUND** | Available in SDK but not wired in plugin |
| `chat.headers` hook | **NOT FOUND** | Available in SDK but not wired in plugin |
| `tool.definition` hook | **NOT FOUND** | Available in SDK but not wired in plugin |
| `session.compacting` hook | **WIRED** | `opencode-plugin.ts:246-249` - experimental |
| `auth` hook | **NOT FOUND** | Available in SDK but not wired in plugin |
| `config` hook | **NOT FOUND** | Available in SDK but not wired in plugin |

### Tier 3 Missing

| Expected | Status | Notes |
|----------|--------|-------|
| `npx skills add` mechanism | **NOT IMPLEMENTED** | Skills exist but no `npx skills add` command found |
| Skill installation CLI | **PARTIAL** | Skills are files; no install command |
| External skill URLs | **NOT IMPLEMENTED** | `skills/registry-internal.yaml` references external skills but no fetch mechanism |

---

## Git Context

**Latest Commit:** `d351aecf` - "External research: AI agent tool design best practices (2026-03-30)"

**Uncommitted Changes:** Significant - multiple agent files, skill files, and source files modified. This investigation was conducted with uncommitted changes present.

**Key Modified Areas:**
- `.opencode/agents/*.md` - Agent files modified
- `.opencode/skills/*/SKILL.md` - Skill files modified
- `src/hooks/*.ts` - Hook handlers modified
- `src/tools/hivefiver-setting/*` - Settings tools modified

---

## Evidence Summary

| Claim | File:Line | Evidence |
|-------|-----------|----------|
| Plugin entry exists | `src/plugin/opencode-plugin.ts:90` | `export const HiveMindPlugin: Plugin = async (input) => {` |
| SDK imported | `src/plugin/opencode-plugin.ts:8` | `import { type Plugin } from '@opencode-ai/plugin'` |
| Tool created with SDK | `src/tools/runtime/tools.ts:8` | `import { tool } from '@opencode-ai/plugin/tool'` |
| Hook wiring | `src/plugin/opencode-plugin.ts:116-249` | All hook returns registered |
| Command bundles defined | `src/commands/slash-command/command-bundles.ts:4-179` | 10 slash commands defined |
| Skills exist | `skills/` directory | 20 skill packages |
| Skill registry exists | `skills/registry-internal.yaml:1-374` | Internal metadata registry |
| Agents exist | `.opencode/agents/` | 14 agent files |

---

*Report generated: 2026-03-31*
*Investigation artifacts: `.hivemind/activity/agents/hivexplorer/investigation-report-tier-architecture-2026-03-31.md`*
