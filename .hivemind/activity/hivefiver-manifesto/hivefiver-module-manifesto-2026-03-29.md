# Hivefiver Module Manifesto
## Comprehensive Data Pipeline Trace & Module Responsibilities

**Created:** 2026-03-29
**Version:** 1.0
**Status:** DRAFT - For Planning Authorization

---

## Executive Summary

This manifesto documents the complete investigation of the HiveMind framework's architecture, tracing all data pipelines and identifying module responsibilities for the Hivefiver module implementation. It serves as the authoritative reference for implementing the configuration system with full guardrails.

---

## 1. Build Output Analysis

### 1.1 Dist Directory Structure

```
dist/                              # Compiled output (~38MB)
├── cli.js                         # Main CLI entry point
├── index.js                       # Package exports
├── cli/                           # CLI command handlers
├── commands/                      # Slash command bundles
├── context/                       # Context/prompt packet processing
├── control-plane/                 # Control plane primitives registry
├── core/                          # Trajectory & workflow management
├── delegation/                    # Delegation packets & records
├── features/                      # Feature modules
│   ├── agent-work-contract/       # Contract engine
│   ├── doc-intelligence/          # Document reading
│   ├── event-tracker/             # Event tracking & journaling
│   ├── handoff/                   # Handoff management
│   ├── runtime-entry/             # Init/Doctor/Settings handlers
│   ├── runtime-observability/     # Runtime sync & status
│   ├── session-entry/             # Session intake & gates
│   └── workflow/                  # Task workflow
├── governance/                    # Planning projections
├── hooks/                         # OpenCode plugin hooks (17 hooks)
├── intelligence/                  # Document intelligence
├── plugin/                        # Plugin assembly & skill injection
├── recovery/                      # Recovery engine
├── schema-kernel/                 # Schema records & agent templates
├── sdk-supervisor/                # Diagnostics & health
├── shared/                        # Shared utilities & config
└── tools/                         # Custom tools
    ├── doc/                       # Document tools
    ├── handoff/                   # Handoff tools
    ├── hivefiver-doctor/          # 🔧 Hivefiver doctor tool
    ├── hivefiver-init/            # 🔧 Hivefiver init tool (placeholder)
    ├── hivefiver-setting/         # 🔧 Hivefiver setting tool
    ├── runtime/                   # Runtime command/status tools
    ├── task/                      # Task tools
    └── trajectory/                # Trajectory tools
```

### 1.2 NPM Package Bin Entry Points

| Binary | Source | Purpose |
|--------|--------|---------|
| `hm-init` | `dist/cli.js` | Project initialization |
| `hm-doctor` | `dist/cli.js` | Diagnostics & repair |
| `hm-settings` | `dist/cli.js` | Configuration management |
| `hm-harness` | `dist/cli.js` | Test harness |
| `hivemind` | `dist/cli.js` | Main CLI |

### 1.3 Shipped Assets

```json
// package.json files array
["dist", "bin", "skills", "commands", "agents", "workflows"]
```

---

## 2. Module Responsibilities & Data Pipelines

### 2.1 Entry Points (CLI Layer)

| Module | File | Responsibility | Downstream |
|--------|------|----------------|------------|
| **CLI Router** | `src/cli.ts` | Parses args, routes to command handlers | `command-routing.ts` |
| **Command Routing** | `src/cli/command-routing.ts` | Maps binary aliases to commands | `init.ts`, `doctor.ts`, `settings.ts` |
| **Init Handler** | `src/features/runtime-entry/init.handler.ts` | Bootstraps workflow authority, trajectory ledger | `syncRuntimeSurface()` |
| **Doctor Handler** | `src/features/runtime-entry/doctor.ts` | Repairs recovery state | `syncRuntimeSurface()` |
| **Settings Handler** | `src/features/runtime-entry/settings.ts` | Updates configuration | Intake gates |

### 2.2 Skill Injection Pipeline (Critical Path)

```
opencode-plugin.ts:222 (hook: experimental.chat.messages.transform)
    ↓
messages-transform-adapter.ts:41 (engine)
    ↓
skill-exposure-map.ts:137 ← ⚠️ HARDCODED - ROOT ISSUE
    ↓
skill-focus-renderer.ts:32 (renders <available_skills>)
    ↓
synthetic-parts.ts:12 (wraps as hidden synthetic Part)
    ↓
Injected BEFORE user message (line 170)
```

**Key Files:**
- `src/plugin/skill-exposure-map.ts` — Contains `AGENT_BUNDLES`, `PURPOSE_CONDITIONAL`, `MAX_SKILLS`
- `src/plugin/skill-focus-renderer.ts` — Renders skill XML block
- `src/shared/opencode-skill-registry.ts` — Discovers skills on disk (NOT wired to injection)

### 2.3 Configuration Management

| Module | File | Responsibility |
|--------|------|----------------|
| **Config Groups** | `src/shared/config-groups.ts` | Defines configuration groups (identity-language, expertise-style, governance-automation) |
| **Bootstrap Profile** | `src/shared/bootstrap-profile.ts` | User profile resolution |
| **Intake Gates** | `src/features/session-entry/intake.gates.ts` | Session validation |
| **Profile Resolution** | `src/features/session-entry/profile-resolution.ts` | Resolves user settings |

### 2.4 Hivefiver Tools (Current State)

| Tool | Location | Status | Description |
|------|----------|--------|-------------|
| **hivefiver-init** | `src/tools/hivefiver-init/` | Placeholder | Returns `proposedChanges` without writing |
| **hivefiver-doctor** | `src/tools/hivefiver-doctor/` | Placeholder | Placeholder with scope="all", fix=false |
| **hivefiver-setting** | `src/tools/hivefiver-setting/` | Placeholder | Placeholder with group="all" |

### 2.5 Context & Prompt Pipeline

```
session-entry/intake.ts
    ↓
profile-resolution.ts
    ↓
purpose-classifier.ts
    ↓
prompt-packet/prompt-compiler.ts
    ↓
context-renderer.ts
    ↓
opencode-plugin.ts (injects into chat)
```

### 2.6 Event Tracking Pipeline

```
plugin hooks (event)
    ↓
event-tracker/writers/session-writer.ts
    ↓
event-tracker/classifier/event-classifier.ts
    ↓
writer-adapter.ts
    ↓
.well-known files (session-inspection/, sessions/, events.md)
```

---

## 3. Data Flow Diagrams

### 3.1 Initialization Flow (hm-init)

```
CLI Input (hm-init)
    ↓
cli.ts → command-routing.ts
    ↓
init.ts → init-project.ts
    ↓
init.handler.ts
    ├── bootstrapWorkflowAuthority()
    ├── bootstrapTrajectoryLedger()
    ├── createRecoveryCheckpoint()
    └── syncRuntimeSurface()  ← Creates .opencode/plugins/hivemind-context-governance.ts
    ↓
Output: .hivemind/ directory structure
```

### 3.2 Doctor Flow (hm-doctor)

```
CLI Input (hm-doctor)
    ↓
cli.ts → doctor.ts
    ↓
runDoctorCommand()
    ├── find bundle (command-bundles.ts)
    └── execute via messaging
    ↓
runDoctorHandler()
    ├── repairRecoveryState()
    ├── syncRuntimeSurface()
    └── createCheckpoint()
```

### 3.3 Settings Flow (hm-settings)

```
CLI Input (hm-settings)
    ↓
cli.ts → settings.ts
    ↓
runSettingsCommand()
    ├── resolve intake gates
    └── updateProjectSettings()
    ↓
Config updated in opencode.json
```

### 3.4 Skill Injection Flow

```
User Message → OpenCode
    ↓
experimental.chat.messages.transform hook
    ↓
messages-transform-adapter.ts
    ↓
skill-exposure-map.ts
    ├── resolveSkillBundle(activeAgent, purposeClass, sessionState)
    └── resolveSessionRole(sessionState, activeAgent)
    ↓
skill-focus-renderer.ts ← Renders <available_skills> XML
    ↓
synthetic-parts.ts ← Wraps as hidden Part
    ↓
Prepended before user message ← INJECTION POINT
```

---

## 4. Module Ownership Matrix

| Module Domain | Owner | Key Files | Status |
|--------------|-------|-----------|--------|
| **CLI Entry** | `src/cli.ts` | CLI routing, binary aliases | ✅ ALIVE |
| **Runtime Entry** | `src/features/runtime-entry/` | Init/Doctor/Settings handlers | ✅ ALIVE |
| **Skill Injection** | `src/plugin/` | `skill-exposure-map.ts`, `messages-transform-adapter.ts` | 🔴 BROKEN (11/21 skills missing) |
| **Config Groups** | `src/shared/config-groups.ts` | User preferences, governance, expertise | ✅ EXISTS |
| **Hivefiver Tools** | `src/tools/hivefiver-*/` | Init/Doctor/Setting tools | ⚠️ PLACEHOLDER |
| **Schema Kernel** | `src/schema-kernel/` | Agent templates, config records | ✅ EXISTS |
| **Control Plane** | `src/control-plane/` | Primitive registry, intake gates | ✅ ALIVE |
| **Event Tracking** | `src/features/event-tracker/` | Journaling, diagnostics | ✅ ALIVE |

---

## 5. Configuration Schema Requirements

### 5.1 Localization Support (5 Languages)

| Code | Language | Native Name | Direction | Status |
|------|----------|-------------|-----------|--------|
| `en` | English | English | LTR | ✅ Supported |
| `vi` | Vietnamese | Tiếng Việt | LTR | ✅ Supported |
| `zh` | Chinese | 中文 | LTR | 🆕 Add |
| `ko` | Korean | 한국어 | LTR | 🆕 Add |
| `ja` | Japanese | 日本語 | LTR | 🆕 Add |

### 5.2 Dual-Language Configuration

#### Communication Language (`user_communication_language`)
- Controls **Agent↔User interaction language**
- Affects: TUI/GUI labels, prompts, error messages, status updates
- Default: `en`

#### Document Language (`document_language`)
- Controls **generated artifacts language**
- Affects: README files, commit messages, code comments, JSDoc, PR descriptions
- Default: `en`

### 5.3 Fixed Configuration Values (User Preferences)

| Setting | Type | Purpose | File |
|---------|------|---------|------|
| `user_communication_language` | enum (en/vi/zh/ko/ja) | UI language | `config-groups.ts` |
| `document_language` | enum (en/vi/zh/ko/ja) | Artifact language | `config-groups.ts` |
| `user_expert_level` | enum | Communication style | `config-groups.ts` |
| `governance_level` | 1-4 | Behavior control | `config-groups.ts` |
| `operation_mode` | enum | Autonomy level | `config-groups.ts` |

### 5.2 Conditional Injection Configuration

```typescript
interface SkillInjectionRule {
  agent: string;
  phase: 'initiation' | 'planning' | 'execution' | 'verification';
  task_classification: string;
  mandatory_skills: string[];
  high_likelihood_skills: string[];
}
```

### 5.3 Agent Template Configuration

```typescript
interface AgentConfig {
  name: string;
  runtime_config: {
    permissions: PermissionConfig;
    commands: string[];
    mcp: string[];
    skills: string[];
    custom_tools: string[];
    plugins: string[];
  };
}
```

---

## 6. Known Issues from Prior Investigation

| Issue | Severity | Evidence |
|-------|----------|----------|
| **11/21 skill names missing** | CRITICAL | `skill-exposure-map.ts` hardcodes 21 names |
| **MAX_SKILLS = 7** | HIGH | Policy mandates max 3 |
| **Registry not wired** | HIGH | `opencode-skill-registry.ts` exists but unused |
| **12+ orphaned agent refs** | MEDIUM | Agent prompt files reference deprecated skills |
| **Legacy CLI init broken** | MEDIUM | Need to clean/deprecate false sync assets |

---

## 7. Implementation Requirements

### 7.1 Phase 1: Legacy Cleanup

- [ ] Identify and disable false sync assets in `src/cli/runtime-assets.ts`
- [ ] Deprecate or stub legacy init that conflicts with new approach

### 7.2 Phase 2: Hivefiver Module Scaffold

- [ ] Implement `hivefiver-init/tools.ts` — Greenfield/Brownfield detection + interview
- [ ] Implement `hivefiver-doctor/tools.ts` — Diagnostics, validation, repair
- [ ] Implement `hivefiver-setting/tools.ts` — Interactive configuration wizard

### 7.3 Phase 3: Config Schema Creation

- [ ] Create JSON schema for user preferences (`config-groups.schema.json`)
- [ ] Create JSON schema for skill injection rules (`skill-injection.schema.json`)
- [ ] Create JSON schema for agent bundles (`agent-bundle.schema.json`)
- [ ] Wire `opencode-skill-registry.ts` into skill injection pipeline

### 7.4 Phase 4: TUI/GUI Visualization

- [ ] Use `@json-render/core` and `@json-render/react` (already in dependencies!)
- [ ] Create JSON render components for config visualization
- [ ] Implement skill injection graph visualization

---

## 8. Test Requirements (TDD)

### 8.1 Unit Tests Required

| Test Suite | Files | Priority |
|------------|-------|----------|
| Skill injection validation | `src/shared/skill-injection-loader.test.ts` | HIGH |
| Config group parsing | `src/shared/config-groups.test.ts` | HIGH |
| Hivefiver init tool | `src/tools/hivefiver-init/` | HIGH |
| Hivefiver doctor tool | `src/tools/hivefiver-doctor/` | HIGH |
| Hivefiver setting tool | `src/tools/hivefiver-setting/` | HIGH |

### 8.2 Integration Tests Required

| Test Suite | Scope | Priority |
|------------|-------|----------|
| Skill injection pipeline | Full hook chain | CRITICAL |
| Config persistence | opencode.json read/write | HIGH |
| Agent bundle resolution | End-to-end | HIGH |

---

## 9. Validation Gates

Before any commit:

- [ ] `npm run typecheck:core` passes (0 errors)
- [ ] `npm run lint:boundary` passes all checks
- [ ] All test suites pass: `npm test`
- [ ] Build succeeds: `npm run build`

---

## 10. References

| Document | Location |
|----------|----------|
| Session Investigation | `session-ses_2da9.md` |
| OpenCode Agents Doc | `.sdk-lib/opencode/opencode-agents.md` |
| OpenCode Configs Doc | `.sdk-lib/opencode/opencode-configs.md` |
| OpenCode Commands Doc | `.sdk-lib/opencode/opencode-commands.md` |
| Skill Injection Records | `src/schema-kernel/skill-injection-records.ts` |
| Default Agent Templates | `src/schema-kernel/default-agent-templates.ts` |
| Config Groups | `src/shared/config-groups.ts` |

---

## 11. Next Steps (Pending Authorization)

1. **Confirm Phase 1 scope** — Legacy cleanup requirements
2. **Authorize Phase 2** — Hivefiver implementation (write tests first!)
3. **Authorize Phase 3** — Schema creation and wiring
4. **Authorize Phase 4** — JSON render visualization

**This document serves as the authoritative reference for all Hivefiver module implementation work.**

---

*Generated by: HiveMind Investigation & Synthesis*
*Authority: session-ses_2da9 + full codebase trace*