# HiveMind Clean Architecture Design
**Date**: 2026-04-03  
**Status**: Blueprint for Refactoring  
**Authority**: Architectural Design Document

## Executive Summary

This document defines a clean, modular architecture that consolidates the best patterns from harness-experiment (~2,300 LOC, clean but not deployed) with necessary features from product-detox (~15,000 LOC, messy but functional), informed by oh-my-openagent proven patterns.

**Key Metrics:**
- **Target LOC**: ~4,000-5,000 (down from 15,000)
- **Core Modules**: 8-10 (down from 50+)
- **Custom Tools**: 5 (down from 11)
- **Max Module Size**: 500 LOC (enforced)
- **Plugin Entry**: <100 LOC (assembly only)

---

## 1. Core Principles

### 1.1 Code vs Configuration Boundary

**MUST BE CODE:**
- Plugin assembly and hook registration
- Tool execution logic with SDK integration
- State persistence and retrieval
- Session lifecycle management
- Delegation routing and packet creation
- Runtime status inspection
- Control plane primitives

**CAN BE CONFIGURATION:**
- Agent definitions (markdown in `agents/`)
- Command bundles (markdown in `commands/`)
- Workflow templates (markdown in `workflows/`)
- Skill definitions (markdown in `skills/`)
- Pressure contracts (YAML/JSON)
- Routing rules (declarative)
- Evidence requirements (JSON schema)

### 1.2 Boundary Definitions

```
┌─────────────────────────────────────────────────────────────┐
│ SHIPPED PRODUCT (npm package)                               │
├─────────────────────────────────────────────────────────────┤
│ dist/                  # Compiled TypeScript                 │
│ ├── plugin/            # Plugin entry point                  │
│ ├── tools/             # Custom tools (5)                    │
│ ├── hooks/             # Event handlers                      │
│ ├── cli/               # Command-line interface              │
│ └── shared/            # Utilities                           │
│                                                               │
│ agents/                # Agent definitions (markdown)         │
│ commands/              # Command bundles (markdown)           │
│ workflows/             # Workflow templates (markdown)        │
│ skills/                # Skill definitions (markdown)         │
│ bin/                   # CLI entry scripts                    │
├─────────────────────────────────────────────────────────────┤
│ SOURCE CODE (development)                                    │
├─────────────────────────────────────────────────────────────┤
│ src/                   # TypeScript source                    │
│ ├── plugin/            # Plugin assembly                     │
│ ├── tools/             # Tool implementations                │
│ ├── hooks/             # Hook implementations                │
│ ├── lifecycle/         # Session management                  │
│ ├── delegation/        # Delegation logic                    │
│ ├── continuity/        # State persistence                   │
│ ├── cli/               # CLI implementation                  │
│ ├── control-plane/     # Control primitives                  │
│ └── shared/            # Shared utilities                    │
├─────────────────────────────────────────────────────────────┤
│ RUNTIME OUTPUT (generated, not shipped)                      │
├─────────────────────────────────────────────────────────────┤
│ .hivemind/             # Runtime state (user's project)      │
│ ├── state/             # Session state                       │
│ ├── trajectory/        # Trajectory records                  │
│ ├── workflow/          # Workflow state                      │
│ ├── delegation/        # Delegation packets                  │
│ └── sessions/          # Session archives                    │
│                                                               │
│ .opencode/             # OpenCode runtime (user's project)   │
│ └── plugins/           # Plugin stub (generated)             │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Single Source of Truth

| Concern | Authority | Location |
|---------|-----------|----------|
| Plugin assembly | `src/plugin/opencode-plugin.ts` | Single file, <100 LOC |
| Tool definitions | `src/tools/*/tools.ts` | One file per tool |
| Hook implementations | `src/hooks/*/index.ts` | One file per hook |
| Session lifecycle | `src/lifecycle/session-manager.ts` | Single manager |
| Delegation logic | `src/delegation/delegation-router.ts` | Single router |
| State persistence | `src/continuity/state-store.ts` | Single store |
| Control primitives | `src/control-plane/primitives.ts` | Registry |
| Path resolution | `src/shared/paths.ts` | Single utility |
| Agent registry | `src/shared/opencode-agent-registry.ts` | Single registry |

### 1.4 CQRS Enforcement

**Tools (Write Side):**
- Create/update/delete state
- Execute commands
- Trigger workflows
- Persist delegation packets
- Modify trajectory records

**Hooks (Read Side):**
- Inject context into messages
- Observe tool execution
- Track session events
- Enrich system prompts
- Monitor state changes

**Plugin (Assembly):**
- Register tools and hooks
- Wire dependencies
- Initialize SDK context
- NO business logic
- NO inline tool definitions

---

## 2. Module Structure

### 2.1 Proposed Hierarchy

```
src/
├── plugin/              # Assembly only (<100 LOC)
│   ├── opencode-plugin.ts          # Main entry
│   ├── context-renderer.ts         # Context injection
│   └── synthetic-parts.ts          # Message helpers
│
├── tools/               # Custom tools (5 tools, ~300 LOC each)
│   ├── runtime/         # Status + command execution
│   ├── delegation/      # Delegation packet creation
│   ├── trajectory/      # Trajectory management
│   ├── task/            # Task tracking
│   └── doc/             # Documentation access
│
├── hooks/               # Event handlers (~200 LOC each)
│   ├── event-handler.ts            # Main event router
│   ├── start-work/                 # Session entry logic
│   ├── soft-governance.ts          # Toast notifications
│   └── sdk-context.ts              # SDK initialization
│
├── lifecycle/           # Session management (~400 LOC)
│   ├── session-manager.ts          # Session CRUD
│   ├── session-state.ts            # State detection
│   └── session-events.ts           # Event emission
│
├── delegation/          # Delegation logic (~400 LOC)
│   ├── delegation-router.ts        # Category routing
│   ├── delegation-packet.ts        # Packet creation
│   └── delegation-store.ts         # Packet persistence
│
├── continuity/          # State persistence (~400 LOC)
│   ├── state-store.ts              # File-based store
│   ├── trajectory-store.ts         # Trajectory records
│   └── workflow-store.ts           # Workflow state
│
├── cli/                 # Command-line interface (~500 LOC)
│   ├── cli.ts                      # Main entry
│   ├── commands/                   # Command handlers
│   └── prompts/                    # Interactive prompts
│
├── control-plane/       # Control primitives (~400 LOC)
│   ├── primitives.ts               # Primitive registry
│   ├── intake.ts                   # User intake
│   └── runtime.ts                  # Runtime dispatch
│
└── shared/              # Utilities (~800 LOC)
    ├── paths.ts                    # Path resolution
    ├── tool-helpers.ts             # Tool utilities
    ├── opencode-agent-registry.ts  # Agent registry
    ├── opencode-skill-registry.ts  # Skill registry
    ├── pressure-contract.ts        # Pressure signals
    └── errors.ts                   # Error types
```

### 2.2 Module Responsibilities

#### Plugin (Assembly Only)
- **LOC**: <100
- **Responsibility**: Wire tools and hooks, initialize SDK context
- **Dependencies**: tools/*, hooks/*, shared/paths
- **Exports**: `HiveMindPlugin` (default export)
- **Rules**: NO business logic, NO inline tools, NO event processing

#### Tools (Write Side)
- **LOC**: ~300 each (5 tools = 1,500 total)
- **Responsibility**: Execute state mutations, command execution
- **Dependencies**: lifecycle/*, delegation/*, continuity/*, shared/*
- **Exports**: `create*Tool()` factory functions
- **Rules**: Use `tool.schema` (Zod), return JSON strings, use `context.*`

#### Hooks (Read Side)
- **LOC**: ~200 each (4 hooks = 800 total)
- **Responsibility**: Context injection, observation, enrichment
- **Dependencies**: lifecycle/*, shared/*
- **Exports**: Hook handler functions
- **Rules**: NO state mutations, NO tool calls, read-only operations

#### Lifecycle (Session Management)
- **LOC**: ~400
- **Responsibility**: Session CRUD, state detection, event emission
- **Dependencies**: continuity/*, shared/*
- **Exports**: `SessionManager` class
- **Rules**: Single source of truth for session state

#### Delegation (Routing & Packets)
- **LOC**: ~400
- **Responsibility**: Category routing, packet creation, persistence
- **Dependencies**: continuity/*, shared/*
- **Exports**: `DelegationRouter`, `createDelegationPacket()`
- **Rules**: Stateless routing, immutable packets

#### Continuity (State Persistence)
- **LOC**: ~400
- **Responsibility**: File-based state store, trajectory/workflow records
- **Dependencies**: shared/paths
- **Exports**: `StateStore`, `TrajectoryStore`, `WorkflowStore`
- **Rules**: Atomic writes, lock files, JSON serialization

#### CLI (Command Interface)
- **LOC**: ~500
- **Responsibility**: Command parsing, interactive prompts, execution
- **Dependencies**: control-plane/*, shared/*
- **Exports**: CLI entry point
- **Rules**: Use `@clack/prompts`, delegate to control-plane

#### Control Plane (Primitives)
- **LOC**: ~400
- **Responsibility**: Primitive registry, intake, runtime dispatch
- **Dependencies**: lifecycle/*, delegation/*, continuity/*
- **Exports**: `findControlPlanePrimitive()`, `executeIntake()`
- **Rules**: Declarative primitives, no hardcoded logic

#### Shared (Utilities)
- **LOC**: ~800
- **Responsibility**: Path resolution, tool helpers, registries, errors
- **Dependencies**: None (leaf module)
- **Exports**: Utility functions and types
- **Rules**: Pure functions, no side effects, no state

### 2.3 Dependency Graph

```
┌─────────────┐
│   plugin    │ (assembly only)
└──────┬──────┘
       │
       ├─────────────┬─────────────┬─────────────┐
       │             │             │             │
   ┌───▼───┐    ┌───▼───┐    ┌───▼───┐    ┌───▼───┐
   │ tools │    │ hooks │    │  cli  │    │control│
   └───┬───┘    └───┬───┘    └───┬───┘    └───┬───┘
       │             │             │             │
       ├─────────────┼─────────────┼─────────────┤
       │             │             │             │
   ┌───▼────────┐ ┌─▼──────────┐ ┌▼────────┐   │
   │ lifecycle  │ │ delegation │ │continuity│   │
   └───┬────────┘ └─┬──────────┘ └┬────────┘   │
       │             │              │            │
       └─────────────┴──────────────┴────────────┘
                      │
                  ┌───▼───┐
                  │shared │ (leaf module)
                  └───────┘
```

**Key Rules:**
- No circular dependencies
- Shared is a leaf module (no dependencies)
- Plugin depends on everything (assembly)
- Tools/hooks/cli depend on lifecycle/delegation/continuity
- Lifecycle/delegation/continuity depend on shared

---

## 3. Feature Consolidation Matrix

### 3.1 Current Features Analysis

| Feature | Files | LOC | Status | Action |
|---------|-------|-----|--------|--------|
| `agent-work-contract/` | 30+ | ~3,000 | Bloated | **SIMPLIFY** → delegation/ |
| `runtime-entry/` | 20+ | ~2,000 | Bloated | **SIMPLIFY** → hooks/start-work/ |
| `session-entry/` | 15+ | ~1,500 | Core | **KEEP** → lifecycle/ |
| `runtime-observability/` | 10+ | ~1,000 | Core | **KEEP** → tools/runtime/ |
| `trajectory/` | 8+ | ~800 | Core | **KEEP** → continuity/ |
| `workflow/` | 8+ | ~800 | Core | **KEEP** → continuity/ |
| `handoff/` | 5+ | ~500 | Core | **KEEP** → delegation/ |
| `doc-intelligence/` | 10+ | ~1,000 | Optional | **ELIMINATE** (use tools/doc/) |

### 3.2 Consolidation Decisions

#### KEEP (Essential Runtime Capability)

**1. Session Entry Logic** (`session-entry/` → `lifecycle/`)
- **Why**: Core session lifecycle management
- **What**: Session state detection, readiness gates, continuity alerts
- **LOC**: ~400 (down from 1,500)
- **Action**: Extract core logic, eliminate redundant classifiers

**2. Runtime Observability** (`runtime-observability/` → `tools/runtime/`)
- **Why**: Essential for status inspection and command execution
- **What**: Runtime status tool, command execution tool
- **LOC**: ~300 (down from 1,000)
- **Action**: Keep tools, eliminate redundant status builders

**3. Trajectory Management** (`trajectory/` → `continuity/trajectory-store.ts`)
- **Why**: Core state persistence
- **What**: Trajectory record CRUD, assessment logic
- **LOC**: ~200 (down from 800)
- **Action**: Consolidate into single store module

**4. Workflow Management** (`workflow/` → `continuity/workflow-store.ts`)
- **Why**: Core state persistence
- **What**: Workflow state CRUD, authority inspection
- **LOC**: ~200 (down from 800)
- **Action**: Consolidate into single store module

**5. Handoff Logic** (`handoff/` → `delegation/`)
- **Why**: Core delegation capability
- **What**: Handoff packet creation, persistence
- **LOC**: ~200 (down from 500)
- **Action**: Merge with delegation router

#### SIMPLIFY (Reduce to Core Essence)

**1. Agent Work Contract** (`agent-work-contract/` → `delegation/`)
- **Current**: 30+ files, ~3,000 LOC
- **Target**: 3 files, ~400 LOC
- **Why**: Massive over-engineering for delegation packets
- **Action**:
  - **KEEP**: Contract schema, packet creation, export tool
  - **ELIMINATE**: Intent classifier, response mode resolver, anchor recorder, chain executor, contract store (use delegation store)
  - **MOVE**: Create/export tools to `tools/delegation/`

**2. Runtime Entry** (`runtime-entry/` → `hooks/start-work/`)
- **Current**: 20+ files, ~2,000 LOC
- **Target**: 5 files, ~400 LOC
- **Why**: Over-complicated session entry routing
- **Action**:
  - **KEEP**: Start-work router, purpose classifier, lineage router
  - **ELIMINATE**: NL-first dispatch (move to hook), redundant classifiers
  - **SIMPLIFY**: Consolidate routing logic into single router

#### ELIMINATE (Redundant or Configurable)

**1. Doc Intelligence** (`doc-intelligence/`)
- **Why**: Redundant with `tools/doc/` and OpenCode's native file reading
- **Action**: Remove entirely, use `tools/doc/` for documentation access

---

## 4. Tool Rationalization

### 4.1 Current Tools (11)

| Tool | Status | Rationale |
|------|--------|-----------|
| `hivemind_runtime_status` | **KEEP** | Essential for runtime inspection |
| `hivemind_runtime_command` | **KEEP** | Essential for command execution |
| `hivemind_agent_work_create_contract` | **MERGE** | Merge into `hivemind_delegation` |
| `hivemind_agent_work_export_contract` | **MERGE** | Merge into `hivemind_delegation` |
| `hivemind_doc` | **KEEP** | Documentation access |
| `hivemind_task` | **KEEP** | Task tracking |
| `hivemind_trajectory` | **KEEP** | Trajectory management |
| `hivemind_handoff` | **MERGE** | Merge into `hivemind_delegation` |
| `declare_intent` | **ELIMINATE** | Use `hivemind_runtime_command` |
| `map_context` | **ELIMINATE** | Use `hivemind_trajectory` |
| `compact_session` | **ELIMINATE** | Use `hivemind_runtime_command` |

### 4.2 Target Tools (5)

#### 1. `hivemind_runtime_status`
- **Location**: `src/tools/runtime/tools.ts`
- **Purpose**: Inspect active runtime attachment, trajectory, workflow, command availability
- **Args**: None
- **Returns**: Runtime status JSON
- **LOC**: ~50

#### 2. `hivemind_runtime_command`
- **Location**: `src/tools/runtime/tools.ts`
- **Purpose**: Execute hm-* command bundles (hm-init, hm-doctor, etc.)
- **Args**: `command`, `arguments`, `userMessage`, profile fields, intake evidence
- **Returns**: Command execution result JSON
- **LOC**: ~100

#### 3. `hivemind_delegation`
- **Location**: `src/tools/delegation/tools.ts`
- **Purpose**: Create, export, and manage delegation packets
- **Args**: `action` (create|export|handoff), packet fields
- **Returns**: Delegation packet JSON
- **LOC**: ~150
- **Consolidates**: `agent_work_create_contract`, `agent_work_export_contract`, `handoff`

#### 4. `hivemind_trajectory`
- **Location**: `src/tools/trajectory/tools.ts`
- **Purpose**: Manage trajectory records (create, update, close, resume)
- **Args**: `action`, `trajectoryId`, trajectory fields
- **Returns**: Trajectory record JSON
- **LOC**: ~100

#### 5. `hivemind_task`
- **Location**: `src/tools/task/tools.ts`
- **Purpose**: Track tasks within workflows
- **Args**: `action` (create|list|complete), `taskId`, task fields
- **Returns**: Task record JSON
- **LOC**: ~100

**Total Tool LOC**: ~500 (down from ~2,000)

### 4.3 Eliminated Tools (Redundant with OpenCode SDK)

| Tool | Replacement |
|------|-------------|
| `declare_intent` | Use `hivemind_runtime_command` with `hm-init` |
| `map_context` | Use `hivemind_trajectory` with `action: update` |
| `compact_session` | Use `hivemind_runtime_command` with `hm-compact` |
| `hivemind_doc` (if redundant) | Use OpenCode's native `read_file` tool |

---

## 5. Deployment Architecture

### 5.1 Build Process

```bash
# 1. Clean previous build
npm run clean

# 2. Compile TypeScript
tsc

# 3. Make CLI executable
chmod +x dist/cli.js

# 4. Run boundary checks
npm run lint:boundary

# 5. Run tests
npm test

# 6. Publish to npm
npm publish
```

### 5.2 Installation Flow

```bash
# User installs package
npm install -g hivemind-context-governance

# Package provides:
# - dist/ (compiled code)
# - agents/ (agent definitions)
# - commands/ (command bundles)
# - workflows/ (workflow templates)
# - skills/ (skill definitions)
# - bin/ (CLI entry scripts)
```

### 5.3 Runtime Initialization

```bash
# User runs initialization
cd /path/to/project
hm-init

# Creates:
# - .hivemind/ (runtime state)
# - .opencode/plugins/hivemind-context-governance.ts (plugin stub)
```

### 5.4 Plugin Loading

```typescript
// .opencode/plugins/hivemind-context-governance.ts (generated)
import HiveMindPlugin from 'hivemind-context-governance/plugin'
export default HiveMindPlugin
```

**OpenCode loads plugin:**
1. Reads `.opencode/plugins/hivemind-context-governance.ts`
2. Imports `HiveMindPlugin` from npm package
3. Calls plugin factory with `PluginInput`
4. Registers tools and hooks

### 5.5 Update Flow

```bash
# User updates package
npm update -g hivemind-context-governance

# Re-sync runtime
hm-doctor --sync

# Updates:
# - dist/ (new compiled code)
# - agents/ (new agent definitions)
# - commands/ (new command bundles)
# - .opencode/plugins/ (regenerated stub if needed)
```

---

## 6. Migration Plan (4 Phases)

### Phase 1: Port Harness-Experiment Core (Week 1)

**Goal**: Establish clean foundation with proven delegation patterns

**Actions**:
1. Create new module structure:
   ```
   src/
   ├── plugin/opencode-plugin.ts (new, <100 LOC)
   ├── delegation/
   │   ├── delegation-router.ts (port from harness)
   │   ├── delegation-packet.ts (port from harness)
   │   └── delegation-store.ts (new)
   ├── lifecycle/
   │   ├── session-manager.ts (new)
   │   └── session-state.ts (port from session-entry)
   └── continuity/
       ├── state-store.ts (new)
       ├── trajectory-store.ts (port from trajectory)
       └── workflow-store.ts (port from workflow)
   ```

2. Port delegation logic:
   - Copy `harness-experiment/src/delegation/` → `src/delegation/`
   - Extract category routing logic
   - Implement delegation store with file-based persistence

3. Port session lifecycle:
   - Extract session state detection from `features/session-entry/`
   - Create `SessionManager` class
   - Implement session CRUD operations

4. Port continuity stores:
   - Extract trajectory logic from `features/trajectory/`
   - Extract workflow logic from `features/workflow/`
   - Implement atomic file writes with lock files

**Deliverables**:
- [ ] Clean module structure created
- [ ] Delegation router ported and tested
- [ ] Session manager implemented
- [ ] Continuity stores implemented
- [ ] Unit tests passing (>80% coverage)

**Success Criteria**:
- All modules <500 LOC
- No circular dependencies
- TypeScript compiles without errors
- Boundary checks pass

**Rollback Plan**:
- Keep `features/` intact during Phase 1
- Use feature flags to toggle between old/new implementations
- Revert commits if tests fail

---

### Phase 2: Eliminate Product-Detox Bloat (Week 2)

**Goal**: Remove redundant features and consolidate tools

**Actions**:
1. Consolidate agent-work-contract:
   ```bash
   # Delete redundant files
   rm -rf src/features/agent-work-contract/engine/
   rm -rf src/features/agent-work-contract/hooks/
   
   # Keep only schema and tools
   mv src/features/agent-work-contract/schema/ src/delegation/schema/
   mv src/features/agent-work-contract/tools/ src/tools/delegation/
   ```

2. Simplify runtime-entry:
   ```bash
   # Keep only start-work router
   mv src/features/runtime-entry/start-work-router.ts src/hooks/start-work/
   
   # Delete redundant classifiers
   rm -rf src/features/runtime-entry/nl-first-dispatch.ts
   rm -rf src/features/runtime-entry/purpose-classifier.ts
   ```

3. Eliminate doc-intelligence:
   ```bash
   # Remove entirely
   rm -rf src/features/doc-intelligence/
   
   # Use tools/doc/ instead
   ```

4. Merge tools:
   ```bash
   # Merge agent-work tools into delegation
   # Merge handoff into delegation
   # Result: 5 tools instead of 11
   ```

**Deliverables**:
- [ ] `features/agent-work-contract/` reduced to 3 files
- [ ] `features/runtime-entry/` reduced to 5 files
- [ ] `features/doc-intelligence/` deleted
- [ ] Tools consolidated from 11 to 5
- [ ] All tests updated and passing

**Success Criteria**:
- Total LOC reduced by 50%
- No feature regressions
- All boundary checks pass
- Plugin still loads correctly

**Rollback Plan**:
- Git branch for Phase 2 changes
- Keep deleted files in `.archive/` temporarily
- Revert if any critical feature breaks

---

### Phase 3: Simplify Plugin Entry (Week 3)

**Goal**: Reduce plugin entry to <100 LOC assembly-only

**Actions**:
1. Extract inline logic from `opencode-plugin.ts`:
   ```typescript
   // BEFORE (269 LOC)
   export const HiveMindPlugin: Plugin = async (input) => {
     // 200+ lines of inline logic
   }
   
   // AFTER (<100 LOC)
   export const HiveMindPlugin: Plugin = async (input) => {
     initSdkContext(input)
     const eventHandler = createEventHandler(input.directory)
     const turnSnapshot = createTurnSnapshotLoader(input.directory)
     
     return {
       event: eventHandler,
       tool: createTools(input.directory),
       'chat.message': createChatMessageHook(turnSnapshot),
       'permission.ask': createPermissionHook(),
       'tool.execute.before': createToolBeforeHook(input.directory),
       'tool.execute.after': createToolAfterHook(input.directory),
       'shell.env': createShellEnvHook(turnSnapshot),
       'command.execute.before': createCommandBeforeHook(turnSnapshot),
       'experimental.chat.messages.transform': createMessagesTransformHook(turnSnapshot),
       'experimental.session.compacting': createCompactionHook(turnSnapshot),
     }
   }
   ```

2. Move hook implementations to `src/hooks/`:
   ```
   src/hooks/
   ├── chat-message-hook.ts
   ├── permission-hook.ts
   ├── tool-before-hook.ts
   ├── tool-after-hook.ts
   ├── shell-env-hook.ts
   ├── command-before-hook.ts
   ├── messages-transform-hook.ts
   └── compaction-hook.ts
   ```

3. Create tool factory:
   ```typescript
   // src/tools/index.ts
   export function createTools(directory: string) {
     return {
       hivemind_runtime_status: createRuntimeStatusTool(directory),
       hivemind_runtime_command: createRuntimeCommandTool(directory),
       hivemind_delegation: createDelegationTool(directory),
       hivemind_trajectory: createTrajectoryTool(directory),
       hivemind_task: createTaskTool(directory),
     }
   }
   ```

**Deliverables**:
- [ ] Plugin entry reduced to <100 LOC
- [ ] All hooks extracted to separate files
- [ ] Tool factory created
- [ ] No inline business logic in plugin
- [ ] All tests passing

**Success Criteria**:
- `opencode-plugin.ts` <100 LOC
- All hooks in separate files
- No business logic in plugin
- Plugin still loads and works correctly

**Rollback Plan**:
- Keep old plugin file as `opencode-plugin.old.ts`
- Revert if plugin fails to load

---

### Phase 4: Establish Clean Boundaries (Week 4)

**Goal**: Enforce architectural boundaries and complete migration

**Actions**:
1. Add boundary enforcement scripts:
   ```bash
   # scripts/check-module-size.sh
   # Fail if any module >500 LOC
   
   # scripts/check-plugin-size.sh
   # Fail if plugin >100 LOC
   
   # scripts/check-circular-deps.sh
   # Fail if circular dependencies detected
   
   # scripts/check-tool-count.sh
   # Fail if >5 tools
   ```

2. Update documentation:
   ```
   docs/
   ├── architecture/
   │   ├── module-structure.md
   │   ├── dependency-graph.md
   │   └── boundary-rules.md
   ├── guides/
   │   ├── adding-tools.md
   │   ├── adding-hooks.md
   │   └── adding-modules.md
   └── migration/
       └── v2-to-v3-migration.md
   ```

3. Delete old features:
   ```bash
   # Archive old features
   mkdir -p .archive/features/
   mv src/features/ .archive/features/
   
   # Update imports
   # Update tests
   # Update documentation
   ```

4. Final cleanup:
   ```bash
   # Remove dead code
   # Remove unused dependencies
   # Update package.json
   # Update README.md
   ```

**Deliverables**:
- [ ] All boundary scripts passing
- [ ] Documentation updated
- [ ] Old features archived
- [ ] Dead code removed
- [ ] Package published to npm

**Success Criteria**:
- Total LOC ~4,000-5,000
- All modules <500 LOC
- Plugin <100 LOC
- 5 tools total
- All tests passing
- All boundary checks passing
- Package successfully published

**Rollback Plan**:
- Keep `.archive/` for 1 month
- Tag release as `v3.0.0-beta`
- Revert to `v2.9.5` if critical issues found

---

## 7. Success Metrics

### 7.1 Quantitative Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Total LOC | ~15,000 | ~4,000-5,000 | 🔴 |
| Core Modules | 50+ | 8-10 | 🔴 |
| Custom Tools | 11 | 5 | 🔴 |
| Plugin LOC | 269 | <100 | 🔴 |
| Max Module LOC | Unlimited | 500 | 🔴 |
| Test Coverage | ~60% | >80% | 🔴 |
| Build Time | ~30s | <10s | 🔴 |
| Package Size | ~5MB | <2MB | 🔴 |

### 7.2 Qualitative Metrics

- [ ] **Clarity**: Module responsibilities are clear and well-documented
- [ ] **Maintainability**: Code is easy to understand and modify
- [ ] **Testability**: All modules have unit tests with >80% coverage
- [ ] **Deployability**: Package installs and works on first try
- [ ] **Extensibility**: New tools/hooks can be added without modifying core
- [ ] **Performance**: Plugin loads in <1s, tools execute in <100ms

### 7.3 Boundary Compliance

- [ ] No circular dependencies
- [ ] Plugin is assembly-only (<100 LOC)
- [ ] Tools use `tool.schema` (Zod)
- [ ] Hooks are read-only (no state mutations)
- [ ] Shared is a leaf module (no dependencies)
- [ ] All modules <500 LOC
- [ ] All tools return JSON strings
- [ ] All paths resolved via `shared/paths.ts`

---

## 8. Risk Assessment

### 8.1 High Risk

**Risk**: Breaking existing workflows during migration  
**Mitigation**: Feature flags, parallel implementations, extensive testing  
**Rollback**: Keep old features in `.archive/` for 1 month

**Risk**: Plugin fails to load after refactoring  
**Mitigation**: Test plugin loading in isolated environment before deployment  
**Rollback**: Revert to previous version, publish hotfix

### 8.2 Medium Risk

**Risk**: Performance regression due to new architecture  
**Mitigation**: Benchmark before/after, optimize hot paths  
**Rollback**: Revert specific modules if performance degrades >20%

**Risk**: Test coverage drops during consolidation  
**Mitigation**: Write tests before deleting code, maintain >80% coverage  
**Rollback**: Restore deleted tests from git history

### 8.3 Low Risk

**Risk**: Documentation becomes outdated  
**Mitigation**: Update docs in same PR as code changes  
**Rollback**: Restore old docs from git history

**Risk**: Boundary checks become too strict  
**Mitigation**: Make checks configurable, allow exceptions with justification  
**Rollback**: Disable specific checks if they block legitimate changes

---

## 9. Appendix

### 9.1 Module Size Breakdown

```
src/plugin/          ~100 LOC  (assembly only)
src/tools/           ~500 LOC  (5 tools × 100 LOC)
src/hooks/           ~800 LOC  (4 hooks × 200 LOC)
src/lifecycle/       ~400 LOC  (session management)
src/delegation/      ~400 LOC  (routing & packets)
src/continuity/      ~400 LOC  (state persistence)
src/cli/             ~500 LOC  (command interface)
src/control-plane/   ~400 LOC  (primitives)
src/shared/          ~800 LOC  (utilities)
─────────────────────────────
Total:              ~4,300 LOC
```

### 9.2 Dependency Matrix

| Module | Depends On |
|--------|------------|
| plugin | tools, hooks, shared |
| tools | lifecycle, delegation, continuity, shared |
| hooks | lifecycle, shared |
| lifecycle | continuity, shared |
| delegation | continuity, shared |
| continuity | shared |
| cli | control-plane, shared |
| control-plane | lifecycle, delegation, continuity, shared |
| shared | (none - leaf module) |

### 9.3 Tool Comparison

| Tool | Current LOC | Target LOC | Reduction |
|------|-------------|------------|-----------|
| runtime_status | 50 | 50 | 0% |
| runtime_command | 100 | 100 | 0% |
| agent_work_create | 200 | - | -100% (merged) |
| agent_work_export | 150 | - | -100% (merged) |
| delegation | - | 150 | +150 (new) |
| doc | 100 | 100 | 0% |
| task | 100 | 100 | 0% |
| trajectory | 100 | 100 | 0% |
| handoff | 100 | - | -100% (merged) |
| declare_intent | 50 | - | -100% (eliminated) |
| map_context | 50 | - | -100% (eliminated) |
| compact_session | 50 | - | -100% (eliminated) |
| **Total** | **1,050** | **500** | **-52%** |

### 9.4 Feature Consolidation Summary

| Feature | Current Files | Target Files | Reduction |
|---------|---------------|--------------|-----------|
| agent-work-contract | 30+ | 3 | -90% |
| runtime-entry | 20+ | 5 | -75% |
| session-entry | 15+ | 3 | -80% |
| runtime-observability | 10+ | 2 | -80% |
| trajectory | 8+ | 1 | -87% |
| workflow | 8+ | 1 | -87% |
| handoff | 5+ | 1 | -80% |
| doc-intelligence | 10+ | 0 | -100% |
| **Total** | **106+** | **16** | **-85%** |

---

## 10. Next Steps

1. **Review & Approve**: Stakeholders review this design document
2. **Create Branch**: `git checkout -b refactor/clean-architecture`
3. **Phase 1**: Port harness-experiment core (Week 1)
4. **Phase 2**: Eliminate product-detox bloat (Week 2)
5. **Phase 3**: Simplify plugin entry (Week 3)
6. **Phase 4**: Establish clean boundaries (Week 4)
7. **Release**: Publish `v3.0.0` to npm

---

**Document Status**: ✅ Complete  
**Next Review**: After Phase 1 completion  
**Owner**: Architecture Team  
**Last Updated**: 2026-04-03