# Config & Governance System — Deep Forensic Research

**Researched:** 2026-06-04
**Domain:** Hivemind Config/Governance Architecture, Schema Kernel, Hook System
**Confidence:** HIGH
**Status:** All findings verified against live source code and phase artifacts

## Summary

The Hivemind config/governance system is **fragmented across two separate config files, three governance mechanisms, and at least five independent reader/consumer modules** — with critical missing connections between them. The primary config (`configs.json`) has a `governance.rules` field with a fully-wired Zod schema and runtime evaluator in `tool-guard-hooks.ts`, but **zero rules are configured in the current `configs.json`**. A completely separate governance config (`governance/config.json`) lives in a different path with a different schema and is consumed by a different engine (`create-governance-session` tool). SR-05 (`config-to-config-realm`) was planned to reconcile these two but was **never implemented** (empty directory). Language governance is the only fully-wired enforcement — it injects a system prompt block for conversation and document language, plus a tool guard reminder for Write/Edit at configured document paths.

**Primary recommendation:** A unification phase (reviving SR-05 or similar) that merges `.hivemind/governance/config.json` into `configs.json.governance`, populates the empty `governance.rules` with content, and propagates behavioral profile settings configuration-drivably instead of the current static lookup table.

**Architectural Impact:** HIGH — there are 3 separate "governance" concepts that don't communicate, 2 config files with no sharing, and 1 irreconciled schema.

---

## 1. History Summary

### Phase BOOT-09: MVP Config Schema + Entry Init (2026-05-11/12)
**Status:** ✅ COMPLETE (3 plans, all executed)
**Files:** `.planning/phases/BOOT-09-mvp-config-schema-entry-init/`

Delivered runtime enforcement of config language fields via two-layer approach:

| Plan | What It Delivered | Key Files |
|------|------------------|-----------|
| BOOT-09-01 | `document_paths` schema field, `isMainSession` type on `HookDependencies`, `createSessionIsMainObserver()` factory | `hivemind-configs.schema.ts`, `hooks/types.ts`, `event-observers.ts` |
| BOOT-09-02 | Language Governance block injection at `output.system[0]` for main sessions, `isMainSession` observer wiring in plugin.ts, `hivemindConfig` passed to tool guard | `core-hooks.ts`, `plugin.ts` |
| BOOT-09-03 | Document language tool guard in `tool.execute.before` for Write/Edit/apply_patch at configured `document_paths` | `tool-guard-hooks.ts` |

**Key decisions locked:**
- D-05: Language block at `output.system[0]` (BEFORE governance block)
- D-06: `buildGovernanceBlock()` format is LOCKED — no modifications
- D-07: Language block uses header + CRITICAL + MUST + override
- D-08/09/10: `document_paths` schema as flat string array, default `[".hivemind/planning/"]`
- D-11: Two-layer enforcement (system prompt + tool guard)
- D-12: Tool guard is pre-execution instruction reminder (NOT content validation)

**Explicitly deferred (out of scope):**
- Mode enforcement (`delegationMode`, `guardrailLevel`, `toolAccessPattern`, `skillFilter`) — deferred to WS-4
- `user_expert_level` enforcement
- Per-path/per-document language override
- All other config fields (parallelization, atomic_commit, workflow toggles, delegation_systems)

### Phase 45: OpenCode SDK Permission Boundary (2026-04-27)
**Status:** ✅ COMPLETE
**Files:** `.planning/archive/2026-05-07/workstreams/milestone/phases/45-opencode-sdk-permission-boundary/`

| Deliverable | Detail |
|-------------|--------|
| REM-CR-02 | Removed unsupported `permission` forwarding from `session.create` wrappers |
| REM-HIGH-01 | Built prompt-time tool allow/ask maps for delegated sessions |
| Recursive delegation | Denied `delegate-task` and `task` tools in child sessions |
| Fallback policy | Read-only (`read`, `glob`, `grep`) for unknown agent policies |

**Key files:** `session-api.ts`, `session-creator.ts`, `spawn-request-builder.ts`, `delegation-manager.ts`

Threats closed: 4/4 (P45-T1 through P45-T4).

### Phase BOOT-05: Config Bootstrap + Defaults (2026-05-08)
**Status:** ✅ COMPLETE (verification)
**Files:** `.planning/phases/BOOT-05-config-bootstrap-defaults/`

Verified that `hivemind init --yes` writes a schema-referenced `.hivemind/configs.json` and `readConfigs()` resolves canonical defaults. **No source code changes** — existing BOOT-02 behavior was confirmed correct.

Acceptance matrix:
| Criterion | Result |
|-----------|--------|
| BOOT05-AC-01: Init writes schema-referenced configs.json | PASS |
| BOOT05-AC-02: Runtime defaults resolve from init output | PASS |
| BOOT05-AC-03: Schema defaults remain represented | PASS |

### Phase 3: Schema Definition & Runtime Configurability (2026-04-10)
**Status:** ✅ COMPLETE (archived)
**Files:** `.planning/archive/2026-05-07/workstreams/milestone/phases/03-schema-definition/`

Architectural foundation. Key governance-related decisions:
- **D-12:** Governance rules must be loadable from config files, not just created programmatically at runtime
- **D-13:** Rule scopes, conditions, and actions must be YAML/JSON-definable
- **D-14:** Follow `src/features/` pattern for domain features

**Critical implication:** D-12/D-13 were partially implemented — the evaluator exists but NO rules are configured.

### Phase 16.5: Agents Builder Configuration Foundation (archived)
**Files:** `.planning/archive/2026-05-07/workstreams/milestone/phases/16.5-agents-builder-configuration-foundation/`

Extensive archived phase (28+ files, 10+ plans). Too deep to fully analyze in this session — covers agent configuration foundation. Listed here for completeness.

### SR-05: Config to Config Realm
**Status:** ❌ NEVER IMPLEMENTED
**Files:** `.planning/phases/SR-05-config-to-config-realm/`

**Directory exists but is EMPTY** (only `.gitkeep`). This was the planned phase to reconcile the two separate config systems — it was scoped but never executed. The exact specifications for SR-05 could not be recovered from available artifacts.

---

## 2. Current Architecture

### 2.1 The Three Governance Systems

| Dimension | File | Schema | Reader | Consumer | Status |
|-----------|------|--------|--------|----------|--------|
| **Tool governance** | `.hivemind/configs.json` → `governance.rules` | `GovernanceConfigsSchema` in `hivemind-configs.schema.ts:279-281` | `readConfigs()` → `getConfig()` → `deps.hivemindConfig` | `evaluateGovernance()` in `tool-guard-hooks.ts:158-174` | ✗ Empty (no rules configured) |
| **Governance config** | `.hivemind/governance/config.json` | `GovernanceConfigSchema` in `config-reader.ts:48-55` | `readGovernanceConfig()` (async) | `create-governance-session` tool, session naming | ✓ Populated with content |
| **Language governance** | System prompt injection | `HivemindConfigsSchema` language fields | `buildGovernanceBlock()` + `handleSystemTransform()` | `core-hooks.ts` system.transform | ✓ Fully active for main sessions |

### 2.2 How Tool Governance Is Supposed to Work

```
configs.json.governance.rules
  → Zod-validated by HivemindConfigsSchema (strip + defaults)
  → Loaded via readConfigs() → cached in config subscriber
  → Passed through HookDependencies.hivemindConfig
  → Consumed in tool-guard-hooks.ts line 158:
    evaluateGovernance(toolName, sessionID, depsHivemindConfig.governance.rules)
  → Returns EvaluationResult with blocked/warnings/escalations
  → Throws Error on block, adds warnings to stateManager
```

**Schema** (`src/schema-kernel/hivemind-configs.schema.ts:266-281`):
```typescript
const GovernanceRuleSchema = z.object({
  id: z.string(),
  condition: z.object({
    toolNames: z.array(z.string()).optional(),
    sessionIDs: z.array(z.string()).optional(),
  }).catchall(z.unknown()),
  action: z.object({
    type: z.string(), // "block", "warn", "escalate"
    escalation: z.record(z.string(), z.unknown()).optional(),
  }).catchall(z.unknown()),
  enabled: z.boolean().default(true),
})
const GovernanceConfigsSchema = z.object({
  rules: z.array(GovernanceRuleSchema).default([]),
})
```

**Evaluator** (`src/features/governance-engine/evaluator.ts:21-106`):
- Fires when `rules.length > 0`
- Matches by toolNames (OR within array) OR sessionIDs (OR within array)
- If both toolNames AND sessionIDs specified → AND (must match both)
- Applies action type: block → throws Error; warn → stateManager.addWarning; escalate → records escalation
- Persists violations to `.hivemind/state/governance-state.json`

**Current status:** The code path is fully wired, but `configs.json` has ZERO governance.rules, so `evaluateGovernance()` always returns an empty result (no-op).

### 2.3 How Separate Governance Config Works

```
.hivemind/governance/config.json
  → Zod-validated by GovernanceConfigSchema (strict — throws on invalid)
  → Read by readGovernanceConfig() (async, file-reading)
  → Consumed by:
    - create-governance-session tool (agent resolution from brief)
    - Session naming validation (validateNamingTitle)
  → NOT passed through deps — loaded on-demand per call
```

**Current content** (`.hivemind/governance/config.json`):
- `version: "1.0.0"`
- `defaultAgent: "hm-codebase-mapper"`
- `naming_standards` — framework/workflow/classification allowed lists
- `agents` — 7 agent entries with descriptions and allowedCommands
- `commands` — 4 command-to-agent mappings (plan, audit, research, gate)
- `templates` — 2 template strings

### 2.4 How Language Governance Works

**Layer 1 (system prompt)** — `core-hooks.ts:75-97`:
- Reads fresh config from disk (not cached)
- Checks `deps.isMainSession?.(sessionID)` — main sessions only
- Builds Language Governance block: `--- Language Governance ---\nCRITICAL: You MUST respond in ${convLang}. ...`
- Uses `unshift()` to inject at `output.system[0]` (BEFORE governance block)

**Layer 2 (tool guard)** — `tool-guard-hooks.ts:176-219`:
- Fires for ALL sessions (including child)
- Write/Edit: checks if `filePath` contains any `document_paths` prefix and ends with `.md`
- Prepends `[LANGUAGE: Write this file in ${docLang} per Language Governance.]` to content/newString
- apply_patch: injects `_languageReminder` in args (no path-specific detection)

### 2.5 How Config Propagates to Behavioral Profile

```
configs.json
  → readConfigs() → getConfig() (cached) / getFreshConfig() (disk)
  → resolveBehavioralProfile():
    - config.mode → BehavioralProfiles[mode] (STATIC lookup from profiles.ts)
    - config.user_expert_level → mapLevelToExpertise() → merged.expertise
    - config.conversation_language → language.conversation
    - config.documents_and_artifacts_language → language.documents
    - config.workflow.discuss_mode → discussMode
    - runtime communicationStyle/decisionSpeed → runtime detection (not config)
  → HookDependencies.getBehavioralProfile
  → system.transform injects into output.system
```

**Key finding:** `guardrailLevel`, `delegationMode`, `toolAccessPattern`, and `skillFilter` are **NOT config-driven** — they come from the static `BehavioralProfiles` lookup table in `profiles.ts`.

---

## 3. Gap Analysis

### Gap 1: configs.json.governance.rules — Schema Exists, Evaluator Wired, No Rules Configured

| Aspect | Detail |
|--------|--------|
| What exists | `GovernanceRuleSchema`, `GovernanceConfigsSchema` in `hivemind-configs.schema.ts:266-281` |
| What exists | `evaluateGovernance()` in `evaluator.ts:21-106` — full eval logic |
| What exists | Wire in `tool-guard-hooks.ts:157-174` — calls `evaluateGovernance()` |
| What is MISSING | The current `configs.json` has NO `governance` field |
| Impact | `depsHivemindConfig?.governance?.rules` evaluates to `undefined` → **entire branch skipped** |
| Severity | HIGH — a fully built ship with no captain |

**`src/hooks/guards/tool-guard-hooks.ts:157-158`**:
```typescript
const depsHivemindConfig = deps.hivemindConfig as HivemindConfigs | undefined
if (depsHivemindConfig?.governance?.rules) {
```

**`.hivemind/configs.json` (line 1-30)**: No `governance` field present.

### Gap 2: Two Separate Config Files — No Connection

| Aspect | configs.json | governance/config.json |
|--------|-------------|----------------------|
| Location | `.hivemind/configs.json` | `.hivemind/governance/config.json` |
| Schema | `HivemindConfigsSchema` (lenient, strip) | `GovernanceConfigSchema` (strict, throws) |
| Reader | `readConfigs()` (sync, fallback to defaults) | `readGovernanceConfig()` (async, throws on error) |
| Consumer | hooks, behavioral profile, tools | `create-governance-session` tool, naming validation |
| Sharing | **NONE** | **NONE** |
| SR-05 | Was supposed to reconcile → **EMPTY DIRECTORY** | |

**Impact:** Duplicate configuration surfaces. No unified governance policy. Changes to `.hivemind/governance/config.json` have zero effect on tool execution governance, and vice versa.

### Gap 3: Behavioral Profile — Static, Not Config-Driven

**Current:** `guardrailLevel`, `delegationMode`, `toolAccessPattern`, `skillFilter` come from `BehavioralProfiles` static lookup (`profiles.ts`).

The `HivemindConfigsSchema` has NO fields for these four dimensions. They are locked to the mode selection and cannot be overridden per-session or per-project.

**Current profile map** (`src/routing/behavioral-profile/profiles.ts:26-44`):
```typescript
"expert-advisor":  { guardrailLevel: "moderate", delegationMode: "waiter",  toolAccessPattern: "full",       skillFilter: "all" }
"hivemind-powered": { guardrailLevel: "strict",   delegationMode: "waiter",  toolAccessPattern: "restricted", skillFilter: "curated" }
"free-style":      { guardrailLevel: "minimal",  delegationMode: "disabled", toolAccessPattern: "full",       skillFilter: "all" }
```

**Impact:** Users cannot configure guardrail strictness, delegation strategy, tool access, or skill filtering independently of mode. This was explicitly deferred to WS-4.

### Gap 4: Language Governance — Weak Enforcement

**What's weak:** The document language "enforcement" is an instruction reminder prepended to content, not actual validation:
- Write: `[LANGUAGE: Write this file in en per Language Governance.]\n${content}`
- Edit: prepends to newString
- apply_patch: `_languageReminder` field in args

The agent can easily ignore or remove the reminder. There is NO post-hoc content validation.

**Per SPEC.md:** This was by design — "enforcement is via instruction, not post-hoc validation." But the practical result is weak enforcement.

### Gap 5: WS-4 Deferred Work

The following were explicitly deferred from BOOT-09 to WS-4 (never implemented):
- Mode enforcement (`delegationMode`, `guardrailLevel`, `toolAccessPattern`, `skillFilter`)
- `user_expert_level` runtime enforcement
- Per-path or per-document language override

**There is no evidence in the codebase that WS-4 was ever initiated.**

### Gap 6: Phase 3 D-12/D-13 — Only Partially Implemented

Phase 3 specified:
- D-12: "Governance rules must be loadable from config files, not just created programmatically at runtime"
- D-13: "Rule scopes, conditions, and actions must be YAML/JSON-definable"

**Partially implemented:** The evaluator exists (`evaluator.ts`) and the schema supports toolNames + sessionIDs matching. But:
- No rules are configured
- No mechanism loads `.hivemind/governance/config.json` rules into this pipeline
- Rule conditions are limited to toolNames and sessionIDs — not general condition expressions

---

## 4. Missing Connections

### Connection 1: configs.json.governance.rules → tool guard hooks
- **Exists?** YES — fully wired
- **But:** Empty — zero rules configured

### Connection 2: configs.json → behavioral profile
- **Exists?** PARTIAL — mode, language, discuss_mode, user_expert_level propagate
- **Missing:** guardrailLevel, delegationMode, toolAccessPattern, skillFilter are static

### Connection 3: .hivemind/governance/config.json → configs.json
- **Exists?** NO — completely separate files, schemas, readers
- **Missing:** Any mechanism to propagate governance/config.json agent/command/template config into the unified config pipeline

### Connection 4: Language rules → agent instructions
- **Exists?** PARTIAL — Language Governance block injected into system prompt
- **Missing:** Actual enforcement (post-hoc validation, file content analysis)

### Connection 5: .hivemind/governance/config.json agents → tool permissions
- **Exists?** NO — the `allowedCommands` in governance/config.json are never enforced
- **Missing:** Any runtime enforcement of per-agent command allowlists

### Connection 6: SR-05 → any reconciliation
- **Exists?** NO — SR-05 was never implemented
- **Impact:** No reconciling architecture exists between the two config systems

---

## 5. Evidence Registry

### Config Files

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `.hivemind/configs.json` | 30 | Primary runtime config — NO governance field | [VERIFIED: file read] |
| `.hivemind/governance/config.json` | 67 | Separate governance config — naming, agents, commands | [VERIFIED: file read] |

### Schema

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `src/schema-kernel/hivemind-configs.schema.ts` | 464 | Master schema for configs.json | [VERIFIED: file read] |
| `src/schema-kernel/hivemind-configs.schema.ts:266-277` | 12 | `GovernanceRuleSchema` definition | [VERIFIED: file read] |
| `src/schema-kernel/hivemind-configs.schema.ts:279-281` | 3 | `GovernanceConfigsSchema` with `{rules: []}` default | [VERIFIED: file read] |
| `src/schema-kernel/hivemind-configs.schema.ts:283-303` | 21 | `HivemindConfigsSchema` — governance field with default | [VERIFIED: file read] |
| `src/schema-kernel/hivemind-configs.schema.ts:359-385` | 27 | `readConfigs()` — reads configs.json from disk | [VERIFIED: file read] |

### Config Subscriber

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `src/config/subscriber.ts:41-49` | 9 | `getConfig()` — cached read, first call reads disk | [VERIFIED: file read] |
| `src/config/subscriber.ts:89-91` | 3 | `getFreshConfig()` — bypasses cache, reads disk | [VERIFIED: file read] |

### Tool Guard Hooks (governance wire point)

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `src/hooks/guards/tool-guard-hooks.ts:30-37` | 8 | `ToolGuardDependencies` with `hivemindConfig` | [VERIFIED: file read] |
| `src/hooks/guards/tool-guard-hooks.ts:157-174` | 18 | `evaluateGovernance()` call site — line 158-159 | [VERIFIED: file read] |
| `src/hooks/guards/tool-guard-hooks.ts:176-219` | 44 | Document Language Tool Guard (BOOT-09 Layer 2) | [VERIFIED: file read] |
| `src/hooks/guards/tool-guard-hooks.ts:60-296` | 237 | Full tool guard factory | [VERIFIED: file read] |

### Governance Engine

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `src/features/governance-engine/index.ts` | 14 | Exports createGovernanceSessionTool + evaluateGovernance | [VERIFIED: file read] |
| `src/features/governance-engine/evaluator.ts:21-106` | 86 | `evaluateGovernance()` — rule evaluation engine | [VERIFIED: file read] |
| `src/features/governance-engine/config-reader.ts:103-135` | 33 | `readGovernanceConfig()` — reads SEPARATE gov config | [VERIFIED: file read] |
| `src/features/governance-engine/config-reader.ts:148-168` | 21 | `resolveAgentForBrief()` — agent resolution from brief | [VERIFIED: file read] |
| `src/features/governance-engine/create-governance-session.ts` | 252 | Governance session tool factory | [VERIFIED: file read] |

### Governance Block (language governance)

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `src/hooks/guards/governance-block.ts:89-123` | 35 | `buildGovernanceBlock()` — produces system prompt injection | [VERIFIED: file read] |
| `src/hooks/guards/governance-block.ts:27-31` | 5 | Mode instruction mapping | [VERIFIED: file read] |
| `src/hooks/guards/governance-block.ts:37-43` | 7 | Expertise instruction mapping | [VERIFIED: file read] |
| `src/hooks/guards/governance-block.ts:49-58` | 10 | Trajectory & contract tool instructions (P25.5) | [VERIFIED: file read] |

### Core Hooks (language injection)

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `src/hooks/lifecycle/core-hooks.ts:64-194` | 131 | `handleSystemTransform()` — language block at position 0 | [VERIFIED: file read] |
| `src/hooks/lifecycle/core-hooks.ts:83-98` | 16 | Language Governance block injection (BOOT-09) | [VERIFIED: file read] |
| `src/hooks/lifecycle/core-hooks.ts:100-106` | 7 | Governance block via `buildGovernanceBlock()` | [VERIFIED: file read] |

### Behavioral Profile

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `src/routing/behavioral-profile/resolve-behavioral-profile.ts:56-86` | 31 | `resolveBehavioralProfile()` — config-to-profile propagation | [VERIFIED: file read] |
| `src/routing/behavioral-profile/resolve-behavioral-profile.ts:30-43` | 14 | `mapLevelToExpertise()` — config → expertise mapping | [VERIFIED: file read] |
| `src/routing/behavioral-profile/profiles.ts:26-44` | 19 | Static BehavioralProfiles lookup table | [VERIFIED: file read] |
| `src/routing/behavioral-profile/types.ts:65-87` | 23 | `ResolvedBehavioralProfile` interface | [VERIFIED: file read] |

### Plugin Wiring

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `src/plugin.ts:475-479` | 5 | Config loading at startup | [VERIFIED: file read] |
| `src/plugin.ts:727-730` | 4 | `createSessionIsMainObserver()` + deps wiring | [VERIFIED: file read] |
| `src/plugin.ts:758` | 1 | `createToolGuardHooks` with hivemindConfig | [VERIFIED: file read] |

### Legacy Governance Persistence

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `src/features/governance/persistence.ts:74-95` | 22 | `readGovernanceState()` — reads `.hivemind/state/governance-state.json` | [VERIFIED: file read] |
| `src/features/governance/persistence.ts:111-121` | 11 | `writeGovernanceState()` — atomic write | [VERIFIED: file read] |

### Types

| File | Lines | Purpose | Evidence |
|------|-------|---------|----------|
| `src/shared/types.ts:334-339` | 6 | `GovernanceRule` type | [VERIFIED: file read] |
| `src/shared/types.ts:341-347` | 7 | `GovernanceViolation` type | [VERIFIED: file read] |
| `src/shared/types.ts:349-353` | 5 | `GovernancePersistenceState` type | [VERIFIED: file read] |
| `src/shared/types.ts:355-360` | 6 | `ContinuityStoreFile` with `governance` field | [VERIFIED: file read] |
| `src/hooks/types.ts:25-66` | 42 | `HookDependencies` interface | [VERIFIED: file read] |

### Planning Artifacts

| File | Purpose | Evidence |
|------|---------|----------|
| `.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-SPEC.md` | Locked requirements for language enforcement | [VERIFIED: file read, 164 lines] |
| `.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-CONTEXT.md` | Implementation decisions (D-01 through D-12) | [VERIFIED: file read, 157 lines] |
| `.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-RESEARCH.md` | Research evidence for hook interfaces | [VERIFIED: file read, 813 lines] |
| `.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-01-SUMMARY.md` | Plan 01 execution (schema, types, observer) | [VERIFIED: file read] |
| `.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-02-SUMMARY.md` | Plan 02 execution (language block, plugin wiring) | [VERIFIED: file read] |
| `.planning/phases/BOOT-09-mvp-config-schema-entry-init/BOOT-09-03-SUMMARY.md` | Plan 03 execution (document language tool guard) | [VERIFIED: file read] |
| `.planning/phases/BOOT-05-config-bootstrap-defaults/CONTEXT-2026-05-08.md` | BOOT-05 decision: schema-only + defaults | [VERIFIED: file read] |
| `.planning/phases/BOOT-05-config-bootstrap-defaults/VERIFICATION-2026-05-08.md` | Verification: init writes valid config | [VERIFIED: file read] |
| `.planning/phases/SR-05-config-to-config-realm/` | **EMPTY** — planned but never implemented | [VERIFIED: directory read] |
| `.planning/archive/2026-05-07/workstreams/milestone/phases/45-opencode-sdk-permission-boundary/45-PLAN-2026-04-27.md` | Phase 45 plan | [VERIFIED: file read] |
| `.planning/archive/2026-05-07/workstreams/milestone/phases/45-opencode-sdk-permission-boundary/45-SUMMARY-2026-04-27.md` | Phase 45 completion | [VERIFIED: file read] |
| `.planning/archive/2026-05-07/workstreams/milestone/phases/45-opencode-sdk-permission-boundary/SECURITY.md` | Phase 45 security verification | [VERIFIED: file read] |
| `.planning/archive/2026-05-07/workstreams/milestone/phases/03-schema-definition/03-CONTEXT.md` | Phase 3: D-12/D-13 governance rule requirements | [VERIFIED: file read] |

---

## 6. Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `.hivemind/state/governance-state.json` — violation records | Data migration if governance config structure changes |
| Live service config | No external services | N/A |
| OS-registered state | None | N/A |
| Secrets and env vars | `HIVEMIND_GOVERNANCE_CONFIG_PATH` — can override governance config path | Code edit if path changes |
| Build artifacts | None | N/A |

---

## 7. Common Pitfalls

### Pitfall 1: Silent Default Swallowing
**What goes wrong:** `readConfigs()` silently falls back to defaults if the file is missing or invalid. This means adding a `governance` field with empty `rules` produces the same behavior as having NO field — both result in empty governance. **There is no way to distinguish "not configured" from "configured with no rules."**

### Pitfall 2: Two Config Files, Two Error Strategies
**What goes wrong:** `readConfigs()` (configs.json) silently returns defaults on error. `readGovernanceConfig()` (governance/config.json) THROWS on error. Same type of file, different error handling. A developer fixing a broken configs.json will get different debugging experience than fixing governance/config.json.

### Pitfall 3: `.hivemind/governance/config.json` Is Not Wired Into Tool Pipeline
**What goes wrong:** The `allowedCommands` in `.hivemind/governance/config.json` per-agent configs are documentation-only. They have no runtime enforcement in `tool-guard-hooks.ts` or anywhere else. A developer adding an agent to this file will assume the commands are restricted — but they aren't.

### Pitfall 4: SR-05 Is a Dead End
**What goes wrong:** Anyone discovering the empty `SR-05-config-to-config-realm` directory will assume the config reconciliation is done. It's not. The two systems remain completely separate with no planned remediation.

---

## 8. Assumptions Log

| # | Claim | Section | Risk if Wrong | Source |
|---|-------|---------|---------------|--------|
| 1 | SR-05 was planned to reconcile the two config systems | Missing Connections | MEDIUM — the phase name "config-to-config-realm" strongly implies reconciliation, but no SPEC/PLAN documents exist to confirm | [ASSUMED from phase name] |
| 2 | WS-4 was never initiated | Gap Analysis | LOW — no code or planning artifacts reference WS-4 completion | [VERIFIED: grep for WS-4 in active planning] |
| 3 | No other governance-related config files exist | Evidence Registry | LOW — glob search for `*governance*` in `.planning/archive/` returned only Phase 45 | [VERIFIED: glob search] |
| 4 | The `governance` field default `{rules: []}` was intentionally empty for MVP | History Summary | MEDIUM — BOOT-09 deferred all non-language enforcement to WS-4 | [VERIFIED: BOOT-09-SPEC.md line 109] |
| 5 | Phase 45 tool permission system is unrelated to configs.json governance | Architecture | LOW — Phase 45 operates on delegation (prompt-time tool maps), configs.json governance operates on tool execution | [VERIFIED: Phase 45 SECURITY.md] |

---

## 9. Open Questions

1. **What was SR-05's exact specification?** The directory is empty — no SPEC, no PLAN, no CONTEXT. Recovery from git history might reveal the original scope.

2. **Should WS-4 be revived or folded into a new governance unification phase?** The deferred work (mode enforcement, profile dimensions, language extensions) plus the SR-05 gap could form a single comprehensive phase.

3. **Should `.hivemind/governance/config.json` be merged into `configs.json`?** This would eliminate the duality but requires: (a) extending `HivemindConfigsSchema` with the governance config fields, (b) adding a migration path for existing files, (c) updating `readGovernanceConfig()` consumers.

4. **Should the static `BehavioralProfiles` table be replaced with config-driven overrides?** This would allow `guardrailLevel`, `delegationMode`, `toolAccessPattern`, `skillFilter` to be configured per-project without changing mode.

5. **Should governance rules be populated with content?** The evaluator, schema, and wire are all ready — but no rules exist. What rules should be configured by default?

---

## 10. Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/test | ✓ | >= 20.0.0 | — |
| npm | Dependencies | ✓ | Latest | — |
| OpenCode plugin SDK | Hook system | ✓ (peer dep) | @opencode-ai/plugin >= 1.1.0 | — |
| Zod | Schema validation | ✓ | v4 | — |

---

## 11. Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest |
| Config file | `vitest.config.ts` at project root |
| Quick run command | `npx vitest run tests/hooks/create-tool-guard-hooks.test.ts tests/hooks/governance-block.test.ts tests/schema-kernel/hivemind-configs.schema.test.ts` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Coverage | Test File | Command |
|----------|-----------|---------|
| Language governance block injection | `tests/hooks/create-core-hooks.test.ts` | `npx vitest run tests/hooks/create-core-hooks.test.ts -t "Language"` |
| Document language tool guard | `tests/hooks/create-tool-guard-hooks.test.ts` | `npx vitest run tests/hooks/create-tool-guard-hooks.test.ts` |
| Governance block format | `tests/hooks/governance-block.test.ts` | `npx vitest run tests/hooks/governance-block.test.ts` |
| Config schema validation | `tests/schema-kernel/hivemind-configs.schema.test.ts` | `npx vitest run tests/schema-kernel/hivemind-configs.schema.test.ts` |
| isMainSession observer | `tests/hooks/observers/event-observers.test.ts` | `npx vitest run tests/hooks/observers/event-observers.test.ts` |

### Wave 0 Gaps
- [ ] No tests for `evaluateGovernance()` with actual rules (tests may exist but none exercise the empty-rules no-op path)
- [ ] No integration tests for `.hivemind/governance/config.json` → cross-config consistency
- [ ] No tests proving that empty governance.rules correctly skips governance evaluation

---

## 12. Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | Partial | Governance rules could enforce tool access control, but no rules configured |
| V5 Input Validation | YES | Zod schema validation on both config files |

### Known Threat Patterns
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Tool execution without governance | E (Elevation) | Empty governance.rules means all tools pass governance check |
| Config file corruption | T (Tampering) | `readGovernanceConfig()` throws on corruption (defense-in-depth), `readConfigs()` silently falls back (weaker) |
| Governance rules bypass | E (Elevation) | evaluateGovernance() fires in tool.execute.before — can be bypassed if hook is removed or fails silently |

---

## 13. Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Config schema (configs.json) | Schema Kernel (`hivemind-configs.schema.ts`) | — | Zod validation, defaults, read/write helpers |
| Config caching | Config Subscriber (`config/subscriber.ts`) | — | Lazy-load, cache-per-project, invalidation |
| Tool governance evaluation | Governance Engine (`governance-engine/evaluator.ts`) | Tool Guard Hooks (`tool-guard-hooks.ts`) | evaluateGovernance() called from tool.execute.before |
| Separate governance config | Governance Engine (`governance-engine/config-reader.ts`) | Create Governance Session Tool | Independent file with independent pipeline |
| Language governance (system prompt) | Core Hooks (`core-hooks.ts`) | Governance Block (`governance-block.ts`) | System transform injection at position 0 |
| Document language tool guard | Tool Guard Hooks (`tool-guard-hooks.ts`) | — | Pre-execution reminder for Write/Edit/apply_patch |
| Behavioral profile resolution | Behavioral Profile (`resolve-behavioral-profile.ts`) | Profiles (`profiles.ts`) | Config → mode → static profile → merged output |
| Child session detection | Event Observers (`event-observers.ts`) | Hook Dependencies (`hooks/types.ts`) | isMainSession cache from session.created events |
| Governance violation persistence | Governance Persistence (`governance/persistence.ts`) | — | Atomic write to `.hivemind/state/governance-state.json` |
| Behavioral overrides for delegation | Delegation Manager | Behavioral Profile (`types.ts`) | Per-delegation BehavioralOverrides via RuntimePolicy |

---

## 14. State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Language fields as decorative metadata | Language fields produce enforced block + tool guard | BOOT-09 (2026-05-11) | Two-layer enforcement working for main sessions |
| Governance block at `output.system[0]` | Language block at `output.system[0]`, governance at `[1]` | BOOT-09 | Order change: language frame precedes governance |
| No document path config | `document_paths` array in schema | BOOT-09 | Configurable document output targets |
| Unsorted permission forwarding | Prompt-time tool allow/ask maps | Phase 45 (2026-04-27) | Child sessions have explicit tool permissions |
| No governance rules mechanism | Full evaluator + schema + wire | Phase 3 → current | Evaluator ready but no rules configured |
| One config file | TWO config files (configs.json + governance/config.json) | Unknown (pre-archive) | Fragmented governance surface |

**Next likely state (if SR-05 is revived):** Unified config with merged governance, populated rules, and config-driven behavioral profiles.

---

*Research completed: 2026-06-04*
*Valid until: 2026-07-04 (stable project)*
