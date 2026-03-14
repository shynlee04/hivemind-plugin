# HiveMind Ecosystem Architecture Skeleton

> **Generated**: 2026-03-14T01:10:00Z  
> **Synthesis Sources**: opencode-dynamic-context-pruning, opencode-pty, subtask2, opencode-background-agents, opencode-workspace, oh-my-openagent  
> **Purpose**: Address root-cause architecture issues — code-splitting, tool packing, plugins, SDK, context integrity — as an ecosystem, not slices

---

## Core Problem Statement

HiveMind's current architecture suffers from:
1. **GOD code files** (>500 LOC) without intuitive workflows or context engineering
2. **Scattered `.ts` files** without clear module boundaries or packing discipline
3. **Unregulated state emission** from source → dist → runtime artifacts
4. **No ecosystem-level skeleton** — just singular slices fighting each other
5. **Missing context integrity** — polluted state, stale manifests, backup chains

The root cause isn't `.hivemind/` state — it's **what TypeScript code has built into dist and manifested when running npx/bootstrap**.

---

## 1. Target Directory Structure (Post-Refactoring)

```
hivemind-plugin/
├── src/
│   ├── core/                          # Core runtime (pure functions, no side effects)
│   │   ├── session/                   # Session kernel (≤200 LOC per file)
│   │   │   ├── kernel.ts             # Session lifecycle
│   │   │   ├── boundary.ts           # Session boundaries
│   │   │   ├── coherence.ts          # Coherence checking
│   │   │   ├── intent-classifier.ts  # Intent detection
│   │   │   └── index.ts              # Barrel exports
│   │   ├── state/                     # State management
│   │   │   ├── active.ts             # Active state (replaces brain.json)
│   │   │   ├── anchors.ts            # Cross-session anchors
│   │   │   ├── checkpoints.ts        # Gate results
│   │   │   ├── mutation-queue.ts     # Mutation queue (split from 928 LOC)
│   │   │   └── index.ts
│   │   ├── planning/                  # Planning authority
│   │   │   ├── authority.ts
│   │   │   ├── fs.ts                 # Merge plan-fs + planning-fs + fs/planning-ops
│   │   │   ├── validation.ts
│   │   │   └── index.ts
│   │   └── hierarchy/                 # Hierarchy engine (split from 1385 LOC)
│   │       ├── tree.ts               # Tree data structures
│   │       ├── crud.ts               # CRUD operations
│   │       ├── query.ts              # Query operations
│   │       ├── render.ts             # Rendering/output
│   │       └── index.ts
│   │
│   ├── intelligence/                  # Code & document intelligence
│   │   ├── code/                      # Code intelligence
│   │   │   ├── ast/                   # AST operations
│   │   │   │   ├── surgeon.ts
│   │   │   │   ├── signature-extractor.ts  # Split from 821 LOC
│   │   │   │   ├── tree-sitter-loader.ts
│   │   │   │   └── index.ts
│   │   │   ├── scan/                  # Code scanning
│   │   │   │   ├── pattern-search.ts
│   │   │   │   ├── file-scanner.ts
│   │   │   │   ├── knowledge-commits.ts
│   │   │   │   └── index.ts
│   │   │   ├── inject/               # Injection logic
│   │   │   │   ├── selective-injector.ts
│   │   │   │   ├── watch-integration.ts
│   │   │   │   ├── incremental-updater.ts
│   │   │   │   └── index.ts
│   │   │   ├── detectors/            # Detection subsystem
│   │   │   │   ├── binary-detector.ts
│   │   │   │   ├── secret-detector.ts
│   │   │   │   ├── gitignore-filter.ts
│   │   │   │   └── index.ts
│   │   │   ├── codemap/              # Codemap operations
│   │   │   │   ├── compressed-codemap.ts
│   │   │   │   ├── codemap-io.ts
│   │   │   │   ├── token-counter.ts
│   │   │   │   └── index.ts
│   │   │   └── lsp.ts                # IDE integration
│   │   └── doc/                       # Document intelligence (split from 1785 LOC)
│   │       ├── reader.ts             # Read operations (from read-ops.ts)
│   │       ├── writer.ts             # Write operations (from write-ops.ts)
│   │       ├── searcher.ts           # Search operations (new)
│   │       ├── metadata.ts           # Metadata handling (new)
│   │       ├── formats/              # Format handlers
│   │       │   ├── md.ts
│   │       │   ├── yaml.ts
│   │       │   ├── xml.ts
│   │       │   ├── json.ts
│   │       │   └── registry.ts       # Format registry (new)
│   │       ├── safety.ts
│   │       ├── types.ts
│   │       └── index.ts
│   │
│   ├── governance/                    # Governance subsystem
│   │   ├── instruction.ts            # From governance-instruction.ts
│   │   ├── session.ts                # From session-governance.ts
│   │   ├── sot.ts                    # From sot-governance.ts
│   │   ├── task.ts                   # From task-governance.ts
│   │   ├── detection.ts              # From detection.ts (split)
│   │   ├── gatekeeper.ts
│   │   └── index.ts
│   │
│   ├── context/                       # Context management (NEW - from DCP synthesis)
│   │   ├── pruner.ts                 # Context pruning engine
│   │   ├── compressor.ts             # Compression strategies
│   │   ├── nudge.ts                  # Nudge system
│   │   ├── protected.ts              # Protected content patterns
│   │   ├── strategies/               # Pruning strategies
│   │   │   ├── deduplication.ts
│   │   │   ├── supersede-writes.ts
│   │   │   ├── purge-errors.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── delegation/                    # Delegation engine (NEW - from subtask2 + background-agents)
│   │   ├── orchestrator.ts           # Main delegation orchestrator
│   │   ├── waves.ts                  # Delegation wave planning
│   │   ├── results.ts                # Named results ($RESULT[name])
│   │   ├── loop.ts                   # Iterative refinement loops
│   │   ├── background.ts             # Async background delegation
│   │   ├── mutex.ts                  # Concurrency control
│   │   ├── timeout.ts                # Timeout handling
│   │   └── index.ts
│   │
│   ├── recovery/                      # Recovery subsystem
│   │   ├── doctor.ts                 # From doctor-recovery.ts (split)
│   │   ├── session.ts                # Session recovery
│   │   ├── compaction.ts             # Compaction recovery
│   │   └── index.ts
│   │
│   ├── persistence/                   # Persistence layer
│   │   ├── storage.ts                # Storage operations
│   │   ├── rotation.ts               # Backup rotation (NEW)
│   │   ├── cleanup.ts                # Artifact cleanup (NEW)
│   │   ├── migration.ts              # From graph-migrate.ts
│   │   └── index.ts
│   │
│   └── shared/                        # Shared utilities
│       ├── paths.ts                  # From paths.ts + hiveops-paths.ts
│       ├── detection.ts              # Shared detection utilities
│       ├── cognitive.ts              # From cognitive-packer.ts
│       ├── complexity.ts
│       ├── event-bus.ts
│       ├── file-lock.ts
│       ├── logging.ts
│       ├── staleness.ts
│       ├── tool-names.ts
│       ├── tool-response.ts          # Standard tool output
│       └── index.ts
│
├── tools/                             # OpenCode tools (one per file, ≤300 LOC)
│   ├── session/
│   │   ├── hivemind-session.ts       # Core session tool
│   │   ├── hivemind-session-memory.ts
│   │   └── index.ts
│   ├── plan/
│   │   ├── hivemind-plan.ts          # Plan management
│   │   └── index.ts
│   ├── doc/
│   │   ├── hivemind-doc.ts           # Split from 911 LOC into:
│   │   │   ├── reader.ts            # Read operations
│   │   │   ├── writer.ts            # Write operations
│   │   │   └── searcher.ts          # Search operations
│   │   └── index.ts
│   ├── intelligence/
│   │   ├── hivemind-codemap.ts
│   │   ├── hivemind-mesh-pull.ts
│   │   ├── hivemind-read-skeleton.ts
│   │   ├── hivemind-precision-patch.ts
│   │   └── index.ts
│   ├── governance/
│   │   ├── hivemind-anchor.ts
│   │   ├── hivemind-context.ts
│   │   ├── hivemind-cycle.ts
│   │   ├── hivemind-hierarchy.ts
│   │   ├── hivemind-inspect.ts
│   │   ├── hivemind-ideate.ts
│   │   └── index.ts
│   ├── hiveops/                       # HiveOps tools (kept, renamed)
│   │   ├── hiveops-export.ts
│   │   ├── hiveops-gate.ts
│   │   ├── hiveops-sot.ts
│   │   └── index.ts
│   └── index.ts                       # Barrel export
│
├── plugins/                           # OpenCode plugins
│   ├── hivemind-core.ts              # Core plugin (hooks, events)
│   ├── hivemind-context-pruner.ts    # Context pruning plugin (from DCP)
│   ├── hivemind-delegation.ts        # Delegation plugin (from subtask2)
│   └── index.ts
│
├── skills/                            # OpenCode skills
│   ├── hivemind-session-lifecycle/
│   │   └── SKILL.md
│   ├── hivemind-gates/
│   │   └── SKILL.md
│   ├── hivemind-delegation/
│   │   └── SKILL.md
│   └── hivemind-context-pruning/
│       └── SKILL.md
│
├── commands/                          # OpenCode commands
│   ├── hm-init.md
│   ├── hm-doctor.md
│   ├── hm-harness.md
│   └── hm-settings.md
│
├── sdk/                               # HiveMind SDK (public API)
│   ├── session.ts
│   ├── plan.ts
│   ├── governance.ts
│   ├── context.ts
│   └── index.ts
│
└── legacy/                            # Archived legacy code
    ├── tools/
    │   ├── hiveops-export.ts
    │   ├── hiveops-gate.ts
    │   ├── hiveops-sot.ts
    │   └── hiveops-todo.ts
    └── README.md                      # Migration notes
```

---

## 2. Module Packing Rules

### 2.1 File Size Limits (Enforced by CI)

| Module Type | Max LOC | Rationale |
|-------------|---------|-----------|
| Core runtime | 200 | Pure functions, high testability |
| Tools | 300 | Single-responsibility, clear interface |
| Plugins | 400 | Hook orchestration, moderate complexity |
| Intelligence | 250 | Complex algorithms, needs splitting |
| Governance | 250 | Policy enforcement, clear boundaries |
| Delegation | 300 | Async orchestration, moderate complexity |

### 2.2 Module Boundary Rules

1. **No circular dependencies** between top-level modules
2. **Barrel exports required** for every directory
3. **Types in separate files** or co-located with implementation
4. **No side effects at import time** — all side effects in functions
5. **One responsibility per file** — if file does two things, split it

### 2.3 Import Discipline

```typescript
// ✅ GOOD: Explicit barrel import
import { SessionKernel } from '../core/session'
import { ContextPruner } from '../context'

// ❌ BAD: Deep import into implementation
import { SessionKernel } from '../core/session/kernel'
import { deduplicate } from '../context/strategies/deduplication'
```

---

## 3. Context Integrity Architecture

### 3.1 Three-Tier Context System (From DCP Synthesis)

```
┌─────────────────────────────────────────────────────────┐
│ Tier 1: Kernel State (Always Loaded)                    │
│   - hiveneuron.json (~65 LOC)                           │
│   - Active session reference                            │
│   - Current workflow/TODO state                         │
├─────────────────────────────────────────────────────────┤
│ Tier 2: Context Map (On Demand)                         │
│   - hivebrain.md (~50 LOC)                              │
│   - Config files (profile, governance, guardrails)      │
│   - Anchor definitions                                  │
├─────────────────────────────────────────────────────────┤
│ Tier 3: Deep Context (Lazy Load)                        │
│   - Planning artifacts                                  │
│   - Session archives                                    │
│   - Code intelligence                                   │
│   - Research synthesis                                  │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Context Pruning Pipeline (From DCP)

```
1. Assign Message IDs     → m0001, m0002, b1, b2
2. Sync Compression Blocks → Reconcile block state
3. Sync Tool Cache         → Update tool parameter cache
4. Apply Strategies        → Dedup, supersede-writes, purge-errors
5. Inject Nudges           → Context limit awareness
6. Inject Protected Content → Expand subagent results
7. Strip Stale Metadata    → Clean up old tags
8. Persist State           → Save to disk
```

### 3.3 Protected Content Registry

```typescript
const PROTECTED_TOOLS = [
  'task', 'skill', 'todowrite', 'todoread',
  'compress', 'batch', 'plan_enter', 'plan_exit',
  'hiveops_gate', 'hiveops_export', 'hivemind_anchor'
]

const PROTECTED_FILE_PATTERNS = [
  '.hivemind/hiveneuron.json',
  '.hivemind/hivebrain.md',
  '.hivemind/config/*.json'
]
```

### 3.4 Compression Block Architecture

```typescript
interface CompressionBlock {
  blockId: number              // Unique identifier
  active: boolean              // Currently replacing messages?
  compressedTokens: number     // Token savings
  topic: string                // Display label (3-5 words)
  startId/endId: string        // Message range boundaries
  anchorMessageId: string      // Where summary is injected
  summary: string              // The compression summary
  parentBlockIds: number[]     // Parent compression hierarchy
  includedBlockIds: number[]   // Nested blocks consumed
}
```

---

## 4. Delegation Architecture (From subtask2 + background-agents)

### 4.1 Delegation Wave Model

```
Orchestrator (hiveminder)
    │
    ├── Wave 1: Research (parallel)
    │   ├── hivefiver (context synthesis)
    │   └── hiverd (external research)
    │
    ├── Wave 2: Planning (sequential)
    │   └── hiveplanner (plan generation)
    │
    ├── Wave 3: Implementation (parallel)
    │   ├── hivemake (feature A)
    │   └── hivemake (feature B)
    │
    └── Wave 4: Verification (sequential)
        └── hiveq (pass/fail verdict)
```

### 4.2 Named Results System (From subtask2)

```typescript
// Delegation produces named results
await delegate("Analyze auth flow", { result: "auth-analysis" })

// Later delegation consumes named results
await delegate("Fix auth vulnerability", {
  context: "$RESULT[auth-analysis]"
})

// Multi-model comparison
await delegate("Implement feature", {
  result: "impl-sonnet",
  model: "claude-sonnet-4"
})
await delegate("Implement feature", {
  result: "impl-opus",
  model: "claude-opus-4"
})
// Main LLM compares $RESULT[impl-sonnet] vs $RESULT[impl-opus]
```

### 4.3 Orchestrator-Decides Loops (From subtask2)

```typescript
// Instead of self-evaluation, main LLM decides loop continuation
await delegate("Refactor module", {
  loop: {
    condition: "code quality improves",
    max_iterations: 5,
    break_marker: '<subtask2 loop="break"/>',
    continue_marker: '<subtask2 loop="continue"/>'
  }
})
```

### 4.4 Background Delegation (From background-agents)

```typescript
// Fire-and-forget with persistent storage
const delegation = await delegate(prompt, {
  mode: 'background',
  timeout: '15m',
  notify_on_complete: true
})

// Results persisted to disk
// ~/.local/share/opencode/delegations/{projectId}/{id}.md

// Retrieve when ready
const results = await readDelegation(delegation.id)
```

### 4.5 Concurrency Control (From background-agents)

```typescript
// FIFO mutex for serializing async operations
class Mutex {
  async acquire(): Promise<void>
  release(): void
  async runExclusive<T>(fn: () => Promise<T>): Promise<T>
}

// Timeout wrapper for all async operations
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = "Operation timed out"
): Promise<T>
```

---

## 5. Plugin Hook Architecture (From oh-my-openagent)

### 5.1 Hook Factory Pattern

```typescript
// Hooks organized by lifecycle
export function createHooks(ctx: PluginContext) {
  return {
    // Core hooks
    ...createCoreHooks(ctx),
    
    // Session hooks
    ...createSessionHooks(ctx),
    
    // Tool guard hooks
    ...createToolGuardHooks(ctx),
    
    // Transform hooks
    ...createTransformHooks(ctx),
    
    // Continuation hooks
    ...createContinuationHooks(ctx),
  }
}
```

### 5.2 Hook Registration

```typescript
// Central hook type
interface CreatedHooks {
  contextPruner: ContextPrunerHook
  delegationManager: DelegationHook
  sessionRecovery: SessionRecoveryHook
  compactionInjector: CompactionHook
  // ... etc
}

// Conditional dispatch
function dispatchToHooks(hooks: CreatedHooks, event: Event) {
  for (const hook of Object.values(hooks)) {
    if (hook[event.type]) {
      await hook[event.type](event)
    }
  }
}
```

### 5.3 Key Hook Points

| Hook | Purpose | Source |
|------|---------|--------|
| `tool.execute.before` | Pre-execution verification gates | oh-my-openagent |
| `tool.execute.after` | Post-execution audit trail | oh-my-openagent |
| `session.compacting` | Inject governance state before compaction | DCP + background-agents |
| `session.created` | Initialize governance state | DCP |
| `session.idle` | Check pending checkpoints | subtask2 |
| `chat.messages.transform` | Context pruning pipeline | DCP |
| `chat.system.transform` | System prompt injection | DCP + background-agents |
| `command.execute.before` | Slash command routing | subtask2 |
| `experimental.text.complete` | Output cleanup | DCP |

---

## 6. Tool Packaging Pattern (From oh-my-openagent)

### 6.1 Tool Directory Structure

Each tool gets its own directory with standardized structure:

```
tools/
└── delegate-task/
    ├── index.ts              # Entry point
    ├── tools.ts              # Tool implementations
    ├── types.ts              # Type definitions
    ├── executor.ts           # Execution logic
    ├── prompt-builder.ts     # Prompt construction
    ├── model-selection.ts    # Model resolution
    ├── constants.ts          # Constants
    ├── AGENTS.md             # Sub-agent instructions
    └── index.test.ts         # Tests
```

### 6.2 Tool Registration

```typescript
// Tools registered via createToolRegistry
function createToolRegistry(config: Config): ToolRegistry {
  const tools: ToolRegistry = {}
  
  // Core tools
  tools.hivemind_session = createSessionTool()
  tools.hivemind_plan = createPlanTool()
  
  // Conditional tools
  if (config.governance.enabled) {
    tools.hiveops_gate = createGateTool()
    tools.hiveops_export = createExportTool()
  }
  
  // Skill-specific tools (dynamic)
  for (const skill of config.skills) {
    Object.assign(tools, createSkillTools(skill))
  }
  
  return tools
}
```

### 6.3 Tool Size Enforcement

```typescript
// CI check: fail if any tool file exceeds 300 LOC
const TOOL_MAX_LOC = 300

// Pre-commit hook
function checkToolSize(files: string[]): boolean {
  for (const file of files) {
    if (file.startsWith('tools/') && file.endsWith('.ts')) {
      const loc = countLines(file)
      if (loc > TOOL_MAX_LOC) {
        console.error(`${file}: ${loc} LOC exceeds ${TOOL_MAX_LOC} limit`)
        return false
      }
    }
  }
  return true
}
```

---

## 7. Skill System (From oh-my-openagent + opencode-workspace)

### 7.1 Multi-Source Skill Loading

```
Skill Sources (priority order):
1. Project:  .opencode/skills/*/SKILL.md
2. User:     ~/.config/opencode/skills/*/SKILL.md
3. Global:   ~/.local/share/opencode/skills/*/SKILL.md
4. Builtin:  src/skills/*/SKILL.md
```

### 7.2 Skill Structure

```
skills/
└── hivemind-delegation/
    ├── SKILL.md              # Skill instructions
    ├── references/           # Reference materials
    │   ├── patterns.md       # Delegation patterns
    │   └── examples.md       # Usage examples
    └── metadata.ts           # Skill metadata (optional)
```

### 7.3 Skill-Tool Embedding

Skills can declare tools they need:

```markdown
---
name: hivemind-delegation
description: Delegation patterns for HiveMind
allowed_tools:
  - task
  - hiveops_export
  - hivemind_anchor
embedded_tools:
  - path: ./tools/delegation-helper.ts
    name: delegation_helper
---
```

---

## 8. Agent Architecture (From oh-my-openagent)

### 8.1 Agent Types

```typescript
// Agent hierarchy
const AGENT_HIERARCHY = {
  // Primary agents (user-facing)
  hiveminder: 'Orchestrator - plans and delegates',
  hivefiver: 'Setup/maintenance - init, doctor, harness',
  
  // Subagents (task-specific)
  hivemake: 'Executor - implements changes',
  hiveq: 'Verifier - pass/fail verdicts',
  hiverd: 'Researcher - external research',
  hiveplanner: 'Planner - plan generation',
  
  // Specialized
  hivehealer: 'Remediation - debugging and fixes',
  hivexplorer: 'Explorer - codebase investigation',
}
```

### 8.2 Dynamic Agent Prompt Building

```typescript
function buildAgentPrompt(agent: AgentType, context: Context): string {
  const sections = []
  
  // Base identity
  sections.push(AGENT_IDENTITIES[agent])
  
  // Tool permissions
  sections.push(formatToolPermissions(AGENT_TOOLS[agent]))
  
  // Available skills
  sections.push(formatAvailableSkills(context.skills))
  
  // Anti-duplication rules
  sections.push(ANTI_DUPLICATION_RULES)
  
  // Delegation rules
  if (agent === 'hiveminder') {
    sections.push(DELEGATION_RULES)
  }
  
  return sections.join('\n\n')
}
```

### 8.3 Category-Based Routing

```typescript
// Route tasks to specialized agents based on category
const CATEGORY_ROUTING = {
  'research': 'hiverd',
  'implementation': 'hivemake',
  'verification': 'hiveq',
  'planning': 'hiveplanner',
  'debugging': 'hivehealer',
  'exploration': 'hivexplorer',
}
```

---

## 9. Ecosystem Integration Map

### 9.1 Component Interaction Flow

```
User Prompt
    │
    ▼
Entry Resolution (/entry-resolution skill)
    │
    ├──→ Session Bootstrap (hm-init if needed)
    │
    ▼
Intent Classification (session/intent-classifier.ts)
    │
    ▼
Trajectory Construction (delegation/orchestrator.ts)
    │
    ▼
Delegation Waves (delegation/waves.ts)
    │
    ├──→ Context Pruning (context/pruner.ts)
    ├──→ Tool Execution (tools/*)
    ├──→ Plugin Hooks (plugins/*)
    └──→ Skill Loading (skills/*)
    │
    ▼
Verification Gates (governance/gatekeeper.ts)
    │
    ▼
Session Export (hiveops_export tool)
    │
    ▼
State Persistence (persistence/storage.ts)
```

### 9.2 Cross-Module Communication

```typescript
// All cross-module communication via well-defined interfaces
interface ModuleInterface {
  // No direct imports between top-level modules
  // Use dependency injection or event bus
  
  // Core → Governance: via event bus
  eventBus.emit('session:created', { sessionId })
  
  // Governance → Core: via hooks
  hooks.on('session:created', (event) => { ... })
  
  // Delegation → Context: via shared state
  sharedState.update('context:prune', { ... })
}
```

---

## 10. State Hygiene Rules

### 10.1 Artifact Lifecycle

```
Creation → Active Use → Expiration → Archival → Deletion
   │           │            │           │          │
   │           │            │           │          └─ After 30 days
   │           │            │           └─ Move to .hivemind/archive/
   │           │            └─ Mark stale after session close
   │           └─ Linked to active session
   └─ Created with TTL metadata
```

### 10.2 Cleanup Hooks (NEW)

```typescript
// Automatic cleanup on session close
"session.status": async (input) => {
  if (input.status === "done") {
    await cleanupRuntimeArtifacts(input.sessionID)
    await rotateBackups()
    await expireStaleState()
  }
}

// Rotation policy
const ROTATION_POLICY = {
  backups: { max: 3, maxAge: '7d' },
  sessions: { max: 10, maxAge: '30d' },
  logs: { max: 5, maxAge: '14d' },
  graph: { max: 0, maxAge: '0d' }, // Never keep graph artifacts
}
```

### 10.3 Emission Control

```typescript
// Before any module emits artifacts:
function emitArtifact(path: string, content: any): boolean {
  // Check if artifact already exists and is current
  if (isArtifactCurrent(path)) {
    return false // Skip emission
  }
  
  // Validate artifact has value
  if (!hasArtifactValue(content)) {
    return false // Skip empty/meaningless artifacts
  }
  
  // Apply rotation if needed
  applyRotationPolicy(path)
  
  // Emit with metadata
  writeArtifact(path, {
    content,
    created: Date.now(),
    ttl: getTTL(path),
    source: getCallerModule(),
  })
  
  return true
}
```

---

## 11. Implementation Phases

### Phase 1: Foundation (Week 1)
1. Create new directory structure skeleton
2. Move and split `doc-intel.ts` into `intelligence/doc/`
3. Move and split `hierarchy-tree.ts` into `core/hierarchy/`
4. Move and split `state-mutation-queue.ts` into `core/state/`
5. Archive `hiveops-*.ts` to `legacy/tools/`
6. Create barrel exports for all directories

### Phase 2: Context Integrity (Week 2)
1. Implement `context/` module from DCP patterns
2. Add pruning strategies (dedup, supersede, purge)
3. Implement nudge system
4. Add protected content registry
5. Implement compression block architecture

### Phase 3: Delegation Engine (Week 3)
1. Implement `delegation/` module from subtask2 + background-agents
2. Add named results system
3. Implement orchestrator-decides loops
4. Add background delegation
5. Implement concurrency control (mutex, timeout)

### Phase 4: Plugin Integration (Week 4)
1. Implement `plugins/` with hook factory pattern
2. Add session hooks (created, compacting, idle)
3. Add tool guard hooks (execute.before, execute.after)
4. Add transform hooks (messages, system)
5. Add continuation hooks

### Phase 5: Hardening (Week 5+)
1. Add CI enforcement for LOC limits
2. Implement artifact lifecycle management
3. Add emission control
4. Implement cleanup hooks
5. Add rotation policies

---

## 12. Key Synthesis Insights

### From DCP (Context Pruning)
- **Nested compression blocks** preserve information hierarchy
- **Nudge system** for context awareness without forced compression
- **Protected content patterns** with glob matching
- **State persistence** with Maps→Records conversion

### From subtask2 (Delegation)
- **Named results** (`$RESULT[name]`) for cross-task communication
- **Orchestrator-decides loops** more reliable than self-evaluation
- **Stacked returns** for nested delegation chains
- **Hook-driven state machine** for clear lifecycle

### From background-agents (Async Delegation)
- **Fire-and-forget with persistent storage** pattern
- **Readable IDs** for human-memorable delegation references
- **Batched notifications** to avoid spamming parent
- **Mutex for concurrency** control
- **Timeout wrapper** for all async operations

### From oh-my-openagent (Architecture)
- **Hook factory pattern** organized by lifecycle
- **Feature modularization** with clear boundaries
- **Tool packaging** in individual directories
- **Agent hierarchy** with category-based routing
- **Dynamic agent prompt building**
- **Multi-source skill loading**
- **CLI with Commander.js** structure

### From opencode-pty (Shell)
- **PTY-based terminal** for interactive command support
- **Buffer management** for output capture
- **Permission checking** before PTY operations
- **Web-based terminal** renderer for remote access

### From opencode-workspace (Orchestration)
- **Worktree-based isolation** for parallel work
- **Agent specialization** (coder, researcher, reviewer, scribe)
- **Skill-based planning** protocol
- **Notification system** for task completion

---

## 13. Anti-Patterns to Avoid

| Anti-Pattern | Current Issue | Solution |
|--------------|---------------|----------|
| **GOD files** | 30+ files >350 LOC | Split into focused modules ≤300 LOC |
| **Circular dependencies** | session ↔ governance | Use event bus for cross-module communication |
| **Side effects at import** | graph-io auto-spawns | Move side effects to explicit functions |
| **Scattered state** | state/, graph/, sessions/, states/ | Consolidate into single state module |
| **No cleanup** | Backups accumulate, sessions never expire | Implement lifecycle management |
| **Implicit contracts** | Tools depend on internal state | Define explicit interfaces |
| **Deep imports** | `import { x } from '../core/session/kernel'` | Use barrel exports |
| **Manifest bloat** | Empty manifests everywhere | Only create manifests when needed |

---

*This skeleton addresses the root cause: HiveMind needs an ecosystem-level architecture, not piecemeal fixes. The current scattered `.ts` files and unregulated dist emissions must be replaced with a disciplined module system, clear boundaries, and proper context engineering.*
