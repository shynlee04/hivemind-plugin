# Sector J: Scripts & Miscellaneous

**Scan Date**: 2025-01-24
**Files Scanned**: 9 shell scripts, 19 misc lib files, 70+ test files

---

## Script Inventory

| Script | Purpose | When Called |
|--------|---------|-------------|
| `check-docs-ownership-boundary.sh` | Validates that hivefiver/hivemaker/hivehealer agents have correct docs scope | CI validation, pre-commit |
| `check-state-write-boundary.sh` | Blocks direct writes to `.hivemind/state/` from unauthorized code | CI validation |
| `check-agent-registry-parity.sh` | Ensures `agents/*.md` mirrors to `.opencode/agents/` are in sync | CI validation |
| `guard-public-branch.sh` | Blocks sensitive dev-v3 content from being merged to public branch | Pre-merge/PR check |
| `validate-framework.sh` | Comprehensive 6-rule framework validator (agents, skills, commands, workflows, profiles) | CI validation, `pnpm validate` |
| `detect-entry.sh` | Deterministic state detection for entry protocol | Session start, hivefiver init |
| `classify-intent.sh` | Keyword-based intent classification (hivefiver vs hiveminder) | Session start, unknown command |
| `auto-init.sh` | Idempotent minimal bootstrap for HiveMind state | Session bootstrap |
| `check-sdk-boundary.sh` | Ensures `src/lib/` never imports `@opencode-ai` | CI validation |

---

## Validation Boundaries

### Docs Ownership Boundary (`check-docs-ownership-boundary.sh`)

**Enforcement**: Framework vs Implementation split

- **hivefiver** must only own `docs/framework/**` (not broad `docs/**`)
- **hivemaker** must only own `docs/implementation/**`
- **hivehealer** must only own `docs/implementation/**`

**Mechanism**: Extracts YAML frontmatter from agent files and uses ripgrep to validate scope patterns.

### State Write Boundary (`check-state-write-boundary.sh`)

**Enforcement**: No direct writes to `.hivemind/state/`

- Allows read-only references in `.opencode/plugins/hiveops-governance/hooks/{events,compaction}.ts`
- Blocks `writeFileSync`, `writeFile`, `appendFile`, `rename`, `unlink`, `rm` targeting state paths
- All state modifications must go through the `StateManager` abstraction

### SDK Boundary (`check-sdk-boundary.sh`)

**Enforcement**: `src/lib/` must never import `@opencode-ai`

- Core concepts in `src/lib/` must be platform-portable
- Only `src/hooks/` may touch SDK types
- Validates the **SDK = materialization layer** principle

### Agent Registry Parity (`check-agent-registry-parity.sh`)

**Enforcement**: `agents/**` is canonical, `.opencode/agents/**` mirrors

- Checks for missing runtime mirrors
- Detects parity mismatches via `diff -q`
- Reports orphaned runtime-only files

---

## Auto-Init Logic

### `auto-init.sh` — Idempotent Bootstrap

**Flow**:
1. Detect or generate `session_id` from existing state
2. Check state of brain.json, hierarchy.json, profile.json
3. Create missing files with minimal values:
   - `brain.json`: `{session_id, lineage:"unresolved", mode:"exploration"}`
   - `hierarchy.json`: `{trajectory:{status:"awaiting_intent"}}`
   - `profile.json`: `{session_id, agent:"unresolved", lineage:"unresolved", mode:"exploration"}`
4. Uses atomic write pattern (temp file + move)

**Safety**: Safe to run multiple times; never overwrites existing valid state.

---

## Entry Detection

### `detect-entry.sh` — State Detection

**Output**: JSON with exact keys:
```json
{
  "state_exists": true|false,
  "lineage": "hivefiver|hiveminder|unresolved",
  "hierarchy_status": "missing|empty|malformed|present|awaiting_intent|linked",
  "trajectory_status": "missing|empty|malformed|present|awaiting_intent|unknown",
  "entry_condition": "bootstrap_required|classify_required|ready"
}
```

**Entry Condition Logic**:
- `bootstrap_required`: Any required state file is missing/empty/malformed
- `classify_required`: State exists but lineage=unresolved OR trajectory=awaiting_intent
- `ready`: All state present AND lineage resolved AND trajectory linked

### `classify-intent.sh` — Keyword Classification

**Mechanism**: Count keyword matches

| Framework Keywords (hivefiver) | Product Keywords (hiveminder) |
|-------------------------------|------------------------------|
| framework, meta builder, orchestrator, agent, skill, command, plugin, tool, governance, lineage, entry protocol, delegation | feature, bug, fix, ui, frontend, backend, api, database, app, product, implementation, user story, acceptance criteria |

**Resolution**: Higher score wins; tie or zero = unresolved

---

## Misc Lib Inventory

| File | Purpose |
|------|---------|
| `task-authority.ts` | Canonical TODO source from `state/tasks.json` or `graph/tasks.json` |
| `injection-orchestrator.ts` | Per-turn injection budget management with channel priority |
| `skill-loader.ts` | Intent-driven skill resolution (WHAT to load) |
| `skill-registry.ts` | Constraint-based skill resolution from `skills/registry.yaml` |
| `sot-governance.ts` | Source-of-truth governance with pending changes ledger |
| `tool-activation.ts` | Suggests which HiveMind tools are most relevant |
| `tool-names.ts` | Single source of truth for tool name constants |
| `tool-response.ts` | Standardized JSON output for tools |
| `watcher.ts` | Native file system watcher with debouncing |
| `toast-throttle.ts` | Prevents toast noise cascade (cooldown + quota) |
| `logging.ts` | TUI-safe file-based logging |
| `event-bus.ts` | Lightweight in-process pub/sub using EventEmitter |
| `entity-checklist.ts` | Validates required state files exist |
| `doctor-recovery.ts` | Diagnoses and repairs broken session states |
| `auto-commit.ts` | Automatic git commits after tool execution |
| `commit-advisor.ts` | Suggests commit points based on files touched |
| `bridges/ralph-bridge.ts` | Exports HiveMind tasks to Ralph PRD JSON |
| `anchors.ts` | Immutable facts that persist across compactions |
| `hivefiver-integration.ts` | HiveFiver command routing and auto-realignment |
| `intent-clarification.ts` | Low-confidence intent clarification questions |
| `framework-context.ts` | Detects GSD/Spec-kit framework presence |

---

## Task Authority

### `task-authority.ts` — Canonical TODO Source

**Phase Target Contract**:
- `state/tasks.json` is the operational write model
- `graph/tasks.json` is the durable global fallback

**Resolution Priority**:
1. If `state/tasks.json` has tasks → use it
2. Else if `graph/tasks.json` has tasks → convert to manifest format
3. Else → return empty manifest

**Status Normalization**:
- `active` → `in_progress`
- `complete` → `completed`
- Others preserved as-is

---

## Injection Orchestrator

### `injection-orchestrator.ts` — Budget Management

**Channels** (priority order):
1. `core-system` — System prompt injections
2. `core-message` — Message-level injections

**Key Features**:
- **Turn Injection Ledger**: Per-session-turn budget tracking
- **Baseline Allocation**: 60/40 split for bootstrap turns, 50/50 after
- **Channel Priority**: Higher-priority channels reserve budget first
- **TTL**: 15-minute ledger expiration
- **Max Entries**: 256 ledgers before pruning

**Markers Detected**:
- Core-system: `<hivemind>`, `HIVE-MASTER governance active`
- Core-message: `<hivemind_state`, `[SYSTEM ANCHOR:`, `<system-reminder>`, `<hivemind-clarify>`

---

## Skill Loading

### `skill-loader.ts` — Intent-Driven Resolution

**Classified Intents**:
- `framework-meta`: Skills/agents/governance changes
- `product-impl`: Feature/bug work
- `research`: Investigation
- `ambiguous`: Unclear intent

**Universal Required Skills**:
- `entry-resolution`
- `platform-adapter`

**Intent-Specific Mappings**:

| Intent | Required | Conditional | Deferred |
|--------|----------|-------------|----------|
| framework-meta | entry-resolution, platform-adapter | delegation-framework, meta-builder-governance | spec-distillation, research-methodology, ralph-tasking |
| product-impl | entry-resolution, platform-adapter | verification-methodology, evidence-discipline | delegation-framework, spec-distillation |
| research | entry-resolution, platform-adapter, research-methodology | evidence-discipline | delegation-framework, spec-distillation |
| ambiguous | entry-resolution, platform-adapter, context-integrity | (none) | all other skills |

**Context-Driven Promotions**:
- Post-compaction → adds `context-integrity` to required
- Delegation needed → promotes `delegation-framework` to conditional

### `skill-registry.ts` — Constraint-Based Resolution

**Progressive Disclosure Levels**: L0 → L1 → L2 → L3

**Resolution Factors**:
- Disclosure level filtering
- Bundle filtering (`governance-core`, `routing-core`, `planning-core`, etc.)
- Token budget estimation
- Experimental/deprecated status

**Local-First Resolution**:
1. Check `skills/{name}/SKILL.md`
2. Fallback to `.opencode/skills/{name}/SKILL.md`

---

## Tool Activation

### `tool-activation.ts` — Relevance Hints

**Priority Order**:
1. LOCKED session → `hivemind_session` (start)
2. High drift (score < 50, turns >= 5) → `hivemind_session` (update)
3. Long session (turns >= 15) → `hivemind_cycle` (export)
4. No hierarchy → `hivemind_session` (define trajectory)
5. 5+ completed branches → `hivemind_hierarchy` (prune)
6. Missing tree + flat hierarchy exists → `hivemind_hierarchy` (migrate)
7. Post-compaction → `hivemind_inspect` (drift check)

---

## Event Bus

### `event-bus.ts` — In-Process Pub/Sub

**Architecture**: Singleton `EventEmitter` with typed events

**Event Types**:
- File events: `file:created`, `file:modified`, `file:deleted`
- Artifact events: `artifact:spawned`, `plugin:activated`, `plugin:deactivating`
- Codemap events: `codemap:updated`, `codemap:compressed`, `codemap:stale`
- Context events: `context:consolidated`, `context:purged`, `memory:classified`
- Governance events: `pending_change:queued`, `pending_change:verified`

**API**:
- `subscribe(eventType, listener)` → returns unsubscribe function
- `subscribeAll(listener)` → wildcard subscription
- `emitEvent(event)` → typed emission

---

## Doctor Recovery

### `doctor-recovery.ts` — Broken State Healing

**Modes**:
- `report`: Diagnose only
- `repair`: Fix issues

**Issues Detected**:
- `SESSION_MANIFEST_EMPTY_WITH_SESSION_FILES`
- `ACTIVE_MD_BLANK_WITH_BRAIN_SESSION`
- `BRAIN_TRAJECTORY_SESSION_MISMATCH`
- `NO_ACTIVE_SESSION_SELECTION`

**Repair Actions**:
1. Snapshot forensics to `recovery/forensics-{timestamp}/`
2. Rebuild sessions manifest from on-disk files
3. Rewrite `active.md` from canonical state
4. Realign brain/trajectory session IDs
5. Write `recovery/lineage-repair.json` and `recovery/doctor-report.json`

---

## Ralph Bridge

### `bridges/ralph-bridge.ts` — Ralph-TUI Integration

**Purpose**: Convert HiveMind tasks to Ralph PRD JSON format

**Sources**:
1. `state/tasks.json` (primary)
2. `graph/tasks.json` (fallback)

**Conversion**:
- Task → UserStory with dependencies
- Extract acceptance criteria from description text
- Map status: `active` → `in_progress`, `complete` → `completed`
- Preserve `related_entities` (session_id, plan_id, phase_id, etc.)

**Reconciliation**: Drops stale `graph_task_id` references that no longer exist in graph

---

## HiveFiver Integration

### `hivefiver-integration.ts` — Command Router

**Legacy Commands**: hivefiver-start, hivefiver-intake, hivefiver-specforge, etc.

**Canonical Actions**: init, spec, architect, workflow, build, validate, deploy, research, audit, tutor

**Auto-Realignment Decision**:
- Detects slash commands in user message
- Classifies intent (domain, persona, action)
- Recommends skills and workflow
- Builds next-step menu

**Persona Detection**:
- `enterprise_architect`: Compliance/governance keywords
- `floppy_engineer`: Messy/chaotic input signals
- `vibecoder`: Low-tech prompts, beginner signals

**Domain Detection**: dev, marketing, finance, office-ops, hybrid

---

## Test Patterns

### Testing Framework: Node.js built-in `node:test`

**Key Test Categories**:

| Category | Example Files | Focus |
|----------|---------------|-------|
| Skill Loading | `skill-loader.test.ts` | Intent-based skill resolution |
| Tool Gates | `tool-gate.test.ts` | Governance mode enforcement |
| Session Lifecycle | `session-lifecycle-boundary.test.ts` | Boundary warnings |
| Auto-commit | `auto-commit.test.ts` | Git automation logic |
| Governance | `governance-hardening.test.ts` | Hard governance checks |
| Injection | `injection-surface-ownership.test.ts` | Budget management |
| Framework Context | `framework-context.test.ts` | GSD/Spec-kit detection |

**Test Patterns Observed**:
1. **Tmpdir isolation**: `mkdtemp(join(tmpdir(), "hm-test-"))`
2. **State setup/cleanup**: `StateManager` with proper cleanup
3. **Mock shell**: `createMockShell()` for git operations
4. **Context helpers**: Factory functions like `ctx()` for default values
5. **Assert patterns**: Custom `assert()` with pass/fail counting

---

## Cross-Sector Dependencies

### Scripts → Sectors

| Script | Depends On | Affects |
|--------|------------|---------|
| `validate-framework.sh` | agents/, skills/, commands/, workflows/, modules/ | All framework surfaces |
| `check-docs-ownership-boundary.sh` | agents/hivefiver.md, agents/hivemaker.md | Docs ownership |
| `detect-entry.sh` | `.hivemind/state/brain.json`, `hierarchy.json`, `sessions/active/*/profile.json` | Entry protocol |
| `classify-intent.sh` | None (pure function) | Lineage routing |
| `auto-init.sh` | `.hivemind/state/` paths | Bootstrap |

### Lib Files → Sectors

| Lib File | Depends On | Affects |
|----------|------------|---------|
| `task-authority.ts` | `manifest.js`, `graph/reader.js`, `paths.js` | TODO tools |
| `injection-orchestrator.ts` | `budget.js` | Context hooks |
| `skill-loader.ts` | None (pure) | Session-lifecycle hooks |
| `skill-registry.ts` | `schemas/skill-registry.js` | Skill loading |
| `sot-governance.ts` | `manifest.js`, `paths.js`, `event-bus.js`, `graph-nodes.js` | Governance hooks |
| `doctor-recovery.ts` | `paths.js`, `manifest.js` | Recovery CLI |
| `hivefiver-integration.ts` | `graph-io.js`, `graph-nodes.js` | HiveFiver commands |

---

## Knowledge Gaps

### Unclear After Reading

1. **`watcher.ts` usage**: File watcher is exported but not clear which hooks consume it
2. **`toast-throttle.ts` integration**: How do hooks call this? Via what API?
3. **`intent-clarification.ts` `getContextAction`**: References `session_coherence.js` which wasn't scanned
4. **`framework-context.ts` GSD signals**: `STATE.md` and `ROADMAP.md` parsing logic — where are these files defined?
5. **Mandatory Research Gate Skills**: Why are exactly these 5 skills mandatory?
   - hivefiver-persona-routing
   - hivefiver-bilingual-tutor
   - hivefiver-mcp-research-loop
   - hivefiver-skill-auditor
   - hivefiver-domain-pack-router
6. **`doctor-recovery.ts` hardReset mode**: When is this used vs regular repair?
7. **`sot-governance.ts` entity type routing**: `codewiki`, `codemap`, `code-intel`, `repoknowledge` — where are these populated?

---

## Summary

Sector J provides the **runtime infrastructure** for HiveMind:

1. **Scripts** enforce boundaries at CI time (docs ownership, state writes, SDK isolation, agent parity)
2. **Entry detection** provides deterministic state classification for session bootstrap
3. **Task authority** unifies TODO sources with fallback chain
4. **Injection orchestrator** manages context budget per turn
5. **Skill loading** resolves intent to skill sets with deferred loading
6. **Tool activation** suggests relevant tools based on drift/session state
7. **Event bus** enables decoupled pub/sub
8. **Doctor recovery** heals broken session states
9. **Ralph bridge** exports tasks to external tooling
10. **HiveFiver integration** routes commands and auto-realigns intent

The misc lib files are predominantly **pure functions** that implement business logic without I/O, making them testable and composable. The scripts are **validation guards** that enforce architectural boundaries.
